import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Link2,
  Trash2, 
  CheckCircle, 
  PlusCircle, 
  Grid, 
  Download, 
  BrainCircuit, 
  Info,
  Layers,
  Check,
  Edit2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  X,
  AlertTriangle,
  FolderSync,
  ListChecks,
  Loader2,
  CircleCheck,
  CircleX,
  Calendar,
  GripVertical,
  Globe,
  Save
} from 'lucide-react';
import { Product, Order } from '../types';

interface SellerHubProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportBulkProducts: (newProducts: Product[]) => void;
  onResetCatalog: () => void;
  onUpdateProducts: (products: Product[]) => void;
}

export default function SellerHub({ 
  products, 
  onAddProduct, 
  onDeleteProduct, 
  onImportBulkProducts, 
  onResetCatalog,
  onUpdateProducts
}: SellerHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'bulk' | 'manual' | 'inventory' | 'orders' | 'preorders'>('ai');

  // --- ORDERS MANAGEMENT STATE & HANDLERS ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch('/api/get-orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'orders') {
      fetchOrders();
    }
  }, [activeSubTab]);

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: 'Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Completed') => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: nextStatus };
      }
      return o;
    });

    try {
      const res = await fetch('/api/save-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        setOrders(updated);
      } else {
        alert("Failed to save updated order status.");
      }
    } catch (err) {
      console.error("Failed to update status on server:", err);
      alert("Failed to communicate with server.");
    }
  };

  // --- PRE-ORDERS MANAGEMENT STATE & HANDLERS ---
  const [editingPreorderId, setEditingPreorderId] = useState<string | null>(null);
  const [preorderTitle, setPreorderTitle] = useState('');
  const [preorderCategory, setPreorderCategory] = useState('Premium Hardware');
  const [preorderPrice, setPreorderPrice] = useState(0);
  const [preorderDescription, setPreorderDescription] = useState('');
  const [preorderDimensions, setPreorderDimensions] = useState('');
  const [preorderWeightGrams, setPreorderWeightGrams] = useState(0);
  const [preorderOriginalCountry, setPreorderOriginalCountry] = useState('');
  const [preorderEstimatedArrival, setPreorderEstimatedArrival] = useState('');
  const [preorderDepositPercentage, setPreorderDepositPercentage] = useState(30);
  const [preorderImages, setPreorderImages] = useState<string[]>([]);
  const [preorderImageUrlInput, setPreorderImageUrlInput] = useState('');
  const [isPreorderUploading, setIsPreorderUploading] = useState(false);

  // DND States
  const [draggedPreorderId, setDraggedPreorderId] = useState<string | null>(null);
  const [preorderDragOverId, setPreorderDragOverId] = useState<string | null>(null);

  const preorderFileInputRef = useRef<HTMLInputElement>(null);

  // DND Handlers
  const handlePreorderDragStart = (e: React.DragEvent, id: string) => {
    setDraggedPreorderId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePreorderDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
  };

  const handlePreorderDragEnter = (e: React.DragEvent, id: string) => {
    if (draggedPreorderId && draggedPreorderId !== id) {
      setPreorderDragOverId(id);
    }
  };

  const handlePreorderDragLeave = (e: React.DragEvent, id: string) => {
    if (preorderDragOverId === id) {
      setPreorderDragOverId(null);
    }
  };

  const handlePreorderDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setPreorderDragOverId(null);
    if (!draggedPreorderId || draggedPreorderId === targetId) return;

    const preorders = products.filter(p => p.isPreOrder);
    const draggedIdx = preorders.findIndex(p => p.id === draggedPreorderId);
    const targetIdx = preorders.findIndex(p => p.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const reordered = [...preorders];
    const [removed] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, removed);

    let count = 0;
    const nextProducts = products.map(p => {
      if (p.isPreOrder) {
        return reordered[count++];
      }
      return p;
    });

    onUpdateProducts(nextProducts);
    setDraggedPreorderId(null);
  };

  // Editing handlers
  const startEditingPreorder = (p: Product) => {
    setEditingPreorderId(p.id);
    setPreorderTitle(p.title);
    setPreorderCategory(p.category || 'Premium Hardware');
    setPreorderPrice(p.price);
    setPreorderDescription(p.description);
    setPreorderDimensions(p.dimensions || '');
    setPreorderWeightGrams(p.weightGrams);
    setPreorderOriginalCountry(p.originalImportCountry || '');
    setPreorderEstimatedArrival(p.estimatedArrival || '');
    setPreorderDepositPercentage(p.depositPercentage || 30);
    setPreorderImages(p.images);
    setPreorderImageUrlInput('');
  };

  const handleSavePreorderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preorderTitle.trim()) return;

    const nextProducts = products.map(p => {
      if (p.id === editingPreorderId) {
        return {
          ...p,
          title: preorderTitle.trim(),
          category: preorderCategory as any,
          price: preorderPrice,
          description: preorderDescription.trim(),
          dimensions: preorderDimensions.trim(),
          weightGrams: preorderWeightGrams,
          originalImportCountry: preorderOriginalCountry.trim(),
          estimatedArrival: preorderEstimatedArrival.trim(),
          depositPercentage: preorderDepositPercentage,
          images: preorderImages.length > 0 ? preorderImages : ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800']
        };
      }
      return p;
    });

    onUpdateProducts(nextProducts);
    setEditingPreorderId(null);
  };

  const handleCreatePreorder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preorderTitle.trim()) return;

    const cleanTitle = preorderTitle.split('|')[0].trim();
    const computedId = 'imported-' + Date.now();

    const newPreorder: Product = {
      id: computedId,
      title: cleanTitle,
      description: preorderDescription.trim() || 'Premium imported hardware pre-order slot.',
      category: preorderCategory as any,
      price: preorderPrice,
      colors: ['Chalk White'],
      materials: ['PLA'],
      rating: 5.0,
      reviewsCount: 0,
      printTime: 'N/A (Imported)',
      weightGrams: preorderWeightGrams,
      images: preorderImages.length > 0 ? preorderImages : ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800'],
      infill: '100% Solid',
      dimensions: preorderDimensions.trim(),
      isCustomizable: false,
      isPreOrder: true,
      estimatedArrival: preorderEstimatedArrival.trim(),
      depositPercentage: preorderDepositPercentage,
      originalImportCountry: preorderOriginalCountry.trim()
    };

    onAddProduct(newPreorder);
    setEditingPreorderId(null);
  };

  const handleAddPreorderImageUrl = () => {
    const trimmed = preorderImageUrlInput.trim();
    if (trimmed && !preorderImages.includes(trimmed)) {
      setPreorderImages(prev => [...prev, trimmed]);
      setPreorderImageUrlInput('');
    }
  };

  const handleRemovePreorderImage = (idx: number) => {
    setPreorderImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMovePreorderImage = (idx: number, dir: 'left' | 'right') => {
    const nextIdx = dir === 'left' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= preorderImages.length) return;
    const reordered = [...preorderImages];
    const temp = reordered[idx];
    reordered[idx] = reordered[nextIdx];
    reordered[nextIdx] = temp;
    setPreorderImages(reordered);
  };

  const handlePreorderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsPreorderUploading(true);

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: `${Date.now()}_preorder_${file.name}`,
              base64Data
            })
          });
          const result = await res.json();
          if (result.success && result.imagePath) {
            setPreorderImages(prev => [...prev, result.imagePath]);
          } else {
            alert('Upload failed: ' + (result.error || 'unknown error'));
          }
        } catch (err) {
          console.error(err);
          alert('Upload failed.');
        } finally {
          setIsPreorderUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- STANDARD SEEDS ---
  const standardMaterials = [
    'PLA (Matte)',
    'PLA (Silk Pearl)',
    'PETG (Durable)',
    'ABS (High-Impact)',
    'TPU (Flexible)'
  ];

  const standardColors = [
    'Matte Slate',
    'Chalk White',
    'Emerald Green',
    'Burnt Orange',
    'Obsidian Black',
    'Jade Green',
    'Silk Copper',
    'Neon Nebula',
    'Pastel Mint',
    'Sandstone Grey',
    'Terracotta',
    'Neon Violet',
    'Cyber Yellow',
    'Steel Blue',
    'Signal Orange',
    'Steel Gray',
    'Silver Pearl'
  ];

  // --- DYNAMIC SEED POOLS ---
  const [customMaterials, setCustomMaterials] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  
  // Track custom additions
  const [newMaterialInput, setNewMaterialInput] = useState('');
  const [newColorInput, setNewColorInput] = useState('');

  useEffect(() => {
    const fromProds = new Set<string>();
    products.forEach(p => {
      if (Array.isArray(p.materials)) {
        p.materials.forEach(m => fromProds.add(m));
      }
    });
    standardMaterials.forEach(m => fromProds.add(m));
    setCustomMaterials(Array.from(fromProds));
  }, [products]);

  useEffect(() => {
    const fromProds = new Set<string>();
    products.forEach(p => {
      if (Array.isArray(p.colors)) {
        p.colors.forEach(c => fromProds.add(c));
      }
    });
    standardColors.forEach(c => fromProds.add(c));
    setCustomColors(Array.from(fromProds));
  }, [products]);

  // --- MANUAL FORM VARIABLES ---
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Desk Accessories');
  const [newPrice, setNewPrice] = useState<string>('19.99');
  const [selectedNewColors, setSelectedNewColors] = useState<string[]>(['Matte Slate', 'Chalk White']);
  const [selectedNewMaterials, setSelectedNewMaterials] = useState<string[]>(['PLA (Matte)']);
  const [newPrintTime, setNewPrintTime] = useState<string>('3h 30m');
  const [newWeight, setNewWeight] = useState<string>('85');
  const [newInfill, setNewInfill] = useState<string>('15% Gyroid');
  const [newDimensions, setNewDimensions] = useState<string>('120 x 120 x 140 mm');
  const [manualImages, setManualImages] = useState<string[]>(['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800']);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);
  const [manualSuccessMsg, setManualSuccessMsg] = useState<boolean>(false);
  const [newIsPreOrder, setNewIsPreOrder] = useState<boolean>(false);
  const [newEstimatedArrival, setNewEstimatedArrival] = useState<string>('Arriving June 26 via Air Cargo');
  const [newDepositPercentage, setNewDepositPercentage] = useState<number>(30);
  const [newOriginalImportCountry, setNewOriginalImportCountry] = useState<string>('Germany');

  // --- MAKERWORLD SCRAPER VARIABLES ---
  const [makerworldUrl, setMakerworldUrl] = useState<string>('');
  const [scrapedImages, setScrapedImages] = useState<string[]>([]);
  const [selectedScrapedImages, setSelectedScrapedImages] = useState<string[]>([]);
  const [makerworldUrlError, setMakerworldUrlError] = useState<string | null>(null);

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

  // --- BULK URL IMPORT VARIABLES ---
  type BulkUrlStatus = 'pending' | 'loading' | 'success' | 'error' | 'duplicate';
  interface BulkUrlEntry {
    url: string;
    status: BulkUrlStatus;
    product?: Partial<Product>;
    images?: string[];
    selectedImages?: string[];
    editPrice?: string;   // user-editable price override
    editTags?: string;    // user-editable tags (comma-separated)
    error?: string;
  }
  const [bulkUrlText, setBulkUrlText] = useState<string>('');
  const [bulkEntries, setBulkEntries] = useState<BulkUrlEntry[]>([]);
  const [isBulkRunning, setIsBulkRunning] = useState<boolean>(false);
  const [bulkCommitSuccess, setBulkCommitSuccess] = useState<boolean>(false);

  // --- EDIT MODE STATE ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editImageInput, setEditImageInput] = useState<string>('');

  // --- BULK EDIT STATE ---
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkPriceAction, setBulkPriceAction] = useState<'flat' | 'percent_increase' | 'percent_decrease'>('flat');
  const [bulkPriceValue, setBulkPriceValue] = useState<string>('');
  const [bulkMaterialsToAdd, setBulkMaterialsToAdd] = useState<string[]>([]);
  const [bulkMaterialsToRemove, setBulkMaterialsToRemove] = useState<string[]>([]);
  const [bulkColorsToAdd, setBulkColorsToAdd] = useState<string[]>([]);
  const [bulkColorsToRemove, setBulkColorsToRemove] = useState<string[]>([]);
  const [bulkDescriptionAction, setBulkDescriptionAction] = useState<'prepend' | 'append' | 'overwrite' | 'none'>('none');
  const [bulkDescriptionValue, setBulkDescriptionValue] = useState<string>('');

  // --- FILE INPUT REFERENCES ---
  const manualFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // --- DYNAMIC AI SCRAPE AGENT HANDLERS ---
  const handleAIExtract = async () => {
    if (!makerworldPaste.trim()) {
      alert("Please paste text from MakerWorld first.");
      return;
    }
    setAiError(null);
    setIsAiLoading(true);
    setParsedAiProduct(null);
    setScrapedImages([]);
    setSelectedScrapedImages([]);
    setMakerworldUrlError(null);
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
        setAiError(data.error || "Failed to parse the catalog details via AI.");
      }
    } catch (e: any) {
      setAiError("Failed to communicate with Express server: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleMakerWorldURLImport = async () => {
    if (!makerworldUrl.trim() || !makerworldUrl.startsWith('http')) {
      alert("Please enter a valid MakerWorld URL starting with http.");
      return;
    }
    setAiError(null);
    setIsAiLoading(true);
    setParsedAiProduct(null);
    setScrapedImages([]);
    setSelectedScrapedImages([]);
    setMakerworldUrlError(null);
    setAiImportSuccess(false);

    try {
      const response = await fetch('/api/import-makerworld-by-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: makerworldUrl.trim() })
      });
      const data = await response.json();

      if (response.ok && data.success && data.product) {
        setParsedAiProduct(data.product);
        setScrapedImages(data.product.images || []);
        setSelectedScrapedImages(data.product.images || []);
        
        // Double check duplicate checks locally
        const isDupUrl = products.some(p => p.makerWorldUrl === makerworldUrl.trim());
        if (isDupUrl) {
          setMakerworldUrlError("Duplicate URL Warning: This MakerWorld model already exists in your store.");
        }
      } else {
        setAiError(data.error || "Failed to scrape MakerWorld. Double check your internet and model URL.");
      }
    } catch (e: any) {
      setAiError("Connection failed: " + e.message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApproveAndAddAIProduct = () => {
    if (!parsedAiProduct) return;

    const cleanTitle = parsedAiProduct.title?.split('|')[0].trim() || 'Parsed AI Product';
    const computedId = 'belvia-' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Duplicate checks
    const isDupUrl = parsedAiProduct.makerWorldUrl && products.some(p => p.makerWorldUrl === parsedAiProduct.makerWorldUrl);
    const isDupId = products.some(p => p.id === computedId);

    if (isDupUrl || isDupId) {
      alert("This product already exists in your store (either MakerWorld URL or computed ID already matched). Skip importing to prevent duplicates!");
      return;
    }
    
    const finalProduct: Product = {
      id: computedId,
      title: cleanTitle,
      description: parsedAiProduct.description || 'Processed via MakerWorld AI.',
      category: (parsedAiProduct.category as any) || 'Desk Accessories',
      price: parsedAiProduct.price || 19.99,
      colors: parsedAiProduct.colors || ['Chalk White', 'Matte Slate'],
      materials: parsedAiProduct.materials || ['PLA (Matte)'],
      rating: 5.0,
      reviewsCount: 1,
      printTime: parsedAiProduct.printTime || '2h 15m',
      weightGrams: parsedAiProduct.weightGrams || 50,
      images: selectedScrapedImages.length > 0 ? selectedScrapedImages : (parsedAiProduct.images || ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800']),
      infill: parsedAiProduct.infill || '15% Gyroid',
      dimensions: parsedAiProduct.dimensions || '100x100x100 mm',
      isCustomizable: parsedAiProduct.isCustomizable ?? true,
      makerWorldUrl: parsedAiProduct.makerWorldUrl
    };

    onAddProduct(finalProduct);
    setAiImportSuccess(true);
    setTimeout(() => {
      setParsedAiProduct(null);
      setScrapedImages([]);
      setSelectedScrapedImages([]);
      setMakerworldUrl('');
      setAiImportSuccess(false);
    }, 2500);
  };

  // --- DYNAMIC CUSTOM SEED HANDLERS ---
  const handleAddCustomMaterial = () => {
    if (!newMaterialInput.trim()) return;
    if (customMaterials.includes(newMaterialInput.trim())) return;
    setCustomMaterials(prev => [...prev, newMaterialInput.trim()]);
    setNewMaterialInput('');
  };

  const handleAddCustomColor = () => {
    if (!newColorInput.trim()) return;
    if (customColors.includes(newColorInput.trim())) return;
    setCustomColors(prev => [...prev, newColorInput.trim()]);
    setNewColorInput('');
  };

  // --- IMAGE FILE UPLOADING ---
  const triggerImageUpload = (forEdit: boolean) => {
    if (forEdit && editFileRef.current) {
      editFileRef.current.click();
    } else if (!forEdit && manualFileRef.current) {
      manualFileRef.current.click();
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, forEdit: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setUploadProgress(true);
    
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `${Date.now()}_${file.name}`,
            base64Data
          })
        });
        const data = await response.json();
        if (data.success && data.imagePath) {
          if (forEdit && editingProduct) {
            setEditingProduct(prev => {
              if (!prev) return null;
              return {
                ...prev,
                images: [...prev.images, data.imagePath]
              };
            });
          } else {
            setManualImages(prev => [...prev, data.imagePath]);
          }
        } else {
          alert("Image upload failed: " + (data.error || "Unknown response structure."));
        }
      } catch (err: any) {
        alert("Image upload network error: " + err.message);
      } finally {
        setUploadProgress(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- MANUAL SAVER HANDLER ---
  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const cleanTitle = newTitle.split('|')[0].trim();
    const computedId = 'bv-mnf-' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Duplicate check by ID
    const isDupId = products.some(p => p.id === computedId);
    if (isDupId) {
      alert("A product with this ID already exists in catalog. Try another title!");
      return;
    }

    const readyProduct: Product = {
      id: computedId,
      title: newTitle,
      description: newDesc || (newIsPreOrder ? 'Premium imported hardware pre-order slot.' : 'Handcrafted precision filament print optimized by Belvia team.'),
      category: newCategory as any,
      price: parseFloat(newPrice) || 19.99,
      colors: selectedNewColors.length ? selectedNewColors : ['Chalk White'],
      materials: selectedNewMaterials.length ? selectedNewMaterials : ['PLA (Matte)'],
      rating: 4.8,
      reviewsCount: 1,
      printTime: newPrintTime || '3h 15m',
      weightGrams: parseInt(newWeight) || 90,
      images: manualImages.length > 0 ? manualImages : ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800'],
      infill: newInfill,
      dimensions: newDimensions,
      isCustomizable: !newIsPreOrder,
      isPreOrder: newIsPreOrder,
      estimatedArrival: newIsPreOrder ? newEstimatedArrival : undefined,
      depositPercentage: newIsPreOrder ? newDepositPercentage : undefined,
      originalImportCountry: newIsPreOrder ? newOriginalImportCountry : undefined
    };

    onAddProduct(readyProduct);
    setManualSuccessMsg(true);

    // Reset Fields
    setNewTitle('');
    setNewDesc('');
    setManualImages(['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800']);
    setSelectedNewColors(['Matte Slate', 'Chalk White']);
    setSelectedNewMaterials(['PLA (Matte)']);
    setNewIsPreOrder(false);
    setNewEstimatedArrival('Arriving June 26 via Air Cargo');
    setNewDepositPercentage(30);
    setNewOriginalImportCountry('Germany');
    setTimeout(() => setManualSuccessMsg(false), 2000);
  };

  // --- BULK URL IMPORT ENGINE ---
  const handleBulkUrlRun = async () => {
    const lines = bulkUrlText
      .split('\n')
      .map(l => {
        const firstToken = l.trim().split(/[\t\s]+/)[0];
        return firstToken ? firstToken.trim() : '';
      })
      .filter(l => l.startsWith('http'));
    if (lines.length === 0) {
      alert('No valid URLs found. Enter one MakerWorld URL per line.');
      return;
    }

    const existingUrls = new Set(products.map(p => p.makerWorldUrl).filter(Boolean));

    // Initialize all entries as pending
    const initial: BulkUrlEntry[] = lines.map(url => ({ url, status: 'pending' as const }));
    setBulkEntries(initial);
    setIsBulkRunning(true);
    setBulkCommitSuccess(false);

    // Fire all requests in parallel
    const promises = lines.map(async (url, idx) => {
      // Mark as loading
      setBulkEntries(prev => prev.map((e, i) => i === idx ? { ...e, status: 'loading' } : e));

      // Pre-check duplicate
      if (existingUrls.has(url)) {
        setBulkEntries(prev => prev.map((e, i) => i === idx
          ? { ...e, status: 'duplicate', error: 'Already in catalog' }
          : e
        ));
        return;
      }

      try {
        const response = await fetch('/api/import-makerworld-by-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await response.json();

        if (response.ok && data.success && data.product) {
          setBulkEntries(prev => prev.map((e, i) => i === idx
            ? {
                ...e,
                status: 'success',
                product: data.product,
                images: data.product.images || [],
                selectedImages: data.product.images || [],
                editPrice: String(data.product.price ?? ''),
                editTags: Array.isArray(data.product.tags) ? data.product.tags.join(', ') : ''
              }
            : e
          ));
        } else {
          setBulkEntries(prev => prev.map((e, i) => i === idx
            ? { ...e, status: 'error', error: data.error || 'Scrape failed' }
            : e
          ));
        }
      } catch (err: any) {
        setBulkEntries(prev => prev.map((e, i) => i === idx
          ? { ...e, status: 'error', error: err.message }
          : e
        ));
      }
    });

    await Promise.allSettled(promises);
    setIsBulkRunning(false);
  };

  const handleBulkToggleImage = (entryIdx: number, imgUrl: string) => {
    setBulkEntries(prev => prev.map((e, i) => {
      if (i !== entryIdx) return e;
      const sel = e.selectedImages || [];
      const next = sel.includes(imgUrl) ? sel.filter(u => u !== imgUrl) : [...sel, imgUrl];
      return { ...e, selectedImages: next };
    }));
  };

  const handleBulkEditPrice = (entryIdx: number, value: string) => {
    setBulkEntries(prev => prev.map((e, i) => i === entryIdx ? { ...e, editPrice: value } : e));
  };

  const handleBulkEditTags = (entryIdx: number, value: string) => {
    setBulkEntries(prev => prev.map((e, i) => i === entryIdx ? { ...e, editTags: value } : e));
  };

  const handleBulkCommit = () => {
    const readyEntries = bulkEntries.filter(e => e.status === 'success' && e.product);
    if (readyEntries.length === 0) return;

    const existingIds = new Set(products.map(p => p.id));
    const toAdd: Product[] = [];

    for (const entry of readyEntries) {
      const p = entry.product!;
      const cleanTitle = p.title?.split('|')[0].trim() || 'Bulk Import Product';
      const computedId = 'belvia-' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (existingIds.has(computedId)) continue;
      existingIds.add(computedId);

      // Use user-edited price if provided and valid, else fall back to scraped price
      const resolvedPrice = entry.editPrice && !isNaN(parseFloat(entry.editPrice))
        ? parseFloat(parseFloat(entry.editPrice).toFixed(2))
        : (p.price || 19.99);

      // Parse user-edited tags
      const resolvedTags = entry.editTags
        ? entry.editTags.split(',').map(t => t.trim()).filter(Boolean)
        : (p.tags || []);

      toAdd.push({
        id: computedId,
        title: cleanTitle,
        description: p.description || 'Imported via Bulk MakerWorld URL.',
        category: (p.category as any) || 'Desk Accessories',
        price: resolvedPrice,
        colors: p.colors || ['Chalk White', 'Matte Slate'],
        materials: p.materials || ['PLA (Matte)'],
        tags: resolvedTags,
        rating: 5.0,
        reviewsCount: 1,
        printTime: p.printTime || '2h 15m',
        weightGrams: p.weightGrams || 50,
        images: (entry.selectedImages && entry.selectedImages.length > 0)
          ? entry.selectedImages
          : (p.images || ['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800']),
        infill: p.infill || '15% Gyroid',
        dimensions: p.dimensions || '100x100x100 mm',
        isCustomizable: p.isCustomizable ?? true,
        makerWorldUrl: p.makerWorldUrl
      });
    }

    if (toAdd.length === 0) {
      alert('No new unique products to commit (all may already exist).');
      return;
    }

    onImportBulkProducts(toAdd);
    setBulkCommitSuccess(true);
    setTimeout(() => {
      setBulkEntries([]);
      setBulkUrlText('');
      setBulkCommitSuccess(false);
    }, 3000);
  };

  // --- BATCH EXPORT FUNCTION ---
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

  // --- EDIT PRODUCT ACTIONS ---
  const handleStartEdit = (product: Product) => {
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    if (!editingProduct.title.trim()) {
      alert("Product title cannot be empty.");
      return;
    }

    const updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    onUpdateProducts(updated);
    setEditingProduct(null);
  };

  const handleAddEditImage = () => {
    if (!editImageInput.trim()) return;
    if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: [...prev.images, editImageInput.trim()]
        };
      });
      setEditImageInput('');
    }
  };

  const handleRemoveEditImage = (idx: number) => {
    if (editingProduct) {
      setEditingProduct(prev => {
        if (!prev) return null;
        return {
          ...prev,
          images: prev.images.filter((_, i) => i !== idx)
        };
      });
    }
  };

  const handleMoveEditImage = (idx: number, direction: 'left' | 'right') => {
    if (!editingProduct) return;
    const images = [...editingProduct.images];
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    
    if (targetIdx < 0 || targetIdx >= images.length) return;
    
    // Swap
    const temp = images[idx];
    images[idx] = images[targetIdx];
    images[targetIdx] = temp;
    
    setEditingProduct(prev => {
      if (!prev) return null;
      return { ...prev, images };
    });
  };

  // --- BULK EDIT ACTIONS ---
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map(p => p.id));
    }
  };

  const handleApplyBulkEdits = () => {
    if (selectedProductIds.length === 0) return;
    
    const updated = products.map(p => {
      if (selectedProductIds.includes(p.id)) {
        let price = p.price;
        if (bulkPriceValue && !isNaN(parseFloat(bulkPriceValue))) {
          const val = parseFloat(bulkPriceValue);
          if (bulkPriceAction === 'flat') {
            price = val;
          } else if (bulkPriceAction === 'percent_increase') {
            price = parseFloat((p.price * (1 + val / 100)).toFixed(2));
          } else if (bulkPriceAction === 'percent_decrease') {
            price = parseFloat((p.price * (1 - val / 100)).toFixed(2));
          }
        }

        let materials = [...p.materials];
        bulkMaterialsToAdd.forEach(m => {
          if (!materials.includes(m)) materials.push(m);
        });
        materials = materials.filter(m => !bulkMaterialsToRemove.includes(m));

        let colors = [...p.colors];
        bulkColorsToAdd.forEach(c => {
          if (!colors.includes(c)) colors.push(c);
        });
        colors = colors.filter(c => !bulkColorsToRemove.includes(c));

        let description = p.description;
        if (bulkDescriptionAction === 'overwrite') {
          description = bulkDescriptionValue;
        } else if (bulkDescriptionAction === 'prepend') {
          description = bulkDescriptionValue + ' ' + p.description;
        } else if (bulkDescriptionAction === 'append') {
          description = p.description + ' ' + bulkDescriptionValue;
        }

        return {
          ...p,
          price,
          materials,
          colors,
          description
        };
      }
      return p;
    });

    onUpdateProducts(updated);
    setSelectedProductIds([]);
    setBulkPriceValue('');
    setBulkMaterialsToAdd([]);
    setBulkMaterialsToRemove([]);
    setBulkColorsToAdd([]);
    setBulkColorsToRemove([]);
    setBulkDescriptionValue('');
    setBulkDescriptionAction('none');
    alert("Bulk updates successfully applied and saved.");
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;
    if (confirm(`Are you sure you want to permanently delete the ${selectedProductIds.length} selected products?`)) {
      const updated = products.filter(p => !selectedProductIds.includes(p.id));
      onUpdateProducts(updated);
      setSelectedProductIds([]);
    }
  };

  const toggleBulkMaterial = (mat: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      setBulkMaterialsToAdd(prev => prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]);
    } else {
      setBulkMaterialsToRemove(prev => prev.includes(mat) ? prev.filter(m => m !== mat) : [...prev, mat]);
    }
  };

  const toggleBulkColor = (col: string, action: 'add' | 'remove') => {
    if (action === 'add') {
      setBulkColorsToAdd(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    } else {
      setBulkColorsToRemove(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    }
  };

  return (
    <section id="seller-dashboard-workstation" className="py-16 bg-bg-base relative text-left">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      
      {/* Hidden inputs for image uploads */}
      <input 
        type="file" 
        ref={manualFileRef} 
        onChange={(e) => handleImageFileChange(e, false)} 
        className="hidden" 
        accept="image/*" 
      />
      <input 
        type="file" 
        ref={editFileRef} 
        onChange={(e) => handleImageFileChange(e, true)} 
        className="hidden" 
        accept="image/*" 
      />

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
              Fulfill your scale demands. Manage ready-made products, paste raw web descriptions or paste MakerWorld URLs to parse via serverless Gemini extraction, or load massive spreadsheets.
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
        <div className="flex bg-bg-surface border border-border-premium rounded-xl p-1 mb-8 max-w-5xl overflow-x-auto">
          {[
            { id: 'ai', name: 'MakerWorld AI Agent', icon: Sparkles },
            { id: 'bulk', name: 'Bulk URL Import', icon: Link2 },
            { id: 'manual', name: 'Drag & Drop Manual', icon: PlusCircle },
            { id: 'inventory', name: 'Active Inventory Catalog', icon: Grid },
            { id: 'orders', name: 'Manage Orders & Payments', icon: ListChecks },
            { id: 'preorders', name: 'Manage Pre-Orders', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                id={`subtab-${tab.id}`}
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setEditingProduct(null); // Clear editing product on tab switch
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                  activeSubTab === tab.id && !editingProduct
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

        {/* --- AI AGENT SECTION --- */}
        {activeSubTab === 'ai' && !editingProduct && (
          <div id="ai-importer-submodule" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Paste and URL importer */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* URL scrape card */}
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 text-accent font-bold text-sm">
                  <FolderSync className="w-5 h-5 text-accent" />
                  <span>Import via MakerWorld Page URL</span>
                </div>
                
                <p className="text-text-secondary text-xs leading-relaxed">
                  Enter a model page URL directly to scrape raw contents and parse details with duplicate prevention:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={makerworldUrl}
                    onChange={(e) => setMakerworldUrl(e.target.value)}
                    placeholder="https://makerworld.com/en/models/..."
                    className="flex-1 bg-bg-base text-text-primary border border-border-premium rounded-xl py-3 px-3.5 text-xs focus:border-accent font-mono"
                  />
                  <button
                    onClick={handleMakerWorldURLImport}
                    disabled={isAiLoading}
                    className="px-4 py-3 rounded-xl bg-accent-secondary hover:bg-accent-hover disabled:opacity-40 text-white font-bold text-xs cursor-pointer flex items-center space-x-2 transition"
                  >
                    {isAiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                    <span>Scrape &amp; Parse</span>
                  </button>
                </div>
                {makerworldUrlError && (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/35 rounded-xl text-orange-400 text-xs font-semibold flex items-center space-x-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{makerworldUrlError}</span>
                  </div>
                )}
              </div>

              {/* Text Area Parser */}
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 text-accent font-bold text-sm">
                  <BrainCircuit className="w-5 h-5 animate-pulse text-accent" />
                  <span>Gemini MakerWorld Text Extractor</span>
                </div>
                
                <p className="text-text-secondary text-xs leading-relaxed">
                  Avoid typing details manually! Highlight page content on MakerWorld, copy the model information, and paste below:
                </p>

                <textarea
                  id="paste-makerworld-text"
                  value={makerworldPaste}
                  onChange={(e) => setMakerworldPaste(e.target.value)}
                  rows={6}
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
                    <span>{isAiLoading ? 'Analyzing & Slicing...' : 'Parse & Extract Text'}</span>
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
                  
                  {/* Warning/Success tag */}
                  {makerworldUrlError ? (
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>DUPLICATE DETECTED</span>
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-accent font-bold bg-accent/10 border border-accent/20 px-2 py-0.5 rounded animate-pulse">
                      PARSING SUCCESS
                    </div>
                  )}

                  <h3 className="font-display font-extrabold text-base text-text-primary">Review Extracted Catalog Product</h3>
                  
                  <div className="bg-bg-base rounded-xl border border-border-premium p-4.5 space-y-3.5 font-mono text-xs">
                    
                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">ID:</span>
                      <span className="text-text-secondary text-right font-bold text-accent">[Auto-Assign SKU]</span>
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
                      <span className="text-text-secondary">CATEGORY:</span>
                      <span className="text-accent font-bold">{parsedAiProduct.category}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">SUGGESTED MSRP:</span>
                      <span className="text-accent font-bold">${parsedAiProduct.price?.toFixed(2)}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between items-start">
                      <span className="text-text-secondary shrink-0">SUITED COLORS:</span>
                      <span className="text-text-secondary text-right text-[11px]">{parsedAiProduct.colors?.join(', ')}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between items-start">
                      <span className="text-text-secondary shrink-0">MATERIALS:</span>
                      <span className="text-text-secondary text-right text-[11px]">{parsedAiProduct.materials?.join(', ')}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">PRINT TIME:</span>
                      <span className="text-text-primary font-bold">{parsedAiProduct.printTime}</span>
                    </div>

                    <div className="border-b border-border-premium pb-2 flex justify-between">
                      <span className="text-text-secondary">PRINT WEIGHT:</span>
                      <span className="text-text-primary font-bold">{parsedAiProduct.weightGrams}g</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-text-secondary">DIMENSIONAL METRIC:</span>
                      <span className="text-text-primary font-bold">{parsedAiProduct.dimensions}</span>
                    </div>
                  </div>

                  {/* Scraped Images selector */}
                  {scrapedImages.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                        Manage Scraped Images (Select to Import):
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {scrapedImages.map((img, idx) => {
                          const isSelected = selectedScrapedImages.includes(img);
                          return (
                            <div 
                              key={idx} 
                              onClick={() => setSelectedScrapedImages(prev => 
                                isSelected ? prev.filter(url => url !== img) : [...prev, img]
                              )}
                              className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition relative group ${
                                isSelected ? 'border-accent ring-1 ring-accent' : 'border-border-premium hover:border-gray-500'
                              }`}
                            >
                              <img src={img} alt="Scraped suggestion" className="w-full h-full object-cover" />
                              <div className={`absolute inset-0 bg-accent/20 flex items-center justify-center transition ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`}>
                                <Check className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {aiImportSuccess ? (
                    <div className="p-3 bg-accent-secondary/10 border border-accent/20 text-accent rounded-xl text-center text-xs font-mono font-bold flex items-center justify-center space-x-2 animate-bounce">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span>Appended to Belvia Store Catalog successfully!</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => {
                          setParsedAiProduct(null);
                          setScrapedImages([]);
                          setSelectedScrapedImages([]);
                          setMakerworldUrlError(null);
                        }}
                        className="py-3 px-4 rounded-xl border border-border-premium text-text-secondary text-xs font-semibold hover:bg-bg-elevated cursor-pointer text-center"
                      >
                        Decline Slices
                      </button>
                      <button
                        onClick={handleApproveAndAddAIProduct}
                        disabled={!!makerworldUrlError}
                        className="py-3 px-4 rounded-xl bg-accent-secondary hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs cursor-pointer text-center shadow"
                      >
                        Approve &amp; Add to Catalog
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="border-2 border-dashed border-border-premium bg-bg-surface/30 rounded-2xl py-24 px-6 text-center text-text-secondary font-mono uppercase text-xs">
                  <Layers className="w-10 h-10 text-text-secondary/40 mx-auto mb-4 animate-pulse" />
                  <span>AI SPEC EXTRACTIONS SHEET DUMP WINDOW</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* --- BULK URL IMPORT SECTION --- */}
        {activeSubTab === 'bulk' && !editingProduct && (
          <div id="bulk-url-importer-submodule" className="space-y-6">

            {/* Input card */}
            <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 space-y-4">
              <div className="flex items-center space-x-2 text-accent font-bold text-sm">
                <Link2 className="w-5 h-5 text-accent" />
                <span>Bulk MakerWorld URL Import</span>
              </div>

              <p className="text-text-secondary text-xs leading-relaxed">
                Paste multiple MakerWorld product page URLs — one per line. All links will be scraped and parsed simultaneously via the AI extraction pipeline.
              </p>

              <textarea
                id="bulk-url-textarea"
                value={bulkUrlText}
                onChange={(e) => setBulkUrlText(e.target.value)}
                rows={8}
                placeholder={`https://makerworld.com/en/models/123456\nhttps://makerworld.com/en/models/789012\nhttps://makerworld.com/en/models/345678`}
                className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-3 px-3.5 text-xs focus:border-accent font-mono resize-none leading-relaxed"
              />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-secondary font-mono">
                  {bulkUrlText.split('\n').filter(l => l.trim().startsWith('http')).length} valid URL(s) detected
                </span>
                <button
                  id="btn-bulk-run"
                  onClick={handleBulkUrlRun}
                  disabled={isBulkRunning || !bulkUrlText.trim()}
                  className="px-5 py-3 rounded-xl bg-accent-secondary hover:bg-accent-hover disabled:opacity-40 text-white font-bold text-xs cursor-pointer flex items-center space-x-2.5 transition active:scale-95"
                >
                  {isBulkRunning
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ListChecks className="w-4 h-4" />
                  }
                  <span>{isBulkRunning ? 'Scraping...' : 'Run Bulk Import'}</span>
                </button>
              </div>
            </div>

            {/* Results queue */}
            {bulkEntries.length > 0 && (
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 space-y-4">

                {/* Summary bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ListChecks className="w-5 h-5 text-accent" />
                    <span className="font-bold text-sm text-text-primary">
                      Import Queue — {bulkEntries.length} URLs
                    </span>
                    <div className="flex items-center space-x-2 text-[10px] font-mono">
                      <span className="text-emerald-400">{bulkEntries.filter(e => e.status === 'success').length} ready</span>
                      <span className="text-text-secondary">·</span>
                      <span className="text-red-400">{bulkEntries.filter(e => e.status === 'error').length} failed</span>
                      <span className="text-text-secondary">·</span>
                      <span className="text-amber-400">{bulkEntries.filter(e => e.status === 'duplicate').length} duplicate</span>
                      <span className="text-text-secondary">·</span>
                      <span className="text-blue-400">{bulkEntries.filter(e => e.status === 'loading').length} loading</span>
                    </div>
                  </div>

                  {!isBulkRunning && bulkEntries.some(e => e.status === 'success') && (
                    bulkCommitSuccess ? (
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono font-bold animate-pulse">
                        <CheckCircle className="w-4 h-4" />
                        <span>All products added to catalog!</span>
                      </div>
                    ) : (
                      <button
                        id="btn-bulk-commit"
                        onClick={handleBulkCommit}
                        className="px-4.5 py-2 rounded-xl bg-accent-secondary hover:bg-accent text-white font-bold text-xs cursor-pointer transition shadow"
                      >
                        Add {bulkEntries.filter(e => e.status === 'success').length} to Catalog
                      </button>
                    )
                  )}
                </div>

                {/* Per-URL entries */}
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {bulkEntries.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 space-y-3 transition ${
                        entry.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/5'
                        : entry.status === 'error' ? 'border-red-500/30 bg-red-500/5'
                        : entry.status === 'duplicate' ? 'border-amber-500/30 bg-amber-500/5'
                        : entry.status === 'loading' ? 'border-blue-500/30 bg-blue-500/5'
                        : 'border-border-premium bg-bg-base'
                      }`}
                    >
                      {/* URL row + status icon */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-mono text-[10px] text-text-secondary break-all leading-relaxed flex-1">
                          {entry.url}
                        </span>
                        <div className="shrink-0 mt-0.5">
                          {entry.status === 'loading' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                          {entry.status === 'success' && <CircleCheck className="w-4 h-4 text-emerald-400" />}
                          {entry.status === 'error' && <CircleX className="w-4 h-4 text-red-400" />}
                          {entry.status === 'duplicate' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {entry.status === 'pending' && <div className="w-4 h-4 rounded-full border border-border-premium" />}
                        </div>
                      </div>

                      {/* Error / duplicate message */}
                      {(entry.status === 'error' || entry.status === 'duplicate') && entry.error && (
                        <p className="text-[10px] font-mono text-red-400/80">{entry.error}</p>
                      )}

                      {/* Success: product summary + inline edit + image picker */}
                      {entry.status === 'success' && entry.product && (
                        <div className="space-y-3">
                          {/* Info grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px]">
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-text-secondary block">TITLE</span>
                              <span className="text-text-primary font-bold font-sans text-xs leading-tight">{entry.product.title?.split('|')[0].trim()}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary block">CATEGORY</span>
                              <span className="text-accent font-bold">{entry.product.category}</span>
                            </div>
                            <div>
                              <span className="text-text-secondary block">WEIGHT</span>
                              <span className="text-text-primary font-bold">{entry.product.weightGrams}g</span>
                            </div>
                          </div>

                          {/* Editable price + tags */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Price (USD)</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-accent font-bold text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={entry.editPrice ?? ''}
                                  onChange={(e) => handleBulkEditPrice(idx, e.target.value)}
                                  className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-2 pl-6 pr-3 text-xs font-mono focus:border-accent focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">Tags (comma-separated)</label>
                              <input
                                type="text"
                                value={entry.editTags ?? ''}
                                onChange={(e) => handleBulkEditTags(idx, e.target.value)}
                                placeholder="e.g. flexi, articulated, cat"
                                className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-2 px-3 text-xs font-mono focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* Image selector */}
                          {entry.images && entry.images.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                                Select Images ({(entry.selectedImages || []).length}/{entry.images.length} selected):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {entry.images.map((img, imgIdx) => {
                                  const isSelected = (entry.selectedImages || []).includes(img);
                                  return (
                                    <div
                                      key={imgIdx}
                                      onClick={() => handleBulkToggleImage(idx, img)}
                                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition relative group ${
                                        isSelected ? 'border-accent ring-1 ring-accent' : 'border-border-premium hover:border-gray-500'
                                      }`}
                                    >
                                      <img src={img} alt="" className="w-full h-full object-cover" />
                                      <div className={`absolute inset-0 bg-accent/25 flex items-center justify-center transition ${
                                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                      }`}>
                                        <Check className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- MANUAL UPLOAD CREATION FORM SECTION --- */}
        {activeSubTab === 'manual' && !editingProduct && (
          <div id="manual-creator-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 sm:p-8 shadow-xl">
            <h3 className="font-display font-extrabold text-base text-text-primary mb-6">Create Custom Ready-Made Catalog Item</h3>
            
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
                      <option value="Imported Goods">Imported Goods</option>
                      <option value="A1 Mini Mods">A1 Mini Mods</option>
                      <option value="Hotends">Hotends</option>
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

                {/* Pre-order Configuration Toggle */}
                <div className="space-y-3 bg-bg-surface/50 border border-border-premium rounded-xl p-4">
                  <label className="flex items-center space-x-2.5 text-xs text-text-primary font-bold cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newIsPreOrder}
                      onChange={(e) => setNewIsPreOrder(e.target.checked)}
                      className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                    />
                    <span>Is this a Pre-Order only product?</span>
                  </label>

                  {newIsPreOrder && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border-premium/50 animate-fade-in font-mono text-xs">
                      <div>
                        <label className="block text-[9px] text-text-secondary uppercase mb-1">ETA Arrival Cargo:</label>
                        <input 
                          type="text"
                          value={newEstimatedArrival}
                          onChange={(e) => setNewEstimatedArrival(e.target.value)}
                          placeholder="e.g. June 26 via Air Cargo"
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-text-secondary uppercase mb-1">Required Deposit (%):</label>
                        <input 
                          type="number"
                          min="1"
                          max="100"
                          value={newDepositPercentage}
                          onChange={(e) => setNewDepositPercentage(parseInt(e.target.value) || 30)}
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-text-secondary uppercase mb-1">Import Country Origin:</label>
                        <input 
                          type="text"
                          value={newOriginalImportCountry}
                          onChange={(e) => setNewOriginalImportCountry(e.target.value)}
                          placeholder="e.g. Germany"
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Materials Checker */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Filament Materials Assignment:
                  </label>
                  <div className="flex flex-wrap gap-3 bg-bg-base border border-border-premium rounded-xl p-3.5">
                    {customMaterials.map((mat) => {
                      const isChecked = selectedNewMaterials.includes(mat);
                      return (
                        <label key={mat} className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setSelectedNewMaterials(prev => 
                              isChecked ? prev.filter(m => m !== mat) : [...prev, mat]
                            )}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                          <span>{mat}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newMaterialInput}
                      onChange={(e) => setNewMaterialInput(e.target.value)}
                      placeholder="Add custom material e.g. PETG-CF"
                      className="flex-1 bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 px-3 text-xs focus:border-accent"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCustomMaterial}
                      className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-premium hover:border-gray-500 text-xs text-text-primary cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Colors Checker */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Color Swatches Selection:
                  </label>
                  <div className="flex flex-wrap gap-3 bg-bg-base border border-border-premium rounded-xl p-3.5">
                    {customColors.map((col) => {
                      const isChecked = selectedNewColors.includes(col);
                      return (
                        <label key={col} className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setSelectedNewColors(prev => 
                              isChecked ? prev.filter(c => c !== col) : [...prev, col]
                            )}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                          <span>{col}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      placeholder="Add custom color e.g. Translucent Red"
                      className="flex-1 bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 px-3 text-xs focus:border-accent"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCustomColor}
                      className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-premium hover:border-gray-500 text-xs text-text-primary cursor-pointer"
                    >
                      + Add
                    </button>
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

              {/* Right Image Upload / Gallery Section */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-2">
                    Product Image Showcase Gallery:
                  </label>
                  
                  <div
                    onClick={() => triggerImageUpload(false)}
                    className="border-2 border-dashed border-border-premium bg-bg-surface/30 rounded-2xl py-10 px-6 text-center select-none cursor-pointer relative overflow-hidden group hover:border-gray-700 transition"
                  >
                    {uploadProgress ? (
                      <div className="space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto" />
                        <p className="text-xs text-text-secondary font-mono">Uploading texture layers...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 relative z-10">
                        <Upload className="w-8 h-8 text-accent mx-auto group-hover:scale-105 transition" />
                        <p className="text-text-primary text-xs font-semibold">Click to upload display images/photos</p>
                        <p className="text-[10px] text-text-secondary font-mono">PNG, JPG, WEBP formats supported</p>
                      </div>
                    )}
                  </div>

                  {/* Manual images thumbnails list */}
                  {manualImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest">Active Showcase Images ({manualImages.length}):</label>
                      <div className="grid grid-cols-4 gap-2">
                        {manualImages.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-lg border border-border-premium overflow-hidden relative group">
                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setManualImages(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 rounded bg-red-600/90 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Direct Photo Image Link URL (Fallback):
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste direct image URL and hit Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            setManualImages(prev => [...prev, val]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
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
                    className="w-full py-3.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white font-bold text-xs cursor-pointer shadow transition"
                  >
                    Commit &amp; Write Product Stock
                  </button>
                )}

              </div>

            </form>
          </div>
        )}

        {/* --- EDIT PRODUCT CARD COMPONENT --- */}
        {editingProduct && (
          <div id="editing-product-submodule" className="bg-bg-surface border border-accent/30 rounded-2xl p-6 sm:p-8 shadow-2xl relative animate-fade-in text-left">
            <button 
              onClick={() => setEditingProduct(null)} 
              className="absolute top-4 right-4 p-2 rounded-xl bg-bg-base border border-border-premium text-text-secondary hover:text-text-primary transition"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-widest block mb-1">
              Active Workstation Panel // Mode: Inline Edit
            </span>
            <h2 className="font-display font-black text-xl text-text-primary mb-6">
              Edit Product Details: <span className="text-accent">{editingProduct.title}</span>
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Form Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Product SKU / ID (Locked):
                    </label>
                    <input
                      type="text"
                      disabled
                      value={editingProduct.id}
                      className="w-full bg-bg-base/50 text-text-muted border border-border-premium/50 rounded-xl py-2.5 px-3.5 text-xs font-mono select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Title Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.title}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Price ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Category:
                    </label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
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
                      <option value="Imported Goods">Imported Goods</option>
                      <option value="A1 Mini Mods">A1 Mini Mods</option>
                      <option value="Hotends">Hotends</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Weight (g):
                    </label>
                    <input
                      type="number"
                      value={editingProduct.weightGrams}
                      onChange={(e) => setEditingProduct({ ...editingProduct, weightGrams: parseInt(e.target.value) || 0 })}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Print Duration:
                    </label>
                    <input
                      type="text"
                      value={editingProduct.printTime}
                      onChange={(e) => setEditingProduct({ ...editingProduct, printTime: e.target.value })}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Infill Pattern:
                    </label>
                    <input
                      type="text"
                      value={editingProduct.infill}
                      onChange={(e) => setEditingProduct({ ...editingProduct, infill: e.target.value })}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent"
                    />
                  </div>
                </div>

                {/* Materials Checker */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Assigned Materials:
                  </label>
                  <div className="flex flex-wrap gap-3 bg-bg-base border border-border-premium rounded-xl p-3.5">
                    {customMaterials.map((mat) => {
                      const isChecked = editingProduct.materials?.includes(mat) || false;
                      return (
                        <label key={mat} className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const currentMats = editingProduct.materials || [];
                              const nextMats = isChecked 
                                ? currentMats.filter(m => m !== mat) 
                                : [...currentMats, mat];
                              setEditingProduct({ ...editingProduct, materials: nextMats });
                            }}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                          <span>{mat}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newMaterialInput}
                      onChange={(e) => setNewMaterialInput(e.target.value)}
                      placeholder="Add dynamic future material..."
                      className="flex-1 bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 px-3 text-xs focus:border-accent"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!newMaterialInput.trim()) return;
                        if (!customMaterials.includes(newMaterialInput.trim())) {
                          setCustomMaterials(prev => [...prev, newMaterialInput.trim()]);
                        }
                        const currentMats = editingProduct.materials || [];
                        if (!currentMats.includes(newMaterialInput.trim())) {
                          setEditingProduct({
                            ...editingProduct,
                            materials: [...currentMats, newMaterialInput.trim()]
                          });
                        }
                        setNewMaterialInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-premium hover:border-gray-500 text-xs text-text-primary cursor-pointer"
                    >
                      + Add &amp; Assign
                    </button>
                  </div>
                </div>

                {/* Colors Checker */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Assigned Colors:
                  </label>
                  <div className="flex flex-wrap gap-3 bg-bg-base border border-border-premium rounded-xl p-3.5">
                    {customColors.map((col) => {
                      const isChecked = editingProduct.colors?.includes(col) || false;
                      return (
                        <label key={col} className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const currentCols = editingProduct.colors || [];
                              const nextCols = isChecked 
                                ? currentCols.filter(c => c !== col) 
                                : [...currentCols, col];
                              setEditingProduct({ ...editingProduct, colors: nextCols });
                            }}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                          <span>{col}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newColorInput}
                      onChange={(e) => setNewColorInput(e.target.value)}
                      placeholder="Add dynamic color option..."
                      className="flex-1 bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 px-3 text-xs focus:border-accent"
                    />
                    <button 
                      type="button" 
                      onClick={() => {
                        if (!newColorInput.trim()) return;
                        if (!customColors.includes(newColorInput.trim())) {
                          setCustomColors(prev => [...prev, newColorInput.trim()]);
                        }
                        const currentCols = editingProduct.colors || [];
                        if (!currentCols.includes(newColorInput.trim())) {
                          setEditingProduct({
                            ...editingProduct,
                            colors: [...currentCols, newColorInput.trim()]
                          });
                        }
                        setNewColorInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-premium hover:border-gray-500 text-xs text-text-primary cursor-pointer"
                    >
                      + Add &amp; Assign
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                    Product Tags (comma-separated):
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(editingProduct.tags) ? editingProduct.tags.join(', ') : ''}
                    onChange={(e) => setEditingProduct({ 
                      ...editingProduct, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                    })}
                    placeholder="e.g. flexi, toy, articulated"
                    className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3.5 text-xs focus:border-accent font-mono mb-4"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                    Persuasive Model Description:
                  </label>
                  <textarea
                    rows={4}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent resize-none font-sans"
                  />
                </div>
              </div>

              {/* Right Image Organizer */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <span className="block text-xs font-mono text-text-secondary uppercase tracking-widest">
                    Manage &amp; Organize Images:
                  </span>

                  {/* Drop area */}
                  <div
                    onClick={() => triggerImageUpload(true)}
                    className="border-2 border-dashed border-border-premium bg-bg-surface/30 rounded-2xl py-8 px-4 text-center select-none cursor-pointer hover:border-gray-700 transition"
                  >
                    {uploadProgress ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent mx-auto" />
                    ) : (
                      <div className="text-[11px] text-text-secondary">
                        <Upload className="w-5 h-5 mx-auto text-accent mb-1.5" />
                        <span>Click to upload new image to this product</span>
                      </div>
                    )}
                  </div>

                  {/* Gallery List */}
                  {editingProduct.images.length === 0 ? (
                    <div className="text-center py-6 text-text-muted text-xs border border-dashed border-border-premium rounded-xl">
                      No images assigned.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {editingProduct.images.map((img, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-bg-base border border-border-premium p-2 rounded-xl text-xs gap-3">
                          <img src={img} alt="Product spec" className="w-10 h-10 rounded object-cover shrink-0" />
                          <span className="truncate flex-1 font-mono text-[10px] text-text-secondary">{img.split('/').pop()}</span>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveEditImage(idx, 'left')}
                              className="p-1 rounded hover:bg-bg-elevated text-text-secondary disabled:opacity-20 cursor-pointer"
                              title="Move Main/Left"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === editingProduct.images.length - 1}
                              onClick={() => handleMoveEditImage(idx, 'right')}
                              className="p-1 rounded hover:bg-bg-elevated text-text-secondary disabled:opacity-20 cursor-pointer"
                              title="Move Down/Right"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditImage(idx)}
                              className="p-1 rounded hover:bg-red-950/20 text-red-400 cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={editImageInput}
                      onChange={(e) => setEditImageInput(e.target.value)}
                      placeholder="Add image URL directly..."
                      className="flex-1 bg-bg-base text-text-secondary border border-border-premium rounded-lg py-1.5 px-3 text-xs font-mono"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddEditImage}
                      className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-premium text-xs text-text-primary cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                <div className="flex space-x-4 pt-6 border-t border-border-premium">
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-3 border border-border-premium text-text-secondary rounded-xl font-bold text-xs hover:bg-bg-elevated transition cursor-pointer text-center"
                  >
                    Cancel Changes
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-grow-2 py-3 bg-accent-secondary hover:bg-accent text-white rounded-xl font-bold text-xs transition cursor-pointer text-center shadow"
                  >
                    Save Product Specifications
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- ACTIVE INVENTORY CATALOG TAB TABLE --- */}
        {activeSubTab === 'inventory' && !editingProduct && (
          <div id="stock-list-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 overflow-hidden shadow-2xl space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4">
              <div className="text-left font-mono">
                <h3 className="font-display font-extrabold text-base text-text-primary uppercase tracking-wide">STOCK REGISTER BOOK</h3>
                <p className="text-[10px] text-text-secondary mt-1">TOTAL RECORD COUNT: <span className="text-accent font-bold">{products.length}</span> ACTIVE ITEMS ({selectedProductIds.length} SELECTED)</p>
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

            {/* --- BULK EDIT WORKSTATION PANEL --- */}
            {selectedProductIds.length > 0 && (
              <div className="bg-bg-base border-2 border-accent/20 rounded-2xl p-4.5 space-y-4 text-xs animate-slide-down">
                <div className="flex items-center justify-between border-b border-border-premium pb-2.5">
                  <span className="text-xs font-mono text-accent font-bold uppercase tracking-widest flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                    <span>Bulk Editing Workstation // {selectedProductIds.length} Products Chosen</span>
                  </span>
                  <button 
                    onClick={() => setSelectedProductIds([])}
                    className="p-1 rounded hover:bg-bg-elevated text-text-secondary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Pricing adjustment */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                      Adjust Product Pricing:
                    </label>
                    <div className="flex gap-2">
                      <select 
                        value={bulkPriceAction}
                        onChange={(e) => setBulkPriceAction(e.target.value as any)}
                        className="bg-bg-surface text-text-primary border border-border-premium rounded-lg p-1.5 text-xs focus:border-accent"
                      >
                        <option value="flat">Set Flat Price ($)</option>
                        <option value="percent_increase">Increase by %</option>
                        <option value="percent_decrease">Decrease by %</option>
                      </select>
                      <input 
                        type="number"
                        step="0.01"
                        value={bulkPriceValue}
                        onChange={(e) => setBulkPriceValue(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-20 bg-bg-surface text-text-primary border border-border-premium rounded-lg p-1.5 text-xs text-center font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Materials addition/subtraction */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                      Bulk Materials Update:
                    </label>
                    <div className="space-y-2 max-h-24 overflow-y-auto bg-bg-surface border border-border-premium p-2 rounded-lg scrollbar-thin">
                      {customMaterials.map((mat) => {
                        const isAdd = bulkMaterialsToAdd.includes(mat);
                        const isRemove = bulkMaterialsToRemove.includes(mat);
                        return (
                          <div key={mat} className="flex items-center justify-between text-[11px] text-text-secondary py-0.5">
                            <span>{mat}</span>
                            <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => toggleBulkMaterial(mat, 'add')}
                                className={`px-1 rounded text-[9px] font-mono ${isAdd ? 'bg-green-600 text-white' : 'bg-bg-elevated hover:bg-green-950/20'}`}
                              >
                                +Add
                              </button>
                              <button 
                                onClick={() => toggleBulkMaterial(mat, 'remove')}
                                className={`px-1 rounded text-[9px] font-mono ${isRemove ? 'bg-red-600 text-white' : 'bg-bg-elevated hover:bg-red-950/20'}`}
                              >
                                -Del
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors addition/subtraction */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                      Bulk Colors Update:
                    </label>
                    <div className="space-y-2 max-h-24 overflow-y-auto bg-bg-surface border border-border-premium p-2 rounded-lg scrollbar-thin">
                      {customColors.map((col) => {
                        const isAdd = bulkColorsToAdd.includes(col);
                        const isRemove = bulkColorsToRemove.includes(col);
                        return (
                          <div key={col} className="flex items-center justify-between text-[11px] text-text-secondary py-0.5">
                            <span>{col}</span>
                            <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => toggleBulkColor(col, 'add')}
                                className={`px-1 rounded text-[9px] font-mono ${isAdd ? 'bg-green-600 text-white' : 'bg-bg-elevated hover:bg-green-950/20'}`}
                              >
                                +Add
                              </button>
                              <button 
                                onClick={() => toggleBulkColor(col, 'remove')}
                                className={`px-1 rounded text-[9px] font-mono ${isRemove ? 'bg-red-600 text-white' : 'bg-bg-elevated hover:bg-red-950/20'}`}
                              >
                                -Del
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border-premium/50">
                  {/* Descriptions */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                      Bulk Description Edit:
                    </label>
                    <div className="flex gap-2 mb-1.5">
                      {['none', 'overwrite', 'prepend', 'append'].map((act) => (
                        <button
                          key={act}
                          onClick={() => setBulkDescriptionAction(act as any)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${bulkDescriptionAction === act ? 'bg-accent/15 border-accent text-accent' : 'bg-bg-surface border-border-premium text-text-secondary'}`}
                        >
                          {act.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {bulkDescriptionAction !== 'none' && (
                      <textarea
                        value={bulkDescriptionValue}
                        onChange={(e) => setBulkDescriptionValue(e.target.value)}
                        placeholder="Type text parameter here..."
                        className="w-full bg-bg-surface text-text-primary border border-border-premium rounded-xl p-2 text-xs"
                        rows={2}
                      />
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col justify-end space-y-2 md:items-end">
                    <div className="flex space-x-2.5">
                      <button
                        onClick={handleBulkDelete}
                        className="px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-400 hover:text-white transition font-bold"
                      >
                        Delete Selected
                      </button>
                      <button
                        onClick={handleApplyBulkEdits}
                        className="px-6 py-2.5 rounded-xl bg-accent-secondary hover:bg-accent text-white transition font-bold"
                      >
                        Apply Bulk Updates
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Catalog list table */}
            <div className="overflow-x-auto border border-border-premium rounded-xl bg-bg-base scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10.5px]">
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={products.length > 0 && selectedProductIds.length === products.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                      />
                    </th>
                    <th className="p-4">SKU / ID</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Specification</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-premium text-text-secondary">
                  {products.map((item) => {
                    const isChecked = selectedProductIds.includes(item.id);
                    return (
                      <tr key={item.id} className={`hover:bg-bg-elevated/40 transition-colors ${isChecked ? 'bg-accent/5' : ''}`}>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectProduct(item.id)}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                        </td>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 rounded bg-bg-surface hover:bg-bg-elevated border border-border-premium text-text-secondary hover:text-text-primary transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-del-stock-${item.id}`}
                              onClick={() => onDeleteProduct(item.id)}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-transparent transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-text-secondary">
                        No product inventory loaded. Fill custom creation rows.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* --- MANAGE PRE-ORDERS SECTION --- */}
        {activeSubTab === 'preorders' && !editingProduct && (
          <div id="preorders-manager-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 overflow-hidden shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4">
              <div className="text-left font-mono">
                <h3 className="font-display font-extrabold text-base text-text-primary uppercase tracking-wide">PRE-ORDERS MANAGEMENT REGISTER</h3>
                <p className="text-[10px] text-text-secondary mt-1">
                  TOTAL PRE-ORDERS: <span className="text-accent font-bold">{products.filter(p => p.isPreOrder).length}</span> • Grab handles or edit cards below to reorder visually.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPreorderId('new-preorder');
                  setPreorderTitle('');
                  setPreorderCategory('Premium Hardware');
                  setPreorderPrice(19.99);
                  setPreorderDescription('');
                  setPreorderDimensions('120 x 120 x 140 mm');
                  setPreorderWeightGrams(100);
                  setPreorderOriginalCountry('Germany');
                  setPreorderEstimatedArrival('Arriving June 26 via Air Cargo');
                  setPreorderDepositPercentage(30);
                  setPreorderImages(['https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=800']);
                  setPreorderImageUrlInput('');
                }}
                className="px-3.5 py-2 rounded-xl bg-accent-secondary hover:bg-accent text-white transition flex items-center space-x-2 text-xs font-semibold cursor-pointer shadow-sm"
              >
                <PlusCircle className="w-4 h-4 text-accent" />
                <span>Add Pre-Order Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editingPreorderId === 'new-preorder' && (
                <form
                  onSubmit={handleCreatePreorder}
                  className="rounded-2xl bg-bg-surface border-2 border-accent p-5 space-y-4 shadow-xl text-xs text-left animate-fade-in"
                >
                  <div className="flex justify-between items-center border-b border-border-premium pb-2">
                    <span className="font-mono text-[10px] text-accent font-bold">CREATE NEW PRE-ORDER</span>
                    <button 
                      type="button" 
                      onClick={() => setEditingPreorderId(null)}
                      className="text-text-secondary hover:text-text-primary p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-text-secondary uppercase">Product Title</label>
                      <input 
                        type="text" 
                        required
                        value={preorderTitle}
                        onChange={(e) => setPreorderTitle(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-text-secondary uppercase">Category</label>
                      <select
                        value={preorderCategory}
                        onChange={(e) => setPreorderCategory(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="Premium Hardware">Premium Hardware</option>
                        <option value="Exotic Filaments">Exotic Filaments</option>
                        <option value="A1 Mini Mods">A1 Mini Mods</option>
                        <option value="Hotends">Hotends</option>
                        <option value="Imported Goods">Imported Goods</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-text-secondary uppercase">Price (USD)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        required
                        value={preorderPrice}
                        onChange={(e) => setPreorderPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-text-secondary uppercase">Deposit (%)</label>
                      <input 
                        type="number" 
                        min="1"
                        max="100"
                        required
                        value={preorderDepositPercentage}
                        onChange={(e) => setPreorderDepositPercentage(parseInt(e.target.value) || 30)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono text-text-secondary uppercase">Description</label>
                    <textarea
                      rows={2.5}
                      required
                      value={preorderDescription}
                      onChange={(e) => setPreorderDescription(e.target.value)}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 focus:outline-none resize-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-text-secondary uppercase">Scale Dimensions</label>
                      <input 
                        type="text" 
                        value={preorderDimensions}
                        onChange={(e) => setPreorderDimensions(e.target.value)}
                        placeholder="e.g. 100 x 100 mm"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-text-secondary uppercase">Mass Weight (g)</label>
                      <input 
                        type="number" 
                        value={preorderWeightGrams}
                        onChange={(e) => setPreorderWeightGrams(parseInt(e.target.value) || 0)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                    <div className="space-y-1">
                      <label className="block text-[9px] text-text-secondary uppercase">Import Origin</label>
                      <input 
                        type="text" 
                        value={preorderOriginalCountry}
                        onChange={(e) => setPreorderOriginalCountry(e.target.value)}
                        placeholder="e.g. Japan"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] text-text-secondary uppercase">ETA Arrival</label>
                      <input 
                        type="text" 
                        value={preorderEstimatedArrival}
                        onChange={(e) => setPreorderEstimatedArrival(e.target.value)}
                        placeholder="e.g. July 20"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono text-text-secondary uppercase">Manage Images ({preorderImages.length})</label>
                    {preorderImages.length > 0 && (
                      <div className="flex flex-col space-y-1.5 max-h-32 overflow-y-auto bg-bg-base p-2 border border-border-premium rounded-lg scrollbar-thin">
                        {preorderImages.map((img, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1 bg-bg-surface border border-border-premium rounded">
                            <img src={img} alt="" className="w-7 h-7 rounded object-cover" />
                            <span className="truncate flex-grow font-mono text-[9px] text-text-secondary">{img.split('/').pop() || img}</span>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMovePreorderImage(idx, 'left')}
                                className="p-0.5 hover:bg-bg-elevated rounded disabled:opacity-20 text-text-secondary"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === preorderImages.length - 1}
                                onClick={() => handleMovePreorderImage(idx, 'right')}
                                className="p-0.5 hover:bg-bg-elevated rounded disabled:opacity-20 text-text-secondary"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePreorderImage(idx)}
                                className="p-0.5 hover:bg-red-500/10 text-red-400 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add image URL directly..."
                        value={preorderImageUrlInput}
                        onChange={(e) => setPreorderImageUrlInput(e.target.value)}
                        className="flex-1 bg-bg-base border border-border-premium rounded-lg p-2 text-[10px] font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddPreorderImageUrl}
                        className="px-2.5 bg-bg-elevated border border-border-premium rounded-lg hover:border-gray-500 font-bold text-text-primary text-[10px] uppercase font-mono"
                      >
                        Add
                      </button>
                    </div>

                    <input 
                      type="file" 
                      ref={preorderFileInputRef} 
                      onChange={handlePreorderImageUpload} 
                      className="hidden" 
                      accept="image/*" 
                    />
                    <button
                      type="button"
                      disabled={isPreorderUploading}
                      onClick={() => preorderFileInputRef.current?.click()}
                      className="w-full py-2 bg-bg-elevated hover:bg-bg-surface border border-dashed border-border-premium rounded-lg text-text-secondary hover:border-accent text-center transition flex items-center justify-center space-x-1.5"
                    >
                      {isPreorderUploading ? (
                        <span className="font-mono text-[9px] animate-pulse">Uploading file...</span>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span className="font-mono text-[9px] uppercase">Upload local photo</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex space-x-3 pt-3 border-t border-border-premium/50">
                    <button
                      type="button"
                      onClick={() => setEditingPreorderId(null)}
                      className="flex-1 py-2 bg-bg-base hover:bg-bg-elevated border border-border-premium text-text-secondary text-[11px] font-bold rounded-xl cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-accent-secondary hover:bg-accent text-white font-bold text-[11px] rounded-xl cursor-pointer text-center flex items-center justify-center space-x-1.5 shadow"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Create Slot</span>
                    </button>
                  </div>
                </form>
              )}

              {products.filter(p => p.isPreOrder).map((p) => {
                const depositDecimal = (p.depositPercentage || 50) / 100;
                const depositPrice = p.price * depositDecimal;
                const isEditing = editingPreorderId === p.id;
                const isDragTarget = preorderDragOverId === p.id;

                if (isEditing) {
                  return (
                    <form
                      key={p.id}
                      onSubmit={handleSavePreorderEdit}
                      className="rounded-2xl bg-bg-surface border-2 border-accent p-5 space-y-4 shadow-xl text-xs text-left animate-fade-in"
                    >
                      <div className="flex justify-between items-center border-b border-border-premium pb-2">
                        <span className="font-mono text-[10px] text-accent font-bold">EDITING PRE-ORDER: {p.id}</span>
                        <button 
                          type="button" 
                          onClick={() => setEditingPreorderId(null)}
                          className="text-text-secondary hover:text-text-primary p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase">Product Title</label>
                          <input 
                            type="text" 
                            required
                            value={preorderTitle}
                            onChange={(e) => setPreorderTitle(e.target.value)}
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase">Category</label>
                          <select
                            value={preorderCategory}
                            onChange={(e) => setPreorderCategory(e.target.value)}
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 focus:outline-none focus:border-accent cursor-pointer"
                          >
                            <option value="Premium Hardware">Premium Hardware</option>
                            <option value="Exotic Filaments">Exotic Filaments</option>
                            <option value="A1 Mini Mods">A1 Mini Mods</option>
                            <option value="Hotends">Hotends</option>
                            <option value="Imported Goods">Imported Goods</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase">Price (USD)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            required
                            value={preorderPrice}
                            onChange={(e) => setPreorderPrice(parseFloat(e.target.value) || 0)}
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase">Deposit (%)</label>
                          <input 
                            type="number" 
                            min="1"
                            max="100"
                            required
                            value={preorderDepositPercentage}
                            onChange={(e) => setPreorderDepositPercentage(parseInt(e.target.value) || 30)}
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono text-text-secondary uppercase">Description</label>
                        <textarea
                          rows={2.5}
                          required
                          value={preorderDescription}
                          onChange={(e) => setPreorderDescription(e.target.value)}
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 focus:outline-none resize-none font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div className="space-y-1">
                          <label className="block text-[9px] text-text-secondary uppercase">Scale Dimensions</label>
                          <input 
                            type="text" 
                            value={preorderDimensions}
                            onChange={(e) => setPreorderDimensions(e.target.value)}
                            placeholder="e.g. 100 x 100 mm"
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] text-text-secondary uppercase">Mass Weight (g)</label>
                          <input 
                            type="number" 
                            value={preorderWeightGrams}
                            onChange={(e) => setPreorderWeightGrams(parseInt(e.target.value) || 0)}
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-mono">
                        <div className="space-y-1">
                          <label className="block text-[9px] text-text-secondary uppercase">Import Origin</label>
                          <input 
                            type="text" 
                            value={preorderOriginalCountry}
                            onChange={(e) => setPreorderOriginalCountry(e.target.value)}
                            placeholder="e.g. Japan"
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[9px] text-text-secondary uppercase">ETA Arrival</label>
                          <input 
                            type="text" 
                            value={preorderEstimatedArrival}
                            onChange={(e) => setPreorderEstimatedArrival(e.target.value)}
                            placeholder="e.g. July 20"
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2"
                          />
                        </div>
                      </div>

                      {/* Image Spec List */}
                      <div className="space-y-2">
                        <label className="block text-[9px] font-mono text-text-secondary uppercase">Manage Images ({preorderImages.length})</label>
                        {preorderImages.length > 0 && (
                          <div className="flex flex-col space-y-1.5 max-h-32 overflow-y-auto bg-bg-base p-2 border border-border-premium rounded-lg scrollbar-thin">
                            {preorderImages.map((img, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2 p-1 bg-bg-surface border border-border-premium rounded">
                                <img src={img} alt="" className="w-7 h-7 rounded object-cover" />
                                <span className="truncate flex-grow font-mono text-[9px] text-text-secondary">{img.split('/').pop() || img}</span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMovePreorderImage(idx, 'left')}
                                    className="p-0.5 hover:bg-bg-elevated rounded disabled:opacity-20 text-text-secondary"
                                  >
                                    <ArrowLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === preorderImages.length - 1}
                                    onClick={() => handleMovePreorderImage(idx, 'right')}
                                    className="p-0.5 hover:bg-bg-elevated rounded disabled:opacity-20 text-text-secondary"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePreorderImage(idx)}
                                    className="p-0.5 hover:bg-red-500/10 text-red-400 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add image URL directly..."
                            value={preorderImageUrlInput}
                            onChange={(e) => setPreorderImageUrlInput(e.target.value)}
                            className="flex-1 bg-bg-base border border-border-premium rounded-lg p-2 text-[10px] font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddPreorderImageUrl}
                            className="px-2.5 bg-bg-elevated border border-border-premium rounded-lg hover:border-gray-500 font-bold text-text-primary text-[10px] uppercase font-mono"
                          >
                            Add
                          </button>
                        </div>

                        <input 
                          type="file" 
                          ref={preorderFileInputRef} 
                          onChange={handlePreorderImageUpload} 
                          className="hidden" 
                          accept="image/*" 
                        />
                        <button
                          type="button"
                          disabled={isPreorderUploading}
                          onClick={() => preorderFileInputRef.current?.click()}
                          className="w-full py-2 bg-bg-elevated hover:bg-bg-surface border border-dashed border-border-premium rounded-lg text-text-secondary hover:border-accent text-center transition flex items-center justify-center space-x-1.5"
                        >
                          {isPreorderUploading ? (
                            <span className="font-mono text-[9px] animate-pulse">Uploading file...</span>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" />
                              <span className="font-mono text-[9px] uppercase">Upload local photo</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex space-x-3 pt-3 border-t border-border-premium/50">
                        <button
                          type="button"
                          onClick={() => setEditingPreorderId(null)}
                          className="flex-1 py-2 bg-bg-base hover:bg-bg-elevated border border-border-premium text-text-secondary text-[11px] font-bold rounded-xl cursor-pointer text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 bg-accent-secondary hover:bg-accent text-white font-bold text-[11px] rounded-xl cursor-pointer text-center flex items-center justify-center space-x-1.5 shadow"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Specs</span>
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    id={`preorder-admin-card-${p.id}`}
                    key={p.id}
                    draggable
                    onDragStart={(e) => handlePreorderDragStart(e, p.id)}
                    onDragOver={(e) => handlePreorderDragOver(e, p.id)}
                    onDragEnter={(e) => handlePreorderDragEnter(e, p.id)}
                    onDragLeave={(e) => handlePreorderDragLeave(e, p.id)}
                    onDrop={(e) => handlePreorderDrop(e, p.id)}
                    className={`rounded-2xl bg-bg-surface/75 border hover:shadow-2xl hover:shadow-accent/5 transition duration-300 overflow-hidden flex flex-col justify-between relative text-left ${
                      isDragTarget ? 'border-dashed border-accent ring-2 ring-accent/20 bg-accent/5 scale-102' : 'border-border-premium hover:border-accent'
                    } ${draggedPreorderId === p.id ? 'opacity-40 border-accent/40' : ''}`}
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

                      {/* Admin Controls */}
                      <div className="absolute top-3 right-3 flex items-center space-x-2">
                        <button
                          onClick={() => startEditingPreorder(p)}
                          className="p-1.5 rounded bg-bg-base/90 text-accent border border-accent/20 hover:border-accent transition cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-accent" />
                        </button>
                        <div
                          className="p-1.5 rounded bg-bg-base/90 text-text-secondary border border-border-premium cursor-grab active:cursor-grabbing"
                          title="Drag to Reorder"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                      </div>

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
                        <h3 className="font-display font-black text-lg text-text-primary leading-snug line-clamp-1">
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
                          <div className="flex items-center text-[9px] font-mono text-text-muted tracking-wider">
                            <span>TOTAL VALUE: ${p.price.toFixed(2)}</span>
                          </div>
                          <div className="flex items-end space-x-1 mt-0.5">
                            <span className="text-xl font-mono font-extrabold text-accent">${depositPrice.toFixed(2)}</span>
                            <span className="text-[10px] font-mono text-text-secondary mb-0.5">({p.depositPercentage || 50}% DEPOSIT)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'orders' && !editingProduct && (
          <div id="orders-manager-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 overflow-hidden shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4">
              <div className="text-left font-mono">
                <h3 className="font-display font-extrabold text-base text-text-primary uppercase tracking-wide">ORDERS &amp; PAYMENTS REGISTER</h3>
                <p className="text-[10px] text-text-secondary mt-1">
                  TOTAL ORDERS: <span className="text-accent font-bold">{orders.length}</span> • AWAITING VERIFICATION: <span className="text-amber-400 font-bold">{orders.filter(o => o.status === 'Paid').length}</span>
                </p>
              </div>
              <button
                onClick={fetchOrders}
                disabled={isOrdersLoading}
                className="px-3.5 py-2 rounded-xl bg-bg-surface border border-border-premium hover:border-gray-500 text-text-primary hover:bg-bg-elevated transition flex items-center space-x-2 text-xs font-semibold cursor-pointer shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-accent ${isOrdersLoading ? 'animate-spin' : ''}`} />
                <span>Reload Orders</span>
              </button>
            </div>

            {isOrdersLoading && orders.length === 0 ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-2" />
                <p className="text-xs text-text-secondary font-mono">Loading orders from server...</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-border-premium rounded-xl bg-bg-base scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10.5px]">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Items Summary</th>
                      <th className="p-4">Total Price / Mass</th>
                      <th className="p-4">Payment Info</th>
                      <th className="p-4">Receipt Screenshot</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-premium text-text-secondary">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-bg-elevated/40 transition-colors">
                        <td className="p-4 font-bold text-accent align-top">{order.id}</td>
                        <td className="p-4 align-top font-sans text-xs">
                          <div className="font-bold text-text-primary">{order.shippingInfo.name}</div>
                          <div className="text-[11px] text-text-secondary font-mono mt-0.5">{order.shippingInfo.phone}</div>
                          <div className="text-[11px] text-text-secondary max-w-xs truncate mt-0.5" title={order.shippingInfo.address}>
                            {order.shippingInfo.address}
                          </div>
                        </td>
                        <td className="p-4 align-top font-sans text-[11px]">
                          <ul className="list-disc pl-4 space-y-0.5 text-left">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                <span className="font-semibold text-text-primary">{item.product.title}</span> (x{item.quantity})
                                <div className="text-[10px] text-text-secondary font-mono">
                                  {item.selectedColor} / {item.selectedMaterial}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 align-top">
                          <div className="text-accent font-bold text-sm">${order.totalCost.toFixed(2)}</div>
                          <div className="text-[10px] text-text-muted mt-0.5">{order.totalWeight} grams</div>
                        </td>
                        <td className="p-4 align-top">
                          {order.payment.method ? (
                            <>
                              <div className="font-bold text-text-primary">{order.payment.method}</div>
                              <div className="text-[11px] text-accent font-bold mt-0.5">{order.payment.trxId}</div>
                              {order.payment.submittedAt && (
                                <div className="text-[9px] text-text-muted mt-0.5">
                                  {new Date(order.payment.submittedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-text-muted italic">No Payment</span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          {order.payment.screenshotUrl ? (
                            <div 
                              onClick={() => setLightboxUrl(order.payment.screenshotUrl)}
                              className="w-14 h-14 bg-bg-surface border border-border-premium rounded-lg overflow-hidden cursor-pointer hover:border-accent transition group relative"
                            >
                              <img src={order.payment.screenshotUrl} alt="Receipt thumbnail" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px] text-white font-bold text-center">
                                View Proof
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-muted italic">No Image</span>
                          )}
                        </td>
                        <td className="p-4 align-top">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            order.status === 'Pending' ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                            : order.status === 'Paid' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                            : order.status === 'Processing' ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 animate-pulse'
                            : order.status === 'Shipped' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                            : 'bg-green-500/10 border border-green-500/20 text-green-400'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col space-y-1.5 w-28">
                            {order.status === 'Paid' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'Processing')}
                                className="px-2 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500 hover:text-bg-base text-green-400 font-bold text-[10px] uppercase transition cursor-pointer text-center"
                              >
                                Verify Payment
                              </button>
                            )}
                            {order.status === 'Processing' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                                className="px-2 py-1.5 rounded-lg bg-blue-550/15 border border-blue-500/35 hover:bg-blue-500 hover:text-white text-blue-400 font-bold text-[10px] uppercase transition cursor-pointer text-center"
                              >
                                Dispatch Ship
                              </button>
                            )}
                            {order.status === 'Shipped' && (
                              <button
                                onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                                className="px-2 py-1.5 rounded-lg bg-purple-550/15 border border-purple-500/35 hover:bg-purple-550 hover:text-white text-purple-400 font-bold text-[10px] uppercase transition cursor-pointer text-center"
                              >
                                Complete Order
                              </button>
                            )}
                            {order.status !== 'Completed' && (
                              <button
                                onClick={() => {
                                  if (confirm(`Cancel and mark order ${order.id} as Pending?`)) {
                                    handleUpdateOrderStatus(order.id, 'Pending');
                                  }
                                }}
                                className="px-2 py-1 text-text-secondary hover:text-red-400 font-mono text-[9px] text-center"
                              >
                                [Mark Pending]
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-text-secondary">
                          No order database loaded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-bg-base border border-border-premium rounded-2xl p-2 overflow-hidden flex flex-col items-center">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer z-10 font-bold"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={lightboxUrl} 
              alt="Payment proof screenshot" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-center text-xs font-mono text-text-secondary mt-3 uppercase tracking-wider">
              Verification Proof Receipt Screenshot
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
