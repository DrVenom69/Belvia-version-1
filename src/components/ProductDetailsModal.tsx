import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Star, BadgeDollarSign, ShoppingCart, Shield, ChevronLeft, ChevronRight, ZoomIn, HelpCircle } from 'lucide-react';
import { Product, CartItem, Review } from '../types';
import { getStoredReviews, saveStoredReview } from '../data';
import { formatPrice } from '../utils/format';
import { useChat } from '../contexts/ChatContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onExpressOrder?: (item: CartItem) => void;
}

export default function ProductDetailsModal({ product, onClose, onAddToCart, onExpressOrder }: ProductDetailsModalProps) {
  if (!product) return null;

  const { triggerChat } = useChat();

  const colorCount = product.color_picker_count ?? 1;
  const [selectedColors, setSelectedColors] = useState<string[]>(() =>
    colorCount === 0 ? [] : product.colors.slice(0, colorCount)
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string>(product.materials[0] || 'PLA (Matte)');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [selectedResin, setSelectedResin] = useState<boolean>(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [authorName, setAuthorName] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');

  // Thumbnail Scroll Fade hooks
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const checkScroll = useCallback(() => {
    const el = thumbnailRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 2);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = thumbnailRef.current;
    if (!el) return;
    
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [product.images, checkScroll]);

  useEffect(() => {
    const list = getStoredReviews();
    setReviews(list);
  }, [product]);

  // Sync selectors when product changes
  useEffect(() => {
    const cCount = product.color_picker_count ?? 1;
    setSelectedColors(cCount === 0 ? [] : product.colors.slice(0, cCount));
    setSelectedMaterial(product.materials[0] || 'PLA (Matte)');
    setQuantity(1);
    setActiveImageIdx(0);
    setLightboxOpen(false);
    setSelectedResin(false);
  }, [product]);

  // Keyboard navigation
  const goNext = useCallback(() => {
    setActiveImageIdx(prev => (prev + 1) % product.images.length);
  }, [product.images.length]);

  const goPrev = useCallback(() => {
    setActiveImageIdx(prev => (prev - 1 + product.images.length) % product.images.length);
  }, [product.images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, goNext, goPrev, onClose]);

  const handleSubmitReview = () => {
    if (!authorName.trim() || !reviewText.trim()) return;
    const newRev: Review = {
      id: `rev-${Date.now()}`,
      productId: product.id,
      author: authorName.trim(),
      rating: newRating,
      text: reviewText.trim(),
      createdAt: new Date().toISOString(),
      isVerified: true
    };
    const updated = saveStoredReview(newRev);
    setReviews(updated);
    setAuthorName('');
    setReviewText('');
    setNewRating(5);
  };

  const productReviews = reviews.filter(rev => rev.productId === product.id);

  const colorMap: Record<string, string> = {
    'Matte Slate': '#475569', 'Chalk White': '#ffffff', 'Chalk White (Translucent Only)': '#cbd5e1',
    'Emerald Green': '#10b981', 'Burnt Orange': '#f97316', 'Obsidian Black': '#1e293b',
    'Jade Green': '#047857', 'Silk Copper': '#d97706', 'Neon Nebula': '#c084fc',
    'Pastel Mint': '#6ee7b7', 'Sandstone Grey': '#8c8581', 'Terracotta': '#ea580c',
    'Neon Violet': '#7c3aed', 'Cyber Yellow': '#eab308', 'Steel Blue': '#4682b4',
    'Signal Orange': '#ff4500', 'Steel Gray': '#708090', 'Silver Pearl': '#c0c0c0',
  };
  const getHexColor = (col: string) => colorMap[col] || '#3b82f6';

  const adjustedBasePrice = product.price - Math.round(product.price * 0.12);
  const calculations = {
    filamentCost: Math.round(product.price * 0.18),
    assemblyCost: Math.round(product.price * 0.22),
    belviaMarkup: Math.round(product.price * 0.48)
  };
  const currentTotal = (adjustedBasePrice + (selectedResin ? (product.resin_price || 0) : 0)) * quantity;
  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity === 0;
  const isUnlimited = product.stockQuantity === undefined || product.stockQuantity === -1;
  const stockLabel = isUnlimited
    ? 'In Stock (Unlimited)'
    : product.stockQuantity && product.stockQuantity > 0
      ? `Only ${product.stockQuantity} left`
      : 'Out of Stock';

  /** Build the display label for selected colors */
  const getSelectedColorLabel = (): string => {
    const cCount = product.color_picker_count ?? 1;
    if (cCount === 0) return '';
    if (cCount === 1) return selectedColors[0] || '';
    return selectedColors
      .map((col, i) => `Color ${i + 1}: ${col}`)
      .filter((_, i) => i < cCount)
      .join(', ');
  };

  const handleAddToCartSubmit = () => {
    onAddToCart({
      product,
      selectedColor: getSelectedColorLabel(),
      selectedMaterial,
      quantity,
      selectedResin,
      calculatedPrice: adjustedBasePrice + (selectedResin ? (product.resin_price || 0) : 0)
    });
    onClose();
  };

  const handleExpressOrderSubmit = () => {
    if (!onExpressOrder) {
      // Fallback: if no express handler provided, do normal add-to-cart + open drawer
      handleAddToCartSubmit();
      return;
    }
    onExpressOrder({
      product,
      selectedColor: getSelectedColorLabel(),
      selectedMaterial,
      quantity,
      selectedResin,
      calculatedPrice: adjustedBasePrice + (selectedResin ? (product.resin_price || 0) : 0)
    });
    onClose();
  };

  const hasImages = product.images.length > 0;
  const currentImage = hasImages ? product.images[activeImageIdx] : null;

  return (
    <>
      {/* Backdrop */}
      <div
        id="quickview-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-bg-surface/85 backdrop-blur-sm overflow-hidden"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal container — max-height constrained, internally scrollable */}
        <div
          id="quickview-modal-container"
          className="relative w-full max-w-5xl bg-bg-base border border-border-premium rounded-2xl shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Sticky close button */}
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-lg bg-bg-surface hover:bg-bg-elevated border border-border-premium text-text-secondary hover:text-text-primary cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable body — extra bottom padding to clear the mobile buy bar + nav */}
          <div className="overflow-y-auto flex-1 pb-32 sm:pb-16 lg:pb-0">

            {/* Top: gallery + purchase panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

              {/* LEFT: Image gallery — sticky on lg+ screens */}
              <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-border-premium flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">

                {/* Main image viewer */}
                <div
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-bg-surface border border-border-premium cursor-zoom-in group"
                  onClick={() => hasImages && setLightboxOpen(true)}
                >
                  {currentImage ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={currentImage}
                      alt={product.title}
                      className="w-full h-full object-contain transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted font-mono text-xs">No image</div>
                  )}

                  {/* Zoom hint */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition bg-bg-base/80 backdrop-blur-sm border border-border-premium rounded-lg p-1.5">
                    <ZoomIn className="w-4 h-4 text-accent" />
                  </div>

                  {/* Prev/next arrows (only show if >1 image) */}
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-bg-base/80 hover:bg-bg-elevated backdrop-blur-sm border border-border-premium rounded-lg p-1.5 text-text-secondary hover:text-text-primary transition cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-base/80 hover:bg-bg-elevated backdrop-blur-sm border border-border-premium rounded-lg p-1.5 text-text-secondary hover:text-text-primary transition cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-bg-base/80 backdrop-blur-sm border border-border-premium rounded-full px-3 py-1 text-[10px] font-mono text-text-secondary">
                      {activeImageIdx + 1} / {product.images.length}
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {product.images.length > 1 && (
                  <div className="relative">
                    {/* Left edge fade gradient */}
                    <div 
                      className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                        showLeftFade ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    
                    {/* Right edge fade gradient */}
                    <div 
                      className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-base to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
                        showRightFade ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <div 
                      ref={thumbnailRef}
                      className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
                    >
                      {product.images.map((img, idx) => (
                        <button
                          key={`thumb-${idx}`}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                            activeImageIdx === idx
                              ? 'border-accent ring-1 ring-accent/50'
                              : 'border-border-premium hover:border-accent/60'
                          }`}
                        >
                          <img 
                            referrerPolicy="no-referrer" 
                            src={img} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              e.currentTarget.src = '/images/placeholder.png';
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* QA statement */}
                <div className="pt-2 border-t border-border-premium/60 space-y-2">
                  <div className="flex items-center space-x-3 text-[11px] text-text-secondary font-mono">
                    <Shield className="w-4 h-4 text-accent shrink-0 animate-pulse" />
                    <p>Certified Belvia 3D Printing: Checked for overhangs, bed adhesion, structural infills, and visual gaps before dispatching.</p>
                  </div>
                  <button
                    onClick={() => {
                      const productUrl = `${window.location.origin}/#ready-prints?id=${product.id}`;
                      triggerChat(`I have a question about ${product.title} — ${productUrl}`, product);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 text-[11px] font-mono text-accent hover:text-accent-hover transition cursor-pointer select-none bg-accent/5 hover:bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Chat about this product</span>
                  </button>
                </div>

                {/* Product description — placed under gallery for mobile-friendly reading */}
                <p className="text-text-secondary text-sm leading-relaxed">{product.description}</p>

                {/* Subtle tags line */}
                {Array.isArray(product.tags) && product.tags.length > 0 && (
                  <p className="text-text-muted/50 text-[10px] leading-relaxed select-none">
                    {product.tags.join(' · ')}
                  </p>
                )}
              </div>

              {/* RIGHT: Details + purchase */}
              <div className="lg:col-span-6 p-6 flex flex-col gap-5 text-left">

                {/* Title block */}
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold">{product.category}</span>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-text-primary tracking-tight mt-1">{product.title}</h1>

                  <div className="flex items-center space-x-2 mt-2">
                    <Star className="w-4 h-4 fill-current text-yellow-500" />
                    <span className="text-sm font-bold text-text-primary">{product.rating.toFixed(1)}</span>
                    <span className="text-xs text-text-muted font-mono">({product.reviewsCount} reviews)</span>
                  </div>

                  {/* Stock indicator */}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                        isOutOfStock
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : isUnlimited
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOutOfStock ? 'bg-red-400' : isUnlimited ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
                      }`} />
                      <span>{stockLabel}</span>
                    </span>
                  </div>
                </div>

                {/* Selectors */}
                <div className="space-y-4">
                  {/* Material */}
                  <div>
                    <span className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-1.5">Filament Material:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.materials.map((mat) => (
                        <button
                          key={mat}
                          onClick={() => setSelectedMaterial(mat)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            selectedMaterial === mat
                              ? 'bg-accent/10 text-accent border-accent/30'
                              : 'bg-bg-surface text-text-secondary border-border-premium hover:text-text-primary hover:border-accent'
                          }`}
                        >
                          {mat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color — rendered based on color_picker_count */}
                  {colorCount > 0 && (
                    <>
                      {Array.from({ length: colorCount }, (_, idx) => (
                        <div key={`color-picker-${idx}`}>
                          <span className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-1.5">
                            {colorCount === 1 ? 'Color' : `Color ${idx + 1}`}:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {product.colors.map((col) => (
                              <button
                                key={col}
                                onClick={() =>
                                  setSelectedColors((prev) => {
                                    const next = [...prev];
                                    next[idx] = col;
                                    return next;
                                  })
                                }
                                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition border ${
                                  selectedColors[idx] === col
                                    ? 'border-border-premium bg-bg-elevated text-text-primary'
                                    : 'border-border-premium bg-bg-surface text-text-secondary hover:text-text-primary'
                                }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0"
                                  style={{ backgroundColor: getHexColor(col) }}
                                />
                                <span>{col}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Resin Option Checkbox */}
                  {product.resin_enabled && (
                    <div className="flex items-center space-x-2.5 bg-bg-surface border border-border-premium rounded-xl p-3.5">
                      <input
                        type="checkbox"
                        id="resin-addon-checkbox"
                        checked={selectedResin}
                        onChange={(e) => setSelectedResin(e.target.checked)}
                        className="rounded border-border-premium text-accent focus:ring-accent accent-accent cursor-pointer"
                      />
                      <label htmlFor="resin-addon-checkbox" className="text-xs font-mono text-text-secondary cursor-pointer hover:text-text-primary select-none">
                        Add Premium Resin Coating (+{formatPrice(product.resin_price || 0)})
                      </label>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">Quantity:</span>
                    <div className="flex items-center bg-bg-surface border border-border-premium rounded-xl overflow-hidden p-1">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer hover:bg-bg-elevated rounded-lg text-sm transition">-</button>
                      <span className="w-12 font-mono font-bold text-center text-text-primary text-sm">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer hover:bg-bg-elevated rounded-lg text-sm transition">+</button>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="grid grid-cols-2 gap-3 bg-bg-surface border border-border-premium rounded-xl p-3.5 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-text-secondary">PRINT HOURS:</span><span className="text-text-primary">{product.printTime}</span></div>
                      <div className="flex justify-between"><span className="text-text-secondary">UNIT MASS:</span><span className="text-text-primary">{product.weightGrams}g</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between"><span className="text-text-secondary">INFILL RATIO:</span><span className="text-text-primary">{product.infill}</span></div>
                      <div className="flex justify-between"><span className="text-text-secondary">PRODUCTION:</span><span className="text-accent">Next Day</span></div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-bg-surface border border-border-premium rounded-xl p-3.5 text-xs space-y-1.5 font-mono text-text-secondary">
                    <div className="text-[10px] text-text-muted tracking-wider uppercase font-bold border-b border-border-premium pb-1.5 mb-1.5 flex justify-between items-center">
                      <span>Manufacturing Quote</span>
                      <BadgeDollarSign className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="flex justify-between"><span>Grade Filament:</span><span>{formatPrice(calculations.filamentCost * quantity)}</span></div>
                    <div className="flex justify-between"><span>FDM Printbed Hours:</span><span>{formatPrice(calculations.assemblyCost * quantity)}</span></div>
                    <div className="flex justify-between"><span>Finishing & QC:</span><span>{formatPrice(calculations.belviaMarkup * quantity)}</span></div>
                    {product.resin_enabled && selectedResin && (
                      <div className="flex justify-between text-accent font-bold">
                        <span>Premium Resin Coating:</span>
                        <span>+{formatPrice((product.resin_price || 0) * quantity)}</span>
                      </div>
                    )}
                    <div className="border-t border-border-premium pt-2 flex justify-between font-bold text-sm text-text-primary mt-1">
                      <span>Estimated Total:</span>
                      <span className="text-accent">{formatPrice(currentTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* CTA buttons — hidden on mobile/tablet since the sticky bottom bar is used there */}
                <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-premium">
                  <button
                    id="btn-modal-add-cart"
                    onClick={handleAddToCartSubmit}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 px-5 rounded-xl font-semibold transition flex items-center justify-center space-x-2.5 shadow-sm ${
                      isOutOfStock
                        ? 'bg-bg-surface border border-border-premium text-text-muted cursor-not-allowed'
                        : 'bg-bg-elevated border border-border-premium hover:border-accent text-text-secondary hover:text-text-primary cursor-pointer'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-accent" />
                    <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                  </button>
                  <button
                    id="btn-modal-instant-order"
                    onClick={handleExpressOrderSubmit}
                    disabled={isOutOfStock}
                    className={`w-full py-3.5 px-5 rounded-xl font-bold transition flex items-center justify-center space-x-2.5 shadow-md ${
                      isOutOfStock
                        ? 'bg-bg-surface border border-border-premium text-text-muted cursor-not-allowed'
                        : 'bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent cursor-pointer'
                    }`}
                  >
                    <span>{isOutOfStock ? 'Unavailable' : 'Express Order'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reviews section */}
            <div className="border-t border-border-premium bg-bg-base/35 p-6 sm:p-8 text-left space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-premium">
                <div>
                  <h3 className="font-display font-black text-lg text-text-primary">Fabrication Build Reviews</h3>
                  <p className="text-text-secondary text-xs">Verified user reports on layer tolerances, adhesion, and material finishes.</p>
                </div>
                <div className="flex items-center space-x-3 bg-bg-surface border border-border-premium px-3.5 py-1.5 rounded-xl font-mono text-xs">
                  <span className="text-text-muted">RATING:</span>
                  <span className="text-accent font-bold flex items-center">
                    <Star className="w-3.5 h-3.5 fill-current text-yellow-500 mr-1.5 shrink-0" />
                    {product.rating.toFixed(1)} / 5.0
                  </span>
                  <span className="text-text-muted">|</span>
                  <span className="text-text-secondary">{productReviews.length} Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-4">
                  {productReviews.length === 0 ? (
                    <div className="text-center py-12 bg-bg-base/50 border border-border-premium rounded-2xl space-y-2">
                      <Star className="w-8 h-8 text-text-muted mx-auto animate-pulse" />
                      <p className="text-text-secondary text-xs font-mono">No reviews yet for this product.</p>
                    </div>
                  ) : (
                    productReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl bg-bg-elevated border border-border-premium text-xs space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-bg-surface border border-border-premium font-bold font-mono text-accent text-[10px] flex items-center justify-center">
                              {rev.author.substring(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-text-primary block">{rev.author}</span>
                              <span className="text-[9px] text-green-400 font-mono flex items-center mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                                VERIFIED CLIENT BUILD
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-0.5 text-yellow-500">
                            {[...Array(rev.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                          </div>
                        </div>
                        <p className="text-text-secondary leading-relaxed">{rev.text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div id="review-submission-card" className="lg:col-span-5 p-5 bg-bg-surface border border-border-premium rounded-2xl space-y-4">
                  <h4 className="font-sans font-extrabold text-sm text-text-primary">Post Your Build Review</h4>
                  <div className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">Star Rating</label>
                      <div className="flex space-x-1">
                        {[1,2,3,4,5].map((s) => (
                          <button key={s} onClick={() => setNewRating(s)} className="p-1 cursor-pointer hover:scale-110 transition">
                            <Star className={`w-5 h-5 ${s <= newRating ? 'fill-current text-orange-500' : 'text-text-muted'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">Name</label>
                      <input
                        type="text"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        placeholder="e.g. Lucas Vance (@gotech_customs)"
                        className="w-full bg-bg-base text-text-primary px-3.5 py-3 rounded-xl border border-border-premium focus:border-accent focus:outline-none text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest">Review</label>
                      <textarea
                        rows={3}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Describe dimensions, layer quality, material finish..."
                        className="w-full bg-bg-base text-text-primary px-3.5 py-3 rounded-xl border border-border-premium focus:border-accent focus:outline-none text-xs resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={!authorName.trim() || !reviewText.trim()}
                      className="w-full py-3 bg-accent-secondary hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-text-on-accent font-bold text-xs rounded-xl cursor-pointer transition"
                    >
                      Publish Verified Review
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end scrollable body */}
        </div>{/* end modal container */}

        {/* Mobile/Tablet persistent buy bar — hidden on lg+ where the buttons are inline */}
        <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-bg-base/95 backdrop-blur-md border-t border-border-premium px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl">
          <div className="grid grid-cols-2 gap-3">
            <button
              id="btn-sticky-add-cart"
              onClick={handleAddToCartSubmit}
              disabled={isOutOfStock}
              className={`w-full py-3 px-4 rounded-xl font-semibold transition flex items-center justify-center space-x-2.5 shadow-sm text-sm ${
                isOutOfStock
                  ? 'bg-bg-surface border border-border-premium text-text-muted cursor-not-allowed'
                  : 'bg-bg-elevated border border-border-premium hover:border-accent text-text-secondary hover:text-text-primary cursor-pointer'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-accent shrink-0" />
              <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
            <button
              id="btn-sticky-instant-order"
              onClick={handleExpressOrderSubmit}
              disabled={isOutOfStock}
              className={`w-full py-3 px-4 rounded-xl font-bold transition flex items-center justify-center space-x-2.5 shadow-md text-sm ${
                isOutOfStock
                  ? 'bg-bg-surface border border-border-premium text-text-muted cursor-not-allowed'
                  : 'bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent cursor-pointer'
              }`}
            >
              <span>{isOutOfStock ? 'Unavailable' : 'Express Order'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX */}
      {lightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <img
            referrerPolicy="no-referrer"
            src={currentImage}
            alt={product.title}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder.png';
            }}
          />

          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer transition"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {product.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveImageIdx(i); }}
                className={`w-2 h-2 rounded-full transition cursor-pointer ${i === activeImageIdx ? 'bg-white' : 'bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
