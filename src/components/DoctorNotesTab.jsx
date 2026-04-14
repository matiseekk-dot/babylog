import React, { useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { todayDate, uid } from '../utils/helpers'
import Modal from './Modal'
import PremiumTeaser from './PremiumTeaser'

const VISIT_TYPES = ['Pediatra', 'Pogotowie', 'Teleporada', 'Specjalista', 'Kontrolna']

export default function DoctorNotesTab({ babyId, isPremium, onUpgrade }) {
  const [notes, setNotes] = useStorage(`doctor_notes_${babyId}`, [])
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

  const save = () => {
    if (!form.diagnosis.trim() && !form.recommendations.trim()) return
    setNotes([{ id: uid(), ...form }, ...notes])
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

  if (!isPremium) {
    return (
      <>
        <div className="section-header">
          <div className="section-title">Notatki lekarskie</div>
          <div className="section-desc">Zapisuj diagnozę i zalecenia po wizycie</div>
        </div>
        <PremiumTeaser label="Notatki z wizyt lekarskich" onUpgrade={onUpgrade} />
        <div className="card" style={{ margin: '12px 16px 0', padding: '16px 14px' }}>
          <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>
            Po wizycie u lekarza łatwo zapomnieć co powiedział. Premium pozwala zapisać:
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Diagnoza i objawy', 'Zalecenia i leki', 'Data kontroli', 'Nazwisko lekarza'].map(item => (
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
        <div className="section-title">Notatki lekarskie</div>
        <div className="section-desc">{notes.length ? `${notes.length} wizyt zapisanych` : 'Zapisuj diagnozy i zalecenia'}</div>
      </div>

      {notes.length === 0 ? (
        <div className="card" style={{ margin: '8px 16px 0' }}>
          <div className="empty-state">
            <div className="empty-icon">🩺</div>
            <p>Po wizycie u lekarza zapisz tu co powiedział.<br />Nigdy więcej nie zapomnisz o zaleceniach.</p>
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
              {/* Header wizyty */}
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

              {/* Diagnoza preview */}
              {n.diagnosis && (
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
                  {n.diagnosis.length > 80 ? n.diagnosis.slice(0, 80) + '…' : n.diagnosis}
                </div>
              )}

              {/* Pills — zalecenia i kontrola */}
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
        + Dodaj notatkę z wizyty
      </button>

      {/* Modal dodawania */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nowa notatka lekarska">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Typ wizyty</label>
            <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {VISIT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data wizyty</label>
            <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Lekarz (opcjonalnie)</label>
          <input className="form-input" type="text" placeholder="np. Kowalski" value={form.doctor} onChange={e => setForm(f => ({ ...f, doctor: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Diagnoza / objawy</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Co stwierdził lekarz? Jakie objawy?"
            value={form.diagnosis}
            onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
            style={{ resize: 'none' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Zalecenia</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Co robić? Jak postępować?"
            value={form.recommendations}
            onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))}
            style={{ resize: 'none' }}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Przepisane leki</label>
          <input className="form-input" type="text" placeholder="np. Amoksycylina 2× dziennie 5 dni" value={form.medications} onChange={e => setForm(f => ({ ...f, medications: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Data kontroli</label>
          <input className="form-input" type="date" value={form.nextVisit} onChange={e => setForm(f => ({ ...f, nextVisit: e.target.value }))} />
        </div>
        <div className="modal-btns">
          <button className="btn-secondary" onClick={() => setModal(false)}>Anuluj</button>
          <button className="btn-primary" onClick={save}>Zapisz</button>
        </div>
      </Modal>

      {/* Modal szczegółów */}
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
