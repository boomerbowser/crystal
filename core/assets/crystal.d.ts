/* The token resolver, as a module.
 *
 * `resolve` is the whole reason this is importable: it turns a palette, a mode
 * and a set of preferences into the custom properties a surface renders from. A
 * library that can only load the generated stylesheet gets one palette at
 * `:root`, which is not a design system with six.
 */
export interface CrystalConfiguration {
  palette?: string;
  mode?: 'light' | 'dark' | 'system';
  atmosphere?: number;
  translucency?: number;
  elevation?: number;
  radius?: number;
  density?: 'comfortable' | 'compact';
  reduced?: boolean;
  font?: string;
  reduceMotion?: boolean;
  motionSpeed?: number;
}

/** Clamp and normalise a configuration against Crystal's own ranges and choices. */
export function normalize(value?: CrystalConfiguration): Required<CrystalConfiguration>;

/** Every `--cr-*` custom property for a configuration in a mode. */
export function resolve(
  value?: CrystalConfiguration,
  mode?: 'light' | 'dark',
): Record<string, string>;

export function contrast(a: string, b: string): number;
export function exportCSS(value?: CrystalConfiguration): string;
export function exportJSON(value?: CrystalConfiguration): unknown;
export function audit(value?: CrystalConfiguration, mode?: 'light' | 'dark'): readonly {
  label: string; foreground: string; background: string; ratio: number; minimum: number;
}[];
export const version: string;

declare const Crystal: {
  normalize: typeof normalize;
  resolve: typeof resolve;
  contrast: typeof contrast;
  exportCSS: typeof exportCSS;
  exportJSON: typeof exportJSON;
  audit: typeof audit;
  version: string;
};
export default Crystal;
