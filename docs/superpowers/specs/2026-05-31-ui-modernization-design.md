# UI Modernization — Design Spec
**Date:** 2026-05-31  
**Scope:** Frontend only (`frontend/src/`)  
**Approach:** Option B — Design token layer + page-level polish (no layout logic rewrites)

---

## 1. Goals

- Unify the visual language across all 16 pages (encadrant + étudiant)
- Replace inconsistent inline `CSSProperties` styles with Tailwind classes throughout
- Establish a coherent Academic/Institutional design system (navy + warm gray)
- Improve readability, spacing, and visual hierarchy without touching business logic
- Introduce Inter + Lora typography pairing

---

## 2. Design System

### 2.1 Color Tokens

**Navy** — custom colors added to `tailwind.config.ts` under `theme.extend.colors.navy`:

```js
navy: {
  50:  '#f0f4fb',
  100: '#e8eef7',
  500: '#2d5fa3',
  700: '#1a3a6b',
  900: '#0f2044',
}
```

**Warm Gray** — use Tailwind's built-in `stone-*` palette directly (values match exactly):
- `stone-900` (`#1c1917`) — primary text
- `stone-600` (`#57534e`) — secondary text, labels
- `stone-300` (`#d6d3d1`) — borders, dividers
- `stone-100` (`#f5f4f2`) — page background
- `stone-50`  (`#faf9f8`) — card / panel background

No custom CSS variables needed for grays — avoids conflict with Tailwind's default `gray-*` palette.

Semantic colors use standard Tailwind classes:
- Success: `green-600` / `green-100`
- Warning: `amber-600` / `amber-100`
- Destructive: `red-600` / `red-100`
- Info: reuses `navy-500`

### 2.2 Typography

Two Google Fonts loaded in `layout.tsx`:
- **Lora** (serif) — `font-lora` — used for `h1`, `h2`, page titles, statement text
- **Inter** (sans-serif) — `font-inter` — used for all UI text, labels, buttons, body

Scale (Tailwind defaults, no custom additions needed):
| Usage | Class |
|---|---|
| Page title | `text-2xl font-lora font-bold text-navy-900` |
| Section heading | `text-lg font-lora font-semibold text-navy-900` |
| Label | `text-sm font-medium text-gray-600` |
| Body | `text-base text-gray-900` |
| Caption / meta | `text-sm text-gray-500` |

### 2.3 Surfaces & Depth

- Page background: `bg-stone-100` (warm off-white, replaces all blue gradients)
- Default card: `bg-stone-50 rounded-xl border border-gray-200 shadow-sm`
- Elevated card: `bg-white rounded-xl shadow-md`
- Border radius standard: `rounded-xl` cards, `rounded-lg` inputs/buttons
- Shadows: only `shadow-sm` and `shadow-md` — no heavy shadows on inline elements

---

## 3. Component Standards

### 3.1 Buttons

| Variant | When | Tailwind classes |
|---|---|---|
| Primary | Create, Save, Submit | `bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2` |
| Secondary | Cancel, Back | `bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors` |
| Destructive | Delete, Remove | `bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-medium transition-colors` |
| Ghost | Icon actions, Logout | `text-gray-600 hover:text-navy-700 hover:bg-gray-100 rounded-lg p-2 transition-colors` |
| Success | Publish / Launch | `bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 font-medium transition-colors` |
| Warning | Unpublish | `bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-4 py-2 font-medium transition-colors` |

### 3.2 Form Inputs

```
Base:     w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base
          text-gray-900 placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent
          transition-colors
Label:    block text-sm font-medium text-gray-600 mb-1
Error:    border-red-500 focus:ring-red-500
Textarea: same as input + resize-none
```

### 3.3 Status Badges

All: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium`

| State | Classes |
|---|---|
| Draft | `bg-amber-100 text-amber-800 border border-amber-200` |
| Published | `bg-green-100 text-green-800 border border-green-200` |
| Feedback received | `bg-navy-100 text-navy-800 border border-navy-200` |
| Pending | `bg-gray-100 text-gray-600 border border-gray-200` |

### 3.4 Affirmation Item Cards (drag panels)

```
Base:    bg-white rounded-lg border border-gray-200 p-3 shadow-sm
         hover:shadow-md transition-shadow cursor-grab
