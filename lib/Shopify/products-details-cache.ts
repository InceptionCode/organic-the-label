import { unstable_cache } from "next/cache";
import { getProductDetailsFetch } from "@/app/api/store/get-product-details";

function productTags(handle: string, id?: string) {
  const tags = [`product:handle:${handle}`]
  return id ? [...tags, `product:gid:${id}`] : tags;
}

export function getProductTags(handle: string, id?: string) {
  return productTags(handle, id);
}

export function getCachedProductDetails(handle: string, id?: string) {
  return unstable_cache(
    async () => getProductDetailsFetch(handle),
    ["shopify:productByHandle", handle],
    {
      // Make it very “sticky”
      revalidate: 60 * 60 * 24 * 30, // 30 days
      tags: productTags(handle, id),
    }
  )();
}
