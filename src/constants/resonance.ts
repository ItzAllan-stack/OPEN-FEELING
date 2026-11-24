/**
 * Resonance is intentionally short-lived: everything a person shares there is
 * gone within a day, which keeps the space low-pressure and close to the
 * moment it describes.
 */
export const RESONANCE_TTL_HOURS = 24;

/**
 * List queries must stay strictly inside the read window enforced by the
 * rules, otherwise Firestore rejects the whole query. Asking only for content
 * that still has a few minutes left keeps the range inside the rule even when
 * the device clock trails the server slightly.
 */
export const RESONANCE_READ_MARGIN_MS = 5 * 60 * 1000;

/** Supportive lines are one short sentence, not another post. */
export const RESONANCE_CARE_MAX_LENGTH = 280;

/** Highest number of check-ins we display so the counter stays gentle. */
export const RESONANCE_MAX_VISIBLE_COUNT = 99;
