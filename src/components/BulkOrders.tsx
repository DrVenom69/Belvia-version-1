import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, HelpCircle, FileText, Landmark } from 'lucide-react';
import { BulkOrderRequest } from '../types';

interface BulkOrdersProps {
  onAddBulkOrder: (order: BulkOrderRequest) => void;
}

export default function BulkOrders({ onAddBulkOrder }: BulkOrdersProps) {
  const [companyName, setCompanyName] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [category, setCategory] = useState<string>('Custom Keychains Batch');
  const [quantity, setQuantity] = useState<number>(100);
  const [details, setDetails] = useState<string>('');
  const [logoFile, setLogoFile] = useState<string>('');
  const [successId, setSuccessId] = useState<string | null>(null);

  const BULK_TIERS = [
    { name: 'SME Promotions', qty: '50-200 units', discount: '15% Off Filament Rates', desc: 'Popular for custom branded keychains, custom phone holders or utility clips containing logo engravings.' },
    { name: 'Corporate Merchandise', qty: '200-500 units', discount: '25% Off + Custom Mold Design', desc: 'Perfect matching desk trophies, dual charger controller stands, or specialized desktop clocks with detailed geometry.' },
    { name: 'Industrial Scale Print', qty: '500+ volumes', discount: '40% Off + Dedicated SLA Slicers', desc: 'Fulfill hundreds of functional casings, prototypes or promotional merchandise with strict quality assurances.' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim()) {
      alert('Please compile contact fields before sending bulk request forms.');
      return;
    }

    const orderId = 'BLV-BULK-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder: BulkOrderRequest = {
      id: orderId,
      companyName,
      contactName,
      email,
      phone,
      category,
      quantity,
      details: details + (logoFile ? ` [Logo uploaded: ${logoFile}]` : ''),
      status: 'Received',
      createdAt: new Date().toLocaleDateString()
    };

    onAddBulkOrder(newOrder);
    setSuccessId(orderId);

    // reset fields
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setDetails('');
    setLogoFile('');
  };

  return (
    <section id="bulk-ordering-hub" className="py-20 bg-bg-base relative">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-black text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full shadow-sm">
            Bulk Print Farm Operations
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight mt-4">
            B2B Bulk Production &amp; Merchandise
          </h2>
          <p className="text-text-secondary text-sm mt-3 leading-relaxed">
            Need 100 customized keychains with corporate branding or 1000 promotional desktop artifacts? Belvia operates a state-of-the-art print farm running 24/7. Get dedicated volume SLA pricing sheets instantly.
          </p>
        </div>

        {successId ? (
          /* Confirmation details */
          <div className="max-w-xl mx-auto bg-bg-surface border border-border-premium p-8 rounded-2xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-9 h-9 text-accent animate-pulse" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-display font-black text-xl text-text-primary">Bulk Request Logged</h3>
              <p className="text-text-secondary text-xs">A print farm manager is validating your CAD designs. Job reservation ticket:</p>
              <div className="inline-block px-4 py-1.5 rounded bg-bg-elevated border border-border-premium text-sm font-mono font-bold text-accent mt-2">
                {successId}
              </div>
            </div>

            <p className="text-text-secondary text-xs leading-relaxed">
              We have scheduled your corporate design draft to run on a test plate. An invoice and volume quotation detailing lead times will land in your mailbox shortly.
            </p>

            <button
              onClick={() => setSuccessId(null)}
              className="px-6 py-2.5 rounded-xl bg-accent-secondary hover:bg-accent-hover text-text-on-accent font-semibold text-xs cursor-pointer transition shadow"
            >
              Request Additional Bulk Batches
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left box: Pricing tiers and promotional grids */}
            <div className="lg:col-span-6 space-y-6">
              <h3 className="font-display font-black text-xl text-text-primary text-left pl-1">Additive Manufacturing Scale Tiers</h3>
              
              <div className="space-y-4">
                {BULK_TIERS.map((tier) => (
                  <div key={tier.name} className="bg-bg-surface/60 border border-border-premium rounded-2xl p-5 text-left flex flex-col justify-between hover:border-accent transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-bold text-base text-text-primary">{tier.name}</h4>
                        <span className="inline-block mt-1 font-mono text-[10px] text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded">
                          {tier.qty}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-accent">{tier.discount}</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-3 leading-relaxed">{tier.desc}</p>
                  </div>
                ))}
              </div>

              {/* Service commitment list */}
              <div className="bg-bg-surface/40 border border-border-premium p-6 rounded-2xl text-left font-sans space-y-3">
                <h4 className="font-display font-bold text-sm text-text-primary flex items-center space-x-2">
                  <Landmark className="w-5 h-5 text-accent" />
                  <span>Belvia Corporate Farm SLA Warranties:</span>
                </h4>
                <p className="text-xs text-text-secondary leading-relaxed">
                  All bulk orders undergo rigorous dimensional testing. We inspect 3 sample models under digital macro mics for stress-points and infill integrity before routing the entire batch to our printing farm.
                </p>
              </div>

            </div>

            {/* Right box: Quote Request Form */}
            <div className="lg:col-span-6">
              <div className="bg-bg-surface border border-border-premium p-6 sm:p-7 rounded-2xl text-left shadow-2xl">
                <h3 className="font-display font-extrabold text-lg text-text-primary mb-6">Bulk Request Form</h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                        Company Name:
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Belvia Inc"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                        Corporate Contact Representative:
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Iffat Ahmed"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                        Corporate Email:
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="iffat.ahmed@belvia.com"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                        Phone Number (Optional):
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+880 12345 6789"
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                        Bulk Design Type:
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent cursor-pointer"
                      >
                        <option value="Custom Keychains Batch">Custom Logo Keychains</option>
                        <option value="Event Awards & Merch">Event Awards / Desk Trophies</option>
                        <option value="Desk Charging Controllers">Controller Controller Stands</option>
                        <option value="Custom Functional Casings">Industrial Casings / Enclosures</option>
                        <option value="Promotional Bottle Openers">Promotional Cap Bottle Openers</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                        Target Volume (QTY minimum 50):
                      </label>
                      <input
                        type="number"
                        min={50}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 50)}
                        className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Logo name */}
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                      Embossed Logo Graphic / STL Mockup Name:
                    </label>
                    <input
                      type="text"
                      value={logoFile}
                      onChange={(e) => setLogoFile(e.target.value)}
                      placeholder="corporate-logo-emboss.svg / brand-layout.stl"
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent"
                    />
                  </div>

                  {/* Specification text */}
                  <div>
                    <label className="block text-[10px] font-mono text-text-muted uppercase tracking-widest mb-1">
                      Filament Specifications &amp; Post-process finishing needs:
                    </label>
                    <textarea
                      required
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                      placeholder="Please dual-layer color emboss the logos using Matte Slate and Burnt Orange, high infill is required..."
                      className="w-full bg-bg-base text-text-primary border border-border-premium rounded-xl py-2.5 px-3 text-xs focus:border-accent resize-none"
                    />
                  </div>

                  <button
                    id="submit-bulk-btn"
                    type="submit"
                    className="w-full py-3 px-5 rounded-xl text-xs font-semibold text-text-on-accent bg-gradient-to-r from-accent to-accent-secondary hover:from-accent-hover hover:to-accent-secondary-lt transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-text-on-accent" />
                    <span>Submit Additive Corporate Request</span>
                  </button>

                </form>
              </div>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
