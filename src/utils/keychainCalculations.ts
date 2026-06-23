import { KeychainConfig } from '../types';

export function calculateKeychainSpecs(config: KeychainConfig) {
  const basePrice = 500;
  const sizePriceMultiplier = { Small: 1.0, Medium: 1.4, Large: 1.8 };
  const sizeBaseWeights = { Small: 8, Medium: 12, Large: 18 };
  const sizeBasePrintTimes = { Small: 25, Medium: 40, Large: 60 };
  const sizeBaseDimensions = {
    Small: '80 x 28 x 4 mm',
    Medium: '100 x 35 x 4 mm',
    Large: '120 x 42 x 4 mm'
  };

  const themePriceOffsets = {
    standard: 0,
    floral: 150,
    dogtag: 100,
    numberplate: 200,
    football: 150
  };
  const themeWeightOffsets = { standard: 0, floral: 2, dogtag: 4, numberplate: 3, football: 3 };
  const themeTimeOffsets = { standard: 0, floral: 10, dogtag: 5, numberplate: 8, football: 12 };
  const themeComplexity = {
    standard: { mult: 1.0, fee: 0 },
    floral: { mult: 1.1, fee: 50 },
    dogtag: { mult: 1.0, fee: 0 },
    numberplate: { mult: 1.0, fee: 0 },
    football: { mult: 1.25, fee: 100 }
  };

  // Calculate length factors
  const nameLength = config.name.length;
  const excessChars = Math.max(0, nameLength - 6);
  const lengthSurcharge = excessChars * 15;
  const lengthWeightOffset = excessChars * 0.5;
  const lengthTimeOffset = excessChars * 2;

  // Font complexity fee
  const isBangla = /[\u0980-\u09FF]/.test(config.name);
  const isCursive = ['Pacifico', 'Galada'].includes(config.font);
  const fontComplexityFee = (isBangla || isCursive) ? 50 : 0;
  const fontComplexityTime = (isBangla || isCursive) ? 5 : 0;

  // Theme impacts
  const activeTheme = config.theme;
  const themePriceOffset = themePriceOffsets[activeTheme] || 0;
  const themeWeightOffset = themeWeightOffsets[activeTheme] || 0;
  const themeTimeOffset = themeTimeOffsets[activeTheme] || 0;
  const complexity = themeComplexity[activeTheme] || { mult: 1.0, fee: 0 };

  const calculatedPrice =
    (basePrice * sizePriceMultiplier[config.size]) +
    themePriceOffset +
    lengthSurcharge +
    fontComplexityFee +
    complexity.fee;

  const totalWeight = sizeBaseWeights[config.size] + themeWeightOffset + lengthWeightOffset;

  const rawPrintTime =
    sizeBasePrintTimes[config.size] +
    themeTimeOffset +
    lengthTimeOffset +
    fontComplexityTime;
  const totalPrintTime = Math.round(rawPrintTime * complexity.mult);

  return {
    price: Math.round(calculatedPrice),
    weightGrams: totalWeight,
    printTimeMinutes: totalPrintTime,
    dimensions: sizeBaseDimensions[config.size]
  };
}

export function validateKeychainInput(name: string, textColor: string, strokeColor: string) {
  if (name.length < 2 || name.length > 15) {
    return { isValid: false, error: 'Name must be between 2 and 15 characters.' };
  }

  // Allow English, Numbers, Bangla, Spaces, Hyphens
  const charsetRegex = /^[A-Za-z0-9\s\-\u0980-\u09FF]+$/;
  if (!charsetRegex.test(name)) {
    return { isValid: false, error: 'Contains unsupported characters. Only alphanumeric, spaces, hyphens, and Bangla are allowed.' };
  }

  // Check color contrast: delta difference between colors (simplified hex diff)
  const getRGB = (hex: string) => {
    const parsed = parseInt(hex.replace('#', ''), 16);
    return {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255
    };
  };

  try {
    const c1 = getRGB(textColor);
    const c2 = getRGB(strokeColor);
    const diff = Math.abs(c1.r - c2.r) + Math.abs(c1.g - c2.g) + Math.abs(c1.b - c2.b);
    // If sum of color channels diff < 90, trigger contrast warning
    return { isValid: true, contrastWarning: diff < 90 };
  } catch {
    return { isValid: true, contrastWarning: false };
  }
}
