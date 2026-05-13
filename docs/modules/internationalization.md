# Internationalization Module

## Status

> ⚠️ **Partial** — Translation strings are defined in `src/lib/i18n.ts` for four locales (EN, RW, FR, SW), but **no UI component in `src/components/` or `src/app/` imports or uses them**. The required npm packages (`i18next`, `react-i18next`, `i18next-browser-languagedetector`) are **not listed in `package.json`** and are therefore not installed. The module is entirely inert at runtime.

---

## Purpose

The Internationalization (i18n) module is intended to provide multi-language support for the Pryrox pharmacy management platform. The design targets four locales relevant to the East African market:

| Code | Language | Region |
|------|----------|--------|
| `en` | English | Default / fallback |
| `rw` | Kinyarwanda | Rwanda |
| `fr` | French | Francophone Africa |
| `sw` | Swahili | East Africa |

The module is built around the **i18next** ecosystem, which is the de-facto standard for React/Next.js internationalization. When fully wired, it would allow any UI component to call `useTranslation()` and render locale-appropriate strings without hardcoding English text.

---

## Key Files

| File | Role | Status |
|------|------|--------|
| `src/lib/i18n.ts` | i18next configuration and all translation resources | Defined, not imported anywhere |

No other files are involved. There are no locale JSON files, no `i18n/` directory, no middleware locale detection, and no `next-i18next.config.js`.

---

## `src/lib/i18n.ts` — Detailed Breakdown

### Imports

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
```

All three imports reference packages that are **absent from `package.json`**. Running `npm install` will not install them. Any attempt to import this file at runtime will throw a `MODULE_NOT_FOUND` error.

### Configuration

```typescript
i18n
  .use(LanguageDetector)       // auto-detect browser language
  .use(initReactI18next)       // bind i18next to React context
  .init({
    resources,
    fallbackLng: 'en',         // fall back to English if locale not found
    debug: false,
    interpolation: {
      escapeValue: false       // React already escapes values
    }
  })
