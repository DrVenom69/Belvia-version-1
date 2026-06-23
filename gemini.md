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
1. **Premium Aesthetic First**: UI must use a minimal cyber-industrial theme with rich slate/carbon backgrounds, thin brand-gold borders, and subtle gold/amber radial gradient glows matching the logo.
2. **No Dynamic Layout Layout-Shift**: Router swaps main layouts smoothly using opacity fades and translate transitions.
3. **Local Product Storage**: The web client reads static `data/products.json` file as the local database.
4. **No Python on Frontend**: Python runs purely as a Layer 3 CLI tool (`tools/import_products.py`) to scrape, parse, download, and compile products.

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

---

*Last updated: 2026-06-20 — Dynamic Categories Support*

