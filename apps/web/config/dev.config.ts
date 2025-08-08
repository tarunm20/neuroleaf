/**
 * Development Configuration
 * Handles dev-only features and subscription tier overrides
 */

import { z } from 'zod';

const DevConfigSchema = z.object({
  isDevMode: z.boolean().default(false),
  enableTierSwitcher: z.boolean().default(false),
});

export type DevConfig = z.infer<typeof DevConfigSchema>;

// Parse dev configuration from environment variables
const devConfig = DevConfigSchema.parse({
  isDevMode: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_MODE === 'true',
  enableTierSwitcher: process.env.NEXT_PUBLIC_DEV_ENABLE_TIER_SWITCHER === 'true',
});

export default devConfig;

/**
 * Check if we're in development mode with dev features enabled
 */
export function isDevelopmentMode(): boolean {
  return devConfig.isDevMode;
}

/**
 * Check if tier switcher UI should be enabled
 */
export function shouldEnableTierSwitcher(): boolean {
  return devConfig.isDevMode && devConfig.enableTierSwitcher;
}

/**
 * Get all dev configuration for debugging
 */
export function getDevConfig(): DevConfig | null {
  if (!devConfig.isDevMode) {
    return null;
  }
  return devConfig;
}