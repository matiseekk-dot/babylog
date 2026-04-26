import React, { useState, useEffect } from 'react'
import { useLocale } from '../i18n'
// v2.10.2: Lucide ikony dla segmentów Health (Temperatura/Leki/Objawy)
import { Thermometer, Pill, HeartPulse } from 'lucide-react'
import TempTab from './TempTab'
import MedsTab from './MedsTab'
import SymptomsTab from './SymptomsTab'
import QuickDoseCard from './QuickDoseCard'
import { SegmentedSwitcher } from './DailyTab'

/**
 * HealthTab — container dla Temperatury + Leków + Objawów ("tryb chory").
 *
 * v2.9.3: zastępuje osobne taby temp/meds/symptoms z More. Te trzy use case'y
 * są związane semantycznie — gdy dziecko jest chore, rodzic potrzebuje
 * wszystkich trzech blisko siebie. To jest "killer feature" tej apki.
 *
 * UWAGA — apka zdrowotna: świadomie unikamy gamifikacji, streaków, tropieni
 * w tym widoku. Cel: kalmne i kontekstowe wsparcie podczas choroby. Nie
 * zachęcamy do "codziennego logowania temperatury" gdy dziecko jest zdrowe —
 * to generowałoby szum w danych dla pediatry.
 *
 * Aktywny segment zachowywany w localStorage. Domyślnie temp.
 */

const STORAGE_KEY = 'babylog_health_segment'

export default function HealthTab({ ...sharedProps }) {
  useLocale()

  const readStoredSegment = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'temp' || stored === 'meds' || stored === 'symptoms') return stored
    } catch {}
    return 'temp'
  }

  const [segment, setSegment] = useState(readStoredSegment)

  // v2.9.5: mount-time sync — TodayTab może zapisać preferred segment
  // do localStorage tuż przed nawigacją (np. klik temp tile → 'temp',
  // klik med w timeline → 'meds'). Synchronizujemy state przy mount żeby
  // user wylądował na właściwym segmencie nawet jeśli komponent jest
  // cache-owany przez React.
  useEffect(() => {
    const fresh = readStoredSegment()
    if (fresh !== segment) setSegment(fresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectSegment = (seg) => {
    setSegment(seg)
    try { localStorage.setItem(STORAGE_KEY, seg) } catch {}
  }

  return (
    <>
      <SegmentedSwitcher
        segments={[
          { id: 'temp',     labelKey: 'health.seg.temp',     Icon: Thermometer },
          { id: 'meds',     labelKey: 'health.seg.meds',     Icon: Pill },
          { id: 'symptoms', labelKey: 'health.seg.symptoms', Icon: HeartPulse },
        ]}
        active={segment}
        onSelect={selectSegment}
      />
      {segment === 'temp' && <TempTab {...sharedProps} />}
      {segment === 'meds' && (
        <>
          {/* QuickDoseCard pokazuje "minęło Xh od ostatniej dawki paracetamolu/
              ibuprofenu" — kontekstowe wsparcie zaraz nad listą leków. */}
          <QuickDoseCard
            ageMonths={sharedProps.ageMonths}
            onNavigateToMeds={() => {/* już jesteśmy w meds segment */}}
          />
          <MedsTab {...sharedProps} />
        </>
      )}
      {segment === 'symptoms' && <SymptomsTab {...sharedProps} />}
    </>
  )
}
