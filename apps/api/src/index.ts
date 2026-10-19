import { Hono } from "hono";
import { ordersPayRoute } from "./routes/shopify/orders-paid.ts";
import { revalidateProductRoute } from "./routes/shopify/revalidate-product.ts";
import { compositionsRoute } from "./routes/compositions.ts";
import { mailerliteRoute } from "./routes/mailerlite.ts";
import { supportStatusRoute } from "./routes/support-status.ts";
import { instagramRefreshRoute } from "./routes/instagram-refresh.ts";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, service: "api", ts: new Date().toISOString() }));

app.route("/webhooks/shopify", ordersPayRoute);
app.route("/webhooks/shopify", revalidateProductRoute);
app.route("/webhooks", compositionsRoute);
app.route("/webhooks", mailerliteRoute);
app.route("/webhooks", supportStatusRoute);
app.route("/cron", instagramRefreshRoute);

app.notFound((c) => c.json({ ok: false, error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("[api] unhandled error", err);
  return c.json({ ok: false, error: "Internal server error" }, 500);
});

export default app;
