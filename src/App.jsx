import React, { useState, useEffect } from 'react'
import { useStorage } from './hooks/useStorage'
import { useFirestore, migrateAllLocalData, enableOffline } from './hooks/useFirestore'
import { useAuth } from './hooks/useAuth'
import LoginScreen from './components/LoginScreen'
import { useChildStatus } from './hooks/useChildStatus'
import { usePremium } from './hooks/usePremium'
import FeedTab from './components/FeedTab'
import SleepTab from './components/SleepTab'
import DiaperTab from './components/DiaperTab'
import MilestonesTab from './components/MilestonesTab'
import MedsTab from './components/MedsTab'
import GrowthTab from './components/GrowthTab'
import TempTab from './components/TempTab'
import VaccinationsTab from './components/VaccinationsTab'
import DiaryTab from './components/DiaryTab'
import DietTab from './components/DietTab'
import ProfilesScreen from './components/ProfilesScreen'
import ChildStatusBar from './components/ChildStatusBar'
import ChildStatusCard from './components/ChildStatusCard'
import PaywallScreen from './components/PaywallScreen'
import DoctorNotesTab from './components/DoctorNotesTab'
import OnboardingScreen from './components/OnboardingScreen'

const DEFAULT_PROFILE = {
  id: 'default',
  name: 'Moje dziecko',
  months: 4,
  weight: 6.5,
  avatar: '👶',
  avatarColor: '#E1F5EE',
}

const NAV_TABS = [
  { id:'feed', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a4 4 0 0 0 8 0V3"/><path d="M12 6v6"/><ellipse cx="12" cy="18" rx="5" ry="3"/>
    </svg>
  ), label:'Karmienie' },
  { id:'sleep', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ), label:'Sen' },
  { id:'diaper', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8M12 8v8"/>
    </svg>
  ), label:'Pieluchy' },
  { id:'more', icon:(
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  ), label:'Więcej' },
]

const MORE_TABS = [
  { id:'milestones', emoji:'⭐', label:'Kamienie milowe' },
  { id:'growth',     emoji:'📏', label:'Wzrost i waga' },
  { id:'temp',       emoji:'🌡️', label:'Temperatura' },
  { id:'meds',       emoji:'💊', label:'Leki' },
  { id:'vacc',       emoji:'💉', label:'Szczepienia' },
  { id:'diet',       emoji:'🥕', label:'Rozszerzanie diety' },
  { id:'diary',      emoji:'📖', label:'Dziennik' },
  { id:'doctor',     emoji:'🩺', label:'Notatki lekarskie' },
]

// Status prosty dla free userów — bez szczegółów
const FREE_STATUS = {
  status: 'ok',
  title: 'Dane zapisane',
  message: 'Odblokuj Premium, aby zobaczyć analizę i alerty.',
}

