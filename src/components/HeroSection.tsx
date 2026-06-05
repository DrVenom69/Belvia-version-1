import React from 'react';
import { ArrowRight, Cpu, Sparkles } from 'lucide-react';
import HeroCarousel from './HeroCarousel';

interface HeroSectionProps {
  onStartShopping: () => void;
  onGoToCustom: () => void;
}

export default function HeroSection({ onStartShopping, onGoToCustom }: HeroSectionProps) {
  return (
    <section
      id="belvia-hero"
      className="relative overflow-hidden pt-16 pb-8 bg-bg-base border-b border-bg-elevated/40"
    >
      {/* ── Ambient background glows ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-accent/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-accent-secondary/3 rounded-full blur-3xl pointer-events-none" />

      {/* ── Typography block ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6 mb-10">

        {/* Badge pill */}
        <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold tracking-widest text-accent bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full shadow-sm">
          <Cpu className="w-3.5 h-3.5" />
          <span>Additive Precision Farm</span>
          <Sparkles className="w-3 h-3 opacity-60" />
        </div>

        {/* Main heading */}
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-text-primary leading-[1.08] uppercase">
          Redefining{' '}
          <span className="relative inline-block">
            <span className="text-accent font-black">Connections</span>
            {/* underline accent */}
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-accent to-accent/20"
            />
          </span>
        </h1>

        {/* Sub-copy */}
        <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-sans">
          Belvia fuses industrial additive precision with an artisanal finish. Explore our
          curated catalogue of trending 3D&nbsp;products or bring your own model to life.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="hero-shop-btn"
            onClick={onStartShopping}
            className="group flex items-center gap-2 px-7 py-3 rounded-xl bg-accent hover:bg-accent-hover text-text-on-accent font-display font-bold text-sm transition-all shadow-lg hover:shadow-accent/20 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Shop Now
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            id="hero-custom-btn"
            onClick={onGoToCustom}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-bg-surface/60 border border-bg-elevated hover:border-accent/40 text-text-primary hover:text-accent font-display font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer backdrop-blur-sm"
          >
            Custom Print Studio
          </button>
        </div>
      </div>

      {/* ── Trending label ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 flex items-center gap-3 mb-4">
        <span className="text-[10px] font-mono font-bold tracking-widest text-accent uppercase">
          🔥 Trending Products
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-accent/30 to-transparent" />
        <span className="text-[10px] font-mono text-text-secondary">Infinite Showcase</span>
      </div>

      {/* ── Infinite Carousel ── */}
      <div className="relative z-10 carousel-track">
        <HeroCarousel />
      </div>

      {/* ── Bottom fade-to-base ── */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg-base to-transparent pointer-events-none z-20" />
    </section>
  );
}
