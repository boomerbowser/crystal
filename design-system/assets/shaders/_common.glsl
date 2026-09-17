precision highp float;

/* Shared by Crystal's fragment shaders. Prepended at compile time; not a
   standalone file. Everything here is procedural, so no shader needs a texture
   upload and the whole layer stays a few kilobytes. */

/* Value noise. Cheap, and its smoothness suits a fluid surface better than the
   harsher gradient noise usually reached for. */
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);          /* smoothstep, for C1 continuity */
  return mix(mix(hash(i + vec2(0,0)), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}

/* Fractal sum. Four octaves is where added detail stops being visible at the
   sizes Crystal's surfaces actually occupy. */
float fbm(vec2 p){
  float total = 0.0, amplitude = 0.5;
  for (int i = 0; i < 4; i++){
    total += noise(p) * amplitude;
    p *= 2.02;                                /* not exactly 2, to avoid the
                                                 grid alignment that reads as
                                                 a repeating texture */
    amplitude *= 0.5;
  }
  return total;
}

/* Signed distance to a rounded rectangle, negative inside. Every Resin shader
   derives from this one function, which is why refraction and caustics agree:
   they are two readings of one surface rather than two effects tuned to
   resemble each other. */
float roundedBoxSDF(vec2 uv, vec2 halfSize, float radius){
  vec2 d = abs(uv - 0.5) - halfSize + radius;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
}

/* Edge lensing.
 *
 * This is the shape of the whole effect, so it is worth being precise about.
 * Glass does not oscillate. It bends light where it curves, and a panel of
 * glass curves at its rim, so the optical work belongs in a band just inside
 * the boundary while the centre stays clear enough to read through. The
 * reference behaviour shrinks the interior and stretches the edges outward,
 * which is a displacement concentrated at the edge — not a wave crossing the
 * surface.
 *
 * An earlier version of this file radiated ripples from the contact point. That
 * is what water does when you drop something in it, and it was the wrong
 * metaphor: it read as a pond rather than as a solid transparent material.
 *
 * Returns 1 at the rim falling to 0 in the interior. */
float edgeLens(float sdf, float thickness){
  float depth = clamp(-sdf / max(thickness, 0.0001), 0.0, 1.0);
  /* A steep falloff keeps the centre optically clean; a gentle one fogs the
     whole panel and loses the sense of looking *through* something. */
  return pow(1.0 - depth, 2.6);
}

/* The glass height field. Thickness scales with pressure, because a thicker
   piece of glass lenses more deeply — the reference makes larger elements
   simulate heavier material the same way. */
float surface(vec2 uv, vec2 contact, float time, float progress, float pressure){
  float radius = 0.17;
  float sdf = roundedBoxSDF(uv, vec2(0.5) - vec2(radius), radius);
  float thickness = 0.20 + pressure * 0.10;
  float lens = edgeLens(sdf, thickness);

  /* A slow, small variation along the rim so the material feels alive without
     ever behaving like a liquid in a container. The contact point biases it,
     so a press deepens the lensing nearest the finger. */
  float bias = 1.0 - 0.35 * clamp(length(uv - contact), 0.0, 1.0);
  float breathe = 1.0 + 0.05 * sin(time * 1.3 + (uv.x + uv.y) * 2.0);

  return lens * bias * breathe * progress;
}

/* Direction along which the rim stretches: the outward gradient of the field.
   Used for dispersion, so colour separates across the edge rather than
   uniformly over the panel. */
vec2 lensDirection(vec2 uv, vec2 contact, float time, float progress, float pressure){
  float e = 0.0030;
  float x = surface(uv + vec2(e, 0.0), contact, time, progress, pressure)
          - surface(uv - vec2(e, 0.0), contact, time, progress, pressure);
  float y = surface(uv + vec2(0.0, e), contact, time, progress, pressure)
          - surface(uv - vec2(0.0, e), contact, time, progress, pressure);
  vec2 g = vec2(x, y);
  return length(g) > 0.00001 ? normalize(g) : vec2(0.0);
}

/* Surface normal by central difference on the lens field. The z term sets how
   pronounced the curvature reads; larger values flatten it. */
vec3 surfaceNormal(vec2 uv, vec2 contact, float time, float progress, float pressure){
  float e = 0.0030;
  float x = surface(uv + vec2(e, 0.0), contact, time, progress, pressure)
          - surface(uv - vec2(e, 0.0), contact, time, progress, pressure);
  float y = surface(uv + vec2(0.0, e), contact, time, progress, pressure)
          - surface(uv - vec2(0.0, e), contact, time, progress, pressure);
  return normalize(vec3(-x, -y, e * 7.0));
}

/* Soft rounded-rectangle mask so a shader never paints past the material's own
   corner radius. Signed distance, so the falloff is uniform along the edge. */
float panelMask(vec2 uv, float radius, float softness){
  vec2 halfSize = vec2(0.5) - vec2(radius);
  vec2 d = abs(uv - 0.5) - halfSize;
  float sdf = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
  return 1.0 - smoothstep(-softness, softness, sdf);
}
