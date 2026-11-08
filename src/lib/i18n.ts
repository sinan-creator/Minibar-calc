import { useSyncExternalStore } from "react";
import type { Technology, TechnologyId } from "./defaults.ts";
import { formatKwh, formatMoney, formatNumber, formatRate } from "./format.ts";

/**
 * Two-language UI (English default, Turkish). The choice is stored on the device
 * and travels in the URL (`lang`) so QR links open in the same language.
 */
export type Lang = "en" | "tr";
export const LANGS: readonly Lang[] = ["en", "tr"];
export const LOCALES: Record<Lang, string> = { en: "en", tr: "tr-TR" };
const STORAGE_KEY = "elektromarla.minibar.lang";

type TechText = Record<TechnologyId, string>;
type TechFacts = Record<TechnologyId, { principle: string; noise: string; performance: string; idealFor: string }>;

const en = {
  langLabel: "EN",
  // header
  tagline: "Three technologies, one factory",
  savingsCalculator: "Savings Calculator",
  qr: "QR",
  shareQr: "Share as QR code",
  printSummary: "Print summary",
  reset: "Reset",
  resetForNext: "Reset for next customer",
  language: "Language",
  // headline
  estimatedAnnual: (country: string) => `Estimated annual savings · ${country}`,
  headlineBefore: "Your hotel could save",
  headlineAfter: "in electricity costs every year with Elektromarla Inverter Minibars.",
  perYear: "year",
  comparedWith: (name: string) => `compared with ${name} minibars`,
  roomsCount: (n: string) => `${n} rooms`,
  completeDetails: "Complete the hotel details to see the savings for this market.",
  // generic
  years: (n: number) => `${n} ${n === 1 ? "year" : "years"}`,
  months: (n: string) => `${n} months`,
  noPayback: "No payback",
  immediate: "Immediate",
  lessThanMonth: "< 1 month",
  moreThan20Years: "> 20 years",
  reference: "reference",
  estimates: "Estimates",
  emptyState: "Enter valid hotel details on the left to see results.",
  // technologies
  techNames: { absorption: "Absorption", peltier: "Thermoelectric (Peltier)", inverter: "Inverter Compressor" } as TechText,
  blurbs: {
    absorption: "Absolute silence and a compressor-free design. The price of that silence is energy.",
    peltier: "Compact, vibration-free and easy to use. Cooling performance is medium and drops as the room warms up.",
    inverter: "Powerful, efficient and fast cooling. A+++ efficiency; the compressor runs only as hard as needed.",
  } as TechText,
  facts: {
    absorption: { principle: "Ammonia absorption, heating element", noise: "0 dB · completely silent", performance: "Medium · slow pull-down, sensitive to ambient heat", idealFor: "Total silence" },
    peltier: { principle: "Thermoelectric module", noise: "Silent · vibration-free", performance: "Medium · depends on room temperature", idealFor: "Silence on a budget, cool rooms" },
    inverter: { principle: "Variable-speed compressor", noise: "26–29 dB · quiet", performance: "Very high · fast cooling at any room temperature", idealFor: "Lowest running cost, high performance" },
  } as TechFacts,
  rearView: "Rear view",
  mostEfficient: "Most efficient",
  comparing: "Comparing",
  // inputs
  hotelAndMarket: "Hotel & market",
  country: "Country",
  searchCountry: "Search country",
  noMatchingCountry: "No matching country",
  hotelRooms: "Hotel rooms",
  fewerRooms: "Fewer rooms",
  moreRooms: "More rooms",
  electricityTariff: "Electricity tariff",
  currency: "Currency",
  currencyAuto: "Selected automatically from the country.",
  showAmountsIn: "Show amounts in",
  energyClass: (cls: string) => `Energy class ${cls}`,
  exchangeRate: "Exchange rate",
  alreadyUsd: "Prices are already in USD.",
  comparisonPeriod: "Comparison period",
  manualEntry: "Manual entry",
  useEstimate: (year: number) => `Use ${year} estimate`,
  noReference: "No reference value for this market. Confirm with the customer.",
  estimated: (year: number) => `Estimated · ${year}`,
  usdPeg: "USD peg",
  notLive: "Not a live or verified rate.",
  errRooms: (min: number, max: string) => `Enter a whole number between ${min} and ${max}.`,
  errTariffRequired: "Enter the commercial electricity tariff per kWh.",
  errTariffPositive: "Enter a positive tariff.",
  errFxRequired: "Enter how many units of local currency 1 USD buys.",
  errFxPositive: "Enter a positive exchange rate.",
  // cards
  cooling: "Cooling",
  noiseLevel: "Noise level",
  coolingPerformance: "Cooling performance",
  pricePerUnit: "Purchase price per unit",
  initialInvestment: "Initial investment",
  annualEnergy: "Annual energy",
  perUnitPerDay: (kwh: string) => `${kwh} kWh/day per unit`,
  annualElectricityCost: "Annual electricity cost",
  totalCostOver: (years: string) => `Total cost over ${years}`,
  comparedWithTech: (name: string) => `Compared with ${name}`,
  switchTo: (name: string) => `Switch to ${name}`,
  savesPerYear: "Saves per year",
  savesOver: (years: string) => `Saves over ${years}`,
  payback: "Payback",
  energyCut: "Energy cut",
  // charts
  tcoTitle: (years: string) => `Total cost of ownership over ${years}`,
  tcoSubtitle: "Purchase price plus electricity. Lower is better.",
  inverterSaves: (pct: string) => `Inverter saves ${pct}%`,
  purchase: "Purchase",
  electricityOver: (years: string) => `Electricity over ${years}`,
  cumulativeTitle: "Cumulative cost over time",
  cumulativeSubtitle: "Where the lines cross, the Inverter has paid back its higher purchase price.",
  cumulativeAria: "Cumulative ownership cost by year for each technology",
  yearN: (n: number) => `Year ${n}`,
  noBreakEven: "no break-even",
  breakEvenAfter: (years: string) => `break-even after ${years}`,
  breakEvenIn: (when: string) => `break-even in ${when}`,
  // table
  tableTitle: "Side-by-side comparison",
  tableSubtitle: "Every figure the cards show, in one table.",
  metric: "Metric",
  coolingPrinciple: "Cooling principle",
  idealFor: "Ideal for",
  dailyPerUnit: "Daily consumption per unit",
  annualSavingsWith: (name: string) => `Annual savings with ${name}`,
  savingsOver: (years: string) => `Savings over ${years}`,
  paybackPeriod: "Payback period",
  // energy saved
  switchingFrom: (name: string) => `Switching from ${name}`,
  lessElectricity: "less electricity every year",
  over: (years: string) => `over ${years}`,
  // recommendation
  adviceTitle: "Elektromarla's honest advice",
  adviceIntro: "Every hotel has different needs. We make all three technologies in our Istanbul factory, so we can recommend the right one for your project rather than the one we happen to sell.",
  adviceLongTitle: (years: string) => `Operating the hotel for ${years} or more`,
  adviceLongBody: (competitor: string, payback: string) =>
    `Against ${competitor} it pays back its higher price in ${payback} and keeps saving every year after that.`,
  adviceSilenceTitle: "Absolute silence is a must",
  adviceSilenceBody: "Neither has a compressor, so there is nothing for a light sleeper to hear. The price of that silence is electricity.",
  adviceBudgetTitle: "Budget-focused project in a cooler climate",
  adviceBudgetBody: "The lowest purchase price of the silent options; make sure summer room temperatures stay moderate.",
  or: "or",
  // contact / next step
  nextStepTitle: "Ready to talk numbers for your hotel?",
  nextStepIntro: "Send this estimate to your inbox or reach the Elektromarla team directly. The figures and a link to this calculation are included.",
  emailSummary: "Email this summary",
  whatsapp: "WhatsApp",
  call: "Call",
  emailSubject: (country: string, rooms: string) => `Minibar electricity savings estimate · ${country} · ${rooms} rooms`,
  emailBody: (p: { country: string; rooms: string; competitor: string; annual: string; usd: string | null; payback: string; years: string; periodSavings: string; tariff: string; fx: string; url: string }) =>
    [
      `Minibar electricity savings estimate`,
      `${p.country} · ${p.rooms} rooms`,
      ``,
      `Elektromarla Inverter vs ${p.competitor}:`,
      `• Annual electricity savings: ${p.annual}${p.usd ? ` (≈ ${p.usd})` : ""}`,
      `• Payback of the higher purchase price: ${p.payback}`,
      `• Savings over ${p.years}: ${p.periodSavings}`,
      ``,
      `Assumptions: tariff ${p.tariff} per kWh · ${p.fx}`,
      `Open the full calculation: ${p.url}`,
      ``,
      `Elektromarla · 3 technologies, one factory · since 1954`,
    ].join("\n"),
  // share
  shareTitle: "Take this calculation with you",
  shareSubtitle: "Scan with your phone camera to open the same comparison, ready to print or forward.",
  hotel: "Hotel",
  annualSavings: "Annual electricity savings",
  paybackVs: (name: string) => `Payback vs ${name}`,
  localOnly: "This address only works on this device. Set NEXT_PUBLIC_PUBLIC_URL to the public web address before the fair.",
  done: "Done",
  // attract
  roomHotel: (rooms: number, country: string) => `${rooms}-room hotel · ${country}`,
  attractBefore: "Save",
  attractAfter: "a year on minibar electricity.",
  attractSub: (competitor: string, usd: string | null, year: number) =>
    `Elektromarla Inverter instead of ${competitor} minibars${usd ? ` · ≈ ${usd}` : ""} · estimated ${year} tariff`,
  attractFallback: "Cut minibar electricity costs by up to 86%.",
  touchToStart: "Touch to calculate for your hotel",
  minibarSavingsCalculator: "Minibar Savings Calculator",
  // admin
  adminSettings: "Administrator settings",
  adminAccess: "Administrator access",
  enterPin: "Enter the PIN to edit minibar specifications.",
  adminPin: "Administrator PIN",
  incorrectPin: "Incorrect PIN.",
  tooManyAttempts: (s: number) => `Too many attempts. Try again in ${s} seconds.`,
  cancel: "Cancel",
  unlock: "Unlock",
  minibarSpecs: "Minibar specifications",
  specsIntro: "Changes apply to every calculation, chart and printed summary on this device.",
  usingDefaults: "Currently using factory defaults.",
  usingCustom: "Custom values are saved on this device.",
  exportJson: "Export JSON",
  importJson: "Import JSON",
  defaultsRestored: "Defaults restored and applied.",
  imported: (file: string) => `Imported "${file}". Review the values, then press Save.`,
  displayName: "Display name",
  consumptionField: "Consumption (kWh/day)",
  unitPriceField: "Unit price (USD)",
  active: "Active",
  heroAlwaysActive: "The reference technology is always active",
  referenceNote: "Reference technology: all savings and payback figures are measured against it.",
  keepOneCompetitor: "Keep at least one competitor technology active.",
  restoreDefaults: "Restore defaults",
  save: "Save",
  // print
  printTitle: "Minibar electricity savings summary",
  printIncomplete: "Inputs were incomplete when this summary was printed.",
  netOfExtra: (v: string) => `net of extra purchase cost: ${v}`,
  comparison: "Comparison",
  technology: "Technology",
  priceUnit: "Price / unit",
  totalOver: (years: string) => `Total over ${years}`,
  savingsWith: (name: string) => `Savings with ${name}`,
  comparedWithCol: "Compared with",
  energySavedYear: "Energy saved / year",
  savingsYear: "Savings / year",
  additionalInvestment: "Additional investment",
  assumptions: "Assumptions",
  tariffNoteEstimated: (year: number, source: string) => `Estimated, reference year ${year}. ${source}.`,
  tariffNoteManual: "Manually entered by the salesperson.",
  fxNoteEstimated: (year: number, source: string) => `Estimated reference, ${year}. ${source}.`,
  perKwh: "per kWh",
  operatingDays: "Operating days",
  operatingDaysValue: "365 per year, 24 h per day",
  specsTitle: "Minibar specifications",
  perUnit: "/ unit",
  disclaimer:
    "Results are estimates for comparison purposes only. Actual energy consumption varies with ambient temperature, door openings, load, thermostat settings and operating conditions. Tariffs and exchange rates marked as estimates are desk references for the stated year, not live or verified rates. Confirm current values with the customer before quoting.",
};

