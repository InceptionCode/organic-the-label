
const formatters = new Map<string, Intl.NumberFormat>()

function formatterFor(currencyCode: string): Intl.NumberFormat | null {
  let f = formatters.get(currencyCode)
  if (!f) {
    try {
      f = new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode })
    } catch {
      return null
    }
    formatters.set(currencyCode, f)
  }
  return f
}

/** Shopify Money value: `formatMoney('50.0', 'USD')` is `$50.00`. */
export function formatMoney(amount: string, currencyCode: string): string {
  const n = Number(amount)
  const f = formatterFor(currencyCode)
  if (amount.trim() === '' || Number.isNaN(n) || !f) return `${amount} ${currencyCode}`
  return f.format(n)
}

/** Plain USD number (v1 product-helpers formatPrice): `formatPrice(9.5)` is `$9.50`. */
export function formatPrice(amount: number): string {
  return formatMoney(String(amount), 'USD')
}
