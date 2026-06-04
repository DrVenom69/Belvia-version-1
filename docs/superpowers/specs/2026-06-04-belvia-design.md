# 📝 Belvia Landing Page & E-Commerce Spec

* **Author:** Antigravity (Google DeepMind)
* **Date:** 2026-06-04
* **Aesthetic Direction:** Cyber-Industrial Minimal (Dark mode, subtle golden/amber glows matching Belvia's logo, clean thin borders, premium typography, fast response times)
* **Architecture:** 3-Layer A.N.T. with Router-Driven Single-Shell SPA & Python CLI tools

---

## 1. Project Directory Structure
```
Belvia version 1/
├── index.html              # Layer 2: Main HTML shell & persistent assets
├── app.js                  # Layer 2: SPA Hash Router & State Management
├── style.css               # Layer 2: Global styling (Vanilla CSS, custom vars)
├── data/
│   └── products.json       # Local database of ready-made & custom products
├── images/
│   ├── products/           # Folder for optimized product images (.webp)
│   └── logo.svg            # Branded SVGs
├── architecture/           # Layer 1: Markdown SOPs
│   └── sop-import-products.md
├── tools/                  # Layer 3: CLI automation scripts (Deterministic Python)
│   ├── import_products.py
│   └── requirements.txt
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-06-04-belvia-design.md  # This spec doc
├── gemini.md               # Project Constitution (LAW)
└── .env                    # System keys/secrets
```

---

## 2. Layer 2: Client-Side Router & SPA Lifecycle
The web experience will load once and navigate dynamically via `hashchange` event listeners.

### The Shell (`index.html`)
The main template has a persistent Header/Navbar, a Footer, a persistent Shopping Cart sidebar drawer, and a main render block:
```html
<main id="app-router-view"></main>
```

### Routing Table
The router maps URL hashes to target template renderer functions:
* `#home`: Main landing page view. Shows Spline centerpiece, categories, featured products, "How it works", reviews, FAQ, and footer.
* `#shop`: MakerWorld-inspired product grid with search bar, category filters, and product cards.
* `#product-details?id=X`: Detail view with thumbnail gallery, color selection, material selection, weight breakdown, estimated time, and Buy/Cart buttons.
* `#custom-print`: Step-by-Step Dashboard based on custom UI preferences (RYVOP style):
  * **Top Progress Bar:** Step 1: Upload File ➜ Step 2: Parameter Verification ➜ Step 3: Payment Quote.
  * **Main Configurator Area (Left/Center Panel):** Upload box supporting STL/3MF/OBJ files, print specifications dropdown (Layer height/infill/shells), material configurator (PLA/PETG/ABS/TPU), color palette choice, and automated pricing quote estimator with "Save/Proceed" action button.
  * **Print History Timeline (Right Sidebar Panel):** Scrollable history of previously configured models, active quotes, and processing status.
* `#bulk-orders`: Form for corporate orders, custom design uploads, and volume discounts.
* `#portfolio`: Grid of completed prints and client creations.

### 3D Spline Centerpiece Lifecycle
* **Container:** A persistent `<div id="spline-hero-container">` is defined inside `index.html` at the top, positioned in the middle of the viewport.
* **Responsive Dimensions:**
  * Desktop: `width: 50vw; height: 50vw; max-width: 600px; max-height: 600px;`
  * Mobile: `width: 80vw; height: 80vw; max-width: 320px; max-height: 320px;`
* **Route Sync:**
  * When on `#home`, the container is visible and aligned at the center. Text floats around or behind it.
  * When on `#shop` or other pages, the container is either smoothly animated out (`opacity: 0; pointer-events: none;`) or shrunk into the background to preserve GPU cycles.

---

## 3. Product Schema & Database (`data/products.json`)
The catalog is defined in a JSON file containing metadata, prices, print configurations, and structural elements.

* **Colors Map:**
  * `matte-black`: `#121214`
  * `belvia-gold`: `#f5af19` (Logo Brand Gold Accent)
  * `white`: `#f9fafb`
  * `ruby-red`: `#ef4444`
  * `cobalt-blue`: `#1d4ed8`
  * `slime-green`: `#22c55e`
* **Materials Map:**
  * `PLA`: Standard, rigid, high detail, biodegradable (Base Price Factor: `1.0`)
  * `PETG`: Durable, heat-resistant, weather-proof (Base Price Factor: `1.2`)
  * `TPU`: Flexible, rubber-like, impact-absorbent (Base Price Factor: `1.5`)
  * `ABS`: High strength, impact resistant, heat tolerant (Base Price Factor: `1.3`)

---

## 4. Layer 3: Python CLI Importer (`tools/import_products.py`)
A Python CLI tool fetches data from MakerWorld (title, image URLs, description) or parses local metadata, downloads images, optimizes them to WebP format using `Pillow`, and appends products to `data/products.json`.

### How it runs:
```bash
python tools/import_products.py --url "https://makerworld.com/en/models/12345" --price 12.99 --category "Desk Accessories"
```
Or in batch mode:
```bash
python tools/import_products.py --batch tools/import_queue.json
```

### Deterministic Actions:
1. Fetch MakerWorld URL page content.
2. Extract product title, primary images, description, and model tags.
3. Download images, compress to WebP at 80% quality, and scale down to a maximum width of 800px.
4. Save WebP images in `images/products/`.
5. Append entry to `data/products.json` using the defined database schema.

---

## 5. UI/UX & Design Tokens (`style.css`)
```css
:root {
  --font-family-headings: 'Inter', sans-serif;
  --font-family-body: 'Inter', sans-serif;
  
  /* Cyber-Industrial Golden Palette */
  --bg-color: #080c14;          /* Deep rich carbon dark background */
  --card-bg: #0f1422;           /* Tech slate card background */
  --text-primary: #f3f4f6;      /* Off-white primary text */
  --text-secondary: #9ca3af;    /* Muted gray secondary text */
  --accent-gold: #f5af19;       /* Belvia Brand Gold */
  --accent-gold-dark: #b8810e;  /* Darker gold for borders and hover states */
  --accent-glow: rgba(245, 175, 25, 0.15); /* Soft ambient gold glow */
  --border-color: #1f293d;      /* Precise tech border */
  --border-hover: #374151;
  
  /* Shadows & Glows */
  --glow-gold: 0 0 15px var(--accent-glow);
  --glow-subtle: 0 4px 20px rgba(0, 0, 0, 0.6);
  
  --border-radius: 8px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 6. Verification Plan
* **Automated:** Validate `data/products.json` schema on start. Verify CLI download and WebP compression works.
* **Manual:** Visual inspection in the browser to ensure the centerpiece 3D Spline model layout does not break when scaling the viewport from 320px (mobile) to 1920px (desktop). Verify that page hash transitions are smooth and the shopping cart state remains intact.

