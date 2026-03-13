"use client";

import { useEffect } from "react";
import { trackActivity } from "@/utils/helpers/activity/tracking";
import { ProductCategories, ProductTags } from "@/lib/schemas";

export default function ProductViewTracker({ handle, tags, category }: { handle: string, tags: ProductTags[], category: ProductCategories }) {
  useEffect(() => {
    trackActivity({
      eventType: "product_viewed",
      eventProperties: {
        product_handle: handle,
        product_tags: tags,
        product_category: category,
        source: "store_page" // for analytics purposes later - track the trigger of the product viewed event
      },
    });
  }, [handle, tags, category]);

  return null;
}

