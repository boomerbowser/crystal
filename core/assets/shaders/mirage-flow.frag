#version 300 es
/* Mirage: the advancing front.
 *
 * Mirage washes across a scene. The CSS fallback is an ellipse, which is
 * correct but geometric; advecting the front through a flow field gives it an
 * organic edge while keeping the same direction and timing, so the two versions
 * are recognisably the same movement. */
uniform float u_time;
uniform vec2  u_resolution;
uniform float u_progress;
uniform vec2  u_contact;
uniform vec3  u_tint;
uniform float u_intensity;

out vec4 fragColor;

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  panelSpace(u_resolution);

  /* Distort the sampling position before measuring distance: the front is
     still a expanding boundary, but its edge is shaped by the flow rather
     than by an equation. */
  vec2 flow = vec2(fbm(uv * 2.2 + u_time * 0.10), fbm(uv * 2.2 - u_time * 0.08));
  vec2 distorted = uv + (flow - 0.5) * 0.14;

  float distance = length(distorted - u_contact);
  /* The front expands past 1.0 so it can clear the far corner of a wide
     surface before the animation ends. */
  float front = u_progress * 1.45;
  float edge = smoothstep(front, front - 0.22, distance);

  /* Brightest just behind the leading edge, as a real wash is. */
  float crest = smoothstep(front - 0.26, front - 0.10, distance) * (1.0 - edge * 0.25);

  vec3 colour = mix(u_tint, vec3(1.0), crest * 0.40);
  float alpha = clamp(edge * 0.30 + crest * 0.24, 0.0, 0.5) * u_progress * u_intensity;

  fragColor = vec4(colour, alpha);
}
