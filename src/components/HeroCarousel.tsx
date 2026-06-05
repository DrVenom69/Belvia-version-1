import React, { useRef } from 'react';

// ─── Product Data ──────────────────────────────────────────────────────────────
// Each item maps to a real product category so clicking opens the relevant store view
export interface CarouselItem {
  src: string;
  label: string;
  tag: string;
  category: string;   // matches App.tsx product category for filtering
  size: 'full' | 'top' | 'bottom'; // layout slot within a column
}

// 19 cards arranged into columns of the masonry strip.
// 'full'   = occupies the entire column height
// 'top'    = occupies the upper half of a 2-card column
// 'bottom' = occupies the lower half of a 2-card column
//
// Pairing rule: every 'top' must be immediately followed by a 'bottom'.
export const CAROUSEL_ITEMS: CarouselItem[] = [
  // col 1 – full
  { src: '/images/products/product_desk_organizer_1780670605562.png',       label: 'Geo Desk Organizer',     tag: 'Desk Accessories',         category: 'Desk Accessories',         size: 'full'   },
  // col 2 – two stacked
  { src: '/images/products/product_skull_planter_1780670618312.png',        label: 'Gothic Skull Planter',   tag: 'Home Decor',               category: 'Home Decor',               size: 'top'    },
  { src: '/images/products/product_cable_clips_1780670752617.png',          label: 'Cable Clips Set',        tag: 'Desk Accessories',         category: 'Desk Accessories',         size: 'bottom' },
  // col 3 – full (hero centre card, wide)
  { src: '/images/products/product_gyroscope_fidget_1780670678897.png',     label: 'Gyroscope Fidget',       tag: 'Gaming Accessories',       category: 'Gaming Accessories',       size: 'full'   },
  // col 4 – two stacked
  { src: '/images/products/product_moon_lamp_1780670634368.png',            label: 'Wireframe Moon Lamp',    tag: 'Home Decor',               category: 'Home Decor',               size: 'top'    },
  { src: '/images/products/product_wall_tiles_1780670797745.png',           label: 'Hex Wall Tiles',         tag: 'Home Decor',               category: 'Home Decor',               size: 'bottom' },
  // col 5 – full
  { src: '/images/products/product_headphone_stand_1780670666790.png',      label: 'Headphone Stand',        tag: 'Desk Accessories',         category: 'Desk Accessories',         size: 'full'   },
  // col 6 – two stacked
  { src: '/images/products/product_multitool_keyring_1780670785136.png',    label: 'Multi-Tool Keyring',     tag: 'Keychains',                category: 'Keychains',                size: 'top'    },
  { src: '/images/products/product_dice_tower_1780670692414.png',           label: 'Medieval Dice Tower',    tag: 'Gaming Accessories',       category: 'Gaming Accessories',       size: 'bottom' },
  // col 7 – full
  { src: '/images/products/product_geometric_planter_1780670724568.png',    label: 'Hexagonal Planter',      tag: 'Home Decor',               category: 'Home Decor',               size: 'full'   },
  // col 8 – two stacked
  { src: '/images/products/product_phone_stand_1780670710802.png',          label: 'Carbon Phone Stand',     tag: 'Desk Accessories',         category: 'Desk Accessories',         size: 'top'    },
  { src: '/images/products/product_business_card_holder_1780670772449.png', label: 'Business Card Holder',   tag: 'Business Merch',           category: 'Business Merchandise',     size: 'bottom' },
  // col 9 – full
  { src: '/images/products/product_dragon_keychain_1780670592667.png',      label: 'Dragon Keychain',        tag: 'Keychains',                category: 'Keychains',                size: 'full'   },
  // col 10 – two stacked
  { src: '/images/products/product_mini_armor_1780670739609.png',           label: 'Samurai Figurine',       tag: 'Figures & Collectibles',   category: 'Figures & Collectibles',   size: 'top'    },
  { src: '/images/products/product_flexi_snake_1780670655120.png',          label: 'Flexi-Snake Toy',        tag: 'Figures & Collectibles',   category: 'Figures & Collectibles',   size: 'bottom' },
  // col 11 – full (repeat for seamless loop density)
  { src: '/images/products/hero_products_row1_1780670549040.png',           label: 'Collection Showcase',    tag: 'Featured',                 category: 'Keychains',                size: 'full'   },
  // col 12 – two stacked
  { src: '/images/products/product_skull_planter_1780670618312.png',        label: 'Gothic Skull Planter',   tag: 'Home Decor',               category: 'Home Decor',               size: 'top'    },
  { src: '/images/products/product_gyroscope_fidget_1780670678897.png',     label: 'Gyroscope Fidget',       tag: 'Gaming Accessories',       category: 'Gaming Accessories',       size: 'bottom' },
  // col 13 – full
  { src: '/images/products/product_moon_lamp_1780670634368.png',            label: 'Ambient Moon Lamp',      tag: 'Home Decor',               category: 'Home Decor',               size: 'full'   },
];

