import React, { useState } from 'react';
import { Tag, Plane, HelpCircle, Star, BadgePercent, Calendar, ShoppingCart, Info, Globe } from 'lucide-react';
import { Product } from '../types';

interface ImportedPreOrdersProps {
  products: Product[];
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ImportedPreOrders({
  products,
  onQuickView,
  onAddToCart,
}: ImportedPreOrdersProps) {
  const [selectedSubCat, setSelectedSubCat] = useState<string>('All');

  // Filter out imported pre-order products
  const importedProducts = products.filter(p => p.isPreOrder);

  const subCategories = ['All', 'Premium Hardware', 'Exotic Filaments'];

  const filteredProducts = importedProducts.filter(p => {
    if (selectedSubCat === 'All') return true;
    return p.category === selectedSubCat;
  });

  return (
    <section id="imported-section" className="py-16 bg-bg-base relative">
      {/* Background decoration elements */}
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left">
        
        {/* Section Header */}
        <div className="mb-10 max-w-2xl">
          <span className="font-mono text-xs font-semibold text-accent uppercase tracking-widest block mb-2">
            Air Cargo Specialties &amp; Hardware
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary">
            Premium Imported Pre-Orders
          </h2>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            Direct coordination imports of rare materials, aerospace-grade assemblies, and automatic filament feed modkits. To anchor your batch allocation, pay a <strong>secured partial deposit (25% to 50%)</strong> now.
          </p>
        </div>

        {/* Categories Sorters */}
        <div className="flex border-b border-border-premium mb-8 overflow-x-auto">
          {subCategories.map((sc) => (
            <button
              id={`subcat-tab-${sc.replace(/\s+/g, '-').toLowerCase()}`}
              key={sc}
              onClick={() => setSelectedSubCat(sc)}
              className={`pb-3 px-6 text-sm font-semibold tracking-wider transition cursor-pointer shrink-0 border-b-2 font-mono ${
                selectedSubCat === sc
                  ? 'border-accent text-accent font-bold'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {sc.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-xl bg-accent-secondary/10 border border-accent-secondary/20 flex items-start space-x-3 text-xs text-text-secondary mb-8 max-w-3xl">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-text-primary font-bold block">Pre-Order Deposit System</span>
            <p className="leading-relaxed">
              We coordinate daily direct shipments from premium manufacturers in Japan, the United Kingdom, and Germany. The checkout pricing listed here represents the standard pre-allocated deposit amount to lock down your queue slot. Remaining balance will be invoiced upon customs entry approval.
            </p>
          </div>
        </div>

        {/* Main Grid mapping products */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-bg-surface/40 border border-border-premium rounded-2xl max-w-md mx-auto">
            <Plane className="w-12 h-12 text-text-secondary mx-auto mb-3 animate-pulse" />
            <h4 className="text-text-primary font-bold font-display text-base">All Batches Dispatched</h4>
            <p className="text-text-secondary text-xs mt-1.5 leading-relaxed">
              No imported goods are currently listed under this subcategory. Rest assured, our buying team is constantly searching global makers for premium hardware!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const depositDecimal = (p.depositPercentage || 50) / 100;
              const depositPrice = p.price * depositDecimal;

              return (
                <div
                  id={`imported-card-${p.id}`}
                  key={p.id}
                  className="rounded-2xl bg-bg-surface/75 border border-border-premium hover:border-accent hover:shadow-2xl hover:shadow-accent/5 transition duration-300 overflow-hidden flex flex-col justify-between"
                >
                  {/* Thumbnail Banner */}
                  <div className="aspect-[16/10] w-full bg-bg-surface relative">
                    <img
                      referrerPolicy="no-referrer"
                      src={p.images[0]}
                      alt={p.title}
                      className="w-full h-full object-cover filter contrast-[1.05]"
                    />
                    
                    {/* Origin Tag */}
                    <div className="absolute top-3 left-3 px-2 py-1 rounded bg-bg-base/90 text-[10px] font-mono font-bold tracking-widest text-text-primary border border-border-premium flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-accent" />
                      <span>{p.originalImportCountry?.toUpperCase() || 'IMPORTED'}</span>
                    </div>

                    {/* Pre-order badge */}
                    <span className="absolute top-3 right-3 px-2.5 py-1 text-[9px] font-mono tracking-widest font-black uppercase rounded bg-orange-600 border border-orange-500 text-text-on-accent animate-pulse">
                      Pre-Order Only
                    </span>

                    {/* Estimated Cargo Arrival Indicator */}
                    <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-lg bg-bg-base/85 backdrop-blur-xs border border-border-premium flex items-center justify-between text-[10px] font-mono text-text-secondary">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 text-orange-400 mr-1.5 shrink-0" />
                        ARRIVES:
                      </span>
                      <span className="font-bold text-text-primary truncate">{p.estimatedArrival}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono tracking-widest text-accent font-bold block">
                        {p.category.toUpperCase()}
                      </span>
                      <h3 className="font-display font-black text-lg text-text-primary group-hover:text-accent transition leading-snug line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-text-secondary text-xs leading-relaxed line-clamp-3">
                        {p.description}
                      </p>

                      {/* Hardware / Filaments spec metrics */}
                      <div className="pt-3 pb-1 grid grid-cols-2 gap-2 text-[10px] font-mono text-text-secondary border-t border-border-premium">
                        <div className="flex justify-between pr-2 border-r border-border-premium">
                          <span>SCALE:</span>
                          <span className="text-text-primary">{p.dimensions || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pl-2">
                          <span>MASS WEIGHT:</span>
                          <span className="text-text-primary">{p.weightGrams}g</span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing Sheet Checkout anchor */}
                    <div className="mt-5.5 pt-4.5 border-t border-border-premium flex items-center justify-between">
                      <div>
                        {/* Deposit specification calculations */}
                        <div className="flex items-center text-[9px] font-mono text-text-muted tracking-wider">
                          <span>TOTAL VALUE: ${p.price.toFixed(2)}</span>
                        </div>
                        <div className="flex items-end space-x-1 mt-0.5">
                          <span className="text-xl font-mono font-extrabold text-accent">${depositPrice.toFixed(2)}</span>
                          <span className="text-[10px] font-mono text-text-secondary mb-0.5">({p.depositPercentage}% DEPOSIT)</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onQuickView(p)}
                          className="p-2.5 rounded-xl border border-border-premium bg-bg-base hover:border-accent text-text-secondary hover:text-text-primary text-xs cursor-pointer transition shrink-0"
                          title="Technical Blueprints"
                        >
                          <Info className="w-4.5 h-4.5" />
                        </button>
                        
                        <button
                          id={`btn-preorder-${p.id}`}
                          onClick={() => onAddToCart(p)}
                          className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent font-bold text-xs cursor-pointer flex items-center space-x-1.5 transition duration-150 transform hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-accent/10"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Reserve Slot</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
