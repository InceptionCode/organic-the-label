import { useEffect, useEffectEvent } from 'react'
import { useLocation } from '@tanstack/react-router'
import type { ActivityEventType } from '~/server/activity/schema'
import { track, type TrackProperties } from './track'

/**
 * Page-view event: fires once when the page mounts and again whenever the pathname changes under the
 * same component (product A to product B). Search-param changes (store filters, search tabs) are not
 * new views. The properties are read when the effect fires, so they belong to the page being shown.
 */
export function useTrackOnMount(eventType: ActivityEventType, properties?: TrackProperties) {
  const pathname = useLocation({ select: (l) => l.pathname })
  const onView = useEffectEvent((path: string) => track(eventType, { ...properties, path }))
  useEffect(() => {
    onView(pathname)
  }, [pathname])
}