export default function App() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const uid = user?.uid ?? null

  // Włącz offline persistence
  useEffect(() => { enableOffline() }, [])

  // Migruj localStorage → Firestore przy pierwszym logowaniu
  useEffect(() => {
    if (uid) migrateAllLocalData(uid).catch(() => {})
  }, [uid])

  const [profiles, setProfiles] = useFirestore(uid, 'profiles', [DEFAULT_PROFILE])
  const [activeId, setActiveId] = useFirestore(uid, 'activeProfile', 'default')
  const [tab, setTab] = useState('feed')
  const [showProfiles, setShowProfiles] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [onboardingDone, setOnboardingDone] = useFirestore(uid, 'onboarding_done', false)

  const active = profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILE

  // ── Freemium ──────────────────────────────────────────────────────────────
  const { isPremium, activate, deactivate } = usePremium(uid)

  const openPaywall = () => setShowPaywall(true)
  const closePaywall = () => setShowPaywall(false)
  const handleActivate = () => {
    // TODO: Tu podpinasz logikę płatności (Stripe, RevenueCat, itp.)
    // Na razie aktywuje od razu — do zamiany na callback po sukcesie transakcji
    activate()
    setShowPaywall(false)
  }

  // ── Decision layer (zawsze liczymy, ale pokazujemy tylko premium) ──────────
  const { globalStatus, topStatus, messages, sectionMessages, refresh } = useChildStatus(
    active.id, active.months, active.weight
  )

  // Dla free — pusty zestaw alertów i uproszczony status
  const visibleStatus    = isPremium ? globalStatus    : FREE_STATUS
  const visibleTopStatus = isPremium ? topStatus       : 'ok'
  const visibleMessages  = isPremium ? messages        : []
  const visibleSection   = (section) => isPremium ? sectionMessages(section) : []

  const navigate = (targetTab) => {
    if (!targetTab) return
    if (MORE_TABS.some(t => t.id === targetTab)) {
      setTab(targetTab); setShowMore(false); setShowProfiles(false)
    } else {
      selectTab(targetTab)
    }
  }

  const addProfile    = (p) => { setProfiles([...profiles, p]); setActiveId(p.id) }
  const updateProfile = (id, data) => setProfiles(profiles.map(p => p.id === id ? { ...p, ...data } : p))
  const deleteProfile = (id) => {
    const next = profiles.filter(p => p.id !== id)
    setProfiles(next.length ? next : [DEFAULT_PROFILE])
    if (activeId === id) setActiveId((next[0] || DEFAULT_PROFILE).id)
  }

  const selectTab     = (id) => { if (id==='more'){setShowMore(true);return}; setTab(id); setShowMore(false); setShowProfiles(false) }
  const selectMoreTab = (id) => { setTab(id); setShowMore(false) }
  const navActive     = (id) => id === 'more' ? MORE_TABS.some(t => t.id === tab) : tab === id

  const sharedProps = {
    uid,
    babyId: active.id,
    ageMonths: active.months,
    weightKg: active.weight,
    onDataChange: refresh,
    isPremium,
    onUpgrade: openPaywall,
  }

  const renderTab = () => {
    switch(tab) {
      case 'feed':       return <FeedTab       {...sharedProps} sectionAlerts={visibleSection('feed')}   onNavigate={navigate} />
      case 'sleep':      return <SleepTab      {...sharedProps} sectionAlerts={visibleSection('sleep')}  onNavigate={navigate} />
      case 'diaper':     return <DiaperTab     {...sharedProps} sectionAlerts={visibleSection('diaper')} onNavigate={navigate} />
      case 'milestones': return <MilestonesTab {...sharedProps} />
      case 'growth':     return <GrowthTab     {...sharedProps} />
      case 'temp':       return <TempTab       {...sharedProps} sectionAlerts={visibleSection('temp')}   onNavigate={navigate} />
      case 'meds':       return <MedsTab       {...sharedProps} sectionAlerts={visibleSection('meds')}   onNavigate={navigate} />
      case 'vacc':       return <VaccinationsTab {...sharedProps} />
      case 'diet':       return <DietTab       {...sharedProps} />
      case 'diary':      return <DiaryTab      {...sharedProps} />
      case 'doctor':     return <DoctorNotesTab {...sharedProps} />
      default:           return <FeedTab       {...sharedProps} sectionAlerts={visibleSection('feed')}   onNavigate={navigate} />
    }
  }

  const currentMoreTab = MORE_TABS.find(t => t.id === tab)

  // ── Auth loading ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="app" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center', color:'var(--text-3)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🍼</div>
          <div style={{ fontSize:14 }}>Ładowanie...</div>
        </div>
      </div>
    )
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="app">
        <LoginScreen onLogin={login} loading={authLoading} />
      </div>
    )
  }

  // ── Onboarding ────────────────────────────────────────────────────────────
  if (!onboardingDone) {
    return (
      <div className="app">
        <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
      </div>
    )
  }

  // ── Paywall overlay ───────────────────────────────────────────────────────
  if (showPaywall) {
    return (
      <div className="app" style={{ position: 'relative', overflowY: 'auto' }}>
        <PaywallScreen onActivate={handleActivate} onClose={closePaywall} />
      </div>
    )
  }

  return (
    <div className="app">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">🍼 BabyLog</div>
          <div className="topbar-sub">
            {showProfiles ? 'Profile dzieci' : showMore ? 'Więcej modułów' : currentMoreTab ? currentMoreTab.label : NAV_TABS.find(t=>t.id===tab)?.label || 'Karmienie'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Premium badge / upgrade button */}
          {isPremium ? (
            <button
              onClick={deactivate}
              title="Kliknij aby dezaktywować (dev)"
              style={{
                background: 'linear-gradient(135deg,#0F6E56,#1D9E75)',
                color: '#fff', border: 'none', borderRadius: 20,
                padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              ★ Premium
            </button>
          ) : (
            <button
              onClick={openPaywall}
              style={{
                background: '#E1F5EE', color: '#0F6E56',
                border: '0.5px solid #9FE1CB', borderRadius: 20,
                padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >
              🔒 Free
            </button>
          )}
          {/* Logout */}
          <button onClick={logout} title="Wyloguj" style={{
            background:'none', border:'none', cursor:'pointer',
            color:'var(--text-3)', fontSize:18, padding:'4px 6px', minHeight:36,
          }}>⎋</button>
          {/* Baby chip */}
          <button className="baby-chip" onClick={() => { setShowProfiles(s=>!s); setShowMore(false) }}>
            <div className="baby-chip-avatar" style={{background:active.avatarColor,color:'var(--green-dark)',fontSize:13}}>
              {active.avatar}
            </div>
            {active.name}
          </button>
        </div>
      </div>

      {/* STATUS BAR — tylko premium */}
      {!showProfiles && isPremium && (
        <ChildStatusBar
          globalStatus={visibleStatus}
          topStatus={visibleTopStatus}
          allMessages={visibleMessages}
          onNavigate={navigate}
        />
      )}

      {/* CONTENT */}
      <div className="content">

        {/* STATUS CARD */}
        {!showProfiles && !showMore && (
          <ChildStatusCard
            globalStatus={visibleStatus}
            topStatus={visibleTopStatus}
            messages={visibleMessages}
            onNavigate={isPremium ? navigate : openPaywall}
            isPremium={isPremium}
            onUpgrade={openPaywall}
          />
        )}

        {showProfiles ? (
          <ProfilesScreen
            profiles={profiles}
            activeId={activeId}
            onSelect={(id) => { setActiveId(id); setShowProfiles(false) }}
            onAdd={addProfile}
            onUpdate={updateProfile}
            onDelete={deleteProfile}
          />
        ) : showMore ? (
          <div style={{paddingBottom:8}}>
            <div className="section-header">
              <div className="section-title">Wszystkie moduły</div>
              <div className="section-desc">Wybierz sekcję</div>
            </div>
            <div style={{padding:'8px 16px 0',display:'flex',flexDirection:'column',gap:6}}>
              {MORE_TABS.map(t => {
                const count = visibleSection(t.id).length
                return (
                  <button key={t.id} onClick={()=>selectMoreTab(t.id)} style={{
                    display:'flex',alignItems:'center',gap:14,padding:'14px 16px',
                    background:'var(--surface)',border:'0.5px solid var(--border)',
                    borderRadius:14,fontSize:15,fontWeight:500,color:'var(--text)',
                    textAlign:'left',minHeight:56,cursor:'pointer'
                  }}>
                    <span style={{fontSize:22}}>{t.emoji}</span>
                    {t.label}
                    {count > 0 && (
                      <span style={{marginLeft:6,background:'#D85A30',color:'#fff',fontSize:10,fontWeight:700,borderRadius:20,padding:'1px 6px'}}>{count}</span>
                    )}
                    <span style={{marginLeft:'auto',color:'var(--text-3)',fontSize:18}}>›</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : renderTab()}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_TABS.map(n => {
          const count = n.id !== 'more'
            ? visibleSection(n.id).length
            : MORE_TABS.reduce((s,t) => s + visibleSection(t.id).length, 0)
          return (
            <button key={n.id} className={`nav-item ${navActive(n.id)?'active':''}`} onClick={()=>selectTab(n.id)} style={{position:'relative'}}>
              {n.icon}
              {n.label}
              {count > 0 && !navActive(n.id) && (
                <span style={{
                  position:'absolute',top:6,right:'calc(50% - 18px)',
                  background:'#D85A30',color:'#fff',fontSize:9,fontWeight:700,
                  borderRadius:20,padding:'1px 4px',lineHeight:1.4,
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
