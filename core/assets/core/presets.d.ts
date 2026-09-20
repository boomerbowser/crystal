/* Types for Crystal's shared motion presets.
 *
 * A preset is the movement a material makes entering or leaving. Its geometry is
 * computed from travel, depth and feather tokens rather than stored, so a token
 * change moves every preset at once — which is why a library must call this
 * rather than copy the keyframes it produces.
 */

export type CrystalPresetName =
  | 'plastic' | 'frost' | 'resin' | 'haze' | 'stone'
  | 'mirage' | 'mirage-out' | 'dismiss';

export type CrystalFlowDirection = 'left' | 'right' | 'top' | 'bottom';

export interface CrystalPresetMeasurements {
  /** Resolved travel distance in px, from the `travel-<role>` token. */
  travel: number;
  /** Resolved depth distance in px, from `travel-depth`. */
  depth: number;
  /** A dismissal that fades rather than falls: a dialog, a Haze card, a Stone
   *  backing — anything anchored to the page rather than floating above it. */
  anchored?: boolean;
  /** Where a Mirage wash flows from. */
  from?: CrystalFlowDirection;
  /** True when the host can register a custom property for the wash, which gives
   *  a softer edge than a clip path. */
  softFlow?: boolean;
}

export interface CrystalPresetResult {
  /** Empty for `haze` and `stone`, whose signature is paint rather than movement. */
  keyframes: Record<string, unknown>[];
  /** Which easing token to resolve: `--cr-ease-enter` or `--cr-ease-exit`. */
  easing: 'enter' | 'exit';
  /** Which duration token to resolve. */
  duration: string;
}

export function presetKeyframes(
  name: CrystalPresetName,
  measured: CrystalPresetMeasurements,
): CrystalPresetResult;

/** The travel token a preset moves by: `travel-<role>`. */
export function travelRole(name: CrystalPresetName): string;

/** Area-conserving scale. A deformation that loses area reads as rubber, not fluid. */
export function squash(sx: number, sy: number): string;

export const PRESETS: readonly CrystalPresetName[];
export const DURATION_ROLE: Readonly<Record<CrystalPresetName, string>>;
export const EXITING: ReadonlySet<string>;
export const ORIGINS: Readonly<Record<CrystalFlowDirection, string>>;

declare const presets: {
  presetKeyframes: typeof presetKeyframes;
  travelRole: typeof travelRole;
  squash: typeof squash;
  PRESETS: typeof PRESETS;
  DURATION_ROLE: typeof DURATION_ROLE;
  EXITING: typeof EXITING;
  ORIGINS: typeof ORIGINS;
};
export default presets;
