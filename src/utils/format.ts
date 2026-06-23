export function formatPrice(price: number): string {
  if (price === null || price === undefined || isNaN(price)) return '৳0';
  const rounded = Math.round(price);
  return `৳${rounded.toLocaleString('en-US')}`;
}
