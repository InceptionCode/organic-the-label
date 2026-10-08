import { QueryClient } from '@tanstack/react-query'

// Called once per SSR request (in getRouter()) and once on the client at startup.
// On the server: fresh instance per request → no cross-request cache bleeding.
// On the client: single instance for the app lifetime → cache persists across
// route navigations, deduplicates inflight requests, and handles background
// refetches.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data fetched during SSR is considered fresh for 5 minutes.
        // After that, the next focus/mount triggers a background refetch.
        staleTime: 1000 * 60 * 5,
        // Keep inactive query data in memory for 30 minutes so navigating
        // back to a previously visited page is instant.
        gcTime: 1000 * 60 * 30,
        // Don't retry on the server — it slows down SSR and errors should
        // surface immediately in server functions.
        retry: typeof window === 'undefined' ? 0 : 3,
      },
    },
  })
}
