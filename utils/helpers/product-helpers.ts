// Helper function to format category display
export function formatCategory(categories: string[]) {
  // Remove curly braces if present (e.g., "{kit}" -> "kit")
  const cleanedCategories = categories.map(
    (category: string) =>
      category.replace(/[{}]/g, '').toLowerCase().charAt(0).toUpperCase() + category.slice(1),
  );
  // Capitalize first letter
  return cleanedCategories
}

// Helper function to format price
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatMoney(amount: string, currencyCode: string) {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} ${currencyCode}`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currencyCode }).format(n);
}