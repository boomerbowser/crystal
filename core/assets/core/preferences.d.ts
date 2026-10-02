/* Types for Crystal's headless preference core.
 *
 * These are source types, written by hand like the implementation. Nothing
 * generates them. They exist because CONTRACT §1 tells libraries to import
 * this module, and an untyped import makes every consumer describe the same
 * shape again, which is the divergence that section is about.
 */

export interface CrystalRange { min: number; max: number; }

export interface CrystalPreferences {
  palette: string;
  mode: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  font: string;
  atmosphere: number;
  translucency: number;
  elevation: number;
  radius: number;
  motionSpeed: number;
  reduced: boolean;
  reduceMotion: boolean;
}

/**
 * Clamp and default an arbitrary object into a valid preference set. Values
 * outside Crystal's ranges are replaced, never passed through.
 *
 * `defaults` is Crystal's own `default` block from `@crystal-ui/core/flat`,
 * and is required: the function fills from it rather than carrying a second
 * copy of the defaults. Pass `palettes` alongside to have an unknown palette
 * name rejected instead of accepted.
 */
export function normalisePreferences(
  input: Record<string, unknown>,
  defaults: Partial<CrystalPreferences> & { palettes?: Record<string, unknown> },
): CrystalPreferences;

/** Resolved duration in ms. Reduced motion resolves to 0; the result is capped
 *  at DURATION_CEILING so slowing playback cannot strand a long transition. */
export function resolveDuration(base: number, motionSpeed: number, reduceMotion: boolean): number;

export const RANGES: Record<'atmosphere' | 'translucency' | 'elevation' | 'radius' | 'motionSpeed', CrystalRange>;
export const CHOICES: Record<'palette' | 'mode' | 'density' | 'font', readonly string[]>;
export const DURATION_CEILING: number;

declare const preferences: {
  normalisePreferences: typeof normalisePreferences;
  resolveDuration: typeof resolveDuration;
  RANGES: typeof RANGES;
  CHOICES: typeof CHOICES;
  DURATION_CEILING: typeof DURATION_CEILING;
};
export default preferences;
