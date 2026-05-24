import posthog from "posthog-js";

let initialized = false;

export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key) return;

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: true,
    persistence: "localStorage"
  });

  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.reset();
}
