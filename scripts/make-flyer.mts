// Printable A4 hand-out: the three technologies compared on a fixed 100-room example,
// using the same calculation engine as the app. Writes print/*.html; render to PDF with
// a Chromium browser (see npm run flyer).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { renderSVG } from "uqr";
import { calculate, type CalcResult } from "../src/lib/calc.ts";
import { CONTACT, DEFAULT_SETTINGS, HERO_ID, TECH_BADGES, TECH_IMAGES, type TechnologyId } from "../src/lib/defaults.ts";
import { formatters, strings, techName, type Lang } from "../src/lib/i18n.ts";

const ROOMS = 100;
const YEARS = 10;
const LIVE_URL = "https://sinan-creator.github.io/Minibar-calc/";

interface Variant {
  lang: Lang;
  file: string;
  currency: string;
  tariff: number;
  fx: number;
  /** Country code for the QR deep link. */
  country: string;
  /** Human-readable assumption line for tariff and rate. */
  tariffNote: string;
  marketLabel: string;
}

const VARIANTS: Variant[] = [
  {
    lang: "en",
    file: "elektromarla-minibar-comparison-en",
    currency: "USD",
    tariff: 0.2,
    fx: 1,
    country: "US",
    tariffNote: "electricity at 0.20 USD/kWh (typical commercial tariff)",
    marketLabel: "International example",
  },
  {
    lang: "tr",
    file: "elektromarla-minibar-karsilastirma-tr",
    currency: "TRY",
    tariff: 4.9,
    fx: 50,
    country: "TR",
    tariffNote: "4,90 TL/kWh ticarethane tarifesi (2025 tahmini) · 1 USD = 50 TL",
    marketLabel: "Türkiye örneği",
  },
];

const T = {
  en: {
    title: "Which minibar costs less to own?",
    subtitle: (rooms: string, years: string) =>
      `A ${rooms}-room hotel over ${years}: purchase price plus electricity, side by side. Every figure comes from the same calculation we run live at the stand.`,
    consumption: "Consumption",
    perDay: "kWh/day",
    annualElectricity: "Electricity per year",
    priceUnit: "Price per unit",
    investment: "Initial investment",
    total: (years: string) => `Cost of ownership · ${years}`,
    chart1: "Electricity per minibar, per year",
    chart2: (rooms: string, years: string) => `Total cost · ${rooms} rooms · ${years}`,
    purchase: "Solid: purchase price (all units)",
    electricity: "Light: electricity",
    saves: (pct: string) => `Inverter saves ${pct}%`,
    stripTitle: (rooms: string, from: string, to: string) => `Switching ${rooms} rooms from ${from} to ${to}`,
    perYear: "saved every year",
    payback: "payback of the higher price",
    overYears: (years: string) => `saved over ${years}`,
    vsLine: (name: string, annual: string, payback: string) => `Compared with ${name}: ${annual} a year, payback in ${payback}.`,
    advice: [
      ["5+ years of operation", "Inverter Compressor: lowest running cost, pays back in a few seasons."],
      ["Absolute silence required", "Absorption or Peltier: no compressor, nothing to hear at night."],
      ["Budget project, cool climate", "Peltier: lowest price of the silent options; cooling drops in warm rooms."],
    ],
    assumptions: (rooms: string, note: string, years: string) => `Assumptions: ${rooms} rooms · ${note} · 365 days a year · ${years} horizon · unit prices in USD`,
    scan: "Scan to calculate for your own hotel",
    disclaimer:
      "Estimates for comparison only. Actual consumption varies with ambient temperature, door openings, load and settings. Tariffs and exchange rates are reference values, not live rates.",
  },
  tr: {
    title: "Hangi minibarın sahip olma maliyeti daha düşük?",
    subtitle: (rooms: string, years: string) =>
      `${rooms} odalı bir otel, ${years}: satın alma fiyatı artı elektrik, yan yana. Tüm rakamlar standda canlı yaptığımız hesabın aynısından gelir.`,
    consumption: "Tüketim",
    perDay: "kWh/gün",
    annualElectricity: "Yıllık elektrik",
    priceUnit: "Birim fiyat",
    investment: "İlk yatırım",
    total: (years: string) => `Sahip olma maliyeti · ${years}`,
    chart1: "Minibar başına yıllık elektrik",
    chart2: (rooms: string, years: string) => `Toplam maliyet · ${rooms} oda · ${years}`,
    purchase: "Koyu: satın alma bedeli (tüm adetler)",
    electricity: "Açık: elektrik",
    saves: (pct: string) => `Inverter %${pct} tasarruf`,
    stripTitle: (rooms: string, from: string, to: string) => `${rooms} odada ${from} yerine ${to}`,
    perYear: "her yıl tasarruf",
    payback: "fiyat farkının geri ödemesi",
    overYears: (years: string) => `${years} toplam tasarruf`,
    vsLine: (name: string, annual: string, payback: string) => `${name} ile kıyasla: yılda ${annual}, geri ödeme ${payback}.`,
    advice: [
      ["5 yıl ve üzeri işletme", "Inverter Kompresörlü: en düşük işletme maliyeti, birkaç sezonda kendini öder."],
      ["Tam sessizlik şart", "Absorpsiyonlu veya Peltier: kompresör yok, gece duyulacak hiçbir şey yok."],
      ["Bütçe odaklı, serin iklim", "Peltier: sessiz seçeneklerin en ucuzu; sıcak odalarda soğutma düşer."],
    ],
    assumptions: (rooms: string, note: string, years: string) => `Varsayımlar: ${rooms} oda · ${note} · yılda 365 gün · ${years} ufuk · birim fiyatlar USD`,
    scan: "Kendi oteliniz için hesaplamak üzere okutun",
    disclaimer:
      "Yalnızca karşılaştırma amaçlı tahminlerdir. Gerçek tüketim ortam sıcaklığı, kapı açılışları, yük ve ayarlara göre değişir. Tarife ve kurlar referans değerlerdir, canlı oran değildir.",
  },
} as const;

