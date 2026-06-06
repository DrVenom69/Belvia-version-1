import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RotateCcw, AlertTriangle, ShoppingCart } from 'lucide-react';
import { calculateKeychainSpecs, validateKeychainInput } from '../utils/keychainCalculations';
import { CartItem, Product } from '../types';

interface NameKeychainBuilderProps {
  onAddToCart: (item: CartItem) => void;
}

const FONT_OPTIONS = [
  { id: 'Syne', name: 'Syne (Brand Display)', lang: 'en' },
  { id: 'DM Sans', name: 'DM Sans (Clean Sans)', lang: 'en' },
  { id: 'Archivo Black', name: 'Archivo Black (Heavy Block)', lang: 'en' },
  { id: 'Pacifico', name: 'Pacifico (Retro Script)', lang: 'en' },
  { id: 'Fredoka', name: 'Fredoka (Soft Rounded)', lang: 'en' },
  { id: 'Hind Siliguri', name: 'Hind Siliguri (Clean)', lang: 'bn' },
  { id: 'Noto Sans Bengali', name: 'Noto Sans Bengali (Classic)', lang: 'bn' },
  { id: 'Galada', name: 'Galada (Calligraphy)', lang: 'bn' },
  { id: 'Mina', name: 'Mina (Modern Display)', lang: 'bn' }
];

const THEMES = [
  { id: 'standard', name: 'Standard Outline', desc: 'Smooth outline contour with hanging key ring hole.' },
  { id: 'floral', name: 'Floral Garden', desc: 'Edged with botanical vines, leaves, and petaled silhouettes.' },
  { id: 'dogtag', name: 'Tactical Dog Tag', desc: 'Rugged badge outline with corner structural rivets.' },
  { id: 'numberplate', name: 'Dhaka License Plate', desc: 'Bangladesh Flag strip and Dhaka Metro subtext header.' },
  { id: 'football', name: 'Championship Football', desc: 'Soccer shield emblem with custom panel seams.' }
];

const PRESET_PALETTES = [
  { text: '#ffffff', stroke: '#f5af19', name: 'Amber Gold' },
  { text: '#080c14', stroke: '#00e5ff', name: 'Cyber Neon' },
  { text: '#ff0055', stroke: '#111827', name: 'Dark Ruby' },
  { text: '#ffffff', stroke: '#10b981', name: 'Emerald Forest' },
  { text: '#f5af19', stroke: '#ffffff', name: 'White & Gold' }
];

