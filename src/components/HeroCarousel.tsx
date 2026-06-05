import React from 'react';

// ─── Product Data ──────────────────────────────────────────────────────────────
const PRODUCTS: { src: string; label: string; tag: string }[] = [
  { src: '/images/products/product_dragon_keychain_1780670592667.png',       label: 'Dragon Keychain',        tag: 'Keychains' },
  { src: '/images/products/product_desk_organizer_1780670605562.png',        label: 'Geo Desk Organizer',     tag: 'Desk Accessories' },
  { src: '/images/products/product_skull_planter_1780670618312.png',         label: 'Gothic Skull Planter',   tag: 'Home Decor' },
  { src: '/images/products/product_moon_lamp_1780670634368.png',             label: 'Wireframe Moon Lamp',    tag: 'Home Decor' },
  { src: '/images/products/product_flexi_snake_1780670655120.png',           label: 'Flexi-Snake Toy',        tag: 'Figures' },
  { src: '/images/products/product_headphone_stand_1780670666790.png',       label: 'Headphone Stand',        tag: 'Desk Accessories' },
  { src: '/images/products/product_gyroscope_fidget_1780670678897.png',      label: 'Gyroscope Fidget',       tag: 'Gaming' },
  { src: '/images/products/product_dice_tower_1780670692414.png',            label: 'Medieval Dice Tower',    tag: 'Gaming Accessories' },
  { src: '/images/products/product_phone_stand_1780670710802.png',           label: 'Carbon Phone Stand',     tag: 'Desk Accessories' },
  { src: '/images/products/product_geometric_planter_1780670724568.png',     label: 'Hexagonal Planter',      tag: 'Home Decor' },
  { src: '/images/products/product_mini_armor_1780670739609.png',            label: 'Samurai Figurine',       tag: 'Figures & Collectibles' },
  { src: '/images/products/product_cable_clips_1780670752617.png',           label: 'Cable Clips Set',        tag: 'Desk Accessories' },
  { src: '/images/products/product_business_card_holder_1780670772449.png',  label: 'Business Card Holder',   tag: 'Business Merch' },
  { src: '/images/products/product_multitool_keyring_1780670785136.png',     label: 'Multi-Tool Keyring',     tag: 'Keychains' },
  { src: '/images/products/product_wall_tiles_1780670797745.png',            label: 'Hex Wall Tiles',         tag: 'Home Decor' },
  { src: '/images/products/hero_products_row1_1780670549040.png',            label: 'Collection Showcase',    tag: 'Featured' },
  { src: '/images/products/hero_products_individual_1780670571112.png',      label: 'Product Gallery',        tag: 'Featured' },
  { src: '/images/products/product_dragon_keychain_1780670592667.png',       label: 'Articulated Dragon',     tag: 'Keychains' },
  { src: '/images/products/product_moon_lamp_1780670634368.png',             label: 'Ambient Moon Lamp',      tag: 'Home Decor' },
];

// Split into two rows; second row gets reversed order for opposite scroll direction
const ROW_A = PRODUCTS.slice(0, 10);
const ROW_B = [...PRODUCTS.slice(10), ...PRODUCTS.slice(0, 9)].reverse();

interface ProductCardProps {
  src: string;
  label: string;
  tag: string;
  tall?: boolean;
}

function ProductCard({ src, label, tag, tall = false }: ProductCardProps) {
  return (
    <div
      className={`relative flex-shrink-0 rounded-2xl overflow-hidden group cursor-pointer select-none border border-white/5 ${tall ? 'w-52 h-72' : 'w-44 h-52'}`}
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
    >
      {/* Image */}
      <img
        src={src}
        alt={label}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300" />

      {/* Tag pill */}
      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-accent/90 text-[10px] font-mono font-bold text-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {tag}
      </div>

      {/* Label */}
      <div className="absolute bottom-3 left-3 right-3">
        <p className="text-white text-xs font-display font-semibold leading-tight truncate group-hover:text-accent transition-colors duration-300">
          {label}
        </p>
      </div>

      {/* Hover accent glow border */}
      <div className="absolute inset-0 rounded-2xl ring-0 ring-accent/0 group-hover:ring-1 group-hover:ring-accent/40 transition-all duration-300 pointer-events-none" />
    </div>
  );
}

// ─── Main Carousel Component ───────────────────────────────────────────────────
export default function HeroCarousel() {
  // Duplicate items to create seamless infinite loop
  const trackA = [...ROW_A, ...ROW_A];
  const trackB = [...ROW_B, ...ROW_B];

  return (
    <div className="w-full overflow-hidden py-4 space-y-4 relative">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-bg-base to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-bg-base to-transparent" />

      {/* Row A — scrolls LEFT */}
      <div className="flex gap-4" style={{ animation: 'scrollLeft 40s linear infinite' }}>
        {trackA.map((p, i) => (
          <ProductCard key={`a-${i}`} src={p.src} label={p.label} tag={p.tag} tall={i % 3 === 0} />
        ))}
      </div>

      {/* Row B — scrolls RIGHT (opposite direction) */}
      <div className="flex gap-4" style={{ animation: 'scrollRight 45s linear infinite' }}>
        {trackB.map((p, i) => (
          <ProductCard key={`b-${i}`} src={p.src} label={p.label} tag={p.tag} tall={i % 4 === 1} />
        ))}
      </div>
    </div>
  );
}
