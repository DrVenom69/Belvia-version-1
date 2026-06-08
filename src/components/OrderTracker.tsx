import React, { useState, useEffect } from 'react';
import { Search, MapPin, CheckCircle2, Circle, Clock, Flame, ShieldAlert, Cpu, Truck, Package } from 'lucide-react';
import { Order } from '../types';

interface TrackingMilestone {
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'current' | 'pending';
}

interface MockShipment {
  id: string;
  productName: string;
  qty: number;
  material: string;
  color: string;
  weightGrams: number;
  status: string;
  estimatedArrival: string;
  milestones: TrackingMilestone[];
  telemetry?: {
    nozzleTemp: string;
    bedTemp: string;
    layer: string;
    speed: string;
    filamentLeft: string;
  };
}

const PRELOADED_SHIPMENTS: Record<string, MockShipment> = {
  'BLV-SHIP-99120': {
    id: 'BLV-SHIP-99120',
    productName: 'Custom Lithophane Lamp & LED Stand',
    qty: 1,
    material: 'PLA (High-Definition)',
    color: 'Chalk White',
    weightGrams: 210,
    status: 'In Transit - Air Freight',
    estimatedArrival: 'June 07, 2026',
    milestones: [
      { title: 'Air Cargo Dispatched', description: 'Departed from distribution terminal fly-hub.', time: 'June 04, 08:30 AM', status: 'current' },
      { title: 'Packaging & ESD Sealed', description: 'Enclosed with wooden custom-carved LED module and anti-static padding.', time: 'June 03, 04:10 PM', status: 'completed' },
      { title: 'UV Resin & Finish Check', description: 'Checked for dimensional compliance (+/- 0.08mm tolerance verified).', time: 'June 03, 11:20 AM', status: 'completed' },
      { title: 'Additive 3D Print Complete', description: 'Extruded over 18,200 continuous gcode vector command curves.', time: 'June 02, 09:45 PM', status: 'completed' }
    ]
  },
  'BLV-SHIP-00812': {
    id: 'BLV-SHIP-00812',
    productName: 'Articulated Obsidian Rift Dragon',
    qty: 2,
    material: 'PLA (Silk Pearl)',
    color: 'Neon Nebula',
    weightGrams: 330,
    status: 'Out for Local Delivery',
    estimatedArrival: 'Today (By 6:00 PM)',
    milestones: [
      { title: 'Local Courier Dispatch', description: 'Interlocking flexi-joints placed in primary distribution bag with driver.', time: 'June 04, 01:15 PM', status: 'current' },
      { title: 'Arrived at Local Sort Hub', description: 'Sorted at sorting office block grid.', time: 'June 04, 05:40 AM', status: 'completed' },
      { title: 'Custom Clearance Approved', description: 'Logistics cargo inspection completed smoothly.', time: 'June 03, 02:40 PM', status: 'completed' },
      { title: 'Print Farm Curing Complete', description: 'Extruder batch validated and boxed in Belvia high-density carton.', time: 'June 01, 10:00 AM', status: 'completed' }
    ]
  },
  'BLV-SHIP-71510': {
    id: 'BLV-SHIP-71510',
    productName: 'Modular Helix Desk Organizer',
    qty: 1,
    material: 'PLA (Matte)',
    color: 'Matte Slate',
    weightGrams: 110,
    status: 'Printing Active Core',
    estimatedArrival: 'June 09, 2026',
    telemetry: {
      nozzleTemp: '218°C',
      bedTemp: '55°C',
      layer: '1640 / 2250 Slices',
      speed: '280 mm/s',
      filamentLeft: '84 meters'
    },
    milestones: [
      { title: '3D Printer Farm Slicing Node Active', description: 'Actively printing structural gyroid internal infill at layer 1640/2250.', time: 'June 04, 04:45 PM (Live)', status: 'current' },
      { title: 'Klipper Bed Probe Levelling', description: '36-point inductive levelling check passed. Variance: 0.015mm.', time: 'June 04, 02:10 PM', status: 'completed' },
      { title: 'G-Code Telemetry Dequeued', description: 'Slicing profiles compiled with 15% gyroid internal strength grids.', time: 'June 04, 01:30 PM', status: 'completed' },
      { title: 'Print Job Received', description: 'Payment cleared. Allocating printer bed #B4 (Bambu Lab P1S).', time: 'June 04, 12:45 PM', status: 'completed' }
    ]
  }
};