False:   border-l-4 border-red-400
True:    border-l-4 border-green-400
Neutral: border-l-4 border-gray-300
```

---

## 4. Page-by-Page Changes

### 4.1 Auth Pages (landing, encadrant/login, etudiant/login)

**Layout change:** Split-screen on desktop.
- Left panel (35%): `bg-navy-900` — Le Mans Université logo + "TrAP" wordmark in `font-lora text-white`, short tagline
- Right panel (65%): `bg-gray-100` — centered form card `bg-white rounded-xl shadow-md p-8 w-full max-w-sm`
- Mobile: left panel collapses, shows logo at top of form card

**Style changes:**
- All inline `CSSProperties` replaced with Tailwind
- Primary button → primary button standard (navy-700)
- Input fields → input standard above
- Error messages: `text-red-600 text-sm mt-1`

### 4.2 Encadrant — liste_activite

**Top navbar:**
- `bg-navy-900 text-white h-14 px-6 flex items-center justify-between`
- Left: "TrAP" wordmark `font-lora font-bold text-xl`
- Right: user avatar circle + email + logout ghost button

**Activity cards:**
- Replace current flat list with `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`
- Each card: `bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3`
- Card header: title `font-lora font-semibold text-navy-900` + status badge
- Card meta: code, category, statement count — `text-sm text-gray-500`
- Card footer: description (truncated) + action buttons (debrief icon, settings icon) — `border-t border-gray-100 pt-3 mt-3`

**Search bar:**
- `w-full max-w-sm rounded-lg border-gray-300 focus:ring-navy-500`

### 4.3 Encadrant — creer_activite & parametres_activite

**Page shell:**
- Remove `bg-gradient-to-br from-blue-50 to-white`
- Replace with `min-h-screen bg-stone-100`
- Content: `max-w-7xl mx-auto px-6 py-8`

**Page header:**
- Sticky top bar `bg-white border-b border-gray-200 px-6 py-4` with back button + title `font-lora text-2xl font-bold text-navy-900` + autosave indicator

**Section cards:**
- Replace `bg-white shadow-md p-4 md:p-6 rounded-lg` with `bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-6`
- Section titles: `font-lora font-semibold text-lg text-navy-900 mb-4`

**Form labels:**
- Replace `text-gray-700 font-semibold mb-2 text-lg` with `text-sm font-medium text-gray-600 mb-1 uppercase tracking-wide`

**Affirmation panels:**
- Apply affirmation item card standard (section 3.4)
- Drag zone border: `border-2 border-dashed border-gray-200 rounded-xl` (replaces current `border-dashed border-2 border-gray-300`)

**Bottom action bar:**
- `sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3`

### 4.4 Encadrant — debrief

**Table:**
- Replace raw table with `rounded-xl border border-gray-200 overflow-hidden shadow-sm`
- Header row: `bg-navy-900 text-white text-sm font-medium`
- Body rows: `hover:bg-navy-50 transition-colors`

**Expanded response section:**
- `bg-navy-50 border-t border-navy-200 p-4`
- Statement text: `font-lora text-base`
- Debrief textarea + send button use component standards

### 4.5 Encadrant — generer (AI generation)

- Same page shell as other encadrant pages
- AI-generated affirmation cards get standard affirmation card style
- "Generate" / "Make harder" buttons use primary standard

### 4.6 Encadrant — liste_affirmations

- Same page shell
- Affirmation list items use affirmation card standard

### 4.7 Étudiant — login

- Same split-screen layout as encadrant login

### 4.8 Étudiant — activite (overview)

- Remove gradient, use page shell
- Activity title: `font-lora text-2xl font-bold text-navy-900`
- Description card: elevated card style
- Start button: primary button standard, full-width on mobile

### 4.9 Étudiant — participer

- Statement card: `bg-white rounded-xl shadow-sm border border-gray-200 p-6`
- Statement text: `font-lora text-lg text-gray-900 leading-relaxed`
- **Radio tiles** (replaces raw radio buttons):
  ```
  Border tile: border border-gray-200 rounded-lg p-3 flex items-center gap-3 cursor-pointer
               hover:border-navy-500 hover:bg-navy-50 transition-colors
  Selected:    border-navy-600 bg-navy-50
  ```
- Progress bar: `bg-navy-700` fill on `bg-gray-200` track, `rounded-full`
- Navigation: Prev (secondary) + Next/Complete (primary), `justify-between`

### 4.10 Étudiant — confirmer

- Summary page with clean card list of submitted responses
- Confirmation message in `font-lora text-xl text-navy-900`

### 4.11 Étudiant — feedback

- Page title: `font-lora text-2xl font-bold text-navy-900`
- Per-statement card: `bg-gray-50 rounded-xl border border-gray-200 p-5`
- Student answer block: `bg-white rounded-lg border border-gray-200 p-3`
- Supervisor feedback block: `border-l-4 border-navy-500 bg-navy-50 p-3 rounded-r-lg`
- "Pending" state: `border-l-4 border-amber-400 bg-amber-50 p-3 rounded-r-lg text-amber-700`

---

## 5. Files to Modify

| File | Change |
|---|---|
| `frontend/src/app/globals.css` | Add navy + warm gray CSS variables |
| `frontend/tailwind.config.ts` | Extend colors with navy-* palette |
| `frontend/src/app/layout.tsx` | Load Inter + Lora from Google Fonts |
| `frontend/src/app/page.tsx` | Split-screen landing, replace inline styles |
| `frontend/src/app/encadrant/login/page.tsx` | Split-screen, replace inline styles |
| `frontend/src/app/etudiant/login/page.tsx` | Split-screen, replace inline styles |
| `frontend/src/app/encadrant/liste_activite/page.tsx` | Navbar, card grid, badges |
| `frontend/src/app/encadrant/creer_activite/page.tsx` | Page shell, section cards, labels, affirmation cards |
| `frontend/src/app/encadrant/parametres_activite/page.tsx` | Same as creer_activite |
| `frontend/src/app/encadrant/debrief/page.tsx` | Table style, expanded section |
| `frontend/src/app/encadrant/generer/page.tsx` | Page shell, card styles |
| `frontend/src/app/encadrant/liste_affirmations/page.tsx` | Page shell, affirmation cards |
| `frontend/src/app/etudiant/activite/page.tsx` | Page shell, activity card |
| `frontend/src/app/etudiant/activite/participer/page.tsx` | Statement card, radio tiles, progress bar |
| `frontend/src/app/etudiant/activite/participer/confirmer/page.tsx` | Summary card style |
| `frontend/src/app/etudiant/activite/feedback/page.tsx` | Feedback card hierarchy |
| `frontend/src/components/LanguageSwitcher.tsx` | Apply subtle border style |
| `frontend/src/components/ui/button.tsx` | Update shadcn button variants |
| `frontend/src/components/ui/input.tsx` | Update shadcn input style |

---

## 6. Constraints

- No changes to any business logic, API calls, state management, or routing
- No new npm packages — use only existing Tailwind + shadcn/ui
- Drag-and-drop logic in `creer_activite` and `parametres_activite` is untouched
- All i18n keys and `useLanguage()` calls remain unchanged
- Mobile responsiveness preserved or improved, never degraded
