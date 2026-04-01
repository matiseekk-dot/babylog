import React, { useState } from 'react'
import { useStorage } from '../hooks/useStorage'
import { nowTime, todayDate, uid, calcParacetamol, calcIbuprofen } from '../utils/helpers'
import Modal from './Modal'

const BUILT_IN_MEDS = ['Paracetamol','Ibuprofen','Sól fizjologiczna','Probiotyk']
const EMOJI_OPTIONS = ['💊','🌡️','🫁','🦠','🩹','🧴','💉','🩺','🌿','🍯','🧪','💧','🫀','🧬','⚕️']

export default function MedsTab({ babyId, ageMonths, weightKg }) {
  const [logs, setLogs] = useStorage(`meds_${babyId}`, [])
  const [customMeds, setCustomMeds] = useStorage(`meds_custom_${babyId}`, [])
  const [modal, setModal] = useState(false)
  const [doseModal, setDoseModal] = useState(null)
  const [addMedModal, setAddMedModal] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState({ med:'Paracetamol', dose:'', time:nowTime(), date:todayDate(), note:'' })
  const [medForm, setMedForm] = useState({ name:'', emoji:'💊', dosage:'', notes:'' })

  const parac = calcParacetamol(weightKg)
  const ibu = calcIbuprofen(weightKg, ageMonths)
  const allMedNames = [...BUILT_IN_MEDS, ...customMeds.map(m=>m.name), 'Inny']

  const add = () => {
    setLogs([{ id:uid(), ...form }, ...logs])
    setModal(false)
    setForm({ med:'Paracetamol', dose:'', time:nowTime(), date:todayDate(), note:'' })
  }
  const remove = (id) => setLogs(logs.filter(l=>l.id!==id))

  const addCustomMed = () => {
    if (!medForm.name.trim()) return
    setCustomMeds([...customMeds, { id:uid(), ...medForm, name:medForm.name.trim() }])
    setAddMedModal(false)
    setMedForm({ name:'', emoji:'💊', dosage:'', notes:'' })
  }
  const removeCustomMed = (id) => { setCustomMeds(customMeds.filter(m=>m.id!==id)); setDeleteId(null) }

  const DOSE_INFO = {
    Paracetamol: { title:'Paracetamol', content:[`Dawka jednorazowa: ${parac.dose} mg (15 mg/kg)`,`Zawiesina 120 mg/5 ml → ${parac.mlStd} ml`,`Zawiesina 240 mg/5 ml → ${parac.mlFort} ml`,`Maks. dobowa: ${parac.maxDaily} mg (co 4–6h, maks. 4× dziennie)`,`Dla wagi: ${weightKg} kg`] },
    Ibuprofen: { title:'Ibuprofen', content: ibu ? [`Dawka jednorazowa: ${ibu.dose} mg (10 mg/kg)`,`Zawiesina 100 mg/5 ml → ${ibu.ml} ml`,`Maks. dobowa: ${ibu.maxDaily} mg (co 6–8h, maks. 3× dziennie)`,`Stosować od 3. miesiąca życia`,`Dla wagi: ${weightKg} kg`] : [`Ibuprofen nie jest zalecany poniżej 3. miesiąca życia.`] },
    'Sól fizjologiczna': { title:'Sól fizjologiczna', content:['3–5 kropli do każdej dziurki nosa','Podawać 3–4× dziennie','Wkraplać w pozycji leżącej z lekko odchyloną głową','Można stosować od urodzenia'] },
    Probiotyk: { title:'Probiotyk', content:['1× dziennie, 5–10 kropli lub 1 saszetka (wg ulotki)','Stosować min. 2h po antybiotyku','Można mieszać z mlekiem lub papką'] }
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Leki</div>
        <div className="section-desc">Dawkowanie dla dziecka {weightKg} kg, {ageMonths} mies.</div>
      </div>
      <div className="warn-card"><strong>Ważne:</strong> Podane dawki są orientacyjne. Zawsze konsultuj się z lekarzem lub farmaceutą.</div>

      <div className="card">
        <div className="card-header">Kalkulator dawek — wbudowane</div>
        {BUILT_IN_MEDS.map(med => (
          <div className="log-item" key={med}>
            <div className="log-icon">{med==='Paracetamol'?'🌡️':med==='Ibuprofen'?'💊':med==='Sól fizjologiczna'?'🫁':'🦠'}</div>
            <div className="log-body">
              <div className="log-name">{med}</div>
              <div className="log-detail">
                {med==='Paracetamol' && `${parac.dose} mg → ${parac.mlStd} ml`}
                {med==='Ibuprofen' && (ibu ? `${ibu.dose} mg → ${ibu.ml} ml` : 'Poniżej 3. miesiąca')}
                {med==='Sól fizjologiczna' && '3–5 kropli / dziurkę'}
                {med==='Probiotyk' && '5–10 kropli / dobę'}
              </div>
            </div>
            <button onClick={()=>setDoseModal(DOSE_INFO[med])} style={{background:'var(--blue-light)',color:'var(--blue)',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:600,minHeight:36}}>Dawka</button>
          </div>
        ))}
      </div>

      {customMeds.length > 0 && (
        <div className="card">
          <div className="card-header">Własne leki ({customMeds.length})</div>
          {customMeds.map(m => (
            <div className="log-item" key={m.id}>
              <div className="log-icon">{m.emoji}</div>
              <div className="log-body">
                <div className="log-name">{m.name}</div>
                <div className="log-detail">{m.dosage || 'Wg ulotki / zalecenia lekarza'}</div>
              </div>
              <button onClick={()=>setDoseModal({ title:m.name, content:[m.dosage,m.notes].filter(Boolean) })} style={{background:'var(--blue-light)',color:'var(--blue)',border:'none',borderRadius:8,padding:'6px 10px',fontSize:12,fontWeight:600,minHeight:36,marginRight:4}}>Info</button>
              <button onClick={()=>setDeleteId(m.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,minHeight:44,minWidth:36,cursor:'pointer'}}>✕</button>
            </div>
          ))}
        </div>
      )}

      <button className="btn-add" onClick={()=>{ setMedForm({name:'',emoji:'💊',dosage:'',notes:''}); setAddMedModal(true) }}>+ Dodaj własny lek do kalkulatora</button>

      <div className="card" style={{marginTop:8}}>
        <div className="card-header">Historia podań</div>
        {logs.length === 0
          ? <div className="empty-state"><div className="empty-icon">💊</div><p>Brak podanych leków</p></div>
          : logs.slice(0,20).map(l => (
            <div className="log-item" key={l.id}>
              <div className="log-icon">💊</div>
              <div className="log-body"><div className="log-name">{l.med}{l.dose?` – ${l.dose}`:''}</div><div className="log-detail">{l.date} {l.time}{l.note?` · ${l.note}`:''}</div></div>
              <button onClick={()=>remove(l.id)} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:16,padding:'0 0 0 8px',minHeight:44,minWidth:44}}>✕</button>
            </div>
          ))
        }
      </div>
      <button className="btn-add" onClick={()=>{ setForm(f=>({...f,time:nowTime(),date:todayDate()})); setModal(true) }}>+ Zapisz podanie leku</button>

      <Modal open={addMedModal} onClose={()=>setAddMedModal(false)} title="Nowy lek własny">
        <div className="form-group">
          <label className="form-label">Emoji leku</label>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={()=>setMedForm(f=>({...f,emoji:e}))} style={{width:40,height:40,fontSize:20,borderRadius:8,cursor:'pointer',border:`1.5px solid ${medForm.emoji===e?'var(--green)':'var(--border)'}`,background:medForm.emoji===e?'var(--green-light)':'var(--surface)'}}>{e}</button>
            ))}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Nazwa leku</label><input className="form-input" type="text" placeholder="np. Fenistil, Vibovit..." value={medForm.name} onChange={e=>setMedForm(f=>({...f,name:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Dawkowanie</label><input className="form-input" type="text" placeholder="np. 3× dziennie 5 kropli" value={medForm.dosage} onChange={e=>setMedForm(f=>({...f,dosage:e.target.value}))} /></div>
        <div className="form-group"><label className="form-label">Notatki</label><input className="form-input" type="text" placeholder="np. Przed posiłkiem..." value={medForm.notes} onChange={e=>setMedForm(f=>({...f,notes:e.target.value}))} /></div>
        <div className="modal-btns"><button className="btn-secondary" onClick={()=>setAddMedModal(false)}>Anuluj</button><button className="btn-primary" onClick={addCustomMed}>Dodaj</button></div>
      </Modal>

      <Modal open={modal} onClose={()=>setModal(false)} title="Podanie leku">
        <div className="form-group"><label className="form-label">Lek</label><select className="form-select" value={form.med} onChange={e=>setForm(f=>({...f,med:e.target.value}))}>{allMedNames.map(m=><option key={m}>{m}</option>)}</select></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Dawka</label><input className="form-input" type="text" placeholder="np. 2.5 ml" value={form.dose} onChange={e=>setForm(f=>({...f,dose:e.target.value}))} /></div>
          <div className="form-group"><label className="form-label">Godzina</label><input className="form-input" type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} /></div>
        </div>
        <div className="form-group"><label className="form-label">Notatka</label><input className="form-input" type="text" placeholder="opcjonalnie..." value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))} /></div>
        <div className="modal-btns"><button className="btn-secondary" onClick={()=>setModal(false)}>Anuluj</button><button className="btn-primary" onClick={add}>Zapisz</button></div>
      </Modal>

      <Modal open={!!doseModal} onClose={()=>setDoseModal(null)} title={doseModal?.title}>
        {doseModal?.content.map((line,i) => (<div key={i} style={{fontSize:14,color:'var(--text)',padding:'5px 0',borderBottom:i<doseModal.content.length-1?'0.5px solid var(--border)':'none'}}>{line}</div>))}
        <div className="modal-btns" style={{marginTop:16}}><button className="btn-primary" onClick={()=>setDoseModal(null)}>Zamknij</button></div>
      </Modal>

      <Modal open={!!deleteId} onClose={()=>setDeleteId(null)} title="Usuń lek">
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6}}>Czy na pewno chcesz usunąć ten lek z kalkulatora?</p>
        <div className="modal-btns"><button className="btn-secondary" onClick={()=>setDeleteId(null)}>Anuluj</button><button className="btn-primary" style={{background:'var(--coral)'}} onClick={()=>removeCustomMed(deleteId)}>Usuń</button></div>
      </Modal>
    </>
  )
}
