import React, { useState } from 'react';
import { Sparkles, Star, Cpu, ShieldCheck, Database, Layers, PlayCircle, Eye, Hammer } from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  clientName: string;
  clientHandle: string;
  material: string;
  layerHeight: string;
  printerUsed: string;
  printDuration: string;
  infill: string;
  rating: number;
  testimonial: string;
  image: string;
  category: string;
  cols?: string; // column span config for bento layout
}

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'port-01',
    title: 'Articulated Obsidian Rift Dragon',
    clientName: 'Aiden Reed',
    clientHandle: '@dragon_tamer',
    material: 'Co-Extruded Silk PLA (Nebula Hues)',
    layerHeight: '0.12mm (Ultra-Fine)',
    printerUsed: 'Bambu Lab X1-Carbon',
    printDuration: '6h 45m',
    infill: '15% Lightning infill',
    rating: 5,
    testimonial: 'Absolutely stunned by the print tolerance! Zero custom calibration or post-processing necessary. Flex joints are completely free and move like silk right off the PEI build plate.',
    image: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=800',
    category: 'Figures & Toys',
    cols: 'md:col-span-2 lg:col-span-2' // Bento featured card
  },
  {
    id: 'port-02',
    title: 'Precision Dual Controller Dock',
    clientName: 'Lucas Vance',
    clientHandle: '@gotech_customs',
    material: 'Carbon-Fiber PLA (Extremely Rigid)',
    layerHeight: '0.16mm (Optimal Speed)',
    printerUsed: 'Bambu Lab P1S Unit #F3',
    printDuration: '5h 10m',
    infill: '25% Grid strength arrays',
    rating: 5,
    testimonial: 'Heavy duty gaming organizer! Carbon fiber texture feels premium and provides weight to prevent slipping. Cable route ports are flawlessly clean. Highly satisfied!',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=800',
    category: 'Gaming rigs',
    cols: 'md:col-span-1'
  },
  {
    id: 'port-03',
    title: 'Origami Self-Watering Water Vessel',
    clientName: 'Mia Foster',
    clientHandle: '@greenery_zen',
    material: 'PETG (Waterproof, Airtight Spec)',
    layerHeight: '0.20mm (Standard Flow)',
    printerUsed: 'Bambu Lab A1-Mini #A2',
    printDuration: '3h 30m',
    infill: '10% Gyroid cell',
    rating: 5,
    testimonial: 'Holds moisture perfectly without any leaking or sweating. The origami facets catch light beautifully. Water reservoir allows my houseplants to thrive for up to 10 days!',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800',
    category: 'Home Decor',
    cols: 'md:col-span-1'
  },
  {
    id: 'port-04',
    title: 'Modular Helix Hexagonal Keyring Holder',
    clientName: 'Sophia Chen',
    clientHandle: '@soph_architect',
    material: 'Premium Matte PLA Slate',
    layerHeight: '0.12mm (Ultra-Fine)',
    printerUsed: 'Bambu Lab X1-Carbon',
    printDuration: '1h 50m',
    infill: '30% Honeycomb pattern',
    rating: 5,
    testimonial: 'Superb wall mount! Embedded N52 neodymium magnets hold my heavy car fobs seamlessly. Magnetic draw has a satisfying click. An architectural grade piece!',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800',
    category: 'Desk utility',
    cols: 'md:col-span-1'
  },
  {
    id: 'port-05',
    title: 'Custom B2B Embossed Coin Bottle Openers',
    clientName: 'Valiant Ventures Inc.',
    clientHandle: '@valiant_hq',
    material: 'Heavy-Duty ABS (High Heat Impact)',
    layerHeight: '0.20mm (Strength-enhanced)',
    printerUsed: 'Bambu Lab X1-Carbon (AMS Array)',
    printDuration: '18h 30m (Batch of 50)',
    infill: '40% Solid Grid lines',
    rating: 5,
    testimonial: 'Ordered a batch of 50 for custom tech merchandising. Slices integrated our vector corporate logo perfectly. Steel centers are highly robust. Will buy again!',
    image: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=800',
    category: 'Corporate',
    cols: 'md:col-span-1 lg:col-span-2' // Bento featured card
  }
];

