import { Layers, SlidersHorizontal, Tag, Users, type LucideIcon } from 'lucide-react'
import type { ServiceIconKey } from '~/lib/work-with-me-content'

/** Shared by the services list and the marquee (v1 service-icons.ts). */
export const SERVICE_ICONS: Record<ServiceIconKey, LucideIcon> = {
  mixing: SlidersHorizontal,
  collab: Users,
  leasing: Tag,
  suite: Layers,
}
