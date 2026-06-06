import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Tag, Zap, Eye, RotateCw, Star, Heart, Layers, Download, Check } from 'lucide-react';
import { Product } from '../types';

interface SidebarGroup {
  name: string;
  mappedCategories: string | string[];
  subcategories?: { name: string; mappedCategory: string }[];
  count: number;
}

const CATEGORIES_SIDEBAR: SidebarGroup[] = [
  { name: 'All Categories', mappedCategories: 'All', count: 9 },
  { 
    name: 'Art & Sculptures', 
    mappedCategories: ['Home Decor', 'Figures & Collectibles'],
    count: 4,
    subcategories: [
      { name: 'Home Decor Slices', mappedCategory: 'Home Decor' },
      { name: 'Collectible Figures', mappedCategory: 'Figures & Collectibles' }
    ]
  },
  { 
    name: 'Desk & Organisation', 
    mappedCategories: ['Desk Accessories', 'Functional Prints'],
    count: 3,
    subcategories: [
      { name: 'Desk Accessories', mappedCategory: 'Desk Accessories' },
      { name: 'Functional Utility', mappedCategory: 'Functional Prints' }
    ]
  },
  { 
    name: 'Gaming & Spares', 
    mappedCategories: 'Gaming Accessories',
    count: 2,
    subcategories: [
      { name: 'Console Holders', mappedCategory: 'Gaming Accessories' }
    ]
  }
];

interface ProductGridProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  resetCatalog: () => void;
  wishlist?: Product[];
  onToggleWishlist?: (product: Product) => void;
}

