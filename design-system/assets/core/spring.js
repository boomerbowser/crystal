/* Crystal headless core: spring derivation.
 *
 * Pure functions. No DOM access, no globals, no side effects.
 *
 * Crystal describes motion as a damped harmonic oscillator rather than a fixed
 * duration and a bézier, for two reasons. The first is behavioural: a timed
 * curve cannot be interrupted meaningfully, because it has no notion of where
 * the thing currently is or how fast it is going. Press a control while it is
 * still settling and a curve restarts from a new zero, which is why timed
 * motion feels brittle under real use. A spring resumes from its current state
 * because its current state is all it needs.
 *
 * The second is portability, which is the reason it lives in the core. A
 * cubic-bézier is a web primitive. Stiffness, damping and mass map directly
 * onto SwiftUI's spring(response:dampingFraction:), Compose's
 * spring(dampingRatio:stiffness:) and every serious animation runtime, so a
 * recipe expressed this way can be honoured identically by each platform
 * library instead of approximated by each one differently.
 *
 * Usable as a plain <script> (attaches to CrystalCore) or via require().
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.CrystalCore = root.CrystalCore || {}).spring = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* Rest is defined as being within this fraction of the target and moving
     slower than this fraction per second. Both conditions are required: a
     spring passing through its target at speed is not at rest. */
  const REST_DISPLACEMENT = 0.001;
  const REST_VELOCITY = 0.001;

  /* A settle time has to terminate even for a spring that barely moves. This
     matches the motion ceiling in the token set. */
  const MAX_SETTLE_MS = 5000;

  const DEFAULTS = { stiffness: 180, damping: 22, mass: 1 };

  function normaliseSpring(spec) {
    const s = spec && typeof spec === 'object' ? spec : {};
    const stiffness = Number.isFinite(s.stiffness) && s.stiffness > 0 ? s.stiffness : DEFAULTS.stiffness;
    const mass = Number.isFinite(s.mass) && s.mass > 0 ? s.mass : DEFAULTS.mass;
    const damping = Number.isFinite(s.damping) && s.damping >= 0 ? s.damping : DEFAULTS.damping;
    return { stiffness, damping, mass };
  }

  /* Damping ratio: below 1 the spring overshoots, at 1 it is critically damped
     and arrives without overshoot in the shortest time, above 1 it creeps in. */
  function dampingRatio(spec) {
    const { stiffness, damping, mass } = normaliseSpring(spec);
    return damping / (2 * Math.sqrt(stiffness * mass));
  }

  /* Normalised displacement from rest at time t, for a spring released from
     displacement 1 with zero initial velocity. Returns 0 at t=0 and approaches
     1 as the spring settles, so it can be read directly as animation progress.

     The three damping regimes are genuinely different closed-form solutions,
     not one formula with a parameter; conflating them produces NaN at exactly
     critical damping, which is the case a designer is most likely to pick. */
  function sampleSpring(spec, tSeconds) {
    const { stiffness, damping, mass } = normaliseSpring(spec);
    const t = Math.max(0, Number(tSeconds) || 0);
    const omega = Math.sqrt(stiffness / mass);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));

    if (zeta < 1) {
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      const envelope = Math.exp(-zeta * omega * t);
      return 1 - envelope * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t));
    }
    if (zeta === 1) {
      return 1 - Math.exp(-omega * t) * (1 + omega * t);
    }
    const root = omega * Math.sqrt(zeta * zeta - 1);
    const a = -zeta * omega + root;
    const b = -zeta * omega - root;
    return 1 - (b * Math.exp(a * t) - a * Math.exp(b * t)) / (b - a);
  }

  /* Milliseconds until the spring is at rest by both conditions above.
     Integrated by sampling rather than solved, because the velocity condition
     has no convenient closed form across all three regimes and a millisecond
     of resolution is finer than any display can show. */
  function settleTime(spec) {
    const normalised = normaliseSpring(spec);
    const stepSeconds = 0.001;
    let previous = sampleSpring(normalised, 0);
    for (let ms = 1; ms <= MAX_SETTLE_MS; ms += 1) {
      const current = sampleSpring(normalised, ms * stepSeconds);
      const displacement = Math.abs(1 - current);
      const velocity = Math.abs(current - previous) / stepSeconds;
      if (displacement < REST_DISPLACEMENT && velocity < REST_VELOCITY) return ms;
      previous = current;
    }
    return MAX_SETTLE_MS;
  }

  /* Does this spring pass its target before settling? Underdamped springs do;
     it is the overshoot that reads as momentum, and its absence that makes
     critically damped motion feel mechanical. */
  function overshoots(spec) {
    return dampingRatio(spec) < 1;
  }

  /* Peak overshoot as a fraction beyond the target, 0 when critically damped
     or stiffer. Crystal bounds this: a control that overshoots more than a
     tenth of its travel reads as loose rather than responsive. */
  function peakOvershoot(spec) {
    const zeta = dampingRatio(spec);
    if (zeta >= 1) return 0;
    return Math.exp(-Math.PI * zeta / Math.sqrt(1 - zeta * zeta));
  }

  /* Convert to the parameterisation Apple and Google expose, so a platform
     library can carry the same recipe without re-deriving it and drifting.
     response is the period of an equivalent undamped spring in seconds. */
  function toPlatform(spec) {
    const { stiffness, damping, mass } = normaliseSpring(spec);
    const zeta = damping / (2 * Math.sqrt(stiffness * mass));
    return {
      swiftUI: {
        response: Number((2 * Math.PI * Math.sqrt(mass / stiffness)).toFixed(4)),
        dampingFraction: Number(zeta.toFixed(4)),
      },
      compose: {
        dampingRatio: Number(zeta.toFixed(4)),
        stiffness: Number(stiffness.toFixed(4)),
      },
      web: { stiffness, damping, mass },
    };
  }

  return {
    normaliseSpring, dampingRatio, sampleSpring, settleTime,
    overshoots, peakOvershoot, toPlatform,
    REST_DISPLACEMENT, REST_VELOCITY, MAX_SETTLE_MS, DEFAULTS,
  };
});
