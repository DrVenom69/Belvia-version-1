/**
 * src/types.ts
 * 
 * NOTE: All price fields throughout this application (e.g. Product.price,
 * CustomPrintRequest.priceEstimate, CartItem.depositAmount, Order.totalCost)
 * are stored as integers in Bangladeshi Taka (BDT, ৳). No decimals are stored.
 */

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
  isVerified: boolean;
  avatarUrl?: string;
  modelPhoto?: string; // photo of completed print (for story review layouts)
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number; // Stored in BDT (৳)
  basePrice?: number; // Stored in BDT (৳)
  colors: string[];
  materials: string[]; // PLA, PETG, ABS, TPU
  rating: number;
  reviewsCount: number;
  printTime: string; // e.g., "3h 15m"
  weightGrams: number; // e.g., 65
  images: string[]; // URLs or base64
  infill: string; // e.g., "15%" or "20%"
  dimensions?: string; // e.g., "100 x 100 x 80 mm"
  isCustomizable?: boolean;
  isPreOrder?: boolean; // Flag for imported items that are pre-order only
  estimatedArrival?: string; // e.g., "Arriving July 20"
  depositPercentage?: number; // e.g., 30 for 30% deposit
  stockQuantity?: number; // -1 = unlimited/untracked, 0 = out of stock, >0 = available
  colorStock?: Record<string, number>; // Maps color name to stock: -1 = unlimited, 0 = out of stock, >0 = quantity
  originalImportCountry?: string; // e.g., "Germany", "Japan"
  makerWorldUrl?: string; // MakerWorld source page URL
  tags?: string[]; // MakerWorld scraped tags
  featured_carousel?: boolean; // Curated for homepage HeroCarousel
  carousel_order?: number; // Manual sorting order for carousel items
  updated_at?: string; // Last updated timestamp
  material_recipe?: MaterialRecipe;
  needs_price_review?: boolean;
  floor_price_bdt?: number;
  resin_enabled?: boolean;
  resin_price?: number | null;
  /** Controls how many independent color pickers are shown on the detail page:
   *  0 = no picker (fixed design), 1 = single color picker (default),
   *  2–4 = that many independent zone pickers */
  color_picker_count?: number;
  is_trendy?: boolean;
}

export interface CustomPrintRequest {
  id: string;
  fileName: string;
  fileSize: string;
  material: string;
  color: string;
  infill: string;
  quantity: number;
  status: 'Pending Review' | 'Quoted' | 'In Production' | 'Shipped';
  priceEstimate: number; // Stored in BDT (৳)
  userName: string;
  userEmail: string;
  details: string;
  createdAt: string;
}

export interface BulkOrderRequest {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  quantity: number;
  details: string;
  status: 'Received' | 'Quoting' | 'Approved' | 'Processing' | 'Completed';
  createdAt: string;
}

export interface KeychainConfig {
  name: string;
  font: string;
  textColor: string;
  strokeColor: string;
  size: 'Small' | 'Medium' | 'Large';
  theme: 'standard' | 'licenseplate';
  licensePlateRegion?: string;
  customizationVersion: number;
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedMaterial: string;
  quantity: number;
  isPreOrder?: boolean;
  depositAmount?: number; // Stored in BDT (৳)
  customization?: KeychainConfig;
  customPreviewUrl?: string;
  calculatedPrice?: number; // Stored in BDT (৳)
  calculatedWeight?: number;
  calculatedDimensions?: string;
  selectedResin?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  created_by: string | null;
  is_active: boolean;
  created_at: string;
}

// Client-side state for a validated and applied coupon
export interface AppliedCoupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  discountAmount: number; // computed discount in BDT (৳)
}

export interface FestivalDiscount {
  id: string;
  name: string;
  percent: number;
  category: string | null; // null = site-wide
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

// Public-safe subset returned by /api/active-festival
export interface ActiveFestival {
  id: string;
  name: string;
  percent: number;
  category: string | null;
  end_date: string; // ISO string — used for countdown timer
}

// Discount types for priority ordering
export type DiscountType = 'coupon' | 'festival' | 'loyalty' | 'new_user' | null;

export const LOYALTY_TIERS = [
  { name: 'Bronze',   minOrders: 0,  maxOrders: 2,  percent: 0,  color: '#cd7f32' },
  { name: 'Silver',   minOrders: 3,  maxOrders: 6,  percent: 5,  color: '#adb5bd' },
  { name: 'Gold',     minOrders: 7,  maxOrders: 14, percent: 10, color: '#d4af37' },
  { name: 'Platinum', minOrders: 15, maxOrders: Infinity, percent: 15, color: '#e5e4e2' },
] as const;

export interface DiscountResult {
  type: DiscountType;
  percent: number;        // 0-100
  discountAmount: number; // BDT ৳ — computed from subtotal
  label: string;          // Human-readable e.g. "Loyalty Gold — 10% off"
  couponCode?: string;    // only when type === 'coupon'
}

export interface Order {
  id: string; // e.g. "BLV-ORD-100204"
  items: CartItem[];
  totalCost: number; // Stored in BDT (৳) — AFTER discount
  originalCost?: number; // Stored in BDT (৳) — BEFORE discount
  discountAmount?: number; // Stored in BDT (৳)
  discountType?: DiscountType; // Which discount tier won
  discountPercent?: number;   // Winning discount percentage
  couponCode?: string; // Applied coupon code for ROI tracking
  userId?: string;     // Supabase user.id for loyalty + new-user tracking
  totalWeight: number;
  shippingInfo: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  payment: {
    method: 'bKash' | 'Nagad' | '';
    trxId: string;
    screenshotUrl: string; // URL of uploaded payment proof
    submittedAt?: string;
  };
  status: 'Pending' | 'Paid' | 'Pending Verification' | 'Processing' | 'Shipped' | 'Completed';
  createdAt: string;
  orderType?: 'standard' | 'pre-order';
  depositPercentage?: number;
  design_credit_enabled?: boolean;
  design_credit_amount?: number | null;
}

export interface Filament {
  id: string;
  name: string;
  type: string; // PLA / PETG / TPU / Resin
  color?: string;
  brand?: string;
  spool_weight_grams: number;
  purchase_price_bdt: number;
  grams_remaining: number;
  is_empty: boolean;
  purchased_at: string;
  updated_at: string;
  notes?: string;
}

export interface Accessory {
  id: string;
  name: string;
  unit: string; // piece / ml / gram
  cost_per_unit_bdt: number;
  stock_count: number;
}

export interface MaterialRecipe {
  filament_name: string;
  filament_grams: number;
  resin_grams?: number;
  accessories?: string[];
  print_hours: number;
  has_uv_finish?: boolean;
  target_margin?: number | null;
}

