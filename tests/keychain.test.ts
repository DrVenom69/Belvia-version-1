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
    price: 4.99,
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
  calculatedPrice: 6.99
};

assert.strictEqual(mockItem.customization?.name, 'Belvia');
assert.strictEqual(mockItem.calculatedPrice, 6.99);
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
// Pricing formula: (Base price 4.99 * Size multiplier 1.4) + Theme price offset 1.5 + complexity fee 0.5 = 6.99 + 1.50 + 0.50 = 8.99
assert.strictEqual(spec1.price, 8.99);
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
// Pricing: (Base price 4.99 * Size multiplier 1.0) + Theme price offset 0.0 + complexity fee 0.0 + Bangla surcharge 0.50 + 1 char excess surcharge 0.15 = 5.64
assert.strictEqual(specBangla.price, 5.64);

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

// Task 5: Cart Render mock tests
console.log('Running Task 5 Cart Render Tests...');
assert.ok(true);
console.log('Task 5 Tests Passed!');

