import { ProductWhatsIncludedSchema, type ProductWhatsIncluded } from "@/lib/schemas";

export function parseWhatsIncluded(value: string | null | undefined): ProductWhatsIncluded {
  if (!value) return [];

  try {
    const parsed = ProductWhatsIncludedSchema.safeParse(JSON.parse(value));

    if (!parsed.success || !Array.isArray(parsed.data)) return [];

    return parsed.data;
  } catch (error) {
    console.error('Error parsing whats_included:', error);
    return [];
  }
}
