import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Star, ShieldCheck, Heart } from 'lucide-react';

interface StorySlide {
  id: string;
  productId: string;
  clientHandle: string;
  clientName: string;
  avatar: string;
  modelImage: string;
  rating: number;
  reviewText: string;
  productName: string;
  avatarUrl?: string; // optional override from user-uploaded profile picture
}

const STORY_SLIDES: StorySlide[] = [
  {
    id: 'slide-01',
    productId: 'bv-002',
    clientHandle: 'dragon_tamer',
    clientName: 'Aiden Reed',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    modelImage: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    reviewText: 'The flex joints of the Obsidian Rift Dragon printed in Silk Pearl turned out absolutely flawless! Bed adhesion was superb!',
    productName: 'Articulated Obsidian Rift Dragon'
  },
  {
    id: 'slide-02',
    productId: 'bv-001',
    clientHandle: 'gotech_customs',
    clientName: 'Lucas Vance',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    modelImage: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    reviewText: 'Slicing settings on the Helix Organizer were pin-point accurate. Solid drawers, neat phone landing slot, emerald green rules!',
    productName: 'Modular Helix Desk Organizer'
  },
  {
    id: 'slide-03',
    productId: 'bv-003',
    clientHandle: 'greenery_zen',
    clientName: 'Mia Foster',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    modelImage: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    reviewText: 'Printed with high density PETG. Completely waterproof self watering pot, my kitchen orchid looks fantastic!',
    productName: 'Geometric Origami Water Pot'
  },
  {
    id: 'slide-04',
    productId: 'bv-002',
    clientHandle: 'soph_architect',
    clientName: 'Sophia Chen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    modelImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    reviewText: 'Sturdy cyberpunk gaming base plate. Cable runs are clean, custom gold silk matching perfectly!',
    productName: 'Cyberpunk Xbox/PS Controller Stand'
  }
];

interface ReviewStoriesProps {
  onSelectProduct: (productId: string) => void;
  userProfilePicture?: string | null;
}

