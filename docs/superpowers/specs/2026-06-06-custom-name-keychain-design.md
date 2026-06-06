# Custom Name Keychain Builder Design Specification

This document details the architectural design and data schemas for the **Custom Name Keychain Builder** integrated inside the Belvia 3D Print Studio.

---

## 1. Architectural Concerns & Invariants

To ensure scalability and maintain clean boundaries, the keychain customizer separates dynamic client configurations, state rendering, cart structures, and final immutable records.

```
┌─────────────────────────────────┐
│     Product Catalog Template    │ (bv-keychain-template)
└────────────────┬────────────────┘
                 │ (instantiates)
                 ▼
┌─────────────────────────────────┐
│    Keychain Customization State │ (React Component local state)
└────────────────┬────────────────┘
                 │ (captures & freezes)
                 ▼
┌─────────────────────────────────┐
│       Cart Item Snapshot        │ (CartItem with customDetails)
└─────────────────────────────────┘
```

### 1.1 Base Product Catalog Template
A single template item in the database representable as a standard `Product` under the category `"Keychains"`. 
> [!IMPORTANT]
> The template includes a `basePrice` field. **`basePrice` MUST NEVER be used directly in cart checkout or order processing.** The checkout price is exclusively calculated dynamically using the pricing engine and frozen in the cart item snapshot.

```json
{
  "id": "bv-keychain-template",
  "title": "Custom Name Keychain",
  "description": "Create your own customized name keychain with English or Bangla characters, premium materials, and unique styles.",
  "category": "Keychains",
  "basePrice": 4.99,
  "colors": ["Chalk White", "Matte Slate"],
  "materials": ["PLA (Matte)", "PETG (Durable)", "TPU (Flexible)"],
  "printTime": "25m",
  "weightGrams": 8,
  "images": ["/assets/products/keychain-template.webp"],
  "infill": "20% Grid",
  "dimensions": "80 x 25 x 4 mm",
  "isCustomizable": true
}
```

### 1.2 Customization Config Schema
The raw options chosen by the customer.

```typescript
export interface KeychainConfig {
  name: string;              // English or Bangla (Max 15 chars)
  font: string;              // Chosen Google Font family ID
  textColor: string;        // Hex code for letters
  strokeColor: string;      // Hex code for outline backing
  size: 'Small' | 'Medium' | 'Large';
  theme: 'standard' | 'floral' | 'dogtag' | 'numberplate' | 'football';
  customizationVersion: number; // For compatibility migration (Defaults to 1)
}
```

### 1.3 Cart Item Snapshot
When the user clicks "Add to Cart", a complete snapshot of the configuration is written to the cart item.
> [!IMPORTANT]
> **Cart items are strictly immutable once created, with the sole exception of quantity adjustments.** Parameters such as `calculatedPrice`, `customPreviewUrl`, weight, size, and configurations are frozen inside the snapshot to prevent price drift or catalog changes from altering active cart contents.

```typescript
export interface CartItem {
  product: Product;           // Refers to "bv-keychain-template"
  selectedColor: string;      // Stroke/border color hex or display name
  selectedMaterial: string;   // Filament material type
  quantity: number;
  customization?: KeychainConfig;
  customPreviewUrl?: string;   // Generated SVG data-URI showing exact name/colors
  calculatedPrice?: number;    // Frozen price snapshot at cart addition
  calculatedWeight?: number;   // Frozen weight snapshot
  calculatedDimensions?: string; // Frozen dimensions string
}
```

---

## 2. Configurable Themes & Styles Framework

Instead of hardcoded conditions, themes and fonts are declared as modular configuration datasets, making adding new ones seamless in the future.

### 2.1 Google Fonts Collection
Supported fonts are registered in a config map, separating rendering names and styles:

* **English Fonts**:
  * `Syne`: Sans-display, geometric, bold uppercase look.
  * `DM Sans`: Modern, clean tech style.
  * `Archivo Black`: Heavy, blocky, ideal for multi-color contrast prints.
  * `Pacifico`: Classic retro script cursive.
  * `Fredoka`: Soft, rounded letters.
