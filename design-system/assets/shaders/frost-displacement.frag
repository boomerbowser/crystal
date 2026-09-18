#version 300 es
/* Frost: diffusion variation and broad colour refraction.
 *
 * Frost's material is its 40px backdrop blur and grain, and that stays exactly
 * as specified. This adds two things on top of it.
 *
 * The first is slow local variation in how much light the grained solid passes,
 * so the surface stops looking uniformly machined.
 *
 * The second is refraction of colour. At 40px of diffusion no *shape* survives
 * the material — you cannot see through frosted glass, you can only see the
 * colour of what is behind it. So Frost's refraction is chromatic and formless:
 * the three channels sample the same field at slightly different offsets, which
 * separates them into a slow warm-to-cool wander across the surface rather than
 * into a visible fringe. Resin, at 20px, keeps detail and so disperses sharply
 * at its rim instead. That difference is the diffusion radius talking, not a
 * stylistic choice: turning Resin's dispersion down does not produce Frost, it
 * produces weak Resin. */
uniform float u_time;
uniform vec2  u_resolution;
uniform float u_progress;
uniform vec3  u_tint;
uniform float u_intensity;

out vec4 fragColor;

/* One sample of the diffusion field. Offsetting the sample point per channel is
   what turns a grey variation into a colour one. */
float diffusionAt(vec2 uv){
  float coarse = fbm(uv * 2.4 + vec2(u_time * 0.055, u_time * 0.041));
  float fine   = fbm(uv * 9.0 - vec2(u_time * 0.085, u_time * 0.062));
  return mix(coarse, fine, 0.32);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;

  /* The separation drifts so the wander is never static, and stays wide — a
     broad offset gives a slow gradient of colour temperature; a narrow one
     would give a hard fringe, which is Resin's behaviour and wrong here. */
  float wander = 0.055 + 0.020 * sin(u_time * 0.13);
  vec2 axis = vec2(cos(u_time * 0.09), sin(u_time * 0.07)) * wander;

  float r = diffusionAt(uv + axis);
  float g = diffusionAt(uv);
  float b = diffusionAt(uv - axis);

  /* Centre each channel on zero so the overlay lightens and darkens equally and
     the mean brightness of the surface is unchanged. */
  vec3 signed = (vec3(r, g, b) - 0.5) * 2.0;
  float luma = (signed.r + signed.g + signed.b) / 3.0;

  /* Colour is the palette tint carrying the per-channel separation. The base is
     held near neutral so Frost never introduces a hue the token set did not
     sanction; the separation only leans it warm or cool. */
  vec3 colour = mix(vec3(0.5), u_tint, 0.30) + signed * 0.085;

  float mask = panelMask(uv, 0.16, 0.07);
  float alpha = clamp(abs(luma) * 0.30 * u_progress * u_intensity, 0.0, 0.22) * mask;

  fragColor = vec4(colour, alpha);
}