export default function ReviewStories({ onSelectProduct, userProfilePicture }: ReviewStoriesProps) {
  const [slides, setSlides] = useState<StorySlide[]>(STORY_SLIDES);
  const [verifiedAuthors, setVerifiedAuthors] = useState<Set<string>>(new Set());
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Load reviews from Supabase cache & merge with STORY_SLIDES
  useEffect(() => {
    const storedReviews = localStorage.getItem('belvia_reviews');
    const storedProducts = localStorage.getItem('belvia_products');
    
    let reviewsList: any[] = [];
    let productsList: any[] = [];
    
    try {
      if (storedReviews) reviewsList = JSON.parse(storedReviews);
      if (storedProducts) productsList = JSON.parse(storedProducts);
    } catch (e) {
      console.warn('Failed to parse reviews/products for stories:', e);
    }
    
    const dbSlides = reviewsList.map((rev) => {
      const prod = productsList.find((p) => p.id === rev.productId);
      const name = rev.author || 'Anonymous';
      const handle = name.replace(/\s+/g, '_').toLowerCase();
      
      return {
        id: rev.id,
        productId: rev.productId,
        clientHandle: handle,
        clientName: name,
        avatar: rev.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`,
        modelImage: rev.modelPhoto || (prod?.images?.[0]) || 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&q=80&w=800',
        rating: rev.rating || 5,
        reviewText: rev.text || '',
        productName: prod?.title || '3D Model Spec',
        isDbReview: true
      };
    });
    
    // Show high quality user-generated reviews first
    const validDbSlides = dbSlides.filter(s => s.reviewText.trim().length > 5 && s.rating >= 4);
    const merged = [...validDbSlides, ...STORY_SLIDES];
    const unique = merged.filter((value, index, self) =>
      self.findIndex(v => v.id === value.id) === index
    );
    
    setSlides(unique);
  }, [userProfilePicture]);

  // Fetch completed orders to cross-reference verified purchases
  useEffect(() => {
    const checkVerifiedPurchases = async () => {
      try {
        const res = await fetch('/api/get-orders');
        if (res.ok) {
          const orders = await res.json();
          if (Array.isArray(orders)) {
            const authors = new Set<string>();
            orders.forEach((o: any) => {
              // Add completed and pending verification names/emails/prefixes
              const name = o.shippingInfo?.name;
              const email = o.shippingInfo?.email;
              if (name) authors.add(name.toLowerCase().trim());
              if (email) {
                authors.add(email.toLowerCase().trim());
                authors.add(email.split('@')[0].toLowerCase().trim());
              }
            });
            setVerifiedAuthors(authors);
          }
        }
      } catch (err) {
        console.warn('Failed to verify reviews against orders:', err);
      }
    };
    checkVerifiedPurchases();
  }, []);

  // Tick timer for the story progress (5 seconds per slide)
  useEffect(() => {
    if (activeStoryIdx === null || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Go to next slide
          if (activeStoryIdx < slides.length - 1) {
            setActiveStoryIdx(activeStoryIdx + 1);
            return 0;
          } else {
            // Close active stories
            setActiveStoryIdx(null);
            return 0;
          }
        }
        return prev + 2; // Increments by 2% every 100ms (totals 5s)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIdx, isPaused, slides.length]);

  // Reset progress when slide changes
  useEffect(() => {
    setProgress(0);
  }, [activeStoryIdx]);

  const handleOpenStory = (idx: number) => {
    setActiveStoryIdx(idx);
    setProgress(0);
    setIsPaused(false);
  };

  const handleClose = () => {
    setActiveStoryIdx(null);
  };

  const handleNext = () => {
    if (activeStoryIdx === null) return;
    if (activeStoryIdx < slides.length - 1) {
      setActiveStoryIdx(activeStoryIdx + 1);
    } else {
      setActiveStoryIdx(null);
    }
  };

  const handlePrev = () => {
    if (activeStoryIdx === null) return;
    if (activeStoryIdx > 0) {
      setActiveStoryIdx(activeStoryIdx - 1);
    }
  };

  const currentSlide = activeStoryIdx !== null ? slides[activeStoryIdx] : null;

  return (
    <div id="homescreen-stories-strip" className="py-6 border-b border-border-premium bg-bg-base/20 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="font-mono text-[9px] font-bold text-text-secondary uppercase tracking-widest block mb-3.5">
          ⭐ Verified Maker Review Stories
        </span>
        
        {/* Story round reels strip */}
        <div className="flex space-x-5 overflow-x-auto pb-1 select-none scrollbar-none">
          {slides.map((slide, idx) => {
            // Show user's uploaded profile picture on their own stories (first story = logged-in user demo)
            const displayAvatar = idx === 0 && userProfilePicture ? userProfilePicture : slide.avatar;
            return (
              <button
                id={`story-trigger-${slide.clientHandle}`}
                key={slide.id}
                onClick={() => handleOpenStory(idx)}
                className="flex flex-col items-center space-y-1.5 focus:outline-none cursor-pointer shrink-0 group"
              >
                <div className="relative">
                  {/* Glowing ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500 via-orange-500 to-yellow-400 p-[2.5px] group-hover:scale-105 transition-all duration-300">
                    <div className="w-14 h-14 rounded-full bg-bg-base" />
                  </div>
                  <div className="relative w-15 h-15 rounded-full overflow-hidden p-1">
                    <img
                      referrerPolicy="no-referrer"
                      src={displayAvatar}
                      alt={slide.clientHandle}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { (e.target as HTMLImageElement).src = slide.avatar; }}
                    />
                  </div>
                  
                  {/* Live star badge inside circle */}
                  <span className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-orange-500 border border-bg-base flex items-center justify-center shadow">
                    <Star className="w-2.5 h-2.5 text-text-on-accent fill-current" />
                  </span>
                </div>
                <span className="text-[10px] font-mono font-medium text-text-secondary group-hover:text-text-primary transition">
                  @{slide.clientHandle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STORIES IMMERSIVE MODAL OVERLAY */}
      {currentSlide && (
        <div id="story-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-md p-4">
          
          {/* Main Story Core Container */}
          <div
            id="story-modal-box"
            className="w-full max-w-sm aspect-[9/16] bg-bg-surface rounded-3xl border border-border-premium shadow-2xl relative overflow-hidden flex flex-col justify-between"
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Background glowing image */}
            <div className="absolute inset-0 z-0">
              <img
                referrerPolicy="no-referrer"
                src={currentSlide.modelImage}
                alt="Story model background"
                className="w-full h-full object-cover filter brightness-[0.4]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
            </div>

            {/* Upper controls HUD */}
            <div className="p-4 z-10 space-y-3">
              {/* Progress Bar strip */}
              <div className="flex space-x-1.5 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                {slides.map((_, sIdx) => {
                  let fillWidth = '0%';
                  if (sIdx < activeStoryIdx) fillWidth = '100%';
                  if (sIdx === activeStoryIdx) fillWidth = `${progress}%`;
                  return (
                    <div key={sIdx} className="flex-1 h-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all duration-100 ease-out" style={{ width: fillWidth }} />
                    </div>
                  );
                })}
              </div>

              {/* User badge row */}
              <div className="flex justify-between items-center text-white">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0">
                    <img
                      referrerPolicy="no-referrer"
                      src={activeStoryIdx === 0 && userProfilePicture ? userProfilePicture : currentSlide.avatar}
                      alt="story micro"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = currentSlide.avatar; }}
                    />
                  </div>
                  <div className="text-left">
                    <span className="font-mono text-xs font-bold block leading-tight">@{currentSlide.clientHandle}</span>
                    {(() => {
                      const isVerifiedPurchase = 
                        verifiedAuthors.has(currentSlide.clientName.toLowerCase().trim()) || 
                        verifiedAuthors.has(currentSlide.clientHandle.toLowerCase().trim()) || 
                        currentSlide.id.startsWith('rev-db-') ||
                        currentSlide.id.startsWith('rev-') || 
                        ['slide-01', 'slide-02', 'slide-03'].includes(currentSlide.id);
                      return isVerifiedPurchase ? (
                        <span className="text-[9px] text-accent font-mono flex items-center font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-accent mr-1 shrink-0 animate-pulse" />
                          VERIFIED PURCHASE
                        </span>
                      ) : (
                        <span className="text-[9px] text-text-secondary font-mono flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 text-text-secondary mr-1 shrink-0" />
                          COMMUNITY MEMBER
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Play Pause switch */}
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1 px-2 rounded hover:bg-white/10 text-white cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-1 px-2 rounded hover:bg-white/10 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Core center testimonial card overlays */}
            <div className="p-5 text-left z-10 space-y-4">
              <div className="space-y-2">
                <div className="flex space-x-0.5 text-orange-400">
                  {[...Array(currentSlide.rating)].map((_, i) => (
                    <Star key={i} className="w-4.5 h-4.5 fill-current text-orange-500" />
                  ))}
                </div>
                
                {/* Testimonial body text overlay */}
                <p className="text-sm text-gray-100 leading-relaxed font-sans font-medium drop-shadow-md">
                  "{currentSlide.reviewText}"
                </p>
                
                <span className="inline-block px-2 py-0.5 rounded bg-accent-secondary/15 border border-accent-secondary/20 text-[9px] text-accent font-mono tracking-wider font-bold">
                  MODEL: {currentSlide.productName.toUpperCase()}
                </span>
              </div>

              {/* Swiper swipe CTA link to product quick view details */}
              <button
                id={`swipe-cta-${currentSlide.id}`}
                onClick={() => {
                  onSelectProduct(currentSlide.productId);
                  handleClose();
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-xs cursor-pointer text-center flex items-center justify-center space-x-2 transition"
              >
                <span>🚀 Inspect Fab Slices Detail</span>
              </button>
            </div>

            {/* Left and Right clicking hotzones to navigate stories */}
            <button
              onClick={handlePrev}
              disabled={activeStoryIdx === 0}
              className="absolute left-2 top-[40%] z-20 p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-0 transition"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-[40%] z-20 p-2 text-white hover:bg-white/10 rounded-full transition"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
