import React from 'react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (id: string) => void;
  onAddToCartAndRemove: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCartAndRemove,
}: WishlistDrawerProps) {
  if (!isOpen) return null;

  return (
    <div id="wishlist-drawer-backdrop" className="fixed inset-0 z-50 overflow-hidden bg-bg-surface/65 backdrop-blur-xs flex justify-end">
      
      {/* Drawer Box */}
      <div id="wishlist-drawer-container" className="w-full max-w-md bg-bg-base border-l border-bg-elevated h-full flex flex-col justify-between shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="p-4 border-b border-bg-elevated flex items-center justify-between">
          <div className="flex items-center space-x-2 text-text-primary">
            <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
            <span className="font-display font-bold text-base">My Saved Wishlist</span>
          </div>
          <button
            id="close-wishlist-btn"
            onClick={onClose}
            className="p-1 px-2 text-text-secondary hover:text-text-primary rounded hover:bg-bg-surface transition cursor-pointer font-mono text-sm"
          >
            [CLOSE]
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {wishlist.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <div className="w-12 h-12 bg-bg-surface border border-border-premium rounded-full flex items-center justify-center mx-auto text-text-muted">
                <Heart className="w-5 h-5" />
              </div>
              <p className="text-text-secondary text-xs font-mono">No items saved in your Wishlist yet.</p>
              <p className="text-text-muted text-[11px] max-w-xs mx-auto">
                Browse our Ready-Made models or Imported pre-orders and click the love button to save them here!
              </p>
            </div>
          ) : (
            wishlist.map((product) => (
              <div
                key={`wish-${product.id}`}
                className="p-3 bg-bg-elevated border border-border-premium rounded-xl flex space-x-3 text-left hover:border-accent transition"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-bg-surface rounded-lg overflow-hidden shrink-0">
                  <img referrerPolicy="no-referrer" src={product.images[0]} alt="Wishlist thumb" className="w-full h-full object-cover" />
                </div>

                {/* Info details */}
                <div className="flex-grow flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-text-primary leading-tight truncate pr-2">
                        {product.title}
                      </h4>
                      <span className="text-[10px] text-text-muted font-mono italic">
                        {product.isPreOrder ? "Pre-order" : "Stock"}
                      </span>
                    </div>
                    <span className="block text-[10px] text-accent font-mono mt-0.5">{product.category}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-premium">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      ${product.price.toFixed(2)}
                    </span>

                    <div className="flex items-center space-x-2">
                      {/* Add directly to cart */}
                      <button
                        onClick={() => onAddToCartAndRemove(product)}
                        className="px-2.5 py-1 rounded bg-accent-secondary hover:bg-accent-hover text-text-on-accent text-[10px] font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        title="Add to Slicing Cart"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Add Cart</span>
                      </button>

                      {/* Remove item */}
                      <button
                        onClick={() => onRemoveFromWishlist(product.id)}
                        className="p-1 text-text-secondary hover:text-red-400 hover:bg-red-500/10 rounded transition cursor-pointer"
                        title="Delete favorite"
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

        {/* Footer */}
        <div className="p-4 bg-bg-surface border-t border-border-premium text-center text-[10px] text-text-muted font-mono">
          Saved locally using persistent Web Storage. Items will remain here until you checkout or clear browser cache.
        </div>

      </div>
    </div>
  );
}
