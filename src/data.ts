import { Product, Review } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'bv-001',
    title: 'Modular Helix Desk Organizer',
    description: 'A MakerWorld favorite featuring a rotating internal compartment, dedicated pencil slots, dynamic phone stand, and small accessory drawers. Printed with a high-strength matte PLA for a seamless, professional finish.',
    category: 'Desk Accessories',
    price: 24.99,
    colors: ['Matte Slate', 'Chalk White', 'Emerald Green', 'Burnt Orange'],
    materials: ['PLA (Matte)', 'PETG (Durable)'],
    rating: 4.9,
    reviewsCount: 142,
    printTime: '4h 15m',
    weightGrams: 110,
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '15% Gyroid',
    dimensions: '120 x 120 x 140 mm',
    isCustomizable: true
  },
  {
    id: 'bv-002',
    title: 'Articulated Obsidian Rift Dragon',
    description: 'An stunningly detailed multi-jointed flexi-dragon that is printed as a single interlocking piece. Complete with custom crystalline scale texture and fully flexible tail, wings, and neck. Ideal toy, desk companion, or shelf center-piece.',
    category: 'Figures & Collectibles',
    price: 29.99,
    colors: ['Obsidian Black', 'Jade Green', 'Silk Copper', 'Neon Nebula'],
    materials: ['PLA (Silk Pearl)', 'PETG'],
    rating: 5.0,
    reviewsCount: 289,
    printTime: '6h 45m',
    weightGrams: 165,
    images: [
      'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '20% Lightning',
    dimensions: '450 x 80 x 60 mm',
    isCustomizable: false
  },
  {
    id: 'bv-003',
    title: 'Geometric Origami Water Pot',
    description: 'A sleek, contemporary self-watering flower pot modeled on origami folds. Features a secondary internal drainage reservoir to feed roots naturally and maintain optimal humidity. Sealed with a water-tight PETG base liner.',
    category: 'Home Decor',
    price: 19.99,
    colors: ['Chalk White', 'Pastel Mint', 'Sandstone Grey', 'Terracotta'],
    materials: ['PETG (Waterproof)', 'PLA (Bioplastic)'],
    rating: 4.8,
    reviewsCount: 94,
    printTime: '3h 30m',
    weightGrams: 95,
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '10% Gyroid',
    dimensions: '140 x 140 x 130 mm',
    isCustomizable: true
  },
  {
    id: 'bv-004',
    title: 'Cyberpunk Xbox/PS Controller Stand',
    description: 'Elevate your gaming rig with a low-poly dual controller stand configured with mechanical wiring details and built-in slots for charging cables. Sturdy block base prevents tipping and protects thumbsticks.',
    category: 'Gaming Accessories',
    price: 18.50,
    colors: ['Neon Violet', 'Matte Slate', 'Cyber Yellow', 'Chalk White'],
    materials: ['PLA (Matte)', 'ABS (High-Impact)'],
    rating: 4.7,
    reviewsCount: 205,
    printTime: '5h 10m',
    weightGrams: 140,
    images: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '15% Grid',
    dimensions: '160 x 110 x 180 mm',
    isCustomizable: true
  },
  {
    id: 'bv-005',
    title: 'Custom Lithophane Lamp & LED Stand',
    description: 'A magical nightlight. Send us any photograph, and our custom slicing system compiles it into a high-density 3D-curved lithophane panel that reveals your photograph in beautiful monochrome tones when lit by the wooden LED base (included).',
    category: 'Custom Orders',
    price: 45.00,
    colors: ['Chalk White (Translucent Only)'],
    materials: ['PLA (High-Definition)'],
    rating: 4.9,
    reviewsCount: 312,
    printTime: '8h 20m',
    weightGrams: 210,
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517999144091-3d9dca6d1e43?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '100% Solid (Translucence)',
    dimensions: '150 x 150 x 200 mm',
    isCustomizable: true
  },
  {
    id: 'bv-006',
    title: 'Minimalist Hex Magnet Key Holder',
    description: 'An elegant magnetic key rack that attaches to your entry wall with non-marking command strips. Embedded with deep-seated N52 neodymium magnets capable of holding heavy rings. Each hexagon contains customizable center initials.',
    category: 'Keychains',
    price: 14.99,
    colors: ['Sandstone Grey', 'Matte Slate', 'Silk Copper', 'Jade Green'],
    materials: ['PLA (Carbon Fiber Infused)', 'PETG'],
    rating: 4.6,
    reviewsCount: 78,
    printTime: '1h 50m',
    weightGrams: 45,
    images: [
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '25% Honeycomb',
    dimensions: '180 x 60 x 15 mm',
    isCustomizable: true
  },
  {
    id: 'bv-007',
    title: 'Ultra-Tough Toggle Wall Clips (4x)',
    description: 'Heavy-duty mounting clamps designed for garage utility pegs, gardening tools, or pantry shelves. Features a mechanical living-hinge snap clasp with verified load-bearing ratings up to 15kg per clip.',
    category: 'Functional Prints',
    price: 12.50,
    colors: ['Signal Orange', 'Obsidian Black', 'Steel Blue'],
    materials: ['PETG (High-Temperature)', 'TPU (Flexible Snap)'],
    rating: 4.9,
    reviewsCount: 154,
    printTime: '2h 10m',
    weightGrams: 80,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '40% Cubic (Max Strength)',
    dimensions: '60 x 40 x 30 mm',
    isCustomizable: false
  },
  {
    id: 'bv-008',
    title: 'B2B Custom Branded Bottle Openers',
    description: 'Premium bulk promotional items configured with an embedded steel coin core for cap-lifting and customized embossed company logos across the body. Incredible tactile feel and lasting promotional impact. Offered in batches of 50+.',
    category: 'Business Merchandise',
    price: 125.00, // For a batch of 50
    colors: ['Matte Slate', 'Obsidian Black', 'Steel Blue', 'Silver Pearl'],
    materials: ['PLA (Matte)', 'PETG (Durable)'],
    rating: 4.9,
    reviewsCount: 32,
    printTime: '18h 30m',
    weightGrams: 750, // Total block
    images: [
      'https://images.unsplash.com/photo-1622445262465-2481c8575340?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '30% Gyroid',
    dimensions: '90 x 40 x 10 mm (Each)',
    isCustomizable: true
  },
  {
    id: 'imported-001',
    title: 'Bambu Lab Automatic Material System (AMS)',
    description: 'The ultimate colored printing upgrade. Allows your 3D printer to print in up to 4 colors simultaneously with automatic filament spool detection, airtight moisture-proof chassis, and fallback runout sensors.',
    category: 'Premium Hardware',
    price: 349.00,
    colors: ['Chitubox Graphite Black'],
    materials: ['Heavy Polycarbonate Injection'],
    rating: 4.9,
    reviewsCount: 104,
    printTime: 'N/A (Machine Part)',
    weightGrams: 2400,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800'
    ],
    infill: '100% Injection Molded',
    dimensions: '368 x 224 x 224 mm',
    isCustomizable: false,
    isPreOrder: true,
    estimatedArrival: 'Arriving June 26 via Air Cargo',
    depositPercentage: 30,
    originalImportCountry: 'Germany'
  },
  {
    id: 'imported-002',
    title: 'Prism Multi-Chroma Silk Co-Extrusion Filament',
    description: 'High-grade dual-color silk filament imported directly. Extrudes yellow-gold on one side and crimson-red on the other, creating jaw-dropping active-color changes as your model moves in the light.',
    category: 'Exotic Filaments',
    price: 34.99,
    colors: ['Royal Gold & Crimson Red', 'Emerald Green & Ocean Blue'],
    materials: ['Co-Extruded Silk PLA'],
    rating: 5.0,
    reviewsCount: 78,
    printTime: 'N/A (Raw Core)',
    weightGrams: 1000,
    images: [
      'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800'
    ],
    infill: 'N/A (Reel)',
    dimensions: '200mm Reel Dia (75mm Width)',
    isCustomizable: false,
    isPreOrder: true,
    estimatedArrival: 'Arriving June 29 via Express Cargo',
    depositPercentage: 50,
    originalImportCountry: 'Japan'
  },
  {
    id: 'imported-003',
    title: 'E3D Revo Micro High-End Heating Block Kit',
    description: 'Ultra-lightweight premium hotend upgrade allowing tool-less nozzle swapping at room temperature. Heats from room temp to 200°C in under 22 seconds using an integrated crystal heating ring.',
    category: 'Premium Hardware',
    price: 115.00,
    colors: ['Nozzle Brass Gold', 'Anodized Black Sleek'],
    materials: ['Titanium Heatbreak & Brass'],
    rating: 4.8,
    reviewsCount: 42,
    printTime: 'N/A (Modular Block)',
    weightGrams: 30,
    images: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800'
    ],
    infill: 'Solid Aerospace-Grade CNC',
    dimensions: '42 x 26 x 26 mm',
    isCustomizable: false,
    isPreOrder: true,
    estimatedArrival: 'Arriving July 08 via freight cargo Express',
    depositPercentage: 25,
    originalImportCountry: 'United Kingdom'
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    productId: 'bv-001',
    author: 'Lucas Vance (@gotech_customs)',
    rating: 5,
    text: 'This Helix organizer is an absolute masterpiece. Slicing settings were spot on, and the Matte PLA finish fits beautifully on my coding setup. Drawer works smoothly!',
    createdAt: '2026-05-18T14:32:00Z',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    modelPhoto: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'rev-002',
    productId: 'bv-001',
    author: 'Sophia Chen',
    rating: 4,
    text: 'Super functional! Highly recommend the Matte Slate color - looks like a premium cast piece. Print time of 4 hours was incredibly fast given the complexity.',
    createdAt: '2026-05-24T09:12:00Z',
    isVerified: true
  },
  {
    id: 'rev-003',
    productId: 'bv-002',
    author: 'Aiden Reed (@dragon_tamer)',
    rating: 5,
    text: 'The flexibility of this Obsidian Rift Dragon is breathtaking! No adhesion prep required, and the Neon Nebula color is mesmerizing. An incredible fidget toy.',
    createdAt: '2026-05-10T11:24:00Z',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
    modelPhoto: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'rev-004',
    productId: 'bv-003',
    author: 'Mia Foster (@greenery_zen)',
    rating: 5,
    text: 'Sleek Self-Watering Origami Pot looks perfect in my kitchen. Printed with PETG, completely waterproof and has held a fern beautifully for three weeks. Brilliant internal drainage design!',
    createdAt: '2026-05-29T16:45:00Z',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    modelPhoto: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=600'
  }
];

// LocalStorage helpers for reviews
export function getStoredReviews(): Review[] {
  if (typeof window === 'undefined') return INITIAL_REVIEWS;
  const stored = localStorage.getItem('belvia_reviews');
  if (!stored) {
    localStorage.setItem('belvia_reviews', JSON.stringify(INITIAL_REVIEWS));
    return INITIAL_REVIEWS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_REVIEWS;
  }
}

export function saveStoredReview(review: Review): Review[] {
  const reviews = getStoredReviews();
  const updated = [review, ...reviews];
  if (typeof window !== 'undefined') {
    localStorage.setItem('belvia_reviews', JSON.stringify(updated));
  }
  return updated;
}

// LocalStorage helpers to simulate a persistent db in client
export function getStoredProducts(): Product[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTS;
  const stored = localStorage.getItem('belvia_products');
  if (!stored) {
    localStorage.setItem('belvia_products', JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('belvia_products', JSON.stringify(products));
}

export function resetToSeedData(): Product[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem('belvia_products', JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem('belvia_reviews', JSON.stringify(INITIAL_REVIEWS));
  }
  return INITIAL_PRODUCTS;
}
