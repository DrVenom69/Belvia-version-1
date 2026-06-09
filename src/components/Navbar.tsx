import { useState, useRef, useEffect } from 'react';
import { Layers, ShoppingBag, Terminal, Heart, Home, Globe, Sparkles, User, Sun, Moon, Settings, LogOut, Package, BookHeart, ChevronDown, Bell, CreditCard } from 'lucide-react';
import { CartItem } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cart: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  wishlistCount: number;
  onWishlistOpen: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  profilePicture?: string | null;
  onLogout?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  cart,
  setIsCartOpen,
  wishlistCount,
  onWishlistOpen,
  theme,
  toggleTheme,
  profilePicture,
  onLogout
}: NavbarProps) {
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navLinks = [
    { id: 'home', name: 'Home', icon: Home },
    { id: 'ready-prints', name: 'Store', icon: Layers },
    { id: 'imported', name: 'Pre-orders', icon: Globe },
    { id: 'portfolio', name: 'Portfolio', icon: Sparkles },
    { id: 'custom', name: 'Print Studio', icon: Terminal },
  ];

  const accountMenuItems = [
    { icon: User, label: 'Profile', description: 'Edit your info & preferences', tab: 'tracker', subView: 'profile' },
    { icon: Package, label: 'Orders', description: 'Track your print queue', tab: 'tracker', subView: 'orders' },
    { icon: BookHeart, label: 'Wishlist', description: `${wishlistCount} saved item${wishlistCount !== 1 ? 's' : ''}`, tab: 'tracker', subView: 'wishlist', action: 'wishlist' },
    { icon: Bell, label: 'Notifications', description: 'Alerts & print updates', tab: 'tracker', subView: 'orders' },
    { icon: CreditCard, label: 'Billing', description: 'Payment & invoices', tab: 'tracker', subView: 'profile' },
    { icon: Settings, label: 'Settings', description: 'Account configuration', tab: 'tracker', subView: 'profile' },
  ];

  const handleMouseEnterAccount = () => {
    if (dropdownTimerRef.current) clearTimeout(dropdownTimerRef.current);
    setIsAccountDropdownOpen(true);
  };

  const handleMouseLeaveAccount = () => {
    dropdownTimerRef.current = setTimeout(() => {
      setIsAccountDropdownOpen(false);
    }, 200);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountItemClick = (item: typeof accountMenuItems[0]) => {
    setIsAccountDropdownOpen(false);
    if (item.action === 'wishlist') {
      onWishlistOpen();
      return;
    }
    setActiveTab(item.tab);
    // Store the intended subview so MyAccountHub can read it
    sessionStorage.setItem('belvia_account_subview', item.subView);
  };

  const handleLogoutClick = () => {
    setIsAccountDropdownOpen(false);
    if (onLogout) onLogout();
    setActiveTab('home');
  };

  return (
    <>
      <header id="belvia-header" className="w-full bg-bg-surface/90 backdrop-blur-md border-b border-bg-elevated sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          
          {/* Logo Section */}
          <button
            id="nav-logo"
            onClick={() => setActiveTab('home')}
            className="flex items-center group cursor-pointer focus:outline-none py-1"
          >
            <img 
              src="/logo.png" 
              alt="Belvia Logo" 
              className="h-14 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105 duration-300 filter drop-shadow-[0_0_10px_rgba(245,175,25,0.15)]" 
            />
          </button>

          {/* Navigation Section for Desktop/Tablet */}
          <nav className="hidden sm:flex items-center space-x-1 sm:space-x-2">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  id={`nav-${link.id}`}
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center px-4 py-2 rounded-xl text-xs font-display font-semibold uppercase tracking-wide cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? 'bg-accent/10 text-accent border-accent/30 shadow-md shadow-accent/5'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40 border-transparent'
                  }`}
                  title={link.name}
                >
                  <span className="font-display tracking-wide">{link.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Interaction Actions */}
          <div className="flex items-center space-x-4 sm:space-x-5 text-xs">
            
            {/* Light/Dark Mode Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-text-secondary hover:text-accent bg-bg-surface hover:bg-bg-elevated border border-border-premium cursor-pointer transition duration-300 group"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 sm:w-5 sm:h-5 text-accent animate-pulse group-hover:scale-105 transition-transform" />
              ) : (
                <Moon className="w-6 h-6 sm:w-5 sm:h-5 text-accent group-hover:scale-105 transition-transform" />
              )}
            </button>

            {/* Cart Trigger */}
            <button
              id="cart-trigger-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative text-text-secondary hover:text-accent transition cursor-pointer group p-1"
            >
              <ShoppingBag className="w-6 h-6 sm:w-5 sm:h-5 group-hover:scale-105 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 sm:w-4 sm:h-4 rounded-full bg-accent-secondary text-white text-[9px] font-mono font-bold flex items-center justify-center animate-bounce shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* My Account Trigger with Animated Dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnterAccount}
              onMouseLeave={handleMouseLeaveAccount}
            >
              <button
                id="account-trigger-btn"
                onClick={() => setActiveTab('tracker')}
                className={`relative flex items-center space-x-1.5 px-2.5 py-2 rounded-xl transition cursor-pointer group border ${
                  activeTab === 'tracker' 
                    ? 'text-text-primary bg-accent/20 border-accent/30' 
                    : 'text-text-secondary hover:text-text-primary bg-bg-surface hover:bg-bg-elevated border-border-premium'
                }`}
                title="My Account"
              >
                {/* Profile Avatar or Icon */}
                {profilePicture ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-accent/40 shrink-0">
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <User className="w-5 h-5 group-hover:scale-105 transition-transform shrink-0" />
                )}
                <span className="hidden md:block text-[11px] font-semibold font-display">My Account</span>
                <ChevronDown className={`hidden md:block w-3 h-3 transition-transform duration-300 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Animated Dropdown Menu */}
              <div
                id="account-dropdown-menu"
                className={`absolute right-0 top-full mt-2 w-64 bg-[#070b13] border border-bg-elevated rounded-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all duration-300 origin-top-right ${
                  isAccountDropdownOpen 
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
                style={{ zIndex: 9999 }}
              >
                {/* Dropdown Header */}
                <div className="px-4 py-3.5 border-b border-bg-elevated bg-gradient-to-r from-accent/5 to-transparent">
                  <div className="flex items-center space-x-3">
                    {profilePicture ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent/30 shrink-0">
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-accent-secondary flex items-center justify-center text-white font-black text-sm shrink-0 shadow border border-white/10">
                        IB
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold text-sm font-display">Iffat Bd</p>
                      <p className="text-gray-500 text-[10px] font-mono">iffat2000bd@gmail.com</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2 px-2">
                  {accountMenuItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        id={`account-menu-${item.label.toLowerCase()}`}
                        onClick={() => handleAccountItemClick(item)}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left hover:bg-bg-elevated/70 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-bg-surface border border-bg-elevated flex items-center justify-center shrink-0 group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-200">
                          <Icon className="w-4 h-4 text-gray-400 group-hover:text-accent transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold font-display group-hover:text-accent transition-colors">{item.label}</p>
                          <p className="text-gray-500 text-[10px] font-mono truncate">{item.description}</p>
                        </div>
                        {item.label === 'Wishlist' && wishlistCount > 0 && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0">
                            {wishlistCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Divider + Logout */}
                <div className="px-2 pb-2 border-t border-bg-elevated pt-2 mt-1">
                  <button
                    id="account-menu-logout"
                    onClick={handleLogoutClick}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left hover:bg-red-950/30 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-bg-surface border border-bg-elevated flex items-center justify-center shrink-0 group-hover:border-red-500/30 group-hover:bg-red-950/30 transition-all duration-200">
                      <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs font-semibold font-display group-hover:text-red-400 transition-colors">Log Out</p>
                      <p className="text-gray-600 text-[10px] font-mono">Sign out of your account</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface/95 backdrop-blur-lg border-t border-bg-elevated h-16 sm:hidden flex items-center justify-around px-2 pb-safe shadow-2xl">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => setActiveTab(link.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors duration-200 cursor-pointer ${
                isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-display mt-1 tracking-wide uppercase font-semibold">{link.name}</span>
            </button>
          );
        })}
        {/* Mobile Account Icon */}
        <button
          onClick={() => setActiveTab('tracker')}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-center transition-colors duration-200 cursor-pointer ${
            activeTab === 'tracker' ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {profilePicture ? (
            <div className="w-5 h-5 rounded-full overflow-hidden border border-accent/40">
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            </div>
          ) : (
            <User className="w-5 h-5" />
          )}
          <span className="text-[9px] font-display mt-1 tracking-wide uppercase font-semibold">Account</span>
        </button>
      </nav>
    </>
  );
}
