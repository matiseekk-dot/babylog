import { t, useLocale } from '../i18n'
import React, { useState } from 'react'

const CFG = {
  ok:      { barColor:'#1D9E75', bg:'#ffffff', iconBg:'#E1F5EE', iconColor:'#1D9E75', icon:'✓', titleColor:'#085041', msgColor:'#2a2a28', subBg:'#F1FEF8', subBorder:'#9FE1CB' },
  info:    { barColor:'#378ADD', bg:'#ffffff', iconBg:'#E6F1FB', iconColor:'#185FA5', icon:'ℹ', titleColor:'#0C447C', msgColor:'#2a2a28', subBg:'#EFF6FD', subBorder:'#B5D4F4' },
  warning: { barColor:'#BA7517', bg:'#ffffff', iconBg:'#FAEEDA', iconColor:'#BA7517', icon:'!', titleColor:'#633806', msgColor:'#2a2a28', subBg:'#FEF7EC', subBorder:'#FAC775' },
  alert:   { barColor:'#D85A30', bg:'#ffffff', iconBg:'#FAECE7', iconColor:'#D85A30', icon:'!', titleColor:'#712B13', msgColor:'#2a2a28', subBg:'#FEF1EC', subBorder:'#F0997B' },
  critical:{ barColor:'#A32D2D', bg:'#FFF8F8', iconBg:'#FCEBEB', iconColor:'#A32D2D', icon:'!!',titleColor:'#501313', msgColor:'#2a2a28', subBg:'#FEF0F0', subBorder:'#F09595' },
}

function StatusIcon({ cfg, pulse, small }) {
  return (
    <div style={{
      width: small ? 28 : 44, height: small ? 28 : 44,
      borderRadius:'50%',background:cfg.iconBg,
      display:'flex',alignItems:'center',justifyContent:'center',
      flexShrink:0, fontSize: small ? 13 : 18, fontWeight:900,color:cfg.iconColor,
      animation: pulse && !small ? 'scPulse 1.6s ease-in-out infinite':'none',
    }}>
      {cfg.icon}
    </div>
  )
}

