import type { ProductsPageResponse } from "@/lib/Shopify/queries";
import { ProductSchema, type Product, type ProductCategories, type ProductTags } from "@/lib/schemas";

export const parseStoreData = (products: ProductsPageResponse["products"]["edges"]): Product[] => {
  const mappedProducts: Product[] = products.map(({ node: product }) => {
    const variantId = product.variants.edges[0].node.id
    const price = product.variants.edges[0].node.price.amount

    try {
      const category: Product["category"] = product.productType.toLowerCase() as ProductCategories;
      const tags: Product["tags"] = product.tags?.map((tag) => (tag.toLowerCase() || 'hiphop') as ProductTags);

      return ProductSchema.parse({
        ...product,
        created_at: product.createdAt,
        name: product.title,
        image: product.featuredImage,
        price: typeof price === 'string' ? parseFloat(price) : price,
        category,
        tags,
        variantId
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