export default function OrderTracker() {
  const [searchCode, setSearchCode] = useState('');
  const [activeShipment, setActiveShipment] = useState<MockShipment | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [dbOrders, setDbOrders] = useState<Order[]>([]);

  // Fetch all orders on mount to search locally
  useEffect(() => {
    fetch('/api/get-orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbOrders(data);
        }
      })
      .catch(err => console.error("Error fetching tracker orders:", err));
  }, []);

  const handleSearch = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setHasSearched(true);

    // 1. Check preloaded mock shipments
    if (PRELOADED_SHIPMENTS[trimmed]) {
      setActiveShipment(PRELOADED_SHIPMENTS[trimmed]);
      return;
    }

    // 2. Check local database orders
    const foundOrder = dbOrders.find(o => o.id.toUpperCase() === trimmed);
    if (foundOrder) {
      const firstItem = foundOrder.items[0];
      const totalQty = foundOrder.items.reduce((acc, item) => acc + item.quantity, 0);

      const createdDateStr = new Date(foundOrder.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const submittedDateStr = foundOrder.payment.submittedAt
        ? new Date(foundOrder.payment.submittedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '';

      const milestones: TrackingMilestone[] = [
        {
          title: 'Order Placed',
          description: 'Order reference generated and checkout initiated.',
          time: createdDateStr,
          status: 'completed'
        }
      ];

      // Payment verification milestone mapping
      if (foundOrder.status === 'Pending') {
        milestones.push({
          title: 'Payment Pending',
          description: 'Awaiting manual payment proof submission.',
          time: '',
          status: 'current'
        });
      } else if (foundOrder.status === 'Paid') {
        milestones.push({
          title: 'Payment Verification',
          description: `Proof submitted (TrxID: ${foundOrder.payment.trxId}). Awaiting admin verification.`,
          time: submittedDateStr,
          status: 'current'
        });
      } else {
        milestones.push({
          title: 'Payment Verified',
          description: `Payment cleared successfully (TrxID: ${foundOrder.payment.trxId}).`,
          time: submittedDateStr || createdDateStr,
          status: 'completed'
        });
      }

      // Manufacturing queue milestone mapping
      if (foundOrder.status === 'Processing') {
        milestones.push({
          title: 'Active Core Printing',
          description: '3D Slicing Node Active. Printing infill structures at layer 840/1520.',
          time: 'Live Telemetry Active',
          status: 'current'
        });
      } else if (foundOrder.status === 'Shipped' || foundOrder.status === 'Completed') {
        milestones.push({
          title: '3D Printing Complete',
          description: 'All layers completed and verified for ESD standards.',
          time: createdDateStr,
          status: 'completed'
        });
      } else {
        milestones.push({
          title: 'Queue Scheduled',
          description: 'Awaiting payment verification before file dispatch.',
          time: '',
          status: 'pending'
        });
      }

      // Courier delivery milestone mapping
      if (foundOrder.status === 'Shipped') {
        milestones.push({
          title: 'Dispatched via Courier',
          description: 'Handed over to local courier. Out for delivery in transit.',
          time: 'In Transit',
          status: 'current'
        });
      } else if (foundOrder.status === 'Completed') {
        milestones.push({
          title: 'Package Delivered',
          description: 'Successfully received and confirmed by client.',
          time: 'Completed',
          status: 'completed'
        });
      } else {
        milestones.push({
          title: 'Courier Logistics Dispatch',
          description: 'Queue awaiting print manufacture run.',
          time: '',
          status: 'pending'
        });
      }

      // Reverse so latest is first
      milestones.reverse();

      const mappedShipment: MockShipment = {
        id: foundOrder.id,
        productName: firstItem
          ? `${firstItem.product.title}${foundOrder.items.length > 1 ? ` + ${foundOrder.items.length - 1} other shapes` : ''}`
          : 'Custom Manufacturing Order',
        qty: totalQty,
        material: firstItem ? firstItem.selectedMaterial : 'PLA (Matte)',
        color: firstItem ? firstItem.selectedColor : 'Obsidian Black',
        weightGrams: foundOrder.totalWeight,
        status: (() => {
          if (foundOrder.status === 'Pending') return 'Awaiting Payment';
          if (foundOrder.status === 'Paid') return 'Awaiting Verification';
          if (foundOrder.status === 'Processing') return 'Printing Active Core';
          if (foundOrder.status === 'Shipped') return 'In Transit - Courier';
          return 'Completed';
        })(),
        estimatedArrival: (() => {
          if (foundOrder.status === 'Pending') return 'Awaiting Payment';
          if (foundOrder.status === 'Paid') return 'Awaiting Admin Verification';
          if (foundOrder.status === 'Processing') return 'Estimated: 2-3 Days';
          if (foundOrder.status === 'Shipped') return 'Estimated: 1-2 Days (In Transit)';
          return 'Delivered';
        })(),
        milestones,
        telemetry: foundOrder.status === 'Processing' ? {
          nozzleTemp: '218°C',
          bedTemp: '55°C',
          layer: '840 / 1520 Slices',
          speed: '250 mm/s',
          filamentLeft: '34 meters'
        } : undefined
      };

      setActiveShipment(mappedShipment);
    } else {
      setActiveShipment(null);
    }
  };

  return (
    <section id="tracker-section" className="py-16 bg-bg-base min-h-[80vh] relative">
      <div className="absolute inset-0 bg-grid-ambient pointer-events-none opacity-20" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-10">
          <span className="font-mono text-xs font-semibold text-accent uppercase tracking-widest block mb-2">
            Additive Factory Telemetry
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-text-primary">
            Belvia Logistics Tracker
          </h2>
          <p className="text-text-secondary text-sm mt-3 max-w-lg mx-auto">
            Input your specialized Reference shipment code (e.g., `BLV-ORD-XXXXXX` or `BLV-SHIP-99120`) to review machine printing slices, active bed temperature diagnostics, and air freighting milestones.
          </p>
        </div>

        {/* Input Card Container */}
        <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 shadow-2xl mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchCode);
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-grow">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-muted" />
              <input
                id="shipment-search-field"
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter order reference (e.g. BLV-ORD-100204)..."
                className="w-full bg-bg-base text-text-primary pl-10.5 pr-4 py-3 rounded-xl border border-border-premium focus:border-accent focus:ring-1 focus:ring-accent/30 text-sm font-mono tracking-wider transition"
              />
            </div>
            <button
              id="btn-trigger-track"
              type="submit"
              className="px-6 py-3 bg-accent-secondary hover:bg-accent-hover text-text-on-accent font-bold text-xs rounded-xl cursor-pointer transition flex items-center justify-center space-x-2"
            >
              <span>Track Live Delivery</span>
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="mt-5.5 pt-4.5 border-t border-border-premium flex flex-wrap items-center gap-2 text-xs">
            <span className="text-text-muted font-mono">QUICK VERIFICATION SHIPMENT CODES:</span>
            <button
              onClick={() => {
                setSearchCode('BLV-SHIP-99120');
                handleSearch('BLV-SHIP-99120');
              }}
              className="px-3 py-1 rounded bg-bg-elevated border border-border-premium text-accent hover:text-text-primary hover:border-accent font-mono text-[11px] transition cursor-pointer"
            >
              BLV-SHIP-99120 (Lithophane - Transit)
            </button>
            <button
              onClick={() => {
                setSearchCode('BLV-SHIP-00812');
                handleSearch('BLV-SHIP-00812');
              }}
              className="px-3 py-1 rounded bg-bg-elevated border border-border-premium text-accent hover:text-text-primary hover:border-accent font-mono text-[11px] transition cursor-pointer"
            >
              BLV-SHIP-00812 (Dragon - Delivery)
            </button>
            <button
              onClick={() => {
                setSearchCode('BLV-SHIP-71510');
                handleSearch('BLV-SHIP-71510');
              }}
              className="px-3 py-1 rounded bg-bg-elevated border border-border-premium text-accent hover:text-text-primary hover:border-accent font-mono text-[11px] transition cursor-pointer"
            >
              BLV-SHIP-71510 (Organizer - Printing)
            </button>
          </div>
        </div>

        {/* Dynamic Tracking Status Card Grid */}
        {hasSearched && (
          activeShipment ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Primary Summary Block */}
              <div className="bg-bg-surface border border-border-premium rounded-2xl p-6 text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-premium pb-4 mb-4 gap-4">
                  <div>
                    <span className="text-[10px] bg-accent/10 text-accent border border-accent/10 font-bold font-mono px-2 py-1 rounded">
                      {activeShipment.id}
                    </span>
                    <h3 className="font-display font-black text-xl text-text-primary mt-2">
                      {activeShipment.productName}
                    </h3>
                    <p className="text-text-secondary text-xs font-mono mt-1">
                      SPECIFICATIONS: Qty {activeShipment.qty} // {activeShipment.material} ({activeShipment.color}) // Vol-Mass: {activeShipment.weightGrams}g
                    </p>
                  </div>
                  <div className="text-right md:text-right">
                    <span className="block text-[9px] font-mono text-text-muted uppercase">ESTIMATED ETA</span>
                    <span className="text-text-primary font-bold font-sans text-base">{activeShipment.estimatedArrival}</span>
                  </div>
                </div>

                {/* 3D Printer Diagnostic telemetry if active printing job */}
                {activeShipment.telemetry && (
                  <div className="bg-bg-base/80 border border-accent/20 rounded-xl p-4.5 mb-6.5 text-left">
                    <div className="flex items-center space-x-2 text-xs font-bold text-accent font-mono mb-3.5">
                      <Cpu className="w-4.5 h-4.5 text-accent animate-spin" />
                      <span>LIVE PRINT BED DIAGNOSTIC RADAR (BED #B4)</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
                      <div className="bg-bg-elevated p-2.5 rounded border border-border-premium">
                        <span className="block text-[8px] text-text-muted font-bold mb-1">NOZZLE TEMP</span>
                        <span className="text-text-primary font-bold flex items-center">
                          <Flame className="w-3.5 h-3.5 text-red-500 mr-1 animate-pulse" />
                          {activeShipment.telemetry.nozzleTemp}
                        </span>
                      </div>
                      <div className="bg-bg-elevated p-2.5 rounded border border-border-premium">
                        <span className="block text-[8px] text-text-muted font-bold mb-1">HEATED SEET TEMP</span>
                        <span className="text-text-primary font-bold">{activeShipment.telemetry.bedTemp}</span>
                      </div>
                      <div className="bg-bg-elevated p-2.5 rounded border border-border-premium">
                        <span className="block text-[8px] text-text-muted font-bold mb-1">CURRENT SLICE LAYER</span>
                        <span className="text-accent font-bold text-[11px] animate-pulse">{activeShipment.telemetry.layer}</span>
                      </div>
                      <div className="bg-bg-elevated p-2.5 rounded border border-border-premium">
                        <span className="block text-[8px] text-text-muted font-bold mb-1">FDM SPEED</span>
                        <span className="text-text-primary font-bold">{activeShipment.telemetry.speed}</span>
                      </div>
                      <div className="bg-bg-elevated p-2.5 rounded border border-border-premium col-span-2 md:col-span-1">
                        <span className="block text-[8px] text-text-muted font-bold mb-1">FLMT MASS LEFT</span>
                        <span className="text-cyan-400 font-bold">{activeShipment.telemetry.filamentLeft}</span>
                      </div>
                    </div>
                    <div className="w-full bg-bg-surface rounded-full h-1.5 mt-4 overflow-hidden border border-border-premium">
                      <div className="bg-gradient-to-r from-accent to-accent-secondary h-1.5 rounded-full animate-pulse" style={{ width: '72%' }} />
                    </div>
                  </div>
                )}

                {/* Logistics Milestones Timeline */}
                <div className="space-y-6 relative pl-6 border-l border-border-premium">
                  {activeShipment.milestones.map((ml, idx) => {
                    const isCurrent = ml.status === 'current';
                    return (
                      <div key={idx} className="relative text-left">
                        {/* Bullet Icon */}
                        <div className="absolute -left-9.5 top-0.5 z-10 bg-bg-surface p-1 rounded-full border">
                          {isCurrent ? (
                            <Truck className="w-4 h-4 text-accent animate-bounce" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-accent fill-current" />
                          )}
                        </div>

                        {/* Title text */}
                        <div className="space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                            <h4 className={`text-sm font-bold ${isCurrent ? 'text-accent text-base' : 'text-text-primary'}`}>
                              {ml.title}
                            </h4>
                            {ml.time && <span className="text-[10px] font-mono text-text-muted">{ml.time}</span>}
                          </div>
                          <p className="text-text-secondary text-xs">{ml.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Error tracking block */
            <div className="bg-bg-surface border border-border-premium rounded-2xl p-10 text-center max-w-md mx-auto space-y-4 animate-in fade-in duration-300">
              <div className="w-12 h-12 bg-red-950/45 border border-red-900/60 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
              </div>
              <h3 className="font-display font-black text-lg text-text-primary">Tracking Reference Not Found</h3>
              <p className="text-text-secondary text-xs max-w-xs mx-auto">
                The tracking coordinate reference code `{searchCode}` could not be resolved across our logistics queues. Try entering a valid order reference code or one of our verified default codes above!
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}
