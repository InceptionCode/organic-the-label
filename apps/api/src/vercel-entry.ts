// Vercel production entry. scripts/build-vercel.ts bundles this file (and everything it imports,
// including the .ts workspace packages) into one ESM file for the Build Output API.
// `@hono/node-server/vercel` adapts the Hono app to the Node.js (req, res) handler that the
// Vercel Node.js launcher calls. Local dev keeps using src/index.ts directly.
import { handle } from "@hono/node-server/vercel";
import app from "./index.ts";

export default handle(app);
