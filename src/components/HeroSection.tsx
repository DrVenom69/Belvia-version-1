import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Product } from '../types';
import HeroCarousel from './HeroCarousel';

interface HeroSectionProps {
  products: Product[];
  onStartShopping: () => void;
  onGoToCustom: () => void;
  onCategoryClick?: (category: string) => void;
}

export default function HeroSection({ products, onStartShopping, onGoToCustom, onCategoryClick }: HeroSectionProps) {
  return (
    <section
      id="belvia-hero"
      className="hero-section relative overflow-hidden pt-16 pb-2 border-b border-bg-elevated/40"
    >
      {/* ── Animated gradient aurora — theme-adaptive ── */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="hero-aurora" />
      </div>

      {/* ── Soft ambient orbs — theme-adaptive ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      {/* ── Central radial spotlight behind text ── */}
      <div className="absolute inset-0 z-0 pointer-events-none hero-spotlight" aria-hidden="true" />

      {/* ── Typography block ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 pt-6 space-y-6">

        {/* Main heading */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.1] uppercase">
          Imagine It.<br />
          We Print It.<br />
          <span className="relative inline-block">
            <span className="text-accent font-black">You Love It.</span>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-accent/20"
            />
          </span>
        </h1>

        {/* Sub-copy */}
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-sans">
          Bangladesh's First 3D Printing Marketplace. Shop unique 3D printed products or bring your own ideas to life. Custom manufacturing, ready prints, and 1–2 day delivery inside Dhaka.
        </p>

        {/* CTA buttons — glassmorphic */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="hero-shop-btn"
            onClick={onStartShopping}
            className="group flex items-center gap-2 px-7 py-3 rounded-xl font-display font-bold text-sm cursor-pointer hero-btn-primary"
          >
            Shop Now
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            id="hero-custom-btn"
            onClick={onGoToCustom}
            className="flex items-center gap-2 px-7 py-3 rounded-xl font-display font-semibold text-sm cursor-pointer hero-btn-ghost"
          >
            Custom Print Studio
          </button>
        </div>
      </div>

      {/* ── Trending label ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex items-center gap-3 mb-4">
        <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase">
          🔥 Trending Products
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-accent/30 to-transparent" />
        <span className="text-[10px] font-mono text-text-secondary">Tap a card to explore</span>
      </div>

      {/* ── Infinite Carousel – single row ── */}
      <div className="relative z-10">
        <HeroCarousel
          products={products}
          onCategoryClick={(cat) => {
            if (onCategoryClick) {
              onCategoryClick(cat);
            } else {
              onStartShopping();
            }
          }}
        />
      </div>

      {/* ── Bottom fade-to-base ── */}
      <div className="hero-bottom-fade absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-20" />
    </section>
  );
}