// ─── Build column groups from the flat list ────────────────────────────────────
interface Column {
  items: CarouselItem[];
}

function buildColumns(items: CarouselItem[]): Column[] {
  const cols: Column[] = [];
  let i = 0;
  while (i < items.length) {
    if (items[i].size === 'full') {
      cols.push({ items: [items[i]] });
      i++;
    } else if (items[i].size === 'top' && i + 1 < items.length && items[i + 1].size === 'bottom') {
      cols.push({ items: [items[i], items[i + 1]] });
      i += 2;
    } else {
      // fallback – treat as full
      cols.push({ items: [{ ...items[i], size: 'full' }] });
      i++;
    }
  }
  return cols;
}

// ─── Card component ────────────────────────────────────────────────────────────
interface CardProps {
  item: CarouselItem;
  isFull: boolean;
  onCardClick: (category: string) => void;
}

function Card({ item, isFull, onCardClick }: CardProps) {
  return (
    <button
      type="button"
      onClick={() => onCardClick(item.category)}
      className={`relative block w-full overflow-hidden rounded-2xl cursor-pointer group border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        isFull ? 'h-full' : 'flex-1'
      }`}
      aria-label={`View ${item.label}`}
      style={{ minHeight: 0 }} // allow flex child to shrink
    >
      {/* Image */}
      <img
        src={item.src}
        alt={item.label}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 select-none"
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.style.opacity = '0';
        }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300 pointer-events-none" />

      {/* Category tag – appears on hover */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="inline-block px-2 py-0.5 rounded-full bg-accent text-[9px] font-mono font-black text-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-1 group-hover:translate-y-0 shadow-sm">
          {item.tag}
        </span>
      </div>

      {/* Product label at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
        <p className="text-white text-[11px] font-display font-semibold leading-tight truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200 group-hover:text-accent">
          {item.label}
        </p>
      </div>

      {/* Gold border glow on hover */}
      <div className="absolute inset-0 rounded-2xl ring-0 ring-accent/0 group-hover:ring-1 group-hover:ring-accent/50 transition-all duration-300 pointer-events-none" />
    </button>
  );
}

// ─── Column component ──────────────────────────────────────────────────────────
interface ColProps {
  col: Column;
  colWidth: number; // px
  onCardClick: (category: string) => void;
}

function Col({ col, colWidth, onCardClick }: ColProps) {
  const isSingle = col.items.length === 1;
  return (
    <div
      className="flex-shrink-0 flex flex-col gap-3"
      style={{ width: colWidth, height: '100%' }}
    >
      {isSingle ? (
        <Card item={col.items[0]} isFull onCardClick={onCardClick} />
      ) : (
        <>
          <Card item={col.items[0]} isFull={false} onCardClick={onCardClick} />
          <Card item={col.items[1]} isFull={false} onCardClick={onCardClick} />
        </>
      )}
    </div>
  );
}

// ─── Main Carousel ─────────────────────────────────────────────────────────────
interface HeroCarouselProps {
  onCategoryClick: (category: string) => void;
}

export default function HeroCarousel({ onCategoryClick }: HeroCarouselProps) {
  const COL_WIDTH = 220; // px – individual column width
  const GAP = 12;        // px – gap between columns
  const HEIGHT = 420;    // px – fixed strip height

  const columns = buildColumns(CAROUSEL_ITEMS);
  // Duplicate for seamless loop
  const trackCols = [...columns, ...columns];

  // Total width of ONE copy of the track (used for animation keyframe)
  const singleTrackWidth = columns.length * (COL_WIDTH + GAP);

  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-full overflow-hidden relative"
      style={{ height: HEIGHT }}
      // Pause on hover using CSS via the data attribute
      onMouseEnter={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'paused';
      }}
      onMouseLeave={() => {
        if (trackRef.current) trackRef.current.style.animationPlayState = 'running';
      }}
    >
      {/* Left fade */}
      <div
        className="absolute inset-y-0 left-0 w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--bg-base) 0%, transparent 100%)' }}
      />
      {/* Right fade */}
      <div
        className="absolute inset-y-0 right-0 w-28 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--bg-base) 0%, transparent 100%)' }}
      />

      {/* Scrolling track */}
      <div
        ref={trackRef}
        className="flex"
        style={{
          gap: GAP,
          height: '100%',
          width: `${2 * singleTrackWidth}px`,
          animation: `heroCarouselScroll ${columns.length * 3.5}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {trackCols.map((col, idx) => (
          <Col
            key={idx}
            col={col}
            colWidth={COL_WIDTH}
            onCardClick={onCategoryClick}
          />
        ))}
      </div>
    </div>
  );
}
