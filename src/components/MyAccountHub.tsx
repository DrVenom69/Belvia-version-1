import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Settings, Heart, ShoppingCart, CheckCircle2, 
  Truck, Cpu, Star, Mail, MapPin, Edit2, LogOut, Code, ClipboardList, Info, Sparkles, Camera, Upload
} from 'lucide-react';
import { Product, Review } from '../types';
import { getStoredReviews, saveStoredReview, getStoredProducts } from '../data';

interface MyAccountHubProps {
  products: Product[];
  wishlist: Product[];
  onToggleWishlist: (p: Product) => void;
  onAddToCartAndRemove: (p: Product) => void;
  onQuickView: (p: Product) => void;
  profilePicture?: string | null;
  onProfilePictureChange?: (url: string | null) => void;
}

interface PastOrder {
  id: string;
  productId: string;
  title: string;
  material: string;
  color: string;
  price: number;
  date: string;
  status: 'In Progress' | 'Shipped' | 'Delivered' | 'Active Printing';
  trackingCode: string;
}

export default function MyAccountHub({
  products,
  wishlist,
  onToggleWishlist,
  onAddToCartAndRemove,
  onQuickView,
  profilePicture,
  onProfilePictureChange
}: MyAccountHubProps) {
  // Authentication status
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true); // Pre-logged in for maximum user testing convenience
  const [email, setEmail] = useState<string>('iffat2000bd@gmail.com');
  const [password, setPassword] = useState<string>('••••••••');
  
  // Registration simulation toggle
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  
  // Profile settings state (auto-saved)
  const [firstName, setFirstName] = useState<string>('Iffat');
  const [lastName, setLastName] = useState<string>('Bd');
  const [phone, setPhone] = useState<string>('+880-1712-345678');
  const [shippingAddress, setShippingAddress] = useState<string>('House 42, Road 11, Banani, Dhaka, Bangladesh');
  const [defaultFilamentBrand, setDefaultFilamentBrand] = useState<string>('Bambu Labs Premium');
  const [laserSpeed, setLaserSpeed] = useState<string>('240 mm/s Standard Quality');
  const [infillTarget, setInfillTarget] = useState<string>('15% Gyroid (Elastic Strength)');

  // Profile picture upload ref
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const [picUploadHover, setPicUploadHover] = useState(false);

  // Active sub-navigation — reads from sessionStorage if set by navbar dropdown
  const [activeSubView, setActiveSubView] = useState<'profile' | 'orders' | 'wishlist'>(() => {
    const stored = sessionStorage.getItem('belvia_account_subview');
    if (stored === 'profile' || stored === 'orders' || stored === 'wishlist') {
      sessionStorage.removeItem('belvia_account_subview');
      return stored;
    }
    return 'orders';
  });

  // Track Shipments local state
  const [shipmentSearchCode, setShipmentSearchCode] = useState<string>('');
  const [shipmentResult, setShipmentResult] = useState<any | null>(null);
  const [testedCode, setTestedCode] = useState<string>('');

  // Sourced active reviews
  const [globalReviews, setGlobalReviews] = useState<Review[]>([]);

  // Feedback Dialog state
  const [selectedReviewOrder, setSelectedReviewOrder] = useState<PastOrder | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTextText, setReviewTextText] = useState<string>('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string>('');

  // Preloaded simulation past orders
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([
    {
      id: 'BLV-ORD-99120',
      productId: 'bv-005',
      title: 'Custom Lithophane Lamp & LED Stand',
      material: 'PLA (High-Definition)',
      color: 'Chalk White (Translucent Only)',
      price: 45.00,
      date: 'June 02, 2026',
      status: 'Delivered',
      trackingCode: 'BLV-SHIP-99120'
    },
    {
      id: 'BLV-ORD-71510',
      productId: 'bv-001',
      title: 'Modular Helix Desk Organizer',
      material: 'PLA (Matte)',
      color: 'Matte Slate',
      price: 24.99,
      date: 'June 04, 2026',
      status: 'Active Printing',
      trackingCode: 'BLV-SHIP-71510'
    },
    {
      id: 'BLV-ORD-00812',
      productId: 'bv-002',
      title: 'Articulated Obsidian Rift Dragon',
      material: 'PLA (Silk Pearl)',
      color: 'Neon Nebula',
      price: 29.99,
      date: 'June 01, 2026',
      status: 'Delivered',
      trackingCode: 'BLV-SHIP-00812'
    }
  ]);

  const PRELOADED_SHIPMENTS_TELEMETRY: Record<string, any> = {
    'BLV-SHIP-99120': {
      id: 'BLV-SHIP-99120',
      productName: 'Custom Lithophane Lamp & LED Stand',
      qty: 1,
      material: 'PLA (High-Definition)',
      color: 'Chalk White',
      weightGrams: 210,
      status: 'In Transit - Air Freight',
      estimatedArrival: 'June 07, 2026',
      milestones: [
        { title: 'Air Cargo Dispatched', description: 'Departed from distribution terminal fly-hub.', time: 'June 04, 08:30 AM', status: 'current' },
        { title: 'Packaging & ESD Sealed', description: 'Enclosed with wooden custom-carved LED module and anti-static padding.', time: 'June 03, 04:10 PM', status: 'completed' },
        { title: 'UV Resin & Finish Check', description: 'Checked for dimensional compliance (+/- 0.08mm tolerance verified).', time: 'June 03, 11:20 AM', status: 'completed' },
        { title: 'Additive 3D Print Complete', description: 'Extruded over 18,200 continuous gcode vector command curves.', time: 'June 02, 09:45 PM', status: 'completed' }
      ]
    },
    'BLV-SHIP-00812': {
      id: 'BLV-SHIP-00812',
      productName: 'Articulated Obsidian Rift Dragon',
      qty: 2,
      material: 'PLA (Silk Pearl)',
      color: 'Neon Nebula',
      weightGrams: 330,
      status: 'Out for Local Delivery',
      estimatedArrival: 'Today (By 6:00 PM)',
      milestones: [
        { title: 'Local Courier Dispatch', description: 'Interlocking flexi-joints placed in primary distribution bag with driver.', time: 'June 04, 01:15 PM', status: 'current' },
        { title: 'Arrived at Local Sort Hub', description: 'Sorted at sorting office block grid.', time: 'June 04, 05:40 AM', status: 'completed' },
        { title: 'Custom Clearance Approved', description: 'Logistics cargo inspection completed smoothly.', time: 'June 03, 02:40 PM', status: 'completed' },
        { title: 'Print Farm Curing Complete', description: 'Extruder batch validated and boxed in Belvia high-density carton.', time: 'June 01, 10:00 AM', status: 'completed' }
      ]
    },
    'BLV-SHIP-71510': {
      id: 'BLV-SHIP-71510',
      productName: 'Modular Helix Desk Organizer',
      qty: 1,
      material: 'PLA (Matte)',
      color: 'Matte Slate',
      weightGrams: 110,
      status: 'Printing Active Core',
      estimatedArrival: 'June 09, 2026',
      telemetry: {
        nozzleTemp: '218°C',
        bedTemp: '55°C',
        layer: '1640 / 2250 Slices',
        speed: '280 mm/s',
        filamentLeft: '84 meters'
      },
      milestones: [
        { title: '3D Printer Farm Slicing Node Active', description: 'Actively printing structural gyroid internal infill at layer 1640/2250.', time: 'June 04, 04:45 PM (Live)', status: 'current' },
        { title: 'Klipper Bed Probe Levelling', description: '36-point inductive levelling check passed. Variance: 0.015mm.', time: 'June 04, 02:10 PM', status: 'completed' },
        { title: 'G-Code Telemetry Dequeued', description: 'Slicing profiles compiled with 15% gyroid internal strength grids.', time: 'June 04, 01:30 PM', status: 'completed' },
        { title: 'Print Job Received', description: 'Payment cleared. Allocating printer bed #B4 (Bambu Lab P1S).', time: 'June 04, 12:45 PM', status: 'completed' }
      ]
    }
  };

  useEffect(() => {
    setGlobalReviews(getStoredReviews());
  }, []);

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      localStorage.setItem('belvia_profile_pic', dataUrl);
      if (onProfilePictureChange) onProfilePictureChange(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveProfilePic = () => {
    localStorage.removeItem('belvia_profile_pic');
    if (onProfilePictureChange) onProfilePictureChange(null);
  };

  const handleTrackerSearch = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setTestedCode(trimmed);
    if (PRELOADED_SHIPMENTS_TELEMETRY[trimmed]) {
      setShipmentResult(PRELOADED_SHIPMENTS_TELEMETRY[trimmed]);
    } else {
      setShipmentResult(null);
    }
  };

  const handlePostReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewOrder || !reviewTextText.trim()) return;

    const newRev: Review = {
      id: `rev-client-${Date.now()}`,
      productId: selectedReviewOrder.productId,
      author: `${firstName} ${lastName} (@verified_belvia)`,
      rating: reviewRating,
      text: reviewTextText.trim(),
      createdAt: new Date().toISOString(),
      isVerified: true,
      avatarUrl: profilePicture || undefined
    };

    saveStoredReview(newRev);
    // Refresh visual state
    setGlobalReviews(getStoredReviews());
    setReviewSuccessMsg(`Review successfully cataloged under "${selectedReviewOrder.title}"! It is now active on the home highlights and product detail tabs.`);
    setReviewTextText('');
    setReviewRating(5);
    
    setTimeout(() => {
      setSelectedReviewOrder(null);
      setReviewSuccessMsg('');
    }, 4000);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 3) {
      setIsLoggedIn(true);
    }
  };

  return (
    <section id="account-hub-section" className="py-12 bg-bg-base min-h-[85vh] relative">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative text-left">
        
        {/* LOGGED OUT VISUAL STATE */}
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-[#070b13] border border-bg-elevated rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent to-accent-secondary" />
            
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-accent/10 border border-accent/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Code className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display font-black text-xl text-white">
                {isRegisterMode ? 'Create Belvia Account' : 'Belvia Secure Portal'}
              </h3>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed font-mono">
                {isRegisterMode 
                  ? 'Sign up to register customized STL slicing jobs, track additive bed history and post client reviews.' 
                  : 'Settle slicing quotes, review shipment telemetry, and access your personalized print queues.'
                }
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest font-black">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest font-black">Secure Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 text-xs font-mono"
                />
              </div>

              {isRegisterMode && (
                <div className="flex items-center space-x-2 bg-bg-surface/60 p-3 rounded-lg border border-gray-850 text-[10px] text-gray-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>Includes dynamic PLA, PETG &amp; resin swatch allocations.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-accent to-accent-secondary text-text-on-accent hover:from-accent-hover hover:to-accent-secondary-lt font-black tracking-wider text-xs rounded-xl transition cursor-pointer font-mono shadow-lg shadow-accent/10"
              >
                {isRegisterMode ? 'REGISTER CREATOR HUB' : 'SECURE SECURE LOGIN'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('iffat2000bd@gmail.com');
                  setIsLoggedIn(true);
                }}
                className="w-full py-2.5 border border-bg-elevated bg-[#090f1f] hover:bg-bg-surface text-gray-400 hover:text-white rounded-xl transition text-[11px] font-mono font-bold cursor-pointer"
              >
                DEMO QUICK SIGN-IN (iffat2000bd@gmail.com)
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-xs text-accent hover:underline cursor-pointer font-semibold"
              >
                {isRegisterMode ? 'Already have an additive account? Sign in' : 'Create a new Belvia client profile &rarr;'}
              </button>
            </div>
          </div>
        ) : (
          
          /* LOGGED IN ACTIVE DASHBOARD HUB */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column Profile Summary & Controls */}
            <div className="lg:col-span-4 space-y-6">
              {/* User Bio Card */}
              <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/10 to-transparent rounded-full pointer-events-none" />

                {/* Hidden profile pic input */}
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicUpload}
                />
                
                <div className="flex items-center space-x-4">
                  {/* Clickable Avatar with Upload Overlay */}
                  <button
                    id="profile-avatar-upload-btn"
                    onClick={() => profilePicInputRef.current?.click()}
                    onMouseEnter={() => setPicUploadHover(true)}
                    onMouseLeave={() => setPicUploadHover(false)}
                    className="relative w-16 h-16 shrink-0 group cursor-pointer focus:outline-none"
                    title="Click to upload profile picture"
                  >
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-accent/30 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-tr from-accent to-accent-secondary rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md border border-white/15">
                        {firstName.substring(0, 1)}{lastName.substring(0,1)}
                      </div>
                    )}
                    {/* Upload hover overlay */}
                    <div className={`absolute inset-0 rounded-2xl bg-black/60 flex flex-col items-center justify-center transition-opacity duration-200 ${picUploadHover ? 'opacity-100' : 'opacity-0'}`}>
                      <Camera className="w-5 h-5 text-white" />
                      <span className="text-[9px] text-white font-mono mt-0.5">Upload</span>
                    </div>
                    {/* Tiny camera badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent border-2 border-[#070b13] flex items-center justify-center shadow">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  </button>

                  <div>
                    <h3 className="font-display font-black text-lg text-white">
                      {firstName} {lastName}
                    </h3>
                    <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded bg-accent/10 text-accent font-mono text-[9px] font-extrabold border border-accent/25">
                      <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                      <span>LEGITIMATE BUYER</span>
                    </span>
                    {profilePicture && (
                      <button
                        onClick={handleRemoveProfilePic}
                        className="block mt-1.5 text-[9px] font-mono text-red-400 hover:text-red-300 transition cursor-pointer"
                      >
                        ✕ Remove photo
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-850/80 space-y-3 font-mono text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-accent shrink-0" />
                    <span className="truncate">{email}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span className="leading-normal">{shippingAddress || 'No shipping address recorded.'}</span>
                  </div>
                </div>

                {/* Subview controllers */}
                <div className="mt-6 pt-5 border-t border-gray-850 space-y-2">
                  <button
                    onClick={() => setActiveSubView('orders')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs flex items-center justify-between cursor-pointer transition ${
                      activeSubView === 'orders' 
                        ? 'bg-accent/10 text-accent border border-accent/20 font-bold' 
                        : 'text-gray-400 hover:text-white hover:bg-bg-surface border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <ClipboardList className="w-4 h-4" />
                      <span>ORDER LOGS &amp; LOGISTICS</span>
                    </span>
                    <span className="bg-[#0b1625] px-2 py-0.5 rounded text-[10px] text-gray-400">{pastOrders.length}</span>
                  </button>

                  <button
                    onClick={() => setActiveSubView('profile')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs flex items-center justify-between cursor-pointer transition ${
                      activeSubView === 'profile' 
                        ? 'bg-accent/10 text-accent border border-accent/20 font-bold' 
                        : 'text-gray-400 hover:text-white hover:bg-bg-surface border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Settings className="w-4 h-4" />
                      <span>DENSITY PREFERENCES</span>
                    </span>
                    <span className="text-[10px] text-gray-500">SAVED</span>
                  </button>

                  <button
                    onClick={() => setActiveSubView('wishlist')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl font-mono text-xs flex items-center justify-between cursor-pointer transition ${
                      activeSubView === 'wishlist' 
                        ? 'bg-accent/10 text-accent border border-accent/20 font-bold' 
                        : 'text-gray-400 hover:text-white hover:bg-bg-surface border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <Heart className="w-4 h-4" />
                      <span>WISHLIST SPECIFICATIONS</span>
                    </span>
                    <span className="bg-[#1c0d11] px-2 py-0.5 rounded text-[10px] text-red-400 font-bold">{wishlist.length}</span>
                  </button>
                </div>

                {/* Log out trigger */}
                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="mt-6 w-full py-2 rounded-xl bg-bg-base border border-gray-850 hover:bg-red-950/20 hover:border-red-900/40 text-gray-500 hover:text-red-400 transition font-mono text-[10px] cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LOG OUT HUB</span>
                </button>
              </div>

              {/* Instant tracking lookup utility right under */}
              <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-5.5 text-left text-xs space-y-3 font-mono">
                <span className="block text-[9px] text-gray-500 tracking-widest uppercase font-black">Direct G-Code Shipment Search</span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={shipmentSearchCode}
                    onChange={(e) => setShipmentSearchCode(e.target.value)}
                    placeholder="e.g. BLV-SHIP-71510"
                    className="flex-grow bg-bg-base px-3 py-2 rounded-xl border border-bg-elevated focus:outline-none focus:border-accent text-[11px]"
                  />
                  <button
                    onClick={() => handleTrackerSearch(shipmentSearchCode)}
                    className="px-3 bg-accent-secondary hover:bg-accent text-text-on-accent rounded-xl font-bold font-mono text-[10px] cursor-pointer"
                  >
                    FIND
                  </button>
                </div>
                
                {/* Search Result Quick Preview */}
                {testedCode && (
                  shipmentResult ? (
                    <div className="p-3.5 rounded-lg bg-accent/10 border border-accent/10 text-[11px] text-gray-300 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-accent">{shipmentResult.id}</span>
                        <span className="text-gray-400">{shipmentResult.status}</span>
                      </div>
                      <p className="font-sans font-bold leading-tight line-clamp-1">{shipmentResult.productName}</p>
                      {shipmentResult.telemetry && (
                        <p className="text-[10px] text-gray-400 animate-pulse font-mono">
                          Layer: {shipmentResult.telemetry.layer} // Temp: {shipmentResult.telemetry.nozzleTemp}
                        </p>
                      )}
                      <p className="text-gray-500 text-[9px]">ETA: {shipmentResult.estimatedArrival}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-red-950/10 border border-red-500/10 text-[10px] text-red-400 text-center">
                      Code "{testedCode}" not found in local registries.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Right Column Custom Tabs Switchboards */}
            <div className="lg:col-span-8">
              
              {/* SUBVIEW A: PROFILE EDIT DETAILS */}
              {activeSubView === 'profile' && (
                <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-white">Client Customization Profile</h3>
                    <p className="text-gray-400 text-xs mt-1">Adjust air cargo delivery coordinates and baseline slicing variables.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-3 rounded-xl border border-bg-elevated text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-3 rounded-xl border border-bg-elevated text-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-3 rounded-xl border border-bg-elevated text-xs"
                      />
                    </div>
                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Shipping &amp; Cargo Destination Address</label>
                      <textarea
                        rows={3}
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-3 rounded-xl border border-bg-elevated text-xs font-sans"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-850">
                      <h4 className="text-white font-bold font-sans text-sm mb-3">Preferred Core 3D Slicing Archetypes</h4>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-gray-500 tracking-widest uppercase">Default Filament Manufacturer</label>
                      <select
                        value={defaultFilamentBrand}
                        onChange={(e) => setDefaultFilamentBrand(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 p-3 rounded-xl border border-bg-elevated focus:outline-none"
                      >
                        <option value="Bambu Labs Premium">Bambu Labs Original Spools</option>
                        <option value="Prism Exotic Silk">Prism Multi-Chroma Import</option>
                        <option value="Esun Industrial ABS">Esun Heavy Duty Heatbreak</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-gray-500 tracking-widest uppercase">Target Printbed Speed</label>
                      <select
                        value={laserSpeed}
                        onChange={(e) => setLaserSpeed(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 p-3 rounded-xl border border-bg-elevated focus:outline-none"
                      >
                        <option value="120 mm/s High Density">120 mm/s Additive Detail Print</option>
                        <option value="240 mm/s Standard Quality">240 mm/s Balanced Speed / Quality</option>
                        <option value="350 mm/s Ludicrous Speed">350 mm/s Ludicrous (Slight Stringing)</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-1 md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-500 tracking-widest uppercase">Baseline Infill Strategy</label>
                      <select
                        value={infillTarget}
                        onChange={(e) => setInfillTarget(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 p-3 rounded-xl border border-bg-elevated focus:outline-none"
                      >
                        <option value="10% Lightning (Decorative Only)">10% Lightning (Fastest, low mass weight)</option>
                        <option value="15% Gyroid (Elastic Strength)">15% Gyroid (MakerWorld favorite, excellent shear durability)</option>
                        <option value="40% Honeycomb (Heavy Industrial)">40% Honeycomb (Heavy duty, extreme structural rigidity)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <span className="text-[10px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded">
                      ✔ Client configuration auto-synced locally
                    </span>
                  </div>
                </div>
              )}

              {/* SUBVIEW B: PAST ORDERS & WRITING VERIFIED REVIEWS */}
              {activeSubView === 'orders' && (
                <div className="space-y-6">
                  
                  {/* Reviews Form overlay banner if selected and active */}
                  {selectedReviewOrder && (
                    <div className="bg-bg-elevated border border-accent/30 rounded-2xl p-6 text-left relative animate-in slide-in-from-top-4 duration-300">
                      <button 
                        onClick={() => setSelectedReviewOrder(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-md"
                      >
                        <Lock className="w-4 h-4" />
                      </button>

                      <div className="flex items-center space-x-2 text-accent font-mono text-[10px] font-bold mb-1 uppercase">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        <span>VERIFIED PURCHASE CONSTR_CHECK</span>
                      </div>

                      <h4 className="font-display font-black text-white text-base">
                        Write Verified Review: {selectedReviewOrder.title}
                      </h4>
                      <p className="text-gray-400 text-xs mt-1 leading-normal">
                        Your purchase of <code className="bg-bg-surface px-1 py-0.5 text-[10px] rounded">{selectedReviewOrder.id}</code> is logged under client id {email}. Leave a review regarding G-code precision, infill strength or shipping finish below.
                      </p>

                      <form onSubmit={handlePostReviewSubmit} className="mt-4 space-y-3">
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-400 font-mono">STAR RATING:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setReviewRating(s)}
                                className="hover:scale-110 active:scale-95 transition cursor-pointer"
                              >
                                <Star className={`w-5.1 h-5.1 ${s <= reviewRating ? 'fill-current text-amber-500' : 'text-gray-600'}`} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <textarea
                            rows={3}
                            required
                            value={reviewTextText}
                            onChange={(e) => setReviewTextText(e.target.value)}
                            placeholder="Provide your exact experiences (e.g. Dimensions were precise down to millimeters. Adhesion on heated smooth build bed was perfect!)"
                            className="w-full bg-bg-base font-sans text-xs text-gray-200 px-3 py-2 border border-bg-elevated rounded-xl focus:border-accent focus:ring-1 focus:ring-accent/20 focus:outline-none"
                          />
                        </div>

                        {reviewSuccessMsg && (
                          <div className="p-3 bg-accent/20 border border-accent/20 text-accent text-xs rounded-xl font-mono leading-relaxed">
                            {reviewSuccessMsg}
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReviewOrder(null)}
                            className="px-4 py-2 rounded-xl bg-bg-surface hover:bg-slate-850 text-gray-400 hover:text-white font-mono text-[10px] transition font-bold"
                          >
                            DISCARD
                          </button>
                          
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-text-on-accent font-bold font-mono text-[10px] transition"
                          >
                            POST VERIFIED REPORT
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Active Shipments Live Slices Feed */}
                  <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6 text-left">
                    <h3 className="font-display font-black text-lg text-white mb-1">Queue &amp; Active Production Telemetry</h3>
                    <p className="text-gray-400 text-xs mb-5">Continuous printing jobs mapped to your active registered client address.</p>

                    <div className="space-y-4">
                      {pastOrders.filter(o => o.status === 'Active Printing' || o.status === 'In Progress').map((o) => (
                        <div key={o.id} className="border border-[#10b981]/20 bg-accent/5 rounded-xl p-4.5 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[9px] font-mono text-accent bg-accent/15 px-2 py-0.5 rounded font-black border border-[#10b981]/20">
                                MANUFACTURING QUEUE // NOZZLE B4 ACTIVE
                              </span>
                              <h4 className="font-sans font-bold text-sm text-gray-100 mt-1.5">{o.title}</h4>
                              <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                Spec: {o.material} ({o.color}) // Order reference: <code className="text-accent text-[11px] font-mono">{o.id}</code>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-[8px] font-mono text-gray-500">LIVE HEAT SENSOR</span>
                              <span className="text-accent text-xs font-mono font-bold animate-pulse">218°C Stable</span>
                            </div>
                          </div>

                          {/* Machine slices simulation */}
                          <div className="bg-[#050912] p-3 rounded-lg border border-gray-850 grid grid-cols-3 gap-2 text-[10px] font-mono text-gray-400">
                            <div>
                              <span className="block text-gray-500 text-[8px]">LAYER STATUS:</span>
                              <span className="text-accent font-bold">1640 / 2250</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 text-[8px]">FEED SPEED:</span>
                              <span>280 mm/s</span>
                            </div>
                            <div>
                              <span className="block text-gray-500 text-[8px]">K-BED POSITION:</span>
                              <span>[X:142.4, Y:092.1]</span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-1.5">
                            <span className="text-[10px] font-mono text-gray-500">ETA: June 09 via air parcel</span>
                            
                            <button
                              onClick={() => {
                                setShipmentSearchCode(o.trackingCode);
                                handleTrackerSearch(o.trackingCode);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-accent-secondary hover:bg-accent text-text-on-accent font-bold font-mono text-[9px] cursor-pointer transition"
                            >
                              OPEN LIVE TRACKER
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historical logs list */}
                  <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6 text-left">
                    <h3 className="font-display font-black text-lg text-white mb-1">Delivered Fabrications Logs</h3>
                    <p className="text-gray-400 text-xs mb-5">History of physical spools dispatched, with verified client feedback links.</p>

                    <div className="space-y-4">
                      {pastOrders.filter(o => o.status === 'Delivered').map((o) => {
                        // Check if a review already exists from this client for this product
                        const alreadyReviewed = globalReviews.some(
                          r => r.productId === o.productId && r.author.includes(firstName)
                        );

                        return (
                          <div key={o.id} className="p-4 rounded-xl bg-bg-base/60 border border-gray-850 hover:border-gray-750 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                            <div className="space-y-1 text-left">
                              <div className="flex items-center space-x-2">
                                <span className="text-[9px] bg-bg-surface border border-bg-elevated text-gray-400 px-1.5 py-0.5 rounded font-black">
                                  {o.id}
                                </span>
                                <span className="text-accent font-bold flex items-center text-[10px] text-accent">
                                  <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5" />
                                  COMPLETED &amp; SIGNED
                                </span>
                              </div>
                              <h4 className="font-sans font-bold text-sm text-gray-200 mt-1 font-sans">{o.title}</h4>
                              <p className="text-gray-500 text-[10px]">
                                Dispatched {o.date} // Weight: {o.productId === 'bv-005' ? '210' : '165'}g // Value: ${o.price.toFixed(2)}
                              </p>
                            </div>

                            <div className="flex space-x-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => {
                                  setShipmentSearchCode(o.trackingCode);
                                  handleTrackerSearch(o.trackingCode);
                                }}
                                className="px-3 py-1.5 bg-[#0e172a] hover:bg-[#1e293b] border border-bg-elevated hover:border-gray-700 text-accent hover:text-white rounded-lg transition text-[9px] font-bold"
                              >
                                LOGISTICS HIST
                              </button>

                              {alreadyReviewed ? (
                                <span className="px-3 py-1.5 bg-accent/20 border border-accent/20 text-accent rounded-lg text-[9px] font-black uppercase tracking-wider block">
                                  ✔ REPORT POSTED
                                </span>
                              ) : (
                                <button
                                  onClick={() => setSelectedReviewOrder(o)}
                                  className="px-3.5 py-1.5 bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent rounded-lg transition text-[9px] font-black tracking-wider uppercase cursor-pointer"
                                >
                                  ✎ Write Review
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* SUBVIEW C: WISHLIST OVERVIEW */}
              {activeSubView === 'wishlist' && (
                <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="font-display font-black text-xl text-white">Saved Slices &amp; Wishlist</h3>
                    <p className="text-gray-400 text-xs mt-1">High-performance geometries pinned for future CAD custom slicing.</p>
                  </div>

                  {wishlist.length === 0 ? (
                    <div className="text-center py-16 bg-bg-base/40 border border-gray-850/60 rounded-2xl space-y-3.5">
                      <Heart className="w-10 h-10 text-gray-750 mx-auto animate-pulse" />
                      <div>
                        <h4 className="text-white font-bold font-display text-sm">Your Additive Wishlist is Clear</h4>
                        <p className="text-gray-500 text-xs max-w-xs mx-auto mt-1 leading-normal font-sans">
                          Click the customizable heart badge on any design card in the Ready-Made store to store it here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlist.map((w) => (
                        <div
                          key={w.id}
                          className="p-3 bg-bg-base/50 border border-gray-850 rounded-xl flex items-center space-x-3 text-xs justify-between"
                        >
                          <div className="flex items-center space-x-3 text-left">
                            <img src={w.images[0]} alt={w.title} className="w-12 h-12 rounded-lg object-cover border border-bg-elevated" />
                            <div>
                              <h4 className="font-sans font-bold text-gray-200 line-clamp-1">{w.title}</h4>
                              <span className="font-mono text-[10px] text-accent">${w.price.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex space-x-1.5 shrink-0">
                            <button
                              onClick={() => onQuickView(w)}
                              className="p-1.5 rounded-lg bg-bg-surface border border-bg-elevated text-gray-405 hover:text-white cursor-pointer"
                              title="Inspect swatches"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onAddToCartAndRemove(w)}
                              className="p-1.5 bg-accent hover:bg-accent-hover text-text-on-accent rounded-lg font-bold cursor-pointer transition"
                              title="Purchase now"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onToggleWishlist(w)}
                              className="p-1.5 text-red-500 hover:text-red-400 bg-bg-surface border border-bg-elevated rounded-lg cursor-pointer"
                              title="Remove"
                            >
                              <Heart className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </section>
  );
}