function SubMessage({ msg, onNavigate }) {
  const mc = CFG[msg.status] || CFG.info
  return (
    <div
      onClick={() => msg.section && onNavigate?.(msg.section)}
      style={{
        display:'flex',alignItems:'center',gap:8,
        padding:'6px 10px',
        background:mc.subBg,border:`0.5px solid ${mc.subBorder}`,
        borderRadius:8,cursor:msg.section?'pointer':'default',
        minHeight: 0,
      }}
    >
      <div style={{width:6,height:6,borderRadius:'50%',background:mc.barColor,flexShrink:0}} />
      <span style={{
        fontSize:11,fontWeight:600,color:mc.titleColor,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        flexShrink: 0,
      }}>{msg.title}</span>
      {msg.message && (
        <span style={{
          fontSize:11,color:mc.barColor,marginLeft:4,opacity:0.75,
          flex: 1, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          — {msg.message}
        </span>
      )}
      {msg.section && <span style={{fontSize:14,color:mc.barColor,flexShrink:0}}>›</span>}
    </div>
  )
}

/**
 * ChildStatusCard
 *
 * v2.7.5b: Collapsible. Domyślnie zwinięty oprócz status === 'critical'.
 * Po zwiniętym widzi tylko ikonę + tytuł + ▼. Tap rozwija pełną treść.
 *
 * Props:
 *   globalStatus  – { title, message, status, section? }
 *   topStatus     – 'ok' | 'info' | 'warning' | 'alert' | 'critical'
 *   messages      – wszystkie aktywne komunikaty
 *   onNavigate    – fn(section)
 *   isPremium     – boolean
 *   onUpgrade     – fn() otwiera paywall
 */
export default function ChildStatusCard({ globalStatus, topStatus, messages, onNavigate, isPremium, onUpgrade }) {
  useLocale()
  const status = topStatus || globalStatus?.status || 'ok'

  // Status 'ok' jest zawsze rozwinięty (mały, pozytywny komunikat).
  // Reszta domyślnie ZWINIĘTA. Stan zwijania zachowywany w localStorage,
  // żeby nie resetować się przy każdym przejściu między tabami / "Więcej".
  const isOk = status === 'ok'
  const [expanded, setExpanded] = useState(() => {
    if (isOk) return true
    try {
      const stored = localStorage.getItem('child_status_expanded')
      // Default: zwinięty (false). Tylko jeśli user wcześniej rozwinął, zostaje rozwinięte.
      return stored === 'true'
    } catch {
      return false
    }
  })

  // Persist expanded state
  const toggleExpanded = () => {
    setExpanded(prev => {
      const next = !prev
      try { localStorage.setItem('child_status_expanded', next ? 'true' : 'false') } catch { /* ignore */ }
      return next
    })
  }

  if (!globalStatus) return null

  const cfg = CFG[status] || CFG.ok
  const pulse = status === 'alert' || status === 'critical'
  const secondary = (messages || [])
    .filter(m => m.id !== globalStatus.id && m.status !== 'ok')
    .slice(0, 2)

  return (
    <div style={{
      position:'sticky',top:0,zIndex:10,
      margin:'12px 16px 0',background:cfg.bg,
      borderRadius:16,border:'0.5px solid rgba(0,0,0,0.08)',
      overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
    }}>
      {/* Kolorowy pasek po lewej */}
      <div style={{
        position:'absolute',left:0,top:0,bottom:0,width:4,
        background:cfg.barColor,borderRadius:'16px 0 0 16px',
      }} />

      <div style={{padding: expanded ? '14px 14px 14px 18px' : '10px 14px 10px 18px'}}>
        {/* Header — klikalny dla non-ok statusów */}
        <button
          type="button"
          onClick={() => !isOk && toggleExpanded()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: expanded ? 12 : 10,
            background: 'transparent', border: 'none', padding: 0,
            cursor: isOk ? 'default' : 'pointer', textAlign: 'left',
            marginBottom: expanded && (!isPremium || secondary.length) ? 12 : 0,
          }}
        >
          <StatusIcon cfg={cfg} pulse={pulse} small={!expanded && !isOk} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{
              fontSize: expanded ? 15 : 13, fontWeight:700, color:cfg.titleColor,
              lineHeight:1.3, marginBottom: expanded && globalStatus.message ? 3 : 0,
              whiteSpace: expanded ? 'normal' : 'nowrap',
              overflow: expanded ? 'visible' : 'hidden',
              textOverflow: expanded ? 'clip' : 'ellipsis',
            }}>
              {globalStatus.title}
            </div>
            {expanded && globalStatus.message && (
              <div style={{fontSize:13,color:cfg.msgColor,lineHeight:1.45}}>
                {globalStatus.message}
              </div>
            )}
          </div>
          {/* Toggle ▼/▲ — tylko dla non-ok */}
          {!isOk && (
            <span style={{
              color: cfg.barColor, fontSize: 12, flexShrink: 0, opacity: 0.7,
            }}>
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </button>

        {/* Sub-messages — tylko gdy expanded */}
        {expanded && isPremium && secondary.length > 0 && (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {secondary.map(m => <SubMessage key={m.id} msg={m} onNavigate={onNavigate} />)}
          </div>
        )}

        {/* FREE: CTA upgrade — tylko gdy expanded */}
        {expanded && !isPremium && (
          <button
            onClick={onUpgrade}
            style={{
              width:'100%',padding:'10px 14px',
              background:'linear-gradient(135deg,#0F6E56,#1D9E75)',
              color:'#fff',border:'none',borderRadius:10,
              fontSize:13,fontWeight:700,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
            }}
          >
            {t('status.upgrade_cta')}
          </button>
        )}
      </div>

      <style>{`
        @keyframes scPulse {
          0%,100%{transform:scale(1);opacity:1;}
          50%{transform:scale(1.1);opacity:0.7;}
        }
      `}</style>
    </div>
  )
}
