import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, FileCode, AlertCircle, Sparkles, HelpCircle, HardDrive, Send } from 'lucide-react';
import { CustomPrintRequest, BulkOrderRequest, CartItem } from '../types';
import { formatPrice } from '../utils/format';
import BulkOrders from './BulkOrders';
import NameKeychainBuilder from './NameKeychainBuilder';

interface CustomPrintStudioProps {
  onAddCustomQuote: (quote: CustomPrintRequest) => void;
  onAddBulkOrder: (order: BulkOrderRequest) => void;
  onAddToCart: (item: CartItem) => void;
  activeColors?: { name: string, hex: string }[];
}

export default function CustomPrintStudio({ onAddCustomQuote, onAddBulkOrder, onAddToCart, activeColors = [] }: CustomPrintStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'keychain' | 'bulk'>('individual');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [file, setFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseSteps, setParseSteps] = useState<string[]>([]);
  const [parsingProgress, setParsingProgress] = useState<number>(0);

  // Form selections and parameters
  const [material, setMaterial] = useState<string>('PLA (Matte)');
  const [color, setColor] = useState<string>('Matte Slate');
  const [infill, setInfill] = useState<string>('20% Gyroid');
  const [quantity, setQuantity] = useState<number>(1);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Set default color if not in stock
  useEffect(() => {
    const colors_list = activeColors.map(c => c.name);
    if (colors_list.length > 0 && !colors_list.includes(color)) {
      setColor(colors_list[0]);
    }
  }, [activeColors]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const colors_list = activeColors.map(c => c.name);
  const materials_list = ['PLA (Matte)', 'PLA (Silk Pearl)', 'PETG (Durable)', 'ABS (High-Impact)', 'TPU (Flexible)'];
  const infills_list = ['10% Lightning', '15% Gyroid', '20% Grid', '30% Grid', '40% Gyroid (High Strength)', '100% Solid'];

  // Simulated geometric measurements based on file size/name length
  const calculatedSpecs = React.useMemo(() => {
    if (!file) return null;
    const len = file.name.length;
    const sizeMultiplier = file.name.endsWith('.stl') ? 3.5 : 2.8;

    const estX = Math.round(50 + (len * 2));
    const estY = Math.round(45 + (len * 1.5));
    const estZ = Math.round(30 + (len * sizeMultiplier));
    const estVolume = Math.round((estX * estY * estZ) / 10000); // ml or cubic cm
    const estWeight = Math.round(estVolume * 1.15 * (parseFloat(infill) / 20)); // in grams

    // Calculate simulated price
    const baseSet = 650; // machine calibration fee
    const materialMultiplier = material.includes('TPU') ? 8 : material.includes('Carbon') ? 12 : 4;
    const layerVolumeFee = estWeight * materialMultiplier;
    const rawQuote = (baseSet + layerVolumeFee) * quantity;

    return {
      dimensions: `${estX} x ${estY} x ${estZ} mm`,
      triangles: (len * 45214).toLocaleString(),
      volume: `${estVolume} cc`,
      weight: `${estWeight} grams`,
      rawPrice: Math.max(850, Math.round(rawQuote))
    };
  }, [file, material, infill, quantity]);

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const fileTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  // Simulated Slicing engine steps 
  const processSelectedFile = (rawFile: File) => {
    const ext = rawFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'stl' && ext !== '3mf' && ext !== 'obj') {
      alert('Forbidden attachment format. Please upload STL, 3MF, or OBJ files for 3D Slicing compilation.');
      return;
    }

    setFile({
      name: rawFile.name,
      size: (rawFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: ext.toUpperCase()
    });

    setIsParsing(true);
    setParseSteps([]);
    setParsingProgress(10);

    const logs = [
      'Initializing Cura FDM Slicing Platform...',
      'Synthesizing vertices and normal coordinates...',
      'Computing polygonal mesh intersections...',
      'Repairing non-manifold boundaries...',
      'Analyzing overhang structures...',
      'Plotting support density arrays...',
      'Compiling final G-Code slicing paths...'
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setParseSteps((prev) => [...prev, `[INFO] ${log}`]);
        setParsingProgress((prev) => Math.min(100, prev + 15));
        if (index === logs.length - 1) {
          setTimeout(() => {
            setIsParsing(false);
          }, 400);
        }
      }, (index + 1) * 350);
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !calculatedSpecs) return;

    if (!userName.trim() || !userEmail.trim()) {
      alert('Please compile contact credentials before dispatching quote files.');
      return;
    }

    const trackingId = 'BLV-QUOT-' + Math.floor(100000 + Math.random() * 900000);
    const newRequest: CustomPrintRequest = {
      id: trackingId,
      fileName: file.name,
      fileSize: file.size,
      material,
      color,
      infill,
      quantity,
      status: 'Quoted',
      priceEstimate: calculatedSpecs.rawPrice,
      userName,
      userEmail,
      details: details || 'Printed directly via on-demand slicing calculator.',
      createdAt: new Date().toLocaleDateString()
    };

    onAddCustomQuote(newRequest);
    setSubmitSuccess(trackingId);

    // Reset fields
    setUserName('');
    setUserEmail('');
    setDetails('');
  };

  const resetForm = () => {
    setFile(null);
    setSubmitSuccess(null);
    setParseSteps([]);
  };

  return (
    <section id="custom-printing-studio" className="py-20 bg-bg-base relative">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-mono font-black text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
            Additive Printing Services
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-4">
            {activeSubTab === 'individual' ? 'Upload & Slice Custom STL Files' : 'Enterprise & Corporate Bulk Fabrication'}
          </h2>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            {activeSubTab === 'individual'
              ? 'Upload your custom design files. Our simulated cloud compiler compiles polygon facets, overlay limits, filament densities, and computes instant manufacturing price estimations.'
              : 'Scale your production with massive structural volume discounts. Ideal for bulk promotional items, custom gears, unique retail merchandise, and corporate gifts with premium tolerances.'}
          </p>
        </div>

        {/* Sub-tab selection row */}
        <div className="flex justify-center mb-12 animate-fade-in">
          <div className="inline-flex p-1 bg-bg-elevated border border-border-premium rounded-2xl shadow-lg">
            <button
              onClick={() => {
                setActiveSubTab('individual');
                resetForm();
              }}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-display text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeSubTab === 'individual'
                  ? 'bg-accent text-white shadow-md shadow-accent/15'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>STL Print Studio</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('keychain');
                resetForm();
              }}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-display text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeSubTab === 'keychain'
                  ? 'bg-accent text-white shadow-md shadow-accent/15'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Name Keychain Builder</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('bulk');
                resetForm();
              }}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-display text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeSubTab === 'bulk'
                  ? 'bg-accent text-white shadow-md shadow-accent/15'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface/40'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Corporate Bulk Orders</span>
            </button>
          </div>
        </div>

        {activeSubTab === 'bulk' ? (
          <div className="max-w-4xl mx-auto bg-bg-surface/20 border border-border-premium rounded-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <BulkOrders onAddBulkOrder={onAddBulkOrder} />
          </div>
        ) : activeSubTab === 'keychain' ? (
          <div className="max-w-5xl mx-auto bg-bg-surface/20 border border-border-premium rounded-2xl p-2.5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-300">
            <NameKeychainBuilder onAddToCart={onAddToCart} activeColors={activeColors} />
          </div>
        ) : submitSuccess ? (
          /* Confirmation tracking visual card */
          <div className="max-w-2xl mx-auto bg-bg-surface border border-border-premium p-8 rounded-2xl shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-green-400" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-text-primary">Quotation Registration Successful</h3>
              <p className="text-text-secondary text-xs">Your additive manufacturing job is registered under tracking reference:</p>
              <div className="inline-block px-4 py-1.5 rounded bg-bg-elevated border border-border-premium text-sm font-mono font-bold text-accent mt-2">
                {submitSuccess}
              </div>
            </div>

            <p className="text-text-secondary text-xs leading-relaxed max-w-md mx-auto">
              Our print farm coordinators have reserved machine capacity. A final verified slicing G-code confirmation sheet was sent to your email. We will reach out within 2 hours.
            </p>

            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white font-semibold text-xs cursor-pointer transition shadow"
            >
              Upload Another Mesh File
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Box: Slicing / Drag Target Upload Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div
                id="file-dropzone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl bg-bg-surface/50 flex flex-col items-center justify-center py-14 px-8 text-center transition-all duration-300 relative overflow-hidden group ${
                  dragActive ? 'border-accent bg-accent/5' : 'border-border-premium hover:border-accent/40'
                }`}
              >
                {/* Background grid */}
                <div className="absolute inset-0 bg-grid-ambient opacity-20" />

                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  accept=".stl,.3mf,.obj"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file && !isParsing ? (
                  /* Standard Empty Upload Box */
                  <div className="space-y-4 relative z-10 cursor-pointer" onClick={fileTrigger}>
                    <div className="w-16 h-16 rounded-xl bg-bg-surface border border-accent/25 flex items-center justify-center mx-auto group-hover:scale-105 group-hover:border-accent/50 transition">
                      <UploadCloud className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                      <p className="text-text-primary font-medium text-sm">Drag and drop model file here, or <span className="text-accent font-semibold underline">browse directories</span></p>
                      <p className="text-text-secondary text-xs mt-1.5 font-mono">SUPPORTS: .STL, .3MF, .OBJ (MAX 50MB)</p>
                    </div>
                  </div>
                ) : isParsing ? (
                  /* Live Slicing compilation process overlay */
                  <div className="w-full space-y-6 relative z-10 p-4">
                    <div className="flex items-center space-x-3.5 max-w-sm mx-auto justify-center">
                      <FileCode className="w-8 h-8 text-accent animate-pulse" />
                      <div className="text-left">
                        <p className="text-text-primary font-bold text-sm">Cura Engine Working...</p>
                        <p className="text-text-secondary text-xs font-mono">Compiling Mesh Coordinates</p>
                      </div>
                    </div>
                    {/* Progress slider bar */}
                    <div className="w-full max-w-md mx-auto bg-bg-base h-1.5 rounded-full overflow-hidden border border-border-premium">
                      <div 
                        className="bg-gradient-to-r from-accent to-accent-secondary h-full rounded-full transition-all duration-300"
                        style={{ width: `${parsingProgress}%` }}
                      />
                    </div>
                    {/* Output log entries */}
                    <div className="bg-bg-elevated rounded-xl p-4.5 border border-border-premium font-mono text-[10px] text-left text-text-secondary h-40 overflow-y-auto max-w-md mx-auto space-y-1 select-none">
                      {parseSteps.map((log, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="text-accent">{log}</span>
                          <span className="text-text-secondary/60">SUCCESS</span>
                        </div>
                      ))}
                      <div className="animate-pulse text-text-secondary">_ compiling code commands...</div>
                    </div>
                  </div>
                ) : (
                  /* File Upload Completed Display Specs */
                  <div className="w-full p-4 space-y-6 relative z-10">
                    <div className="flex items-center justify-between border-b border-border-premium pb-4">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                          <HardDrive className="w-6 h-6 animate-pulse" />
                        </div>
                        <div>
                          <p className="text-text-primary text-sm font-bold line-clamp-1">{file.name}</p>
                          <p className="text-text-secondary text-xs font-mono">{file.size} • {file.type}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition cursor-pointer px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/20"
                      >
                        Remove file
                      </button>
                    </div>

                    {/* Extracted 3D geometric specs */}
                    {calculatedSpecs && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left font-mono">
                        <div className="bg-bg-elevated border border-border-premium p-4 rounded-xl">
                          <span className="block text-[8px] text-text-secondary uppercase tracking-widest">triangles</span>
                          <span className="text-sm font-bold text-text-primary">{calculatedSpecs.triangles}</span>
                        </div>
                        <div className="bg-bg-elevated border border-border-premium p-4 rounded-xl">
                          <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Bounding Box</span>
                          <span className="text-sm font-bold text-text-primary line-clamp-1" title={calculatedSpecs.dimensions}>{calculatedSpecs.dimensions}</span>
                        </div>
                        <div className="bg-bg-elevated border border-border-premium p-4 rounded-xl">
                          <span className="block text-[8px] text-text-secondary uppercase tracking-widest">RESIN Volume</span>
                          <span className="text-sm font-bold text-text-primary">{calculatedSpecs.volume}</span>
                        </div>
                        <div className="bg-bg-elevated border border-border-premium p-4 rounded-xl">
                          <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Net Fil. weight</span>
                          <span className="text-sm font-bold text-accent">{calculatedSpecs.weight}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Requirements card */}
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 text-left">
                <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm mb-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>3D Design Requirements & Alignment</span>
                </div>
                <ul className="text-xs text-text-secondary space-y-2 leading-relaxed">
                  <li className="flex items-start space-x-2">
                    <span className="text-accent shrink-0 select-none">•</span>
                    <span>Verify that your model contains closed manifolds and no stray intersecting face groups.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-accent shrink-0 select-none">•</span>
                    <span>Wall thicknesses should match at least 0.8mm for PLA models or 1.2mm for flexible TPU gaskets.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-accent shrink-0 select-none">•</span>
                    <span>Include alignment lugs for multi-part models. STL units are treated as millimeters by default.</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Right Box: Quote Customizer and Form Contact capture column */}
            <div className="lg:col-span-5">
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 text-left shadow-2xl relative">
                
                {/* Visual Glow Indicator */}
                {file && <div className="absolute top-0 right-10 w-24 h-px bg-accent/30 blur-sm animate-pulse" />}

                <h3 className="font-display font-extrabold text-lg text-text-primary mb-6">Quote Selector & contact details</h3>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  
                  {/* Select Material */}
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Additive Resin Material:
                    </label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      disabled={!file}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent disabled:opacity-40"
                    >
                      {materials_list.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Color */}
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Filament Core Color:
                    </label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={!file}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent disabled:opacity-40"
                    >
                      {colors_list.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Infill Layout */}
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Infill Pattern &amp; Density:
                    </label>
                    <select
                      value={infill}
                      onChange={(e) => setInfill(e.target.value)}
                      disabled={!file}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent disabled:opacity-40"
                    >
                      {infills_list.map((inf) => (
                        <option key={inf} value={inf}>{inf}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity and Sizer */}
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1.5">
                      Batch Quantity (QTY):
                    </label>
                    <div className="flex items-center bg-bg-base border border-border-premium rounded-xl p-1 justify-between max-w-[140px]">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={!file}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded text-sm disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="font-mono text-text-primary text-xs font-bold">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={!file}
                        className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded text-sm disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Contact Block */}
                  <div className="border-t border-border-premium pt-4 space-y-3.5">
                    
                    <div>
                      <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                        Full Name:
                      </label>
                      <input
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                        Corporate / Personal Email:
                      </label>
                      <input
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="johndoe@belvia.com"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                        Printing notes (Layer height or uses):
                      </label>
                      <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows={2}
                        placeholder="Please use structural organic supports..."
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent resize-none"
                      />
                    </div>

                  </div>

                  {/* Live Quote Output Card */}
                  {file && calculatedSpecs && (
                    <div className="bg-bg-elevated border border-accent/30 p-4 rounded-xl flex items-center justify-between font-mono mt-4">
                      <div className="text-left">
                        <span className="block text-[8px] text-text-secondary uppercase tracking-widest">Instant quote estimate</span>
                        <span className="text-xl font-bold text-accent">{formatPrice(calculatedSpecs.rawPrice)}</span>
                      </div>
                      <span className="text-[10px] text-accent font-bold bg-accent/10 px-2 py-1 rounded">G-CODE READY</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    id="submit-stl-btn"
                    type="submit"
                    disabled={!file}
                    className="w-full py-3 px-5 rounded-xl text-xs font-semibold cursor-pointer text-white bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt transition-all shadow disabled:opacity-40"
                  >
                    {!file ? 'Please Upload STL File First' : 'Request Slicing Production Quote'}
                  </button>

                </form>

              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