```

The configuration is standard and correct. `LanguageDetector` would read `navigator.language` (or `localStorage`, cookies, etc.) to pick the active locale automatically. `fallbackLng: 'en'` ensures English is always shown if a key is missing in the active locale.

### Translation Resources (inline)

All translations are defined as a single inline `resources` object rather than separate JSON files. This is a valid approach for small translation sets.

---

## Translation Key Structure

Keys are flat strings (no nesting). They are grouped by comment into three categories:

### Common Actions

| Key | EN | RW | FR | SW |
|-----|----|----|----|----|
| `save` | Save | Bika | Enregistrer | Hifadhi |
| `cancel` | Cancel | Hagarika | Annuler | Ghairi |
| `edit` | Edit | Hindura | Modifier | Hariri |
| `delete` | Delete | Siba | Supprimer | Futa |
| `add` | Add | Ongeraho | Ajouter | Ongeza |
| `search` | Search | Shakisha | Rechercher | Tafuta |
| `loading` | Loading... | Birategereza... | Chargement... | Inapakia... |

### Navigation Labels

| Key | EN | RW | FR | SW |
|-----|----|----|----|----|
| `dashboard` | Dashboard | Ikibaho | Tableau de bord | Dashibodi |
| `inventory` | Inventory | Ibicuruzwa | Inventaire | Hesabu |
| `pos` | POS | Kugurisha | Point de vente | Mauzo |
| `sales` | Sales | Amagurishwa | Ventes | Mauzo |
| `customers` | Customers | Abakiriya | Clients | Wateja |
| `settings` | Settings | Amagenamiterere | Paramètres | Mipangilio |

### Pharmacy / Domain Labels

| Key | EN | RW | FR | SW |
|-----|----|----|----|----|
| `pharmacy_name` | Pharmacy Name | Izina rya Farumasi | Nom de la pharmacie | Jina la Famasi |
| `patient_name` | Patient Name | Izina ry'Umurwayi | Nom du patient | Jina la Mgonjwa |
| `amount` | Amount | Amafaranga | Montant | Kiasi |
| `coverage` | Coverage | Ubwishingizi | Couverture | Bima |
| `insurance_name` | Insurance Name | Izina ry'Ubwishingizi | Nom de l'assurance | Jina la Bima |
| `policy_number` | Policy Number | Nimero y'Ubwishingizi | Numéro de police | Nambari ya Bima |
| `date` | Date | Itariki | Date | Tarehe |
| `currency` | Currency | Ifaranga | Devise | Sarafu |
| `language` | Language | Ururimi | Langue | Lugha |
| `system_preferences` | System Preferences | Amahitamo ya Sisitemu | Préférences système | Mapendeleo ya Mfumo |

**Total keys per locale: 23**

---

## Current Wiring Status

### What exists

- `src/lib/i18n.ts` — a complete, syntactically correct i18next configuration with 23 translation keys across 4 locales.

### What is missing

| Missing Piece | Impact |
|---------------|--------|
| `i18next` npm package | Module cannot be imported; runtime crash if attempted |
| `react-i18next` npm package | `useTranslation` hook unavailable |
| `i18next-browser-languagedetector` npm package | Automatic locale detection unavailable |
| Import of `src/lib/i18n.ts` in any component or layout | Module is never initialized |
| `useTranslation()` calls in UI components | All UI text is hardcoded English |
| Language switcher UI component | Users have no way to change locale |
| Locale persistence (localStorage / cookie) | No locale preference is saved |
| Next.js `i18n` config in `next.config.js` | No URL-based locale routing (e.g., `/rw/dashboard`) |

### Grep evidence

A full search of `src/components/**` and `src/app/**` for `useTranslation`, `i18n.t(`, `from.*i18n`, and `import.*i18next` returns **zero matches** outside of `src/lib/i18n.ts` itself. Every user-visible string in the application is hardcoded in English.

---

## User Roles

Internationalization, when implemented, would apply to **all roles**:

| Role | Notes |
|------|-------|
| `superadmin` | Platform-level admin; would benefit from EN/FR |
| `pharmacy_owner` | Tenant admin; primary target for RW/FR/SW |
| `pharmacist` | Clinical staff; primary target for RW/SW |
| `cashier` | POS operator; primary target for RW/SW |
| `staff` | General staff; primary target for RW/SW |

The Rwandan market context makes RW (Kinyarwanda) the highest-priority non-English locale.

---

## Database Tables

No database tables are used by this module. Locale preference is not persisted to the database. If a user preference were to be stored, the natural location would be a `locale` column on the `pharmacy_users` or `users` table, or a row in `system_settings` keyed by `pharmacy_id`.

---

## Dependencies

### Required (not installed)

| Package | Purpose | Install Command |
|---------|---------|-----------------|
| `i18next` | Core i18n framework | `npm install i18next` |
| `react-i18next` | React bindings (`useTranslation`, `Trans`, `I18nextProvider`) | `npm install react-i18next` |
| `i18next-browser-languagedetector` | Auto-detect locale from browser/cookie/localStorage | `npm install i18next-browser-languagedetector` |

### Optional (for production use)

| Package | Purpose |
|---------|---------|
| `i18next-http-backend` | Load translations from `/public/locales/` JSON files instead of inline resources |
| `next-i18next` | Next.js-specific wrapper with SSR support and `next.config.js` integration |

---

## How to Complete the Implementation

The following steps would bring this module from `⚠️ Partial` to `✅ Working`:

### Step 1 — Install packages

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### Step 2 — Initialize i18n in the app entry point

Import `src/lib/i18n.ts` in the root layout so it initializes before any component renders:

```typescript
// src/app/layout.tsx
import '@/lib/i18n'  // side-effect import — initializes i18next
```

Because `LanguageDetector` is a browser-only plugin, this import must be guarded or the file must be marked `'use client'` if used in a client component tree. For App Router, the recommended pattern is to initialize i18n in a client component wrapper.

### Step 3 — Use translations in components

```typescript
// Example: src/components/sidebar.tsx
'use client'
import { useTranslation } from 'react-i18next'

export function Sidebar() {
  const { t } = useTranslation()
  return <nav>{t('dashboard')}</nav>
}
```

### Step 4 — Add a language switcher

A `<select>` or dropdown that calls `i18n.changeLanguage('rw')` and persists the choice to `localStorage`.

### Step 5 — Expand translation keys

The current 23 keys cover only a small fraction of the UI. A full implementation would require keys for every user-visible string across all modules (inventory, POS, sales, patients, etc.).

---

## Known Limitations

### 1. Packages not installed

`i18next`, `react-i18next`, and `i18next-browser-languagedetector` are absent from `package.json`. The module cannot function until they are installed.

### 2. No component uses translations

Every user-visible string in the application is hardcoded in English. There are no `useTranslation()` calls, no `t('key')` invocations, and no `<Trans>` components anywhere in the codebase.

### 3. No language switcher UI

There is no component that allows users to select their preferred language. Even after installing the packages and initializing i18n, users would have no way to change the locale through the UI.

### 4. Translation coverage is minimal

Only 23 keys are defined. A production-ready implementation for a pharmacy management system would require hundreds of keys covering all modules, error messages, form labels, table headers, and notification strings.

### 5. No SSR locale support

The current configuration uses `i18next-browser-languagedetector`, which is client-side only. Server-rendered pages (Next.js App Router RSC) would always render in the fallback locale (`en`) on first load, causing a flash of English content before the client hydrates and detects the user's locale. A proper SSR implementation requires `next-i18next` or a custom server-side locale resolution strategy.

### 6. No URL-based locale routing

`next.config.js` does not include an `i18n` configuration block. There is no locale prefix in URLs (e.g., `/rw/dashboard`). This limits SEO and makes it impossible to share locale-specific links.

### 7. Swahili collision in navigation keys

In the SW locale, both `pos` and `sales` are translated as `"Mauzo"` (the Swahili word for "sales/commerce"). This is a translation error — POS and Sales are distinct concepts. The `pos` key should use a more specific term such as `"Duka la Mauzo"` (point of sale) or `"Kiosk"`.