* **Bangla Fonts**:
  * `Hind Siliguri`: Elegant clean geometric Bangla.
  * `Noto Sans Bengali`: Traditional, high-legibility layout.
  * `Galada`: Highly stylized calligraphy cursive.
  * `Mina`: Contemporary displays.

*Note on dynamic loading:* A custom stylesheet tag imports fonts dynamically if not already present.

### 2.2 Keychain Themes & Impact Structure
Themes contain descriptive details and a nested `impact` structure defining offsets for calculations.

```typescript
export interface KeychainTheme {
  id: string;
  name: string;
  description: string;
  defaultTextColor: string;
  defaultStrokeColor: string;
  impact: {
    priceOffset: number;         // Flat USD price modifier
    weightGramsOffset: number;   // Weight modifier (grams)
    printTimeMinutesOffset: number; // Print duration modifier (minutes)
    complexityLevel: 'Low' | 'Medium' | 'High'; // Printer complexity level
  }
}
```

#### Theme Visual Variations:
* **Standard**: Outlined silhouette surrounding the text geometry, featuring a hanging ring hole on the left.
  * *Complexity:* Low (1.0x print time modifier, +$0 complexity charge)
* **Floral**: Outlined shape with organic botanical leaf and petal SVG designs decorating the top and bottom edges.
  * *Complexity:* Medium (1.1x print time multiplier, +$0.50 complexity charge)
* **Dog Tag**: A solid rounded rectangle badge with a debossed inner line and bead-chain connector layout.
  * *Complexity:* Low (1.0x print time modifier, +$0 complexity charge)
* **Number Plate**: A realistic car/bike license plate design featuring a mini Bangladesh Flag (Green field, Red disc) on the left side, and a tiny subtext reading `"DHAKA-METRO"` above the name.
  * *Complexity:* Low (1.0x print time modifier, +$0 complexity charge)
* **Football**: A badge shield outline with engraved soccer ball panel patterns.
  * *Complexity:* High (1.25x print time multiplier, +$1.00 complexity charge)

---

## 3. Live 3D Preview Engine

### 3.1 Phase 1: High-Fidelity 3D Layered Extrusion (MVP)
A GPU-efficient 3D tilt engine rendered using stacked CSS layers.
* **Default 3D Perspective Angle**: The model uses a default non-zero 3D tilt of `rotateX(20deg) rotateY(-25deg)` at rest. This guarantees that as soon as the page loads, the customer immediately sees the 3D depth, side walls, and print thickness. Hovering or moving the pointer dynamically shifts this angle up to `rotateX(±30deg)` and `rotateY(±35deg)`.
* **Double-Extrusion Stacking**: The model separates the backplate thickness and text thickness into two independent 3D extrusion stacks, creating a realistic layered product:
  * **Base Drop Shadow (Z: -20px)**: A blurred shadow mask offset in Z-space, shifting dynamically relative to the tilt rotation.
  * **Backplate Side Walls (Z: 0px to 5px)**: Stack of 12 layers spaced `0.45px` apart. Each layer is programmatically colored using a custom hex darkening formula (from dark to bright) to render smooth, solid side walls.
  * **Backplate Face (Z: 5.5px)**: The front plate face with a subtle specular gradient highlight simulating plastic PLA filament reflectivity.
  * **Text Side Walls (Z: 6.0px to 9.0px)**: Stack of 8 layers spaced `0.43px` apart, rendering the customized text in programmatically darkened shades of the text color to construct solid, three-dimensional letters.
  * **Text Face (Z: 9.5px)**: The top lettering face with a bright highlight gradient for high contrast and readability.
* **Specular Overlays**: SVG gradient fills (`linearGradient` and `radialGradient`) simulate light reflection on plastic surfaces, providing a realistic product render instead of a flat graphic mockup.

