// Vercel serverless entry point.
// `hono/vercel` wraps the Hono app in a Vercel-compatible request handler.
// This file lives in api/ so Vercel picks it up as a serverless function.
import { handle } from 'hono/vercel'
import app from '../src/index.ts'

export const config = { maxDuration: 30 }

export default handle(app)
