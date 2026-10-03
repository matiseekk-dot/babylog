import React, { useState, useEffect, useRef } from 'react'
import { t, useLocale, getLocale } from '../i18n'
import { trackOnboardingBlocked, trackOnboardingCompleted, trackOnboardingViewed, trackPregnancyStarted } from '../utils/analytics'
import PartnerJoinForm from './PartnerJoinForm'
import Modal from './Modal'
import { ConsentDetails } from './MedicalConsentScreen'
import { todayDate } from '../utils/helpers'
import { isValidDueDate, isValidLmp, dueDateFromLmp, addDays, termDaysForLocale } from '../utils/pregnancy'
import { formatLongDate } from './PregnancyScreen'

// Gość klika "Zaloguj się" w trybie kodu → po powrocie z logowania ekran
// ma od razu otworzyć się na polu kodu, a nie na tworzeniu profilu.
// Czytane w inicjalizatorze, czyszczone dopiero w efekcie po montażu —
// inicjalizator może się wykonać dwa razy (StrictMode), a wtedy drugie
// wywołanie nie widziałoby już flagi.
const JOIN_INTENT_KEY = 'babylog_onb_join'

function hasJoinIntent() {
  try { return sessionStorage.getItem(JOIN_INTENT_KEY) === '1' } catch { return false }
}

/**
 * OnboardingScreen
 *
 * v2.9.2 (kwiecień 2026):
 *   - Single step: imię + DOB + avatar + płeć (wszystko required)
 *   - Wagi NIE pytamy w onboardingu — feature-gated później (np. siatki WHO
 *     promptują "Dodaj pierwszy pomiar wagi" przy braku wpisów)
 *   - 3 slidy edukacyjne PRZESUNIĘTE z onboardingu na dashboard jako
 *     OnboardingTipsBanner (dismissable, jednorazowy)
 *
 * v2.9.0:
 *   - Połączenie z MedicalDisclaimerScreen → jeden ekran consent
 *   - Step 2 (waga) opcjonalny [→ usunięty całkowicie w 2.9.2]
 *   - Data urodzenia (input type="date") zamiast lat+miesięcy
 *
 * v2.16.0: "Mam kod od partnera" — zaproszony rodzic dołącza do wspólnego
 *   konta od razu, bez tworzenia profilu dziecka, którego i tak by nie używał.
 *   Po dołączeniu App przełącza dane na konto właściciela (onboarding_done
 *   właściciela = true), więc ten ekran sam znika.
 *
 * Props:
 *   onComplete(profileData) — wywoływane z {
 *     name, months, weight (zawsze null po 2.9.2), avatar, sex, toiletMode
 *   }
 *   canJoinPartner    — zalogowany przez Google (wspólne konto tego wymaga)
 *   onLoginForPartner — fn(): gość chce dołączyć → logowanie Google
 *   onShowLogin       — gość chce się zalogować (link „Masz już konto?”)
 *   afterEnd          — po zakończeniu trybu ciąży: najpierw spokojna plansza,
 *                       formularz dopiero po kliknięciu "Dodaj profil"
 *
 * v2.17.0: przełącznik "Dziecko już jest" / "Spodziewamy się". W ciąży pytamy
 *   tylko o termin porodu (albo ostatnią miesiączkę) i opcjonalne imię;
 *   onComplete dostaje { mode: 'pregnancy', name, dueDate, avatar: '🤰', ... }.
 */
