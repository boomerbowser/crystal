/* The token resolver, as a module.
 *
 * `resolve` is the reason this is importable. It turns a palette, a mode and a
 * set of preferences into the custom properties a surface renders from. A
 * library that can only load the generated stylesheet gets one palette at
 * `:root`, and the design system has six.
 */
export interface PrismataConfiguration {
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

/** Clamp and normalise a configuration against Prismata's own ranges and choices. */
export function normalize(value?: PrismataConfiguration): Required<PrismataConfiguration>;

/** Every `--pr-*` custom property for a configuration in a mode. */
export function resolve(
  value?: PrismataConfiguration,
  mode?: 'light' | 'dark',
): Record<string, string>;

export function contrast(a: string, b: string): number;
export function exportCSS(value?: PrismataConfiguration): string;
export function exportJSON(value?: PrismataConfiguration): unknown;
export function audit(value?: PrismataConfiguration, mode?: 'light' | 'dark'): readonly {
  label: string; foreground: string; background: string; ratio: number; minimum: number;
}[];
export const version: string;

declare const Prismata: {
  normalize: typeof normalize;
  resolve: typeof resolve;
  contrast: typeof contrast;
  exportCSS: typeof exportCSS;
  exportJSON: typeof exportJSON;
  audit: typeof audit;
  version: string;
};
export default Prismata;
