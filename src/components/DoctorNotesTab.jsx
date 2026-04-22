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
 * Sekcje:
 *   1. Pytania do następnej wizyty
 *      - Quick add
 *      - Pending: tap w pytanie → ikonka edycji / checkbox (odpowiedź)
 *      - Answered: line-through, możliwość edycji odpowiedzi
 *   2. Historia wizyt
 *      - Tap w wpis → modal podglądu z przyciskiem "Edytuj"
 *      - Edit mode: full form
 */
export default function DoctorNotesTab({uid, babyId, isPremium, onUpgrade }) {
  useLocale()

  // ── WIZYTY ────────────────────────────────────────────────────────────────
  const [notes, setNotes] = useFirestore(uid, `doctor_notes_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState(null)  // jeśli nie null → edit mode
  const [viewNote, setViewNote] = useState(null)
  const [form, setForm] = useState(emptyNoteForm())

  function emptyNoteForm() {
    return {
      date: todayDate(),
      type: 'Pediatra',
      doctor: '',
      diagnosis: '',
      recommendations: '',
      nextVisit: '',
      medications: '',
    }
  }

  // ── PYTANIA ───────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useFirestore(uid, `doctor_questions_${babyId}`, [])
  const [newQuestion, setNewQuestion] = useState('')
  const [answeringId, setAnsweringId] = useState(null)
  const [answerText, setAnswerText] = useState('')
  // NEW: edycja samego pytania
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editedQuestionText, setEditedQuestionText] = useState('')
  // NEW: edycja odpowiedzi na zadane pytanie
  const [editingAnswerId, setEditingAnswerId] = useState(null)
  const [editedAnswerText, setEditedAnswerText] = useState('')

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
    toast(t('doctor.questions.added'))
  }

  // Edycja TEKSTU pytania (pending)
  const startEditQuestion = (q) => {
    setEditingQuestionId(q.id)
    setEditedQuestionText(q.question)
    setAnsweringId(null)  // zamknij inne tryby
  }

  const saveEditedQuestion = () => {
    const txt = editedQuestionText.trim()
    if (!txt) { toast(t('doctor.questions.empty_err')); return }
    setQuestions(questions.map(q => q.id === editingQuestionId
      ? { ...q, question: txt }
      : q
    ))
    setEditingQuestionId(null)
    setEditedQuestionText('')
    toast(t('doctor.questions.updated'))
  }

  // Odpowiedź na pytanie (przejście pending → asked)
  const startAnswering = (id) => {
    setAnsweringId(id)
    setAnswerText('')
    setEditingQuestionId(null)
  }

  const saveAnswer = () => {
    setQuestions(questions.map(q => q.id === answeringId
      ? { ...q, status: 'asked', answer: answerText.trim(), date_asked: todayDate() }
      : q
    ))
    setAnsweringId(null)
    setAnswerText('')
    toast(t('doctor.questions.answer_saved'))
  }

  const markAskedNoAnswer = () => {
    setQuestions(questions.map(q => q.id === answeringId
      ? { ...q, status: 'asked', answer: t('doctor.questions.no_answer'), date_asked: todayDate() }
      : q
    ))
    setAnsweringId(null)
    setAnswerText('')
  }

  // Edycja ODPOWIEDZI na zadane pytanie
  const startEditAnswer = (q) => {
    setEditingAnswerId(q.id)
    setEditedAnswerText(q.answer === t('doctor.questions.no_answer') ? '' : q.answer)
  }

  const saveEditedAnswer = () => {
    setQuestions(questions.map(q => q.id === editingAnswerId
      ? { ...q, answer: editedAnswerText.trim() || t('doctor.questions.no_answer') }
      : q
    ))
    setEditingAnswerId(null)
    setEditedAnswerText('')
    toast(t('doctor.questions.answer_updated'))
  }

  const removeQuestion = (id) => {
    const removed = questions.find(q => q.id === id)
    if (!removed) return
    setQuestions(questions.filter(q => q.id !== id))
    toastWithUndo(t('doctor.questions.deleted'), () => setQuestions(prev => [removed, ...prev]))
  }

  // ── WIZYTY — save & edit ──────────────────────────────────────────────────
  const openAddNote = () => {
    setEditingNoteId(null)
    setForm(emptyNoteForm())
    setModal(true)
  }

  const openEditNote = (note) => {
    setEditingNoteId(note.id)
    setForm({
      date: note.date || todayDate(),
      type: note.type || 'Pediatra',
      doctor: note.doctor || '',
      diagnosis: note.diagnosis || '',
      recommendations: note.recommendations || '',
      nextVisit: note.nextVisit || '',
      medications: note.medications || '',
    })
    setViewNote(null)  // zamknij modal podglądu
    setModal(true)
  }

  const save = () => {
    if (!form.diagnosis.trim() && !form.recommendations.trim()) {
      toast(t('doctor.visits.required_err'), 'error')
      return
    }
    if (editingNoteId) {
      // UPDATE existing
      setNotes(notes.map(n => n.id === editingNoteId ? { ...n, ...form } : n))
      toast(t('doctor.visits.updated'))
    } else {
      // CREATE new
      setNotes([{ id: genId(), ...form }, ...notes])
      toast(t('doctor.visits.saved'))
    }
    setModal(false)
    setEditingNoteId(null)
    setForm(emptyNoteForm())
  }

  const remove = (id) => {
    const removed = notes.find(n => n.id === id)
    if (!removed) return
    setNotes(notes.filter(n => n.id !== id))
    if (viewNote?.id === id) setViewNote(null)
    toastWithUndo(t('doctor.visits.deleted'), () => setNotes(prev => [removed, ...prev]))
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
          <span>{t('doctor.questions.title')}</span>
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
            placeholder={t('doctor.questions.placeholder')}
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
            {t('doctor.questions.empty')}
          </div>
        ) : (
          <div>
            {pendingQuestions.map(q => {
              const isAnsweringThis = answeringId === q.id
              const isEditingThis   = editingQuestionId === q.id
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '10px 14px',
                    borderTop: '0.5px solid rgba(0,0,0,0.05)',
                    background: (isAnsweringThis || isEditingThis) ? '#F4FCF9' : 'transparent',
                  }}
                >
                  {/* Tryb edycji pytania */}
                  {isEditingThis ? (
                    <div>
                      <input
                        className="form-input"
                        type="text"
                        maxLength={200}
                        value={editedQuestionText}
                        onChange={e => setEditedQuestionText(e.target.value)}
                        autoFocus
                        style={{fontSize:14,width:'100%'}}
                      />
                      <div style={{display:'flex',gap:6,marginTop:8,justifyContent:'flex-end'}}>
                        <button
                          onClick={() => { setEditingQuestionId(null); setEditedQuestionText('') }}
                          style={{
                            background:'transparent',color:'var(--text-3)',
                            border:'0.5px solid var(--border)',borderRadius:8,
                            padding:'6px 12px',fontSize:12,fontWeight:600,
                            cursor:'pointer',minHeight:36,
                          }}
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={saveEditedQuestion}
                          style={{
                            background:'var(--green)',color:'#fff',border:'none',
                            borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,
                            cursor:'pointer',minHeight:36,
                          }}
                        >
                          ✓ {t('common.save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
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
                            {t('doctor.questions.added_on', {date: formatDate(q.date_added)})}
                          </div>
                        </div>
                        {!isAnsweringThis && (
                          <>
                            <button
                              onClick={() => startEditQuestion(q)}
                              style={{
                                background:'none',border:'none',color:'var(--text-3)',
                                fontSize:14,cursor:'pointer',minHeight:32,minWidth:32,
                              }}
                              title={t('doctor.questions.edit_title')}
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => removeQuestion(q.id)}
                              style={{
                                background:'none',border:'none',color:'var(--text-3)',
                                fontSize:16,cursor:'pointer',minHeight:32,minWidth:32,
                              }}
                              title="Usuń"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>

                      {/* Answer input */}
                      {isAnsweringThis && (
                        <div style={{marginTop:10,paddingLeft:32}}>
                          <textarea
                            className="form-input"
                            rows={2}
                            placeholder={t('doctor.questions.answer_ph')}
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
                              ✓ {t('common.save')}
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
                              {t('doctor.questions.skip')}
                            </button>
                            <button
                              onClick={() => setAnsweringId(null)}
                              style={{
                                background:'transparent',color:'var(--text-3)',
                                border:'none',padding:'6px 8px',fontSize:12,
                                cursor:'pointer',marginLeft:'auto',minHeight:36,
                              }}
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Answered questions — tu dodajemy edycję odpowiedzi */}
        {askedQuestions.length > 0 && (
          <>
            <div style={{
              padding:'8px 14px',borderTop:'0.5px solid rgba(0,0,0,0.05)',
              fontSize:11,fontWeight:700,color:'var(--text-3)',
              textTransform:'uppercase',letterSpacing:0.4,background:'#f7f7f5',
            }}>
              {t('doctor.questions.answered_header', {count: askedQuestions.length})}
            </div>
            {askedQuestions.slice(0, 5).map(q => {
              const isEditingThisAnswer = editingAnswerId === q.id
              return (
                <div key={q.id} style={{
                  padding:'10px 14px',borderTop:'0.5px solid rgba(0,0,0,0.05)',
                  background: isEditingThisAnswer ? '#F4FCF9' : '#fafaf8',
                }}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                    <span style={{fontSize:14,color:'var(--green)',marginTop:2}}>✓</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.4,textDecoration:'line-through'}}>
                        {q.question}
                      </div>

                      {isEditingThisAnswer ? (
                        <div style={{marginTop:6}}>
                          <textarea
                            className="form-input"
                            rows={2}
                            value={editedAnswerText}
                            onChange={e => setEditedAnswerText(e.target.value)}
                            placeholder={t('doctor.questions.answer_ph')}
                            style={{resize:'none',fontSize:13}}
                            autoFocus
                          />
                          <div style={{display:'flex',gap:6,marginTop:6}}>
                            <button
                              onClick={saveEditedAnswer}
                              style={{
                                background:'var(--green)',color:'#fff',border:'none',
                                borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:700,
                                cursor:'pointer',minHeight:34,
                              }}
                            >
                              ✓ {t('common.save')}
                            </button>
                            <button
                              onClick={() => { setEditingAnswerId(null); setEditedAnswerText('') }}
                              style={{
                                background:'transparent',color:'var(--text-3)',
                                border:'0.5px solid var(--border)',borderRadius:8,
                                padding:'6px 12px',fontSize:12,fontWeight:600,
                                cursor:'pointer',minHeight:34,
                              }}
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        q.answer && (
                          <div style={{
                            fontSize:13,color:'var(--text)',lineHeight:1.5,
                            marginTop:6,padding:'8px 10px',background:'#E1F5EE',borderRadius:8,
                          }}>
                            💬 {q.answer}
                          </div>
                        )
                      )}

                      <div style={{fontSize:10,color:'var(--text-3)',marginTop:4}}>
                        {q.date_asked ? t('doctor.questions.asked_on', {date: formatDate(q.date_asked)}) : '—'}
                      </div>
                    </div>
                    {!isEditingThisAnswer && (
                      <>
                        <button
                          onClick={() => startEditAnswer(q)}
                          style={{
                            background:'none',border:'none',color:'var(--text-3)',
                            fontSize:13,cursor:'pointer',minHeight:32,minWidth:32,
                          }}
                          title={t('doctor.questions.edit_answer')}
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => removeQuestion(q.id)}
                          style={{
                            background:'none',border:'none',color:'var(--text-3)',
                            fontSize:14,cursor:'pointer',minHeight:32,minWidth:32,
                          }}
                          title="Usuń"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SEKCJA 2: HISTORIA WIZYT                                              */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      <div className="section-header" style={{marginTop:16}}>
        <div className="section-title" style={{fontSize:15}}>{t('doctor.visits.header')}</div>
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
                    {t('doctor.visits.tag.meds')}
                  </span>
                )}
                {n.nextVisit && (
                  <span style={{ fontSize: 11, background: '#FAEEDA', color: '#633806', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                    {t('doctor.visits.tag.next_visit', {date: n.nextVisit})}
                  </span>
                )}
                {n.recommendations && (
                  <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                    {t('doctor.visits.tag.recs')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn-add" onClick={openAddNote}>
        {t('doctor.add')}
      </button>

      {/* MODAL: dodawania/edycji wizyty */}
      <Modal
        open={modal}
        onClose={() => { setModal(false); setEditingNoteId(null) }}
        title={editingNoteId ? t('doctor.visits.edit_title') : t('doctor.modal.title')}
      >
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
          <label className="form-label">{t('doctor.visits.field.diagnosis')}</label>
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
          <label className="form-label">{t('doctor.visits.field.meds')}</label>
          <input className="form-input" type="text" maxLength={80} placeholder={t('doctor.meds_ph')} value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">{t('doctor.visits.field.next')}</label>
          <input className="form-input" type="date" value={form.nextVisit} onChange={e => setForm(f => ({ ...f, nextVisit: e.target.value }))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => { setModal(false); setEditingNoteId(null) }}>
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={save}>{t('common.save')}</button>
        </div>
      </Modal>

      {/* MODAL: podgląd wizyty z opcją edycji */}
      <Modal open={!!viewNote} onClose={() => setViewNote(null)} title={viewNote ? `${viewNote.type} · ${viewNote.date}` : ''}>
        {viewNote && (
          <>
            {viewNote.doctor && (
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 12 }}>dr {viewNote.doctor}</div>
            )}
            {[
              { label: t('doctor.visits.field.diagnosis'), value: viewNote.diagnosis },
              { label: t('doctor.visits.field.recs'), value: viewNote.recommendations },
              { label: t('doctor.visits.field.meds'), value: viewNote.medications },
              { label: t('doctor.visits.field.next'), value: viewNote.nextVisit },
            ].filter(f => f.value).map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  {f.label}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>{f.value}</div>
              </div>
            ))}
            <div className="modal-btns" style={{flexDirection:'column',gap:8}}>
              <button
                className="btn-primary"
                style={{width:'100%'}}
                onClick={() => openEditNote(viewNote)}
              >
                {t('doctor.visits.edit_btn')}
              </button>
              <button
                className="btn-secondary"
                style={{ width:'100%', background: 'var(--coral-light)', color: 'var(--coral)', border: 'none' }}
                onClick={() => remove(viewNote.id)}
              >
                {t('common.delete')}
              </button>
              <button className="btn-secondary" style={{width:'100%'}} onClick={() => setViewNote(null)}>
                {t('common.close')}
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