export default function OnboardingScreen({ onComplete, canJoinPartner, onLoginForPartner, onShowLogin = null, afterEnd = false }) {
  useLocale()

  const [mode, setMode] = useState(() => (hasJoinIntent() ? 'join' : 'profile'))
  const [introDone, setIntroDone] = useState(!afterEnd)
  const [kind, setKind] = useState('baby')       // 'baby' | 'pregnancy'
  const [dueMode, setDueMode] = useState('due')  // 'due' | 'lmp'
  const [due, setDue] = useState('')
  const [lmp, setLmp] = useState('')
  const pregRef = useRef(null)
  const [joined, setJoined] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => { trackOnboardingViewed() }, [])

  // Zamiar "dołącz kodem" dotyczy tylko powrotu z logowania. Czyścimy dopiero
  // gdy użytkownik jest zalogowany — gość, który anulował logowanie, po
  // powrocie nadal trafia na pole kodu.
  useEffect(() => {
    if (!canJoinPartner) return
    try { sessionStorage.removeItem(JOIN_INTENT_KEY) } catch {}
  }, [canJoinPartner])

  const loginForPartner = () => {
    try { sessionStorage.setItem(JOIN_INTENT_KEY, '1') } catch {}
    onLoginForPartner()
  }

  const [name, setName] = useState('')
  const [dob, setDob] = useState('')   // YYYY-MM-DD
  // v2.17.0: obrazek dziecka wybiera się później w Ustawieniach (krótszy start).
  const avatar = '👶'
  const [sex, setSex] = useState('M')
  // v2.16.23: po kliknięciu "Zaczynamy" przy niepełnym formularzu pokazujemy,
  // czego brakuje (wcześniej szary przycisk nic nie mówił, a data urodzenia
  // na telefonie chowała się pod nim; w Analytics 6 z 10 osób odpadało tutaj).
  const [tried, setTried] = useState(false)
  const nameRef = useRef(null)
  const dobRef = useRef(null)

  const todayStr = todayDate()

  // ── Walidacje ─────────────────────────────────────────────────────────────
  const nameValid = name.trim().length > 0
  const dobValid = (() => {
    if (!dob) return false
    const d = new Date(dob)
    if (isNaN(d.getTime())) return false
    const now = new Date()
    if (d > now) return false
    const eighteenYearsAgo = new Date(now)
    eighteenYearsAgo.setFullYear(now.getFullYear() - 18)
    if (d < eighteenYearsAgo) return false
    return true
  })()
  const pregDate = dueMode === 'due' ? due : lmp
  const termDays = termDaysForLocale(getLocale())
  const pregValid = dueMode === 'due' ? isValidDueDate(due, new Date(), termDays) : isValidLmp(lmp)
  const pregDue = dueMode === 'due' ? due : (pregValid ? dueDateFromLmp(lmp, termDays) : '')
  const canSubmit = kind === 'pregnancy' ? pregValid : nameValid && dobValid

  // ── Konwersja DOB → months ────────────────────────────────────────────────
  function dobToMonths(dobStr) {
    const d = new Date(dobStr)
    const now = new Date()
    let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
    if (now.getDate() < d.getDate()) months--
    return Math.max(0, months)
  }

  const finishPregnancy = () => {
    if (!pregValid) {
      setTried(true)
      trackOnboardingBlocked(!pregDate ? dueMode : `${dueMode}_invalid`)
      pregRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
    trackOnboardingCompleted({ mode: 'pregnancy' })
    trackPregnancyStarted('onboarding')
    try { localStorage.setItem('babylog_disclaimer_ack', new Date().toISOString()) } catch {}
    onComplete({
      mode: 'pregnancy',
      name: name.trim() || t('preg.default_name'),
      dueDate: pregDue,
      termDays,
      lmp: dueMode === 'lmp' ? lmp : null,
      months: 0,
      weight: null,
      avatar: '🤰',
      sex: null,
      toiletMode: 'diapers',
    })
  }

  const finish = () => {
    if (kind === 'pregnancy') { finishPregnancy(); return }
    if (!canSubmit) {
      setTried(true)
      trackOnboardingBlocked(
        !nameValid && !dob ? 'both' : !nameValid ? 'name' : !dob ? 'dob' : 'dob_invalid'
      )
      const field = !nameValid ? nameRef.current : dobRef.current
      field?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      // Imię: od razu klawiatura. Data: sam fokus, kalendarz otwiera dotknięcie.
      if (!nameValid) field?.focus({ preventScroll: true })
      return
    }
    const months = dobToMonths(dob)
    // v2.11.32 P1-6: funnel event — onboarding complete.
    // Mierzymy ageMonths + sex (no PII — imię nie idzie do analytics).
    trackOnboardingCompleted({ ageMonths: months, sex })
    // v2.16.8: kliknięcie przycisku pod linijką onb.disclaimer = potwierdzenie
    // zastrzeżenia medycznego; zapisujemy kiedy (pełna zgoda przy Zdrowiu).
    try { localStorage.setItem('babylog_disclaimer_ack', new Date().toISOString()) } catch {}
    onComplete({
      name: name.trim(),
      months,
      // v2.16.17: data urodzenia zostaje w profilu, wiek liczy się z niej na bieżąco.
      birthDate: dob,
      weight: null,  // v2.9.2: waga feature-gated później
      avatar,
      sex,
      toiletMode: months < 18 ? 'diapers' : months < 42 ? 'potty' : 'toilet',
    })
  }

  const hint = { fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 'var(--space)' }
  const smallLink = {
    background: 'none', border: 'none', padding: '8px 0', minHeight: 0, cursor: 'pointer',
    color: 'var(--brand-600)', fontSize: 13, fontWeight: 600, textAlign: 'left',
  }

  const joinPanel = (
    <div>
      {joined ? (
        <div style={{ ...hint, textAlign: 'center', padding: 'var(--space-comfortable) 0' }}>
          ⏳ {t('onb.partner.loading')}
        </div>
      ) : canJoinPartner ? (
        <>
          <div style={hint}>{t('onb.partner.desc')}</div>
          <PartnerJoinForm source="onboarding" onJoined={() => setJoined(true)} />
        </>
      ) : (
        <>
          <div style={hint}>{t('onb.partner.login_desc')}</div>
          <button type="button" onClick={loginForPartner} style={{
            width: '100%', padding: 'var(--space)', minHeight: 48,
            background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 'var(--radius)',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>
            {t('onb.partner.login')}
          </button>
        </>
      )}
      {!joined && (
        <button type="button" onClick={() => setMode('profile')} style={{
          display: 'block', margin: 'var(--space-comfortable) auto 0',
          background: 'none', border: 'none', color: 'var(--text-2)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 'var(--space-snug)',
        }}>
          {t('onb.partner.back')}
        </button>
      )}
    </div>
  )

  // v2.17.0: po zakończeniu trybu ciąży nie witamy od razu formularzem "Poznajmy
  // Twoje dziecko". Spokojna plansza, formularz dopiero na życzenie.
  if (!introDone) {
    return (
      <div style={{
        position:'fixed', inset:0, overflowY:'auto', background:'var(--bg)',
        display:'flex', flexDirection:'column', justifyContent:'center', padding:'var(--space-comfortable)',
      }}>
        <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{t('preg_end.after_title')}</div>
          <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.55, marginBottom: 24 }}>{t('preg_end.after_body')}</div>
          <button type="button" onClick={() => setIntroDone(true)} style={{
            minHeight: 48, padding: '0 24px', borderRadius: 'var(--radius)', cursor: 'pointer',
            background: 'var(--surface)', border: '0.5px solid var(--border-med)', color: 'var(--text)',
            fontSize: 15, fontWeight: 700,
          }}>
            {t('preg_end.after_cta')}
          </button>
        </div>
      </div>
    )
  }

  const kindBtn = (value, label) => (
    <button type="button" role="radio" aria-checked={kind === value}
      onClick={() => { setKind(value); setTried(false) }}
      style={{
        flex: 1, minHeight: 40, padding: '6px 8px', border: 'none', borderRadius: 10, cursor: 'pointer',
        fontSize: 14, fontWeight: 700,
        background: kind === value ? 'var(--surface)' : 'transparent',
        color: kind === value ? 'var(--brand-700)' : 'rgba(255,255,255,0.95)',
      }}>
      {label}
    </button>
  )

  const pregnancyFields = (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor="onb-preg-name">{t('onb.preg.name')}</label>
        <input id="onb-preg-name" className="form-input" type="text" maxLength={40}
          placeholder={t('onb.preg.name_ph')} value={name} onChange={e => setName(e.target.value)}
          style={{ fontSize: 16 }} />
      </div>
      <div className="form-group" ref={pregRef}>
        {dueMode === 'due' ? (
          <>
            <label className="form-label" htmlFor="onb-due">{t('onb.preg.due')} *</label>
            <input id="onb-due" className="form-input" type="date" value={due}
              min={addDays(todayStr, -28)} max={addDays(todayStr, termDays)}
              onChange={e => setDue(e.target.value)} aria-invalid={(tried || !!due) && !pregValid}
              style={{ fontSize: 16, borderColor: ((tried || due) && !pregValid) ? 'var(--alert-500)' : undefined }} />
          </>
        ) : (
          <>
            <label className="form-label" htmlFor="onb-lmp">{t('onb.preg.lmp')} *</label>
            <input id="onb-lmp" className="form-input" type="date" value={lmp}
              min={addDays(todayStr, -44 * 7)} max={todayStr}
              onChange={e => setLmp(e.target.value)} aria-invalid={(tried || !!lmp) && !pregValid}
              style={{ fontSize: 16, borderColor: ((tried || lmp) && !pregValid) ? 'var(--alert-500)' : undefined }} />
          </>
        )}
        {(tried || pregDate) && !pregValid && (
          <div role="alert" style={{ fontSize: 12, color: 'var(--alert-500)', marginTop: 'var(--space-tight)', fontWeight: 500 }}>
            ⚠️ {t(!pregDate ? `onb.preg.${dueMode}_missing` : `onb.preg.${dueMode}_invalid`)}
          </div>
        )}
        {dueMode === 'lmp' && pregValid && (
          <div style={{ fontSize: 13, color: 'var(--brand-700)', marginTop: 'var(--space-tight)', fontWeight: 700 }}>
            {t('onb.preg.due_result', { date: formatLongDate(pregDue) })}
          </div>
        )}
        <button type="button" onClick={() => { setDueMode(m => (m === 'due' ? 'lmp' : 'due')); setTried(false) }}
          style={{
            background: 'none', border: 'none', padding: '8px 0', minHeight: 0, cursor: 'pointer',
            color: 'var(--brand-600)', fontSize: 13, fontWeight: 600, textAlign: 'left',
          }}>
          {t(dueMode === 'due' ? 'onb.preg.use_lmp' : 'onb.preg.use_due')}
        </button>
      </div>
    </>
  )

  return (
    // v2.11.29: outer-scroll architecture (jak consent v2.11.26).
    //
    // Wcześniej: outer flex column z height:100%, inner content z flex:1
    // + overflowY:auto. Na Android Chrome WebView TWA inner overflow:auto
    // łapał touch i nie propagował do parent — scroll w ogóle nie działał.
    // User mógł "zaginąć" w avatarach lub date input bez możliwości
    // dotarcia do button "Zaczynamy" na dole.
    //
    // Fix identyczny jak consent: outer JEST scroller'em, content jako
    // flow, button bottom jako sticky footer (zawsze widoczny).
    <div style={{
      position:'fixed', inset:0,
      overflowY:'auto',
      WebkitOverflowScrolling:'touch',
      background:'var(--surface)', userSelect:'none',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, var(--brand-600), var(--brand-500))',
        padding:'var(--space-spacious) var(--space-comfortable) var(--space-comfortable)',
        textAlign:'center',
        paddingTop: 'max(var(--space-spacious), calc(env(safe-area-inset-top) + var(--space-comfortable)))',
      }}>
        <div style={{fontSize:40,marginBottom:'var(--space-tight)'}}>
          {mode === 'join' ? '👨‍👩‍👧' : kind === 'pregnancy' ? '🤰' : avatar}
        </div>
        <div style={{fontSize:22,fontWeight:800,color:'var(--surface)',letterSpacing:-0.5,lineHeight:1.2}}>
          {t(mode === 'join' ? 'onb.partner.title' : kind === 'pregnancy' ? 'onb.preg.title' : 'onb.setup.title')}
        </div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.85)',marginTop:'var(--space-snug)',lineHeight:1.4}}>
          {t(mode === 'join' ? 'onb.partner.subtitle' : kind === 'pregnancy' ? 'onb.preg.subtitle' : 'onb.setup.subtitle')}
        </div>
        {/* v2.17.0: dziecko już jest czy dopiero w drodze */}
        {mode !== 'join' && (
          <div role="radiogroup" style={{
            display:'flex', gap:4, padding:4, marginTop:'var(--space)',
            background:'rgba(255,255,255,0.18)', borderRadius:12,
          }}>
            {kindBtn('baby', t('onb.mode.baby'))}
            {kindBtn('pregnancy', `🤰 ${t('onb.mode.pregnancy')}`)}
          </div>
        )}
      </div>

      {/* Content — zwykły div bez własnego overflow */}
      <div style={{
        padding:'var(--space-comfortable) var(--space-comfortable) 0',
      }}>
        {mode === 'join' ? joinPanel : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--space)' }}>
          {kind === 'pregnancy' ? pregnancyFields : (<>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="onb-name">{t('onb.setup.name')} *</label>
            <input
              id="onb-name"
              ref={nameRef}
              className="form-input"
              type="text" maxLength={40}
              placeholder={t('onb.setup.name_ph')}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              aria-invalid={tried && !nameValid}
              style={{
                fontSize:16,
                borderColor: (tried && !nameValid) ? 'var(--alert-500)' : undefined,
              }}
            />
            {tried && !nameValid && (
              <div role="alert" style={{fontSize:12, color:'var(--alert-500)', marginTop:'var(--space-tight)', fontWeight:500}}>
                ⚠️ {t('onb.setup.name_missing')}
              </div>
            )}
          </div>

          {/* DOB */}
          <div className="form-group">
            <label className="form-label" htmlFor="onb-dob">{t('onb.setup.dob')} *</label>
            <input
              id="onb-dob"
              ref={dobRef}
              className="form-input"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={todayStr}
              aria-invalid={(tried || dob.length > 0) && !dobValid}
              style={{
                fontSize:16,
                borderColor: ((tried || dob.length > 0) && !dobValid) ? 'var(--alert-500)' : undefined,
              }}
            />
            {tried && !dob && (
              <div role="alert" style={{fontSize:12, color:'var(--alert-500)', marginTop:'var(--space-tight)', fontWeight:500}}>
                ⚠️ {t('onb.setup.dob_missing')}
              </div>
            )}
            {dob.length > 0 && !dobValid && (
              <div style={{fontSize:12, color:'var(--alert-500)', marginTop:'var(--space-tight)', fontWeight:500}}>
                ⚠️ {t('onb.setup.dob_error')}
              </div>
            )}
          </div>

          {/* Sex */}
          <div className="form-group">
            <label className="form-label">{t('onb.sex_label')}</label>
            <div style={{display:'flex',gap:'var(--space-snug)',marginTop:'var(--space-tight)'}}>
              <button
                type="button"
                onClick={() => setSex('M')}
                style={{
                  flex:1, padding:'var(--space-snug)', minHeight:48,
                  borderRadius:'var(--radius)',
                  border: sex === 'M' ? '2px solid var(--info-500)' : '0.5px solid var(--border)',
                  background: sex === 'M' ? 'var(--info-50)' : 'var(--surface)',
                  fontSize:14, fontWeight:700,
                  color: sex === 'M' ? 'var(--info-700)' : 'var(--text-2)',
                  cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-tight)',
                }}
              >
                {t('onb.sex_boy')}
              </button>
              <button
                type="button"
                onClick={() => setSex('F')}
                style={{
                  flex:1, padding:'var(--space-snug)', minHeight:48,
                  borderRadius:'var(--radius)',
                  border: sex === 'F' ? '2px solid var(--alert-100)' : '0.5px solid var(--border)',
                  background: sex === 'F' ? 'var(--alert-50)' : 'var(--surface)',
                  fontSize:14, fontWeight:700,
                  color: sex === 'F' ? 'var(--alert-700)' : 'var(--text-2)',
                  cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--space-tight)',
                }}
              >
                {t('onb.sex_girl')}
              </button>
            </div>
            <div style={{fontSize:11,color:'var(--text-3)',marginTop:'var(--space-tight)'}}>
              {t('onb.sex_hint')}
            </div>
          </div>

          </>)}

          {/* v2.17.0: rzadkie ścieżki jako małe linki pod polami, żeby nie
              odciągały od jedynej rzeczy do zrobienia: imię i data. */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:2, marginTop:'calc(-1 * var(--space-snug))' }}>
            <button type="button" onClick={() => setMode('join')} style={smallLink}>
              👨‍👩‍👧 {t('onb.partner.cta')} ›
            </button>
            {onShowLogin && (
              <button type="button" onClick={onShowLogin} style={smallLink}>
                {t('onb.have_account')}
              </button>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Bottom — v2.11.29 sticky footer, button zawsze widoczny */}
      {mode === 'profile' && (
      <div style={{
        position:'sticky', bottom:0,
        padding:'var(--space) var(--space-comfortable)',
        paddingBottom:'max(var(--space-comfortable), env(safe-area-inset-bottom))',
        display:'flex', flexDirection:'column', gap:'var(--space-snug)',
        background: 'var(--surface)',
        borderTop: '0.5px solid rgba(0,0,0,0.06)',
      }}>
        {/* v2.16.23: przycisk zawsze aktywny; przy braku danych finish()
            pokazuje, czego brakuje, i przewija do tego pola. */}
        <button
          type="button"
          onClick={finish}
          style={{
            width:'100%', padding:'var(--space)', minHeight:54,
            background: 'linear-gradient(135deg, var(--brand-600), var(--brand-500))',
            opacity: canSubmit ? 1 : 0.8,
            color:'var(--surface)', border:'none', borderRadius:'var(--radius-comfortable)',
            fontSize:16, fontWeight:800,
            cursor: 'pointer',
            letterSpacing:-0.2,
            transition: 'opacity 0.2s',
          }}
        >
          {kind === 'pregnancy' ? t('onb.preg.cta') : `${t('onb.setup.cta')}, ${name.trim() || '👶'}! 🍼`}
        </button>
        {/* v2.16.8: zastrzeżenie medyczne zamiast blokującego ekranu na starcie.
            Pełny ekran zgody pokazuje się przy pierwszym wejściu w Zdrowie. */}
        <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',margin:'var(--space-tight) 0 0',lineHeight:1.5}}>
          {t('onb.disclaimer')}{' '}
          <button type="button" onClick={() => setShowDisclaimer(true)} style={{
            background:'none', border:'none', padding:0, font:'inherit', minHeight:0,
            color:'var(--brand-600)', textDecoration:'underline', cursor:'pointer',
          }}>
            {t('onb.disclaimer_more')}
          </button>
        </p>
      </div>
      )}

      <Modal open={showDisclaimer} onClose={() => setShowDisclaimer(false)} title={t('consent.title')}>
        <ConsentDetails />
        <button type="button" className="btn-primary" onClick={() => setShowDisclaimer(false)} style={{ width:'100%' }}>
          {t('common.close')}
        </button>
      </Modal>
    </div>
  )
}
