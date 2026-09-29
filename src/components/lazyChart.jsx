// v2.16.13: leniwe wykresy odporne na brak internetu.
//
// React.lazy przy nieudanym imporcie (telefon bez zasięgu, a plik wykresu
// jeszcze nie był pobrany) rzuca błąd i cała zakładka ląduje na ekranie awarii.
// Tutaj brak pliku kończy się krótkim komunikatem, a po zdarzeniu 'online'
// wykres próbuje się załadować ponownie. preloadCharts() pobiera wszystkie
// wykresy w tle po starcie, więc zwykle są już w pamięci, zanim zniknie sieć.
import React, { useEffect, useState } from 'react'
import { t } from '../i18n'

const BOX = { padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }
const loaders = []

export function lazyChart(load) {
  let Comp = null
  let pending = null
  let failedUrl = null
  const get = () => {
    if (!pending) {
      // Chrome pamięta nieudany import danego adresu do końca sesji, więc
      // ponowna próba idzie pod ten sam plik z dopiskiem ?retry=.
      const attempt = failedUrl
        ? import(/* @vite-ignore */ `${failedUrl}${failedUrl.includes('?') ? '&' : '?'}retry=${Date.now()}`)
        : load()
      pending = attempt
        .then(m => { Comp = m.default; return Comp })
        .catch(e => {
          pending = null
          failedUrl = failedUrl || /https?:\/\/[^\s'"]+/.exec(String(e?.message))?.[0] || null
          throw e
        })
    }
    return pending
  }
  loaders.push(get)

  return function LazyChart(props) {
    const [, setLoaded] = useState(!!Comp)
    const [failed, setFailed] = useState(false)
    useEffect(() => {
      if (Comp) return
      let alive = true
      const tryLoad = () => get().then(
        () => { if (alive) setLoaded(true) },
        () => { if (alive) setFailed(true) },
      )
      const onOnline = () => { setFailed(false); tryLoad() }
      tryLoad()
      window.addEventListener('online', onOnline)
      return () => { alive = false; window.removeEventListener('online', onOnline) }
    }, [])
    if (Comp) return <Comp {...props} />
    return <div style={BOX}>{t(failed ? 'chart.offline' : 'chart.loading')}</div>
  }
}

export function preloadCharts() {
  for (const get of loaders) get().catch(() => {})
}
