// scripts/preg-store-shots.mjs
//
// Zrzuty trybu ciąży do Sklepu Play (2026-10-06): napis u góry i u dołu jak w
// screenshots-2026-09 (composeShot z generate-screenshots-overlay.mjs).
// Wejście: store-assets/screenshots-preg/{lang}/ (najpierw node scripts/pregnancy-shots.mjs).
// Wynik: store-assets/screenshots-2026-10-preg/{lang}/p1-home.png ... p4-kicks.png
//
// Run: node scripts/preg-store-shots.mjs [pl en ...]

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { composeShot } from './generate-screenshots-overlay.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const IN = path.join(ROOT, 'store-assets', 'screenshots-preg')
const OUT = path.join(ROOT, 'store-assets', 'screenshots-2026-10-preg')

const SHOTS = [
  ['p1-home', 'preg-home', {
    pl: ['Ciąża we dwoje', 'Tydzień, skurcze, ruchy, torba i wyprawka'],
    en: ['Pregnancy, together', 'Weeks, contractions, kicks, bag, essentials'],
    de: ['Schwanger zu zweit', 'Woche, Wehen, Tritte, Tasche, Ausstattung'],
    fr: ['Grossesse à deux', 'Semaine, contractions, mouvements, valise'],
    es: ['Embarazo en pareja', 'Semana, contracciones, movimientos, bolsa'],
  }],
  ['p2-bag', 'preg-bag-after', {
    pl: ['Torba do szpitala we dwoje', 'On odhacza, Ty widzisz to od razu'],
    en: ['Hospital bag, together', 'He ticks it off, you see it right away'],
    de: ['Kliniktasche zu zweit', 'Er hakt ab, Sie sehen es sofort'],
    fr: ['Valise de maternité à deux', 'Il coche, vous le voyez tout de suite'],
    es: ['Bolsa del hospital en pareja', 'Él lo marca, tú lo ves al instante'],
  }],
  ['p3-contractions', 'preg-contractions', {
    pl: ['Skurcze? Jeden przycisk', 'Czas i odstępy na obu telefonach'],
    en: ['Contractions? One button', 'Length and gaps on both your phones'],
    de: ['Wehen? Ein Knopf', 'Dauer und Abstände auf beiden Handys'],
    fr: ['Contractions ? Un bouton', 'Durée et intervalles sur vos deux téléphones'],
    es: ['¿Contracciones? Un botón', 'Duración e intervalos en los dos móviles'],
  }],
  ['p4-kicks', 'preg-kicks', {
    pl: ['Ruchy dziecka', 'Dziennik bez normy do wyrobienia'],
    en: ['Baby movements', 'A diary with no number to hit'],
    de: ['Kindsbewegungen', 'Ein Tagebuch ohne Soll-Zahl'],
    fr: ['Mouvements du bébé', 'Un journal sans chiffre à atteindre'],
    es: ['Movimientos del bebé', 'Un diario sin cifra que alcanzar'],
  }],
]

const LANGS = process.argv.slice(2).length ? process.argv.slice(2) : ['pl', 'en', 'de', 'fr', 'es']
for (const lang of LANGS) {
  fs.mkdirSync(path.join(OUT, lang), { recursive: true })
  for (const [name, src, texts] of SHOTS) {
    const [hook, benefit] = texts[lang]
    if (/[—–]/.test(hook + benefit)) throw new Error(`myślnik: ${lang} ${name}`)
    await composeShot(path.join(IN, lang, `${src}.png`), path.join(OUT, lang, `${name}.png`), hook, benefit)
  }
  console.log(`  ${lang}: ${SHOTS.length} zrzuty`)
}
