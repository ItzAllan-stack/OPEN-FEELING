/**
 * Feature flags derived from Vite environment variables.
 *
 * Sample/starter content exists only to make a fresh local environment feel
 * alive. It must never appear in production, so it is enabled only in dev
 * builds or via an explicit opt-in flag.
 */
export const SAMPLE_CONTENT_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_SAMPLE_CONTENT === 'true';

/**
 * Allows a client session to seed the starter communities when the
 * communities collection is empty. Disabled unless explicitly opted in;
 * production data should be seeded out-of-band, not from whoever happens to
 * log in first.
 */
export const STARTER_SEED_ENABLED =
  import.meta.env.VITE_ENABLE_STARTER_SEED === 'true';
