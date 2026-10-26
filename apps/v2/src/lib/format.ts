/** Locale currency formatting for Shopify Money values (ported from v1 formatMoney). */
export function formatMoney(amount: string, currencyCode: string) {
  const n = Number(amount)
  if (Number.isNaN(n)) return `${amount} ${currencyCode}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(n)
}
