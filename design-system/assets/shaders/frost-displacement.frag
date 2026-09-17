#version 300 es
/* Frost: diffusion variation.
 *
 * Frost's material is its 40px backdrop blur and grain, and that stays exactly
 * as specified. This adds only slow local variation in how much light the
 * grained solid passes, so the surface stops looking uniformly machined without
 * changing the recipe underneath it. */
uniform float u_time;
uniform vec2  u_resolution;
uniform float u_progress;
uniform vec3  u_tint;
uniform float u_intensity;

out vec4 fragColor;

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;

  /* Two fields at different scales and speeds: a large slow one for structure,
     a small faster one for the crystalline detail. One field alone reads as
     either featureless or as noise. */
  float coarse = fbm(uv * 2.4 + vec2(u_time * 0.055, u_time * 0.041));
  float fine   = fbm(uv * 9.0 - vec2(u_time * 0.085, u_time * 0.062));

  float diffusion = mix(coarse, fine, 0.32);
  /* Centre on zero so the overlay lightens and darkens equally and the mean
     brightness of the surface is unchanged. */
  float signed = (diffusion - 0.5) * 2.0;

  vec3 colour = mix(vec3(0.5), u_tint, 0.30) + signed * 0.08;
  float mask = panelMask(uv, 0.16, 0.07);
  float alpha = clamp(abs(signed) * 0.30 * u_progress * u_intensity, 0.0, 0.22) * mask;

  fragColor = vec4(colour, alpha);
}
