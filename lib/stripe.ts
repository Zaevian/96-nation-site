import "server-only";

import Stripe from "stripe";

let stripeSingleton: Stripe | null | undefined;

/** True when STRIPE_SECRET_KEY is set. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * Lazy Stripe client. Returns null when key is missing so builds and
 * unpaid/RSVP paths work without Stripe credentials.
 */
export function getStripe(): Stripe | null {
  if (stripeSingleton !== undefined) {
    return stripeSingleton;
  }
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    stripeSingleton = null;
    return null;
  }
  // Use package default API version (avoids hardcoding a version pin that
  // may not match the installed stripe types).
  stripeSingleton = new Stripe(key, {
    typescript: true,
  });
  return stripeSingleton;
}
