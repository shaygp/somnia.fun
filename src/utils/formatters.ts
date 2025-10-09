// Utility functions for formatting prices and numbers

export const formatPrice = (price: number): string => {
  if (price === 0) return '0';
  if (price >= 1) return price.toFixed(6);
  if (price >= 0.001) return price.toFixed(8);
  if (price >= 0.000001) return price.toFixed(10);
  // Always use fixed notation, never scientific notation
  return price.toFixed(10);
};

export const formatSomi = (amount: number): string => {
  return amount.toFixed(3);
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};