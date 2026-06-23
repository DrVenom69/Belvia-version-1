import React, { useState } from 'react';
import { HelpCircle, Star, Quote, ChevronDown, CheckCircle, Flame, Layers2 } from 'lucide-react';
import WhyBelvia from './WhyBelvia';

export default function AestheticsFlow() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);



  const PORTFOLIO = [
    { title: 'Satin-Silk Pearl Low-Poly Fox', mate: 'Silk Pearl Gold PLA', layer: '0.12mm (Extra Fine)', weight: '65g', time: '2h 15m', img: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=800' },
    { title: 'Industrial Action Camera Case', mate: 'Flexible Gasket TPU', layer: '0.20mm (Standard)', weight: '38g', time: '1h 10m', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800' },
    { title: 'Architectural Geometric Cathedral', mate: 'Sandstone Grey PETG', layer: '0.08mm (Ultra Precision)', weight: '420g', time: '12h 45m', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800' }
  ];

  const REVIEWS = [
    { name: 'Marcus Sterling', r: 'Lead CAD Designer, Vertex Labs', t: 'The print tolerances are sensational. Slices arrived with fully intact interlocking gears. Slicing precision meets FDM gold standards.' },
    { name: 'Sarah Vance', r: 'Indie Creator', t: 'I pasted my MakerWorld design summary specs into Belvias AI input, and it instantly parsed a suggested materials order including weight. Flawless UI!' },
    { name: 'Koji Nakano', r: 'B2B Procurement Coordinator', t: 'Ordered 500 promotional logo keychains for our conference. Perfect dual-color layers and robust infill. Highly recommended farm.' }
  ];

  const FAQS = [
    { q: 'What mechanical design file extensions does Belvia support?', a: 'Belvia supports FDM/SLA file architectures including STL, 3MF and OBJ. Large mesh designs up to 50MB compile automatically inside our cloud slicing engines.' },
    { q: 'How long does FDM 3D printing and shipping take?', a: 'Ready prints process immediately through our active farm queue and typically ship within 24 hours. Complex custom projects require slicing calibration validation and ship in 2 days.' },
    { q: 'What spatial mechanical tolerances does Belvia maintain?', a: 'Standard PLA/PETG models hold continuous FDM tolerances within ±0.1mm. This is ideal for sliding mechanical assemblies, sliding lids, or gears.' },
    { q: 'Can I sell models sourced from MakerWorld or Thingiverse?', a: 'Yes! However, Belvia strictly respects Creative Commons licenses. If a MakerWorld model has a non-commercial clause, we only print it for personal use.' }
  ];

  return (
    <div id="additional-aesthetics-wrapper" className="bg-bg-base relative">
      
      {/* 1. WHY CHOOSE BELVIA — Signal Node Interface */}
      <WhyBelvia />

      {/* 2. PORTFOLIO / RECENT PROJECTS */}
      <section id="recent-prints" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">Micro Layer Shots</span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary mt-1">Completed Farm Print Projects</h2>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">Direct macro close-ups of models created inside our additive bays showing true outer wall finishing standards.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5">
            {PORTFOLIO.map((p, idx) => (
              <div key={idx} className="bg-bg-surface border border-border-premium rounded-2xl overflow-hidden text-left flex flex-col group">
                <div className="aspect-[4/3] w-full bg-bg-surface relative overflow-hidden">
                  <img referrerPolicy="no-referrer" src={p.img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-mono bg-bg-base/90 text-accent font-bold border border-border-premium">
                    {p.mate}
                  </span>
                </div>
                <div className="p-4.5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-sm text-text-primary leading-normal line-clamp-1">{p.title}</h3>
                    
                    {/* Splicer diagnostics */}
                    <div className="grid grid-cols-3 gap-2.5 pt-3.5 border-t border-border-premium text-[10px] font-mono text-text-muted">
                      <div>
                        <span className="block text-[8px] text-text-muted uppercase">layer ht</span>
                        <span className="font-bold text-text-primary">{p.layer}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-text-muted uppercase">Net Mass</span>
                        <span className="font-bold text-text-primary">{p.weight}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-text-muted uppercase">hours</span>
                        <span className="font-bold text-accent">{p.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. CUSTOMER REVIEWS */}
      <section id="opinions" className="py-20 bg-bg-base/40 border-t border-border-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">Industrial Testimonials</span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary mt-1">Manufacturer Reviews</h2>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">Trusted by engineers and individual hobbyist designers for FDM tolerances.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5 text-left">
            {REVIEWS.map((rev, idx) => (
              <div key={idx} className="bg-bg-surface p-6 border border-border-premium rounded-2xl flex flex-col justify-between space-y-4">
                <p className="text-text-secondary text-xs font-sans italic leading-relaxed">
                  "{rev.t}"
                </p>
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-display font-medium text-xs text-accent">
                    {rev.name[0]}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-xs text-text-primary leading-none">{rev.name}</h4>
                    <span className="text-[10px] text-text-muted font-mono mt-1 block">{rev.r}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. FAQ ACCORDION */}
      <section id="frequently-asked-fields" className="py-20 border-t border-border-premium">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-14 max-w-xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">support center</span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-text-primary mt-1">Frequently Asked Slices</h2>
            <p className="text-text-secondary text-xs mt-2 leading-relaxed">Understand our additive calibration protocols and spatial clearances.</p>
          </div>

          <div className="space-y-3.5 text-left">
            {FAQS.map((faq, idx) => {
              const active = activeFaq === idx;
              return (
                <div key={idx} className="bg-bg-surface border border-border-premium rounded-xl overflow-hidden transition">
                  <button
                    onClick={() => setActiveFaq(active ? null : idx)}
                    className="w-full flex items-center justify-between p-4.5 focus:outline-none text-left cursor-pointer"
                  >
                    <span className="font-display font-bold text-sm text-text-secondary hover:text-text-primary transition">{faq.q}</span>
                    <ChevronDown className={`w-4.5 h-4.5 text-text-muted shrink-0 transition-transform duration-300 ${active ? 'rotate-180 text-accent' : ''}`} />
                  </button>
                  {active && (
                    <div className="px-4.5 pb-4.5 font-sans text-xs text-text-secondary leading-relaxed border-t border-border-premium/40 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section id="cta-catalogue-banner" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-accent-secondary/20 to-accent-secondary/10 border border-accent/20 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">Need custom physical files modeled?</h2>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">Our print fleets compile 3D assets on premium filaments under 12 hours. Set up custom prints easily with our cloud custom uploader.</p>
            <div className="inline-flex items-center space-x-2 text-[10px] font-mono text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
              <Flame className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>OVERHANG clearances: 45° checked</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BRAND FOOTER */}
      <footer id="belvia-brand-footer" className="bg-bg-base border-t border-border-premium pt-16 pb-8 text-xs font-mono text-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-accent-secondary text-text-on-accent rounded-lg flex items-center justify-center font-display font-bold">B</div>
              <span className="font-display font-black text-base text-text-primary tracking-widest">BELVIA.</span>
            </div>
            <p className="text-text-secondary leading-normal max-w-xs font-sans">Premium e-commerce and manufacturing print fleets executing 3D model structures in standard scale clearances.</p>
          </div>

          <div>
            <h4 className="text-text-primary text-[10px] uppercase font-bold tracking-widest mb-3.5">Fliaments catalog</h4>
            <ul className="space-y-1.5">
              <li>PLA (Matte High Res)</li>
              <li>PETG (Waterproof Lining)</li>
              <li>TPU (Flexible Gaskets)</li>
              <li>Carbon Fiber Fill (Max Strength)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-primary text-[10px] uppercase font-bold tracking-widest mb-3.5">Farm diagnostics</h4>
            <ul className="space-y-1.5">
              <li>Printer: Bambu Fleets</li>
              <li>Speeds: 250 mm/s Max</li>
              <li>Tolerances: ±0.1mm</li>
              <li>Nozzles: E3D Hardened Steel</li>
            </ul>
          </div>

          <div>
            <h4 className="text-text-primary text-[10px] uppercase font-bold tracking-widest mb-3.5">corporate procurement</h4>
            <p className="leading-relaxed mb-3 text-text-secondary font-sans">Connect with our additive farm engineers for design revisions and quote files clearance sheet listings.</p>
            <div className="text-accent font-bold hover:underline select-all text-[11px]">procure@belvia3d.com</div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-border-premium pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] gap-4">
          <div className="tracking-wide">© 2026 BELVIA 3D MANUFACTURING LTD. ALL ASSETS SECURED.</div>
          <div className="flex space-x-4">
            <span className="hover:text-text-primary cursor-pointer">Slicing SLA Policy</span>
            <span className="hover:text-text-primary cursor-pointer">Security Standards</span>
            <span className="hover:text-text-primary cursor-pointer">Bambu Studio configs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
