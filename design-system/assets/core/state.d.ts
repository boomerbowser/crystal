/* Types for Crystal's headless state derivation. Pure functions: a web page, a
   React component, a SwiftUI view and a Compose composable must all get the same
   answer to "which mark does this control show". */

export type IndicatorKind = 'selection' | 'current' | 'busy' | 'field' | 'validated' | 'none';

/** Which indicator a control shows. A check mark means validated or
 *  informational and never marks a selected, pressed or focused control. */
export function resolveIndicator(input: Record<string, unknown>): IndicatorKind;

/** The field's validation state, from its own semantics rather than its styling. */
export function resolveFieldState(input: Record<string, unknown>): string;

/** Fractional progress of a value within a range, clamped to 0..1. */
export function rangeProgress(value: number, min: number, max: number): number;

export const INDICATOR_ORDER: readonly IndicatorKind[];

declare const state: {
  resolveIndicator: typeof resolveIndicator;
  resolveFieldState: typeof resolveFieldState;
  rangeProgress: typeof rangeProgress;
  INDICATOR_ORDER: typeof INDICATOR_ORDER;
};
export default state;