export type Strings = typeof en;

const tr: Strings = {
  langLabel: "TR",
  tagline: "Üç teknoloji, tek fabrika",
  savingsCalculator: "Tasarruf Hesaplayıcı",
  qr: "QR",
  shareQr: "QR kod olarak paylaş",
  printSummary: "Özeti yazdır",
  reset: "Sıfırla",
  resetForNext: "Yeni müşteri için sıfırla",
  language: "Dil",
  estimatedAnnual: (country) => `Tahmini yıllık tasarruf · ${country}`,
  headlineBefore: "Oteliniz Elektromarla Inverter Minibarlarla her yıl elektrikten",
  headlineAfter: "tasarruf edebilir.",
  perYear: "yıl",
  comparedWith: (name) => `${name} minibarlara kıyasla`,
  roomsCount: (n) => `${n} oda`,
  completeDetails: "Bu pazar için tasarrufu görmek üzere otel bilgilerini tamamlayın.",
  years: (n) => `${n} yıl`,
  months: (n) => `${n} ay`,
  noPayback: "Geri ödeme yok",
  immediate: "Hemen",
  lessThanMonth: "< 1 ay",
  moreThan20Years: "> 20 yıl",
  reference: "referans",
  estimates: "Tahmini",
  emptyState: "Sonuçları görmek için otel bilgilerini girin.",
  techNames: { absorption: "Absorpsiyonlu", peltier: "Termoelektrik (Peltier)", inverter: "Inverter Kompresörlü" },
  blurbs: {
    absorption: "Mutlak sessizlik ve kompresörsüz tasarım. Bu sessizliğin bedeli enerjidir.",
    peltier: "Kompakt, titreşimsiz ve kullanımı kolay. Soğutma performansı orta düzeydedir, oda ısındıkça düşer.",
    inverter: "Güçlü, verimli ve hızlı soğutma. A+++ verimlilik; kompresör yalnızca ihtiyaç kadar çalışır.",
  },
  facts: {
    absorption: { principle: "Rezistanslı, amonyaklı soğutma", noise: "0 dB · tamamen sessiz", performance: "Orta · yavaş soğur, ortam ısısına duyarlı", idealFor: "Tam sessizlik" },
    peltier: { principle: "Termoelektrik modül", noise: "Sessiz · titreşimsiz", performance: "Orta · ortam sıcaklığına bağlı", idealFor: "Bütçeli sessizlik, serin odalar" },
    inverter: { principle: "Değişken hızlı kompresör", noise: "26–29 dB · sessize yakın", performance: "Çok yüksek · her oda sıcaklığında hızlı soğutma", idealFor: "En düşük işletme maliyeti, yüksek performans" },
  },
  rearView: "Arka görünüş",
  mostEfficient: "En verimli",
  comparing: "Karşılaştırılan",
  hotelAndMarket: "Otel ve pazar",
  country: "Ülke",
  searchCountry: "Ülke ara",
  noMatchingCountry: "Eşleşen ülke yok",
  hotelRooms: "Oda sayısı",
  fewerRooms: "Daha az oda",
  moreRooms: "Daha çok oda",
  electricityTariff: "Elektrik tarifesi",
  currency: "Para birimi",
  currencyAuto: "Ülkeye göre otomatik seçilir.",
  showAmountsIn: "Tutarları göster",
  energyClass: (cls) => `Enerji sınıfı ${cls}`,
  exchangeRate: "Döviz kuru",
  alreadyUsd: "Fiyatlar zaten USD.",
  comparisonPeriod: "Karşılaştırma süresi",
  manualEntry: "Manuel giriş",
  useEstimate: (year) => `${year} tahminini kullan`,
  noReference: "Bu pazar için referans değer yok. Müşteriyle teyit edin.",
  estimated: (year) => `Tahmini · ${year}`,
  usdPeg: "USD'ye sabit",
  notLive: "Canlı veya doğrulanmış bir oran değildir.",
  errRooms: (min, max) => `${min} ile ${max} arasında tam sayı girin.`,
  errTariffRequired: "kWh başına ticari elektrik tarifesini girin.",
  errTariffPositive: "Pozitif bir tarife girin.",
  errFxRequired: "1 USD'nin kaç birim yerel para ettiğini girin.",
  errFxPositive: "Pozitif bir kur girin.",
  cooling: "Soğutma",
  noiseLevel: "Ses seviyesi",
  coolingPerformance: "Soğutma performansı",
  pricePerUnit: "Birim satın alma fiyatı",
  initialInvestment: "İlk yatırım",
  annualEnergy: "Yıllık enerji",
  perUnitPerDay: (kwh) => `birim başına ${kwh} kWh/gün`,
  annualElectricityCost: "Yıllık elektrik maliyeti",
  totalCostOver: (years) => `${years} toplam maliyet`,
  comparedWithTech: (name) => `${name} ile karşılaştırma`,
  switchTo: (name) => `${name} tercih edilirse`,
  savesPerYear: "Yıllık tasarruf",
  savesOver: (years) => `${years} tasarruf`,
  payback: "Geri ödeme",
  energyCut: "Enerji azalması",
  tcoTitle: (years) => `${years} toplam sahip olma maliyeti`,
  tcoSubtitle: "Satın alma fiyatı artı elektrik. Düşük olan daha iyi.",
  inverterSaves: (pct) => `Inverter %${pct} tasarruf`,
  purchase: "Satın alma",
  electricityOver: (years) => `${years} elektrik`,
  cumulativeTitle: "Zaman içinde kümülatif maliyet",
  cumulativeSubtitle: "Çizgilerin kesiştiği noktada Inverter yüksek satın alma fiyatını geri ödemiştir.",
  cumulativeAria: "Her teknoloji için yıllara göre kümülatif sahip olma maliyeti",
  yearN: (n) => `${n}. yıl`,
  noBreakEven: "başabaş yok",
  breakEvenAfter: (years) => `başabaş ${years} sonra`,
  breakEvenIn: (when) => `başabaş: ${when}`,
  tableTitle: "Yan yana karşılaştırma",
  tableSubtitle: "Kartlardaki tüm rakamlar tek tabloda.",
  metric: "Ölçüt",
  coolingPrinciple: "Soğutma prensibi",
  idealFor: "Kimin için ideal",
  dailyPerUnit: "Birim başına günlük tüketim",
  annualSavingsWith: (name) => `${name} ile yıllık tasarruf`,
  savingsOver: (years) => `${years} tasarruf`,
  paybackPeriod: "Geri ödeme süresi",
  switchingFrom: (name) => `${name} yerine`,
  lessElectricity: "her yıl daha az elektrik",
  over: (years) => `${years} boyunca`,
  adviceTitle: "Elektromarla'nın dürüst tavsiyesi",
  adviceIntro: "Her otelin ihtiyacı farklıdır. Üç teknolojiyi de İstanbul'daki fabrikamızda ürettiğimiz için elimizdekini değil, projenize uygun olanı öneririz.",
  adviceLongTitle: (years) => `Oteli ${years} ve daha uzun işletecekseniz`,
  adviceLongBody: (competitor, payback) => `${competitor} karşısında yüksek fiyatını ${payback} içinde geri öder, sonra her yıl tasarruf ettirmeye devam eder.`,
  adviceSilenceTitle: "Tam sessizlik şartsa",
  adviceSilenceBody: "İkisinde de kompresör yok; hafif uyuyan bir misafirin duyacağı hiçbir şey olmaz. Bu sessizliğin bedeli elektriktir.",
  adviceBudgetTitle: "Serin iklimde bütçe odaklı proje",
  adviceBudgetBody: "Sessiz seçeneklerin en düşük satın alma fiyatı; yaz aylarında oda sıcaklıklarının ılımlı kaldığından emin olun.",
  or: "veya",
  nextStepTitle: "Oteliniz için rakamları konuşalım mı?",
  nextStepIntro: "Bu tahmini e-postanıza gönderin veya Elektromarla ekibine doğrudan ulaşın. Rakamlar ve bu hesabın linki mesaja eklenir.",
  emailSummary: "Özeti e-posta ile gönder",
  whatsapp: "WhatsApp",
  call: "Ara",
  emailSubject: (country, rooms) => `Minibar elektrik tasarrufu tahmini · ${country} · ${rooms} oda`,
  emailBody: (p) =>
    [
      `Minibar elektrik tasarrufu tahmini`,
      `${p.country} · ${p.rooms} oda`,
      ``,
      `Elektromarla Inverter, ${p.competitor} karşısında:`,
      `• Yıllık elektrik tasarrufu: ${p.annual}${p.usd ? ` (≈ ${p.usd})` : ""}`,
      `• Yüksek satın alma fiyatının geri ödemesi: ${p.payback}`,
      `• ${p.years} toplam tasarruf: ${p.periodSavings}`,
      ``,
      `Varsayımlar: tarife ${p.tariff} / kWh · ${p.fx}`,
      `Hesabın tamamı: ${p.url}`,
      ``,
      `Elektromarla · Tek fabrikada 3 teknoloji · 1954'ten beri`,
    ].join("\n"),
  shareTitle: "Bu hesabı yanınıza alın",
  shareSubtitle: "Telefon kameranızla okutun; aynı karşılaştırma yazdırmaya ve iletmeye hazır açılır.",
  hotel: "Otel",
  annualSavings: "Yıllık elektrik tasarrufu",
  paybackVs: (name) => `${name} karşısında geri ödeme`,
  localOnly: "Bu adres yalnızca bu cihazda çalışır. Fuardan önce NEXT_PUBLIC_PUBLIC_URL değişkenine herkese açık web adresini verin.",
  done: "Tamam",
  roomHotel: (rooms, country) => `${rooms} odalı otel · ${country}`,
  attractBefore: "Minibar elektriğinden yılda",
  attractAfter: "tasarruf edin.",
  attractSub: (competitor, usd, year) => `${competitor} yerine Elektromarla Inverter${usd ? ` · ≈ ${usd}` : ""} · ${year} tahmini tarife`,
  attractFallback: "Minibar elektrik maliyetini %86'ya kadar düşürün.",
  touchToStart: "Oteliniz için hesaplamak üzere dokunun",
  minibarSavingsCalculator: "Minibar Tasarruf Hesaplayıcı",
  adminSettings: "Yönetici ayarları",
  adminAccess: "Yönetici girişi",
  enterPin: "Minibar özelliklerini düzenlemek için PIN girin.",
  adminPin: "Yönetici PIN",
  incorrectPin: "PIN hatalı.",
  tooManyAttempts: (s) => `Çok fazla deneme. ${s} saniye sonra tekrar deneyin.`,
  cancel: "Vazgeç",
  unlock: "Aç",
  minibarSpecs: "Minibar özellikleri",
  specsIntro: "Değişiklikler bu cihazdaki tüm hesaplara, grafiklere ve yazdırılan özete uygulanır.",
  usingDefaults: "Şu an fabrika varsayılanları kullanılıyor.",
  usingCustom: "Özel değerler bu cihazda kayıtlı.",
  exportJson: "JSON dışa aktar",
  importJson: "JSON içe aktar",
  defaultsRestored: "Varsayılanlar geri yüklendi ve uygulandı.",
  imported: (file) => `"${file}" içe aktarıldı. Değerleri kontrol edip Kaydet'e basın.`,
  displayName: "Görünen ad",
  consumptionField: "Tüketim (kWh/gün)",
  unitPriceField: "Birim fiyat (USD)",
  active: "Aktif",
  heroAlwaysActive: "Referans teknoloji her zaman aktiftir",
  referenceNote: "Referans teknoloji: tüm tasarruf ve geri ödeme rakamları buna göre ölçülür.",
  keepOneCompetitor: "En az bir rakip teknoloji aktif kalmalı.",
  restoreDefaults: "Varsayılanlara dön",
  save: "Kaydet",
  printTitle: "Minibar elektrik tasarrufu özeti",
  printIncomplete: "Bu özet yazdırılırken girdiler eksikti.",
  netOfExtra: (v) => `ek satın alma maliyeti düşülmüş: ${v}`,
  comparison: "Karşılaştırma",
  technology: "Teknoloji",
  priceUnit: "Birim fiyat",
  totalOver: (years) => `${years} toplam`,
  savingsWith: (name) => `${name} ile tasarruf`,
  comparedWithCol: "Karşılaştırılan",
  energySavedYear: "Yıllık enerji tasarrufu",
  savingsYear: "Yıllık tasarruf",
  additionalInvestment: "Ek yatırım",
  assumptions: "Varsayımlar",
  tariffNoteEstimated: (year, source) => `Tahmini, referans yılı ${year}. ${source}.`,
  tariffNoteManual: "Satış temsilcisi tarafından manuel girildi.",
  fxNoteEstimated: (year, source) => `Tahmini referans, ${year}. ${source}.`,
  perKwh: "/ kWh",
  operatingDays: "Çalışma günü",
  operatingDaysValue: "Yılda 365 gün, günde 24 saat",
  specsTitle: "Minibar özellikleri",
  perUnit: "/ adet",
  disclaimer:
    "Sonuçlar yalnızca karşılaştırma amaçlı tahminlerdir. Gerçek enerji tüketimi ortam sıcaklığı, kapı açılışları, yük, termostat ayarı ve çalışma koşullarına göre değişir. Tahmini olarak işaretlenen tarifeler ve kurlar belirtilen yıla ait masa başı referanslardır; canlı veya doğrulanmış oranlar değildir. Teklif vermeden önce güncel değerleri müşteriyle teyit edin.",
};

