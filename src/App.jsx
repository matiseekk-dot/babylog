import React, { useState } from 'react'
import { useStorage } from './hooks/useStorage'
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

const DEFAULT_PROFILE = {
  id: 'default',
  name: 'Moje dziecko',
  months: 4,
  weight: 6.5,
  avatar: '👶',
  avatarColor: '#E1F5EE',
}

const NAV_TABS = [
  { id:'feed',  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a4 4 0 0 0 8 0V3"/><path d="M12 6v6"/><ellipse cx="12" cy="18" rx="5" ry="3"/>
    </svg>
  ), label:'Karmienie' },
  { id:'sleep', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ), label:'Sen' },
  { id:'diaper', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12h8M12 8v8"/>
    </svg>
  ), label:'Pieluchy' },
  { id:'more', icon: (
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
]

export default function App() {
  const [profiles, setProfiles] = useStorage('profiles', [DEFAULT_PROFILE])
  const [activeId, setActiveId] = useStorage('activeProfile', 'default')
  const [tab, setTab] = useState('feed')
  const [showProfiles, setShowProfiles] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const active = profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILE

  const addProfile = (p) => {
    const next = [...profiles, p]
    setProfiles(next)
    setActiveId(p.id)
  }

  const updateProfile = (id, data) => {
    setProfiles(profiles.map(p => p.id === id ? { ...p, ...data } : p))
  }

  const deleteProfile = (id) => {
    const next = profiles.filter(p => p.id !== id)
    setProfiles(next.length ? next : [DEFAULT_PROFILE])
    if (activeId === id) setActiveId((next[0] || DEFAULT_PROFILE).id)
  }

  const selectTab = (id) => {
    if (id === 'more') { setShowMore(true); return }
    setTab(id)
    setShowMore(false)
    setShowProfiles(false)
  }

  const selectMoreTab = (id) => {
    setTab(id)
    setShowMore(false)
  }

  const navActive = (id) => {
    if (id === 'more') return MORE_TABS.some(t=>t.id===tab)
    return tab === id
  }

  const renderTab = () => {
    const props = { babyId: active.id, ageMonths: active.months, weightKg: active.weight }
    switch(tab) {
      case 'feed':       return <FeedTab {...props} />
      case 'sleep':      return <SleepTab {...props} />
      case 'diaper':     return <DiaperTab {...props} />
      case 'milestones': return <MilestonesTab {...props} />
      case 'growth':     return <GrowthTab {...props} />
      case 'temp':       return <TempTab {...props} />
      case 'meds':       return <MedsTab {...props} />
      case 'vacc':       return <VaccinationsTab {...props} />
      case 'diet':       return <DietTab {...props} />
      case 'diary':      return <DiaryTab {...props} />
      default:           return <FeedTab {...props} />
    }
  }

  const currentMoreTab = MORE_TABS.find(t=>t.id===tab)

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
        <button className="baby-chip" onClick={() => { setShowProfiles(s=>!s); setShowMore(false) }}>
          <div className="baby-chip-avatar" style={{background:active.avatarColor,color:'var(--green-dark)',fontSize:13}}>
            {active.avatar}
          </div>
          {active.name}
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">
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
              {MORE_TABS.map(t => (
                <button key={t.id} onClick={()=>selectMoreTab(t.id)} style={{
                  display:'flex',alignItems:'center',gap:14,padding:'14px 16px',
                  background:'var(--surface)',border:'0.5px solid var(--border)',
                  borderRadius:14,fontSize:15,fontWeight:500,color:'var(--text)',
                  textAlign:'left',minHeight:56,cursor:'pointer'
                }}>
                  <span style={{fontSize:22}}>{t.emoji}</span>
                  {t.label}
                  <span style={{marginLeft:'auto',color:'var(--text-3)',fontSize:18}}>›</span>
                </button>
              ))}
            </div>
          </div>
        ) : renderTab()}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        {NAV_TABS.map(n => (
          <button key={n.id} className={`nav-item ${navActive(n.id)?'active':''}`} onClick={()=>selectTab(n.id)}>
            {n.icon}
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
