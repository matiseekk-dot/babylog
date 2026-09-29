// scripts/build-cheatsheet.mjs
//
// Ściągawka na lodówkę (A4, jedna strona) w 5 językach: progi gorączki według
// wieku, kiedy dzwonić pod numer alarmowy, test szklanki, jak mierzyć
// temperaturę, lokalne numery i miejsce na telefon do pediatry. Kod QR prowadzi
// na skudev.pl/pobierz (Google Play z utm_source=ulotka), jak na karcie A6.
// Treść zgodna z poradnikiem na skudev.pl i z danymi w apce (referenceTables).
// Czytelna także po wydruku w czerni i bieli (pilne wiersze pogrubione i z ramką).
//
// Wynik: store-assets/print/sciagawka-{lang}.pdf i .png (podgląd)
// Run: node scripts/build-cheatsheet.mjs [pl en de fr es]

import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { CHROME_PATH } from './generate-screenshots-overlay.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store-assets', 'print')
const qr = fs.readFileSync(path.join(OUT, 'qr-skudev-pobierz.svg'), 'utf8')
const icon = `data:image/png;base64,${fs.readFileSync(path.join(ROOT, 'public', 'icon-512.png')).toString('base64')}`

const T = {
  pl: {
    app: 'Spokojny Rodzic',
    title: 'Gorączka i objawy alarmowe u dziecka',
    sub: 'Ściągawka na lodówkę, na podstawie wytycznych pediatrów',
    feverTitle: 'Gorączka: kiedy do lekarza',
    feverHead: ['Wiek', 'Temperatura', 'Co zrobić'],
    fever: [
      ['Poniżej 3 miesięcy', 'od 38,0°C', 'Pilnie do lekarza, także w nocy', true],
      ['3 do 6 miesięcy', 'od 38,0°C', 'Skontaktuj się z pediatrą'],
      ['Powyżej 6 miesięcy', 'od 39,0°C', 'Skontaktuj się z pediatrą'],
      ['Powyżej 6 miesięcy', 'ponad 72 h', 'Gorączka trwa: skontaktuj się z pediatrą'],
      ['W każdym wieku', 'od 40,5°C', 'Pilna pomoc lekarska', true],
    ],
    urgentTitle: 'Dzwoń 112 bez czekania, gdy dziecko:',
    urgent: [
      'jest apatyczne, trudno je wybudzić, nie reaguje',
      'ma trudności w oddychaniu, świszczy przy wdechu, ma sine usta',
      'ma drgawki albo sztywny kark',
      'ma plamy, które nie bledną pod szklanką',
      'ślini się i nie może przełknąć',
    ],
    glassTitle: 'Test szklanki',
    glass: ['Dociśnij przezroczystą szklankę do wysypki.', 'Plamy bledną: obserwuj, przy gorączce zadzwoń do pediatry.', 'Plamy NIE bledną: dzwoń 112 od razu.'],
    measureTitle: 'Jak mierzyć temperaturę',
    measure: ['Do 3 miesięcy: w pupie (najdokładniej).', 'Pod pachą: najłatwiej, ale najmniej dokładnie.', 'Na czole od 3. miesiąca, w uchu od 6. miesiąca.'],
    numbersTitle: 'Ważne numery',
    numbers: ['<b>112</b> numer alarmowy', '<b>800 190 590</b> NFZ: gdzie jest nocna i świąteczna opieka'],
    doctor: 'Pediatra / przychodnia',
    phone: 'tel.',
    qrText: 'Pomiary, podane leki i te progi masz też w telefonie. Oboje rodzice widzą te same wpisy.',
    qrCta: 'Spokojny Rodzic, Google Play',
    sources: 'Źródła: KOMPAS GORĄCZKA (Polskie Towarzystwo Pediatryczne), American Academy of Pediatrics, NHS.',
    disclaimer: 'Ściągawka ma charakter informacyjny i nie zastępuje lekarza. Gdy coś Cię niepokoi, dzwoń do lekarza lub pod 112.',
  },
  en: {
    app: 'Calm Parent',
    title: 'Fever and warning signs in children',
    sub: 'A fridge cheat sheet, based on pediatric guidelines',
    feverTitle: 'Fever: when to see a doctor',
    feverHead: ['Age', 'Temperature', 'What to do'],
    fever: [
      ['Under 3 months', '38.0°C (100.4°F)+', 'See a doctor urgently, even at night', true],
      ['3 to 6 months', '38.0°C (100.4°F)+', 'Call your pediatrician'],
      ['Over 6 months', '39.0°C (102.2°F)+', 'Call your pediatrician'],
      ['Over 6 months', 'over 72 h', 'Fever lasting: call your pediatrician'],
      ['Any age', '40.5°C (105°F)+', 'Get urgent medical help', true],
    ],
    urgentTitle: 'Call emergency services right away if your child:',
    urgent: [
      'is floppy, very hard to wake or not responding',
      'struggles to breathe, makes a high-pitched sound breathing in, has blue lips',
      'has a seizure or a stiff neck',
      'has spots that do not fade under a glass',
      'is drooling and unable to swallow',
    ],
    glassTitle: 'The glass test',
    glass: ['Press a clear glass firmly against the rash.', 'Spots fade: keep watching, with a fever call your pediatrician.', 'Spots do NOT fade: call emergency services now.'],
    measureTitle: 'How to take a temperature',
    measure: ['Under 3 months: rectal (most accurate).', 'Armpit: easiest but least accurate.', 'Forehead from 3 months, ear from 6 months.'],
    numbersTitle: 'Emergency numbers',
    numbers: ['<b>911</b> US and Canada', '<b>999</b> UK', '<b>112</b> European Union'],
    doctor: 'Pediatrician / clinic',
    phone: 'phone',
    qrText: 'Readings, medicines given and these thresholds, also on your phone. Both parents see the same entries.',
    qrCta: 'Calm Parent, Google Play',
    sources: 'Sources: American Academy of Pediatrics, NHS.',
    disclaimer: 'This cheat sheet is for information only and does not replace a doctor. If something worries you, call your doctor or emergency services.',
  },
  de: {
    app: 'Calm Parent',
    title: 'Fieber und Warnzeichen beim Kind',
    sub: 'Spickzettel für den Kühlschrank, nach kinderärztlichen Leitlinien',
    feverTitle: 'Fieber: wann zum Arzt',
    feverHead: ['Alter', 'Temperatur', 'Was tun'],
    fever: [
      ['Unter 3 Monaten', 'ab 38,0 °C', 'Sofort zum Arzt, auch nachts', true],
      ['3 bis 6 Monate', 'ab 38,0 °C', 'Kinderarzt kontaktieren'],
      ['Über 6 Monate', 'ab 39,0 °C', 'Kinderarzt kontaktieren'],
      ['Über 6 Monate', 'über 72 Std.', 'Fieber hält an: Kinderarzt kontaktieren'],
      ['Jedes Alter', 'ab 40,5 °C', 'Dringend ärztliche Hilfe', true],
    ],
    urgentTitle: 'Rufen Sie sofort die 112, wenn Ihr Kind:',
    urgent: [
      'apathisch ist, schwer zu wecken ist oder nicht reagiert',
      'schwer atmet, beim Einatmen pfeift oder blaue Lippen hat',
      'krampft oder einen steifen Nacken hat',
      'Flecken hat, die unter einem Glas nicht verblassen',
      'stark sabbert und nicht schlucken kann',
    ],
    glassTitle: 'Der Glastest',
    glass: ['Ein klares Glas fest auf den Ausschlag drücken.', 'Flecken verblassen: beobachten, bei Fieber den Kinderarzt anrufen.', 'Flecken verblassen NICHT: sofort die 112 rufen.'],
    measureTitle: 'Fieber richtig messen',
    measure: ['Unter 3 Monaten: im Po (am genauesten).', 'Unter der Achsel: am einfachsten, aber am ungenauesten.', 'Stirn ab 3 Monaten, Ohr ab 6 Monaten.'],
    numbersTitle: 'Wichtige Nummern',
    numbers: ['<b>112</b> Notruf', '<b>116117</b> ärztlicher Bereitschaftsdienst'],
    doctor: 'Kinderarzt / Praxis',
    phone: 'Tel.',
    qrText: 'Messwerte, gegebene Medikamente und diese Grenzwerte auch auf dem Handy. Beide Eltern sehen dieselben Einträge.',
    qrCta: 'Calm Parent, Google Play',
    sources: 'Quellen: American Academy of Pediatrics, NHS.',
    disclaimer: 'Dieser Spickzettel dient nur der Information und ersetzt keinen Arzt. Wenn Sie etwas beunruhigt, rufen Sie den Arzt oder die 112 an.',
  },
  fr: {
    app: 'Calm Parent',
    title: 'Fièvre et signes d’alerte chez l’enfant',
    sub: 'Pense-bête pour le frigo, d’après les recommandations pédiatriques',
    feverTitle: 'Fièvre : quand consulter',
    feverHead: ['Âge', 'Température', 'Que faire'],
    fever: [
      ['Moins de 3 mois', 'dès 38,0 °C', 'Consultez en urgence, même la nuit', true],
      ['3 à 6 mois', 'dès 38,0 °C', 'Appelez le médecin'],
      ['Plus de 6 mois', 'dès 39,0 °C', 'Appelez le médecin'],
      ['Plus de 6 mois', 'plus de 72 h', 'La fièvre dure : appelez le médecin'],
      ['À tout âge', 'dès 40,5 °C', 'Aide médicale urgente', true],
    ],
    urgentTitle: 'Appelez tout de suite le 15 si votre enfant :',
    urgent: [
      'est très mou, difficile à réveiller ou ne réagit pas',
      'respire difficilement, fait un bruit aigu en inspirant, a les lèvres bleues',
      'fait une convulsion ou a la nuque raide',
      'a des taches qui ne s’effacent pas sous un verre',
      'bave et n’arrive pas à avaler',
    ],
    glassTitle: 'Le test du verre',
    glass: ['Appuyez un verre transparent sur les taches.', 'Les taches s’effacent : surveillez, en cas de fièvre appelez le médecin.', 'Les taches ne s’effacent PAS : appelez le 15 tout de suite.'],
    measureTitle: 'Prendre la température',
    measure: ['Avant 3 mois : rectale (la plus précise).', 'Sous l’aisselle : la plus simple, mais la moins précise.', 'Front dès 3 mois, oreille dès 6 mois.'],
    numbersTitle: 'Numéros utiles',
    numbers: ['<b>15</b> SAMU', '<b>112</b> numéro d’urgence européen'],
    doctor: 'Médecin / cabinet',
    phone: 'tél.',
    qrText: 'Mesures, médicaments donnés et ces seuils, aussi sur votre téléphone. Les deux parents voient les mêmes saisies.',
    qrCta: 'Calm Parent, Google Play',
    sources: 'Sources : American Academy of Pediatrics, NHS.',
    disclaimer: 'Ce pense-bête est informatif et ne remplace pas un médecin. En cas de doute, appelez votre médecin ou le 15.',
  },
  es: {
    app: 'Calm Parent',
    title: 'Fiebre y señales de alarma en niños',
    sub: 'Chuleta para la nevera, según las guías pediátricas',
    feverTitle: 'Fiebre: cuándo ir al médico',
    feverHead: ['Edad', 'Temperatura', 'Qué hacer'],
    fever: [
      ['Menos de 3 meses', 'desde 38,0 °C', 'Al médico con urgencia, incluso de noche', true],
      ['3 a 6 meses', 'desde 38,0 °C', 'Consulta con tu pediatra'],
      ['Más de 6 meses', 'desde 39,0 °C', 'Consulta con tu pediatra'],
      ['Más de 6 meses', 'más de 72 h', 'La fiebre dura: consulta con tu pediatra'],
      ['A cualquier edad', 'desde 40,5 °C', 'Atención médica urgente', true],
    ],
    urgentTitle: 'Llama al 112 sin esperar si tu hijo:',
    urgent: [
      'está decaído, cuesta despertarlo o no reacciona',
      'respira con dificultad, hace ruido agudo al inspirar, tiene los labios azulados',
      'tiene convulsiones o rigidez de nuca',
      'tiene manchas que no desaparecen bajo un vaso',
      'babea y no puede tragar',
    ],
    glassTitle: 'La prueba del vaso',
    glass: ['Presiona un vaso transparente sobre las manchas.', 'Las manchas desaparecen: vigila, si hay fiebre llama al pediatra.', 'Las manchas NO desaparecen: llama al 112 ahora mismo.'],
    measureTitle: 'Cómo tomar la temperatura',
    measure: ['Menos de 3 meses: rectal (la más precisa).', 'Axila: la más fácil, pero la menos precisa.', 'Frente desde los 3 meses, oído desde los 6 meses.'],
    numbersTitle: 'Números importantes',
    numbers: ['<b>112</b> emergencias'],
    doctor: 'Pediatra / centro de salud',
    phone: 'tel.',
    qrText: 'Mediciones, medicamentos dados y estos umbrales, también en tu móvil. Los dos padres ven los mismos registros.',
    qrCta: 'Calm Parent, Google Play',
    sources: 'Fuentes: American Academy of Pediatrics, NHS.',
    disclaimer: 'Esta chuleta es informativa y no sustituye a un médico. Si algo te preocupa, llama a tu médico o al 112.',
  },
}

