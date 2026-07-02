import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, RotateCcw, AlertTriangle, ShoppingCart } from 'lucide-react';
import { calculateKeychainSpecs, validateKeychainInput } from '../utils/keychainCalculations';
import { CartItem, Product } from '../types';
import { formatPrice } from '../utils/format';

interface NameKeychainBuilderProps {
  onAddToCart: (item: CartItem) => void;
  activeColors?: { name: string, hex: string }[];
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
  { id: 'licenseplate', name: 'License Plate', desc: 'Bangladeshi license plate design with custom region text and centered layouts.' }
];

const PRESET_PALETTES = [
  { text: '#ffffff', stroke: '#f5af19', name: 'Amber Gold' },
  { text: '#080c14', stroke: '#00e5ff', name: 'Cyber Neon' },
  { text: '#ff0055', stroke: '#111827', name: 'Dark Ruby' },
  { text: '#ffffff', stroke: '#10b981', name: 'Emerald Forest' },
  { text: '#f5af19', stroke: '#ffffff', name: 'White & Gold' }
];

// Dynamically darkens hex color values for 3D extrusion shading
function darkenColor(hex: string, percent: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16);
  let g = ((num >> 8) & 0x00ff);
  let b = (num & 0x0000ff);
  
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Dynamically adjusts font size based on text length to prevent clipping in viewport
function getFontSize(name: string): number {
  const len = name.length;
  if (len <= 6) return 22;
  if (len <= 9) return 19;
  if (len <= 12) return 16;
  return 13;
}

// Dynamically calculates stroke width proportional to font size (narrower contour outline)
function getStrokeWidth(fontSize: number): number {
  return Math.round(fontSize * 0.45);
}

// Helper to estimate text width based on font-family and character width ratios
function estimateTextWidth(text: string, font: string, size: number): number {
  const fontRatios: Record<string, number> = {
    'Syne': 1.15,
    'Hind Siliguri': 0.85,
    'Outfit': 0.75,
    'Cinzel': 0.9,
    'Rubik Doodle Shadow': 1.0,
    'Playfair Display': 0.8,
    'Bebas Neue': 0.65,
    'Space Mono': 0.7,
    'Pacifico': 0.85,
    'Galada': 0.95
  };
  const ratio = fontRatios[font] || 0.75;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode >= 0x0980 && charCode <= 0x09FF) {
      total += size * 0.85; // Bangla character
    } else if (text[i] === ' ' || text[i] === '-') {
      total += size * 0.35;
    } else if (/[Iil1]/.test(text[i])) {
      total += size * 0.3;
    } else if (/[MWmw]/.test(text[i])) {
      total += size * 0.95;
    } else {
      total += size * ratio;
    }
  }
  return total * 1.05; // 5% safety margin for rendering differences across OS/browsers
}

