import { createServerFn } from '@tanstack/react-start'
import { mapClaims } from '~/lib/map-user'

export const getSessionFn = createServerFn({ method: 'GET' }).handler(({ context }) => mapClaims(context.claims))
