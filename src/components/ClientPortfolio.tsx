import React, { useState } from 'react';
import { Sparkles, Star, Cpu, Heart, CheckCircle, Flame, Hammer, Layers } from 'lucide-react';

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
    printDuration: '6h 45m (Single-bed runs)',
    infill: '15% Lightning infill',
    rating: 5,
    testimonial: 'Absolutely stunned by the print tolerance! Zero custom calibration or post-processing necessary. Flex joints are completely free and move like silk right off the PEI build plate.',
    image: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=800',
    category: 'Figures & Toys'
  },
  {
    id: 'port-02',
    title: 'Precision Dual controller Dock',
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
    category: 'Gaming rigs'
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
    category: 'Home Decor'
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
    category: 'Desk utility'
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
    category: 'Corporate'
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
    <section id="portfolio-section" className="py-16 bg-bg-base relative">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-left">
        
        {/* Section Header */}
        <div className="mb-10 text-left max-w-2xl">
          <span className="font-mono text-xs font-semibold text-accent uppercase tracking-widest block mb-2">
            Additive Engineering Blueprints
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">
            Client Print Portfolio
          </h2>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            Review detailed production logs of custom model orders we have sliced, curated, and discharged to physical clients. Inspect the structural settings that deliver flawless finishes.
          </p>
        </div>

        {/* Categories Tab selector */}
        <div className="flex border-b border-gray-805 mb-8 overflow-x-auto scrollbar-thin">
          {categories.map((cat) => (
            <button
              id={`portfolio-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              key={cat}
              onClick={() => setSelectedTag(cat)}
              className={`pb-3 px-6 text-xs font-semibold font-mono tracking-wider transition cursor-pointer shrink-0 border-b-2 ${
                selectedTag === cat
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Portfolio Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredItems.map((item) => (
            <div
              id={`portfolio-card-${item.id}`}
              key={item.id}
              className="bg-bg-surface/75 border border-bg-elevated rounded-2xl overflow-hidden hover:border-gray-700 hover:shadow-2xl hover:shadow-accent/5 transition duration-300 flex flex-col md:flex-row h-full"
            >
              {/* Photo */}
              <div className="w-full md:w-[45%] h-56 md:h-auto bg-bg-surface shrink-0 relative">
                <img
                  referrerPolicy="no-referrer"
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover filter contrast-[1.05]"
                />
                
                {/* Visual tech sticker badge */}
                <span className="absolute bottom-3 left-3 bg-bg-base/90 text-accent font-mono text-[9px] font-bold tracking-widest uppercase border border-bg-elevated rounded px-2 py-0.5">
                  {item.category}
                </span>
              </div>

              {/* Specifications logs */}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    {/* Trust client profile */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                      <span>CLIENT DELIVERED</span>
                      <span className="text-accent font-bold">{item.clientHandle}</span>
                    </div>
                    <h3 className="font-display font-black text-base text-white mt-1 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Testimonial citation block */}
                  <div className="p-3.5 rounded-xl bg-bg-base border border-gray-850 relative italic text-[11px] text-gray-300 leading-relaxed text-left">
                    "{item.testimonial}"
                    <div className="flex items-center space-x-1 mt-2.5 text-yellow-500">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* Additive Manufacturing Technical Parameters */}
                  <div className="p-3 rounded-xl bg-[#090f1cf0] text-[10px] font-mono border border-gray-880 text-gray-400 space-y-1 text-left">
                    <span className="block font-bold text-[9px] text-accent mb-1.5 uppercase tracking-wider flex items-center">
                      <Cpu className="w-3.5 h-3.5 text-accent mr-1.5 animate-pulse" />
                      G-Code Micro Parameters
                    </span>
                    <div className="flex justify-between">
                      <span>FILAMENT POLYMER:</span>
                      <span className="text-gray-200">{item.material}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LAYER ALTITUDE:</span>
                      <span className="text-gray-200">{item.layerHeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>INFILL STRENGTH GRID:</span>
                      <span className="text-gray-200">{item.infill}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ADDITIVE UNIT BED:</span>
                      <span className="text-gray-200">{item.printerUsed}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-850 text-gray-300">
                      <span>FABRICATION RECORD:</span>
                      <span className="text-accent font-bold">{item.printDuration}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
