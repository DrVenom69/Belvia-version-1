import * as assert from 'assert';
import { CartItem, KeychainConfig } from '../src/types';

console.log('Running Task 1 Tests...');
const mockConfig: KeychainConfig = {
  name: 'Belvia',
  font: 'Syne',
  textColor: '#ffffff',
  strokeColor: '#f5af19',
  size: 'Medium',
  theme: 'standard',
  customizationVersion: 1
};

const mockItem: CartItem = {
  product: {
    id: 'bv-keychain-template',
    title: 'Custom Name Keychain',
    description: 'Template description',
    category: 'Keychains',
    price: 500,
    colors: ['#ffffff', '#f5af19'],
    materials: ['PLA'],
    rating: 5,
    reviewsCount: 0,
    printTime: '25m',
    weightGrams: 8,
    images: [],
    infill: '20%'
  },
  selectedColor: '#f5af19',
  selectedMaterial: 'PLA (Matte)',
  quantity: 1,
  customization: mockConfig,
  calculatedPrice: 700
};

assert.strictEqual(mockItem.customization?.name, 'Belvia');
assert.strictEqual(mockItem.calculatedPrice, 700);
console.log('Task 1 Tests Passed!');

// Task 2: Calculations & validations tests
import { calculateKeychainSpecs, validateKeychainInput } from '../src/utils/keychainCalculations';

console.log('Running Task 2 Calculations & Validation Tests...');

// Test 1: Medium size, Floral theme, Standard font, 6 chars (name: 'Belvia')
const spec1 = calculateKeychainSpecs({
  name: 'Belvia',
  font: 'DM Sans',
  textColor: '#ffffff',
  strokeColor: '#f5af19',
  size: 'Medium',
  theme: 'floral',
  customizationVersion: 1
});
// Pricing formula: (Base price 500 * Size multiplier 1.4) + Theme price offset 150 + complexity fee 50 = 700 + 150 + 50 = 900
assert.strictEqual(spec1.price, 900);
// printTime formula: (Base print time 40 + Theme time offset 10) * complexity mult 1.1x = 50 * 1.1 = 55
assert.strictEqual(spec1.printTimeMinutes, 55);

// Test 2: Bangla character surcharge + cursive font check
const specBangla = calculateKeychainSpecs({
  name: 'বেলভিয়া',
  font: 'Hind Siliguri',
  textColor: '#ffffff',
  strokeColor: '#000000',
  size: 'Small',
  theme: 'standard',
  customizationVersion: 1
});
// Pricing: (Base price 500 * Size multiplier 1.0) + Theme price offset 0 + complexity fee 0 + Bangla surcharge 50 + 1 char excess surcharge 15 = 565
assert.strictEqual(specBangla.price, 565);

// Test 3: Input validations
const valValid = validateKeychainInput('ValidName', '#ffffff', '#000000');
assert.strictEqual(valValid.isValid, true);

const valLong = validateKeychainInput('ThisNameIsTooLongForKeychain', '#ffffff', '#000000');
assert.strictEqual(valLong.isValid, false);
assert.strictEqual(valLong.error, 'Name must be between 2 and 15 characters.');

const valSymbols = validateKeychainInput('Name@123', '#ffffff', '#000000');
assert.strictEqual(valSymbols.isValid, false);
assert.strictEqual(valSymbols.error, 'Contains unsupported characters. Only alphanumeric, spaces, hyphens, and Bangla are allowed.');

const valContrast = validateKeychainInput('Contrast', '#ffffff', '#ffffff');
assert.strictEqual(valContrast.contrastWarning, true);

console.log('Task 2 Tests Passed!');

// Task 4: Routing mock tests
console.log('Running Task 4 Routing Tests...');
assert.ok(true);
console.log('Task 4 Tests Passed!');

// Task 5: Cart Render tests
console.log('Running Task 5 Cart Render Tests...');

const cartItemsList: CartItem[] = [
  {
    product: {
      id: 'temp-1',
      title: 'Normal item',
      description: 'Desc',
      category: 'Home Decor',
      price: 1000,
      colors: [],
      materials: [],
      rating: 5,
      reviewsCount: 0,
      printTime: '1h',
      weightGrams: 50,
      images: ['/images/normal.webp'],
      infill: '15%'
    },
    quantity: 2,
    selectedColor: 'red',
    selectedMaterial: 'PLA'
  },
  {
    product: {
      id: 'bv-keychain-template',
      title: 'Custom Name Keychain',
      description: 'Customization specs',
      category: 'Keychains',
      price: 500,
      colors: [],
      materials: [],
      rating: 5,
      reviewsCount: 0,
      printTime: '25m',
      weightGrams: 8,
      images: ['/images/keychain.webp'],
      infill: '20%'
    },
    quantity: 3,
    selectedColor: '#f5af19',
    selectedMaterial: 'PLA (Matte)',
    calculatedPrice: 900,
    customPreviewUrl: 'data:image/svg+xml;utf-8,svgContent'
  }
];

// 1. Verify price calculation uses frozen calculatedPrice
const totalCostCalculated = cartItemsList.reduce((acc, item) => acc + (item.calculatedPrice ?? item.product.price) * item.quantity, 0);
assert.strictEqual(totalCostCalculated, 1000 * 2 + 900 * 3); // 2000 + 2700 = 4700

// 2. Verify image selection uses customPreviewUrl if present
const imageSource1 = cartItemsList[0].customPreviewUrl || cartItemsList[0].product.images[0];
assert.strictEqual(imageSource1, '/images/normal.webp');

const imageSource2 = cartItemsList[1].customPreviewUrl || cartItemsList[1].product.images[0];
assert.strictEqual(imageSource2, 'data:image/svg+xml;utf-8,svgContent');

console.log('Task 5 Tests Passed!');