export default function NameKeychainBuilder({ onAddToCart }: NameKeychainBuilderProps) {
  const [name, setName] = useState<string>('BELVIA');
  const [selectedFont, setSelectedFont] = useState<string>('Syne');
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>('#f5af19');
  const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [theme, setTheme] = useState<'standard' | 'floral' | 'dogtag' | 'numberplate' | 'football'>('standard');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('PLA (Matte)');

  // 3D Mouse tilt state
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Dynamic specs
  const specs = calculateKeychainSpecs({
    name,
    font: selectedFont,
    textColor,
    strokeColor,
    size,
    theme,
    customizationVersion: 1
  });

  // Validations
  const validation = validateKeychainInput(name, textColor, strokeColor);

  // Auto-detect script to change font language recommendation
  useEffect(() => {
    const isBn = /[\u0980-\u09FF]/.test(name);
    const activeOption = FONT_OPTIONS.find(f => f.id === selectedFont);
    if (isBn && activeOption?.lang === 'en') {
      setSelectedFont('Hind Siliguri'); // Fallback to clean Bangla
    } else if (!isBn && name.length > 0 && activeOption?.lang === 'bn') {
      setSelectedFont('Syne'); // Fallback to brand English
    }
  }, [name]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAutoSpin || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setRotation({
      x: -y * 35, // Rotate X (up/down tilt)
      y: x * 40   // Rotate Y (left/right tilt)
    });
  };

  const handlePointerLeave = () => {
    if (!isAutoSpin) {
      setRotation({ x: 0, y: 0 });
    }
  };

  const handleRandomize = () => {
    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setTextColor(randomHex());
    setStrokeColor(randomHex());
  };

  // Serializes SVG state into data URL to snapshot preview thumbnail
  const generatePreviewDataUrl = () => {
    const svgElement = document.getElementById('keychain-svg-rendered');
    if (!svgElement) return '';
    const svgString = new XMLSerializer().serializeToString(svgElement);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
  };

  const handleAddClick = () => {
    if (!validation.isValid) return;

    const previewUrl = generatePreviewDataUrl();
    const baseKeychainProduct: Product = {
      id: 'bv-keychain-template',
      title: `Custom Name Keychain (${name})`,
      description: `Customization specs: "${name}" text, printed with ${selectedFont} font, themed as ${theme}.`,
      category: 'Keychains',
      price: specs.price,
      colors: [strokeColor, textColor],
      materials: ['PLA (Matte)', 'PETG (Durable)', 'TPU (Flexible)'],
      rating: 5.0,
      reviewsCount: 0,
      printTime: `${specs.printTimeMinutes}m`,
      weightGrams: specs.weightGrams,
      images: [previewUrl || 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800'],
      infill: '20% Grid',
      dimensions: specs.dimensions,
      isCustomizable: true
    };

    const cartItemSnapshot: CartItem = {
      product: baseKeychainProduct,
      selectedColor: strokeColor,
      selectedMaterial: selectedMaterial,
      quantity,
      customPreviewUrl: previewUrl,
      calculatedPrice: specs.price,
      calculatedWeight: specs.weightGrams,
      calculatedDimensions: specs.dimensions,
      customization: {
        name,
        font: selectedFont,
        textColor,
        strokeColor,
        size,
        theme,
        customizationVersion: 1
      }
    };

    onAddToCart(cartItemSnapshot);
  };

  // Dynamic rendering helper for the theme layouts
  const renderThemeBackplate = () => {
    const textWidth = Math.max(120, name.length * 20 + 30);
    
    switch (theme) {
      case 'floral':
        return (
          <g>
            <rect x="0" y="20" width={textWidth} height="70" rx="25" fill={strokeColor} filter="url(#inset-shadow)" />
            <circle cx="20" cy="55" r="12" fill={strokeColor} />
            <circle cx="20" cy="55" r="5" fill="#080c14" />
            <path d="M 40,20 C 50,5 60,5 70,20 C 60,30 50,30 40,20 Z" fill="#10b981" opacity="0.85" />
            <path d={`M ${textWidth - 50},20 C ${textWidth - 40},5 ${textWidth - 30},5 ${textWidth - 20},20 C ${textWidth - 30},30 ${textWidth - 40},30 ${textWidth - 50},20 Z`} fill="#10b981" opacity="0.85" />
            <circle cx="55" cy="12" r="5" fill="#ef4444" />
            <circle cx={textWidth - 35} cy="12" r="5" fill="#ef4444" />
          </g>
        );
      case 'dogtag':
        return (
          <g>
            <rect x="5" y="15" width={textWidth - 10} height="74" rx="10" fill={strokeColor} stroke="#ffffff" strokeWidth="2" opacity="0.9" />
            <rect x="10" y="20" width={textWidth - 20} height="64" rx="8" fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.5" />
            <circle cx="25" cy="52" r="6" fill="#080c14" />
            <circle cx="18" cy="28" r="2.5" fill="#ffffff" opacity="0.8" />
            <circle cx={textWidth - 18} cy="28" r="2.5" fill="#ffffff" opacity="0.8" />
            <circle cx="18" cy="76" r="2.5" fill="#ffffff" opacity="0.8" />
            <circle cx={textWidth - 18} cy="76" r="2.5" fill="#ffffff" opacity="0.8" />
          </g>
        );
      case 'numberplate':
        return (
          <g>
            <rect x="5" y="15" width={textWidth - 10} height="74" rx="6" fill={strokeColor} stroke="#ffffff" strokeWidth="2.5" />
            <rect x="15" y="25" width="22" height="54" fill="#006a4e" rx="2" />
            <circle cx="26" cy="52" r="6.5" fill="#f42a41" />
            <text x={textWidth / 2 + 10} y="32" fill={textColor} fontSize="10" fontFamily="Syne" fontWeight="900" textAnchor="middle" letterSpacing="2">
              DHAKA METRO
            </text>
            <line x1="45" y1="36" x2={textWidth - 15} y2="36" stroke={textColor} strokeWidth="1" opacity="0.4" />
          </g>
        );
      case 'football':
        return (
          <g>
            <path d={`M 10,15 L ${textWidth - 10},15 L ${textWidth - 5},50 L ${textWidth / 2},90 L 5,50 Z`} fill={strokeColor} stroke="#ffffff" strokeWidth="2" />
            <circle cx={textWidth / 2} cy="28" r="10" fill="#080c14" />
            <path d={`M ${textWidth / 2 - 20},50 Q ${textWidth / 2},35 ${textWidth / 2 + 20},50`} stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.25" />
            <path d={`M ${textWidth / 2 - 20},50 Q ${textWidth / 2},65 ${textWidth / 2 + 20},50`} stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.25" />
          </g>
        );
      case 'standard':
      default:
        return (
          <g>
            <rect x="0" y="20" width={textWidth} height="65" rx="20" fill={strokeColor} />
            <circle cx="20" cy="52" r="12" fill={strokeColor} />
            <circle cx="20" cy="52" r="5" fill="#080c14" />
          </g>
        );
    }
  };

  const getThemeTranslationY = () => {
    if (theme === 'numberplate') return 62;
    return 56;
  };

  const getThemeTranslationX = () => {
    if (theme === 'numberplate') return 52;
    return 42;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto p-4 sm:p-6 text-left">
      
      {/* Left Side: 3D Preview Stage */}
      <div className="lg:col-span-6 flex flex-col justify-between bg-[#070b13] border border-bg-elevated rounded-2xl p-6 relative overflow-hidden shadow-2xl min-h-[420px]">
        <div className="absolute inset-0 bg-grid-ambient opacity-15 pointer-events-none" />
        
        <div className="flex items-center justify-between z-10">
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
            Live print telemetry preview
          </span>
          <button
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`px-3 py-1 rounded-lg border text-[10px] font-mono transition cursor-pointer ${
              isAutoSpin ? 'bg-accent/20 border-accent text-accent' : 'border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Auto-Spin: {isAutoSpin ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Interactive 3D Perspective viewport */}
        <div 
          className="flex-grow flex items-center justify-center py-16 cursor-grab active:cursor-grabbing select-none"
          style={{ perspective: '800px' }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          ref={previewContainerRef}
        >
          <div 
            className={`relative transition-transform duration-75 ${isAutoSpin ? 'animate-[spin_8s_linear_infinite]' : ''}`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isAutoSpin ? undefined : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
            }}
          >
            {/* Stacked Backing Extrusions (10 layers) */}
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 pointer-events-none select-none"
                style={{
                  transform: `translateZ(${i * 0.8}px)`,
                  filter: `brightness(${75 - i * 5}%)`
                }}
              >
                <svg width="280" height="110" viewBox="0 0 280 110" fill="none">
                  {renderThemeBackplate()}
                </svg>
              </div>
            ))}

            {/* Main Faceplate (Front Layer) */}
            <div style={{ transform: 'translateZ(8px)' }}>
              <svg id="keychain-svg-rendered" width="280" height="110" viewBox="0 0 280 110" fill="none">
                <defs>
                  <filter id="inset-shadow">
                    <feOffset dx="0" dy="1"/>
                    <feGaussianBlur stdDeviation="1" result="offset-blur"/>
                    <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
                    <feFlood floodColor="black" floodOpacity="0.4" result="color"/>
                    <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
                    <feComposite operator="over" in="shadow" in2="SourceGraphic"/>
                  </filter>
                </defs>
                
                {renderThemeBackplate()}
                
                {/* Dynamic Custom Text Layer */}
                <text
                  x={getThemeTranslationX()}
                  y={getThemeTranslationY()}
                  fill={textColor}
                  fontSize="22"
                  fontFamily={selectedFont}
                  fontWeight="800"
                  textAnchor="start"
                >
                  {name || 'NAME'}
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Sizing & Material Metrics bottom bar */}
        <div className="border-t border-gray-850 pt-4 grid grid-cols-3 gap-3 font-mono text-center z-10">
          <div className="bg-bg-base border border-gray-850 p-2.5 rounded-xl">
            <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Dimensions</span>
            <span className="text-[10px] font-bold text-gray-200">{specs.dimensions}</span>
          </div>
          <div className="bg-bg-base border border-gray-850 p-2.5 rounded-xl">
            <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Est Weight</span>
            <span className="text-[10px] font-bold text-accent">{specs.weightGrams}g</span>
          </div>
          <div className="bg-bg-base border border-gray-850 p-2.5 rounded-xl">
            <span className="block text-[8px] text-gray-500 uppercase tracking-widest">Print Duration</span>
            <span className="text-[10px] font-bold text-gray-200">{specs.printTimeMinutes} min</span>
          </div>
        </div>

      </div>

      {/* Right Side: Configurator Controls Panel */}
      <div className="lg:col-span-6 bg-[#070b13] border border-bg-elevated rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative">
        
        <div className="space-y-6">
          <h3 className="font-display font-extrabold text-lg text-white">Configure Custom Name Keychain</h3>
          
          {/* Name input */}
          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              Custom Text Name (Eng / বাংলা):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.substring(0, 15))}
              placeholder="ENTER NAME"
              className="w-full bg-bg-base text-white border border-bg-elevated rounded-xl py-2.5 px-3 text-sm font-semibold focus:border-accent"
            />
            <span className="block text-[9px] text-gray-500 mt-1 font-mono text-right">
              {name.length}/15 characters (Alphanumeric and spaces allowed)
            </span>
          </div>

          {/* Font selector */}
          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              Typographic Font style:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFont(f.id)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition cursor-pointer ${
                    selectedFont === f.id
                      ? 'bg-accent/15 border-accent text-white font-bold'
                      : 'bg-bg-base/40 border-bg-elevated text-gray-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <span style={{ fontFamily: f.id }}>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Themes list */}
          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
              Themed Collection Shape:
            </label>
            <div className="space-y-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex justify-between items-center cursor-pointer ${
                    theme === t.id
                      ? 'bg-accent/15 border-accent text-white font-bold'
                      : 'bg-bg-base/40 border-bg-elevated text-gray-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <span className="block font-bold">{t.name}</span>
                    <span className="block text-[10px] text-gray-500 font-normal">{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors picker */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                Custom Colors & Preset Swatches:
              </label>
              <button
                onClick={handleRandomize}
                className="text-[9px] font-mono text-accent hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Randomize</span>
              </button>
            </div>

            {/* Presets swatch row */}
            <div className="flex gap-2 mb-3.5">
              {PRESET_PALETTES.map((palette, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTextColor(palette.text);
                    setStrokeColor(palette.stroke);
                  }}
                  className="w-7 h-7 rounded-full border border-bg-elevated flex overflow-hidden cursor-pointer"
                  title={palette.name}
                >
                  <div className="w-1/2 h-full" style={{ backgroundColor: palette.text }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: palette.stroke }} />
                </button>
              ))}
            </div>

            {/* Exact hex pickers */}
            <div className="grid grid-cols-2 gap-4 font-mono text-[10px] text-gray-400">
              <div className="bg-bg-base border border-bg-elevated p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <span>Letters Color</span>
                  <span className="block text-white font-bold">{textColor}</span>
                </div>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-6 h-6 border-0 cursor-pointer bg-transparent rounded"
                />
              </div>
              <div className="bg-bg-base border border-bg-elevated p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <span>Backplate Color</span>
                  <span className="block text-white font-bold">{strokeColor}</span>
                </div>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-6 h-6 border-0 cursor-pointer bg-transparent rounded"
                />
              </div>
            </div>
          </div>

          {/* Sizes selector and material choice */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                Keychain Size:
              </label>
              <div className="flex bg-bg-base border border-bg-elevated rounded-xl p-1 justify-between">
                {(['Small', 'Medium', 'Large'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 text-center cursor-pointer ${
                      size === s
                        ? 'bg-accent text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">
                Resin Material:
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full bg-bg-base text-gray-300 border border-bg-elevated rounded-xl py-2 px-3 text-xs focus:border-accent"
              >
                <option value="PLA (Matte)">PLA (Matte)</option>
                <option value="PLA (Silk Pearl)">PLA (Silk Pearl)</option>
                <option value="PETG (Durable)">PETG (Durable)</option>
                <option value="TPU (Flexible)">TPU (Flexible)</option>
              </select>
            </div>
          </div>

        </div>

        <div className="border-t border-gray-850 pt-5 mt-6 space-y-4">
          {/* Validation guards rendering */}
          {!validation.isValid && (
            <div className="p-3 bg-red-955/20 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validation.error}</span>
            </div>
          )}

          {validation.isValid && validation.contrastWarning && (
            <div className="p-3 bg-yellow-955/20 border border-yellow-500/20 rounded-xl flex items-start space-x-2 text-yellow-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Low contrast: Text may not be readable when printed. Consider selecting high-contrast colors.</span>
            </div>
          )}

          {/* Cost, Qty, Submit block */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[8px] font-mono text-gray-500 uppercase tracking-widest">Total Price</span>
              <span className="text-2xl font-bold text-accent">${(specs.price * quantity).toFixed(2)}</span>
            </div>

            <div className="flex items-center space-x-3.5">
              {/* Quantity adjuster */}
              <div className="flex items-center bg-bg-base border border-bg-elevated rounded-xl p-1 justify-between max-w-[110px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-850 rounded cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-white text-xs font-bold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-850 rounded cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddClick}
                disabled={!validation.isValid}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt shadow transition flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Queue print</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
