import React, { useState } from 'react'
import { useFirestore } from '../hooks/useFirestore'
import { todayDate, genId, formatDate } from '../utils/helpers'
import Modal from './Modal'
import { t, useLocale } from '../i18n'
import PremiumTeaser from './PremiumTeaser'
import { toast, toastWithUndo } from './Toast'

const VISIT_TYPES = ['Pediatra', 'Pogotowie', 'Teleporada', 'Specjalista', 'Kontrolna']

/**
 * DoctorNotesTab
 *
 * Dwie główne sekcje:
 *   1. Pytania do następnej wizyty (NOWE 2026-04-21)
 *      - Quick add input + lista pending + sekcja answered
 *      - Tap checkbox → pytanie przechodzi w "asked" z polem na odpowiedź
 *   2. Historia wizyt lekarskich (istniejąca)
 *      - Lista notatek z wizyt
 */
export default function DoctorNotesTab({uid, babyId, isPremium, onUpgrade }) {
  useLocale()

  // ── WIZYTY (istniejące) ──────────────────────────────────────────────────
  const [notes, setNotes] = useFirestore(uid, `doctor_notes_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [viewNote, setViewNote] = useState(null)
  const [form, setForm] = useState({
    date: todayDate(),
    type: 'Pediatra',
    doctor: '',
    diagnosis: '',
    recommendations: '',
    nextVisit: '',
    medications: '',
  })

  // ── PYTANIA DO PEDIATRY (nowe) ────────────────────────────────────────────
  const [questions, setQuestions] = useFirestore(uid, `doctor_questions_${babyId}`, [])
  const [newQuestion, setNewQuestion] = useState('')
  const [answeringId, setAnsweringId] = useState(null)  // id pytania w trakcie wpisywania odpowiedzi
  const [answerText, setAnswerText] = useState('')

  const pendingQuestions = questions.filter(q => q.status !== 'asked')
  const askedQuestions = questions.filter(q => q.status === 'asked')

  const addQuestion = () => {
    const q = newQuestion.trim()
    if (!q) return
    setQuestions([
      { id: genId(), question: q, date_added: todayDate(), status: 'pending', answer: '', date_asked: null },
      ...questions,
    ])
    setNewQuestion('')
    toast('Pytanie dodane')
  }

  // Tap checkbox → przechodzi w tryb wpisywania odpowiedzi
  const startAnswering = (id) => {
    setAnsweringId(id)
    setAnswerText('')
  }

  const saveAnswer = () => {
    setQuestions(questions.map(q => q.id === answeringId
      ? { ...q, status: 'asked', answer: answerText.trim(), date_asked: todayDate() }
      : q
    ))
    setAnsweringId(null)
    setAnswerText('')
    toast('Odpowiedź zapisana')
  }

  // Można zaznaczyć "zadane" bez wpisywania odpowiedzi (np. pediatra już odpowiedział
  // że to nieważne) — klik od razu bez wchodzenia w answer mode
  const markAskedNoAnswer = () => {
    setQuestions(questions.map(q => q.id === answeringId
      ? { ...q, status: 'asked', answer: '(bez szczegółowej odpowiedzi)', date_asked: todayDate() }
      : q
    ))
    setAnsweringId(null)
    setAnswerText('')
  }

  const removeQuestion = (id) => {
    const removed = questions.find(q => q.id === id)
    if (!removed) return
    setQuestions(questions.filter(q => q.id !== id))
    toastWithUndo('Usunięto pytanie', () => setQuestions(prev => [removed, ...prev]))
  }

  // ── WIZYTY — funkcje (istniejące) ────────────────────────────────────────
  const save = () => {
    if (!form.diagnosis.trim() && !form.recommendations.trim()) return
    setNotes([{ id: genId(), ...form }, ...notes])
    setModal(false)
    resetForm()
  }

  const resetForm = () => setForm({
    date: todayDate(), type: 'Pediatra', doctor: '',
    diagnosis: '', recommendations: '', nextVisit: '', medications: '',
  })

  const remove = (id) => {
    setNotes(notes.filter(n => n.id !== id))
    if (viewNote?.id === id) setViewNote(null)
  }

  // ── Paywall dla free ─────────────────────────────────────────────────────
  if (!isPremium) {
    return (
      <>
        <div className="section-header">
          <div className="section-title">{t('doctor.title')}</div>
          <div className="section-desc">{t('doctor.desc')}</div>
        </div>
        <PremiumTeaser label={t('doctor.premium.label')} onUpgrade={onUpgrade} />
        <div className="card" style={{ margin: '12px 16px 0', padding: '16px 14px' }}>
          <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>
            {t('doctor.premium.intro')}
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[t('doctor.premium.f1'), t('doctor.premium.f2'), t('doctor.premium.f3'), t('doctor.premium.f4')].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">{t('doctor.title')}</div>
        <div className="section-desc">
          {notes.length ? t('doctor.desc.count', {count: notes.length}) : t('doctor.desc')}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SEKCJA 1: PYTANIA DO PEDIATRY                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="card" style={{ margin: '8px 16px 0' }}>
        <div className="card-header" style={{display:'flex',alignItems:'center',gap:8}}>
          <span>💬 Pytania do następnej wizyty</span>
          {pendingQuestions.length > 0 && (
            <span style={{
              background:'#185FA5',color:'#fff',fontSize:10,fontWeight:700,
              borderRadius:20,padding:'1px 7px',marginLeft:'auto',
            }}>
              {pendingQuestions.length}
            </span>
          )}
        </div>

        {/* Quick add */}
        <div style={{padding:'10px 14px',display:'flex',gap:8}}>
          <input
            className="form-input"
            type="text"
            maxLength={200}
            placeholder="Napisz pytanie..."
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addQuestion() }}
            style={{flex:1}}
          />
          <button
            onClick={addQuestion}
            disabled={!newQuestion.trim()}
            style={{
              background: newQuestion.trim() ? 'var(--green)' : '#c0c0b8',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '0 16px', fontSize: 20, fontWeight: 700,
              cursor: newQuestion.trim() ? 'pointer' : 'default',
              minWidth: 48, minHeight: 44,
            }}
          >
            +
          </button>
        </div>

        {/* Pending questions */}
        {pendingQuestions.length === 0 ? (
          <div style={{padding:'10px 14px 16px',fontSize:12,color:'var(--text-3)',lineHeight:1.5}}>
            Brak pytań do zadania. Dodaj gdy coś Ci przyjdzie do głowy — wrócisz tu przed wizytą.
          </div>
        ) : (
          <div>
            {pendingQuestions.map(q => {
              const isAnsweringThis = answeringId === q.id
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '10px 14px',
                    borderTop: '0.5px solid rgba(0,0,0,0.05)',
                    background: isAnsweringThis ? '#F4FCF9' : 'transparent',
                  }}
                >
                  <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <button
                      onClick={() => isAnsweringThis ? setAnsweringId(null) : startAnswering(q.id)}
                      style={{
                        width:22,height:22,borderRadius:6,
                        border:'2px solid var(--green)',
                        background: isAnsweringThis ? 'var(--green)' : 'transparent',
                        color:'#fff',fontSize:14,cursor:'pointer',
                        flexShrink:0,marginTop:2,
                        display:'flex',alignItems:'center',justifyContent:'center',
                      }}
                      title="Oznacz jako zadane"
                    >
                      {isAnsweringThis && '✓'}
                    </button>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,color:'var(--text)',lineHeight:1.4}}>
                        {q.question}
                      </div>
                      <div style={{fontSize:11,color:'var(--text-3)',marginTop:2}}>
                        Dodane: {formatDate(q.date_added)}
                      </div>
                    </div>
                    {!isAnsweringThis && (
                      <button
                        onClick={() => removeQuestion(q.id)}
                        style={{
                          background:'none',border:'none',color:'var(--text-3)',
                          fontSize:16,cursor:'pointer',minHeight:32,minWidth:32,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Answer input — pokazuje się po klik checkbox */}
                  {isAnsweringThis && (
                    <div style={{marginTop:10,paddingLeft:32}}>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Co powiedział pediatra? (opcjonalnie)"
                        value={answerText}
                        onChange={e => setAnswerText(e.target.value)}
                        style={{resize:'none',fontSize:13}}
                        autoFocus
                      />
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        <button
                          onClick={saveAnswer}
                          style={{
                            background:'var(--green)',color:'#fff',border:'none',
                            borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,
                            cursor:'pointer',minHeight:36,
                          }}
                        >
                          ✓ Zapisz
                        </button>
                        <button
                          onClick={markAskedNoAnswer}
                          style={{
                            background:'transparent',color:'var(--text-2)',
                            border:'0.5px solid var(--border)',
                            borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,
                            cursor:'pointer',minHeight:36,
                          }}
                        >
                          Pomiń
                        </button>
                        <button
                          onClick={() => setAnsweringId(null)}
                          style={{
                            background:'transparent',color:'var(--text-3)',
                            border:'none',padding:'6px 8px',fontSize:12,
                            cursor:'pointer',marginLeft:'auto',minHeight:36,
                          }}
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Answered questions (collapsed by default — show last 3) */}
        {askedQuestions.length > 0 && (
          <>
            <div style={{
              padding:'8px 14px',borderTop:'0.5px solid rgba(0,0,0,0.05)',
              fontSize:11,fontWeight:700,color:'var(--text-3)',
              textTransform:'uppercase',letterSpacing:0.4,background:'#f7f7f5',
            }}>
              Odpowiedzi z ostatnich wizyt ({askedQuestions.length})
            </div>
            {askedQuestions.slice(0, 5).map(q => (
              <div key={q.id} style={{
                padding:'10px 14px',borderTop:'0.5px solid rgba(0,0,0,0.05)',
                background:'#fafaf8',
              }}>
                <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <span style={{fontSize:14,color:'var(--green)',marginTop:2}}>✓</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.4,textDecoration:'line-through'}}>
                      {q.question}
                    </div>
                    {q.answer && (
                      <div style={{
                        fontSize:13,color:'var(--text)',lineHeight:1.5,
                        marginTop:6,padding:'8px 10px',background:'#E1F5EE',borderRadius:8,
                      }}>
                        💬 {q.answer}
                      </div>
                    )}
                    <div style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>
                      Zadane: {q.date_asked ? formatDate(q.date_asked) : '—'}
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    style={{
                      background:'none',border:'none',color:'var(--text-3)',
                      fontSize:14,cursor:'pointer',minHeight:32,minWidth:32,
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SEKCJA 2: HISTORIA WIZYT (istniejąca, niezmienna)                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="section-header" style={{marginTop:16}}>
        <div className="section-title" style={{fontSize:15}}>📋 Historia wizyt</div>
      </div>

      {notes.length === 0 ? (
        <div className="card" style={{ margin: '8px 16px 0' }}>
          <div className="empty-state">
            <div className="empty-icon">🩺</div>
            <p>{t('doctor.empty')}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px 16px 0' }}>
          {notes.map(n => (
            <div
              key={n.id}
              onClick={() => setViewNote(n)}
              style={{
                background: 'var(--surface)',
                border: '0.5px solid var(--border)',
                borderRadius: 14, padding: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  background: '#E6F1FB', borderRadius: 8,
                  padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#185FA5',
                }}>
                  {n.type}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{n.date}</span>
                {n.doctor && (
                  <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 'auto' }}>
                    dr {n.doctor}
                  </span>
                )}
              </div>

              {n.diagnosis && (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
                  {n.diagnosis.length > 80 ? n.diagnosis.slice(0, 80) + '…' : n.diagnosis}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {n.medications && (
                  <span style={{ fontSize: 11, background: '#FAECE7', color: '#712B13', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                    💊 Leki
                  </span>
                )}
                {n.nextVisit && (
                  <span style={{ fontSize: 11, background: '#FAEEDA', color: '#633806', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                    📅 Kontrola: {n.nextVisit}
                  </span>
                )}
                {n.recommendations && (
                  <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                    ✓ Zalecenia
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn-add" onClick={() => { resetForm(); setModal(true) }}>
        {t('doctor.add')}
      </button>

      {/* Modal dodawania wizyty */}
      <Modal open={modal} onClose={() => setModal(false)} title={t('doctor.modal.title')}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('doctor.modal.type')}</label>
            <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {VISIT_TYPES.map(vt => (
                <option key={vt} value={vt}>
                  {vt === 'Pediatra'     ? t('doctor.visit.pediatrician')
                   : vt === 'Pogotowie'  ? t('doctor.visit.emergency')
                   : vt === 'Teleporada' ? t('doctor.visit.telehealth')
                   : vt === 'Specjalista'? t('doctor.visit.specialist')
                   : vt === 'Kontrolna'  ? t('doctor.visit.routine')
                   : vt}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('doctor.modal.date')}</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('doctor.modal.doctor')}</label>
          <input className="form-input" type="text" maxLength={80} placeholder={t('doctor.doctor_ph_short')} value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Diagnoza / objawy</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder={t('doctor.modal.diagnosis_ph')}
            value={form.diagnosis}
            onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
            style={{ resize: 'none' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('doctor.modal.recommendations')}</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder={t('doctor.modal.recommendations_ph')}
            value={form.recommendations}
            onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))}
            style={{ resize: 'none' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Przepisane leki</label>
          <input className="form-input" type="text" maxLength={80} placeholder={t('doctor.meds_ph')} value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Data kontroli</label>
          <input className="form-input" type="date" value={form.nextVisit} onChange={e => setForm(f => ({ ...f, nextVisit: e.target.value }))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel')}</button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </Modal>

      <Modal open={!!viewNote} onClose={() => setViewNote(null)} title={viewNote ? `${viewNote.type} · ${viewNote.date}` : ''}>
        {viewNote && (
          <>
            {viewNote.doctor && (
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>dr {viewNote.doctor}</div>
            )}
            {[
              { label: 'Diagnoza', value: viewNote.diagnosis },
              { label: 'Zalecenia', value: viewNote.recommendations },
              { label: 'Przepisane leki', value: viewNote.medications },
              { label: 'Data kontroli', value: viewNote.nextVisit },
            ].filter(f => f.value).map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{f.value}</div>
              </div>
            ))}
            <div className="modal-btns">
              <button
                className="btn-secondary"
                style={{ background: 'var(--coral-light)', color: 'var(--coral)', border: 'none' }}
                onClick={() => remove(viewNote.id)}
              >
                Usuń
              </button>
              <button className="btn-primary" onClick={() => setViewNote(null)}>Zamknij</button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
