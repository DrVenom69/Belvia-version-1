import React from 'react';
import { Layers, ShoppingBag, Terminal, Heart, Home, Globe, Sparkles, User } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  wishlistCount: number;
  onWishlistOpen: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  wishlistCount,
  onWishlistOpen
}: NavbarProps) {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'ready-prints', name: 'Store', icon: Layers },
    { id: 'imported', name: 'Pre-orders', icon: Globe },
    { id: 'portfolio', name: 'Portfolio', icon: Sparkles },
    { id: 'custom', name: 'Print Studio', icon: Terminal },
  ];

  return (
    <header id="belvia-header" className="w-full bg-bg-surface/90 backdrop-blur-md border-b border-bg-elevated sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        
        {/* Logo Section (No text, BELVIA NEW LOGO-03.png only) */}
        <button
          id="nav-logo"
          onClick={() => setActiveTab('home')}
          className="flex items-center group cursor-pointer focus:outline-none py-1"
        >
          <img 
            src="/logo.png" 
            alt="Belvia Logo" 
            className="h-16 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105 duration-300 filter drop-shadow-[0_0_10px_rgba(245,175,25,0.15)]" 
          />
        </button>

        {/* Navigation Section */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                id={`nav-${link.id}`}
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 border ${
                  isActive
                    ? 'bg-accent/10 text-accent border-accent/30 shadow-md shadow-accent/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}
                title={link.name}
              >
                <Icon className={`w-4 h-4 sm:hidden ${isActive ? 'text-accent' : ''}`} />
                <span className="hidden sm:inline font-sans">{link.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Interaction Actions */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-xs">
          
          {/* Cart Trigger */}
          <button
            id="cart-trigger-btn"
            onClick={() => setIsCartOpen(true)}
            className="relative text-gray-400 hover:text-accent transition cursor-pointer group"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-105 transition-transform" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent-secondary text-white text-[9px] font-mono font-bold flex items-center justify-center animate-bounce shadow-sm">
                {totalItems}
              </span>
            )}
          </button>

          {/* My Account Trigger (Larger) */}
          <button
            id="account-trigger-btn"
            onClick={() => setActiveTab('tracker')}
            className={`relative p-1.5 rounded-full transition cursor-pointer group ${
              activeTab === 'tracker' ? 'text-white bg-accent/20' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
            title="My Account"
          >
            <User className="w-6 h-6 group-hover:scale-105 transition-transform" />
          </button>

        </div>
      </div>
    </header>
  );
}

