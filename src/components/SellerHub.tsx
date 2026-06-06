import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle, 
  PlusCircle, 
  Grid, 
  Download, 
  Scale, 
  BrainCircuit, 
  Info,
  Layers,
  Check
} from 'lucide-react';
import { Product } from '../types';

interface SellerHubProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportBulkProducts: (newProducts: Product[]) => void;
  onResetCatalog: () => void;
}

export default function SellerHub({ 
  products, 
  onAddProduct, 
  onDeleteProduct, 
  onImportBulkProducts, 
  onResetCatalog 
}: SellerHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'excel' | 'manual' | 'inventory'>('ai');

  // --- MANUAL FORM VARIABLES ---
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Desk Accessories');
  const [newPrice, setNewPrice] = useState<string>('19.99');
  const [newColors, setNewColors] = useState<string>('Matte Slate, Chalk White, Burnt Orange');
  const [newMaterials, setNewMaterials] = useState<string>('PLA (Matte), PETG (Durable)');
  const [newPrintTime, setNewPrintTime] = useState<string>('3h 30m');
  const [newWeight, setNewWeight] = useState<string>('85');
  const [newInfill, setNewInfill] = useState<string>('15% Gyroid');
  const [newDimensions, setNewDimensions] = useState<string>('120 x 120 x 140 mm');
  const [manualImage, setManualImage] = useState<string>('https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800');
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<boolean>(false);

  // --- AI IMPORT INSPIRATION PASTE VARIABLES ---
  const [makerworldPaste, setMakerworldPaste] = useState<string>(`Sample MakerWorld Model Page Details:
Model Name: Cute Articulated Flexi-Cat Fidget Desk Companion
Designer comments: Hi guys! This is a single-print jointed kitten. Prints in place, NO supports needed whatsoever. 
Recommended infill is 15% Honeycomb or Gyroid. Uses about 45g of filament and prints in roughly 1 hour and 40 minutes on standard bambu printer configurations.
Dimensions of the model are 80mm long, 45mm wide, and about 60mm tall. 
Colors suited: Burnt Orange with Matte Slate eyes or Chalk White body.`);
  
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedAiProduct, setParsedAiProduct] = useState<Partial<Product> | null>(null);
  const [aiImportSuccess, setAiImportSuccess] = useState<boolean>(false);

  // --- CSV SPREADSHEEET MOCK SAMPLES ---
  const [spreadsheetText, setSpreadsheetText] = useState<string>(`id,title,category,price,weightGrams,printTime,colors,materials,description
"bk-101","Precision Low-poly Skull Dice Tower","Desk Accessories",28.99,180,"5h 20m","Bone White, Slate Black","PLA (Matte)","A stunning dice tower modeled on low-poly geometric skulls. Includes tray."
"bk-102","Self-Watering Modular Planter Tray","Home Decor",22.50,110,"3h 15m","Terracotta, Pastel Mint","PETG (Waterproof)","Compact modern self-watering tray perfect for window herbs."`);
  const [spreadsheetDragActive, setSpreadsheetDragActive] = useState<boolean>(false);
  const [isSpreadsheetParsed, setIsSpreadsheetParsed] = useState<boolean>(false);
  const [parsedSpreadsheetProducts, setParsedSpreadsheetProducts] = useState<Product[]>([]);
  const [spreadsheetSuccessMsg, setSpreadsheetSuccessMsg] = useState<boolean>(false);

  // --- MANUAL DRAG FILE REFERENCE ---
  const manualFileRef = useRef<HTMLInputElement>(null);

  // --- DYNAMIC AI SCRAPE AGENT HANDLER ---
  const handleAIExtract = async () => {
    if (!makerworldPaste.trim()) {
      alert("Please paste text from MakerWorld first.");
      return;
    }
    setAiError(null);
    setIsAiLoading(true);
    setParsedAiProduct(null);
    setAiImportSuccess(false);

    try {
      const response = await fetch('/api/import-makerworld', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: makerworldPaste })
      });
      const data = await response.json();
      
      if (data.success && data.product) {
        setParsedAiProduct(data.product);
      } else {
        setAiError(data.error || "Failed to parse the catalog details via AI. Ensure API secrets are configured correctly.");
      }
    } catch (e: any) {
      setAiError("Failed to communicate with Express server: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApproveAndAddAIProduct = () => {
    if (!parsedAiProduct) return;
    
    const finalProduct: Product = {
      id: 'bv-ai-' + Math.floor(1000 + Math.random() * 9000),
      title: parsedAiProduct.title || 'Parsed AI Product',
      description: parsedAiProduct.description || 'Processed via MakerWorld AI.',
      category: (parsedAiProduct.category as any) || 'Custom Orders',
      price: parsedAiProduct.price || 19.99,
      colors: parsedAiProduct.colors || ['Chalk White'],
      materials: parsedAiProduct.materials || ['PLA (Matte)'],
      rating: 5.0,
      reviewsCount: 1,
      printTime: parsedAiProduct.printTime || '2h 15m',
      weightGrams: parsedAiProduct.weightGrams || 50,
      images: ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800'],
      infill: parsedAiProduct.infill || '15% Gyroid',
      dimensions: parsedAiProduct.dimensions || '100x100x100 mm',
      isCustomizable: parsedAiProduct.isCustomizable ?? true
    };

    onAddProduct(finalProduct);
    setAiImportSuccess(true);
    setTimeout(() => {
      setParsedAiProduct(null);
      setAiImportSuccess(false);
    }, 2500);
  };

  // --- DRAG IMAGE SIMULATION FOR MANUAL CREATOR ---
  const handleManualDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadProgress(true);
    // Simulate uploading a photo
    setTimeout(() => {
      const imagesList = [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800'
      ];
      const randomImg = imagesList[Math.floor(Math.random() * imagesList.length)];
      setManualImage(randomImg);
      setUploadProgress(false);
    }, 1000);
  };

  // --- MANUAL SAVER HANDLER ---
  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const parseColors = newColors.split(',').map(s => s.trim()).filter(Boolean);
    const parseMaterials = newMaterials.split(',').map(s => s.trim()).filter(Boolean);

    const readyProduct: Product = {
      id: 'bv-mnf-' + Math.floor(1000 + Math.random() * 9000),
      title: newTitle,
      description: newDesc || 'Handcrafted precision filament print optimized by Belvia team.',
      category: newCategory as any,
      price: parseFloat(newPrice) || 19.99,
      colors: parseColors.length ? parseColors : ['Chalk White'],
      materials: parseMaterials.length ? parseMaterials : ['PLA (Matte)'],
      rating: 4.8,
      reviewsCount: 1,
      printTime: newPrintTime || '3h 15m',
      weightGrams: parseInt(newWeight) || 90,
      images: [manualImage],
      infill: newInfill,
      dimensions: newDimensions,
      isCustomizable: true
    };

    onAddProduct(readyProduct);
    setManualSuccessMsg(true);

    // Reset Title
    setNewTitle('');
    setNewDesc('');
    setTimeout(() => setManualSuccessMsg(false), 2000);
  };

  // --- CSV PARSING ENGINE SIMULATOR ---
  const parseSpreadsheetTextFunc = () => {
    if (!spreadsheetText.trim()) return;
    try {
      const rows = spreadsheetText.split('\n');
      console.log("Parsing row lengths:", rows.length);
      const parsedItems: Product[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;
        
        // Dynamic splitted parsing regex to split elements handles commas inside quotes nicely
        const cleanMatches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
        if (cleanMatches.length < 5) continue;

        const idClean = cleanMatches[0]?.replace(/"/g, '') || `bv-xls-${i}`;
        const titleClean = cleanMatches[1]?.replace(/"/g, '') || 'Spreadsheet Model';
        const categoryClean = cleanMatches[2]?.replace(/"/g, '') || 'Desk Accessories';
        const priceClean = parseFloat(cleanMatches[3]?.replace(/"/g, '')) || 24.99;
        const weightClean = parseInt(cleanMatches[4]?.replace(/"/g, '')) || 100;
        const printClean = cleanMatches[5]?.replace(/"/g, '') || '4h';
        const colorsArr = cleanMatches[6]?.replace(/"/g, '').split(';').map(c => c.trim()) || ['Classic PLA'];
        const matsArr = cleanMatches[7]?.replace(/"/g, '').split(';').map(c => c.trim()) || ['PLA (Matte)'];
        const descClean = cleanMatches[8]?.replace(/"/g, '') || 'Imported via Excel catalog batch.';

        parsedItems.push({
          id: idClean,
          title: titleClean,
          description: descClean,
          category: categoryClean as any,
          price: priceClean,
          colors: colorsArr,
          materials: matsArr,
          rating: 4.8,
          reviewsCount: 12,
          printTime: printClean,
          weightGrams: weightClean,
          images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800'],
          infill: '15% Gyroid',
          dimensions: '140 x 140 x 140 mm',
          isCustomizable: true
        });
      }

      setParsedSpreadsheetProducts(parsedItems);
      setIsSpreadsheetParsed(true);
    } catch (err) {
      alert("Formatting anomaly detected inside paste pad. Check layout headers.");
    }
  };

  const handleCompleteSpreadsheetImport = () => {
    if (!parsedSpreadsheetProducts.length) return;
    onImportBulkProducts(parsedSpreadsheetProducts);
    setSpreadsheetSuccessMsg(true);
    setIsSpreadsheetParsed(false);
    setParsedSpreadsheetProducts([]);
    setTimeout(() => setSpreadsheetSuccessMsg(false), 2500);
  };

  // --- BATCH EXPORT FUNCTION (CREATES JSON FILE TO DOWNLOAD) ---
  const handleExportStockTable = () => {
    const rawData = JSON.stringify(products, null, 2);
    const blob = new Blob([rawData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `belvia_3d_products_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section id="seller-dashboard-workstation" className="py-16 bg-bg-base relative text-left">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Module title header */}
        <div className="border-b border-border-premium pb-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest block mb-1">
              Seller Workstation Hub
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold text-text-primary">
              Belvia Inventory Manager
            </h1>
            <p className="text-text-secondary text-sm mt-1.5 max-w-xl">
              Fulfill your scale demands. Manage ready-made products, paste raw web descriptions to parse via our serverless Gemini AI Extraction Agent, or load massive spreadsheets instantly.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              id="export-stock-btn"
              onClick={handleExportStockTable}
              className="px-4.5 py-3 rounded-xl bg-bg-surface border border-border-premium hover:border-gray-500 text-text-primary hover:bg-bg-elevated transition flex items-center space-x-2 text-xs font-semibold cursor-pointer shadow-sm"
              title="Download full catalog as JSON"
            >
              <Download className="w-4 h-4 text-accent" />
              <span>Export Catalog JSON</span>
            </button>
          </div>
        </div>

        {/* Workspace Subtabs */}
        <div className="flex bg-bg-surface border border-border-premium rounded-xl p-1 mb-8 max-w-3xl">
          {[
            { id: 'ai', name: 'MakerWorld AI Agent', icon: Sparkles },
            { id: 'excel', name: 'CSV Spreadsheets', icon: FileSpreadsheet },
            { id: 'manual', name: 'Drag & Drop Manual', icon: PlusCircle },
            { id: 'inventory', name: 'Active Inventory Catalog', icon: Grid }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                id={`subtab-${tab.id}`}
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  activeSubTab === tab.id
                    ? 'bg-accent-secondary text-white font-bold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/45'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* --- AI AGENT PASTING SECTION --- */}
        {activeSubTab === 'ai' && (
          <div id="ai-importer-submodule" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Paste */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 text-accent font-bold text-sm">
                  <BrainCircuit className="w-5 h-5 animate-pulse text-accent" />
                  <span>Gemini MakerWorld AI Catalog Agent</span>
                </div>
                
                <p className="text-text-secondary text-xs leading-relaxed">
                  Avoid typing out details! Simply go to any page on MakerWorld.com, highlight and copy the model details (including printing specs, instructions, dimensions or infill lists), and paste it directly below. Our AI model will extract clean structured properties.
                </p>

                <textarea
                  id="paste-makerworld-text"
                  value={makerworldPaste}
                  onChange={(e) => setMakerworldPaste(e.target.value)}
                  rows={8}
                  placeholder="Paste MakerWorld page summary specs or text notes here..."
                  className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-3 px-3.5 text-xs focus:border-accent font-mono resize-none leading-relaxed"
                />

                <div className="flex justify-between items-center pt-2.5">
                  <span className="text-[10px] text-text-secondary font-mono">MODEL AGENT: gemini-3.5-flash</span>
                  
                  <button
                    id="btn-ai-extract"
                    onClick={handleAIExtract}
                    disabled={isAiLoading}
                    className="px-5 py-3 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white font-bold text-xs cursor-pointer flex items-center space-x-2.5 transition active:scale-95 disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAiLoading ? 'Analyzing & Slicing...' : 'Parse & Extract with AI Agent'}</span>
                  </button>
                </div>

                {aiError && (
                  <div className="text-xs text-red-400 bg-red-650/10 border border-red-500/20 p-3 rounded-lg flex items-center space-x-2">
                    <Info className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="line-clamp-2">{aiError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis Output Result and Review Panel */}
            <div className="lg:col-span-6">
              {parsedAiProduct ? (
                <div className="bg-bg-surface border border-border-premium p-6 rounded-2xl space-y-5 shadow-2xl relative">
                  
                  {/* Neon tag */}
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-accent font-bold bg-accent/10 border border-accent/20 px-2 py-0.5 rounded animate-pulse">
                    PARSING SUCCESS
                  </div>

                  <h3 className="font-display font-extrabold text-base text-text-primary">Review AI Extracted Catalog Product</h3>
                  
                  <div className="bg-bg-base rounded-xl border border-border-premium p-4.5 space-y-3.5 font-mono text-xs">
                    
                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">ID:</span>
                      <span className="text-text-secondary text-right font-bold">[Auto Assign Code]</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between text-left items-start">
                      <span className="text-text-secondary shrink-0 w-20">TITLE:</span>
                      <span className="text-text-primary text-right font-sans font-bold">{parsedAiProduct.title}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between items-start">
                      <span className="text-text-secondary shrink-0 w-20">DESCRIPTION:</span>
                      <span className="text-text-secondary text-right font-sans text-[11px] leading-normal">{parsedAiProduct.description}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">SUGGESTED CAT:</span>
                      <span className="text-accent font-bold">{parsedAiProduct.category}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">SUGGESTED MSRP:</span>
                      <span className="text-accent font-bold">${parsedAiProduct.price?.toFixed(2)}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between items-start">
                      <span className="text-text-secondary shrink-0">COLORS MATCH:</span>
                      <span className="text-text-secondary text-right text-[11px]">{parsedAiProduct.colors?.join(', ')}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">PRINT WEIGHT:</span>
                      <span className="text-text-primary font-bold">{parsedAiProduct.weightGrams}g</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">INFILL STYLE:</span>
                      <span className="text-text-primary font-bold">{parsedAiProduct.infill}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-secondary">DIMENSIONAL METRIC:</span>
                      <span className="text-text-primary font-bold">{parsedAiProduct.dimensions}</span>
                    </div>

                  </div>

                  {aiImportSuccess ? (
                    <div className="p-3 bg-accent-secondary/10 border border-accent/20 text-accent rounded-xl text-center text-xs font-mono font-bold flex items-center justify-center space-x-2 animate-bounce">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>Appended to Belvia Store Catalog successfully!</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        id="btn-ai-cancel"
                        onClick={() => setParsedAiProduct(null)}
                        className="py-3 px-4 rounded-xl border border-border-premium text-text-secondary text-xs font-semibold hover:bg-bg-elevated cursor-pointer text-center"
                      >
                        Decline Slices
                      </button>
                      <button
                        id="btn-ai-approve"
                        onClick={handleApproveAndAddAIProduct}
                        className="py-3 px-4 rounded-xl bg-accent-secondary hover:bg-accent text-white font-bold text-xs cursor-pointer text-center shadow"
                      >
                        Approve &amp; Add to Catalog
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="border-2 border-dashed border-border-premium bg-bg-surface/30 rounded-2xl py-16 px-6 text-center text-text-secondary font-mono uppercase text-xs">
                  <Layers className="w-10 h-10 text-text-secondary/40 mx-auto mb-4 animate-pulse" />
                  <span>AI SPEC EXTRACTIONS SHEET DUMP WINDOW</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- EXCEL CSV SPREADSHEET IMPORTER SECTION --- */}
        {activeSubTab === 'excel' && (
          <div id="csv-importer-submodule" className="space-y-6">
            <div className="bg-bg-surface border border-border-premium rounded-2xl p-6">
              
              <div className="flex items-center space-x-2 text-accent font-bold text-sm mb-4">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                <span>Spreadsheet / Batch Catalog CSV Parser</span>
              </div>

              <p className="text-text-secondary text-xs leading-relaxed mb-6">
                Belvia supports high-speed csv or json batch uploads. You can paste spreadsheet csv data in compliance with the following headers directly in the box below to parse and insert hundreds of catalog products instantly:
                <span className="block font-mono bg-bg-base p-2 border border-border-premium rounded mt-2 text-accent overflow-x-auto text-[10px]">
                  id,title,category,price,weightGrams,printTime,colors,materials,description
                </span>
              </p>

              <textarea
                id="paste-csv-text"
                value={spreadsheetText}
                onChange={(e) => setSpreadsheetText(e.target.value)}
                rows={10}
                placeholder="CSV raw comma separated rows..."
                className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-3 px-3.5 text-xs focus:border-accent font-mono resize-none leading-relaxed"
              />

              <div className="flex justify-between items-center pt-4">
                <span className="text-[10px] text-text-secondary font-mono">PARSING MODEL: RFC 4180 Standard Comma Spec</span>
                
                <button
                  id="btn-csv-parse"
                  onClick={parseSpreadsheetTextFunc}
                  className="px-5 py-3 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white font-bold text-xs cursor-pointer flex items-center space-x-2.5 transition active:scale-95"
                >
                  <Scale className="w-4 h-4" />
                  <span>Parse Spreadsheet Text</span>
                </button>
              </div>

              {spreadsheetSuccessMsg && (
                <div className="p-3 mt-4 bg-accent-secondary/10 border border-accent/20 text-accent rounded-xl text-center text-xs font-mono font-bold animate-pulse">
                  Batch Import Complete! Spreadsheet stock merged successfully.
                </div>
              )}
            </div>

            {/* If Spreadsheet contains parsed rows, display them for validation */}
            {isSpreadsheetParsed && parsedSpreadsheetProducts.length > 0 && (
              <div className="bg-bg-surface border border-border-premium p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-sm text-text-primary uppercase tracking-widest font-mono">
                    VALIDATING {parsedSpreadsheetProducts.length} IMPORTED SPREADSHEEET ROWS:
                  </h3>
                  <button
                    id="btn-complete-csv-import"
                    onClick={handleCompleteSpreadsheetImport}
                    className="px-4.5 py-2 rounded-xl bg-accent-secondary hover:bg-accent text-white font-bold text-xs cursor-pointer transition shadow"
                  >
                    Merge Rows &amp; MERGER STOCK CATALOG
                  </button>
                </div>

                <div className="overflow-x-auto max-h-60 border border-border-premium rounded-xl bg-bg-base scrollbar-thin">
                  <table className="w-full text-left border-collapse font-mono text-[10.5px]">
                    <thead>
                      <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider">
                        <th className="p-3">ID</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Suggested Price</th>
                        <th className="p-3">weight (g)</th>
                        <th className="p-3">Print hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-premium text-text-secondary">
                      {parsedSpreadsheetProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-bg-elevated/40">
                          <td className="p-3 text-accent font-bold">{p.id}</td>
                          <td className="p-3 text-text-primary font-sans">{p.title}</td>
                          <td className="p-3">{p.category}</td>
                          <td className="p-3 text-accent">${p.price.toFixed(2)}</td>
                          <td className="p-3">{p.weightGrams}g</td>
                          <td className="p-3">{p.printTime}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- MANUAL UPLOAD CREATION FORM SECTION --- */}
        {activeSubTab === 'manual' && (
          <div id="manual-creator-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="font-display font-extrabold text-base text-text-primary mb-6">Create Custom ready-made Catalog item</h3>
            
            <form onSubmit={handleManualSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Form controls */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Product Name / Title:
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Geometric Pen Stand"
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      MSRP Selling Price ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Manufacturing Category:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent cursor-pointer"
                    >
                      <option value="Keychains">Keychains</option>
                      <option value="Home Decor">Home Decor</option>
                      <option value="Desk Accessories">Desk Accessories</option>
                      <option value="Gaming Accessories">Gaming Accessories</option>
                      <option value="Figures & Collectibles">Figures &amp; Collectibles</option>
                      <option value="Business Merchandise">Business Merchandise</option>
                      <option value="Custom Orders">Custom Orders</option>
                      <option value="Functional Prints">Functional Prints</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Infill Pattern Grid:
                    </label>
                    <input
                      type="text"
                      value={newInfill}
                      onChange={(e) => setNewInfill(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Printing Hours:
                    </label>
                    <input
                      type="text"
                      value={newPrintTime}
                      onChange={(e) => setNewPrintTime(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Item Weight (Grams):
                    </label>
                    <input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Dimensions:
                    </label>
                    <input
                      type="text"
                      value={newDimensions}
                      onChange={(e) => setNewDimensions(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Available Color Swatches (Split with comma):
                    </label>
                    <input
                      type="text"
                      value={newColors}
                      onChange={(e) => setNewColors(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Recommended Materials (Comma separated):
                    </label>
                    <input
                      type="text"
                      value={newMaterials}
                      onChange={(e) => setNewMaterials(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                    Persuasive Model Description:
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={3}
                    placeholder="Sourced directly from certified STL file parameters. Fully waterproof and solid design..."
                    className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent resize-none font-sans"
                  />
                </div>

              </div>

              {/* Right Drag Drop Image Section */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">
                    Product Image Showcase Target Area:
                  </label>
                  
                  <div
                    onDragEnter={handleManualDrag}
                    onDragOver={handleManualDrag}
                    onDrop={handleImageDrop}
                    onClick={() => {}}
                    className="border-2 border-dashed border-border-premium bg-bg-surface/30 rounded-2xl py-12 px-6 text-center select-none cursor-pointer relative overflow-hidden group hover:border-gray-700 transition"
                  >
                    {uploadProgress ? (
                      <div className="space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
                        <p className="text-xs text-text-secondary font-mono">Parsing File Texture Layers...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 relative z-10">
                        <Upload className="w-8 h-8 text-accent mx-auto group-hover:scale-105 transition" />
                        <p className="text-text-primary text-xs font-semibold">Drag &amp; Drop display image or photo here</p>
                        <p className="text-[10px] text-text-secondary font-mono">PNG, JPG, SVG EXTREMELY HIGH INTENSITY</p>
                      </div>
                    )}

                    <img 
                      referrerPolicy="no-referrer"
                      src={manualImage} 
                      alt="Product preview" 
                      className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none group-hover:scale-105 transition duration-500" 
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Direct Photo Image Link URL (Fallback):
                    </label>
                    <input
                      type="text"
                      value={manualImage}
                      onChange={(e) => setManualImage(e.target.value)}
                      className="w-full bg-bg-base text-text-secondary border border-border-premium rounded-xl py-2 px-3 text-xs font-mono"
                    />
                  </div>
                </div>

                {manualSuccessMsg ? (
                  <div className="p-3.5 bg-accent-secondary/10 border border-accent/20 text-accent rounded-xl text-center text-xs font-mono font-bold animate-pulse mt-5">
                    Merged manual custom product to active stock table.
                  </div>
                ) : (
                  <button
                    id="submit-manual-btn"
                    type="submit"
                    className="w-full mt-5 py-3.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white font-bold text-xs cursor-pointer shadow transition"
                  >
                    Commit &amp; Write Product Stock
                  </button>
                )}

              </div>

            </form>
          </div>
        )}

        {/* --- ACTIVE INVENTORY TAB TABLE --- */}
        {activeSubTab === 'inventory' && (
          <div id="stock-list-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 overflow-hidden shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4">
              <div className="text-left font-mono">
                <h3 className="font-display font-extrabold text-base text-text-primary uppercase tracking-wide">STOCK REGISTER BOOK</h3>
                <p className="text-[10px] text-text-secondary mt-1">TOTAL RECORD COUNT: <span className="text-accent font-bold">{products.length}</span> ACTIVE ITEMS</p>
              </div>

              {/* Reset to Seed Button */}
              <button
                id="reset-seed-btn"
                onClick={onResetCatalog}
                className="px-3 py-1.5 rounded-lg bg-red-650/10 border border-red-500/20 text-red-400 hover:bg-red-655/20 text-xs transition font-semibold cursor-pointer"
              >
                Reset Catalog to Defaults
              </button>
            </div>

            {/* Catalog list table */}
            <div className="overflow-x-auto border border-border-premium rounded-xl bg-bg-base scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10.5px]">
                    <th className="p-4">SKU / ID</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Specification</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-premium text-text-secondary">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-elevated/40">
                      <td className="p-4 font-bold text-accent">{item.id}</td>
                      <td className="p-4 font-sans font-bold text-text-primary">{item.title}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-bg-surface border border-border-premium text-accent font-semibold uppercase font-mono">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-accent font-bold">${item.price.toFixed(2)}</td>
                      <td className="p-4 text-text-secondary">
                        {item.weightGrams}g • {item.printTime} // {item.infill}
                      </td>
                      <td className="p-4">
                        <button
                          id={`btn-del-stock-${item.id}`}
                          onClick={() => onDeleteProduct(item.id)}
                          className="p-1 px-2.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-text-secondary">
                        No product inventory loaded. Fill custom creation rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
