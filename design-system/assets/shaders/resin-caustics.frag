#version 300 es
/* Resin: caustics.
 *
 * Light focused by a curved surface concentrates into bright curves. Since the
 * curvature of this material is at its rim, that is where the caustics fall —
 * as bright arcs following the boundary, brightest where the lens is steepest.
 * They are read from the same height field the refraction shader uses, so the
 * two agree by construction rather than by tuning.
 */

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_progress;
uniform float u_pressure;
uniform vec2  u_contact;
uniform vec3  u_tint;
uniform float u_intensity;

out vec4 fragColor;

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  panelSpace(u_resolution);
  float e = 0.0032;

  /* Divergence of the height field: negative where the surface focuses light,
     which is exactly where a caustic falls. */
  float centre = surface(uv, u_contact, u_time, u_progress, u_pressure);
  float dx = surface(uv + vec2(e, 0.0), u_contact, u_time, u_progress, u_pressure)
           + surface(uv - vec2(e, 0.0), u_contact, u_time, u_progress, u_pressure) - 2.0 * centre;
  float dy = surface(uv + vec2(0.0, e), u_contact, u_time, u_progress, u_pressure)
           + surface(uv - vec2(0.0, e), u_contact, u_time, u_progress, u_pressure) - 2.0 * centre;
  float focus = -(dx + dy) / (e * e);

  /* Caustics are sparse and bright, not a wash: a narrow band of the focus
     field raised to a high power, so only genuine convergence survives. */
  /* 0.18 normalises the divergence field, whose peak was measured at 7.74 for
     this lens profile. The previous constant was calibrated for the radial
     wave field this shader used to read and left the caustics three orders of
     magnitude too dim to see. */
  float caustic = pow(clamp(focus * 0.18, 0.0, 1.0), 2.4);

  /* Drift the arcs slowly along the rim so they read as light moving over the
     material rather than as a texture printed on it. */
  float drift = 0.85 + 0.15 * sin(u_time * 0.9 + (uv.x - uv.y) * 5.0);

  vec3 colour = mix(u_tint, vec3(1.0), 0.6) * caustic * drift;
  float mask = panelMask(uv, 0.17, 0.02);
  float alpha = clamp(caustic * drift * u_progress * u_intensity, 0.0, 0.45) * mask;

  fragColor = vec4(colour, alpha);
}