export default function ProductGrid({
  products,
  onQuickView,
  onBuyNow,
  resetCatalog,
  wishlist = [],
  onToggleWishlist
}: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>('All Categories');
  const [modelTypeTab, setModelTypeTab] = useState<'3d-models' | 'laser-cut'>('3d-models');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  // Multi-color color lookup dictionary for beautiful UI swatches
  const colorMap: Record<string, string> = {
    'Matte Slate': '#334155',
    'Chalk White': '#f8fafc',
    'Chalk White (Translucent Only)': '#cbd5e1',
    'Emerald Green': '#10b981',
    'Burnt Orange': '#f97316',
    'Obsidian Black': '#0f172a',
    'Jade Green': '#059669',
    'Silk Copper': '#b45309',
    'Neon Nebula': '#d946ef',
    'Pastel Mint': '#a7f3d0',
    'Sandstone Grey': '#78716c',
    'Terracotta': '#c2410c',
    'Neon Violet': '#8b5cf6',
    'Cyber Yellow': '#eab308',
    'Steel Blue': '#4682b4',
    'Signal Orange': '#ff4500',
    'Steel Gray': '#708090',
    'Silver Pearl': '#c0c0c0',
  };

  const getSwatchColor = (colorName: string): string => {
    // If exact name is found, return color code, otherwise hash it dynamically to some nice fallback code
    if (colorMap[colorName]) return colorMap[colorName];
    // Simple hash
    let hash = 0;
    for (let i = 0; i < colorName.length; i++) {
      hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${Math.abs(hash) % 360}, 50%, 45%)`;
    return color;
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (p.isPreOrder) return false;
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch =
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0; // Default
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="shop-section" className="py-12 bg-bg-base relative animate-fade-in">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Model Type Switcher and Search Row - Styled exactly like MakerWorld */}
        <div className="bg-bg-surface border border-border-premium rounded-2xl p-5 mb-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-2.5 bg-bg-base p-1 border border-border-premium rounded-xl w-full md:w-auto">
            <button
              onClick={() => setModelTypeTab('3d-models')}
              className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-lg text-xs font-bold font-mono tracking-wide transition-all cursor-pointer ${
                modelTypeTab === '3d-models'
                  ? 'bg-accent text-text-on-accent shadow-md font-extrabold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3D Models</span>
            </button>
            <button
              onClick={() => setModelTypeTab('laser-cut')}
              className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-lg text-xs font-bold font-mono tracking-wide transition-all cursor-pointer ${
                modelTypeTab === 'laser-cut'
                  ? 'bg-accent text-text-on-accent shadow-md font-extrabold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Laser &amp; Cut Models</span>
            </button>
          </div>

          {/* Core Unified Search Bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
            <input
              id="shop-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D models, filament types, or tags..."
              className="w-full bg-bg-base text-text-primary pl-10.5 pr-4 py-2 text-xs font-mono tracking-wide rounded-xl border border-border-premium focus:border-accent focus:ring-1 focus:ring-accent/20 transition"
            />
          </div>

          {/* Sorters */}
          <div className="flex items-center space-x-3 text-xs w-full md:w-auto justify-end">
            <span className="text-text-secondary font-mono">SORT:</span>
            <select
              id="shop-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-bg-base text-text-primary text-xs font-mono py-2 px-3.5 rounded-xl border border-border-premium focus:border-accent cursor-pointer"
            >
              <option value="default">Trending</option>
              <option value="price-asc">Price (Asc)</option>
              <option value="price-desc">Price (Desc)</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {/* Categories Header Banner - MakerWorld Inspired */}
        <div className="bg-gradient-to-r from-[#10b981]/10 via-bg-surface/90 to-indigo-500/10 border border-border-premium rounded-2xl p-6.5 text-left mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <span className="text-[9px] font-mono font-bold text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              3D PRINTED ART MODELS
            </span>
            <h2 className="font-display font-black text-xl sm:text-2xl text-text-primary tracking-tight mt-1.5">
              Explore the "{selectedCategory === 'All' ? 'Slices' : selectedCategory}" Category
            </h2>
            <p className="text-text-secondary text-xs mt-1 max-w-2xl leading-relaxed">
              Explore custom 3D printing models design collections. Sourced matching mechanical filament densities, certified wall line tolerances and precise FDM bed alignment configs.
            </p>
          </div>

          {products.length === 0 && (
            <button
              onClick={resetCatalog}
              className="px-4 py-2 mt-2 rounded-xl bg-bg-surface border border-border-premium hover:border-gray-500 text-text-primary flex items-center space-x-2 text-xs transition cursor-pointer animate-pulse"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Restore Catalog</span>
            </button>
          )}
        </div>

        {/* Dual Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR PANEL: Categories Hierarchy */}
          <div className="lg:col-span-1 space-y-4 text-left">
            <div className="bg-bg-surface border border-border-premium rounded-2xl p-5 shadow-xl">
              <h3 className="font-display font-black text-xs text-text-primary uppercase tracking-widest mb-4 border-b border-border-premium pb-2">
                Filter Categories
              </h3>
              
              <div className="space-y-1.5">
                {CATEGORIES_SIDEBAR.map((catGroup) => {
                  const isSelectedGroup = selectedCategoryGroup === catGroup.name;
                  return (
                    <div key={catGroup.name} className="space-y-1">
                      <button
                        onClick={() => {
                          setSelectedCategoryGroup(catGroup.name);
                          if (catGroup.mappedCategories === 'All') {
                            setSelectedCategory('All');
                          } else if (Array.isArray(catGroup.mappedCategories)) {
                            setSelectedCategory(catGroup.mappedCategories[0]);
                          } else {
                            setSelectedCategory(catGroup.mappedCategories);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-tight transition-all duration-150 cursor-pointer border ${
                          isSelectedGroup
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/40 border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelectedGroup ? 'bg-accent' : 'bg-text-secondary/30'}`} />
                          <span>{catGroup.name.toUpperCase()}</span>
                        </div>
                        <span className="text-[9px] text-text-secondary bg-bg-base px-1.5 py-0.5 rounded font-mono font-semibold border border-border-premium">
                          {catGroup.count}
                        </span>
                      </button>
                      
                      {/* Nested subcategories */}
                      {isSelectedGroup && catGroup.subcategories && (
                        <div className="pl-4 space-y-1 mt-1 border-l border-border-premium ml-3.5 pb-2 animate-in fade-in duration-200">
                          {catGroup.subcategories.map((sub) => {
                            const isSubActive = selectedCategory === sub.mappedCategory;
                            return (
                              <button
                                key={sub.name}
                                onClick={() => setSelectedCategory(sub.mappedCategory)}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-[10px] font-mono transition-colors cursor-pointer block ${
                                  isSubActive
                                    ? 'text-accent font-bold bg-accent/5 border-l border-accent'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/20'
                                }`}
                              >
                                {sub.name.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT PRODUCTS PANEL */}
          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-bg-surface/40 border border-border-premium rounded-2xl max-w-lg mx-auto">
                <Search className="w-10 h-10 text-text-secondary mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg text-text-primary">No Models Found</h3>
                <p className="text-text-secondary text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                  No matching models exist in this category right now. Reset filters to see all ready-made prints.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedCategoryGroup('All Categories');
                    setSearchQuery('');
                  }}
                  className="mt-5 px-4.5 py-2.5 rounded-xl bg-accent text-text-on-accent text-xs font-mono font-bold hover:bg-accent-hover cursor-pointer transition"
                >
                  Reset Active Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((p) => {
                  const isWishlisted = wishlist.some((item) => item.id === p.id);
                  
                  // Simulated MakerWorld stats
                  const downloads = Math.floor(p.price * 11 + p.reviewsCount * 17 + 82);
                  const likes = Math.floor(p.price * 3 + p.reviewsCount * 9 + 45);
                  
                  // Creator assignment based on model ID
                  const creatorNames = ['AlphaSculpt', 'Clean Studio', 'Rolf Bertz', 'Ryan @ TheMajinLab', 'FDM_Architect'];
                  const creatorIdx = Math.abs(p.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % creatorNames.length;
                  const creator = creatorNames[creatorIdx];

                  return (
                    <div
                      id={`product-card-${p.id}`}
                      key={p.id}
                      className="group rounded-2xl bg-bg-surface/75 border border-border-premium hover:border-accent/40 hover:shadow-accent/5 transition-all duration-300 relative flex flex-col h-full overflow-hidden text-left shadow-xs"
                    >
                      {/* Image Showcase */}
                      <div className="aspect-square w-full bg-bg-base relative overflow-hidden">
                        <img
                          referrerPolicy="no-referrer"
                          src={p.images[0]}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out animate-in fade-in"
                          loading="lazy"
                        />
                        
                        {/* Interlocking MakerWorld hexagon green design badge */}
                        <div className="absolute top-3 left-3 bg-accent p-1.5 rounded-md text-text-on-accent shadow-md z-15 flex items-center justify-center border border-accent/25" title="Verified Maker Quality">
                          <Layers className="w-4 h-4 text-text-on-accent font-bold" />
                        </div>

                        {/* Wishlist Trigger */}
                        {onToggleWishlist && (
                          <button
                            id={`wish-pop-${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(p);
                            }}
                            className="absolute top-3 right-3 p-2 rounded-lg bg-bg-surface/95 text-text-secondary hover:text-red-500 border border-border-premium backdrop-blur-xs z-20 cursor-pointer transition duration-200"
                            title={isWishlisted ? "Saved" : "Save to Wishlist"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current text-red-500" : ""}`} />
                          </button>
                        )}

                        {/* Technical Metadata tags */}
                        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md text-[9px] font-mono text-text-secondary bg-bg-surface/90 border border-border-premium backdrop-blur-sm shadow z-10 select-none">
                          {p.weightGrams}g / {p.printTime}
                        </div>
                        
                        {/* Quick View Cover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3 duration-300 pointer-events-auto z-10">
                          <button
                            id={`card-quickview-${p.id}`}
                            onClick={() => onQuickView(p)}
                            className="p-3.5 rounded-full bg-bg-surface border border-border-premium text-text-primary hover:text-accent hover:border-accent/40 hover:scale-110 transition cursor-pointer shadow-xl text-xs font-bold"
                            title="Inspect slice layers"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          
                          {/* Title */}
                          <h3 className="font-display font-extrabold text-sm text-text-primary mt-1 line-clamp-1 group-hover:text-accent transition">
                            {p.title}
                          </h3>
                          
                          {/* Creator Row */}
                          <div className="flex items-center space-x-1.5 mt-1">
                            <span className="text-[9px] font-mono text-text-secondary font-bold">by {creator}</span>
                          </div>

                          {/* Downloads Stats Section - replicating Makerworld */}
                          <div className="flex items-center space-x-4 mt-2 mb-3.5 font-mono text-[10px] text-text-secondary border-b border-border-premium/50 pb-2.5">
                            <span className="flex items-center space-x-1">
                              <Download className="w-3.5 h-3.5 text-text-secondary" />
                              <span>{downloads.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Heart className="w-3.5 h-3.5 text-text-secondary" />
                              <span>{likes.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center space-x-1 bg-yellow-500/10 text-yellow-650 dark:text-yellow-500 px-1.5 rounded text-[9px] font-semibold">
                              ★ {p.rating.toFixed(1)}
                            </span>
                          </div>

                          {/* Short Description */}
                          <p className="text-text-secondary text-[11px] line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>

                          {/* Color Swatch row */}
                          <div className="flex items-center space-x-1.5 mt-3 select-none">
                            <div className="flex space-x-1.5">
                              {p.colors.slice(0, 5).map((c) => (
                                <span
                                  key={c}
                                  className="w-3 h-3 rounded-full border border-border-premium"
                                  style={{ backgroundColor: getSwatchColor(c) }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Order Footer Button */}
                        <div className="mt-4.5 pt-3.5 border-t border-border-premium/60 flex items-center justify-between">
                          <div>
                            <span className="block text-[8px] font-mono text-text-secondary uppercase tracking-widest">START PRICE</span>
                            <span className="text-base font-mono font-bold text-text-primary">
                              ${p.price.toFixed(2)}
                            </span>
                          </div>

                          <button
                            id={`card-buy-${p.id}`}
                            onClick={() => onBuyNow(p)}
                            className="px-4 py-2 rounded-xl bg-accent hover:bg-accent-hover text-text-on-accent text-xs font-bold font-mono tracking-wide cursor-pointer flex items-center space-x-1.5 transition duration-150 active:scale-95"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current text-text-on-accent" />
                            <span>ORDER</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
