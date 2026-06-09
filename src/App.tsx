/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProductGrid from './components/ProductGrid';
import ProductDetailsModal from './components/ProductDetailsModal';
import CustomPrintStudio from './components/CustomPrintStudio';
import BulkOrders from './components/BulkOrders';
import SellerHub from './components/SellerHub';
import CartDrawer from './components/CartDrawer';
import AestheticsFlow from './components/AestheticsFlow';

// Premium Modular Extensions
import WishlistDrawer from './components/WishlistDrawer';
import SupportChat from './components/SupportChat';
import MyAccountHub from './components/MyAccountHub';
import ImportedPreOrders from './components/ImportedPreOrders';
import ClientPortfolio from './components/ClientPortfolio';
import ReviewStories from './components/ReviewStories';

import { Product, CartItem, CustomPrintRequest, BulkOrderRequest } from './types';
import { getStoredProducts, saveStoredProducts, resetToSeedData } from './data';
import { Heart } from 'lucide-react';

export default function App() {
  // --- GLOBAL PERSISTENT STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>('home'); // Now defaults to immersive Home Feed
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Saved Wishlist states
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);

  // Administrative logs stored locally for full workspace realism
  const [customRequests, setCustomRequests] = useState<CustomPrintRequest[]>([]);
  const [bulkOrders, setBulkOrders] = useState<BulkOrderRequest[]>([]);

  // Profile picture — persisted to localStorage as base64 data URL
  const [profilePicture, setProfilePicture] = useState<string | null>(() => {
    return localStorage.getItem('belvia_profile_pic') || null;
  });

  const handleProfilePictureChange = (url: string | null) => {
    setProfilePicture(url);
    if (url) {
      localStorage.setItem('belvia_profile_pic', url);
    } else {
      localStorage.removeItem('belvia_profile_pic');
    }
  };

  // Light/Dark mode state (syncs with localStorage and document element class)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('belvia_theme');
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('belvia_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load initial states from localStorage if available
  useEffect(() => {
    // 1. Fetch dynamic products database from /data/products.json
    const fetchDynamicProducts = async () => {
      let initialProducts: Product[] = [];
      try {
        const res = await fetch('/data/products.json');
        if (res.ok) {
          const dbData = await res.json();
          initialProducts = dbData.map((item: any) => {
            let printTime = 'N/A';
            if (typeof item.printTimeMinutes === 'number' && item.printTimeMinutes > 0) {
              const h = Math.floor(item.printTimeMinutes / 60);
              const m = item.printTimeMinutes % 60;
              printTime = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
            }

            const images = Array.isArray(item.images)
              ? item.images.map((img: string) => {
                  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
                    return img;
                  }
                  return `/${img}`;
                })
              : [];

            return {
              id: item.id,
              title: item.title,
              description: item.description || '',
              category: item.category,
              price: typeof item.startingPrice === 'number' ? item.startingPrice : parseFloat(item.startingPrice) || 0,
              colors: Array.isArray(item.colors) ? item.colors : [],
              materials: Array.isArray(item.materials) ? item.materials : [],
              rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 5.0,
              reviewsCount: typeof item.reviewCount === 'number' ? item.reviewCount : parseInt(item.reviewCount) || 0,
              printTime,
              weightGrams: typeof item.weightGrams === 'number' ? item.weightGrams : parseInt(item.weightGrams) || 0,
              images,
              infill: item.specifications?.infill || '15% Gyroid',
              dimensions: item.specifications?.dimensions || '',
              isCustomizable: item.category !== 'Premium Hardware' && item.category !== 'Exotic Filaments' && item.category !== 'Hotends' && !item.isPreOrder,
              isPreOrder: item.isPreOrder || false,
              estimatedArrival: item.estimatedArrival || 'Arriving June 26 via Air Cargo',
              depositPercentage: item.depositPercentage || 30,
              originalImportCountry: item.originalImportCountry || 'N/A',
              makerWorldUrl: item.makerWorldUrl || ''
            };
          });

          // Extract and store reviews from database items
          const dbReviews: any[] = [];
          dbData.forEach((item: any) => {
            if (Array.isArray(item.reviews)) {
              item.reviews.forEach((r: any, rIdx: number) => {
                dbReviews.push({
                  id: `rev-db-${item.id}-${rIdx}`,
                  productId: item.id,
                  author: r.userName,
                  rating: r.rating,
                  text: r.comment,
                  createdAt: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
                  isVerified: r.verified || false
                });
              });
            }
          });

          const storedRevRaw = localStorage.getItem('belvia_reviews');
          let mergedReviews = dbReviews;
          if (storedRevRaw) {
            try {
              const parsedRev = JSON.parse(storedRevRaw);
              const dbRevIds = new Set(dbReviews.map(r => r.id));
              const userRev = parsedRev.filter((r: any) => !dbRevIds.has(r.id));
              mergedReviews = [...userRev, ...dbReviews];
            } catch (e) {
              // ignore
            }
          }
          localStorage.setItem('belvia_reviews', JSON.stringify(mergedReviews));
        }
      } catch (err) {
        console.error('Failed to fetch dynamic products database:', err);
      }

      // Merge with localStorage products (keeping user-added custom products)
      const stored = localStorage.getItem('belvia_products');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const dbIds = new Set(initialProducts.map(p => p.id));
          const userAdded = parsed.filter((p: any) => !dbIds.has(p.id));
          const merged = [...userAdded, ...initialProducts];
          setProducts(merged);
          localStorage.setItem('belvia_products', JSON.stringify(merged));
        } catch (e) {
          setProducts(initialProducts.length > 0 ? initialProducts : getStoredProducts());
        }
      } else {
        setProducts(initialProducts.length > 0 ? initialProducts : getStoredProducts());
        if (initialProducts.length > 0) {
          localStorage.setItem('belvia_products', JSON.stringify(initialProducts));
        }
      }
    };

    fetchDynamicProducts();

    const savedCart = localStorage.getItem('belvia_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }

    const savedQuotes = localStorage.getItem('belvia_quotes');
    if (savedQuotes) {
      try {
        setCustomRequests(JSON.parse(savedQuotes));
      } catch (e) {
        setCustomRequests([]);
      }
    }

    const savedBulk = localStorage.getItem('belvia_bulk');
    if (savedBulk) {
      try {
        setBulkOrders(JSON.parse(savedBulk));
      } catch (e) {
        setBulkOrders([]);
      }
    }

    const savedWish = localStorage.getItem('belvia_wishlist');
    if (savedWish) {
      try {
        setWishlist(JSON.parse(savedWish));
      } catch (e) {
        setWishlist([]);
      }
    }
  }, []);

  // --- WISHLIST HANDLERS ---
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      let updated: Product[];
      if (exists) {
        updated = prev.filter((p) => p.id !== product.id);
      } else {
        updated = [...prev, product];
      }
      localStorage.setItem('belvia_wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddToCartAndRemoveFromWishlist = (product: Product) => {
    const defaultItem: CartItem = {
      product,
      selectedColor: product.colors[0],
      selectedMaterial: product.materials[0] || 'PLA (Matte)',
      quantity: 1
    };
    handleAddToCart(defaultItem);
    handleToggleWishlist(product);
  };

  // Sync state helpers
  const updateProductsInState = async (newProducts: Product[]) => {
    setProducts(newProducts);
    saveStoredProducts(newProducts);
    try {
      const response = await fetch('/api/save-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProducts)
      });
      if (!response.ok) {
        const errData = await response.json();
        console.error('Failed to sync products to backend database:', errData.error || response.statusText);
      }
    } catch (err) {
      console.error('Network error syncing products database:', err);
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    updateProductsInState(updated);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    updateProductsInState(updated);
  };

  const handleImportBulkProducts = (importing: Product[]) => {
    // Avoid importing duplicate products by matching makerWorldUrl or ID
    const existingUrls = new Set(products.map(p => p.makerWorldUrl).filter(Boolean));
    const existingIds = new Set(products.map(p => p.id));
    
    const uniqueImports = importing.filter(p => {
      const isDupUrl = p.makerWorldUrl && existingUrls.has(p.makerWorldUrl);
      const isDupId = existingIds.has(p.id);
      return !isDupUrl && !isDupId;
    });

    if (uniqueImports.length === 0) {
      alert("All products in the batch already exist in the catalog. No new items were imported.");
      return;
    }

    const updated = [...uniqueImports, ...products];
    updateProductsInState(updated);
    
    if (uniqueImports.length < importing.length) {
      alert(`Imported ${uniqueImports.length} new products. ${importing.length - uniqueImports.length} duplicates were skipped.`);
    }
  };

  const handleUpdateProducts = (updatedProducts: Product[]) => {
    updateProductsInState(updatedProducts);
  };

  const handleResetCatalog = () => {
    localStorage.removeItem('belvia_products');
    localStorage.removeItem('belvia_reviews');
    const loadProducts = async () => {
      // Fetch seed/default products directly from a clean copy
      const { INITIAL_PRODUCTS, INITIAL_REVIEWS } = await import('./data');
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('belvia_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('belvia_reviews', JSON.stringify(INITIAL_REVIEWS));

      try {
        await fetch('/api/save-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(INITIAL_PRODUCTS)
        });
      } catch (err) {
        console.error('Error syncing reset catalog to backend:', err);
      }
    };
    loadProducts();
  };

  // --- CART HANDLERS ---
  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      // Check if product with EXACT color & material selection already exists
      const existingIdx = prev.findIndex(
        (c) =>
          c.product.id === item.product.id &&
          c.selectedColor === item.selectedColor &&
          c.selectedMaterial === item.selectedMaterial
      );

      let updated: CartItem[];
      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
      } else {
        updated = [...prev, item];
      }
      localStorage.setItem('belvia_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBuyNow = (p: Product) => {
    // Add default configuration then open cart immediately
    const defaultItem: CartItem = {
      product: p,
      selectedColor: p.colors[0],
      selectedMaterial: p.materials[0] || 'PLA (Matte)',
      quantity: 1
    };
    handleAddToCart(defaultItem);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, color: string, material: string, newQty: number) => {
    setCart((prev) => {
      const updated = prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedColor === color &&
          item.selectedMaterial === material
        ) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      localStorage.setItem('belvia_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string, color: string, material: string) => {
    setCart((prev) => {
      const updated = prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === color &&
            item.selectedMaterial === material
          )
      );
      localStorage.setItem('belvia_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    localStorage.removeItem('belvia_cart');
  };

  // --- QUOTE LOGS HANDLERS ---
  const handleAddCustomQuote = (newQuote: CustomPrintRequest) => {
    const updated = [newQuote, ...customRequests];
    setCustomRequests(updated);
    localStorage.setItem('belvia_quotes', JSON.stringify(updated));
  };

  const handleAddBulkOrder = (newOrder: BulkOrderRequest) => {
    const updated = [newOrder, ...bulkOrders];
    setBulkOrders(updated);
    localStorage.setItem('belvia_bulk', JSON.stringify(updated));
  };

  return (
    <div id="belvia-root" className="min-h-screen bg-bg-base flex flex-col text-text-primary antialiased selection:bg-accent/20 font-sans transition-colors duration-300">
      
      {/* 1. BRAND NAVIGATION HEADER */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        wishlistCount={wishlist.length}
        onWishlistOpen={() => setIsWishlistOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        profilePicture={profilePicture}
        onLogout={() => setActiveTab('home')}
      />

      {/* 2. DYNAMIC CONTENT SWITCHBOARD */}
      <main className="flex-grow pb-16 sm:pb-0">
        
        {/* VIEW A: LANDING PAGE & SHORT STREAM VIEW */}
        {activeTab === 'home' && (
          <div id="homepage-dashboard-container">
            {/* Immersive Spline-friendly Hero Platform */}
            <HeroSection
              onStartShopping={() => setActiveTab('ready-prints')}
              onGoToCustom={() => setActiveTab('custom')}
              onCategoryClick={() => setActiveTab('ready-prints')}
            />

            {/* Instagram Story-style reviews tape */}
            <ReviewStories
              onSelectProduct={(pId) => {
                const found = products.find(p => p.id === pId);
                if (found) setSelectedProduct(found);
              }}
              userProfilePicture={profilePicture}
            />

            {/* Ready prints short list */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-10 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8 border-b border-bg-elevated pb-5">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase bg-accent/10 px-2.5 py-1 rounded-md border border-accent/20 inline-block mb-2">
                    Belvia Premium Collection
                  </span>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">Trending 3d prints</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">A curated shortlist of our most robust, high-quality prints</p>
                </div>
                <button
                  onClick={() => setActiveTab('ready-prints')}
                  className="px-5 py-2.5 rounded-xl bg-bg-surface hover:bg-slate-850 border border-bg-elevated text-gray-200 hover:text-white font-semibold text-xs cursor-pointer transition flex items-center space-x-2 shrink-0 shadow-sm"
                >
                  <span>View All Ready Prints</span>
                  <span className="text-accent">&rarr;</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.filter(p => !p.isPreOrder).slice(0, 4).map((p) => {
                  const isWishlisted = wishlist.some(item => item.id === p.id);
                  return (
                    <div key={p.id} className="group rounded-2xl bg-bg-surface/75 border border-bg-elevated hover:border-gray-750 transition overflow-hidden flex flex-col h-full relative">
                      <div 
                        onClick={() => setSelectedProduct(p)}
                        className="aspect-square bg-bg-surface relative overflow-hidden cursor-pointer"
                      >
                        <img referrerPolicy="no-referrer" src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" />
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWishlist(p);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-bg-base/95 text-gray-400 hover:text-red-500 border border-gray-850 backdrop-blur-xs z-10 cursor-pointer transition"
                          title="Save Model"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current text-red-500" : ""}`} />
                        </button>
                      </div>
                      <div className="p-4.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider">{p.category}</span>
                          <h3 
                            onClick={() => setSelectedProduct(p)}
                            className="font-bold text-sm text-gray-100 group-hover:text-white mt-1 line-clamp-1 cursor-pointer hover:underline hover:text-accent transition"
                          >
                            {p.title}
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-1 lines-clamp-2 leading-relaxed">{p.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-850/80 flex items-center justify-between">
                          <span className="text-sm font-mono font-bold text-white">${p.price.toFixed(2)}</span>
                          <button
                            onClick={() => setSelectedProduct(p)}
                            className="text-[10px] font-mono tracking-wider text-accent hover:text-accent-hover cursor-pointer transition font-bold uppercase"
                          >
                            CUSTOMIZE &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aesthetics details */}
            <AestheticsFlow />
          </div>
        )}

        {/* VIEW B: SPECIFIC FULL SHOP CATALOG */}
        {activeTab === 'ready-prints' && (
          <div id="ready-made-view-container">
            <ProductGrid
              products={products}
              onQuickView={setSelectedProduct}
              onBuyNow={handleBuyNow}
              resetCatalog={handleResetCatalog}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
            />
          </div>
        )}

        {/* VIEW C: PRE-ORDERS ONLY IMPORTED WARES */}
        {activeTab === 'imported' && (
          <div id="imported-preorders-container">
            <ImportedPreOrders
              products={products}
              onQuickView={setSelectedProduct}
              onAddToCart={handleBuyNow}
            />
          </div>
        )}

        {/* VIEW D: CLIENT FABRICATION PORTFOLIO */}
        {activeTab === 'portfolio' && (
          <div id="client-portfolios-container">
            <ClientPortfolio />
          </div>
        )}

        {/* VIEW E: SECURE CUSTOMER ACCOUNT HUB & TELEMETRY TRACKER */}
        {activeTab === 'tracker' && (
          <div id="integrated-account-hub-container">
            <MyAccountHub
              products={products}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onAddToCartAndRemove={handleAddToCartAndRemoveFromWishlist}
              onQuickView={setSelectedProduct}
              profilePicture={profilePicture}
              onProfilePictureChange={handleProfilePictureChange}
            />
          </div>
        )}

        {/* VIEW F: CUSTOM STL SLICING INSTANT STUDIO */}
        {activeTab === 'custom' && (
          <div id="custom-view-container">
            <CustomPrintStudio 
              onAddCustomQuote={handleAddCustomQuote} 
              onAddBulkOrder={handleAddBulkOrder} 
              onAddToCart={handleAddToCart}
            />
          </div>
        )}

        {/* VIEW H: BACKEND SELLER MANAGEMENT WORKSTATION */}
        {activeTab === 'admin' && (
          <div id="admin-view-container">
            <SellerHub
              products={products}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onImportBulkProducts={handleImportBulkProducts}
              onResetCatalog={handleResetCatalog}
              onUpdateProducts={handleUpdateProducts}
            />
          </div>
        )}

      </main>

      <footer className="border-t border-gray-850 bg-bg-base py-12 text-center text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center space-y-4">
          <p className="text-gray-500 font-mono tracking-widest uppercase text-[10px] font-bold">belvia.ai - 3D Precision Labs</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('admin')} 
              className="text-gray-400 hover:text-accent font-semibold transition"
            >
              Seller Hub
            </button>
            <span className="text-gray-800">|</span>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="text-gray-400 hover:text-accent font-semibold transition"
            >
              Back to top
            </button>
          </div>
        </div>
      </footer>

      {/* --- FLOATING MODALS & SIDEBAR LAYOUT DRAWER --- */}
      
      {/* Modal A: Product Detailed Specifications & Swatch customization */}
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Drawer B: Shopping Cart Item Checklist */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Drawer C: Saves / Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={(id) => {
          const item = wishlist.find(p => p.id === id);
          if (item) handleToggleWishlist(item);
        }}
        onAddToCartAndRemove={handleAddToCartAndRemoveFromWishlist}
      />

      {/* Persistent Client Care Support Chatbot Bubble */}
      <SupportChat />

    </div>
  );
}