### 3.2 Phase 2: WebGL Extrusion Upgrade (Future Roadmap)
While stacked SVGs provide high-performance rendering for modern mobile/desktop browsers, future versions can replace the preview container with a Three.js / WebGL canvas.
> [!IMPORTANT]
> The Phase 2 WebGL renderer MUST consume the exact same `KeychainConfig` data structure. No schema changes will be allowed, ensuring future rendering upgrades do not break existing cart contents, checkout telemetry, or order logs.

---

## 4. Calculations Matrix

Calculations are computed purely from inputs and are modularized so they can easily map to API responses.

| Size | Base Dimensions | Base Weight | Base Print Time | Size Price Factor |
|---|---|---|---|---|
| **Small** | 80 x 28 x 4 mm | 8g | 25 min | 1.0x (Base) |
| **Medium** | 100 x 35 x 4 mm | 12g | 40 min | 1.4x |
| **Large** | 120 x 42 x 4 mm | 18g | 60 min | 1.8x |

### 4.1 Character & Complexity Adjustments
* **Text Length Factor**: Standard size dimensions assume a baseline name length of 6 characters. For names exceeding 6 characters, each additional character increases:
  * Print weight by $+0.5\text{g}$
  * Print time by $+2\text{ minutes}$
  * Price by $+\$0.15\text{ USD}$
* **Font Complexity Factor**:
  * Cursive scripts (e.g., `Pacifico` or `Galada`) and **Bangla characters** require complex printer pathing (fine curves and retraction points).
  * Printing with these complex configurations adds a $+\$0.50\text{ USD}$ processing charge and $+5\text{ minutes}$ print time.
* **Theme Complexity Factor**:
  * Integrated directly from the theme's `complexityLevel`:
    * `Low`: 1.0x print time multiplier, +$0 complexity fee.
    * `Medium`: 1.1x print time multiplier, +$0.50 complexity fee.
    * `High`: 1.25x print time multiplier, +$1.00 complexity fee.

### 4.2 Calculation Formulas:
$$\text{Price} = (\text{Base Price} \times \text{Size Factor}) + \text{Theme Price Offset} + \text{Length Surcharge} + \text{Font Complexity Fee} + \text{Theme Complexity Fee}$$
$$\text{Weight} = \text{Base Weight} + \text{Theme Weight Offset} + \text{Length Weight Offset}$$
$$\text{Print Time} = (\text{Base Print Time} + \text{Theme Print Time Offset} + \text{Length Time Offset} + \text{Font Complexity Time}) \times \text{Theme Complexity Multiplier}$$

---

## 5. UI Layout Design & Validation Rules

### 5.1 Layout Design
The builder follows the cyber-industrial gold/carbon aesthetic:
* **Interactive Panel**: Left-hand side showing the interactive 3D canvas viewport, a toggle for "Auto-Spin", and a material specification summary (dimensions, print time, weight, price).
* **Control Swatches**: Right-hand side housing name input, font style choice, color swatches (with preset palettes and a "Randomize Colors" button), size selectors, and theme lists.
* **Bangla Support**: Interactive hint suggesting Bangla keyboard options or copy-paste support, applying the correct font family to match.

### 5.2 Validation Rules
> [!IMPORTANT]
> **All validation logic described below MUST be enforced on BOTH the frontend (for instant user feedback) and the backend (for API verification and data security).**

* **Name Length Guard**: Restrict input to a minimum of 2 characters and a maximum of 15 characters to ensure structural integrity and fit within the printer bed envelope.
* **Character Set Validation**:
  * Allowed: English letters (`A-Z`, `a-z`), numbers (`0-9`), Bangla characters, spaces, and hyphens (`-`).
  * Denied: Special symbols (e.g. `@`, `$`, `%`, `&`, `*`, `+`). Show a real-time warning if an invalid character is entered, and disable the "Add to Cart" button.
* **Contrast Safeguard**: 
  * If the user selects identical or extremely similar hex colors for the text and background backing, the contrast ratio becomes insufficient.
  * If the contrast difference falls below a set threshold, show a warning badge: *"Low contrast: Text may not be readable when printed. Consider selecting high-contrast colors."*
