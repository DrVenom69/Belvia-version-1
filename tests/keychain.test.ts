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