const DICT: Record<Lang, Strings> = { en, tr };

export const isLang = (v: unknown): v is Lang => v === "en" || v === "tr";

// ---- store -------------------------------------------------------------------

const listeners = new Set<() => void>();
let cached: Lang | null | undefined;

function readStorage(): Lang | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return isLang(v) ? v : null;
}
const getSnapshot = () => (cached === undefined ? (cached = readStorage()) : cached);
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setLang(lang: Lang) {
  cached = lang;
  window.localStorage.setItem(STORAGE_KEY, lang);
  for (const fn of listeners) fn();
}

/** Stored language, or null when the user never chose one (callers fall back to the URL, then English). */
export function useStoredLang(): Lang | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export const strings = (lang: Lang): Strings => DICT[lang];

/** Phrase-level translation of the tariff / FX source notes (institution names stay as they are). */
const SOURCE_PHRASES_TR: ReadonlyArray<readonly [string, string]> = [
  ["Desk estimate from Eurostat non-household electricity prices incl. taxes", "Eurostat hane dışı elektrik fiyatlarından (vergiler dahil) masa başı tahmin"],
  ["Desk estimate from EPDK regulated business (ticarethane) tariff incl. taxes", "EPDK düzenlemeli ticarethane tarifesinden (vergiler dahil) masa başı tahmin"],
  ["Desk estimate, 2026 market rate (volatile: confirm daily)", "Masa başı tahmin, 2026 piyasa kuru (oynak: günlük teyit edin)"],
  ["Desk estimate, 2025 market rate (volatile: confirm daily)", "Masa başı tahmin, 2025 piyasa kuru (oynak: günlük teyit edin)"],
  ["Desk estimate, 2025 market average (volatile)", "Masa başı tahmin, 2025 piyasa ortalaması (oynak)"],
  ["Desk estimate, 2025 market average", "Masa başı tahmin, 2025 piyasa ortalaması"],
  ["Desk estimate, 2025 official rate", "Masa başı tahmin, 2025 resmi kur"],
  ["Desk estimate, Central Bank of Libya official rate", "Masa başı tahmin, Libya Merkez Bankası resmi kuru"],
  ["Official USD peg", "Resmi USD sabit kuru"],
  ["Managed USD peg", "Yönetilen USD sabit kuru"],
  ["Linked exchange rate system", "Bağlı kur sistemi"],
  ["Official CBI rate", "Resmi CBI kuru"],
  ["Fixed to EUR; derived from EUR estimate", "EUR'ya sabit; EUR tahmininden türetildi"],
  ["Base currency", "Temel para birimi"],
  ["(heavily subsidised)", "(yoğun sübvansiyonlu)"],
  ["(subsidised)", "(sübvansiyonlu)"],
  ["commercial tariff", "ticari tarife"],
  ["commercial tariffs", "ticari tarifeler"],
  ["commercial (hotel) tariff", "ticari (otel) tarife"],
  ["non-residential tariff", "mesken dışı tarife"],
  ["non-domestic", "mesken dışı"],
  ["non-household tariffs", "hane dışı tarifeler"],
  ["business tariff statistics", "işletme tarife istatistikleri"],
  ["small-business tariffs", "küçük işletme tarifeleri"],
  ["Desk estimate from", "Masa başı tahmin:"],
  ["incl. fuel surcharge", "yakıt ek ücreti dahil"],
  ["price statistics", "fiyat istatistikleri"],
  ["average commercial retail price", "ortalama ticari perakende fiyatı"],
];