const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 0; }
body { width: 210mm; height: 297mm; padding: 13mm 14mm 11mm; font-family: 'Segoe UI', Roboto, Arial, sans-serif;
  color: #2A1A12; background: #fff; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 3mm; font-size: 12pt; font-weight: 700; color: #B84E2E; }
.brand img { width: 10mm; height: 10mm; border-radius: 2.4mm; }
h1 { font-size: 24pt; line-height: 1.08; font-weight: 800; letter-spacing: -0.4pt; margin: 4mm 0 1.5mm; }
.sub { font-size: 11pt; color: #5A463C; font-weight: 600; margin-bottom: 5mm; }
h2 { font-size: 13.5pt; font-weight: 800; color: #B84E2E; margin: 0 0 2.2mm; }
table { width: 100%; border-collapse: collapse; font-size: 10.5pt; margin-bottom: 5mm; }
th { text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: .4pt; color: #7A665C; padding: 0 2.5mm 1.5mm; border-bottom: 1.2pt solid #2A1A12; }
td { padding: 2.2mm 2.5mm; border-bottom: .6pt solid #E3D3C8; vertical-align: top; }
td:first-child { font-weight: 700; width: 30%; }
td:nth-child(2) { font-weight: 800; white-space: nowrap; width: 24%; }
tr.urgent td { font-weight: 800; background: #FCE9E4; border-top: 1.2pt solid #C0392B; border-bottom: 1.2pt solid #C0392B; }
.urgentbox { border: 2pt solid #C0392B; border-radius: 3mm; padding: 3.5mm 4.5mm; margin-bottom: 5mm; }
.urgentbox h2 { color: #C0392B; }
.urgentbox ul { list-style: none; display: grid; gap: 1.4mm; }
.urgentbox li { font-size: 10.5pt; line-height: 1.3; padding-left: 6mm; position: relative; font-weight: 600; }
.urgentbox li::before { content: '!'; position: absolute; left: 0; top: 0; width: 4mm; height: 4mm; border-radius: 50%;
  background: #C0392B; color: #fff; font-size: 8pt; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 5mm; }
.box { background: #FBF1EA; border-radius: 3mm; padding: 3.5mm 4mm; }
.box ol, .box ul { padding-left: 4.5mm; display: grid; gap: 1.1mm; font-size: 9.8pt; line-height: 1.3; }
.nums { display: flex; flex-wrap: wrap; gap: 2mm 6mm; font-size: 10.5pt; margin-bottom: 4mm; }
.nums b { font-size: 13pt; margin-right: 1mm; }
.fill { display: flex; gap: 4mm; font-size: 10pt; color: #5A463C; margin-bottom: auto; }
.fill span { flex: 1; border-bottom: .8pt solid #2A1A12; height: 7mm; }
.fill span.short { flex: .55; }
.bottom { display: flex; align-items: center; gap: 5mm; margin-top: 5mm; padding: 3.5mm 4mm; border-radius: 3mm; background: #FBF1EA; }
.qr { width: 27mm; height: 27mm; flex: none; background: #fff; padding: 1.8mm; border-radius: 2mm; }
.qr svg { width: 100%; height: 100%; display: block; }
.qrtext { font-size: 9.8pt; line-height: 1.35; }
.qrtext b { display: block; font-size: 11pt; color: #B84E2E; margin-top: 1mm; }
.foot { margin-top: 3mm; font-size: 7.8pt; color: #7A665C; line-height: 1.35; }
`

function html(L) {
  const t = T[L]
  return `<!doctype html><html lang="${L}"><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="brand"><img src="${icon}">${t.app}</div>
  <h1>${t.title}</h1>
  <div class="sub">${t.sub}</div>
  <h2>${t.feverTitle}</h2>
  <table><thead><tr>${t.feverHead.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    ${t.fever.map(r => `<tr${r[3] ? ' class="urgent"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
  </tbody></table>
  <div class="urgentbox"><h2>${t.urgentTitle}</h2><ul>${t.urgent.map(u => `<li>${u}</li>`).join('')}</ul></div>
  <div class="cols">
    <div class="box"><h2>${t.glassTitle}</h2><ol>${t.glass.map(g => `<li>${g}</li>`).join('')}</ol></div>
    <div class="box"><h2>${t.measureTitle}</h2><ul>${t.measure.map(m => `<li>${m}</li>`).join('')}</ul></div>
  </div>
  <h2>${t.numbersTitle}</h2>
  <div class="nums">${t.numbers.map(n => `<div>${n}</div>`).join('')}</div>
  <div class="fill">${t.doctor}:<span></span>${t.phone}<span class="short"></span></div>
  <div class="bottom">
    <div class="qr">${qr}</div>
    <div class="qrtext">${t.qrText}<b>${t.qrCta}</b></div>
  </div>
  <div class="foot">${t.sources} ${t.disclaimer}</div>
</body></html>`
}

async function main() {
  const langs = process.argv.slice(2).filter(l => T[l])
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new', args: ['--no-sandbox'] })
  const pg = await browser.newPage()
  await pg.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1.5 })
  for (const L of (langs.length ? langs : Object.keys(T))) {
    await pg.setContent(html(L), { waitUntil: 'load' })
    const fits = await pg.evaluate(() => document.body.scrollHeight <= document.body.clientHeight + 1)
    if (!fits) console.warn(`  UWAGA: ${L} nie mieści się na jednej stronie`)
    await pg.pdf({ path: path.join(OUT, `sciagawka-${L}.pdf`), format: 'A4', printBackground: true, pageRanges: '1' })
    await pg.screenshot({ path: path.join(OUT, `sciagawka-${L}.png`), fullPage: false })
    console.log(`  ${L}: sciagawka-${L}.pdf`)
  }
  await browser.close()
}

main().catch(err => { console.error('FAILED:', err); process.exit(1) })
