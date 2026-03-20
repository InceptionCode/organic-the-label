export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  // Example placeholder:
  // window.posthog?.capture(event, properties);

  console.log("[analytics]", event, properties);
}