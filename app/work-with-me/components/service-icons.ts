import type { ComponentType } from "react";
import { SlidersHorizontal, Users, Tag, Layers, type LucideProps } from "lucide-react";
import type { ServiceIconKey } from "@/lib/work-with-me/content";

/** Shared icon map for the services — used by the Services list and the marquee. */
export const SERVICE_ICONS: Record<ServiceIconKey, ComponentType<LucideProps>> = {
  mixing: SlidersHorizontal,
  collab: Users,
  leasing: Tag,
  suite: Layers,
};
