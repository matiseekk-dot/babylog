import React, { useState, useEffect } from 'react'
import { t, useLocale, getLocale, isPL } from '../i18n'
import { getPlans } from '../data/premiumPlans'
import { trackPaywallViewed, trackPaywallCTAClicked } from '../utils/analytics'

/**
 * NOWA OFERTA PREMIUM (2026-04-21 v2 + 2026-04-26 v2.9.2):
 *
 * UWAGA — sync między urządzeniami i backup Firestore są AUTOMATYCZNE dla
 * każdego zalogowanego usera. To NIE są Premium features. Nie można ich
 * tutaj sprzedawać (false advertising).
 *
 * Bezpieczeństwo ZAWSZE za darmo (v2.9.2):
 *   - Critical alerts (gorączka <3m, ≥40.5°C, kryzys odwodnienia) — pełna
 *     informacja, nie ukryte za paywallem
 *   - Reminder leków: "minął odstęp od ostatniej dawki" (NIE jest to
 *     kalkulator — apka NIE wylicza dawek od v2.7.1)
 *   - Podstawowe tracking (karmienie, sen, pieluchy, temp, kaszel)
 *   - CSV export (RODO — prawo do danych)
 *   - Cross-device sync (automatyczne dla zalogowanych)
 *
 * Premium = decision support i wartość dodana:
 *   - Pełen status: warning/alert messages, trendy, sectionMessages
 *   - Wykresy wzrostu z percentylami WHO
 *   - Share z partnerem (współdzielone konto — inny UID, inny flow)
 *   - Unlimited dzieci
 *   - PDF raport dla pediatry (formatowanie, nie sam eksport)
 *   - Notatki z wizyt + pytania do pediatry
 */
// v2.11.32 — Sprint B P1-2: paywall cleanup zgodnie z audit:
//   1. Usunięto "Share with partner" — `comingSoon: true` = misleading claim
//      per Google Play Developer Program Policies §3.4 (features must be
//      functional at point of purchase). Dodaję z powrotem gdy implementacja
//      będzie gotowa.
//   2. Usunięto "Priorytetowe wsparcie 24h" — nieskalowalne (1 founder ≠ 100+
//      userów), plus to obietnica usługi medycznej która koliduje z disclaimerem
//      "apka NIE jest wyrobem medycznym". Self-contradiction.
//   3. Poprawiono "Analityka i normy" — WHO publikuje normy tylko dla growth
//      (waga/wzrost/BMI/obwód głowy). Nie publikuje norm dla ząbkowania, kaszlu,
//      milestone'ów. Te są w PTP/AAP referencyjnych tabelach. Tekst poprawiony
//      żeby nie wprowadzał w błąd.
// v2.12.0: feature list per locale.
//   PL → polskie texty
//   inne (EN/DE/FR/ES) → English (safe międzynarodowy fallback)
// TODO: pełny per-language paywall przez i18n keys (Phase 4).
function getFeatures() {
  if (!isPL()) {
    return [
      { icon:'📄', title:'PDF report for pediatrician', desc:'Formatted summary of temperatures, doses, feedings, sleep — for any date range. Take it to your visit.' },
      { icon:'📊', title:'Growth charts with WHO percentiles', desc:'See where your child ranks compared to WHO norms (weight, height, head circumference).' },
      { icon:'📈', title:'Trend analytics',             desc:'Charts and pattern detection for temperature, sleep duration, feeding frequency over weeks/months.' },
      { icon:'🩺', title:'Doctor notes & questions',    desc:'Visit history, prescriptions, questions to ask next time. Never forget what the doctor said.' },
      { icon:'👶', title:'Unlimited children',          desc:'Twins, siblings — one subscription, no limits.' },
      { icon:'🔔', title:'Smart medication reminders',  desc:'Notifications when interval between doses has passed (per package leaflet).' },
    ]
  }
  return [
    { icon:'📄', title:'Raport PDF dla pediatry',       desc:'Sformatowane podsumowanie: temperatury, dawki, karmienia, sen — za dowolny okres. Zabierz do gabinetu.' },
    { icon:'📊', title:'Wykresy wzrostu z percentylami WHO', desc:'Zobacz w którym percentylu jest twoje dziecko wg norm WHO (waga, wzrost, obwód głowy).' },
    { icon:'📈', title:'Analityka trendów',             desc:'Wykresy i wzorce dla temperatury, snu, karmienia w skali tygodni i miesięcy.' },
    { icon:'🩺', title:'Notatki i pytania do pediatry', desc:'Historia wizyt, recepty, pytania do zadania na następnej wizycie. Nie zapomnisz co lekarz powiedział.' },
    { icon:'👶', title:'Nielimitowane dzieci',          desc:'Bliźnięta, rodzeństwo — jedna subskrypcja, bez limitów.' },
    { icon:'🔔', title:'Inteligentne przypomnienia o lekach', desc:'Powiadomienia gdy minął odstęp między dawkami (zgodnie z ulotką).' },
  ]
}