export default function ClientPortfolio() {
  const [selectedTag, setSelectedTag] = useState<string>('All');

  const categories = ['All', 'Figures & Toys', 'Gaming rigs', 'Home Decor', 'Desk utility', 'Corporate'];

  const filteredItems = PORTFOLIO_ITEMS.filter(item => {
    if (selectedTag === 'All') return true;
    return item.category === selectedTag;
  });

  return (
    <section id="portfolio-section" className="py-16 bg-bg-base relative overflow-hidden">
      {/* HUD background grid lines */}
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" aria-hidden="true" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none hidden dark:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left">
        
        {/* Section Header */}
        <div className="mb-12 text-left max-w-2xl">
          <span className="font-mono text-xs font-semibold text-accent uppercase tracking-widest block mb-2 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 animate-spin-slow" />
            Additive Engineering Blueprints
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-text-primary uppercase tracking-tight">
            Client Print Portfolio
          </h2>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            Review detailed production logs of custom model orders we have sliced, curated, and discharged to physical clients. Inspect the structural settings that deliver flawless finishes.
          </p>
        </div>

        {/* Categories Tab selector */}
        <div className="flex border-b border-border-premium mb-10 overflow-x-auto scrollbar-none gap-2">
          {categories.map((cat) => (
            <button
              id={`portfolio-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              key={cat}
              onClick={() => setSelectedTag(cat)}
              className={`pb-3 px-5 text-xs font-bold font-mono tracking-wider transition cursor-pointer shrink-0 border-b-2 uppercase ${
                selectedTag === cat
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item, idx) => {
            const isFeatured = item.cols?.includes('col-span-2');
            return (
              <div
                id={`portfolio-card-${item.id}`}
                key={item.id}
                className={`group bg-bg-surface/75 backdrop-blur-md border border-border-premium hover:border-accent/40 rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-accent/5 transition-all duration-300 flex flex-col justify-between ${
                  item.cols || 'md:col-span-1'
                } relative`}
              >
                {/* Scanline HUD overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none opacity-5 hidden dark:block" />

                <div className={`flex flex-col ${isFeatured ? 'lg:flex-row h-full' : ''}`}>
                  {/* Photo container */}
                  <div className={`relative bg-bg-surface overflow-hidden shrink-0 ${
                    isFeatured ? 'w-full lg:w-[45%] h-64 lg:h-auto min-h-[250px]' : 'w-full h-52'
                  }`}>
                    {/* CRT Scanline shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                    <img
                      referrerPolicy="no-referrer"
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover filter contrast-[1.02] group-hover:scale-102 transition duration-500"
                    />
                    
                    {/* Tech tag badge */}
                    <span className="absolute top-3 left-3 bg-bg-base/95 text-accent font-mono text-[9px] font-black tracking-wider uppercase border border-border-premium rounded px-2 py-0.5 shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Content area */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div>
                        {/* Client details row */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary">
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                            VERIFIED QUEUE
                          </span>
                          <span className="text-accent font-bold tracking-tight">{item.clientHandle}</span>
                        </div>
                        <h3 className="font-display font-black text-lg text-text-primary mt-1.5 leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      {/* Testimonial block */}
                      <div className="p-4 rounded-xl bg-bg-base/70 border border-border-premium italic text-xs text-text-secondary leading-relaxed relative">
                        <span className="text-accent font-serif text-lg absolute -top-1 -left-1 opacity-20">"</span>
                        {item.testimonial}
                        <div className="flex items-center space-x-1 mt-3 text-yellow-500">
                          {[...Array(item.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>

                      {/* G-Code Telemetry Specs Readout */}
                      <div className="p-4 rounded-xl bg-bg-elevated/80 text-[10px] font-mono border border-border-premium text-text-secondary space-y-1.5">
                        <span className="block font-bold text-[9px] text-accent mb-2 uppercase tracking-widest flex items-center gap-1.5 border-b border-border-premium pb-1">
                          <Layers className="w-3.5 h-3.5 text-accent animate-pulse" />
                          G-Code Telemetry Readout
                        </span>
                        
                        <div className="flex justify-between items-center">
                          <span>FILAMENT CORE:</span>
                          <span className="text-text-primary font-bold">{item.material}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>LAYER LAYER HEIGHT:</span>
                          <span className="text-text-primary font-bold">{item.layerHeight}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>INFILL CONFIG:</span>
                          <span className="text-text-primary font-bold">{item.infill}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>FABRICATION UNIT:</span>
                          <span className="text-text-primary font-bold">{item.printerUsed}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-border-premium mt-2">
                          <span className="text-accent font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                            FAB TIME:
                          </span>
                          <span className="text-accent font-black">{item.printDuration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
