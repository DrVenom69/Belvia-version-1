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
import AuthModal from './components/AuthModal';
import { formatPrice } from './utils/format';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import { Product, CartItem, CustomPrintRequest, BulkOrderRequest, ActiveFestival } from './types';
import { getStoredProducts, saveStoredProducts, resetToSeedData } from './data';
import { Heart, Sparkles, X, Loader2 } from 'lucide-react';

// Helper: returns headers with the admin API key from localStorage
function adminHeaders(): Record<string, string> {
  const key = localStorage.getItem('belvia_admin_key');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['x-admin-key'] = key;
  return headers;
}


// ── Festival Countdown Banner ─────────────────────────────────────────────────
function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = React.useState('');
  React.useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);
  return timeLeft;
}

interface FestivalBannerProps {
  festival: { name: string; percent: number; category: string | null; end_date: string };
  onDismiss: () => void;
}
function FestivalBanner({ festival, onDismiss }: FestivalBannerProps) {
  const timeLeft = useCountdown(festival.end_date);
  return (
    <div
      id="festival-banner"
      className="relative w-full z-50 overflow-hidden"
      style={{ background: 'linear-gradient(90deg, #1a0a2e 0%, #2d1060 40%, #1a0a2e 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(160,80,255,0.15),transparent_70%)]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 relative">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <Sparkles className="w-4 h-4 text-purple-300 shrink-0 animate-pulse" />
          <span className="font-display font-black text-white text-sm tracking-wide">
            {festival.name}
          </span>
          <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/40 rounded text-purple-200 text-[11px] font-bold">
            {festival.percent}% OFF
          </span>
          {festival.category && (
            <span className="text-purple-400 text-[10px] font-mono">
              {festival.category} only
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-purple-200">
            <span className="opacity-60">Ends in:</span>
            <span className="font-black text-white tabular-nums">{timeLeft}</span>
          </div>
          <button
            onClick={onDismiss}
            className="text-purple-400 hover:text-white transition p-1 rounded-md hover:bg-white/10 cursor-pointer"
            aria-label="Dismiss festival banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {

  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'wishlist' | 'checkout' | 'express'; payload?: any } | null>(null);

  // Execute pending gated action upon successful login
  useEffect(() => {
    if (user && pendingAction) {
      if (pendingAction.type === 'wishlist' && pendingAction.payload) {
        const product = pendingAction.payload;
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
      } else if (pendingAction.type === 'checkout') {
        setIsCartOpen(true);
      } else if (pendingAction.type === 'express' && pendingAction.payload) {
        setExpressItem(pendingAction.payload);
        setIsCartOpen(true);
      }
      setPendingAction(null);
    }
  }, [user, pendingAction]);

  // --- PROFILE NAME STATE (LIFTED & PERSISTED) ---
  const [firstName, setFirstName] = useState<string>("Guest");
  const [lastName, setLastName] = useState<string>("Client");

  useEffect(() => {
    if (user) {
      const metaFirst = user.user_metadata?.first_name || user.user_metadata?.given_name;
      const metaLast = user.user_metadata?.last_name || user.user_metadata?.family_name;

      if (metaFirst || metaLast) {
        setFirstName(metaFirst || "");
        setLastName(metaLast || "");
      } else {
        const storedFirst = localStorage.getItem("belvia_profile_first_name");
        const storedLast = localStorage.getItem("belvia_profile_last_name");
        if (storedFirst !== null || storedLast !== null) {
          setFirstName(storedFirst || "");
          setLastName(storedLast || "");
        } else if (user.email) {
          const emailPrefix = user.email.split("@")[0];
          setFirstName(emailPrefix);
          setLastName("");
        }
      }
    } else {
      setFirstName("Guest");
      setLastName("Client");
    }
  }, [user]);

  // --- GLOBAL PERSISTENT STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Settings from server (payment numbers, store info)
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Active festival discount (for homepage banner)
  const [activeFestival, setActiveFestival] = useState<ActiveFestival | null>(null);
  const [festivalBannerDismissed, setFestivalBannerDismissed] = useState<boolean>(
    () => sessionStorage.getItem('belvia_festival_dismissed') === '1'
  );

  // Fetch settings, categories, and active festival on app mount
  useEffect(() => {
    fetch('/api/get-settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) setSettings(data.settings);
      })
      .catch(err => console.error('Failed to load settings:', err));

    fetch('/api/get-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(err => console.error('Failed to load categories:', err));

    fetch('/api/active-festival')
      .then(res => res.json())
      .then(data => {
        if (data.festival) setActiveFestival(data.festival);
      })
      .catch(() => { /* non-critical */ });
  }, []);
  
  const [activeTab, setActiveTab] = useState<string>('home'); // Now defaults to immersive Home Feed
  const [selectedCategory, setSelectedCategory] = useState<string | string[]>('All');

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'ready-prints') {
      setSelectedCategory('All');
    }
    setActiveTab(tab);
  };

  // Tab transition state
  const [displayTab, setDisplayTab] = useState<string>('home');
  const [tabOpacity, setTabOpacity] = useState<boolean>(true);

  useEffect(() => {
    let introTimer: NodeJS.Timeout;
    setTabOpacity(false);
    const timer = setTimeout(() => {
      setDisplayTab(activeTab);
      // Wait for next render tick before fading back in to prevent React from skipping the intro transition
      introTimer = setTimeout(() => {
        setTabOpacity(true);
      }, 40);
    }, 200); // 200ms fade-out duration
    return () => {
      clearTimeout(timer);
      if (introTimer) clearTimeout(introTimer);
    };
  }, [activeTab]);

  // --- ADMIN AUTH STATE ---
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [adminKeyInput, setAdminKeyInput] = useState<string>('');
  const [keyError, setKeyError] = useState<string>('');

  // Track if any modal is open using a ref to prevent stale closures in event listener
  const modalOpenRef = React.useRef(false);
  const anyModalOpen = isCartOpen || isWishlistOpen || !!selectedProduct || isAuthOpen;

  React.useEffect(() => {
    modalOpenRef.current = anyModalOpen;
  }, [anyModalOpen]);

  // Handle modal-open hash pushing and popping when UI close buttons are clicked
  const isClosingRef = React.useRef(false);
  React.useEffect(() => {
    if (anyModalOpen) {
      if (window.location.hash !== '#modal-open') {
        window.location.hash = 'modal-open';
      }
    } else {
      if (window.location.hash === '#modal-open' && !isClosingRef.current) {
        isClosingRef.current = true;
        window.history.back();
        setTimeout(() => {
          isClosingRef.current = false;
        }, 100);
      }
    }
  }, [anyModalOpen]);

  // Private hash-based routing & browser back button modal interception
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (modalOpenRef.current) {
        if (hash !== '#modal-open') {
          // User clicked back: Close modals instead of navigating away
          setIsCartOpen(false);
          setIsWishlistOpen(false);
          setSelectedProduct(null);
          setIsAuthOpen(false);

          // Update active tab to match the hash navigated back to
          const tabFromHash = hash.substring(1);
          if (tabFromHash === 'admin-portal') {
            setActiveTab('admin');
          } else {
            const validTabs = ['home', 'ready-prints', 'imported', 'portfolio', 'tracker', 'custom', 'admin'];
            if (validTabs.includes(tabFromHash)) {
              setActiveTab(tabFromHash);
            }
          }
          return;
        }
      }

      if (hash === '#admin-portal' || hash === '#admin') {
        setActiveTab('admin');
      } else {
        const tabFromHash = hash.substring(1);
        const validTabs = ['home', 'ready-prints', 'imported', 'portfolio', 'tracker', 'custom', 'admin'];
        if (validTabs.includes(tabFromHash)) {
          setActiveTab(tabFromHash);
        }
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when activeTab changes (only if no modals are open)
  useEffect(() => {
    if (anyModalOpen) return;
    const currentHash = window.location.hash.substring(1);
    const targetHash = activeTab === 'admin' ? 'admin-portal' : activeTab;
    if (currentHash !== targetHash) {
      window.location.hash = targetHash;
    }
  }, [activeTab, anyModalOpen]);

  // Verify localStorage key when the tab switches to admin
  useEffect(() => {
    if (displayTab === 'admin') {
      const storedKey = localStorage.getItem('belvia_admin_key');
      if (storedKey) {
        setIsVerifyingKey(true);
        fetch('/api/verify-admin-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': storedKey
          }
        })
          .then(res => {
            if (res.ok) {
              setIsAdminVerified(true);
            } else {
              setIsAdminVerified(false);
              localStorage.removeItem('belvia_admin_key');
            }
          })
          .catch(err => {
            console.error('Admin key verification failed:', err);
            setIsAdminVerified(false);
          })
          .finally(() => {
            setIsVerifyingKey(false);
          });
      } else {
        setIsAdminVerified(false);
      }
    }
  }, [displayTab]);

  const handleVerifyKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKeyInput.trim()) return;
    setIsVerifyingKey(true);
    setKeyError('');
    try {
      const res = await fetch('/api/verify-admin-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKeyInput.trim()
        }
      });
      if (res.ok) {
        localStorage.setItem('belvia_admin_key', adminKeyInput.trim());
        setIsAdminVerified(true);
        setAdminKeyInput('');
      } else {
        setKeyError('Invalid admin secret key. Access denied.');
      }
    } catch (err) {
      console.error(err);
      setKeyError('Server connection error. Please try again.');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Clears only the admin key — no customer data (cart, wishlist, theme, etc.) is affected.
  const handleAdminLogout = () => {
    localStorage.removeItem('belvia_admin_key');
    setIsAdminVerified(false);
    setAdminKeyInput('');
    setKeyError('');
  };

  const { signOut } = useAuth();
  const handleLogout = async () => {
    await signOut();
    handleAdminLogout();
    setActiveTab('home');
  };

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
    // Fetch live products from server (Supabase). Server data ALWAYS wins.
    // localStorage is used only as a fallback when the server is unreachable.
    const fetchDynamicProducts = async () => {
      let serverFetchSucceeded = false;
      try {
        const res = await fetch('/api/get-products');
        if (res.ok) {
          const dbData = await res.json();

          const mapItem = (item: any): Product => {
            let printTime = 'N/A';
            const ptm = typeof item.printTimeMinutes === 'number' ? item.printTimeMinutes
              : parseInt(item.printTimeMinutes) || 0;
            if (ptm > 0) {
              const h = Math.floor(ptm / 60);
              const m = ptm % 60;
              printTime = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
            }

            // images may arrive as a JSON string (Supabase JSONB stored as text) or array
            let rawImages = item.images;
            if (typeof rawImages === 'string') {
              try { rawImages = JSON.parse(rawImages); } catch { rawImages = []; }
            }
            const images: string[] = Array.isArray(rawImages)
              ? rawImages.map((img: string) =>
                  img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')
                    ? img
                    : `/${img}`
                )
              : [];

            let rawColors = item.colors;
            if (typeof rawColors === 'string') { try { rawColors = JSON.parse(rawColors); } catch { rawColors = []; } }
            let rawMaterials = item.materials;
            if (typeof rawMaterials === 'string') { try { rawMaterials = JSON.parse(rawMaterials); } catch { rawMaterials = []; } }

            let specs = item.specifications;
            if (typeof specs === 'string') { try { specs = JSON.parse(specs); } catch { specs = {}; } }

            return {
              id: item.id,
              title: item.title,
              description: item.description || '',
              category: item.category,
              price: typeof item.startingPrice === 'number' ? item.startingPrice : parseFloat(item.startingPrice) || 0,
              colors: Array.isArray(rawColors) ? rawColors : [],
              materials: Array.isArray(rawMaterials) ? rawMaterials : [],
              rating: typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 5.0,
              reviewsCount: typeof item.reviewCount === 'number' ? item.reviewCount : parseInt(item.reviewCount) || 0,
              printTime,
              weightGrams: typeof item.weightGrams === 'number' ? item.weightGrams : parseInt(item.weightGrams) || 0,
              images,
              infill: specs?.infill || '15% Gyroid',
              dimensions: specs?.dimensions || '',
              isCustomizable: item.category !== 'Premium Hardware' && item.category !== 'Exotic Filaments' && item.category !== 'Hotends' && !item.isPreOrder,
              isPreOrder: item.isPreOrder || false,
              estimatedArrival: item.estimatedArrival || 'Arriving June 26 via Air Cargo',
              depositPercentage: item.depositPercentage || 30,
              originalImportCountry: item.originalImportCountry || 'N/A',
              makerWorldUrl: item.makerWorldUrl || '',
              featured_carousel: item.featured_carousel || false,
              carousel_order: typeof item.carousel_order === 'number' ? item.carousel_order : parseInt(item.carousel_order) || 0,
              resin_enabled: item.resin_enabled || false,
              resin_price: item.resin_price !== undefined && item.resin_price !== null ? (typeof item.resin_price === 'number' ? item.resin_price : parseFloat(item.resin_price) || 0) : null,
              color_picker_count: typeof item.color_picker_count === 'number' ? item.color_picker_count : 1,
              is_trendy: item.is_trendy || false,
              updated_at: item.updated_at
            };
          };

          const serverProducts = Array.isArray(dbData) ? dbData.map((item: any) => {
            // Also parse tags from server data
            let rawTags = item.tags;
            if (typeof rawTags === 'string') { try { rawTags = JSON.parse(rawTags); } catch { rawTags = []; } }
            return { ...mapItem(item), tags: Array.isArray(rawTags) ? rawTags : undefined };
          }) : [];

          // ✅ SERVER WINS: replace localStorage entirely with live server data
          setProducts(serverProducts);
          localStorage.setItem('belvia_products', JSON.stringify(serverProducts));
          serverFetchSucceeded = true;

          // Sync reviews from server data
          const dbReviews: any[] = [];
          dbData.forEach((item: any) => {
            let rawReviews = item.reviews;
            if (typeof rawReviews === 'string') { try { rawReviews = JSON.parse(rawReviews); } catch { rawReviews = []; } }
            if (Array.isArray(rawReviews)) {
              rawReviews.forEach((r: any, rIdx: number) => {
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
          localStorage.setItem('belvia_reviews', JSON.stringify(dbReviews));
        }
      } catch (err) {
        console.warn('[Belvia] Server fetch failed — using localStorage cache:', err);
      }

      // ⚡ FALLBACK: only load localStorage when server was unreachable
      if (!serverFetchSucceeded) {
        const stored = localStorage.getItem('belvia_products');
        if (stored) {
          try {
            setProducts(JSON.parse(stored));
          } catch (e) {
            setProducts(getStoredProducts());
          }
        } else {
          setProducts(getStoredProducts());
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
    if (!user) {
      setPendingAction({ type: 'wishlist', payload: product });
      setIsAuthOpen(true);
      return;
    }
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

  const getDefaultColorLabel = (product: Product): string => {
    const cCount = product.color_picker_count ?? 1;
    if (cCount === 0) return '';
    if (cCount === 1) return product.colors[0] || '';
    return product.colors
      .slice(0, cCount)
      .map((col, i) => `Color ${i + 1}: ${col}`)
      .join(', ');
  };

  const handleAddToCartAndRemoveFromWishlist = (product: Product) => {
    const isPre = product.isPreOrder;
    const basePrice = isPre 
      ? product.price * ((product.depositPercentage || 50) / 100)
      : product.price - Math.round(product.price * 0.12);

    const defaultItem: CartItem = {
      product,
      selectedColor: getDefaultColorLabel(product),
      selectedMaterial: product.materials[0] || 'PLA (Matte)',
      quantity: 1,
      calculatedPrice: basePrice,
      isPreOrder: isPre,
      depositAmount: isPre ? basePrice : undefined
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
        headers: adminHeaders(),
        body: JSON.stringify(newProducts)
      });
      if (!response.ok) {
        const errData = await response.json();
        console.error('Failed to sync products to backend database:', errData.error || response.statusText);
      } else {
        const catRes = await fetch('/api/get-categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
      }
    } catch (err) {
      console.error('Network error syncing products database:', err);
    }
  };

  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    updateProductsInState(updated);
  };

  const handleDeleteProduct = async (id: string) => {
    // 1. Instantly update local UI state for premium snappiness
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveStoredProducts(updated);

    // 2. Call backend DELETE endpoint to handle R2 asset cleanup and database row deletion
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: adminHeaders()
      });
      if (!response.ok) {
        const errData = await response.json();
        console.error('Failed to delete product from backend database:', errData.error || response.statusText);
      } else {
        console.log(`[Delete] Product ${id} successfully deleted from backend.`);
      }
    } catch (err) {
      console.error('Network error deleting product from backend:', err);
    }
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

  const handleRefreshCategories = () => {
    fetch('/api/get-categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(err => console.error('Failed to load categories:', err));
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
          headers: adminHeaders(),
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
      // Check if product with EXACT color, material, resin & customization selection already exists
      const existingIdx = prev.findIndex(
        (c) =>
          c.product.id === item.product.id &&
          c.selectedColor === item.selectedColor &&
          c.selectedMaterial === item.selectedMaterial &&
          !!c.selectedResin === !!item.selectedResin &&
          JSON.stringify(c.customization || null) === JSON.stringify(item.customization || null)
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

  const handleAddPreOrderToCart = (item: CartItem) => {
    // Same as handleAddToCart but receives the pre-computed CartItem with calculatedPrice
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) =>
          c.product.id === item.product.id &&
          c.selectedColor === item.selectedColor &&
          c.selectedMaterial === item.selectedMaterial &&
          !!c.selectedResin === !!item.selectedResin &&
          JSON.stringify(c.customization || null) === JSON.stringify(item.customization || null)
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
    const isPre = p.isPreOrder;
    const basePrice = isPre 
      ? p.price * ((p.depositPercentage || 50) / 100)
      : p.price - Math.round(p.price * 0.12);

    const defaultItem: CartItem = {
      product: p,
      selectedColor: getDefaultColorLabel(p),
      selectedMaterial: p.materials[0] || 'PLA (Matte)',
      quantity: 1,
      calculatedPrice: basePrice,
      isPreOrder: isPre,
      depositAmount: isPre ? basePrice : undefined
    };
    handleAddToCart(defaultItem);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (productId: string, color: string, material: string, newQty: number, selectedResin?: boolean, customization?: any) => {
    setCart((prev) => {
      const updated = prev.map((item) => {
        if (
          item.product.id === productId &&
          item.selectedColor === color &&
          item.selectedMaterial === material &&
          !!item.selectedResin === !!selectedResin &&
          JSON.stringify(item.customization || null) === JSON.stringify(customization || null)
        ) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
      localStorage.setItem('belvia_cart', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRemoveCartItem = (productId: string, color: string, material: string, selectedResin?: boolean, customization?: any) => {
    setCart((prev) => {
      const updated = prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.selectedColor === color &&
            item.selectedMaterial === material &&
            !!item.selectedResin === !!selectedResin &&
            JSON.stringify(item.customization || null) === JSON.stringify(customization || null)
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

  // Express Order: open the drawer directly at shipping step with a single item, without touching the shared cart
  const [expressItem, setExpressItem] = useState<CartItem | undefined>(undefined);

  const handleExpressOrder = (item: CartItem) => {
    if (!user) {
      setPendingAction({ type: 'express', payload: item });
      setIsAuthOpen(true);
      return;
    }
    setExpressItem(item);
    setIsCartOpen(true);
  };

  // Clear the express item when the drawer closes so it doesn't persist
  const handleCartClose = () => {
    setIsCartOpen(false);
    // Reset express state after a brief delay so the drawer's exist animation completes
    setTimeout(() => setExpressItem(undefined), 300);
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
      
      {/* FESTIVAL COUNTDOWN BANNER */}
      {activeFestival && !festivalBannerDismissed && (
        <FestivalBanner
          festival={activeFestival}
          onDismiss={() => {
            setFestivalBannerDismissed(true);
            sessionStorage.setItem('belvia_festival_dismissed', '1');
          }}
        />
      )}

      {/* 1. BRAND NAVIGATION HEADER */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        wishlistCount={wishlist.length}
        onWishlistOpen={() => setIsWishlistOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        profilePicture={profilePicture}
        onLogout={handleLogout}
        adminEmail={user?.email || undefined}
        isAdmin={isAdminVerified ?? false}
        firstName={firstName}
        lastName={lastName}
      />

      {/* 2. DYNAMIC CONTENT SWITCHBOARD */}
      <main className="flex-grow pb-20 sm:pb-0">
        <div
          key={displayTab}
          className={`transition-all duration-200 ease-in-out transform ${
            tabOpacity ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* VIEW A: LANDING PAGE & SHORT STREAM VIEW */}
          {displayTab === 'home' && (
            <div id="homepage-dashboard-container">
              {/* Immersive Spline-friendly Hero Platform */}
              <HeroSection
                products={products}
                onStartShopping={() => setActiveTab('ready-prints')}
                onGoToCustom={() => setActiveTab('custom')}
                onCategoryClick={(cat) => {
                  setSelectedCategory(cat);
                  setActiveTab('ready-prints');
                }}
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
                    onClick={() => {
                      setSelectedCategory('All');
                      setActiveTab('ready-prints');
                    }}
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
                      <div key={p.id} className="group rounded-2xl bg-bg-surface/75 border border-bg-elevated hover:border-accent/40 transition overflow-hidden flex flex-col h-full relative">
                        <div 
                          onClick={() => setSelectedProduct(p)}
                          className="aspect-square bg-bg-surface relative overflow-hidden cursor-pointer"
                        >
                          <img 
                            referrerPolicy="no-referrer" 
                            src={p.images[0]} 
                            alt={p.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out" 
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholder.png';
                            }}
                          />
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWishlist(p);
                            }}
                            className="absolute top-3 right-3 p-1.5 rounded-lg bg-bg-base/95 text-text-secondary hover:text-red-500 border border-border-premium backdrop-blur-xs z-10 cursor-pointer transition"
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
                              className="font-bold text-sm text-text-primary group-hover:text-accent mt-1 line-clamp-1 cursor-pointer hover:underline transition"
                            >
                              {p.title}
                            </h3>
                            <p className="text-[11px] text-text-secondary mt-1 lines-clamp-2 leading-relaxed">{p.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-border-premium flex items-center justify-between">
                            <span className="text-sm font-mono font-bold text-text-primary">{formatPrice(p.isPreOrder ? p.price : (p.price - Math.round(p.price * 0.12)))}</span>
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
          {displayTab === 'ready-prints' && (
            <div id="ready-made-view-container">
              <ProductGrid
                products={products}
                onQuickView={setSelectedProduct}
                onBuyNow={handleBuyNow}
                resetCatalog={handleResetCatalog}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
              />
            </div>
          )}

          {/* VIEW C: PRE-ORDERS ONLY IMPORTED WARES */}
          {displayTab === 'imported' && (
            <div id="imported-preorders-container">
              <ImportedPreOrders
                products={products}
                onQuickView={setSelectedProduct}
                onAddToCart={handleBuyNow}
                onAddPreOrderToCart={handleAddPreOrderToCart}
              />
            </div>
          )}

          {/* VIEW D: CLIENT FABRICATION PORTFOLIO */}
          {displayTab === 'portfolio' && (
            <div id="client-portfolios-container">
              <ClientPortfolio />
            </div>
          )}

          {/* VIEW E: SECURE CUSTOMER ACCOUNT HUB & TELEMETRY TRACKER */}
          {displayTab === 'tracker' && (
            <div id="integrated-account-hub-container">
              <MyAccountHub
                products={products}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                onAddToCartAndRemove={handleAddToCartAndRemoveFromWishlist}
                onQuickView={setSelectedProduct}
                profilePicture={profilePicture}
                onProfilePictureChange={handleProfilePictureChange}
                firstName={firstName}
                lastName={lastName}
                setFirstName={setFirstName}
                setLastName={setLastName}
              />
            </div>
          )}

          {/* VIEW F: CUSTOM STL SLICING INSTANT STUDIO */}
          {displayTab === 'custom' && (
            <div id="custom-view-container">
              <CustomPrintStudio 
                onAddCustomQuote={handleAddCustomQuote} 
                onAddBulkOrder={handleAddBulkOrder} 
                onAddToCart={handleAddToCart}
              />
            </div>
          )}

          {/* VIEW H: BACKEND SELLER MANAGEMENT WORKSTATION */}
          {displayTab === 'admin' && (
            <div id="admin-view-container">
              {isVerifyingKey ? (
                <div className="max-w-md mx-auto mt-20 bg-bg-surface border border-bg-elevated rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(245,175,25,0.05),transparent_70%)]" />
                  <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
                  <h3 className="font-display font-bold text-sm text-white mb-1">Verifying Credentials</h3>
                  <p className="text-gray-400 text-[10px] font-mono">Checking administrative access key...</p>
                </div>
              ) : isAdminVerified ? (
                <SellerHub
                  products={products}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onImportBulkProducts={handleImportBulkProducts}
                  onResetCatalog={handleResetCatalog}
                  onUpdateProducts={handleUpdateProducts}
                  categories={categories}
                  onRefreshCategories={handleRefreshCategories}
                  onLogout={handleAdminLogout}
                />
              ) : (
                <div className="max-w-md mx-auto mt-20 bg-[#070b13] border border-accent/20 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
                  {/* Amber glow background matching logo */}
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(245,175,25,0.08),transparent_70%)]" />
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-secondary" />
                  
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-accent animate-pulse" />
                  </div>
                  <h2 className="font-display text-lg font-black text-white tracking-tight mb-2 uppercase">Seller Hub Authorization</h2>
                  <p className="text-gray-400 text-[10px] leading-relaxed font-mono mb-6">
                    Enter your administrative access key to authenticate.
                  </p>

                  <form onSubmit={handleVerifyKeySubmit} className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest font-black">
                        Admin Access Key
                      </label>
                      <input
                        type="password"
                        required
                        value={adminKeyInput}
                        onChange={(e) => setAdminKeyInput(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 text-xs font-mono"
                      />
                    </div>

                    {keyError && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-mono text-center">
                        {keyError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifyingKey || !adminKeyInput.trim()}
                      className="w-full py-2.5 bg-gradient-to-r from-accent to-accent-secondary text-text-on-accent hover:from-accent-hover hover:to-accent-secondary-lt font-black tracking-wider text-[11px] rounded-xl transition cursor-pointer font-mono shadow-lg shadow-accent/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isVerifyingKey ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>VERIFYING...</span>
                        </>
                      ) : (
                        <span>AUTHENTICATE</span>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-850 bg-bg-base py-12 text-center text-xs">
        <div className="max-w-5xl mx-auto px-4 flex flex-col items-center space-y-4">
          <p className="text-gray-500 font-mono tracking-widest uppercase text-[10px] font-bold">belvia.ai - 3D Precision Labs</p>
          <div className="flex gap-4">
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
        onExpressOrder={handleExpressOrder}
      />

      {/* Drawer B: Shopping Cart Item Checklist (also serves Express Order when skipCart=true) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={handleCartClose}
        cart={cart}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        bkashNumber={settings?.bkashNumber || "01712511193"}
        nagadNumber={settings?.nagadNumber || "01712511193"}
        userId={user?.id}
        onAuthRequired={() => {
          setPendingAction({ type: 'checkout' });
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        expressItem={expressItem}
        skipCart={!!expressItem}
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

      {/* Auth Gate Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Persistent Client Care Support Chatbot Bubble */}
      <SupportChat />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppContent />
      </ChatProvider>
    </AuthProvider>
  );
}