export default function NameKeychainBuilder({ onAddToCart, activeColors = [] }: NameKeychainBuilderProps) {
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [strokeColor, setStrokeColor] = useState<string>('#f5af19');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('belvia_products');
      if (stored) {
        const prodList = JSON.parse(stored);
        const keychainTemplate = prodList.find((p: any) => p.id === 'bv-keychain-template');
        if (keychainTemplate && keychainTemplate.stockQuantity === 0) {
          setIsOutOfStock(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse products for stock check:', e);
    }
  }, []);

  // Update default colors if they are out of stock
  useEffect(() => {
    if (activeColors.length > 0) {
      const hasTextCol = activeColors.some(c => c.hex.toLowerCase() === textColor.toLowerCase());
      const hasStrokeCol = activeColors.some(c => c.hex.toLowerCase() === strokeColor.toLowerCase());
      if (!hasTextCol) setTextColor(activeColors[0].hex);
      if (!hasStrokeCol) setStrokeColor(activeColors[Math.min(1, activeColors.length - 1)].hex);
    }
  }, [activeColors]);

  const getTextureStyle = (col: string): React.CSSProperties => {
    const textures: Record<string, React.CSSProperties> = {
      'Matte Slate': { background: 'radial-gradient(circle at 35% 35%, #64748b 0%, #334155 70%, #1e293b 100%)' },
      'Chalk White': { background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f1f5f9 60%, #cbd5e1 100%)' },
      'Chalk White (Translucent Only)': { background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, rgba(241,245,249,0.7) 60%, rgba(203,213,225,0.5) 100%)', backdropFilter: 'blur(2px)' },
      'Emerald Green': { background: 'radial-gradient(circle at 35% 35%, #34d399 0%, #059669 70%, #064e3b 100%)' },
      'Burnt Orange': { background: 'radial-gradient(circle at 35% 35%, #fb923c 0%, #ea580c 70%, #7c2d12 100%)' },
      'Obsidian Black': { background: 'radial-gradient(circle at 35% 35%, #334155 0%, #0f172a 70%, #020617 100%)' },
      'Jade Green': { background: 'radial-gradient(circle at 35% 35%, #059669 0%, #047857 70%, #022c22 100%)' },
      'Silk Copper': { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 30%, #b45309 60%, #f59e0b 80%, #78350f 100%)', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)' },
      'Neon Nebula': { background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 35%, #db2777 70%, #c084fc 100%)' },
      'Pastel Mint': { background: 'radial-gradient(circle at 35% 35%, #a7f3d0 0%, #34d399 75%, #065f46 100%)' },
      'Sandstone Grey': { background: 'radial-gradient(circle at 35% 35%, #a8a29e 0%, #78716c 70%, #44403c 100%)' },
      'Terracotta': { background: 'radial-gradient(circle at 35% 35%, #f97316 0%, #c2410c 75%, #7c2d12 100%)' },
      'Neon Violet': { background: 'radial-gradient(circle at 35% 35%, #a78bfa 0%, #6d28d9 75%, #4c1d95 100%)' },
      'Cyber Yellow': { background: 'radial-gradient(circle at 35% 35%, #fef08a 0%, #eab308 70%, #854d0e 100%)' },
      'Steel Blue': { background: 'radial-gradient(circle at 35% 35%, #60a5fa 0%, #2563eb 70%, #1e3a8a 100%)' },
      'Signal Orange': { background: 'radial-gradient(circle at 35% 35%, #ff6b35 0%, #ff4500 70%, #990000 100%)' },
      'Steel Gray': { background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 30%, #475569 60%, #94a3b8 80%, #334155 100%)' },
      'Silver Pearl': { background: 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 35%, #94a3b8 70%, #cbd5e1 100%)', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5)' },
    };
    return textures[col] || { background: col };
  };

  const availableColors = activeColors;

  // Best license plate colors helper
  const getBestLicensePlateColors = () => {
    let blackHex = '#000000';
    let whiteHex = '#ffffff';
    
    if (activeColors.length > 0) {
      const blackMatch = activeColors.find(c => 
        c.name.toLowerCase().includes('black') || 
        c.name.toLowerCase().includes('obsidian') ||
        c.hex.toLowerCase() === '#000000' ||
        c.hex.toLowerCase() === '#080c14'
      );
      if (blackMatch) blackHex = blackMatch.hex;
      else blackHex = activeColors[0].hex;

      const whiteMatch = activeColors.find(c => 
        c.name.toLowerCase().includes('white') || 
        c.name.toLowerCase().includes('pearl') ||
        c.hex.toLowerCase() === '#ffffff'
      );
      if (whiteMatch) whiteHex = whiteMatch.hex;
      else whiteHex = activeColors[Math.min(1, activeColors.length - 1)].hex;
    }
    return { blackHex, whiteHex };
  };

  const [name, setName] = useState<string>('BELVIA');
  const [selectedFont, setSelectedFont] = useState<string>('Syne');
  const [size, setSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [theme, setTheme] = useState<'standard' | 'licenseplate'>('standard');
  const [licensePlateRegion, setLicensePlateRegion] = useState<string>('Dhaka Metro');
  const [quantity, setQuantity] = useState<number>(1);
  const [isAutoSpin, setIsAutoSpin] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('PLA (Matte)');

  // 3D Mouse tilt state (default rest tilt of rotateX(20deg) rotateY(-25deg))
  const [rotation, setRotation] = useState({ x: 20, y: -25 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Sizing and auto-fit parameters
  const getAutoFitParams = () => {
    const defaultFontSize = getFontSize(name);
    
    if (theme === 'standard') {
      const estTextWidth = estimateTextWidth(name, selectedFont, defaultFontSize);
      // Left margin: 42 (loop), right margin: 30
      const calculatedWidth = Math.max(160, estTextWidth + 42 + 30);
      return { fontSize: defaultFontSize, regionFontSize: 11, shapeWidth: calculatedWidth };
    }
    
    // theme === 'licenseplate'
    const leftMargin = 20;
    const rightMargin = 20;
    const maxDefaultWidth = 280;
    const initialWSafe = maxDefaultWidth - leftMargin - rightMargin; // 240
    
    // Estimate width for bottom text (name) and top text (region)
    const estWidthDefault = estimateTextWidth(name, selectedFont, defaultFontSize);
    const regionDefaultFontSize = 11;
    const estRegionWidthDefault = estimateTextWidth(licensePlateRegion, 'Syne', regionDefaultFontSize);
    
    const maxEstWidthDefault = Math.max(estWidthDefault, estRegionWidthDefault);
    
    // Step 1: Fits at default sizes within maxDefaultWidth
    if (maxEstWidthDefault <= initialWSafe) {
      const calculatedWidth = Math.min(280, Math.max(160, maxEstWidthDefault + leftMargin + rightMargin));
      return { fontSize: defaultFontSize, regionFontSize: regionDefaultFontSize, shapeWidth: calculatedWidth };
    }
    
    // Step 2: Scale down
    const scaleName = initialWSafe / estWidthDefault;
    const scaleRegion = initialWSafe / estRegionWidthDefault;
    
    if (scaleName >= 0.6 && scaleRegion >= 0.6) {
      const finalFontSize = Math.max(Math.round(defaultFontSize * scaleName * 10) / 10, Math.round(defaultFontSize * 0.6 * 10) / 10);
      const finalRegionFontSize = Math.max(Math.round(regionDefaultFontSize * scaleRegion * 10) / 10, Math.round(regionDefaultFontSize * 0.6 * 10) / 10);
      return { fontSize: finalFontSize, regionFontSize: finalRegionFontSize, shapeWidth: maxDefaultWidth };
    }
    
    // Step 3: Locked at 60% minimum, stretch shape width
    const minFontSize = Math.round(defaultFontSize * 0.6 * 10) / 10;
    const minRegionFontSize = Math.round(regionDefaultFontSize * 0.6 * 10) / 10;
    
    const requiredWSafeName = estimateTextWidth(name, selectedFont, minFontSize);
    const requiredWSafeRegion = estimateTextWidth(licensePlateRegion, 'Syne', minRegionFontSize);
    
    const maxRequiredWSafe = Math.max(requiredWSafeName, requiredWSafeRegion);
    const calculatedWidth = Math.round(leftMargin + maxRequiredWSafe + rightMargin);
    
    return { fontSize: minFontSize, regionFontSize: minRegionFontSize, shapeWidth: calculatedWidth };
  };

  const { fontSize: renderFontSize, regionFontSize, shapeWidth } = getAutoFitParams();
  const strokeWidth = getStrokeWidth(renderFontSize);

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

  // Pre-select Chalk White / Obsidian Black when License Plate theme is selected
  useEffect(() => {
    if (theme === 'licenseplate') {
      const { blackHex, whiteHex } = getBestLicensePlateColors();
      setTextColor(blackHex);
      setStrokeColor(whiteHex);
    }
  }, [theme]);

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
      x: 20 - y * 30, // Rotate X (centered around 20deg default, range 5deg to 35deg)
      y: -25 + x * 40 // Rotate Y (centered around -25deg default, range -45deg to -5deg)
    });
  };

  const handlePointerLeave = () => {
    if (!isAutoSpin) {
      setRotation({ x: 20, y: -25 });
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
        licensePlateRegion: theme === 'licenseplate' ? licensePlateRegion : undefined,
        customizationVersion: 1
      }
    };

    onAddToCart(cartItemSnapshot);
  };

  // Dynamic rendering helper for the theme layouts
  const renderThemeBackplate = (overrideColor?: string, isSideWall: boolean = false) => {
    const color = overrideColor || strokeColor;
    const textWidth = shapeWidth;
    
    switch (theme) {
      case 'licenseplate':
        const backplateFill = color;
        const borderStroke = isSideWall ? color : textColor;
        return (
          <g>
            <rect x="5" y="15" width={textWidth - 10} height="74" rx="6" fill={backplateFill} stroke={borderStroke} strokeWidth="3" />
            {!isSideWall && (
              <>
                <text x={textWidth / 2} y="34" fill={textColor} fontSize={regionFontSize} fontFamily="Syne" fontWeight="900" textAnchor="middle" letterSpacing="2">
                  {(licensePlateRegion || 'DHAKA METRO').toUpperCase()}
                </text>
                <line x1="15" y1="42" x2={textWidth - 15} y2="42" stroke={textColor} strokeWidth="1.5" opacity="0.85" />
              </>
            )}
          </g>
        );
      case 'standard':
      default:
        return (
          <g>
            {/* Contoured Text Silhouette Backplate (Rendered first so loop/hole sits cleanly on top of outline) */}
            <text
              x={getThemeTranslationX()}
              y={getThemeTranslationY()}
              fill={color}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              fontSize={renderFontSize}
              fontFamily={selectedFont}
              fontWeight="800"
              textAnchor="start"
            >
              {name || 'NAME'}
            </text>

            {/* Structural bridge connecting ring loop to letters */}
            <rect x="26" y="46" width="16" height="12" fill={color} rx="2" />
            
            {/* Ring loop (Positioned closer to the tag body at cx=30) */}
            <circle cx="30" cy="52" r="11" fill={color} />
            <circle cx="30" cy="52" r="4.5" fill="#080c14" />
          </g>
        );
    }
  };

  const getThemeTranslationY = () => {
    if (theme === 'licenseplate') return 72;
    return 56;
  };

  const getThemeTranslationX = () => {
    if (theme === 'licenseplate') return shapeWidth / 2;
    return 42;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto p-4 sm:p-6 text-left">
      
      {/* Hidden SVG for Cart Thumbnail Capture */}
      <svg
        id="keychain-svg-rendered"
        width={shapeWidth}
        height="110"
        viewBox={`0 0 ${shapeWidth} 110`}
        fill="none"
        className="hidden"
      >
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
        {renderThemeBackplate(strokeColor, false)}
        <text
          x={getThemeTranslationX()}
          y={getThemeTranslationY()}
          fill={textColor}
          fontSize={renderFontSize}
          fontFamily={selectedFont}
          fontWeight="800"
          textAnchor={theme === 'licenseplate' ? 'middle' : 'start'}
        >
          {name || 'NAME'}
        </text>
      </svg>

      {/* Left Side: 3D Preview Stage */}
      <div className="lg:col-span-6 sticky top-[88px] lg:top-[136px] z-30 lg:self-start lg:max-h-[calc(100vh-120px-32px)] flex flex-col justify-between bg-bg-surface/90 backdrop-blur-md border border-border-premium rounded-2xl p-2.5 sm:p-4 lg:p-6 relative overflow-hidden shadow-2xl h-32 lg:h-auto lg:min-h-[420px]">
        <div className="absolute inset-0 bg-grid-ambient opacity-15 pointer-events-none" />
        
        <div className="hidden lg:flex items-center justify-between z-10">
          <span className="text-[9px] font-mono text-text-secondary uppercase tracking-widest">
            Live print telemetry preview
          </span>
          <button
            onClick={() => setIsAutoSpin(!isAutoSpin)}
            className={`px-3 py-1 rounded-lg border text-[10px] font-mono transition cursor-pointer ${
              isAutoSpin ? 'bg-accent/20 border-accent text-accent' : 'border-border-premium text-text-secondary hover:text-text-primary hover:bg-bg-elevated/45'
            }`}
          >
            Auto-Spin: {isAutoSpin ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Interactive 3D Perspective viewport */}
        <div 
          className="flex-grow flex items-center justify-center py-2 lg:py-16 cursor-grab active:cursor-grabbing select-none"
          style={{ perspective: '800px' }}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          ref={previewContainerRef}
        >
          <div 
            className={`relative transition-transform duration-75 ${isAutoSpin ? 'animate-[spin3d_10s_linear_infinite]' : ''}`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isAutoSpin ? undefined : `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.35)`,
              width: `${shapeWidth}px`,
              height: '110px'
            }}
          >
            {/* Base Drop Shadow (Z: -20px) */}
            <div
              className="absolute inset-0 pointer-events-none select-none"
              style={{
                transform: 'translateZ(-20px)',
                filter: 'blur(8px) brightness(0) opacity(0.35)',
              }}
            >
              <svg width={shapeWidth} height="110" viewBox={`0 0 ${shapeWidth} 110`} fill="none">
                {renderThemeBackplate(strokeColor, true)}
              </svg>
            </div>

            {/* Stacked Backplate Side Walls (Z: 0px to 5px) - 12 layers */}
            {[...Array(12)].map((_, i) => {
              const zOffset = i * 0.45;
              // Smooth gradient darkening from 45% (bottom) to 5% (top)
              const darkenPercent = 0.45 - (i * 0.035);
              const layerColor = darkenColor(strokeColor, darkenPercent);
              return (
                <div
                  key={`bp-wall-${i}`}
                  className="absolute inset-0 pointer-events-none select-none"
                  style={{
                    transform: `translateZ(${zOffset}px)`,
                  }}
                >
                  <svg width={shapeWidth} height="110" viewBox={`0 0 ${shapeWidth} 110`} fill="none">
                    {renderThemeBackplate(layerColor, true)}
                  </svg>
                </div>
              );
            })}

            {/* Backplate Face (Z: 5.4px) with Specular highlight */}
            <div
              className="absolute inset-0 pointer-events-none select-none"
              style={{
                transform: 'translateZ(5.4px)',
              }}
            >
              <svg width={shapeWidth} height="110" viewBox={`0 0 ${shapeWidth} 110`} fill="none">
                <defs>
                  <linearGradient id="backplate-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#ffffff" stopOpacity="0.0" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                {renderThemeBackplate(strokeColor, false)}
                {/* Highlight overlay */}
                <g style={{ mixBlendMode: 'overlay' }}>
                  {renderThemeBackplate('url(#backplate-highlight)', true)}
                </g>
              </svg>
            </div>

            {/* Stacked Text Side Walls (Z: 6.0px to 9.0px) - 8 layers */}
            {[...Array(8)].map((_, i) => {
              const zOffset = 6.0 + i * 0.43;
              // Smooth gradient darkening from 40% (bottom) to 5% (top)
              const darkenPercent = 0.40 - (i * 0.05);
              const layerColor = darkenColor(textColor, darkenPercent);
              return (
                <div
                  key={`text-wall-${i}`}
                  className="absolute inset-0 pointer-events-none select-none"
                  style={{
                    transform: `translateZ(${zOffset}px)`,
                  }}
                >
                  <svg width={shapeWidth} height="110" viewBox={`0 0 ${shapeWidth} 110`} fill="none">
                    <text
                      x={getThemeTranslationX()}
                      y={getThemeTranslationY()}
                      fill={layerColor}
                      fontSize={renderFontSize}
                      fontFamily={selectedFont}
                      fontWeight="800"
                      textAnchor={theme === 'licenseplate' ? 'middle' : 'start'}
                    >
                      {name || 'NAME'}
                    </text>
                  </svg>
                </div>
              );
            })}

            {/* Text Face (Z: 9.5px) with highlight gradient */}
            <div
              className="absolute inset-0 pointer-events-none select-none"
              style={{
                transform: 'translateZ(9.5px)',
              }}
            >
              <svg width={shapeWidth} height="110" viewBox={`0 0 ${shapeWidth} 110`} fill="none">
                <defs>
                  <linearGradient id="text-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
                
                {/* Base text */}
                <text
                  x={getThemeTranslationX()}
                  y={getThemeTranslationY()}
                  fill={textColor}
                  fontSize={renderFontSize}
                  fontFamily={selectedFont}
                  fontWeight="800"
                  textAnchor={theme === 'licenseplate' ? 'middle' : 'start'}
                >
                  {name || 'NAME'}
                </text>

                {/* highlight overlay */}
                <text
                  x={getThemeTranslationX()}
                  y={getThemeTranslationY()}
                  fill="url(#text-highlight)"
                  fontSize={renderFontSize}
                  fontFamily={selectedFont}
                  fontWeight="800"
                  textAnchor={theme === 'licenseplate' ? 'middle' : 'start'}
                  style={{ mixBlendMode: 'overlay' }}
                >
                  {name || 'NAME'}
                </text>
              </svg>
            </div>

          </div>
        </div>

        {/* Sizing & Material Metrics bottom bar */}
        <div className="hidden lg:grid border-t border-border-premium pt-4 grid-cols-3 gap-3 font-mono text-center z-10">
          <div className="bg-bg-base border border-border-premium p-2.5 rounded-xl">
            <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Dimensions</span>
            <span className="text-[10px] font-bold text-text-primary">{specs.dimensions}</span>
          </div>
          <div className="bg-bg-base border border-border-premium p-2.5 rounded-xl">
            <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Est Weight</span>
            <span className="text-[10px] font-bold text-accent">{specs.weightGrams}g</span>
          </div>
          <div className="bg-bg-base border border-border-premium p-2.5 rounded-xl">
            <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Print Duration</span>
            <span className="text-[10px] font-bold text-text-primary">{specs.printTimeMinutes} min</span>
          </div>
        </div>

      </div>

      {/* Right Side: Configurator Controls Panel */}
      <div className="lg:col-span-6 bg-bg-surface border border-border-premium rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative">
        
        <div className="space-y-6">
          <h3 className="font-display font-extrabold text-lg text-text-primary">Configure Custom Name Keychain</h3>

          {/* Mobile-only Sizing & Material Metrics bar */}
          <div className="lg:hidden grid grid-cols-3 gap-2.5 font-mono text-center border border-border-premium p-3 rounded-xl bg-bg-base/40">
            <div>
              <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Dimensions</span>
              <span className="text-[10px] font-bold text-text-primary">{specs.dimensions}</span>
            </div>
            <div>
              <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Est Weight</span>
              <span className="text-[10px] font-bold text-accent">{specs.weightGrams}g</span>
            </div>
            <div>
              <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Print Duration</span>
              <span className="text-[10px] font-bold text-text-primary">{specs.printTimeMinutes} min</span>
            </div>
          </div>
          
          {/* Name input */}
          <div>
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
              Custom Text Name (Eng / বাংলা):
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.substring(0, 15))}
              placeholder="ENTER NAME"
              className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-sm font-semibold focus:border-accent"
            />
            <span className="block text-[9px] text-text-secondary mt-1 font-mono text-right">
              {name.length}/15 characters (Alphanumeric and spaces allowed)
            </span>
          </div>

          {/* Font selector */}
          <div>
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
              Typographic Font style:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFont(f.id)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition cursor-pointer ${
                    selectedFont === f.id
                      ? 'bg-accent/15 border-accent text-text-primary font-bold'
                      : 'bg-bg-base/40 border-border-premium text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
                  }`}
                >
                  <span style={{ fontFamily: f.id }}>{f.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Themes list */}
          <div>
            <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
              Themed Collection Shape:
            </label>
            <div className="space-y-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex justify-between items-center cursor-pointer ${
                    theme === t.id
                      ? 'bg-accent/15 border-accent text-text-primary font-bold'
                      : 'bg-bg-base/40 border-border-premium text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
                  }`}
                >
                  <div>
                    <span className="block font-bold">{t.name}</span>
                    <span className="block text-[10px] text-text-secondary font-normal">{t.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Region / City Input (Only for License Plate theme) */}
          {theme === 'licenseplate' && (
            <div>
              <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
                License Plate Region / City:
              </label>
              <input
                type="text"
                value={licensePlateRegion}
                onChange={(e) => setLicensePlateRegion(e.target.value.substring(0, 25))}
                placeholder="e.g. Dhaka Metro-Ga"
                className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-sm font-semibold focus:border-accent"
              />
              <span className="block text-[9px] text-text-secondary mt-1 font-mono text-right">
                {licensePlateRegion.length}/25 characters
              </span>
            </div>
          )}

          {/* Colors picker */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                Preset Dual Swatches:
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
            <div className="flex gap-2 mb-4.5">
              {PRESET_PALETTES.map((palette, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTextColor(palette.text);
                    setStrokeColor(palette.stroke);
                  }}
                  className="w-7 h-7 rounded-full border border-border-premium flex overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                  title={palette.name}
                >
                  <div className="w-1/2 h-full" style={{ backgroundColor: palette.text }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: palette.stroke }} />
                </button>
              ))}
            </div>

            {/* Filament Color Pickers */}
            <div className="space-y-4">
              {/* Letters Color picker row */}
              <div>
                <span className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">
                  Letters Color (FDM Material):
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((c) => {
                    const isActive = textColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={`text-col-${c.name}`}
                        disabled={isOutOfStock}
                        onClick={() => setTextColor(c.hex)}
                        className={`relative w-8 h-8 rounded-full border transition-all cursor-pointer ${
                          isActive ? 'border-accent scale-110 shadow-lg' : 'border-border-premium hover:scale-105'
                        } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                        style={getTextureStyle(c.name)}
                        title={c.name}
                      >
                        {isActive && (
                          <span className="absolute inset-0.5 rounded-full border border-white/50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Backplate Color picker row */}
              <div>
                <span className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">
                  Backplate Color (FDM Material):
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((c) => {
                    const isActive = strokeColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        type="button"
                        key={`stroke-col-${c.name}`}
                        disabled={isOutOfStock}
                        onClick={() => setStrokeColor(c.hex)}
                        className={`relative w-8 h-8 rounded-full border transition-all cursor-pointer ${
                          isActive ? 'border-accent scale-110 shadow-lg' : 'border-border-premium hover:scale-105'
                        } ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}`}
                        style={getTextureStyle(c.name)}
                        title={c.name}
                      >
                        {isActive && (
                          <span className="absolute inset-0.5 rounded-full border border-white/50" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sizes selector and material choice */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
                Keychain Size:
              </label>
              <div className="flex bg-bg-base border border-border-premium rounded-xl p-1 justify-between">
                {(['Small', 'Medium', 'Large'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 text-center cursor-pointer ${
                      size === s
                        ? 'bg-accent text-text-on-accent shadow'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
                Resin Material:
              </label>
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent"
              >
                <option value="PLA (Matte)">PLA (Matte)</option>
                <option value="PLA (Silk Pearl)">PLA (Silk Pearl)</option>
                <option value="PETG (Durable)">PETG (Durable)</option>
                <option value="TPU (Flexible)">TPU (Flexible)</option>
              </select>
            </div>
          </div>

              <div className="border-t border-border-premium pt-5 mt-6 space-y-4">
          {/* Validation guards rendering */}
          {!validation.isValid && (
            <div className="p-3 bg-red-955/20 border border-red-500/20 rounded-xl flex items-start space-x-2 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validation.error}</span>
            </div>
          )}

          {validation.isValid && validation.contrastWarning && (
            <div className="p-3 bg-yellow-955/20 border border-yellow-500/20 rounded-xl flex items-start space-x-2 text-yellow-650 dark:text-yellow-405 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Low contrast: Text may not be readable when printed. Consider selecting high-contrast colors.</span>
            </div>
          )}

          {/* Cost, Qty, Submit block */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-[8px] font-mono text-text-secondary uppercase tracking-widest">Total Price</span>
              <span className="text-2xl font-bold text-accent">{formatPrice(specs.price * quantity)}</span>
            </div>

            <div className="flex items-center space-x-3.5">
              {/* Quantity adjuster */}
              <div className="flex items-center bg-bg-base border border-border-premium rounded-xl p-1 justify-between max-w-[110px]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono text-text-primary text-xs font-bold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-6 h-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddClick}
                disabled={!validation.isValid || isOutOfStock}
                className="px-5 py-3 rounded-xl text-xs font-bold text-text-on-accent bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt shadow transition flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>{isOutOfStock ? 'OUT OF STOCK' : 'Queue print'}</span>
              </button>
            </div>
          </div>    </div>

        </div>

      </div>

    </div>
  );
}
