# 🧠 gemini.md — Project Constitution

> **This file is LAW.** All schemas, rules, and architectural decisions are recorded here.  
> Code must conform to this document. If reality diverges, update this file first, then update the code.

---

## 📐 Data Schema

### Product Schema (products.json)
```json
[
  {
    "id": "string (unique identifier)",
    "title": "string (product name)",
    "category": "string (Keychains | Home Decor | Desk Accessories | Gaming Accessories | Figures & Collectibles | Business Merchandise | Custom Orders | Functional Prints | or any dynamically created category)",
    "startingPrice": "number (integer, starting price in BDT)",
    "weightGrams": "number (integer, raw print weight)",
    "filamentUsage": "number (float, filament weight in grams)",
    "description": "string (markdown allowed)",
    "images": [
      "string (relative paths to optimized webp images)"
    ],
    "colors": [
      "string (matte-black | neon-cyan | silk-gold | ruby-red | etc.)"
    ],
    "materials": [
      "string (PLA | PETG | TPU | ABS)"
    ],
    "printTimeMinutes": "number (integer, print duration)",
    "rating": "number (float, average review score)",
    "reviewCount": "number (integer, number of reviews)",
    "makerWorldUrl": "string (optional source url)",
    "specifications": {
      "dimensions": "string (e.g. 80mm x 25mm x 4mm)",
      "layerHeight": "string (e.g. 0.16mm)"
    }
  }
]
```

### Import Queue Schema (import_queue.json)
```json
[
  {
    "url": "string (MakerWorld URL)",
    "startingPrice": "number (optional starting price)",
    "category": "string (optional category override)"
  }
]
```

---

## 📜 Behavioral Rules
1. **Premium Aesthetic First**: UI must support two coherent, premium design themes (Dark & Light) mapped to semantic tokens. No ad-hoc component color variations.
2. **No Dynamic Layout Layout-Shift**: Router swaps main layouts smoothly using opacity fades and translate transitions.
3. **Local Product Storage**: The web client reads static `data/products.json` file as the local database.
4. **No Python on Frontend**: Python runs purely as a Layer 3 CLI tool (`tools/import_products.py`) to scrape, parse, download, and compile products.

---

## 🎨 Theme Specifications

### 1. Dark Theme (Sleek Cyber-Industrial)
- **Base Background**: `#080c14` (Deep tech-focused carbon/slate base)
- **Surface Panels**: `rgba(13, 19, 34, 0.65)` (Deep navy/carbon transparent glassmorphism)
- **Elevated/Hover Panels**: `rgba(21, 28, 44, 0.78)`
- **Primary Text**: `#f8fafc` (Off-white / Slate 50)
- **Secondary Text**: `#94a3b8` (Muted cool grey / Slate 400)
- **Border Treatment**: `rgba(255, 255, 255, 0.08)` (Thin, subtle white lines) or brand-gold (`rgba(245, 175, 25, 0.2)`) on active focus/hover.
- **Brand Accent**: `#f5af19` (Gold / Amber) - used for interactive indicators, highlights, and borders.
- **Ambient Glows**: Subtle gold/amber radial gradient glows (`rgba(245, 175, 25, 0.15)`) matching the logo.
- **Card Shadow**: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`.

### 2. Light Theme (Sleek Warm Calmness)
- **Base Background**: `#f4f6fa` (Soft warm slate/cream white, never pure white, to prevent eye strain)
- **Surface Panels**: `rgba(255, 255, 255, 0.7)` (Clean white/cream translucent glassmorphism)
- **Elevated/Hover Panels**: `rgba(255, 255, 255, 0.85)`
- **Primary Text**: `#0f172a` (Slate 900 - dark charcoal, high contrast but soft)
- **Secondary Text**: `#475569` (Slate 600 - muted charcoal)
- **Border Treatment**: `rgba(15, 23, 42, 0.08)` (Low-contrast, subtle borders; never hard black or high-contrast lines)
- **Brand Accent**: `#f5af19` (Gold / Amber) - used **sparingly** for emphasis (buttons, key highlights, active states) rather than throughout, ensuring low visual noise.
- **Ambient Glows & Shadows**: Soft, low-intensity amber glows (`rgba(245, 175, 25, 0.05)`) and micro-shadows (`0 8px 32px 0 rgba(31, 38, 135, 0.05)`) to maintain a clean, flat, premium feel.

---

## 🏛️ Architectural Invariants
- **3-Layer A.N.T. Architecture** is enforced:
  - Layer 1: `architecture/` — SOPs in Markdown (e.g. `sop-import-products.md`)
  - Layer 2: Navigation — Client-side hash router inside `app.js` and `index.html` structure
  - Layer 3: `tools/` — Deterministic Python scripts (e.g. `tools/import_products.py`)
- All intermediate files go in `.tmp/`
- API keys/secrets live in `.env` only
- No LLM-generated business logic on the web app — all tool logic is deterministic
- Self-Annealing repair loop is mandatory on errors

---

## 🔧 Maintenance Log
- **2026-06-04 — Protocol 0 Initialization**: Configured single-shell SPA router, JSON database, and Python import script.
- **2026-06-16 — BDT Currency Migration**: Migrated all price storage, display, calculation formulas, and AI prompt schemas from USD ($) to Bangladeshi Taka (BDT, ৳).
- **2026-06-20 — Dynamic Categories Support**: Enabled creation and persistence of dynamic product categories inline during import or manual editing.
- **2026-06-25 — Dual Theme Specifications**: Standardized Dark (Sleek Cyber-Industrial) and Light (Sleek Warm Calmness) design rules to prevent style drifts and ensure consistent UI.

---

*Last updated: 2026-06-25 — Dual Theme Specifications*

