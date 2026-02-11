import type { ProductsPageResponse } from "@/lib/Shopify/queries";
import { ProductSchema, type Product, type ProductCategories, type ProductTags } from "@/lib/schemas";

export const parseStoreData = (products: ProductsPageResponse["products"]["edges"]): Product[] => {
  const mappedProducts: Product[] = products.map(({ node: product }) => {
    const price = product.priceRange.minVariantPrice.amount

    try {
      const category: Product["category"] = product.productType.toLowerCase() as ProductCategories;
      const tags: Product["tags"] = product.tags?.map((tag) => (tag.toLowerCase() || 'hiphop') as ProductTags);

      return ProductSchema.parse({
        ...product,
        created_at: product.createdAt,
        name: product.title,
        image: product.featuredImage,
        category,
        tags,
        price: typeof price === 'string' ? parseFloat(price) : price,
      });
    } catch (parseError) {
      const error = new Error(`Error parsing product: ${product.title}`, { cause: parseError });

      console.error('Error parsing product:', product, parseError);
      console.log('>>>>> category', product.tags)

      throw error;
    }
  }).filter((product): product is Product => product !== null);

  return mappedProducts
}