import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ShieldCheck, Zap, ReceiptText, Clock } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (productId: string, color: string, material: string, newQty: number) => void;
  onRemoveItem: (productId: string, color: string, material: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string>('');

  if (!isOpen) return null;

  const totalCost = cart.reduce((acc, item) => acc + (item.calculatedPrice ?? item.product.price) * item.quantity, 0);
  const totalWeight = cart.reduce((acc, item) => acc + item.product.weightGrams * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const tracking = 'BLV-SHIP-' + Math.floor(100000 + Math.random() * 900000);
    setTrackingCode(tracking);
    setCheckoutSuccess(tracking);
    onClearCart();
  };

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 overflow-hidden bg-bg-surface/65 backdrop-blur-xs flex justify-end">
      
      {/* Drawer box sliding in */}
      <div id="cart-drawer-container" className="w-full max-w-md bg-bg-base border-l border-bg-elevated h-full flex flex-col justify-between shadow-2xl relative text-left">
        
        {/* Header content */}
        <div className="p-4 border-b border-bg-elevated flex items-center justify-between">
          <div className="flex items-center space-x-2 text-text-primary">
            <ShoppingBag className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-base">Belvia Print Queue Cart</span>
          </div>
          <button
            id="close-cart-btn"
            onClick={onClose}
            className="p-1 px-2 text-text-secondary hover:text-text-primary rounded hover:bg-bg-surface transition cursor-pointer font-mono text-sm"
          >
            [CLOSE]
          </button>
        </div>

        {checkoutSuccess ? (
          /* Checkout completion status card */
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-2">
              <ShieldCheck className="w-9 h-9 text-green-400 animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-text-primary">Payment &amp; Slices Merged</h3>
              <p className="text-text-secondary text-xs">Your files are queued in our physical Bambu Lab Print Farm. Code reference:</p>
              <div className="inline-block px-3 py-1.5 rounded bg-bg-surface border border-border-premium text-xs font-mono font-bold text-accent mt-2">
                {checkoutSuccess}
              </div>
            </div>

            <p className="text-text-secondary text-xs leading-relaxed">
              We have loaded corresponding core filaments across our additive bays. An automated PDF tracking receipt detailing machine parameters, estimated shipping times, and real-time nozzle telemetry was dispatched.
            </p>

            <button
              onClick={() => {
                setCheckoutSuccess(null);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-text-on-accent font-semibold text-xs cursor-pointer transition shadow"
            >
              Continue Browsing Models
            </button>
          </div>
        ) : (
          /* Interactive drawer shopping list */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    key={`${item.product.id}-${item.selectedColor}-${item.selectedMaterial}`}
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

            {/* Calculations Checkout sheet */}
            {cart.length > 0 && (
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

                {/* Submit button */}
                <button
                  id="checkout-trigger-btn"
                  onClick={handleCheckout}
                  className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt text-text-on-accent font-bold text-xs cursor-pointer text-center flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Zap className="w-3.5 h-3.5 fill-current text-text-on-accent animate-pulse" />
                  <span>Purchase &amp; Dispatch to Belvia Printers</span>
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
