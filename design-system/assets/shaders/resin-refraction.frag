#version 300 es
/* Resin: edge lensing and dispersion.
 *
 * Modelled on how a thick, clear material actually behaves rather than on how a
 * liquid surface ripples. Three things carry the effect, in order of importance:
 *
 *   1. Lensing at the rim. Refraction is concentrated in a band just inside the
 *      boundary and falls off steeply, so the centre of the panel stays clean
 *      enough to read through. This is the whole reason it reads as glass.
 *   2. A specular band that tracks motion. The highlight's position follows the
 *      direction the element is travelling, which on a handset comes from the
 *      gyroscope and here comes from the motion's own direction. A highlight
 *      that does not move with the object reads as a painted-on gradient.
 *   3. Dispersion across the rim, not across the panel. Colour separates where
 *      the lens is steep, which is only at the edge.
 *
 * A web shader cannot sample the page behind it, so this renders the lighting
 * response to the computed surface rather than displacing a backdrop. The eye
 * reads normals and specular as refraction, and when the layer is absent the
 * surface is merely plainer, never wrong.
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

  float radius = 0.17;
  float sdf = roundedPanelSDF(uv, radius);
  /* The lens gets both shallower and NARROWER as progress falls. A thick band at
     low strength is a vignette, not a rim: it dims a fifth of the panel, which is
     the part of the surface content is read on. Depth and width are one physical
     quantity here, so they move together. At full displacement this resolves to
     the original 0.20, leaving the press response untouched. */
  float thickness = 0.10 + 0.10 * u_progress + u_pressure * 0.10;
  float rim = edgeLens(sdf, thickness) * u_progress;

  vec3 normal = surfaceNormal(uv, u_contact, u_time, u_progress, u_pressure);
  vec2 stretch = lensDirection(uv, u_contact, u_time, u_progress, u_pressure);

  /* The travel direction of the motion, standing in for device tilt: the
     contact point is where the movement came from, so the vector from it is
     where the light should gather. */
  vec2 travel = u_contact - vec2(0.5);
  vec2 lightDir = length(travel) > 0.001 ? normalize(travel) : vec2(-0.55, 0.83);

  /* Specular gathers where the rim faces the light. Raised to a high power so
     it is a band along part of the edge, never a uniform glow around all of it. */
  float facing = dot(stretch, -lightDir) * 0.5 + 0.5;
  float specular = pow(clamp(facing, 0.0, 1.0), 4.5) * rim;

  /* A thin bright line exactly on the boundary. This is what separates glass
     from frosted plastic: a defined edge that catches light. */
  float edgeLine = exp(-abs(sdf) * 190.0) * (0.45 + 0.55 * facing);

  /* Dispersion across the rim only. The offsets are small and opposed, so the
     result is a cool-to-warm separation at steep angles rather than a rainbow. */
  float steep = clamp(length(stretch) * rim * 2.2, 0.0, 1.0);
  vec3 dispersion = vec3(
    pow(clamp(facing + 0.05, 0.0, 1.0), 5.0),
    pow(clamp(facing,        0.0, 1.0), 5.0),
    pow(clamp(facing - 0.05, 0.0, 1.0), 5.0)
  ) * steep * 0.55;

  /* Fresnel from the lens depth: glancing parts of the surface reflect more. */
  float fresnel = pow(rim, 1.6);

  /* Centred on mid-grey because the layer composites with hard-light: 0.5 is
     the neutral point, so the shader darkens and lightens around the material
     instead of only adding to it. The interior sits at neutral and disappears. */
  vec3 lift = u_tint * (specular * 1.15 + fresnel * 0.45)
            + dispersion
            + vec3(edgeLine * 0.85);
  vec3 shade = vec3(rim * 0.13);        /* slight darkening deep in the lens */
  vec3 colour = clamp(vec3(0.5) + lift - shade, 0.0, 1.0);

  float mask = panelMask(uv, radius, 0.02);
  float alpha = clamp((specular * 1.5 + fresnel * 0.75 + edgeLine * 1.2)
                      * u_progress * u_intensity, 0.0, 0.72) * mask;

  fragColor = vec4(colour, alpha);
}
