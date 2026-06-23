import { MaterialRecipe } from '../types';

export interface CostBreakdown {
  filament_cost: number;
  resin_cost: number;
  accessory_costs: number;
  electricity: number;
  depreciation: number;
  packaging: number;
  subtotal: number;
  platform_fee: number;
  total_cost: number;
}

export function calculateFloorPrice(
  recipe: MaterialRecipe,
  filamentCostPerGram: number, // weighted average cost per gram
  resinCostPerGram: number,    // resin cost per gram (lookup from UV Resin accessory)
  accessoryCosts: Record<string, number>, // accessory name to unit cost map
  settings: {
    default_target_margin: number;
    electricity_cost_per_hour: number;
    depreciation_cost_per_hour: number;
    packaging_cost_flat: number;
    platform_fee_percent: number;
  }
): { cost_breakdown: CostBreakdown; floor_price_bdt: number } {
  // 1. Filament cost
  const filamentCost = (recipe.filament_grams || 0) * (filamentCostPerGram || 0);

  // 2. Resin cost (only if UV finish is enabled)
  const resinCost = recipe.has_uv_finish 
    ? (recipe.resin_grams || 0) * (resinCostPerGram || 10) 
    : 0;

  // 3. Accessories cost
  let accessoryCostTotal = 0;
  if (recipe.accessories && Array.isArray(recipe.accessories)) {
    recipe.accessories.forEach(accName => {
      accessoryCostTotal += accessoryCosts[accName] || 0;
    });
  }

  // 4. Operational costs
  const electricity = (recipe.print_hours || 0) * (settings.electricity_cost_per_hour || 3);
  const depreciation = (recipe.print_hours || 0) * (settings.depreciation_cost_per_hour || 20);
  const packaging = settings.packaging_cost_flat || 40;

  // 5. Subtotal and fees
  const subtotal = filamentCost + resinCost + accessoryCostTotal + electricity + depreciation + packaging;
  const platformFee = subtotal * ((settings.platform_fee_percent || 3) / 100);
  const totalCost = subtotal + platformFee;

  // 6. Floor price based on True Profit Margin
  const targetMargin = typeof recipe.target_margin === 'number' && recipe.target_margin !== null
    ? recipe.target_margin
    : settings.default_target_margin;

  // Safeguard: cap margin to 99% to prevent division by zero or negative prices
  const safeMargin = Math.min(Math.max(targetMargin, 0), 99);
  const rawFloorPrice = totalCost / (1 - safeMargin / 100);
  const floorPrice = Math.ceil(rawFloorPrice / 5) * 5; // Round up to nearest ৳5

  return {
    cost_breakdown: {
      filament_cost: Math.round(filamentCost),
      resin_cost: Math.round(resinCost),
      accessory_costs: Math.round(accessoryCostTotal),
      electricity: Math.round(electricity),
      depreciation: Math.round(depreciation),
      packaging: Math.round(packaging),
      subtotal: Math.round(subtotal),
      platform_fee: Math.round(platformFee),
      total_cost: Math.round(totalCost),
    },
    floor_price_bdt: floorPrice
  };
}
