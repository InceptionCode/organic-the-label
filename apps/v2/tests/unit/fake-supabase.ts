import type { SupabaseClient } from '@supabase/supabase-js'

export type Call = { table: string; op: string; payload?: unknown; filters: [string, string, unknown][] }
type Responder = (call: Call) => { data: unknown; error: { message: string } | null }

// Minimal chainable stand-in for the Supabase query builder. Every awaited chain is recorded.
export function fakeSupabase(respond: Responder = () => ({ data: null, error: null })) {
  const calls: Call[] = []
  const client = {
    from(table: string) {
      const call: Call = { table, op: 'select', filters: [] }
      const builder: Record<string, unknown> = {
        select: () => builder,
        update: (payload: unknown) => ((call.op = 'update'), (call.payload = payload), builder),
        upsert: (payload: unknown) => ((call.op = 'upsert'), (call.payload = payload), builder),
        insert: (payload: unknown) => ((call.op = 'insert'), (call.payload = payload), builder),
        eq: (col: string, val: unknown) => (call.filters.push(['eq', col, val]), builder),
        is: (col: string, val: unknown) => (call.filters.push(['is', col, val]), builder),
        or: (expr: string) => (call.filters.push(['or', expr, null]), builder),
        order: (col: string, opts?: unknown) => (call.filters.push(['order', col, opts]), builder),
        limit: (n: number) => (call.filters.push(['limit', 'limit', n]), builder),
        single: () => builder,
        maybeSingle: () => builder,
        gte: (col: string, val: unknown) => (call.filters.push(['gte', col, val]), builder),
        overlaps: (col: string, val: unknown) => (call.filters.push(['overlaps', col, val]), builder),
        then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
          calls.push(call)
          return Promise.resolve(respond(call)).then(resolve, reject)
        },
      }
      return builder
    },
  }
  return { client: client as unknown as SupabaseClient, calls }
}
