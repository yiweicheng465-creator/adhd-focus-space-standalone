/**
 * Standalone types — no drizzle dependency
 */
export * from "./_core/errors";

// Basic shared types for the app
export interface UserProfile {
  id: string;
  name: string;
}
