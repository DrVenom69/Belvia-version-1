import React, { useState, useEffect } from 'react';
import { X, Star, Calendar, Clock, Weight, BadgeDollarSign, ShoppingCart, HelpCircle, Shield } from 'lucide-react';
import { Product, CartItem, Review } from '../types';
import { getStoredReviews, saveStoredReview } from '../data';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ProductDetailsModal({ product, onClose, onAddToCart }: ProductDetailsModalProps) {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(product.materials[0] || 'PLA (Matte)');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [renderMode, setRenderMode] = useState<'solid' | 'wireframe' | 'slices'>('slices');
  
  // Reviews state management
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [authorName, setAuthorName] = useState<string>('');
  const [reviewText, setReviewText] = useState<string>('');

  // Load reviews on product mount
  useEffect(() => {
    const list = getStoredReviews();
    setReviews(list);
  }, [product]);

  // Submit reviews
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

  // Dynamic rotate angle for our mock 3D viewer placeholder
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // Automatic spinning of the 3D model placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 1.5) % 360);
    }, 45);
    return () => clearInterval(interval);
  }, []);

  // Sync color/material when product changes
  useEffect(() => {
    setSelectedColor(product.colors[0]);
    setSelectedMaterial(product.materials[0] || 'PLA (Matte)');
    setQuantity(1);
    setActiveImageIdx(0);
  }, [product]);

  // Color map lookup
  const colorMap: Record<string, string> = {
    'Matte Slate': '#475569',
    'Chalk White': '#ffffff',
    'Chalk White (Translucent Only)': '#cbd5e1',
    'Emerald Green': '#10b981',
    'Burnt Orange': '#f97316',
    'Obsidian Black': '#1e293b',
    'Jade Green': '#047857',
    'Silk Copper': '#d97706',
    'Neon Nebula': '#c084fc',
    'Pastel Mint': '#6ee7b7',
    'Sandstone Grey': '#8c8581',
    'Terracotta': '#ea580c',
    'Neon Violet': '#7c3aed',
    'Cyber Yellow': '#eab308',
    'Steel Blue': '#4682b4',
    'Signal Orange': '#ff4500',
    'Steel Gray': '#708090',
    'Silver Pearl': '#c0c0c0',
  };

  const getHexColor = (col: string) => colorMap[col] || '#3b82f6';

  // Dynamic calculations for pricing breakdown
  const calculations = {
    filamentCost: parseFloat((product.price * 0.18).toFixed(2)),
    assemblyCost: parseFloat((product.price * 0.22).toFixed(2)),
    designerRoyalty: parseFloat((product.price * 0.12).toFixed(2)),
    belviaMarkup: parseFloat((product.price * 0.48).toFixed(2))
  };

  const currentTotal = parseFloat((product.price * quantity).toFixed(2));

  const handleAddToCartSubmit = () => {
    onAddToCart({
      product,
      selectedColor,
      selectedMaterial,
      quantity
    });
    onClose();
  };

  return (
    <div id="quickview-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/85 backdrop-blur-sm overflow-y-auto">
      
      {/* Container Box */}
      <div id="quickview-modal-container" className="w-full max-w-5xl bg-[#090e19] border border-bg-elevated rounded-2xl overflow-hidden shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-25 p-2 rounded-lg bg-gray-950/80 hover:bg-gray-800 border border-bg-elevated text-gray-400 hover:text-white cursor-pointer transition"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Column: Interactive 3D Canvas / Multi-Image Tabs */}
          <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-bg-elevated flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Image Tabs vs 3D render selection */}
              <div className="flex justify-between items-center bg-[#070b13] border border-bg-elevated/80 p-1.5 rounded-xl text-xs font-mono">
                <span className="text-gray-400 pl-2">ACTIVE VIEWER</span>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setRenderMode('slices')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      renderMode === 'slices' ? 'bg-accent-secondary font-bold text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    3D Slices
                  </button>
                  <button
                    onClick={() => setRenderMode('solid')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      renderMode === 'solid' ? 'bg-accent-secondary font-bold text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    3D Solid
                  </button>
                  <button
                    onClick={() => setRenderMode('wireframe')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      renderMode === 'wireframe' ? 'bg-accent-secondary font-bold text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Wireframe
                  </button>
                </div>
              </div>

              {/* The Actual Canvas Showcase */}
              <div className="aspect-[4/3] rounded-2xl bg-bg-base border border-bg-elevated/80 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-30" />
                
                {/* 3D CAD Blueprint Axis Overlay (Hologram Mode) */}
                <span className="absolute top-3 left-3 font-mono text-[8px] text-gray-500 uppercase">
                  BOUNDS: {product.dimensions || 'Dynamic Size'} // Z-Height: OK
                </span>
                <span className="absolute bottom-3 right-3 font-mono text-[8px] text-gray-500 uppercase">
                  ROTATION: {Math.floor(rotationAngle)}° // G-CODE SYNTAX
                </span>

                {/* Simulated 3D Model Render Plate */}
                <div 
                  className="w-56 h-56 relative flex items-center justify-center transition-transform duration-300 pointer-events-none"
                  style={{ transform: `rotateY(${rotationAngle}deg) rotateX(-20deg)` }}
                >
                  {/* Floating abstract object mapping */}
                  <div className="absolute inset-0 rounded-xl border border-accent/10 flex items-center justify-center">
                    
                    {renderMode === 'slices' && (
                      /* Concentric layered rings representing 3D slicing paths */
                      <div className="space-y-1.5 w-40 flex flex-col items-center">
                        <div className="h-0.5 bg-accent/10 w-16" />
                        <div className="h-0.5 bg-accent/25 w-24 border border-accent/20" />
                        <div className="h-1 bg-gradient-to-r from-accent to-accent-secondary w-32 shadow-lg shadow-accent-secondary/20 rounded-full" />
                        <div className="h-0.5 bg-accent/35 w-30 border border-accent/20" />
                        <div className="h-0.5 bg-accent/50 w-26" />
                        <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 w-36 shadow-lg shadow-accent-secondary/20 rounded-full" />
                        <div className="h-0.5 bg-accent/30 w-28" />
                        <div className="h-0.5 bg-accent/15 w-18" />
                      </div>
                    )}

                    {renderMode === 'wireframe' && (
                      /* Hologram skeletal sphere */
                      <div className="w-36 h-36 border border-dashed border-indigo-400/30 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
                        <div className="w-24 h-24 border border-dashed border-accent/30 rounded-full flex items-center justify-center">
                          <div className="w-12 h-12 border border-dotted border-purple-500/50 rounded-full" />
                        </div>
                        <div className="absolute h-36 w-px bg-indigo-500/20" />
                        <div className="absolute w-36 h-px bg-indigo-500/20" />
                      </div>
                    )}

                    {renderMode === 'solid' && (
                      /* Reflective Matte model mock utilizing Unsplash product detail */
                      <div className="w-44 h-44 rounded-2xl overflow-hidden border border-gray-700/60 shadow-2xl relative">
                        <img
                          referrerPolicy="no-referrer"
                          src={product.images[activeImageIdx]}
                          alt="Model mesh"
                          className="w-full h-full object-cover filter saturate-[0.8] contrast-[1.1]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-accent-secondary/10 to-transparent" />
                      </div>
                    )}

                  </div>
                </div>

                {/* Laser/Nozzle Line Tracker */}
                <div className="absolute left-1/2 top-4 w-px h-5/6 bg-gradient-to-b from-transparent via-accent/30 to-transparent pointer-events-none" />

                {/* Holographic Slicing HUD overlay */}
                <div className="absolute bottom-3 left-3 bg-[#070c14]/90 border border-bg-elevated py-1.5 px-3 rounded-lg text-[9px] font-mono text-gray-400 space-y-0.5">
                  <div className="flex justify-between space-x-2">
                    <span className="text-gray-500">MEMBER INF:</span>
                    <span className="text-accent font-bold">{product.infill}</span>
                  </div>
                  <div className="flex justify-between space-x-2">
                    <span className="text-gray-500">FMT MASS:</span>
                    <span className="text-accent font-bold">{product.weightGrams}g</span>
                  </div>
                </div>

                {/* Help Tag */}
                <div className="absolute top-3 right-3 text-gray-500 hover:text-white transition cursor-help" title="To integrate Spline interactive Orbit, swap this viewport container with your EMBED loader script.">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </div>

              {/* Render Image Previews beneath */}
              <div className="grid grid-cols-5 gap-2.5">
                {product.images.map((img, idx) => (
                  <button
                    key={`${product.id}-img-${idx}`}
                    onClick={() => {
                      setActiveImageIdx(idx);
                      setRenderMode('solid'); // switch to solid view to see different images
                    }}
                    className={`aspect-square rounded-xl bg-bg-surface border overflow-hidden relative cursor-pointer ${
                      activeImageIdx === idx && renderMode === 'solid'
                        ? 'border-accent ring-1 ring-accent/50'
                        : 'border-bg-elevated hover:border-gray-700'
                    }`}
                  >
                    <img referrerPolicy="no-referrer" src={img} alt="Detail view" className="w-full h-full object-cover" />
                  </button>
                ))}
                
                {/* 3D slice view tab option in carousel */}
                <button
                  onClick={() => setRenderMode('slices')}
                  className={`aspect-square rounded-xl bg-bg-base border flex flex-col items-center justify-center text-[10px] font-mono tracking-tighter cursor-pointer ${
                    renderMode === 'slices' ? 'border-accent text-accent' : 'border-bg-elevated text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Clock className="w-5 h-5 mb-1" />
                  <span>CAD Slice</span>
                </button>
              </div>

            </div>

            {/* Static QA standards statement */}
            <div className="mt-4 pt-4 border-t border-bg-elevated/60 flex items-center space-x-3 text-[11px] text-gray-400 font-mono">
              <Shield className="w-4.5 h-4.5 text-accent shrink-0 animate-pulse" />
              <p>Certified Belvia 3D Printing: Checked for overhangs, bed adhesion, structural infills, and visual gaps before dispatching.</p>
            </div>
          </div>

          {/* Right Column: Selections, Specs & Checkout */}
          <div className="lg:col-span-6 p-6 flex flex-col justify-between text-left space-y-6">
            
            {/* Metadata Title */}
            <div>
              <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold">
                {product.category}
              </span>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight mt-1">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center text-yellow-500">
                  <Star className="w-4 h-4 fill-current text-yellow-500" />
                </div>
                <span className="text-sm font-bold text-gray-200">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-500 font-mono">({product.reviewsCount} customer verify reviews on MakerWorld)</span>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-sm leading-relaxed mt-4">
                {product.description}
              </p>
            </div>

            {/* Selection Panel */}
            <div className="space-y-4">
              
              {/* Materials Picker */}
              <div>
                <span className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Select Filament Material:
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((mat) => (
                    <button
                      key={mat}
                      onClick={() => setSelectedMaterial(mat)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        selectedMaterial === mat
                          ? 'bg-accent/10 text-accent border-accent/30 font-semibold'
                          : 'bg-gray-950/80 text-gray-400 border-bg-elevated/80 hover:text-white hover:border-gray-700'
                      }`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors Picker */}
              <div>
                <span className="block text-xs font-mono text-gray-400 uppercase tracking-widest mb-1.5">
                  Select Coating/Color Finish:
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((col) => {
                    const active = selectedColor === col;
                    return (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition border ${
                          active
                            ? 'border-gray-300 bg-gray-900 text-white'
                            : 'border-bg-elevated bg-gray-950/60 text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/10 shrink-0"
                          style={{ backgroundColor: getHexColor(col) }}
                        />
                        <span>{col}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity selectors */}
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
                  Batch Multiplier (QTY):
                </span>
                <div className="flex items-center bg-gray-950/80 border border-bg-elevated rounded-xl overflow-hidden p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer hover:bg-gray-800 rounded-lg text-sm transition"
                  >
                    -
                  </button>
                  <span className="w-12 font-mono font-bold text-center text-white text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white cursor-pointer hover:bg-gray-800 rounded-lg text-sm transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Interactive Telemetry specifications panel */}
              <div className="grid grid-cols-2 gap-3.5 bg-gray-950 border border-bg-elevated/80 rounded-xl p-3.5 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">PRINT HOURS:</span>
                    <span className="text-gray-300">{product.printTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">UNIT MASS:</span>
                    <span className="text-gray-300">{product.weightGrams}g</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">INFILL RATIO:</span>
                    <span className="text-gray-300">{product.infill}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">PRODUCTION:</span>
                    <span className="text-accent">Next Day</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Sandbox */}
              <div className="bg-[#070b13] border border-bg-elevated/80 rounded-xl p-3.5 text-xs space-y-1.5 font-mono text-gray-400">
                <div className="text-[10px] text-gray-500 tracking-wider uppercase font-bold border-b border-bg-elevated pb-1.5 mb-1.5 flex justify-between items-center">
                  <span>Manufacturing Quote Cost Sheet</span>
                  <BadgeDollarSign className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex justify-between">
                  <span>Grade Filament Resin:</span>
                  <span>${(calculations.filamentCost * quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SLA FDM Printbed Hours:</span>
                  <span>${(calculations.assemblyCost * quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>MakerWorld Designer Credit:</span>
                  <span>${(calculations.designerRoyalty * quantity).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Finishing & Quality Control:</span>
                  <span>${(calculations.belviaMarkup * quantity).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-850 pt-2 flex justify-between font-bold text-sm text-white mt-1">
                  <span>Estimated Net Quotation:</span>
                  <span className="text-accent">${currentTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Core Action Trigger bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-gray-880">
              <button
                id="btn-modal-add-cart"
                onClick={handleAddToCartSubmit}
                className="w-full py-3.5 px-5 rounded-xl bg-gray-900 border border-gray-850 hover:border-gray-700 text-gray-200 hover:text-white font-semibold transition flex items-center justify-center space-x-2.5 cursor-pointer shadow-sm"
              >
                <ShoppingCart className="w-4.5 h-4.5 text-accent" />
                <span>Add to Cart</span>
              </button>
              
              <button
                id="btn-modal-instant-order"
                onClick={() => {
                  onAddToCart({ product, selectedColor, selectedMaterial, quantity });
                  // Simulate buying immediately by routing to cart slider
                  handleAddToCartSubmit();
                }}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-white font-bold transition flex items-center justify-center space-x-2.5 cursor-pointer shadow-md shadow-accent/10 hover:shadow-accent-secondary/20"
              >
                <span>Express Order</span>
              </button>
            </div>

          </div>

        </div>

        {/* Dynamic Reviews Forum and Verified List */}
        <div className="border-t border-bg-elevated bg-bg-base/35 p-6 sm:p-8 text-left space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-bg-elevated">
            <div>
              <h3 className="font-display font-black text-lg text-white">Fabrication Build Reviews</h3>
              <p className="text-gray-400 text-xs">Read verified user telemetry reports regarding slicing angles, PEI printbed adhesion, and material finishes.</p>
            </div>
            <div className="flex items-center space-x-3 bg-bg-surface border border-gray-850 px-3.5 py-1.5 rounded-xl font-mono text-xs">
              <span className="text-gray-500">AGGREGATE RATING:</span>
              <span className="text-accent font-bold flex items-center">
                <Star className="w-3.5 h-3.5 fill-current text-yellow-500 mr-1.5 shrink-0" />
                {product.rating.toFixed(1)} / 5.0
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-300">{productReviews.length} Verified Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: list of feedback */}
            <div className="lg:col-span-7 space-y-4">
              {productReviews.length === 0 ? (
                <div className="text-center py-12 bg-bg-base/50 border border-gray-850/60 rounded-2xl space-y-2">
                  <Star className="w-8 h-8 text-gray-700 mx-auto animate-pulse" />
                  <p className="text-gray-400 text-xs font-mono">No active review threads written for this slice geometry.</p>
                  <p className="text-gray-500 text-[10px]">Verify your order and write your first build configuration review!</p>
                </div>
              ) : (
                productReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-[#070c14]/90 border border-gray-850 text-xs space-y-2.5">
                    <div className="flex justify-between items-center text-left">
                      <div className="flex items-center space-x-2">
                        {rev.avatarUrl ? (
                          <img src={rev.avatarUrl} alt={rev.author} className="w-7 h-7 rounded-full object-cover border border-bg-elevated" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-gray-700 font-bold font-mono text-accent text-[10px] flex items-center justify-center">
                            {rev.author.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-gray-100 block">{rev.author}</span>
                          <span className="text-[9px] text-green-400 font-mono flex items-center mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />
                            VERIFIED CLIENT BUILD
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-0.5 text-yellow-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-xs">
                      {rev.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Right Box: Submission Form */}
            <div id="review-submission-card" className="lg:col-span-5 p-5 bg-[#070b13] border border-bg-elevated/80 rounded-2xl space-y-4">
              <h4 className="font-sans font-extrabold text-sm text-white">Post Your Build Slices Review</h4>
              
              <div className="space-y-4 text-xs">
                {/* Visual stars selector */}
                <div className="space-y-1 text-left">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Your Star Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRating(s)}
                        className="p-1 cursor-pointer hover:scale-110 active:scale-95 transition"
                      >
                        <Star className={`w-5.5 h-5.5 ${s <= newRating ? 'fill-current text-orange-500' : 'text-gray-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1 text-left">
                  <label htmlFor="review-author" className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Fabrication Handle / Name
                  </label>
                  <input
                    id="review-author"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Lucas Vance (@gotech_customs)"
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-3 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 font-sans text-xs tracking-wide"
                  />
                </div>

                {/* Review field */}
                <div className="space-y-1 text-left">
                  <label htmlFor="review-textarea" className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Build parameters &amp; configuration details
                  </label>
                  <textarea
                    id="review-textarea"
                    rows={3}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe dimension alignment, layer tolerances, and dynamic finishes..."
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-3 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20 font-sans text-xs"
                  />
                </div>

                {/* Submitting review */}
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={!authorName.trim() || !reviewText.trim()}
                  className="w-full py-3 bg-accent-secondary hover:bg-accent-hover disabled:opacity-30 disabled:hover:bg-accent-secondary disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md shadow-accent/10"
                >
                  Publish Verified Build Review
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
