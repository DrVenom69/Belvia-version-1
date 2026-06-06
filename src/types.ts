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
  category: 'Keychains' | 'Home Decor' | 'Desk Accessories' | 'Gaming Accessories' | 'Figures & Collectibles' | 'Business Merchandise' | 'Custom Orders' | 'Functional Prints' | '3D Printers & Spares' | 'Exotic Filaments' | 'Premium Hardware' | 'Imported Goods' | 'A1 Mini Mods' | 'Hotends';
  price: number;
  basePrice?: number;
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
  originalImportCountry?: string; // e.g., "Germany", "Japan"
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
  priceEstimate: number;
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
  theme: 'standard' | 'floral' | 'dogtag' | 'numberplate' | 'football';
  customizationVersion: number;
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedMaterial: string;
  quantity: number;
  isPreOrder?: boolean;
  depositAmount?: number;
  customization?: KeychainConfig;
  customPreviewUrl?: string;
  calculatedPrice?: number;
  calculatedWeight?: number;
  calculatedDimensions?: string;
}
