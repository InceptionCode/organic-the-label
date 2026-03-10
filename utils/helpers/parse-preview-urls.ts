import { ProductPreviewUrlsSchema, type ProductPreviewUrls } from "@/lib/schemas";

export function parseAudioPreviewUrls(value: string | null | undefined): ProductPreviewUrls {
  if (!value) return [];

  try {
    const parsed = ProductPreviewUrlsSchema.safeParse(JSON.parse(value));

    if (!parsed.success || !Array.isArray(parsed.data)) return [];

    return parsed.data;
  } catch (error) {
    console.error('Error parsing audio preview urls:', error);
    return [];
  }
}