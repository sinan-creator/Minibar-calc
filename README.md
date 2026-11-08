# Elektromarla Minibar Savings Calculator

Single-page sales tool for hospitality trade fairs. It compares the total cost of ownership of
**Inverter Compressor**, **Absorption** and **Thermoelectric (Peltier)** minibars for a hotel and shows
annual electricity savings, cumulative savings, break-even and payback for the Inverter.

Fully static (Next.js `output: "export"`), no backend, no database, works offline as a PWA.

**Live:** https://sinan-creator.github.io/Minibar-calc/ (deployed by GitHub Actions on every push to `main`).

## Run

```bash
npm install
npm run dev          # development server on http://localhost:3000
npm run build        # static export into ./out
npx serve out        # serve the export locally (what the exhibition device loads)
npm run check        # calculation engine self-check (Node 24, no build needed)
```

Deploy `out/` to any static host (Vercel, Netlify, S3, nginx). After the first online visit the service
worker (`public/sw.js`) caches the whole app, so the iPad / touchscreen keeps working without a connection.
Bump the `CACHE` name in `public/sw.js` on each deploy so devices purge the previous version.
On iPad use Safari → Share → *Add to Home Screen* for a full-screen kiosk experience.

## Where things live

| Path | Purpose |
| --- | --- |
| `src/lib/defaults.ts` | **All configurable constants**: default minibar specs, limits, periods, default country, admin PIN. |
| `src/lib/tariffs.ts` | Estimated commercial tariffs per country and USD reference exchange rates (source + year on every entry). |
| `src/lib/countries.ts` | ISO 3166 countries → ISO 4217 currency. |
| `src/lib/calc.ts` | Pure calculation engine (annual energy, costs, savings, payback). |
| `src/lib/settings.ts` | Administrator settings store (validation, localStorage persistence, JSON import/export). |
| `src/components/` | UI: inputs, headline, technology cards, charts, admin panel, printable summary. |
| `scripts/check-calc.mts` | Runnable assertions for the engine and settings validation. |

### Calculations

```
annual energy (kWh)      = daily consumption × 365 × rooms
annual electricity cost  = annual energy × tariff (local currency / kWh)
initial investment       = unit price (USD) × rooms × exchange rate
total ownership cost     = initial investment + annual electricity cost × years
annual savings           = competitor annual cost − inverter annual cost
additional investment    = (inverter price − competitor price) × rooms × exchange rate
payback (years)          = additional investment / annual savings   (shown in months)
```

### Data honesty

Tariffs and exchange rates are **desk estimates** with a reference year, never live rates. The UI labels
each value as *Estimated · year* (with its source) or *Manual entry*, and the printed summary repeats the
assumptions. Countries without an estimate require the salesperson to type the tariff.

## Languages

English by default, Turkish via the EN/TR switch in the header. All UI strings live in `src/lib/i18n.ts`
(one object per language; TypeScript enforces that both have the same keys). Numbers and currencies follow the
language's locale, country names come from `Intl.DisplayNames`, and the choice is stored on the device and
carried in the URL as `lang=tr` so QR links open in the same language.

## Stand features

- **Attract mode**: after 3 minutes without a touch the screen resets for the next customer and cycles headline
  savings for showcase markets until someone touches it (`ATTRACT_IDLE_MS`, `SHOWCASE_COUNTRIES` in defaults).
- **QR code**: the QR button encodes the current inputs in the URL so the visitor opens the same comparison on
  their phone. Set `NEXT_PUBLIC_PUBLIC_URL=https://your-public-address` at build time so the code points at the
  deployed app rather than the kiosk's localhost. The same URL format works as a deep link from the website.
- **Energy saved**: one large kWh figure per year and over the selected period for the chosen comparison.

## Analytics

Optional, build-time: `NEXT_PUBLIC_GTM_ID` loads a Google Tag Manager container (the deployed build uses the
elektromarla.com container `GTM-K785GZH`, so visits land in the same Google Analytics property as the website);
`NEXT_PUBLIC_GA_ID` loads GA4 directly instead. Custom events are sent through `track()` in `src/lib/analytics.ts`:
`country_select`, `qr_open`, `contact_email`, `contact_whatsapp`, `contact_call`, `print_summary`,
`language_change`, `attract_start`, `reset`. With GTM, add triggers for these dataLayer events to forward them
to GA4; with a direct GA4 ID they arrive automatically. EU visitors of the web version need a cookie consent
banner before analytics may load; the fair kiosk does not.

## Admin Settings

A discreet gear icon in the footer opens a PIN-protected panel where the administrator can edit, for each
technology, the display name, daily consumption (kWh/day), unit price (USD) and active status. Changes
apply instantly to every calculation, chart and the printed summary, and persist in `localStorage`
(`elektromarla.minibar.settings.v1`) across refreshes and offline use. Save / Cancel / Restore defaults, plus
Export JSON and Import JSON for backup or transfer to another device.

The Inverter is the reference technology and cannot be deactivated; at least one competitor must stay active.

**PIN.** Default `1234`. Change it at build time:

```bash
NEXT_PUBLIC_ADMIN_PIN=482913 npm run build
```

> The PIN only keeps customers out of the exhibition screen. Anything shipped in a static bundle can be
> read, so neither the PIN nor `localStorage` is a security boundary.

### Optional: synchronising settings across devices (not implemented)

If several devices must share one set of specifications, add a small authenticated backend instead of
trusting the client:

1. **Store**: one row `settings(version, json, updated_at, updated_by)` in Postgres/Supabase (or Vercel Blob).
2. **Auth**: administrators sign in with a real identity provider (passkeys / OAuth); the server issues
   short-lived sessions. Never put admin credentials in the client bundle.
3. **API**: `GET /api/settings` (public, read-only, cacheable) and `PUT /api/settings` (requires an admin
   session, validates with the same `validateSettings()` schema, writes an audit entry).
4. **Client**: on load, fetch `/api/settings`; on success cache it in `localStorage` as today so offline
   operation continues; the admin panel's Save calls `PUT` and falls back to local-only with a warning when
   offline.

## Technical notes

- Next.js 16 (App Router, static export), React 19, TypeScript strict, Tailwind CSS 4.
- No charting library: the bar chart is CSS, the cumulative/break-even chart is hand-drawn SVG.
- Currency formatting through `Intl.NumberFormat`, country names bundled, so nothing needs the network.
- Results are estimates; actual energy consumption varies by operating conditions (disclaimer shown on screen
  and on the printed page).
