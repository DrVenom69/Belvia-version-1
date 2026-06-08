import React, { useState, useRef } from 'react';
import { X, Trash2, ShoppingBag, ShieldCheck, Zap, Copy, Check, Upload, ArrowLeft, Loader, AlertCircle } from 'lucide-react';
import { CartItem, Order } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, color: string, material: string, newQty: number) => void;
  onRemoveItem: (productId: string, color: string, material: string) => void;
  onClearCart: () => void;
}

type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  
  // Shipping Form States
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | ''>('');
  const [trxId, setTrxId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  // Form submission / UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const totalCost = cart.reduce((acc, item) => acc + (item.calculatedPrice ?? item.product.price) * item.quantity, 0);
  const totalWeight = cart.reduce((acc, item) => acc + item.product.weightGrams * item.quantity, 0);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToShipping = () => {
    if (cart.length === 0) return;
    setStep('shipping');
  };

  const handleGenerateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim()) {
      setErrorMsg('Please fill in all shipping details.');
      return;
    }
    setErrorMsg('');
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const generatedId = `BLV-ORD-${randomDigits}`;
    setOrderId(generatedId);
    setStep('payment');
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      setErrorMsg('Please select a payment method.');
      return;
    }
    if (!trxId.trim()) {
      setErrorMsg('Please enter the Transaction ID (TRX ID).');
      return;
    }
    if (!screenshotFile) {
      setErrorMsg('Please upload a screenshot of your payment receipt.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      reader.readAsDataURL(screenshotFile);
      const base64Data = await base64Promise;

      // 2. Upload image to the server
      const fileExt = screenshotFile.name.split('.').pop() || 'png';
      const uploadRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `${orderId}_payment.${fileExt}`,
          base64Data,
          directory: 'payments'
        })
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload screenshot to server.');
      }

      const uploadResult = await uploadRes.json();
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Image upload failed.');
      }

      const screenshotUrl = uploadResult.imagePath;

      // 3. Create order structure
      const newOrder: Order = {
        id: orderId,
        items: cart,
        totalCost,
        totalWeight,
        shippingInfo: {
          name: shippingName.trim(),
          phone: shippingPhone.trim(),
          address: shippingAddress.trim()
        },
        payment: {
          method: paymentMethod,
          trxId: trxId.trim().toUpperCase(),
          screenshotUrl,
          submittedAt: new Date().toISOString()
        },
        status: 'Paid',
        createdAt: new Date().toISOString()
      };

      // 4. Fetch current orders
      const getOrdersRes = await fetch('/api/get-orders');
      if (!getOrdersRes.ok) {
        throw new Error('Failed to retrieve order history.');
      }
      const existingOrders: Order[] = await getOrdersRes.json();

      // 5. Append and Save
      const updatedOrders = [newOrder, ...existingOrders];
      const saveOrdersRes = await fetch('/api/save-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrders)
      });

      if (!saveOrdersRes.ok) {
        throw new Error('Failed to save order details.');
      }

      // 6. Finalize Success
      setCheckoutSuccess(orderId);
      setStep('success');
      onClearCart();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during order checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('cart');
    setCheckoutSuccess(null);
    setShippingName('');
    setShippingPhone('');
    setShippingAddress('');
    setPaymentMethod('');
    setTrxId('');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setErrorMsg('');
  };

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 overflow-hidden bg-bg-surface/65 backdrop-blur-xs flex justify-end">
      
      {/* Drawer box sliding in */}
      <div id="cart-drawer-container" className="w-full max-w-md bg-bg-base border-l border-bg-elevated h-full flex flex-col justify-between shadow-2xl relative text-left">
        
        {/* Header content */}
        <div className="p-4 border-b border-bg-elevated flex items-center justify-between">
          <div className="flex items-center space-x-2 text-text-primary">
            {step !== 'cart' && step !== 'success' && (
              <button 
                onClick={() => setStep(step === 'payment' ? 'shipping' : 'cart')}
                className="p-1 hover:bg-bg-surface rounded text-text-secondary hover:text-text-primary mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <ShoppingBag className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-base">
              {step === 'cart' && 'Belvia Print Queue Cart'}
              {step === 'shipping' && 'Shipping Details'}
              {step === 'payment' && 'Manual Payment'}
              {step === 'success' && 'Order Received'}
            </span>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            className="p-1 px-2 text-text-secondary hover:text-text-primary rounded hover:bg-bg-surface transition cursor-pointer font-mono text-sm"
          >
            [CLOSE]
          </button>
        </div>

        {/* Dynamic Step Layouts */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {errorMsg && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'cart' && (
            <div className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-24 space-y-3">
                  <div className="w-12 h-12 bg-bg-surface border border-border-premium rounded-full flex items-center justify-center mx-auto text-text-muted">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <p className="text-text-secondary text-xs font-mono">Additive cart queue is empty.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedMaterial}-${idx}`}
                    className="p-3 bg-bg-elevated border border-border-premium rounded-xl flex space-x-3 text-left hover:border-accent transition"
                  >
                    {/* Thumbnail of product */}
                    <div className="w-16 h-16 bg-bg-surface rounded-lg overflow-hidden shrink-0">
                      <img referrerPolicy="no-referrer" src={item.customPreviewUrl || item.product.images[0]} alt="Cart thumb" className="w-full h-full object-cover" />
                    </div>

                    {/* Specifications detail text */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary leading-tight line-clamp-1">
                          {item.product.title}
                        </h4>
                        
                        {/* Custom configuration attributes */}
                        <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px] text-text-secondary">
                          <span className="px-1 bg-bg-base border border-bg-elevated rounded">Color: {item.selectedColor}</span>
                          <span className="px-1 bg-bg-base border border-bg-elevated rounded">Material: {item.selectedMaterial}</span>
                          {item.customization && (
                            <>
                              <span className="px-1 bg-bg-base border border-bg-elevated rounded">Name: {item.customization.name}</span>
                              <span className="px-1 bg-bg-base border border-bg-elevated rounded">Font: {item.customization.font}</span>
                              <span className="px-1 bg-bg-base border border-bg-elevated rounded">Size: {item.customization.size}</span>
                              <span className="px-1 bg-bg-base border border-bg-elevated rounded">Theme: {item.customization.theme}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pricing, Quantity adjust bars */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-premium">
                        <span className="font-mono text-xs font-bold text-accent">
                          ${((item.calculatedPrice ?? item.product.price) * item.quantity).toFixed(2)}
                        </span>

                        <div className="flex items-center space-x-2.5">
                          {/* Qtys switcher */}
                          <div className="flex items-center bg-bg-base border border-bg-elevated rounded-lg p-0.5 text-[10px]">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQty(item.product.id, item.selectedColor, item.selectedMaterial, item.quantity - 1);
                                }
                              }}
                              className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary"
                            >
                              -
                            </button>
                            <span className="w-6 font-mono text-center text-text-primary">{item.quantity}</span>
                            <button
                              onClick={() => {
                                onUpdateQty(item.product.id, item.selectedColor, item.selectedMaterial, item.quantity + 1);
                              }}
                              className="w-5 h-5 flex items-center justify-center text-text-secondary hover:text-text-primary"
                            >
                              +
                            </button>
                          </div>

                          {/* Delete from cart */}
                          <button
                            onClick={() => onRemoveItem(item.product.id, item.selectedColor, item.selectedMaterial)}
                            className="p-1 px-1.5 rounded hover:bg-red-500/10 text-red-400 hover:text-red-300 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {step === 'shipping' && (
            <form onSubmit={handleGenerateOrder} className="space-y-4">
              <p className="text-text-secondary text-xs leading-relaxed mb-4">
                Please enter your shipping information below. This is required for physical courier delivery of your manufactured prints.
              </p>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-text-secondary uppercase">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Maik Operator"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-premium rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-text-secondary uppercase">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  placeholder="e.g. +8801712345678"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-premium rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-text-secondary uppercase">Full Delivery Address</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="e.g. House 44, Road 11, Banani, Dhaka"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-bg-elevated border border-border-premium rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent font-bold text-xs cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg"
              >
                <span>Generate Order &amp; Pay</span>
              </button>
            </form>
          )}

          {step === 'payment' && (
            <form onSubmit={handleSubmitProof} className="space-y-5">
              
              {/* Order overview box */}
              <div className="p-3 bg-bg-elevated border border-border-premium rounded-xl text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-text-secondary">
                  <span>Order Reference:</span>
                  <span className="text-accent font-bold">{orderId}</span>
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Total Mass:</span>
                  <span className="text-text-primary">{totalWeight}g</span>
                </div>
                <div className="flex justify-between text-base font-bold text-text-primary pt-1 border-t border-border-premium/50">
                  <span>Total Due:</span>
                  <span className="text-accent">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment selector */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-text-secondary uppercase">Select Mobile Wallet</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('bKash');
                      setErrorMsg('');
                    }}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs cursor-pointer transition flex items-center justify-center space-x-2 ${
                      paymentMethod === 'bKash'
                        ? 'bg-[#e2126b]/15 border-[#e2126b] text-[#e2126b] font-black'
                        : 'bg-bg-elevated border-border-premium text-text-secondary hover:border-accent'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e2126b]"></span>
                    <span>bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('Nagad');
                      setErrorMsg('');
                    }}
                    className={`py-3 px-4 rounded-xl border font-bold text-xs cursor-pointer transition flex items-center justify-center space-x-2 ${
                      paymentMethod === 'Nagad'
                        ? 'bg-[#f54c14]/15 border-[#f54c14] text-[#f54c14] font-black'
                        : 'bg-bg-elevated border-border-premium text-text-secondary hover:border-accent'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f54c14]"></span>
                    <span>Nagad</span>
                  </button>
                </div>
              </div>

              {/* Instruction Panel */}
              {paymentMethod && (
                <div className="p-4 rounded-xl bg-bg-surface border border-accent/20 space-y-3">
                  <h4 className="text-xs font-bold text-text-primary">
                    How to pay via {paymentMethod}:
                  </h4>
                  
                  <ol className="text-text-secondary text-[11px] list-decimal pl-4 space-y-1.5 leading-relaxed">
                    <li>Open your {paymentMethod} app or dial USSD.</li>
                    <li>Go to <strong>Send Money</strong>.</li>
                    <li>Enter the personal account number below:</li>
                  </ol>

                  {/* Copy box */}
                  <div className="flex items-center justify-between p-2.5 bg-bg-base border border-border-premium rounded-xl font-mono text-xs text-text-primary">
                    <span className="font-bold">
                      {paymentMethod === 'bKash' ? '01712-345678' : '01812-345678'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(paymentMethod === 'bKash' ? '01712345678' : '01812345678')}
                      className="text-accent hover:text-accent-hover p-1 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedText ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[9px] uppercase font-bold">{copiedText ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-text-secondary italic">
                    *Please make sure to pay the exact amount. Once completed, enter the transaction details below.
                  </p>
                </div>
              )}

              {/* Proof fields */}
              {paymentMethod && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase">Transaction ID (TRX ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BKX9283749823"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full bg-bg-elevated border border-border-premium rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-text-secondary uppercase">Upload Receipt Screenshot</label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-bg-elevated hover:bg-bg-surface border border-dashed border-border-premium hover:border-accent rounded-xl p-4 transition flex flex-col items-center justify-center space-y-2 cursor-pointer"
                    >
                      {screenshotPreview ? (
                        <div className="relative w-full max-h-36 overflow-hidden rounded-lg">
                          <img src={screenshotPreview} alt="Payment proof preview" className="w-full h-full object-contain mx-auto" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition text-white text-[10px] font-bold">
                            Change Image
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 text-text-secondary" />
                          <span className="text-[11px] text-text-secondary font-mono uppercase">Click to Select screenshot file</span>
                          <span className="text-[9px] text-text-muted">PNG, JPG up to 10MB</span>
                        </>
                      )}
                    </button>
                    {screenshotFile && (
                      <div className="text-[10px] text-text-secondary font-mono text-center truncate pt-1">
                        Selected: {screenshotFile.name} ({(screenshotFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent font-bold text-xs cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin text-text-on-accent" />
                        <span>Verifying &amp; Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-current text-text-on-accent animate-pulse" />
                        <span>Submit Proof &amp; Queue Order</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          {step === 'success' && checkoutSuccess && (
            <div className="p-8 text-center flex flex-col justify-center items-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-2">
                <ShieldCheck className="w-9 h-9 text-green-400 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display font-black text-xl text-text-primary">Order Placed Successfully</h3>
                <p className="text-text-secondary text-xs">Your manual payment proof has been submitted. Order reference:</p>
                <div className="inline-block px-3 py-1.5 rounded bg-bg-surface border border-border-premium text-xs font-mono font-bold text-accent mt-2">
                  {checkoutSuccess}
                </div>
              </div>

              <p className="text-text-secondary text-xs leading-relaxed">
                Your payment is currently <strong>Awaiting Verification</strong> by the Belvia administration. 
                Once verified, your designs will be dispatched to our print bays. 
                You can track your real-time nozzle telemetry and print milestones inside the <strong>Track Order</strong> tab.
              </p>

              <button
                onClick={handleReset}
                className="px-6 py-2.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-text-on-accent font-semibold text-xs cursor-pointer transition shadow"
              >
                Continue Browsing Models
              </button>
            </div>
          )}

        </div>

        {/* Calculations / Total Bar shown on step 'cart' only */}
        {step === 'cart' && cart.length > 0 && (
          <div className="p-4 bg-bg-surface border-t border-border-premium space-y-3 font-mono text-xs">
            <div className="space-y-1.5 text-text-secondary">
              <div className="flex justify-between">
                <span>Model Count:</span>
                <span className="text-text-primary">{cart.length} unique shapes</span>
              </div>
              <div className="flex justify-between">
                <span>Plastics Mass (Volume weight):</span>
                <span className="text-text-primary">{totalWeight} grams</span>
              </div>
              <div className="flex justify-between">
                <span>Print Farm Electricity Power:</span>
                <span className="text-accent">FREE Promo</span>
              </div>
            </div>

            <div className="border-t border-border-premium pt-2.5 flex justify-between text-base font-bold text-text-primary">
              <span>Queue Quotation Total:</span>
              <span className="text-accent">${totalCost.toFixed(2)}</span>
            </div>

            <button
              id="checkout-trigger-btn"
              onClick={handleProceedToShipping}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent font-bold text-xs cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-text-on-accent animate-pulse" />
              <span>Proceed to Checkout</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
