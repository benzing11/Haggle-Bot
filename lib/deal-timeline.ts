/**
 * The whole deal choreography in one table. Every step is a millisecond offset
 * from the moment the deal lands, so the sequence can be retuned in one place.
 *
 *   0    markers collide on the price rail (shockwave fires)
 *   240  slow-motion beat begins
 *   390  slow-motion beat releases
 *   760  contract card slides up, PayPal becomes usable
 *   820  confetti
 *   1180 sequence complete
 */
export const DEAL_TIMELINE = {
  collide: 0,
  shockwave: 120,
  slowMoStart: 240,
  slowMoEnd: 390,
  card: 760,
  confetti: 820,
  total: 1180,
} as const;

export type DealTimeline = typeof DEAL_TIMELINE;