const COLORS: Record<TechnologyId, string> = { absorption: "#a9b3c4", peltier: "#6f87a9", inverter: "#2b6cf6" };
const dataUri = (path: string, mime: string) => `data:${mime};base64,${readFileSync(path).toString("base64")}`;
const LOGO = dataUri("public/logo.png", "image/png");
const PHOTOS = Object.fromEntries(
  Object.entries(TECH_IMAGES).map(([id, src]) => [id, dataUri(`public${src}`, "image/jpeg")]),
) as Record<TechnologyId, string>;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function render(v: Variant): string {
  const s = strings(v.lang);
  const f = formatters(v.lang);
  const t = T[v.lang];
  const result: CalcResult = calculate(DEFAULT_SETTINGS, { rooms: ROOMS, tariff: v.tariff, fxRate: v.fx, years: YEARS }, YEARS);
  const hero = result.hero;
  const vsAbs = result.comparisons.find((c) => c.competitor.tech.id === "absorption")!;
  const vsPel = result.comparisons.find((c) => c.competitor.tech.id === "peltier")!;
  const money = (n: number) => f.money(n, v.currency);
  const roomsLabel = f.number(ROOMS);
  const yearsLabel = f.years(YEARS);
  const maxKwh = Math.max(...result.results.map((r) => r.tech.dailyKwh * 365));
  const maxTotal = Math.max(...result.results.map((r) => r.totalCost));
  const qr = renderSVG(`${LIVE_URL}?lang=${v.lang}&c=${v.country}&r=${ROOMS}&y=${YEARS}`, { ecc: "M", border: 0, pixelSize: 4, blackColor: "#1c2c59" });

  const cards = result.results
    .map((r) => {
      const isHero = r.tech.id === HERO_ID;
      const facts = s.facts[r.tech.id];
      const badge = TECH_BADGES[r.tech.id];
      return `
      <article class="card ${isHero ? "hero" : ""}">
        <div class="photo"><img src="${PHOTOS[r.tech.id]}" alt=""></div>
        <div class="body">
          <h3><span class="dot" style="background:${COLORS[r.tech.id]}"></span>${esc(techName(r.tech, v.lang))}${badge ? `<span class="badge">${badge}</span>` : ""}</h3>
          <p class="blurb">${esc(s.blurbs[r.tech.id])}</p>
          <dl>
            <div><dt>${esc(s.coolingPerformance)}</dt><dd>${esc(facts.performance.split(" · ")[0])}</dd></div>
            <div><dt>${esc(s.noiseLevel)}</dt><dd>${esc(facts.noise)}</dd></div>
            <div><dt>${esc(t.consumption)}</dt><dd>${f.number(r.tech.dailyKwh, 3)} ${t.perDay}</dd></div>
            <div><dt>${esc(t.annualElectricity)}</dt><dd>${money(r.annualCost)}</dd></div>
            <div><dt>${esc(t.priceUnit)}</dt><dd>${money(r.tech.unitPriceUsd * v.fx)}</dd></div>
            <div><dt>${esc(t.investment)}</dt><dd>${money(r.investment)}</dd></div>
          </dl>
          <div class="total"><span>${esc(t.total(yearsLabel))}</span><strong>${money(r.totalCost)}</strong></div>
        </div>
      </article>`;
    })
    .join("");

  const kwhBars = result.results
    .map((r) => {
      const kwh = r.tech.dailyKwh * 365;
      return `<div class="hbar"><span class="lbl">${esc(techName(r.tech, v.lang))}</span><span class="track"><span class="fill" style="width:${(kwh / maxKwh) * 100}%;background:${COLORS[r.tech.id]}"></span></span><span class="val">${f.number(kwh)} kWh</span></div>`;
    })
    .join("");

  const totalBars = result.results
    .map((r) => {
      const h = (r.totalCost / maxTotal) * 100;
      const invest = (r.investment / r.totalCost) * 100;
      const isHero = r.tech.id === HERO_ID;
      const saving = isHero ? "" : "";
      return `<div class="vcol">
        <div class="vval ${isHero ? "accent" : ""}">${money(r.totalCost)}${isHero ? `<small>${esc(t.saves(f.number((1 - hero.totalCost / vsAbs.competitor.totalCost) * 100)))}</small>` : saving}</div>
        <div class="vtrack"><div class="vbar" style="height:${h}%"><div style="height:${100 - invest}%;background:${COLORS[r.tech.id]};opacity:.38"></div><div style="height:${invest}%;background:${COLORS[r.tech.id]}"></div></div></div>
        <div class="vlbl">${esc(techName(r.tech, v.lang))}</div>
      </div>`;
    })
    .join("");

  const advice = t.advice.map(([h, b]) => `<li><strong>${esc(h)}</strong><span>${esc(b)}</span></li>`).join("");

  return `<!DOCTYPE html>
<html lang="${v.lang}"><head><meta charset="utf-8"><title>Elektromarla · ${esc(t.title)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Segoe UI", Inter, Helvetica, Arial, sans-serif; color: #111827; font-size: 8.6pt; line-height: 1.3; font-variant-numeric: tabular-nums; }
  .page { width: 210mm; height: 297mm; padding: 9mm 12mm 8mm; display: flex; flex-direction: column; gap: 3.4mm; overflow: hidden; }
  header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1.5px solid #1c2c59; padding-bottom: 3mm; }
  header img { height: 13mm; display: block; }
  .tag { margin-top: 1.5mm; font-size: 7pt; letter-spacing: .22em; text-transform: uppercase; color: #1c2c59; font-weight: 700; }
  .meta { text-align: right; color: #5f6b7a; font-size: 7.6pt; }
  .meta b { display: block; color: #1c2c59; font-size: 8.6pt; }
  h1 { margin: 0; font-size: 20pt; letter-spacing: -.02em; color: #1c2c59; line-height: 1.08; }
  .sub { margin: 1.5mm 0 0; color: #5f6b7a; font-size: 8.6pt; max-width: 165mm; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3.5mm; }
  .card { border: 1px solid #e3e8ef; border-radius: 4mm; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
  .card.hero { background: #1c2c59; color: #fff; border-color: #1c2c59; }
  .photo { background: #eceef1; height: 36mm; }
  .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .body { padding: 3mm 3.4mm 3.2mm; display: flex; flex-direction: column; flex: 1; }
  h3 { margin: 0; font-size: 10pt; display: flex; align-items: center; gap: 1.6mm; letter-spacing: -.01em; }
  .dot { width: 2.2mm; height: 2.2mm; border-radius: 50%; display: inline-block; }
  .badge { margin-left: auto; font-size: 7pt; font-weight: 800; padding: .4mm 1.4mm; border-radius: 1mm; background: #fff; color: #1c2c59; }
  .blurb { margin: 1.4mm 0 2.4mm; font-size: 7.4pt; color: #5f6b7a; min-height: 9mm; }
  .hero .blurb { color: rgba(255,255,255,.72); }
  dl { margin: 0; display: grid; gap: 1.1mm; }
  dl div { display: flex; justify-content: space-between; gap: 2mm; font-size: 7.6pt; }
  dt { color: #5f6b7a; } .hero dt { color: rgba(255,255,255,.7); }
  dd { margin: 0; font-weight: 600; text-align: right; }
  .total { margin-top: auto; padding-top: 2.4mm; border-top: 1px solid #e3e8ef; display: flex; flex-direction: column; gap: .4mm; }
  .hero .total { border-color: rgba(255,255,255,.2); }
  .total span { font-size: 6.6pt; letter-spacing: .14em; text-transform: uppercase; color: #5f6b7a; }
  .hero .total span { color: rgba(255,255,255,.65); }
  .total strong { font-size: 14pt; letter-spacing: -.02em; }
  .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5mm; }
  .panel { border: 1px solid #e3e8ef; border-radius: 4mm; padding: 3.2mm 3.6mm; }
  .panel h4 { margin: 0 0 2.6mm; font-size: 9pt; color: #1c2c59; }
  .hbar { display: grid; grid-template-columns: 30mm 1fr 18mm; align-items: center; gap: 2mm; margin-bottom: 2mm; font-size: 7.8pt; }
  .track { height: 5.2mm; background: #f4f6f9; border-radius: 3mm; overflow: hidden; }
  .fill { display: block; height: 100%; border-radius: 3mm; }
  .val { text-align: right; font-weight: 600; }
  .vchart { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; align-items: start; }
  .vcol { text-align: center; }
  .vval { font-size: 8.6pt; font-weight: 700; color: #1c2c59; height: 8mm; display: flex; flex-direction: column; justify-content: flex-end; }
  .vval.accent { color: #2b6cf6; }
  .vval small { font-weight: 500; font-size: 6.6pt; color: #5f6b7a; }
  .vtrack { height: 21mm; display: flex; align-items: flex-end; margin-top: 1.5mm; }
  .vbar { width: 100%; border-radius: 2mm 2mm 0 0; overflow: hidden; display: flex; flex-direction: column; }
  .vlbl { margin-top: 1.4mm; font-size: 7.4pt; color: #111827; height: 7.5mm; line-height: 1.2; }
  .legend { margin-top: 2mm; font-size: 6.8pt; color: #5f6b7a; display: flex; gap: 4mm; }
  .legend i { display: inline-block; width: 2.4mm; height: 2.4mm; border-radius: .6mm; background: #1c2c59; vertical-align: -0.3mm; margin-right: 1.2mm; }
  .legend i.light { opacity: .38; }
  .strip { background: #eaf1ff; border-radius: 4mm; padding: 3.4mm 4mm; display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 3mm; align-items: center; }
  .strip h4 { margin: 0; font-size: 10pt; color: #1c2c59; letter-spacing: -.01em; }
  .strip p { margin: 1.2mm 0 0; font-size: 7.4pt; color: #5f6b7a; }
  .stat b { display: block; font-size: 14.5pt; color: #1c2c59; letter-spacing: -.02em; }
  .stat span { font-size: 7pt; color: #5f6b7a; }
  .advice { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }
  .advice li { list-style: none; background: #f4f6f9; border-radius: 3mm; padding: 2.4mm 3mm; font-size: 7.4pt; }
  .advice strong { display: block; font-size: 6.8pt; letter-spacing: .12em; text-transform: uppercase; color: #5f6b7a; margin-bottom: .8mm; }
  .advice ul { margin: 0; padding: 0; display: contents; }
  footer { margin-top: auto; border-top: 1px solid #e3e8ef; padding-top: 2.4mm; display: grid; grid-template-columns: 1fr 20mm; gap: 4mm; align-items: center; font-size: 6.6pt; color: #5f6b7a; }
  footer .contact { color: #1c2c59; font-weight: 600; font-size: 7.4pt; margin-bottom: .8mm; }
  footer .qr { text-align: center; }
  footer .qr svg { width: 15mm; height: 15mm; display: block; margin: 0 auto .8mm; }
  footer .qr span { display: block; font-size: 5.8pt; line-height: 1.2; }
</style></head>
<body><div class="page">
  <header>
    <div><img src="${LOGO}" alt="Elektromarla miniBar"><div class="tag">${esc(s.tagline)}</div></div>
    <div class="meta"><b>${esc(v.marketLabel)}</b>${esc(s.roomsCount(roomsLabel))} · ${esc(yearsLabel)}</div>
  </header>
  <div>
    <h1>${esc(t.title)}</h1>
    <p class="sub">${esc(t.subtitle(roomsLabel, yearsLabel))}</p>
  </div>
  <section class="cards">${cards}</section>
  <section class="charts">
    <div class="panel"><h4>${esc(t.chart1)}</h4>${kwhBars}</div>
    <div class="panel"><h4>${esc(t.chart2(roomsLabel, yearsLabel))}</h4><div class="vchart">${totalBars}</div>
      <div class="legend"><span><i></i>${esc(t.purchase)}</span><span><i class="light"></i>${esc(t.electricity)} · ${esc(yearsLabel)}</span></div></div>
  </section>
  <section class="strip">
    <div><h4>${esc(t.stripTitle(roomsLabel, techName(vsAbs.competitor.tech, v.lang), techName(hero.tech, v.lang)))}</h4>
      <p>${esc(t.vsLine(techName(vsPel.competitor.tech, v.lang), money(vsPel.annualSavings), f.payback(vsPel.paybackMonths).toLowerCase()))}</p></div>
    <div class="stat"><b>${money(vsAbs.annualSavings)}</b><span>${esc(t.perYear)}</span></div>
    <div class="stat"><b>${esc(f.payback(vsAbs.paybackMonths))}</b><span>${esc(t.payback)}</span></div>
    <div class="stat"><b>${money(vsAbs.cumulativeSavings)}</b><span>${esc(t.overYears(yearsLabel))}</span></div>
  </section>
  <section class="advice"><ul>${advice}</ul></section>
  <footer>
    <div>
      <div class="contact">Elektromarla · ${CONTACT.phone} · ${CONTACT.email} · ${CONTACT.website.replace(/^https?:\/\//, "")}</div>
      <div>${esc(t.assumptions(roomsLabel, v.tariffNote, yearsLabel))}</div>
      <div>${esc(t.disclaimer)}</div>
    </div>
    <div class="qr">${qr}<span>${esc(t.scan)}</span></div>
  </footer>
</div></body></html>`;
}

mkdirSync("print", { recursive: true });
for (const v of VARIANTS) {
  const file = `print/${v.file}.html`;
  writeFileSync(file, render(v));
  console.log("wrote", file);
}