// v2.9.2: getPlans() usunięte — single source of truth w src/data/premiumPlans.js.
// Ten sam moduł importuje useRevenueCat. Eliminuje rozjazd cen.

export default function PaywallScreen({ onActivate, onClose, checking, trigger = 'unknown' }) {
  useLocale()
  const FEATURES = getFeatures()
  // v2.11.33: getPlans używa pełnego locale code (pl/en/de zamiast bool).
  // Re-render przy zmianie języka przez useLocale() powyżej.
  const PLANS = getPlans(getLocale())
  const [selected, setSelected] = useState('yearly')

  // v2.11.32 P1-6: track paywall view raz przy mount. `trigger` przekazany
  // przez parent (App.jsx) wskazuje skąd user przyszedł:
  //   'topbar' (klik trial badge), 'premium_feature' (lock w tabie),
  //   'profile_limit' (próba dodania 2-go dziecka jako free), etc.
  // Pomaga zrozumieć który trigger conwertuje najlepiej.
  useEffect(() => {
    trackPaywallViewed(trigger)
  }, [trigger])

  // Aktualnie wybrany plan — używany do dynamicznego CTA z ceną
  const selectedPlan = PLANS.find(p => p.id === selected) || PLANS[0]
  const ctaLabel = checking
    ? t('paywall.cta.loading')
    : t('paywall.cta.try', {
        price: selectedPlan.price,
        period: selectedPlan.period,
      })

  const freeBanner = t('paywall.free_banner')

  return (
    // v2.11.11: kompletny rewrite layoutu paywall — flex column z osobnym
    // scroll-area + bottom footer (NIE fixed, normalny flow). Wcześniej fixed
    // footer pokrywał plany przy max scroll (Roczny widać w połowie, Dożywotni
    // niewidoczny). Nowy layout: outer flex column zajmuje 100dvh, scroll-area
    // ma flex:1 + overflow-y:auto, footer ma flex:0 0 auto. Czysta separacja
    // bez paddingBottom hack.
    <div style={{
      display:'flex',
      flexDirection:'column',
      height:'100dvh',
      maxHeight:'100dvh',
      background:'var(--surface)',
      position:'relative',
    }}>
      {/* X close — absolute w prawym górnym rogu */}
      <button aria-label={t('common.close')} onClick={onClose} style={{
        position:'absolute',top:'var(--space)',right:'var(--space)',background:'rgba(0,0,0,0.25)',
        border:'none',borderRadius:'var(--radius-round)',width:36,height:36,fontSize:16,
        cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        color:'var(--surface)',zIndex:10,
      }}>✕</button>

      {/* SCROLL AREA — wszystko od headera do plan picker */}
      <div style={{
        flex:1,
        overflowY:'auto',
        WebkitOverflowScrolling:'touch',
      }}>

      {/* HEADER */}
      <div style={{
        background:'linear-gradient(160deg, var(--brand-600) 0%, var(--brand-500) 60%, #5DCAA5 100%)',
        padding:'var(--space-spacious) var(--space-comfortable) var(--space-comfortable)',
        textAlign:'center',
      }}>
        <div style={{fontSize:44,marginBottom:'var(--space-snug)'}}>🍼</div>
        <div style={{fontSize:22,fontWeight:800,color:'var(--surface)',letterSpacing:-0.5,lineHeight:1.2}}>
          {t('paywall.title')}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:'var(--space-snug)',lineHeight:1.5}}>
          {t('paywall.subtitle')}
        </div>
      </div>

      {/* FREE banner */}
      <div style={{
        margin:'var(--space) var(--space) 0',
        padding:'var(--space-snug) var(--space)',
        background:'var(--brand-50)',
        border:'0.5px solid var(--brand-100)',
        borderRadius:'var(--radius-tight)',
        fontSize:12,
        color:'var(--brand-700)',
        lineHeight:1.5,
        display:'flex',
        alignItems:'flex-start',
        gap:'var(--space-snug)',
      }}>
        <span style={{fontSize:16,flexShrink:0,marginTop:-2}}>✅</span>
        <span>{freeBanner}</span>
      </div>

      {/* CO DOSTAJESZ W PREMIUM — nagłówek */}
      <div style={{
        padding:'var(--space) var(--space) var(--space-tight)',
        fontSize:11, fontWeight:700, color:'var(--text-2)',
        textTransform:'uppercase', letterSpacing:0.5,
      }}>
        {t('paywall.premium_header')}
      </div>

      {/* FEATURES */}
      <div style={{padding:'0 var(--space)'}}>
        {FEATURES.map((f,i) => (
          <div key={i} style={{
            display:'flex',alignItems:'flex-start',gap:'var(--space-snug)',padding:'var(--space-snug) 0',
            borderBottom:i<FEATURES.length-1?'0.5px solid rgba(0,0,0,0.06)':'none',
          }}>
            <div style={{
              width:40,height:40,borderRadius:'var(--radius-tight)',background:'var(--brand-50)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0,
            }}>
              {f.icon}
            </div>
            <div style={{flex:1}}>
              <div style={{
                fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:3,
                display:'flex',alignItems:'center',gap:'var(--space-tight)',flexWrap:'wrap',
              }}>
                {f.title}
                {f.comingSoon && (
                  <span style={{
                    fontSize:9,fontWeight:700,
                    background:'var(--warning-50)',color:'var(--warning-700)',
                    borderRadius:'var(--radius-round)',padding:'1px 7px',
                    textTransform:'uppercase',letterSpacing:0.3,
                    whiteSpace:'nowrap',
                  }}>
                    {t('paywall.coming_soon')}
                  </span>
                )}
              </div>
              <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.45}}>{f.desc}</div>
            </div>
            <div style={{
              color:f.comingSoon?'var(--text-3)':'var(--brand-500)',
              fontSize:16,marginTop:'var(--space-snug)',flexShrink:0,fontWeight:700,
            }}>
              {f.comingSoon ? '⏳' : '✓'}
            </div>
          </div>
        ))}
      </div>

      {/* PLANS */}
      <div style={{
        padding:'var(--space-comfortable) var(--space) var(--space-snug)',
        display:'flex',flexDirection:'column',gap:'var(--space-snug)',
      }}>
        <div style={{
          fontSize:11, fontWeight:700, color:'var(--text-2)',
          textTransform:'uppercase', letterSpacing:0.5, marginBottom:'var(--space-tight)',
        }}>
          {t('paywall.choose_plan')}
        </div>
        {PLANS.map(plan => (
          <div key={plan.id} onClick={() => setSelected(plan.id)} style={{
            padding:'var(--space)',cursor:'pointer',borderRadius:'var(--radius)',position:'relative',
            border:selected===plan.id?'2px solid var(--brand-500)':'0.5px solid rgba(0,0,0,0.12)',
            background:selected===plan.id?'var(--brand-50)':'var(--surface)',
            display:'flex',alignItems:'center',gap:'var(--space-snug)',
          }}>
            <div style={{
              width:20,height:20,borderRadius:'var(--radius-round)',flexShrink:0,background:'var(--surface)',
              border:selected===plan.id?'6px solid var(--brand-500)':'1.5px solid var(--border-med)',
            }}/>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{plan.label}</div>
              {plan.badge && <div style={{fontSize:11,color:'var(--brand-600)',fontWeight:600,marginTop:'var(--space-tight)'}}>{plan.badge}</div>}
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:17,fontWeight:800,color:'var(--text)'}}>{plan.price}</div>
              <div style={{fontSize:11,color:'var(--text-3)'}}>{plan.period}</div>
            </div>
            {plan.popular && (
              <div style={{
                position:'absolute',top:-10,right:'var(--space)',
                background:'var(--brand-500)',color:'var(--surface)',
                fontSize:10,fontWeight:700,borderRadius:'var(--radius-round)',padding:'2px 10px',
              }}>{t('paywall.badge.popular')}</div>
            )}
          </div>
        ))}
      </div>

      {/* TESTIMONIALS — usunięte v2.9.1.
          Powód: cytaty były wymyślone (Ania K., Martyna P., Kuba D. — fikcyjni
          rodzice), wszyscy z 5/5 gwiazdkami. UOKiK risk (ustawa o przeciwdziałaniu
          nieuczciwym praktykom rynkowym, art. 5–7) oraz Google Play "Misleading
          Claims". Bez pisemnej zgody prawdziwych testerów na publikację cytatu
          nie da się tego naprawić. Apka świeżo na rynku — brak social proof
          to standard dla startupu, nie należy go fake'ować. */}

      </div>
      {/* /SCROLL AREA */}

      {/* FOOTER — naturalny flow w flex column, na dole bo last child.
          Już nie position:fixed → nie pokrywa plan picker. */}
      <div style={{
        flex:'0 0 auto',
        padding:'var(--space) var(--space)',
        paddingBottom:'max(var(--space), env(safe-area-inset-bottom))',
        background:'var(--surface)',
        borderTop:'0.5px solid var(--border)',
        boxShadow:'0 -2px 10px rgba(0,0,0,0.04)',
      }}>
        <button onClick={() => {
          // v2.11.32 P1-6: track CTA click przed wywołaniem activate.
          // Mierzymy plan + trigger source.
          trackPaywallCTAClicked(selected, trigger)
          onActivate(selected)
        }} disabled={checking} style={{
          width:'100%',padding:'var(--space)',minHeight:54,letterSpacing:-0.2,
          background:checking?'var(--text-3)':'linear-gradient(135deg, var(--brand-600), var(--brand-500))',
          color:'var(--surface)',border:'none',borderRadius:'var(--radius-comfortable)',
          fontSize:17,fontWeight:800,
          cursor:checking?'default':'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',gap:10,
        }}>
          {/* v2.11.12: spinner SVG kiedy checking — wcześniej tylko tekst się
              zmieniał, user nie widział że coś się dzieje na ~2-5s czekanie
              na natywny Google Play sheet. */}
          {checking && (
            <svg width="18" height="18" viewBox="0 0 24 24" style={{animation: 'spin 0.8s linear infinite'}}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeOpacity="0.3"/>
              <path d="M12 2 a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
            </svg>
          )}
          {ctaLabel}
        </button>
        <div style={{textAlign:'center',fontSize:11,color:'var(--text-3)',marginTop:'var(--space-snug)',lineHeight:1.4}}>
          {t('paywall.footer')}
        </div>
      </div>
    </div>
  )
}
