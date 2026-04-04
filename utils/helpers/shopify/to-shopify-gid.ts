export function toProductGid(productId: number) {
  return `gid://shopify/Product/${productId}`;
}

export function toOrderGid(orderId: number) {
  return `gid://shopify/Order/${orderId}`;
}

export function toCustomerGid(customerId: number) {
  return `gid://shopify/Customer/${customerId}`;
}