export function localizeSource(source: string, lang: Lang): string {
  if (lang === "en") return source;
  return SOURCE_PHRASES_TR.reduce((text, [en, tr]) => text.split(en).join(tr), source);
}

/** Display name for a technology: localized default names, custom admin names as typed. */
export function techName(t: Technology, lang: Lang): string {
  return t.name === en.techNames[t.id] ? DICT[lang].techNames[t.id] : t.name;
}

/** Locale-bound formatters plus the few strings that depend on both. */
export function formatters(lang: Lang) {
  const locale = LOCALES[lang];
  const s = DICT[lang];
  return {
    money: (value: number, currency: string, opts: { digits?: number; compact?: boolean } = {}) =>
      formatMoney(value, currency, { ...opts, locale }),
    rate: (value: number, currency: string) => formatRate(value, currency, locale),
    number: (value: number, maxFrac = 0) => formatNumber(value, maxFrac, locale),
    kwh: (value: number) => formatKwh(value, locale),
    years: (n: number) => s.years(n),
    payback: (months: number | null) => {
      if (months === null) return s.noPayback;
      if (months <= 0) return s.immediate;
      if (months < 1) return s.lessThanMonth;
      if (months >= 240) return s.moreThan20Years;
      return s.months(formatNumber(months, months < 10 ? 1 : 0, locale));
    },
  };
}

export type Formatters = ReturnType<typeof formatters>;
