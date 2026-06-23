import React, { useRef } from 'react';
import { Product } from '../types';
import { formatPrice } from '../utils/format';

export interface CarouselItem {
  src: string;
  label: string;
  tag: string;
  category: string;
  price: number;
  size: 'full' | 'top' | 'bottom';
}

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
      style={{ minHeight: 0 }}
    >
      {/* Image */}
      <img
        src={item.src}
        alt={item.label}
        loading="lazy"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 select-none"
        onError={(e) => {
          e.currentTarget.src = '/images/placeholder.png';
        }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

      {/* Category tag – appears on hover */}
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="inline-block px-2 py-0.5 rounded-full bg-accent/90 text-[9px] font-mono font-black text-black tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200 translate-y-1 group-hover:translate-y-0 shadow-sm">
          {item.tag}
        </span>
      </div>

      {/* Product label and price at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none text-left">
        <p className="text-white text-[11px] font-display font-semibold leading-tight truncate group-hover:text-accent transition-colors duration-200">
          {item.label}
        </p>
        <p className="text-accent text-[9px] font-mono font-bold leading-tight mt-0.5 opacity-80 group-hover:opacity-100 transition-opacity duration-200">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* Gold border glow on hover */}
      <div className="absolute inset-0 rounded-2xl ring-0 ring-accent/0 group-hover:ring-1 group-hover:ring-accent/50 transition-all duration-300 pointer-events-none" />
    </button>
  );
}

interface ColProps {
  key?: React.Key | number;
  col: Column;
  colWidth: number;
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

interface HeroCarouselProps {
  products: Product[];
  onCategoryClick: (category: string) => void;
}

export default function HeroCarousel({ products, onCategoryClick }: HeroCarouselProps) {
  const COL_WIDTH = 220; // px – individual column width
  const GAP = 12;        // px – gap between columns
  const HEIGHT = 420;    // px – fixed strip height

  // 1. Filter, sort, and select products
  const productsWithImages = (products || [])
    .filter(p => p.images && p.images.length > 0);

  // Get products curated for the carousel
  let curatedProducts = productsWithImages.filter(p => p.featured_carousel === true);

  // Sort featured products by carousel_order ascending first, then by updated_at descending
  curatedProducts.sort((a, b) => {
    const orderA = a.carousel_order !== undefined ? a.carousel_order : 999999;
    const orderB = b.carousel_order !== undefined ? b.carousel_order : 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return timeB - timeA;
  });

  // Fallback: If fewer than 3 products are featured, auto-fill with most recent products to avoid empty carousel
  if (curatedProducts.length < 3) {
    const featuredIds = new Set(curatedProducts.map(p => p.id));
    const nonFeatured = productsWithImages
      .filter(p => !featuredIds.has(p.id))
      .sort((a, b) => {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return timeB - timeA;
      });
    const fillCount = 8 - curatedProducts.length;
    const toAdd = nonFeatured.slice(0, Math.max(0, fillCount));
    curatedProducts = [...curatedProducts, ...toAdd];
  }

  // Deduplicate and limit to max 12 items for carousel loop performance
  const validProducts = curatedProducts
    .reduce((acc: Product[], current) => {
      if (!acc.some(p => p.id === current.id)) {
        acc.push(current);
      }
      return acc;
    }, [])
    .slice(0, 12);

  if (validProducts.length === 0) {
    return (
      <div 
        className="w-full overflow-hidden relative flex items-center justify-center border border-white/5 bg-bg-surface/30 rounded-2xl animate-pulse" 
        style={{ height: HEIGHT }}
      >
        <p className="text-text-secondary text-xs font-mono">Loading precision models...</p>
      </div>
    );
  }

  // 2. Map products to CarouselItem structure, assigning size to build masonry columns
  const items: CarouselItem[] = [];
  let sizeIndex = 0;
  for (let i = 0; i < validProducts.length; i++) {
    const p = validProducts[i];
    let size: 'full' | 'top' | 'bottom' = 'full';

    const cycle = sizeIndex % 3;
    if (cycle === 0) {
      size = 'full';
      sizeIndex++;
    } else if (cycle === 1) {
      if (i === validProducts.length - 1) {
        size = 'full';
      } else {
        size = 'top';
        sizeIndex++;
      }
    } else {
      size = 'bottom';
      sizeIndex++;
    }

    items.push({
      src: p.images[0],
      label: p.title,
      tag: p.category,
      category: p.category,
      price: p.isPreOrder ? p.price : (p.price - Math.round(p.price * 0.12)),
      size
    });
  }

  const columns = buildColumns(items);

  // Clone 3 columns at start and end for seamless looping wrap
  const cloneCount = Math.min(3, columns.length);
  const prependedClones = columns.slice(-cloneCount);
  const appendedClones = columns.slice(0, cloneCount);
  const trackCols = [...prependedClones, ...columns, ...appendedClones];

  // Total width of ONE copy of the track
  const singleTrackWidth = columns.length * (COL_WIDTH + GAP);

  // Translate offsets
  const startTranslate = -cloneCount * (COL_WIDTH + GAP);
  const endTranslate = startTranslate - singleTrackWidth;

  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-full overflow-hidden relative"
      style={{ height: HEIGHT }}
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
          width: `${(columns.length + 2 * cloneCount) * (COL_WIDTH + GAP)}px`,
          animationName: 'heroCarouselScrollCustom',
          animationDuration: `${columns.length * 3.5}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          willChange: 'transform',
          // @ts-ignore
          '--start-x': `${startTranslate}px`,
          // @ts-ignore
          '--end-x': `${endTranslate}px`,
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
