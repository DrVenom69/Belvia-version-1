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
  Save,
  Star,
  Tag,
  Ticket,
  Settings,
  MessageSquare
} from 'lucide-react';
import { Product, Order, Coupon, Filament, Accessory } from '../types';
import { formatPrice } from '../utils/format';
import { calculateFloorPrice } from '../utils/pricingEngine';

// Helper: returns headers with the admin API key from localStorage
function getAdminHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const key = localStorage.getItem('belvia_admin_key');
  const headers: Record<string, string> = { ...extraHeaders };
  if (key) headers['x-admin-key'] = key;
  return headers;
}

interface SellerHubProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onImportBulkProducts: (newProducts: Product[]) => void;
  onResetCatalog: () => void;
  onUpdateProducts: (products: Product[]) => void;
  categories: any[];
  onRefreshCategories: () => void;
}

export default function SellerHub({ 
  products, 
  onAddProduct, 
  onDeleteProduct, 
  onImportBulkProducts, 
  onResetCatalog,
  onUpdateProducts,
  categories,
  onRefreshCategories
}: SellerHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'bulk' | 'manual' | 'inventory' | 'orders' | 'preorders' | 'carousel' | 'coupons' | 'festivals' | 'filaments' | 'pricehealth' | 'settings' | 'support-logs'>('ai');

  // --- EDIT MODE STATE ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditCustomCategoryInput, setShowEditCustomCategoryInput] = useState<boolean>(false);
  const [editCustomCategoryName, setEditCustomCategoryName] = useState<string>('');
  const [editImageInput, setEditImageInput] = useState<string>('');

  const editRecipe = editingProduct?.material_recipe || {
    filament_name: '',
    filament_grams: 0,
    print_hours: 0,
    has_uv_finish: false,
    resin_grams: 2,
    accessories: [],
    target_margin: null
  };

  // --- FILAMENTS & ACCESSORIES STATE ---
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isFilamentsLoading, setIsFilamentsLoading] = useState(false);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [isAccessoriesLoading, setIsAccessoriesLoading] = useState(false);

  // Spool Form State
  const [spoolName, setSpoolName] = useState('');
  const [spoolType, setSpoolType] = useState('PLA');
  const [spoolColor, setSpoolColor] = useState('');
  const [spoolBrand, setSpoolBrand] = useState('');
  const [spoolWeight, setSpoolWeight] = useState('1000');
  const [spoolPrice, setSpoolPrice] = useState('');
  const [spoolNotes, setSpoolNotes] = useState('');
  const [spoolError, setSpoolError] = useState('');
  const [spoolSuccess, setSpoolSuccess] = useState('');
  const [isCreatingSpool, setIsCreatingSpool] = useState(false);

  // Accessory Form State
  const [accFormName, setAccFormName] = useState('');
  const [accFormUnit, setAccFormUnit] = useState('piece');
  const [accFormCost, setAccFormCost] = useState('');
  const [accFormStock, setAccFormStock] = useState('100');
  const [accFormError, setAccFormError] = useState('');
  const [accFormSuccess, setAccFormSuccess] = useState('');
  const [isSavingAccessory, setIsSavingAccessory] = useState(false);

  // Settings State
  const [hubSettings, setHubSettings] = useState<Record<string, string>>({});
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Product Recipe Costing State (for Add Product Form)
  const [newRecipeFilamentName, setNewRecipeFilamentName] = useState('');
  const [newRecipeFilamentGrams, setNewRecipeFilamentGrams] = useState('');
  const [newRecipeResinGrams, setNewRecipeResinGrams] = useState('2');
  const [newRecipeHasUvFinish, setNewRecipeHasUvFinish] = useState(false);
  const [newRecipeAccessories, setNewRecipeAccessories] = useState<string[]>([]);
  const [newRecipePrintHours, setNewRecipePrintHours] = useState('');
  const [newRecipeTargetMargin, setNewRecipeTargetMargin] = useState<string>(''); // empty = fallback to settings
  const [newResinEnabled, setNewResinEnabled] = useState<boolean>(false);
  const [newResinPrice, setNewResinPrice] = useState<string>('');


  // --- CHAT SUPPORT LOGS STATE & HANDLERS ---
  const [unmatchedQuestions, setUnmatchedQuestions] = useState<any[]>([]);
  const [isUnmatchedLoading, setIsUnmatchedLoading] = useState(false);
  const [unmatchedError, setUnmatchedError] = useState('');
  const [unmatchedSuccess, setUnmatchedSuccess] = useState('');

  const fetchUnmatchedQuestions = async () => {
    setIsUnmatchedLoading(true);
    setUnmatchedError('');
    try {
      const res = await fetch('/api/admin/unmatched-questions', {
        headers: getAdminHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions)) {
          setUnmatchedQuestions(data.questions);
        } else {
          setUnmatchedError(data.error || 'Failed to fetch unmatched questions.');
        }
      } else {
        setUnmatchedError('Failed to fetch unmatched questions. Server returned status ' + res.status);
      }
    } catch (err: any) {
      console.error('Failed to fetch unmatched questions:', err);
      setUnmatchedError(err.message || 'Failed to fetch unmatched questions.');
    } finally {
      setIsUnmatchedLoading(false);
    }
  };

  const handleClearUnmatched = async () => {
    if (!confirm('Are you sure you want to clear all support chat logs? This action cannot be undone.')) {
      return;
    }
    setIsUnmatchedLoading(true);
    setUnmatchedError('');
    setUnmatchedSuccess('');
    try {
      const res = await fetch('/api/admin/unmatched-questions/clear', {
        method: 'POST',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUnmatchedQuestions([]);
          setUnmatchedSuccess('Support chat logs successfully cleared.');
          setTimeout(() => setUnmatchedSuccess(''), 3000);
        } else {
          setUnmatchedError(data.error || 'Failed to clear unmatched questions.');
        }
      } else {
        setUnmatchedError('Failed to clear unmatched questions. Server returned status ' + res.status);
      }
    } catch (err: any) {
      console.error('Failed to clear unmatched questions:', err);
      setUnmatchedError(err.message || 'Failed to clear unmatched questions.');
    } finally {
      setIsUnmatchedLoading(false);
    }
  };


  // --- ORDERS MANAGEMENT STATE & HANDLERS ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const res = await fetch('/api/get-orders', {
        headers: getAdminHeaders()
      });
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

  const fetchFilaments = async () => {
    setIsFilamentsLoading(true);
    try {
      const res = await fetch('/api/filaments');
      if (res.ok) {
        const data = await res.json();
        setFilaments(data.filaments || []);
      }
    } catch (err) {
      console.error('Failed to fetch filaments:', err);
    } finally {
      setIsFilamentsLoading(false);
    }
  };

  const fetchAccessories = async () => {
    setIsAccessoriesLoading(true);
    try {
      const res = await fetch('/api/accessories');
      if (res.ok) {
        const data = await res.json();
        setAccessories(data.accessories || []);
      }
    } catch (err) {
      console.error('Failed to fetch accessories:', err);
    } finally {
      setIsAccessoriesLoading(false);
    }
  };

  const fetchHubSettings = async () => {
    setIsSettingsLoading(true);
    try {
      const res = await fetch('/api/get-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setHubSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleCreateSpool = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpoolError('');
    setSpoolSuccess('');
    if (!spoolName.trim() || !spoolPrice) {
      setSpoolError('Spool name and purchase price are required.');
      return;
    }
    setIsCreatingSpool(true);
    try {
      const res = await fetch('/api/admin/filaments', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: spoolName.trim(),
          type: spoolType,
          color: spoolColor.trim() || null,
          brand: spoolBrand.trim() || null,
          spool_weight_grams: Number(spoolWeight),
          purchase_price_bdt: Number(spoolPrice),
          notes: spoolNotes.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create spool.');
      setSpoolSuccess(`Spool "${data.filament.name}" added successfully.`);
      setSpoolName('');
      setSpoolColor('');
      setSpoolBrand('');
      setSpoolPrice('');
      setSpoolNotes('');
      await fetchFilaments();
    } catch (err: any) {
      setSpoolError(err.message || 'Failed to create spool.');
    } finally {
      setIsCreatingSpool(false);
    }
  };

  const handleMarkSpoolEmpty = async (spoolId: string) => {
    try {
      const res = await fetch(`/api/admin/filaments/${spoolId}`, {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_empty: true })
      });
      if (res.ok) {
        setFilaments(prev => prev.map(s => s.id === spoolId ? { ...s, is_empty: true, grams_remaining: 0 } : s));
        alert("Spool marked as empty. Scoped products recalculated.");
      }
    } catch (err) {
      console.error('Failed to mark spool empty:', err);
    }
  };

  const handleDeleteSpool = async (spoolId: string) => {
    if (!confirm("Delete this spool permanently? This will trigger floor price recalculation.")) return;
    try {
      const res = await fetch(`/api/admin/filaments/${spoolId}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        setFilaments(prev => prev.filter(s => s.id !== spoolId));
        alert("Spool deleted successfully.");
      }
    } catch (err) {
      console.error('Failed to delete spool:', err);
    }
  };

  const handleSaveAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccFormError('');
    setAccFormSuccess('');
    if (!accFormName.trim() || !accFormCost) {
      setAccFormError('Accessory name and cost per unit are required.');
      return;
    }
    setIsSavingAccessory(true);
    try {
      const res = await fetch('/api/admin/accessories', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: accFormName.trim(),
          unit: accFormUnit,
          cost_per_unit_bdt: Number(accFormCost),
          stock_count: Number(accFormStock)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save accessory.');
      setAccFormSuccess(`Accessory "${data.accessory.name}" saved!`);
      setAccFormName('');
      setAccFormCost('');
      setAccFormStock('100');
      await fetchAccessories();
    } catch (err: any) {
      setAccFormError(err.message || 'Failed to save accessory.');
    } finally {
      setIsSavingAccessory(false);
    }
  };

  const handleSaveHubSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/save-settings', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(hubSettings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings.');
      setSettingsSuccess('Settings saved successfully!');
      // Sync settings globally by triggering a lightweight page reload or status update
      if (window.location) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'orders') {
      fetchOrders();
    }
    if (activeSubTab === 'coupons') {
      fetchCoupons();
    }
    if (activeSubTab === 'festivals') {
      fetchFestivals();
    }
    if (activeSubTab === 'filaments' || activeSubTab === 'pricehealth' || activeSubTab === 'manual' || editingProduct) {
      fetchFilaments();
      fetchAccessories();
    }
    if (activeSubTab === 'settings') {
      fetchHubSettings();
    }
    if (activeSubTab === 'support-logs') {
      fetchUnmatchedQuestions();
    }
  }, [activeSubTab, editingProduct]);

  // --- COUPON MANAGEMENT STATE & HANDLERS ---
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [couponFormCode, setCouponFormCode] = useState('');
  const [couponFormType, setCouponFormType] = useState<'percent' | 'flat'>('percent');
  const [couponFormValue, setCouponFormValue] = useState('');
  const [couponFormMaxUses, setCouponFormMaxUses] = useState('');
  const [couponFormValidUntil, setCouponFormValidUntil] = useState('');
  const [couponFormCreatedBy, setCouponFormCreatedBy] = useState('');
  const [couponFormError, setCouponFormError] = useState('');
  const [couponFormSuccess, setCouponFormSuccess] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const fetchCoupons = async () => {
    setIsCouponsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setIsCouponsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponFormError('');
    setCouponFormSuccess('');
    if (!couponFormCode.trim() || !couponFormValue) {
      setCouponFormError('Code and Value are required.');
      return;
    }
    setIsCreatingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          code: couponFormCode.trim().toUpperCase(),
          type: couponFormType,
          value: Number(couponFormValue),
          max_uses: couponFormMaxUses ? Number(couponFormMaxUses) : null,
          valid_until: couponFormValidUntil || null,
          created_by: couponFormCreatedBy.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create coupon.');
      setCouponFormSuccess(`Coupon "${data.coupon.code}" created!`);
      setCouponFormCode('');
      setCouponFormValue('');
      setCouponFormMaxUses('');
      setCouponFormValidUntil('');
      setCouponFormCreatedBy('');
      await fetchCoupons();
    } catch (err: any) {
      setCouponFormError(err.message || 'Failed to create coupon.');
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleToggleCouponActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_active: !coupon.is_active })
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
      }
    } catch (err) {
      console.error('Failed to toggle coupon:', err);
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== coupon.id));
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  // --- FESTIVAL DISCOUNT MANAGEMENT STATE & HANDLERS ---
  const [festivals, setFestivals] = useState<any[]>([]);
  const [isFestivalsLoading, setIsFestivalsLoading] = useState(false);
  const [festFormName, setFestFormName] = useState('');
  const [festFormPercent, setFestFormPercent] = useState('');
  const [festFormCategory, setFestFormCategory] = useState('');
  const [festFormStart, setFestFormStart] = useState('');
  const [festFormEnd, setFestFormEnd] = useState('');
  const [festFormError, setFestFormError] = useState('');
  const [festFormSuccess, setFestFormSuccess] = useState('');
  const [isCreatingFestival, setIsCreatingFestival] = useState(false);
  const [festEditId, setFestEditId] = useState<string | null>(null);

  const fetchFestivals = async () => {
    setIsFestivalsLoading(true);
    try {
      const res = await fetch('/api/admin/festival-discounts', { headers: getAdminHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFestivals(data.festivals || []);
      }
    } catch (err) {
      console.error('Failed to fetch festivals:', err);
    } finally {
      setIsFestivalsLoading(false);
    }
  };

  const handleCreateFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    setFestFormError('');
    setFestFormSuccess('');
    if (!festFormName.trim() || !festFormPercent || !festFormStart || !festFormEnd) {
      setFestFormError('Name, Percent, Start, and End are required.');
      return;
    }
    setIsCreatingFestival(true);
    try {
      const url = festEditId
        ? `/api/admin/festival-discounts/${festEditId}`
        : '/api/admin/festival-discounts';
      const method = festEditId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: festFormName.trim(),
          percent: Number(festFormPercent),
          category: festFormCategory.trim() || null,
          start_date: new Date(festFormStart).toISOString(),
          end_date: new Date(festFormEnd).toISOString(),
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed.');
      setFestFormSuccess(festEditId ? 'Festival updated!' : `Festival "${data.festival?.name || festFormName}" created!`);
      setFestFormName(''); setFestFormPercent(''); setFestFormCategory('');
      setFestFormStart(''); setFestFormEnd(''); setFestEditId(null);
      await fetchFestivals();
    } catch (err: any) {
      setFestFormError(err.message);
    } finally {
      setIsCreatingFestival(false);
    }
  };

  const handleToggleFestivalActive = async (fest: any) => {
    try {
      const res = await fetch(`/api/admin/festival-discounts/${fest.id}`, {
        method: 'PATCH',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ is_active: !fest.is_active })
      });
      if (res.ok) setFestivals(prev => prev.map(f => f.id === fest.id ? { ...f, is_active: !f.is_active } : f));
    } catch (err) { console.error(err); }
  };

  const handleDeleteFestival = async (fest: any) => {
    if (!confirm(`Delete "${fest.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/festival-discounts/${fest.id}`, {
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (res.ok) setFestivals(prev => prev.filter(f => f.id !== fest.id));
    } catch (err) { console.error(err); }
  };

  const handleEditFestival = (fest: any) => {
    setFestEditId(fest.id);
    setFestFormName(fest.name);
    setFestFormPercent(String(fest.percent));
    setFestFormCategory(fest.category || '');
    setFestFormStart(fest.start_date ? new Date(fest.start_date).toISOString().slice(0,16) : '');
    setFestFormEnd(fest.end_date ? new Date(fest.end_date).toISOString().slice(0,16) : '');
    setFestFormError('');
    setFestFormSuccess('');
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: 'Pending' | 'Paid' | 'Processing' | 'Shipped' | 'Completed') => {
    try {
      const res = await fetch('/api/update-order-status', {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderId, status: nextStatus })
      });
      if (res.ok) {
        const updated = orders.map(o => {
          if (o.id === orderId) {
            return { ...o, status: nextStatus };
          }
          return o;
        });
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
  const [draggedCarouselIdx, setDraggedCarouselIdx] = useState<number | null>(null);

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

  // Carousel DND & Remix Handlers
  const handleCarouselDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCarouselIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCarouselDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleCarouselDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedCarouselIdx === null || draggedCarouselIdx === targetIndex) return;

    // Get currently featured products
    const featuredList = products
      .filter(p => p.featured_carousel === true)
      .sort((a, b) => {
        const orderA = a.carousel_order !== undefined ? a.carousel_order : 999999;
        const orderB = b.carousel_order !== undefined ? b.carousel_order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return timeB - timeA;
      });

    const reordered = [...featuredList];
    const [draggedItem] = reordered.splice(draggedCarouselIdx, 1);
    reordered.splice(targetIndex, 0, draggedItem);

    // Map each item in the reordered list to its new index
    const orderMap = new Map<string, number>();
    reordered.forEach((item, idx) => {
      orderMap.set(item.id, idx);
    });

    const nextProducts = products.map(p => {
      if (p.featured_carousel) {
        return {
          ...p,
          carousel_order: orderMap.get(p.id) ?? p.carousel_order ?? 0,
          updated_at: new Date().toISOString()
        };
      }
      return p;
    });

    onUpdateProducts(nextProducts);
    setDraggedCarouselIdx(null);
  };

  const handleCarouselRemix = () => {
    // Pick 8 random products from catalog
    const allWithImages = products.filter(p => p.images && p.images.length > 0);
    if (allWithImages.length === 0) {
      alert("No products with images in catalog to remix.");
      return;
    }

    // Shuffle and pick 8
    const shuffled = [...allWithImages].sort(() => 0.5 - Math.random());
    const countToSelect = Math.min(8, shuffled.length);
    const selected = shuffled.slice(0, countToSelect);
    const selectedIds = new Set(selected.map(p => p.id));

    const nextProducts = products.map(p => {
      const isFeatured = selectedIds.has(p.id);
      return {
        ...p,
        featured_carousel: isFeatured,
        carousel_order: isFeatured ? selected.findIndex(x => x.id === p.id) : 0,
        updated_at: new Date().toISOString()
      };
    });

    onUpdateProducts(nextProducts);
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
            headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
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
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState<boolean>(false);
  const [customCategoryName, setCustomCategoryName] = useState<string>('');
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
    editTitle?: string;    // user-editable title override
    editPrice?: string;   // user-editable price override
    editTags?: string;    // user-editable tags (comma-separated)
    editCategory?: string; // user-editable category override
    selected?: boolean;   // user-selectable import status
    error?: string;
  }
  const [bulkUrlText, setBulkUrlText] = useState<string>('');
  const [bulkEntries, setBulkEntries] = useState<BulkUrlEntry[]>([]);
  const [expandedRowIdx, setExpandedRowIdx] = useState<number | null>(null);
  const [isBulkRunning, setIsBulkRunning] = useState<boolean>(false);
  const [bulkCommitSuccess, setBulkCommitSuccess] = useState<boolean>(false);

  // Edit mode state and editRecipe moved to the top of SellerHub

  const featuredCount = products.filter(p => {
    if (editingProduct && p.id === editingProduct.id) {
      return editingProduct.featured_carousel || false;
    }
    return p.featured_carousel || false;
  }).length;

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
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
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
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
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
      price: parsedAiProduct.price || 2000,
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
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
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

    const finalCategory = newCategory === "NEW_CATEGORY_TRIGGER" ? customCategoryName.trim() : newCategory;
    if (newCategory === "NEW_CATEGORY_TRIGGER" && !finalCategory) {
      alert("Please enter a custom category name.");
      return;
    }

    // Build Material Recipe
    let recipe: any = null;
    let initialFloorPrice: number | undefined = undefined;
    let initialNeedsReview = false;

    if (newRecipeFilamentName) {
      recipe = {
        filament_name: newRecipeFilamentName,
        filament_grams: parseFloat(newRecipeFilamentGrams) || 0,
        print_hours: parseFloat(newRecipePrintHours) || 0,
        has_uv_finish: newRecipeHasUvFinish
      };
      if (newRecipeHasUvFinish) {
        recipe.resin_grams = parseFloat(newRecipeResinGrams) || 0;
      }
      if (newRecipeAccessories.length > 0) {
        recipe.accessories = newRecipeAccessories;
      }
      if (newRecipeTargetMargin) {
        recipe.target_margin = parseFloat(newRecipeTargetMargin);
      }

      // Cost floor calculation
      const spoolsOfName = filaments.filter(s => s.name === newRecipeFilamentName && !s.is_empty);
      let totalSpoolCost = 0;
      let totalSpoolWeight = 0;
      spoolsOfName.forEach(s => {
        totalSpoolCost += s.purchase_price_bdt;
        totalSpoolWeight += s.spool_weight_grams;
      });
      const filamentCostPerGram = totalSpoolWeight > 0 ? (totalSpoolCost / totalSpoolWeight) : 0;
      
      const resinAccessory = accessories.find(a => a.name === "UV Resin");
      const resinCostPerGram = resinAccessory ? resinAccessory.cost_per_unit_bdt : 10;
      
      const accCosts: Record<string, number> = {};
      accessories.forEach(a => {
        accCosts[a.name] = a.cost_per_unit_bdt;
      });
      
      const settingsObj = {
        default_target_margin: parseFloat(hubSettings.default_target_margin) || 50,
        electricity_cost_per_hour: parseFloat(hubSettings.electricity_cost_per_hour) || 3,
        depreciation_cost_per_hour: parseFloat(hubSettings.depreciation_cost_per_hour) || 20,
        packaging_cost_flat: parseFloat(hubSettings.packaging_cost_flat) || 40,
        platform_fee_percent: parseFloat(hubSettings.platform_fee_percent) || 3
      };
      
      try {
        const calc = calculateFloorPrice(
          recipe,
          filamentCostPerGram,
          resinCostPerGram,
          accCosts,
          settingsObj
        );
        initialFloorPrice = calc.floor_price_bdt;
        initialNeedsReview = (Math.round(parseFloat(newPrice)) || 2000) < calc.floor_price_bdt;
      } catch (err) {
        console.error("Failed to calculate initial floor price:", err);
      }
    }

    const readyProduct: Product = {
      id: computedId,
      title: newTitle,
      description: newDesc || (newIsPreOrder ? 'Premium imported hardware pre-order slot.' : 'Handcrafted precision filament print optimized by Belvia team.'),
      category: finalCategory,
      price: Math.round(parseFloat(newPrice)) || 2000,
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
      originalImportCountry: newIsPreOrder ? newOriginalImportCountry : undefined,
      material_recipe: recipe || undefined,
      floor_price_bdt: initialFloorPrice,
      needs_price_review: initialNeedsReview,
      resin_enabled: newResinEnabled,
      resin_price: newResinEnabled && newResinPrice ? Math.round(parseFloat(newResinPrice)) || 0 : null
    };

    onAddProduct(readyProduct);
    setManualSuccessMsg(true);
    setShowCustomCategoryInput(false);
    setCustomCategoryName('');

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
    setNewResinEnabled(false);
    setNewResinPrice('');
    
    // Reset Recipe Fields
    setNewRecipeFilamentName('');
    setNewRecipeFilamentGrams('');
    setNewRecipeResinGrams('2');
    setNewRecipeHasUvFinish(false);
    setNewRecipeAccessories([]);
    setNewRecipePrintHours('');
    setNewRecipeTargetMargin('');
    
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
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
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
                editTitle: data.product.title || '',
                editPrice: String(data.product.price ?? ''),
                editTags: Array.isArray(data.product.tags) ? data.product.tags.join(', ') : '',
                editCategory: data.product.category || '',
                selected: true
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

  const handleBulkEditCategory = (entryIdx: number, value: string) => {
    setBulkEntries(prev => prev.map((e, i) => i === entryIdx ? { ...e, editCategory: value } : e));
  };

  const handleBulkEditTitle = (entryIdx: number, value: string) => {
    setBulkEntries(prev => prev.map((e, i) => i === entryIdx ? { ...e, editTitle: value } : e));
  };

  const handleBulkCommit = () => {
    const readyEntries = bulkEntries.filter(e => e.status === 'success' && e.product && e.selected !== false);
    if (readyEntries.length === 0) {
      alert('No selected products to commit.');
      return;
    }

    const existingIds = new Set(products.map(p => p.id));
    const toAdd: Product[] = [];

    for (const entry of readyEntries) {
      const p = entry.product!;
      const rawTitle = entry.editTitle || p.title || 'Bulk Import Product';
      const cleanTitle = rawTitle.split('|')[0].trim();
      const computedId = 'belvia-' + cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (existingIds.has(computedId)) continue;
      existingIds.add(computedId);

      // Use user-edited price if provided and valid, else fall back to scraped price
      const resolvedPrice = entry.editPrice && !isNaN(parseFloat(entry.editPrice))
        ? Math.round(parseFloat(entry.editPrice))
        : (p.price || 2000);

      // Parse user-edited tags
      const resolvedTags = entry.editTags
        ? entry.editTags.split(',').map(t => t.trim()).filter(Boolean)
        : (p.tags || []);

      toAdd.push({
        id: computedId,
        title: cleanTitle,
        description: p.description || 'Imported via Bulk MakerWorld URL.',
        category: entry.editCategory || p.category || 'Desk Accessories',
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

  const getFilamentCostPerGram = (name: string): number => {
    if (!name) return 0;
    const spoolsOfName = filaments.filter(s => s.name === name && !s.is_empty);
    let totalSpoolCost = 0;
    let totalSpoolWeight = 0;
    spoolsOfName.forEach(s => {
      totalSpoolCost += s.purchase_price_bdt;
      totalSpoolWeight += s.spool_weight_grams;
    });
    return totalSpoolWeight > 0 ? (totalSpoolCost / totalSpoolWeight) : 0;
  };

  const updateEditRecipeField = (field: string, value: any) => {
    if (!editingProduct) return;
    const currentRecipe = editingProduct.material_recipe || {
      filament_name: '',
      filament_grams: 0,
      print_hours: 0,
      has_uv_finish: false,
      resin_grams: 2,
      accessories: [],
      target_margin: null
    };
    const nextRecipe = { ...currentRecipe, [field]: value };
    setEditingProduct({
      ...editingProduct,
      material_recipe: nextRecipe
    });
  };

  const toggleEditRecipeAccessory = (accName: string) => {
    if (!editingProduct) return;
    const currentRecipe = editingProduct.material_recipe || {
      filament_name: '',
      filament_grams: 0,
      print_hours: 0,
      has_uv_finish: false,
      resin_grams: 2,
      accessories: [],
      target_margin: null
    };
    const currentAccs = currentRecipe.accessories || [];
    const nextAccs = currentAccs.includes(accName)
      ? currentAccs.filter(a => a !== accName)
      : [...currentAccs, accName];
    setEditingProduct({
      ...editingProduct,
      material_recipe: {
        ...currentRecipe,
        accessories: nextAccs
      }
    });
  };

  const handleUpdateToRecommended = (product: Product) => {
    const recommendedPrice = product.floor_price_bdt || product.price;
    const updated = products.map(p => p.id === product.id ? {
      ...p,
      price: recommendedPrice,
      needs_price_review: false
    } : p);
    onUpdateProducts(updated);
  };

  const handleBulkUpdateToRecommended = () => {
    const updated = products.map(p => {
      if (p.needs_price_review && p.floor_price_bdt) {
        return {
          ...p,
          price: p.floor_price_bdt,
          needs_price_review: false
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    alert("All flagged products updated to recommended prices!");
  };

  // --- EDIT PRODUCT ACTIONS ---
  const handleStartEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setShowEditCustomCategoryInput(false);
    setEditCustomCategoryName("");
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;
    if (!editingProduct.title.trim()) {
      alert("Product title cannot be empty.");
      return;
    }

    const finalCategory = showEditCustomCategoryInput ? editCustomCategoryName.trim() : editingProduct.category;
    if (showEditCustomCategoryInput && !finalCategory) {
      alert("Please enter a custom category name.");
      return;
    }

    let updatedProduct = {
      ...editingProduct,
      category: finalCategory,
      resin_enabled: !!editingProduct.resin_enabled,
      resin_price: editingProduct.resin_enabled && editingProduct.resin_price != null ? Math.round(Number(editingProduct.resin_price)) : null
    };

    const recipe = updatedProduct.material_recipe;
    if (recipe && recipe.filament_name) {
      const spoolsOfName = filaments.filter(s => s.name === recipe.filament_name && !s.is_empty);
      let totalSpoolCost = 0;
      let totalSpoolWeight = 0;
      spoolsOfName.forEach(s => {
        totalSpoolCost += s.purchase_price_bdt;
        totalSpoolWeight += s.spool_weight_grams;
      });
      const filamentCostPerGram = totalSpoolWeight > 0 ? (totalSpoolCost / totalSpoolWeight) : 0;
      
      const resinAccessory = accessories.find(a => a.name === "UV Resin");
      const resinCostPerGram = resinAccessory ? resinAccessory.cost_per_unit_bdt : 10;
      
      const accCosts: Record<string, number> = {};
      accessories.forEach(a => {
        accCosts[a.name] = a.cost_per_unit_bdt;
      });
      
      const settingsObj = {
        default_target_margin: parseFloat(hubSettings.default_target_margin) || 50,
        electricity_cost_per_hour: parseFloat(hubSettings.electricity_cost_per_hour) || 3,
        depreciation_cost_per_hour: parseFloat(hubSettings.depreciation_cost_per_hour) || 20,
        packaging_cost_flat: parseFloat(hubSettings.packaging_cost_flat) || 40,
        platform_fee_percent: parseFloat(hubSettings.platform_fee_percent) || 3
      };
      
      try {
        const calc = calculateFloorPrice(
          recipe,
          filamentCostPerGram,
          resinCostPerGram,
          accCosts,
          settingsObj
        );
        updatedProduct.floor_price_bdt = calc.floor_price_bdt;
        updatedProduct.needs_price_review = updatedProduct.price < calc.floor_price_bdt;
      } catch (err) {
        console.error("Failed to calculate floor price during edit save:", err);
      }
    } else {
      // If recipe is removed or not set, clear floor price metrics
      updatedProduct.floor_price_bdt = undefined;
      updatedProduct.needs_price_review = false;
    }

    const updated = products.map(p => p.id === editingProduct.id ? updatedProduct : p);
    onUpdateProducts(updated);
    setEditingProduct(null);
    setShowEditCustomCategoryInput(false);
    setEditCustomCategoryName("");
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
            price = Math.round(p.price * (1 + val / 100));
          } else if (bulkPriceAction === 'percent_decrease') {
            price = Math.round(p.price * (1 - val / 100));
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
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 bg-bg-surface border border-border-premium rounded-xl p-1.5 gap-1.5 mb-8 max-w-5xl mx-auto">
          {[
            { id: 'ai', name: 'MakerWorld AI Agent', icon: Sparkles },
            { id: 'bulk', name: 'Bulk URL Import', icon: Link2 },
            { id: 'manual', name: 'Drag & Drop Manual', icon: PlusCircle },
            { id: 'inventory', name: 'Active Inventory Catalog', icon: Grid },
            { id: 'carousel', name: 'Hero Carousel', icon: Star },
            { id: 'orders', name: 'Manage Orders & Payments', icon: ListChecks },
            { id: 'preorders', name: 'Manage Pre-Orders', icon: Calendar },
            { id: 'coupons', name: 'Coupon Manager', icon: Tag },
            { id: 'festivals', name: 'Festival Discounts', icon: Sparkles },
            { id: 'filaments', name: 'Filaments & Stock', icon: Layers },
            { id: 'pricehealth', name: 'Price Health', icon: AlertTriangle },
            { id: 'settings', name: 'Store Settings', icon: Settings },
            { id: 'support-logs', name: 'Chat Support Logs', icon: MessageSquare }
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
                className={`w-full flex items-center justify-center space-x-2 py-2.5 px-2 sm:px-3 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 border ${
                  activeSubTab === tab.id && !editingProduct
                    ? 'bg-accent-secondary text-white font-bold border-white/5 shadow-sm shadow-accent-secondary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/45 border-transparent'
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

                    <div className="border-b border-border-premium pb-2 flex justify-between text-left items-center gap-3">
                      <span className="text-text-secondary shrink-0 w-20">TITLE:</span>
                      <input
                        type="text"
                        value={parsedAiProduct.title || ''}
                        onChange={(e) => setParsedAiProduct(prev => prev ? { ...prev, title: e.target.value } : null)}
                        className="bg-bg-base text-text-primary border border-border-premium rounded-xl py-1.5 px-3 text-xs w-full font-sans focus:border-accent focus:outline-none text-right font-bold"
                      />
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
                      <span className="text-accent font-bold">{formatPrice(parsedAiProduct.price || 0)}</span>
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
                        className="px-4.5 py-2 rounded-xl bg-accent-secondary hover:bg-accent text-white font-bold text-xs cursor-pointer transition shadow animate-pulse"
                      >
                        Save All Selected ({bulkEntries.filter(e => e.status === 'success' && e.selected !== false).length})
                      </button>
                    )
                  )}
                </div>

                {/* Per-URL entries review table */}
                <div className="overflow-x-auto border border-border-premium rounded-xl bg-bg-surface/30 max-h-[70vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-border-premium bg-bg-base font-mono text-[10px] text-text-secondary uppercase tracking-widest">
                        <th className="py-3 px-4 w-[5%] text-center">
                          <input
                            type="checkbox"
                            checked={bulkEntries.filter(e => e.status === 'success').length > 0 && bulkEntries.filter(e => e.status === 'success' && e.selected !== false).length === bulkEntries.filter(e => e.status === 'success').length}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setBulkEntries(prev => prev.map(entry => entry.status === 'success' ? { ...entry, selected: checked } : entry));
                            }}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent cursor-pointer"
                          />
                        </th>
                        <th className="py-3 px-3 w-[8%] text-center">Preview</th>
                        <th className="py-3 px-3 w-[30%]">Title</th>
                        <th className="py-3 px-3 w-[22%]">Category</th>
                        <th className="py-3 px-3 w-[15%]">Price (BDT)</th>
                        <th className="py-3 px-3 w-[10%] text-center">Status</th>
                        <th className="py-3 px-3 w-[10%] text-center">Config</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-premium/50 bg-bg-surface/10">
                      {bulkEntries.map((entry, idx) => {
                        const mainImg = (entry.selectedImages && entry.selectedImages[0]) || (entry.images && entry.images[0]) || '';
                        const isSuccess = entry.status === 'success';
                        const isExpanded = expandedRowIdx === idx;

                        return (
                          <React.Fragment key={idx}>
                            <tr className={`hover:bg-bg-elevated/20 transition ${
                              entry.status === 'success' ? 'text-text-primary'
                              : entry.status === 'error' ? 'text-red-400'
                              : entry.status === 'duplicate' ? 'text-amber-400' : 'text-text-secondary'
                            }`}>
                              {/* Checkbox Column */}
                              <td className="py-3.5 px-4 text-center">
                                {isSuccess ? (
                                  <input
                                    type="checkbox"
                                    checked={entry.selected !== false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setBulkEntries(prev => prev.map((eVal, i) => i === idx ? { ...eVal, selected: checked } : eVal));
                                    }}
                                    className="rounded border-border-premium text-accent focus:ring-accent accent-accent cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-text-muted/40 font-mono">-</span>
                                )}
                              </td>

                              {/* Preview Thumbnail Column */}
                              <td className="py-2 px-3 text-center">
                                <div className="w-10 h-10 rounded border border-border-premium overflow-hidden bg-bg-base mx-auto">
                                  {mainImg ? (
                                    <img src={mainImg} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Layers className="w-5 h-5 text-text-muted/30 m-auto mt-2.5" />
                                  )}
                                </div>
                              </td>

                              {/* Title Column */}
                              <td className="py-2 px-3">
                                {isSuccess ? (
                                  <input
                                    type="text"
                                    value={entry.editTitle ?? ''}
                                    onChange={(e) => handleBulkEditTitle(idx, e.target.value)}
                                    className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 px-2.5 text-xs font-sans focus:border-accent focus:outline-none"
                                  />
                                ) : (
                                  <div className="font-mono text-[10px] truncate max-w-[280px]" title={entry.url}>
                                    {entry.url}
                                  </div>
                                )}
                              </td>

                              {/* Category Column */}
                              <td className="py-2 px-3">
                                {isSuccess ? (
                                  <select
                                    value={entry.editCategory || entry.product?.category || ''}
                                    onChange={(e) => handleBulkEditCategory(idx, e.target.value)}
                                    className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 px-2.5 text-xs font-sans focus:border-accent focus:outline-none cursor-pointer"
                                  >
                                    {categories.map((c) => (
                                      <option key={c.name} value={c.name}>{c.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-text-muted/40 font-mono">-</span>
                                )}
                              </td>

                              {/* Price Column */}
                              <td className="py-2 px-3">
                                {isSuccess ? (
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-accent font-bold text-xs">a</span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={entry.editPrice ?? ''}
                                      onChange={(e) => handleBulkEditPrice(idx, e.target.value)}
                                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-1.5 pl-5 pr-2 text-xs font-mono focus:border-accent focus:outline-none"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-text-muted/40 font-mono">-</span>
                                )}
                              </td>

                              {/* Status Column */}
                              <td className="py-2 px-3 text-center">
                                <div className="flex items-center justify-center">
                                  {entry.status === 'loading' && <Loader2 className="w-4.5 h-4.5 text-blue-400 animate-spin" />}
                                  {entry.status === 'success' && <CircleCheck className="w-4.5 h-4.5 text-emerald-400" title="Ready to import" />}
                                  {entry.status === 'error' && <CircleX className="w-4.5 h-4.5 text-red-400" title={entry.error} />}
                                  {entry.status === 'duplicate' && <AlertTriangle className="w-4.5 h-4.5 text-amber-400" title={entry.error} />}
                                  {entry.status === 'pending' && <div className="w-4.5 h-4.5 rounded-full border border-border-premium" />}
                                </div>
                              </td>

                              {/* Config Actions Column */}
                              <td className="py-2 px-3 text-center">
                                {isSuccess ? (
                                  <button
                                    onClick={() => setExpandedRowIdx(isExpanded ? null : idx)}
                                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono border transition cursor-pointer ${
                                      isExpanded
                                        ? 'bg-accent/15 border-accent text-accent font-bold'
                                        : 'bg-bg-elevated border-border-premium text-text-secondary hover:border-gray-500 hover:text-text-primary'
                                    }`}
                                  >
                                    {isExpanded ? 'Hide' : 'Media/Tags'}
                                  </button>
                                ) : (
                                  <span className="text-text-muted/40 font-mono">-</span>
                                )}
                              </td>
                            </tr>

                            {/* Error messages row if failed */}
                            {(entry.status === 'error' || entry.status === 'duplicate') && entry.error && (
                              <tr className="bg-red-500/5">
                                <td colSpan={7} className="py-2 px-4 border-b border-border-premium/20">
                                  <p className="text-[10px] font-mono text-red-400/80 leading-relaxed">
                                    Gn+ Scraper Error: {entry.error}
                                  </p>
                                </td>
                              </tr>
                            )}

                            {/* Expanded Details Row (Tags and Image Selectors) */}
                            {isSuccess && isExpanded && (
                              <tr className="bg-bg-base/30 border-b border-border-premium/50 animate-fade-in">
                                <td colSpan={7} className="p-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    {/* Tags block */}
                                    <div className="md:col-span-4 space-y-1.5 text-left">
                                      <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                                        Tags (comma-separated):
                                      </label>
                                      <input
                                        type="text"
                                        value={entry.editTags ?? ''}
                                        onChange={(e) => handleBulkEditTags(idx, e.target.value)}
                                        placeholder="e.g. flexi, articulated, cat"
                                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-2 px-3 text-xs font-mono focus:border-accent focus:outline-none"
                                      />
                                    </div>

                                    {/* Images block */}
                                    <div className="md:col-span-8 space-y-2 text-left">
                                      <span className="text-[10px] font-mono text-text-secondary uppercase tracking-widest block">
                                        Select Gallery Showcase Images ({(entry.selectedImages || []).length}/{(entry.images || []).length} selected):
                                      </span>
                                      <div className="flex flex-wrap gap-2">
                                        {(entry.images || []).map((img, imgIdx) => {
                                          const isSelected = (entry.selectedImages || []).includes(img);
                                          return (
                                            <div
                                              key={imgIdx}
                                              onClick={() => handleBulkToggleImage(idx, img)}
                                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition relative group ${
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
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
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
                      MSRP Selling Price (BDT):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent font-bold text-xs">a</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="1200"
                        required
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 pl-8 pr-3.5 text-xs focus:border-accent font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Manufacturing Category:
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCategory(val);
                        if (val === "NEW_CATEGORY_TRIGGER") {
                          setShowCustomCategoryInput(true);
                        } else {
                          setShowCustomCategoryInput(false);
                        }
                      }}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                      <option value="NEW_CATEGORY_TRIGGER">Add new category...</option>
                    </select>
                    {showCustomCategoryInput && (
                      <input
                        type="text"
                        placeholder="Enter custom category..."
                        required
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-accent rounded-xl py-2 px-3 mt-2 text-xs focus:outline-none font-mono"
                      />
                    )}
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

                {/* Resin Add-on Configuration Toggle */}
                <div className="space-y-3 bg-bg-surface/50 border border-border-premium rounded-xl p-4">
                  <label className="flex items-center space-x-2.5 text-xs text-text-primary font-bold cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newResinEnabled}
                      onChange={(e) => setNewResinEnabled(e.target.checked)}
                      className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                    />
                    <span>Enable Resin Add-on?</span>
                  </label>

                  {newResinEnabled && (
                    <div className="pt-2 border-t border-border-premium/50 animate-fade-in font-mono text-xs">
                      <div>
                        <label className="block text-[9px] text-text-secondary uppercase mb-1">Resin Surcharge Price (BDT):</label>
                        <input 
                          type="number"
                          step="1"
                          required
                          min="0"
                          value={newResinPrice}
                          onChange={(e) => setNewResinPrice(e.target.value)}
                          placeholder="e.g. 250"
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

                {/* --- MATERIAL RECIPE SECTION --- */}
                <div className="space-y-4 bg-bg-surface/50 border border-border-premium rounded-xl p-4.5">
                  <div className="flex items-center space-x-2 text-accent font-bold text-xs uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4" />
                    <span>Material Cost Recipe (Optional Floor Pricing)</span>
                  </div>
                  
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    Set a material recipe to automatically calculate the recommended floor price based on filament, resin, and accessories.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                        Select Filament Spool:
                      </label>
                      <select
                        value={newRecipeFilamentName}
                        onChange={(e) => setNewRecipeFilamentName(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent cursor-pointer"
                      >
                        <option value="">-- No Filament (Manual Price Only) --</option>
                        {Array.from(new Set(filaments.map(f => f.name))).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {newRecipeFilamentName && (
                      <div>
                        <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                          Filament Print Weight (Grams):
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={newRecipeFilamentGrams}
                          onChange={(e) => setNewRecipeFilamentGrams(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {newRecipeFilamentName && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                            Print Time (Decimal Hours):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={newRecipePrintHours}
                            onChange={(e) => setNewRecipePrintHours(e.target.value)}
                            placeholder="e.g. 3.5"
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                            Target Margin % (Optional Override):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={newRecipeTargetMargin}
                              onChange={(e) => setNewRecipeTargetMargin(e.target.value)}
                              placeholder={`Default: ${hubSettings.default_target_margin || '50'}%`}
                              className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                            />
                            {newRecipeTargetMargin && (
                              <button
                                type="button"
                                onClick={() => setNewRecipeTargetMargin('')}
                                className="text-[10px] text-accent hover:underline whitespace-nowrap bg-transparent border-0 cursor-pointer"
                              >
                                Reset to Default
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* UV Resin Finish Toggle */}
                      <div className="space-y-2 border-t border-border-premium/50 pt-3">
                        <label className="flex items-center space-x-2.5 text-xs text-text-primary font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newRecipeHasUvFinish}
                            onChange={(e) => setNewRecipeHasUvFinish(e.target.checked)}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                          <span>Apply UV Resin Finish?</span>
                        </label>
                        {newRecipeHasUvFinish && (
                          <div className="w-1/2">
                            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                              Resin Amount (Grams):
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={newRecipeResinGrams}
                              onChange={(e) => setNewRecipeResinGrams(e.target.value)}
                              className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Accessories Selection */}
                      <div className="space-y-2 border-t border-border-premium/50 pt-3">
                        <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                          Select Accessories Used:
                        </label>
                        <div className="flex flex-wrap gap-3 bg-bg-base border border-border-premium rounded-xl p-3">
                          {accessories.map((acc) => (
                            <label key={acc.id} className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                              <input
                                type="checkbox"
                                checked={newRecipeAccessories.includes(acc.name)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setNewRecipeAccessories(prev =>
                                    checked ? [...prev, acc.name] : prev.filter(name => name !== acc.name)
                                  );
                                }}
                                className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                              />
                              <span>{acc.name} (+a{acc.cost_per_unit_bdt})</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Live Floor Price Preview */}
                      {(() => {
                        try {
                          const filamentCostPerGram = getFilamentCostPerGram(newRecipeFilamentName);
                          const resinAccessory = accessories.find(a => a.name === "UV Resin");
                          const resinCostPerGram = resinAccessory ? resinAccessory.cost_per_unit_bdt : 10;
                          
                          const accCosts: Record<string, number> = {};
                          accessories.forEach(a => {
                            accCosts[a.name] = a.cost_per_unit_bdt;
                          });
                          
                          const settingsObj = {
                            default_target_margin: parseFloat(hubSettings.default_target_margin) || 50,
                            electricity_cost_per_hour: parseFloat(hubSettings.electricity_cost_per_hour) || 3,
                            depreciation_cost_per_hour: parseFloat(hubSettings.depreciation_cost_per_hour) || 20,
                            packaging_cost_flat: parseFloat(hubSettings.packaging_cost_flat) || 40,
                            platform_fee_percent: parseFloat(hubSettings.platform_fee_percent) || 3
                          };

                          const tempRecipe = {
                            filament_name: newRecipeFilamentName,
                            filament_grams: parseFloat(newRecipeFilamentGrams) || 0,
                            print_hours: parseFloat(newRecipePrintHours) || 0,
                            has_uv_finish: newRecipeHasUvFinish,
                            resin_grams: newRecipeHasUvFinish ? (parseFloat(newRecipeResinGrams) || 0) : 0,
                            accessories: newRecipeAccessories,
                            target_margin: newRecipeTargetMargin ? parseFloat(newRecipeTargetMargin) : null
                          };

                          const calc = calculateFloorPrice(tempRecipe, filamentCostPerGram, resinCostPerGram, accCosts, settingsObj);
                          const isWarning = (parseFloat(newPrice) || 0) < calc.floor_price_bdt;
                          
                          return (
                            <div className={`p-4 rounded-xl border font-mono text-xs ${isWarning ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                              <div className="flex justify-between font-bold">
                                <span>RECOMMENDED FLOOR PRICE:</span>
                                <span>a{calc.floor_price_bdt}</span>
                              </div>
                              <div className="flex justify-between mt-1 text-[11px] text-text-secondary">
                                <span>Total Cost Base: a{calc.cost_breakdown.total_cost}</span>
                                <span>Your Selling Price: a{newPrice || '0'}</span>
                              </div>
                              {isWarning && (
                                <div className="mt-2 text-[10px] font-sans flex items-center space-x-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                                  <span>Selling price is below floor price. Warning flag will be set.</span>
                                </div>
                              )}
                            </div>
                          );
                        } catch (err) {
                          return null;
                        }
                      })()}
                    </>
                  )}
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
                      Price (BDT):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent font-bold text-xs">a</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="1200"
                        required
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: Math.round(parseFloat(e.target.value)) || 0 })}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 pl-8 pr-3.5 text-xs focus:border-accent font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                      Category:
                    </label>
                    <select
                      value={showEditCustomCategoryInput ? "NEW_CATEGORY_TRIGGER" : editingProduct.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "NEW_CATEGORY_TRIGGER") {
                          setShowEditCustomCategoryInput(true);
                        } else {
                          setShowEditCustomCategoryInput(false);
                          setEditingProduct({ ...editingProduct, category: val });
                        }
                      }}
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent cursor-pointer"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                      <option value="NEW_CATEGORY_TRIGGER">Add new category...</option>
                    </select>
                    {showEditCustomCategoryInput && (
                      <input
                        type="text"
                        placeholder="Enter custom category..."
                        required
                        value={editCustomCategoryName}
                        onChange={(e) => setEditCustomCategoryName(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-accent rounded-xl py-2 px-3 mt-2 text-xs focus:outline-none font-mono"
                      />
                    )}
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

                {/* Resin Add-on Configuration Toggle */}
                <div className="bg-bg-base border border-border-premium rounded-xl p-4 space-y-3">
                  <label className="flex items-center space-x-2.5 text-xs text-text-primary font-bold cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={!!editingProduct.resin_enabled}
                      onChange={(e) => setEditingProduct({ ...editingProduct, resin_enabled: e.target.checked })}
                      className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                    />
                    <div>
                      <span className="font-bold block text-text-primary">Enable Resin Add-on</span>
                      <span className="text-[10px] text-text-secondary block mt-0.5">
                        Allows customers to select premium resin coating as a surcharge on checkout.
                      </span>
                    </div>
                  </label>

                  {editingProduct.resin_enabled && (
                    <div className="pt-2 border-t border-border-premium/50 animate-fade-in font-mono text-xs">
                      <div>
                        <label className="block text-[9px] text-text-secondary uppercase mb-1">Resin Surcharge Price (BDT):</label>
                        <input 
                          type="number"
                          step="1"
                          required
                          min="0"
                          value={editingProduct.resin_price === null || editingProduct.resin_price === undefined ? '' : editingProduct.resin_price}
                          onChange={(e) => setEditingProduct({ ...editingProduct, resin_price: e.target.value === '' ? null : Math.round(parseFloat(e.target.value)) })}
                          placeholder="e.g. 250"
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* --- EDIT MATERIAL RECIPE SECTION --- */}
                <div className="space-y-4 bg-bg-surface/50 border border-border-premium rounded-xl p-4.5">
                  <div className="flex items-center space-x-2 text-accent font-bold text-xs uppercase tracking-wider">
                    <BrainCircuit className="w-4 h-4" />
                    <span>Material Cost Recipe (Optional Floor Pricing)</span>
                  </div>
                  
                  <p className="text-text-secondary text-[11px] leading-relaxed">
                    Set a material recipe to automatically calculate the recommended floor price based on filament, resin, and accessories.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                        Select Filament Spool:
                      </label>
                      <select
                        value={editRecipe.filament_name || ''}
                        onChange={(e) => updateEditRecipeField('filament_name', e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent cursor-pointer"
                      >
                        <option value="">-- No Filament (Manual Price Only) --</option>
                        {Array.from(new Set(filaments.map(f => f.name))).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>

                    {editRecipe.filament_name && (
                      <div>
                        <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                          Filament Print Weight (Grams):
                        </label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={editRecipe.filament_grams || ''}
                          onChange={(e) => updateEditRecipeField('filament_grams', parseFloat(e.target.value) || 0)}
                          placeholder="e.g. 45"
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {editRecipe.filament_name && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                            Print Time (Decimal Hours):
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            required
                            value={editRecipe.print_hours || ''}
                            onChange={(e) => updateEditRecipeField('print_hours', parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 3.5"
                            className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                            Target Margin % (Optional Override):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="99"
                              value={editRecipe.target_margin === null || editRecipe.target_margin === undefined ? '' : editRecipe.target_margin}
                              onChange={(e) => updateEditRecipeField('target_margin', e.target.value === '' ? null : parseFloat(e.target.value))}
                              placeholder={`Default: ${hubSettings.default_target_margin || '50'}%`}
                              className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                            />
                            {editRecipe.target_margin !== null && editRecipe.target_margin !== undefined && (
                              <button
                                type="button"
                                onClick={() => updateEditRecipeField('target_margin', null)}
                                className="text-[10px] text-accent hover:underline whitespace-nowrap bg-transparent border-0 cursor-pointer"
                              >
                                Reset to Default
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* UV Resin Finish Toggle */}
                      <div className="space-y-2 border-t border-border-premium/50 pt-3">
                        <label className="flex items-center space-x-2.5 text-xs text-text-primary font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!editRecipe.has_uv_finish}
                            onChange={(e) => updateEditRecipeField('has_uv_finish', e.target.checked)}
                            className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                          />
                          <span>Apply UV Resin Finish?</span>
                        </label>
                        {editRecipe.has_uv_finish && (
                          <div className="w-1/2">
                            <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                              Resin Amount (Grams):
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={editRecipe.resin_grams === undefined ? 2 : editRecipe.resin_grams}
                              onChange={(e) => updateEditRecipeField('resin_grams', parseFloat(e.target.value) || 0)}
                              className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2 px-3 text-xs focus:border-accent font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Accessories Selection */}
                      <div className="space-y-2 border-t border-border-premium/50 pt-3">
                        <label className="block text-[9px] font-mono text-text-secondary uppercase tracking-widest mb-1">
                          Select Accessories Used:
                        </label>
                        <div className="flex flex-wrap gap-3 bg-bg-base border border-border-premium rounded-xl p-3">
                          {accessories.map((acc) => (
                            <label key={acc.id} className="flex items-center space-x-2 text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                              <input
                                type="checkbox"
                                checked={editRecipe.accessories?.includes(acc.name) || false}
                                onChange={(e) => {
                                  toggleEditRecipeAccessory(acc.name);
                                }}
                                className="rounded border-border-premium text-accent focus:ring-accent accent-accent"
                              />
                              <span>{acc.name} (+a{acc.cost_per_unit_bdt})</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Live Floor Price Preview */}
                      {(() => {
                        try {
                          const filamentCostPerGram = getFilamentCostPerGram(editRecipe.filament_name);
                          const resinAccessory = accessories.find(a => a.name === "UV Resin");
                          const resinCostPerGram = resinAccessory ? resinAccessory.cost_per_unit_bdt : 10;
                          
                          const accCosts: Record<string, number> = {};
                          accessories.forEach(a => {
                            accCosts[a.name] = a.cost_per_unit_bdt;
                          });
                          
                          const settingsObj = {
                            default_target_margin: parseFloat(hubSettings.default_target_margin) || 50,
                            electricity_cost_per_hour: parseFloat(hubSettings.electricity_cost_per_hour) || 3,
                            depreciation_cost_per_hour: parseFloat(hubSettings.depreciation_cost_per_hour) || 20,
                            packaging_cost_flat: parseFloat(hubSettings.packaging_cost_flat) || 40,
                            platform_fee_percent: parseFloat(hubSettings.platform_fee_percent) || 3
                          };

                          const calc = calculateFloorPrice(editRecipe, filamentCostPerGram, resinCostPerGram, accCosts, settingsObj);
                          const isWarning = (editingProduct.price || 0) < calc.floor_price_bdt;
                          
                          return (
                            <div className={`p-4 rounded-xl border font-mono text-xs ${isWarning ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                              <div className="flex justify-between font-bold">
                                <span>RECOMMENDED FLOOR PRICE:</span>
                                <span>a{calc.floor_price_bdt}</span>
                              </div>
                              <div className="flex justify-between mt-1 text-[11px] text-text-secondary">
                                <span>Total Cost Base: a{calc.cost_breakdown.total_cost}</span>
                                <span>Your Selling Price: a{editingProduct.price || '0'}</span>
                              </div>
                              {isWarning && (
                                <div className="mt-2 text-[10px] font-sans flex items-center space-x-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                                  <span>Selling price is below floor price. Warning flag will be set.</span>
                                </div>
                              )}
                            </div>
                          );
                        } catch (err) {
                          return null;
                        }
                      })()}
                    </>
                  )}
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
                        <option value="flat">Set Flat Price (a)</option>
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
                        <td className="p-4 font-sans font-bold text-text-primary">
                          <div className="flex items-center gap-1.5">
                            <span>{item.title}</span>
                            {item.featured_carousel && (
                              <Star className="w-3.5 h-3.5 text-accent fill-accent" title="Featured in Carousel" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-bg-surface border border-border-premium text-accent font-semibold uppercase font-mono">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 text-accent font-bold">{formatPrice(item.price)}</td>
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
                        {categories.map((c) => (
                          <option key={c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-text-secondary uppercase">Price (BDT)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent font-bold text-[11px]">a</span>
                        <input 
                          type="number" 
                          step="1" 
                          placeholder="1200"
                          required
                          value={preorderPrice}
                          onChange={(e) => setPreorderPrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-2 pl-6 pr-2 font-mono text-xs focus:outline-none focus:border-accent"
                        />
                      </div>
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
                            {categories.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9px] font-mono text-text-secondary uppercase">Price (BDT)</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-accent font-bold text-[11px]">a</span>
                            <input 
                              type="number" 
                              step="1" 
                              placeholder="1200"
                              required
                              value={preorderPrice}
                              onChange={(e) => setPreorderPrice(parseFloat(e.target.value) || 0)}
                              className="w-full bg-bg-base text-text-primary border border-border-premium rounded-lg py-2 pl-6 pr-2 font-mono text-xs focus:outline-none focus:border-accent"
                            />
                          </div>
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
                            <span>TOTAL VALUE: {formatPrice(p.price)}</span>
                          </div>
                          <div className="flex items-end space-x-1 mt-0.5">
                            <span className="text-xl font-mono font-extrabold text-accent">{formatPrice(depositPrice)}</span>
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

        {activeSubTab === 'carousel' && !editingProduct && (
          <div id="carousel-curator-submodule" className="bg-bg-surface border border-border-premium rounded-2xl p-6 overflow-hidden shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4">
              <div className="text-left font-mono">
                <h3 className="font-display font-extrabold text-base text-text-primary uppercase tracking-wide">Hero Carousel Management</h3>
                <p className="text-[10px] text-text-secondary mt-1">
                  CURATED PRODUCTS: <span className="text-accent font-bold">{products.filter(p => p.featured_carousel).length}</span> G Drag and drop to manually order slides.
                </p>
              </div>
              <button
                onClick={handleCarouselRemix}
                className="px-4 py-2.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-white font-bold text-xs cursor-pointer flex items-center space-x-2 transition shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Remix Carousel</span>
              </button>
            </div>

            {/* Draggable Tiles Grid */}
            <div>
              {products.filter(p => p.featured_carousel).length === 0 ? (
                <div className="text-center py-10 border border-dashed border-border-premium rounded-xl">
                  <p className="text-text-secondary text-xs font-mono">No products featured in the hero carousel. Use the inventory tab to feature products, or click Remix.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products
                    .filter(p => p.featured_carousel)
                    .sort((a, b) => {
                      const valA = a.carousel_order !== undefined ? a.carousel_order : 999999;
                      const valB = b.carousel_order !== undefined ? b.carousel_order : 999999;
                      if (valA !== valB) return valA - valB;
                      const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                      const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                      return timeB - timeA;
                    })
                    .map((item, idx) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleCarouselDragStart(e, idx)}
                        onDragOver={(e) => handleCarouselDragOver(e, idx)}
                        onDrop={(e) => handleCarouselDrop(e, idx)}
                        className={`group relative bg-bg-base border ${
                          draggedCarouselIdx === idx ? 'border-accent border-dashed opacity-50 scale-95' : 'border-border-premium hover:border-accent/40'
                        } rounded-xl p-3 flex flex-col justify-between transition-all duration-200 cursor-move shadow-md`}
                      >
                        <div className="flex gap-3">
                          {/* Drag handle & thumbnail */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <GripVertical className="w-4 h-4 text-text-muted cursor-grab group-hover:text-accent transition" />
                            <div className="w-12 h-12 rounded-lg bg-bg-surface overflow-hidden border border-border-premium shrink-0">
                              <img
                                src={item.images[0] || '/images/placeholder.png'}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholder.png';
                                }}
                              />
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-text-primary truncate" title={item.title}>
                              {item.title}
                            </h4>
                            <p className="text-[9px] font-mono text-text-secondary uppercase mt-0.5">{item.category}</p>
                            <p className="text-[10px] font-mono font-bold text-accent mt-1">{formatPrice(item.price)}</p>
                          </div>
                        </div>

                        {/* Order badge & action */}
                        <div className="mt-3 pt-2 border-t border-border-premium/50 flex items-center justify-between">
                          <span className="text-[9px] font-mono font-semibold text-text-muted uppercase">
                            Slide Order: <span className="text-accent font-bold">#{(item.carousel_order ?? 0) + 1}</span>
                          </span>
                          <button
                            onClick={() => {
                              const updated = products.map(p => {
                                if (p.id === item.id) {
                                  return { ...p, featured_carousel: false, updated_at: new Date().toISOString() };
                                }
                                return p;
                              });
                              onUpdateProducts(updated);
                            }}
                            className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-500 transition cursor-pointer"
                            title="Remove from Carousel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            
            {/* Curation Quick Add/Management Catalog */}
            <div className="border-t border-border-premium pt-6 space-y-4">
              <h4 className="font-mono text-xs font-bold text-text-primary uppercase tracking-wide">Catalog Curation Panel</h4>
              <p className="text-[10px] text-text-secondary">
                Search or toggle featured status directly on any catalog product below to add it to the carousel:
              </p>
              
              <div className="max-h-72 overflow-y-auto border border-border-premium rounded-xl divide-y divide-border-premium bg-bg-base">
                {products.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-bg-surface/20 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-bg-surface overflow-hidden border border-border-premium shrink-0">
                        <img
                          src={item.images[0] || '/images/placeholder.png'}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">{item.title}</p>
                        <p className="text-[9px] font-mono text-text-secondary uppercase">{item.category} G {formatPrice(item.price)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        const updated = products.map(p => {
                          if (p.id === item.id) {
                            const newFeatured = !p.featured_carousel;
                            return { 
                              ...p, 
                              featured_carousel: newFeatured, 
                              // if newly featured, assign order at the end
                              carousel_order: newFeatured ? products.filter(x => x.featured_carousel).length : 0,
                              updated_at: new Date().toISOString() 
                            };
                          }
                          return p;
                        });
                        onUpdateProducts(updated);
                      }}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold uppercase transition flex items-center space-x-1.5 cursor-pointer ${
                        item.featured_carousel
                          ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                          : 'border-border-premium text-text-secondary hover:text-text-primary hover:border-gray-500'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${item.featured_carousel ? 'fill-current' : ''}`} />
                      <span>{item.featured_carousel ? 'Featured' : 'Add to Carousel'}</span>
                    </button>
                  </div>
                ))}
              </div>
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
                          <div className="text-accent font-bold text-sm">{formatPrice(order.totalCost)}</div>
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

        {/* GG COUPON MANAGER TAB GG */}
        {activeSubTab === 'coupons' && (
          <div className="space-y-8">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-text-primary flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-accent" />
                  <span>Coupon Manager</span>
                </h3>
                <p className="text-text-secondary text-xs mt-1">Create and manage influencer/creator promo codes.</p>
              </div>
              <button
                onClick={fetchCoupons}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-bg-elevated border border-border-premium text-text-secondary hover:text-text-primary hover:border-accent text-xs transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Create Coupon Form */}
            <div className="p-5 bg-bg-elevated border border-border-premium rounded-2xl space-y-4">
              <h4 className="font-display font-semibold text-sm text-text-primary flex items-center space-x-2">
                <Ticket className="w-4 h-4 text-accent" />
                <span>Create New Coupon</span>
              </h4>

              <form onSubmit={handleCreateCoupon} className="grid grid-cols-2 gap-3">
                {/* Code */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. BELVIA20"
                    value={couponFormCode}
                    onChange={e => setCouponFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-bg-base border border-border-premium rounded-xl p-2.5 text-xs font-mono text-text-primary focus:outline-none focus:border-accent placeholder:normal-case"
                  />
                </div>

                {/* Creator Name */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase">Creator / Influencer</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahim TechBD"
                    value={couponFormCreatedBy}
                    onChange={e => setCouponFormCreatedBy(e.target.value)}
                    className="w-full bg-bg-base border border-border-premium rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase">Discount Type *</label>
                  <select
                    value={couponFormType}
                    onChange={e => setCouponFormType(e.target.value as 'percent' | 'flat')}
                    className="w-full bg-bg-base border border-border-premium rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (a)</option>
                  </select>
                </div>

                {/* Value */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase">
                    Value * {couponFormType === 'percent' ? '(%)' : '(a)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={couponFormType === 'percent' ? '20' : '250'}
                    value={couponFormValue}
                    onChange={e => setCouponFormValue(e.target.value)}
                    className="w-full bg-bg-base border border-border-premium rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Max Uses */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase">Max Uses (blank = unlimited)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={couponFormMaxUses}
                    onChange={e => setCouponFormMaxUses(e.target.value)}
                    className="w-full bg-bg-base border border-border-premium rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Valid Until */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-text-secondary uppercase">Expires On (blank = no expiry)</label>
                  <input
                    type="datetime-local"
                    value={couponFormValidUntil}
                    onChange={e => setCouponFormValidUntil(e.target.value)}
                    className="w-full bg-bg-base border border-border-premium rounded-xl p-2.5 text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Feedback + Submit */}
                <div className="col-span-2 space-y-2">
                  {couponFormError && (
                    <p className="text-red-400 text-[10px] flex items-center space-x-1">
                      <CircleX className="w-3 h-3 shrink-0" /><span>{couponFormError}</span>
                    </p>
                  )}
                  {couponFormSuccess && (
                    <p className="text-green-400 text-[10px] flex items-center space-x-1">
                      <CircleCheck className="w-3 h-3 shrink-0" /><span>{couponFormSuccess}</span>
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isCreatingCoupon}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-text-on-accent font-bold text-xs cursor-pointer hover:from-accent-hover hover:to-accent-secondary-lt transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isCreatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
                    <span>{isCreatingCoupon ? 'Creating...' : 'Create Coupon'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Coupon List */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-text-primary font-display">Active Coupons ({coupons.length})</h4>

              {isCouponsLoading ? (
                <div className="flex items-center justify-center py-16 text-text-secondary">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-xs">Loading coupons...</span>
                </div>
              ) : coupons.length === 0 ? (
                <div className="py-16 text-center text-text-secondary text-xs">
                  <Tag className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>No coupons yet. Create one above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border-premium">
                  <table className="w-full text-xs font-mono">
                    <thead className="bg-bg-elevated border-b border-border-premium">
                      <tr>
                        <th className="p-3 text-left text-[10px] text-text-secondary uppercase tracking-wider">Code</th>
                        <th className="p-3 text-left text-[10px] text-text-secondary uppercase tracking-wider">Discount</th>
                        <th className="p-3 text-left text-[10px] text-text-secondary uppercase tracking-wider">Uses</th>
                        <th className="p-3 text-left text-[10px] text-text-secondary uppercase tracking-wider">Creator</th>
                        <th className="p-3 text-left text-[10px] text-text-secondary uppercase tracking-wider">Expires</th>
                        <th className="p-3 text-left text-[10px] text-text-secondary uppercase tracking-wider">Status</th>
                        <th className="p-3 text-right text-[10px] text-text-secondary uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-premium/50">
                      {coupons.map(coupon => {
                        const usePct = coupon.max_uses ? (coupon.uses_count / coupon.max_uses) * 100 : 0;
                        const isExpired = coupon.valid_until ? new Date(coupon.valid_until) < new Date() : false;
                        return (
                          <tr key={coupon.id} className={`transition hover:bg-bg-elevated/50 ${!coupon.is_active || isExpired ? 'opacity-50' : ''}`}>
                            {/* Code + creator */}
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-accent/10 border border-accent/20 rounded text-accent font-bold tracking-widest">{coupon.code}</span>
                            </td>

                            {/* Discount value */}
                            <td className="p-3 text-text-primary font-bold">
                              {coupon.type === 'percent' ? `${coupon.value}%` : `a${coupon.value}`}
                              <span className="ml-1 text-text-muted font-normal">{coupon.type === 'percent' ? 'off' : 'flat'}</span>
                            </td>

                            {/* Uses with progress bar */}
                            <td className="p-3">
                              <div className="space-y-1">
                                <span className="text-text-primary">
                                  {coupon.uses_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                                </span>
                                {coupon.max_uses && (
                                  <div className="w-20 h-1 bg-bg-base rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        usePct >= 100 ? 'bg-red-500' : usePct >= 80 ? 'bg-amber-500' : 'bg-accent'
                                      }`}
                                      style={{ width: `${Math.min(usePct, 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Creator */}
                            <td className="p-3 text-text-secondary">{coupon.created_by || 'G'}</td>

                            {/* Expiry */}
                            <td className="p-3">
                              {coupon.valid_until ? (
                                <span className={isExpired ? 'text-red-400' : 'text-text-secondary'}>
                                  {new Date(coupon.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-text-muted">No expiry</span>
                              )}
                            </td>

                            {/* Active toggle */}
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleCouponActive(coupon)}
                                className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition ${
                                  coupon.is_active && !isExpired
                                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-400'
                                }`}
                              >
                                {coupon.is_active && !isExpired ? <CircleCheck className="w-3 h-3" /> : <CircleX className="w-3 h-3" />}
                                <span>{coupon.is_active && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}</span>
                              </button>
                            </td>

                            {/* Delete */}
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteCoupon(coupon)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-400 transition"
                                title="Delete coupon permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
        {/* GG FESTIVAL DISCOUNTS TAB GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG */}
        {activeSubTab === 'festivals' && (
          <div className="space-y-6">
            {/* Revenue Discount Impact Dashboard */}
            {orders.length > 0 && (() => {
              const now = new Date();
              const thisMonth = orders.filter(o => {
                const d = new Date(o.createdAt || o.created_at || '');
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
              });
              const byType: Record<string, number> = { coupon: 0, festival: 0, loyalty: 0, new_user: 0 };
              let totalDisc = 0;
              for (const o of thisMonth) {
                const da = Number(o.discountAmount || o.discount_amount || 0);
                const dt = o.discountType || o.discount_type;
                if (da > 0 && dt && dt in byType) { byType[dt] += da; totalDisc += da; }
                else if (da > 0 && o.couponCode) { byType.coupon += da; totalDisc += da; }
              }
              if (totalDisc === 0) return null;
              return (
                <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-display font-black text-white">Discount Impact G This Month</h3>
                      <p className="text-gray-400 text-xs mt-0.5">Revenue offset by discount type</p>
                    </div>
                    <span className="font-mono text-lg font-black text-red-400">-a{totalDisc.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'coupon', label: 'Coupons', color: '#22c55e' },
                      { key: 'festival', label: 'Festivals', color: '#a855f7' },
                      { key: 'loyalty', label: 'Loyalty', color: '#d4af37' },
                      { key: 'new_user', label: 'New User', color: '#f59e0b' },
                    ].map(({ key, label, color }) => (
                      <div key={key} className="bg-bg-base rounded-xl p-3 border border-bg-elevated">
                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</div>
                        <div className="font-black text-sm" style={{ color }}>-a{(byType[key] || 0).toLocaleString()}</div>
                        <div className="mt-1.5 h-1 bg-bg-elevated rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${totalDisc > 0 ? Math.round((byType[key]/totalDisc)*100) : 0}%`, background: color }} />
                        </div>
                        <div className="text-[9px] font-mono text-gray-600 mt-0.5">
                          {totalDisc > 0 ? Math.round((byType[key]/totalDisc)*100) : 0}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Create / Edit Festival Form */}
            <div className="bg-[#070b13] border border-bg-elevated rounded-2xl p-6">
              <h3 className="font-display font-black text-white mb-4">
                {festEditId ? 'Gn+ Edit Festival' : 'n+ Create Festival Discount'}
              </h3>
              <form onSubmit={handleCreateFestival} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Festival Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eid Sale 2026"
                    value={festFormName}
                    onChange={e => setFestFormName(e.target.value)}
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Discount % *</label>
                  <input
                    type="number"
                    required
                    min="1" max="100"
                    placeholder="e.g. 20"
                    value={festFormPercent}
                    onChange={e => setFestFormPercent(e.target.value)}
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Category (blank = site-wide)</label>
                  <select
                    value={festFormCategory}
                    onChange={e => setFestFormCategory(e.target.value)}
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:outline-none text-xs font-mono"
                  >
                    <option value="">Site-wide (all categories)</option>
                    {['Keychains','Home Decor','Desk Accessories','Gaming Accessories','Figures & Collectibles','Business Merchandise','Custom Orders','Functional Prints'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={festFormStart}
                    onChange={e => setFestFormStart(e.target.value)}
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={festFormEnd}
                    onChange={e => setFestFormEnd(e.target.value)}
                    className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-bg-elevated focus:border-accent focus:outline-none text-xs font-mono"
                  />
                </div>
                {festFormError && (
                  <p className="md:col-span-2 text-red-400 text-[11px] font-mono">{festFormError}</p>
                )}
                {festFormSuccess && (
                  <p className="md:col-span-2 text-green-400 text-[11px] font-mono">{festFormSuccess}</p>
                )}
                <div className="md:col-span-2 flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={isCreatingFestival}
                    className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-secondary text-text-on-accent font-black text-xs rounded-xl font-mono cursor-pointer disabled:opacity-50 transition"
                  >
                    {isCreatingFestival ? 'Saving...' : festEditId ? 'Update Festival' : 'Create Festival'}
                  </button>
                  {festEditId && (
                    <button
                      type="button"
                      onClick={() => { setFestEditId(null); setFestFormName(''); setFestFormPercent(''); setFestFormCategory(''); setFestFormStart(''); setFestFormEnd(''); setFestFormError(''); setFestFormSuccess(''); }}
                      className="px-4 py-2.5 border border-bg-elevated text-gray-400 hover:text-white font-mono text-xs rounded-xl cursor-pointer transition"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Festival List */}
            <div className="bg-[#070b13] border border-bg-elevated rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-bg-elevated flex items-center justify-between">
                <h3 className="font-display font-black text-white">Festival Discounts ({festivals.length})</h3>
                <button onClick={fetchFestivals} className="text-[10px] font-mono text-gray-400 hover:text-accent cursor-pointer transition">
                  G+ Refresh
                </button>
              </div>
              {isFestivalsLoading ? (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">Loading festivals...</div>
              ) : festivals.length === 0 ? (
                <div className="p-8 text-center text-gray-500 font-mono text-xs">No festival discounts created yet.</div>
              ) : (
                <div className="divide-y divide-bg-elevated">
                  {festivals.map((fest) => {
                    const now = new Date();
                    const start = new Date(fest.start_date);
                    const end = new Date(fest.end_date);
                    const isLive = fest.is_active && start <= now && end > now;
                    const isUpcoming = fest.is_active && start > now;
                    const isEnded = end <= now;
                    const statusColor = isLive ? '#22c55e' : isUpcoming ? '#f59e0b' : '#6b7280';
                    const statusLabel = isLive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'ENDED';
                    return (
                      <div key={fest.id} className="px-6 py-4 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center space-x-2">
                            <span className="font-display font-bold text-white">{fest.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black" style={{ background: statusColor + '22', color: statusColor }}>
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono text-accent font-bold">{fest.percent}% OFF</span>
                            <span className="text-[10px] font-mono text-gray-500">{fest.category || 'Site-wide'}</span>
                            <span className="text-[10px] font-mono text-gray-600">
                              {new Date(fest.start_date).toLocaleDateString()} G {new Date(fest.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => handleToggleFestivalActive(fest)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition ${
                              fest.is_active
                                ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                                : 'bg-bg-surface border-bg-elevated text-gray-500 hover:border-accent hover:text-accent'
                            }`}
                          >
                            {fest.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => handleEditFestival(fest)}
                            className="px-3 py-1 rounded-lg text-[10px] font-mono border border-bg-elevated text-gray-400 hover:text-accent hover:border-accent cursor-pointer transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFestival(fest)}
                            className="px-3 py-1 rounded-lg text-[10px] font-mono border border-bg-elevated text-gray-400 hover:text-red-400 hover:border-red-500/30 cursor-pointer transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* GG FILAMENTS & STOCK TAB GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG */}
        {activeSubTab === 'filaments' && !editingProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Spool Form & Accessories Form */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Spool Creator Form */}
                <div className="bg-[#070b13] border border-border-premium rounded-2xl p-6 space-y-4">
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    n+ Add Filament Spool
                  </h3>
                  <form onSubmit={handleCreateSpool} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Spool Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. PLA Black"
                        value={spoolName}
                        onChange={e => setSpoolName(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Type *</label>
                        <select
                          value={spoolType}
                          onChange={e => setSpoolType(e.target.value)}
                          className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:outline-none"
                        >
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="TPU">TPU</option>
                          <option value="Resin">Resin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Color</label>
                        <input
                          type="text"
                          placeholder="e.g. matte-black"
                          value={spoolColor}
                          onChange={e => setSpoolColor(e.target.value)}
                          className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Brand</label>
                        <input
                          type="text"
                          placeholder="e.g. Bambu Lab"
                          value={spoolBrand}
                          onChange={e => setSpoolBrand(e.target.value)}
                          className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Spool Weight (Grams)</label>
                        <input
                          type="number"
                          required
                          value={spoolWeight}
                          onChange={e => setSpoolWeight(e.target.value)}
                          className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Purchase Price (BDT) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 1200"
                        value={spoolPrice}
                        onChange={e => setSpoolPrice(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Notes</label>
                      <textarea
                        placeholder="e.g. Spool #3, purchased from local distributor"
                        value={spoolNotes}
                        onChange={e => setSpoolNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none resize-none"
                      />
                    </div>
                    {spoolError && <p className="text-red-400 font-mono text-[10px]">{spoolError}</p>}
                    {spoolSuccess && <p className="text-green-400 font-mono text-[10px]">{spoolSuccess}</p>}
                    <button
                      type="submit"
                      disabled={isCreatingSpool}
                      className="w-full py-2.5 rounded-xl bg-accent-secondary hover:bg-accent text-white font-bold transition disabled:opacity-50"
                    >
                      {isCreatingSpool ? 'Adding...' : 'Add Filament Spool'}
                    </button>
                  </form>
                </div>

                {/* Accessory Creator / Editor Form */}
                <div className="bg-[#070b13] border border-border-premium rounded-2xl p-6 space-y-4">
                  <h3 className="font-display font-black text-white text-sm uppercase tracking-wider">
                    n+ Create / Update Accessory
                  </h3>
                  <form onSubmit={handleSaveAccessory} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Accessory Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Keychain Ring"
                        value={accFormName}
                        onChange={e => setAccFormName(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Unit *</label>
                        <select
                          value={accFormUnit}
                          onChange={e => setAccFormUnit(e.target.value)}
                          className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:outline-none"
                        >
                          <option value="piece">piece</option>
                          <option value="ml">ml</option>
                          <option value="gram">gram</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Cost Per Unit (BDT) *</label>
                        <input
                          type="number"
                          step="any"
                          required
                          placeholder="e.g. 5"
                          value={accFormCost}
                          onChange={e => setAccFormCost(e.target.value)}
                          className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 tracking-widest mb-1">Stock Count</label>
                      <input
                        type="number"
                        required
                        value={accFormStock}
                        onChange={e => setAccFormStock(e.target.value)}
                        className="w-full bg-bg-base text-gray-200 px-3 py-2 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                    {accFormError && <p className="text-red-400 font-mono text-[10px]">{accFormError}</p>}
                    {accFormSuccess && <p className="text-green-400 font-mono text-[10px]">{accFormSuccess}</p>}
                    <button
                      type="submit"
                      disabled={isSavingAccessory}
                      className="w-full py-2.5 rounded-xl bg-accent-secondary hover:bg-accent text-white font-bold transition disabled:opacity-50"
                    >
                      {isSavingAccessory ? 'Saving...' : 'Save Accessory'}
                    </button>
                  </form>
                </div>

              </div>

              {/* Filament List Table & Accessories List Table */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Spools Inventory table */}
                <div className="bg-[#070b13] border border-border-premium rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border-premium flex items-center justify-between">
                    <h3 className="font-display font-black text-white">Filament Spools</h3>
                    <button onClick={fetchFilaments} className="text-[10px] font-mono text-gray-400 hover:text-accent cursor-pointer transition">
                      G+ Refresh
                    </button>
                  </div>
                  {isFilamentsLoading ? (
                    <div className="p-8 text-center text-gray-400 font-mono text-xs">Loading spools...</div>
                  ) : (
                    <div className="overflow-x-auto bg-bg-base">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10px]">
                            <th className="p-3">Spool Name</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Color</th>
                            <th className="p-3">Brand</th>
                            <th className="p-3">Grams Remaining</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-premium text-text-secondary">
                          {filaments.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-text-muted italic">No filament spools registered.</td>
                            </tr>
                          ) : (
                            filaments.map(s => (
                              <tr key={s.id} className={`hover:bg-bg-elevated/40 ${s.is_empty ? 'opacity-50' : ''}`}>
                                <td className="p-3 font-bold text-text-primary">{s.name}</td>
                                <td className="p-3">{s.type}</td>
                                <td className="p-3">{s.color || 'G'}</td>
                                <td className="p-3">{s.brand || 'G'}</td>
                                <td className="p-3">
                                  {s.is_empty ? '0g' : `${s.grams_remaining}g / ${s.spool_weight_grams}g`}
                                </td>
                                <td className="p-3 text-accent font-bold">a{s.purchase_price_bdt}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.is_empty ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                    {s.is_empty ? 'EMPTY' : 'ACTIVE'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex space-x-2">
                                    {!s.is_empty && (
                                      <button
                                        onClick={() => handleMarkSpoolEmpty(s.id)}
                                        className="px-2 py-1 rounded bg-orange-500/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 text-[10px] transition cursor-pointer"
                                      >
                                        Mark Empty
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteSpool(s.id)}
                                      className="p-1 rounded hover:bg-red-500/10 text-text-muted hover:text-red-400 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Weighted Average Cost per gram for each unique filament name */}
                <div className="bg-[#070b13] border border-border-premium rounded-2xl p-6 space-y-4">
                  <h4 className="font-display font-bold text-sm text-text-primary uppercase tracking-wider">
                    Weighted Average Cost per Gram
                  </h4>
                  <p className="text-text-secondary text-xs">
                    These are the calculated weighted averages used as input costs in floor pricing.
                  </p>
                  <div className="overflow-x-auto border border-border-premium rounded-xl bg-bg-base">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10px]">
                          <th className="p-3">Filament Name</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Color</th>
                          <th className="p-3">Brand</th>
                          <th className="p-3">Active Spools</th>
                          <th className="p-3">Cost per Gram</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-premium text-text-secondary">
                        {(() => {
                          const activeSpools = filaments.filter(s => !s.is_empty);
                          const groups: Record<string, { totalCost: number; totalWeight: number; type: string; color: string; brand: string; count: number }> = {};
                          activeSpools.forEach(s => {
                            if (!groups[s.name]) {
                              groups[s.name] = { totalCost: 0, totalWeight: 0, type: s.type, color: s.color || '', brand: s.brand || '', count: 0 };
                            }
                            groups[s.name].totalCost += Number(s.purchase_price_bdt);
                            groups[s.name].totalWeight += Number(s.spool_weight_grams);
                            groups[s.name].count += 1;
                          });

                          const entries = Object.entries(groups);
                          if (entries.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="p-3 text-center text-text-muted italic">No active spools to compute averages.</td>
                              </tr>
                            );
                          }

                          return entries.map(([name, data]) => {
                            const costPerGram = data.totalWeight > 0 ? (data.totalCost / data.totalWeight) : 0;
                            return (
                              <tr key={name} className="hover:bg-bg-elevated/40">
                                <td className="p-3 font-bold text-text-primary">{name}</td>
                                <td className="p-3">{data.type}</td>
                                <td className="p-3">{data.color || 'G'}</td>
                                <td className="p-3">{data.brand || 'G'}</td>
                                <td className="p-3">{data.count}</td>
                                <td className="p-3 text-accent font-bold">a{costPerGram.toFixed(3)}/g</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accessories stock count & cost manager */}
                <div className="bg-[#070b13] border border-border-premium rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-border-premium flex items-center justify-between">
                    <h3 className="font-display font-black text-white">Accessories Inventory</h3>
                    <button onClick={fetchAccessories} className="text-[10px] font-mono text-gray-400 hover:text-accent cursor-pointer transition">
                      G+ Refresh
                    </button>
                  </div>
                  {isAccessoriesLoading ? (
                    <div className="p-8 text-center text-gray-400 font-mono text-xs">Loading accessories...</div>
                  ) : (
                    <div className="overflow-x-auto bg-bg-base">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10px]">
                            <th className="p-3">Accessory Name</th>
                            <th className="p-3">Unit</th>
                            <th className="p-3">Cost per Unit</th>
                            <th className="p-3">Stock Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-premium text-text-secondary">
                          {accessories.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-6 text-center text-text-muted italic">No accessories registered.</td>
                            </tr>
                          ) : (
                            accessories.map(a => (
                              <tr
                                key={a.id}
                                onClick={() => {
                                  setAccFormName(a.name);
                                  setAccFormUnit(a.unit);
                                  setAccFormCost(String(a.cost_per_unit_bdt));
                                  setAccFormStock(String(a.stock_count));
                                }}
                                className="hover:bg-bg-elevated/40 cursor-pointer"
                                title="Click to edit accessory details"
                              >
                                <td className="p-3 font-bold text-text-primary">{a.name}</td>
                                <td className="p-3">{a.unit}</td>
                                <td className="p-3 text-accent font-bold">a{a.cost_per_unit_bdt}</td>
                                <td className="p-3">{a.stock_count}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* GG PRICE HEALTH TAB GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG */}
        {activeSubTab === 'pricehealth' && !editingProduct && (
          <div className="space-y-6">
            <div className="bg-[#070b13] border border-border-premium rounded-2xl p-6 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4 mb-4">
                <div className="text-left font-mono">
                  <h3 className="font-display font-extrabold text-base text-text-primary uppercase tracking-wide">
                    Gn+ Price Health Dashboard
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Products flagged with <span className="text-orange-400 font-bold">needs_price_review = true</span> (selling price is below the recommended floor price).
                  </p>
                </div>
                {products.some(p => p.needs_price_review) && (
                  <button
                    onClick={handleBulkUpdateToRecommended}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition border-0 cursor-pointer"
                  >
                    Bulk Update All Flagged
                  </button>
                )}
              </div>

              <div className="overflow-x-auto bg-bg-base border border-border-premium rounded-xl">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-bg-surface border-b border-border-premium text-text-secondary uppercase tracking-wider text-[10px]">
                      <th className="p-3">SKU / ID</th>
                      <th className="p-3">Product Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Current Price</th>
                      <th className="p-3">Recommended Floor</th>
                      <th className="p-3">Margin Gap</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-premium text-text-secondary">
                    {(() => {
                      const flagged = products.filter(p => p.needs_price_review);
                      if (flagged.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-green-400 font-bold">
                              G All products are financially healthy! No price updates required.
                            </td>
                          </tr>
                        );
                      }
                      return flagged.map(p => {
                        const gap = (p.floor_price_bdt || 0) - p.price;
                        return (
                          <tr key={p.id} className="hover:bg-bg-elevated/40">
                            <td className="p-3 font-bold text-accent">{p.id}</td>
                            <td className="p-3 font-sans font-bold text-text-primary">{p.title}</td>
                            <td className="p-3">{p.category}</td>
                            <td className="p-3 text-red-400 font-bold">a{p.price}</td>
                            <td className="p-3 text-green-400 font-bold">a{p.floor_price_bdt}</td>
                            <td className="p-3 text-orange-400 font-bold">a{gap} below floor</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleUpdateToRecommended(p)}
                                className="px-3 py-1 rounded bg-accent-secondary hover:bg-accent text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Set to Recommended
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* GG STORE SETTINGS TAB GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG */}
        {activeSubTab === 'settings' && !editingProduct && (
          <div className="space-y-6">
            <div className="bg-[#070b13] border border-border-premium rounded-2xl p-6">
              <h3 className="font-display font-black text-white text-base mb-4 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-accent" />
                <span>Store Settings</span>
              </h3>
              <p className="text-text-secondary text-xs mb-6">
                Edit global pricing engine variables. These settings are applied when calculating product floor prices if specific override margin settings are not set.
              </p>

              {isSettingsLoading ? (
                <div className="p-8 text-center text-gray-400 font-mono text-xs">Loading settings...</div>
              ) : (
                <form onSubmit={handleSaveHubSettings} className="space-y-4 max-w-xl text-xs text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                        Default Profit Margin (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        required
                        value={hubSettings.default_target_margin || ''}
                        onChange={e => setHubSettings({ ...hubSettings, default_target_margin: e.target.value })}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                        Platform Referral Fee (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={hubSettings.platform_fee_percent || ''}
                        onChange={e => setHubSettings({ ...hubSettings, platform_fee_percent: e.target.value })}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                        Electricity Cost (a/hr)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={hubSettings.electricity_cost_per_hour || ''}
                        onChange={e => setHubSettings({ ...hubSettings, electricity_cost_per_hour: e.target.value })}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                        Printer Depreciation (a/hr)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={hubSettings.depreciation_cost_per_hour || ''}
                        onChange={e => setHubSettings({ ...hubSettings, depreciation_cost_per_hour: e.target.value })}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">
                        Flat Packaging Cost (a)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={hubSettings.packaging_cost_flat || ''}
                        onChange={e => setHubSettings({ ...hubSettings, packaging_cost_flat: e.target.value })}
                        className="w-full bg-bg-base text-gray-200 px-3.5 py-2.5 rounded-xl border border-border-premium focus:border-accent focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  {settingsError && <p className="text-red-400 font-mono">{settingsError}</p>}
                  {settingsSuccess && <p className="text-green-400 font-mono">{settingsSuccess}</p>}

                  <button
                    type="submit"
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 bg-accent-secondary hover:bg-accent text-white font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeSubTab === 'support-logs' && !editingProduct && (
          <div className="space-y-6">
            <div className="bg-[#070b13] border border-border-premium rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-premium pb-4 mb-6">
                <div className="text-left font-mono">
                  <h3 className="font-display font-black text-white text-base flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-accent" />
                    <span>Unmatched Customer Support Queries</span>
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-1">
                    TOTAL LOGGED FAILURES: <span className="text-accent font-bold">{unmatchedQuestions.length}</span> ITEMS
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={fetchUnmatchedQuestions}
                    disabled={isUnmatchedLoading}
                    className="px-3.5 py-2 rounded-lg bg-bg-surface border border-border-premium hover:border-gray-500 text-text-primary text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                  >
                    Refresh Logs
                  </button>
                  <button
                    onClick={handleClearUnmatched}
                    disabled={isUnmatchedLoading || unmatchedQuestions.length === 0}
                    className="px-3.5 py-2 rounded-lg bg-red-950/15 border border-red-500/20 text-red-400 hover:bg-red-950/30 text-xs font-semibold cursor-pointer disabled:opacity-50 transition"
                  >
                    Clear All Logs
                  </button>
                </div>
              </div>

              {unmatchedError && (
                <div className="p-4 bg-red-950/15 border border-red-500/20 text-red-400 font-mono text-xs rounded-xl mb-4 text-left">
                  {unmatchedError}
                </div>
              )}

              {unmatchedSuccess && (
                <div className="p-4 bg-green-950/15 border border-green-500/20 text-green-400 font-mono text-xs rounded-xl mb-4 text-left">
                  {unmatchedSuccess}
                </div>
              )}

              {isUnmatchedLoading ? (
                <div className="py-12 text-center text-text-muted font-mono text-xs flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
                  <span>Fetching unmatched support query logs from server...</span>
                </div>
              ) : unmatchedQuestions.length === 0 ? (
                <div className="py-16 text-center text-text-muted border border-dashed border-border-premium rounded-xl text-xs space-y-2">
                  <CheckCircle className="w-8 h-8 text-green-500/40 mx-auto" />
                  <p className="font-bold text-text-primary">No unmatched questions logged!</p>
                  <p className="max-w-xs mx-auto text-[11px] leading-relaxed">
                    The support chatbot has matched all customer queries, or the logs have been cleared.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border-premium rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-bg-elevated/45 text-[10px] font-mono text-text-secondary uppercase tracking-wider border-b border-border-premium">
                        <th className="p-3 w-40">Timestamp</th>
                        <th className="p-3 w-32">Log ID</th>
                        <th className="p-3">Unmatched Customer Query</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-premium text-text-secondary">
                      {unmatchedQuestions.map((q) => (
                        <tr key={q.id} className="hover:bg-bg-elevated/20 font-mono text-[11px]">
                          <td className="p-3 text-text-muted">
                            {new Date(q.timestamp).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="p-3 text-accent font-bold">{q.id}</td>
                          <td className="p-3 font-sans text-xs text-text-primary bg-bg-base/30 whitespace-pre-wrap leading-relaxed">
                            {q.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

    </section>

  );
}
