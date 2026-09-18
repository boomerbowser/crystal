/* Crystal's optical shader layer.
 *
 * Strictly an enhancement. Every material renders completely without this file,
 * and nothing here may change a resting appearance: shaders paint only while a
 * motion is in flight, and gate G6 proves the preview is pixel-identical when
 * WebGL2 is unavailable. If anything in here throws, the surface is left exactly
 * as the stylesheet drew it.
 *
 * The contract lives in assets/shaders/manifest.json, not here. This is the web
 * implementation of it; a platform library honours the same uniforms its own way.
 */
(function (root) {
  'use strict';

  /* Resolve from this script's own URL, not the page's.
     A page-relative 'assets/shaders/...' only works for pages at the site root:
     from /docs/materials.html it resolves to /docs/assets/shaders/... and 404s.
     Because the runtime fails quietly by design, that broke the optical layer on
     ten documentation pages without any visible symptom. Deriving the base from
     the script location works at any depth and under any origin or subpath,
     which is also what a static host serving this directory requires. */
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  const ASSET_BASE = SCRIPT_SRC ? new URL('.', SCRIPT_SRC).href : 'assets/';
  const MANIFEST_URL = new URL('shaders/manifest.json', ASSET_BASE).href;
  const SHADER_DIR = new URL('shaders/', ASSET_BASE).href;

  const VERTEX = `#version 300 es
in vec2 a_position;
void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }`;

  const state = { manifest: null, common: null, sources: new Map(), active: new Map(), energy: 0.6 };

  const prefers = (query) => {
    try { return matchMedia(query).matches; } catch { return false; }
  };

  /* Every condition that must hold for a shader to run. Checked on attach and
     re-checked whenever the environment changes, because a user can turn
     reduced motion on while a page is open. */
  function permitted() {
    if (prefers('(prefers-reduced-motion: reduce)')) return false;
    if (prefers('(prefers-reduced-transparency: reduce)')) return false;
    if (prefers('(forced-colors: active)')) return false;
    if (document.hidden) return false;
    return true;
  }

  function webgl2Available() {
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      return !!probe;
    } catch { return false; }
  }

  const supported = webgl2Available();

  async function load() {
    if (state.manifest) return state.manifest;
    const manifest = await fetch(MANIFEST_URL).then((r) => r.json());
    /* The shared GLSL is spliced in after the #version directive, which the
       language requires to be the literal first line of the source. */
    state.common = await fetch(`${SHADER_DIR}_common.glsl`).then((r) => r.text());
    state.manifest = manifest;
    return manifest;
  }

  async function sourceFor(entry) {
    if (state.sources.has(entry.id)) return state.sources.get(entry.id);
    const body = await fetch(SHADER_DIR + entry.file).then((r) => r.text());
    const match = body.match(/^\s*#version[^\n]*\n/);
    const source = match
      ? match[0] + state.common + body.slice(match[0].length)
      : state.common + body;
    state.sources.set(entry.id, source);
    return source;
  }

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Crystal shader failed to compile: ' + log);
    }
    return shader;
  }

  function program(gl, fragmentSource) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Crystal shader failed to link: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }

  /* Read the material tint from the resolved palette rather than choosing a
     colour here, so a shader can never introduce colour the token set did not
     sanction. */
  /* `--cr-companion` is the same token the shadow tint is mixed from in
     CrystalMotion.exportCSS. Refracted light and the shadow it casts have to agree
     about what colour the light is, so they read one token, not two. An earlier
     draft read `--cr-accent`, which no palette defines — every palette therefore
     refracted the hardcoded fallback, and the shaders were prism-purple regardless
     of the scheme. The fallback is kept only for a surface queried before the
     theme resolves, and is the default palette's own companion linearised. */
  /* Palette tokens are authored as hex, so a bare digit scan reads "#EF48C6" as
     the two numbers 48 and 6 and silently falls through to the default every
     time. Both notations are parsed explicitly instead. */
  function parseColour(value) {
    const text = (value || '').trim();
    const hex = /^#([0-9a-f]{3,8})$/i.exec(text);
    if (hex) {
      const digits = hex[1].length < 6
        ? hex[1].slice(0, 3).split('').map((c) => c + c).join('')
        : hex[1].slice(0, 6);
      return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16));
    }
    const parts = (text.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? parts : null;
  }

  function tintOf(element) {
    const value = getComputedStyle(element).getPropertyValue('--cr-companion')
      || getComputedStyle(document.documentElement).getPropertyValue('--cr-companion');
    const parts = parseColour(value);
    /* sRGB to linear, because the shader mixes light rather than pixels. */
    if (parts) return parts.map((c) => Math.pow(c / 255, 2.2));
    return [0.867, 0.062, 0.573];
  }

  function detach(element) {
    const entry = state.active.get(element);
    if (!entry) return;
    cancelAnimationFrame(entry.frame);
    try { entry.gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* best effort */ }
    entry.canvas.remove();
    /* Put back exactly what was there, so a detached surface is indistinguishable
       from one that never had a shader. */
    element.style.position = entry.previousPosition || '';
    element.style.isolation = entry.previousIsolation || '';
    state.active.delete(element);
  }

  /* Attach a shader to a surface for the duration of one motion.
     `progress` is supplied by the caller and is expected to be spring
     displacement, not a linear ramp — that is what ties the optical layer to
     the same physics as the geometry. */
  async function attach(element, shaderId, options = {}) {
    if (!supported || !permitted()) return null;
    if (state.active.has(element)) detach(element);

    let entry, source;
    try {
      const manifest = await load();
      entry = manifest.shaders.find((s) => s.id === shaderId);
      if (!entry) return null;
      source = await sourceFor(entry);
    } catch { return null; }

    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    /* Never in the content flow, never interactive, never announced. */
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', mixBlendMode: entry.blend || 'screen',
      borderRadius: getComputedStyle(element).borderRadius,
      /* Below the surface's own content. A negative z-index paints after the
         element's background but before its in-flow children, which is where an
         optical layer physically belongs: light plays on the material, not on
         the label sitting on it. Painting above the content would put a
         translucent wash over text whose contrast is verified, which is not a
         trade Crystal makes. */
      zIndex: '-1',
    });

    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, antialias: false });
    if (!gl) return null;

    let compiled;
    try { compiled = program(gl, source); } catch { return null; }

    gl.useProgram(compiled);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(compiled, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const uniform = (name) => gl.getUniformLocation(compiled, name);
    const locations = {
      time: uniform('u_time'), resolution: uniform('u_resolution'),
      progress: uniform('u_progress'), pressure: uniform('u_pressure'),
      contact: uniform('u_contact'), tint: uniform('u_tint'),
      intensity: uniform('u_intensity'),
    };

    /* The surface must establish a containing block for the absolutely
       positioned canvas. Recorded so it can be put back on detach. */
    const previousPosition = element.style.position;
    const previousIsolation = element.style.isolation;
    if (getComputedStyle(element).position === 'static') element.style.position = 'relative';
    /* A negative z-index only stays inside this element if the element is its
       own stacking context; without isolation the canvas would sink behind the
       element's background, or further. Isolation also confines the blend to
       this surface, so a shader can never tint the page around it. */
    element.style.isolation = 'isolate';
    element.appendChild(canvas);

    const tint = tintOf(element);
    const started = performance.now();
    const record = { canvas, gl, frame: 0, previousPosition, previousIsolation, element,
      /* Ambient surfaces keep their own clock. Interaction advances it faster rather than
         brightening the surface, which is what "faster on press" physically means: the
         light moves quicker, it does not become more light. */
      clock: 0, last: started, ambient: !!options.ambient };
    state.active.set(element, record);

    const draw = (now) => {
      if (!permitted()) { detach(element); return; }
      if (record.ambient && root.document.documentElement.dataset.ambient === 'off') { detach(element); return; }
      const rate = record.ambient ? state.energy : 1;
      record.clock += ((now - record.last) / 1000) * rate;
      record.last = now;
      /* A surface that moves at rest cannot be photographed by a comparison gate, and
         the previous answer — capture every frame with ambient switched off — meant the
         rest state was never in a reference frame at all. That is how a Resin lens
         pinned at full press deformation reached the preview unseen. Pinning the clock
         instead freezes the effect at a chosen instant, so ambient appearance becomes
         as reviewable as anything else. It is a capture hook, not a product feature:
         reading it costs one attribute lookup per frame and it is documented as such. */
      const frozen = Number(root.document.documentElement.dataset.ambientClock);
      const seconds = Number.isFinite(frozen) && record.ambient
        ? frozen
        : (record.ambient ? record.clock : (now - started) / 1000);
      const progress = typeof options.progress === 'function'
        ? options.progress(seconds) : (options.progress ?? 1);
      /* The contact point is where the light gathers. During a motion it is fixed —
         the place the movement came from. At rest it is the one thing that moves:
         the shader reads only its direction from centre, so walking it around a
         circle sweeps the specular band along the rim without changing anything
         else. Light travelling over a still surface is the whole rest effect. */
      const contact = typeof options.contact === 'function'
        ? options.contact(seconds) : options.contact;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(locations.time, seconds);
      gl.uniform2f(locations.resolution, canvas.width, canvas.height);
      gl.uniform1f(locations.progress, Math.max(0, Math.min(1, progress)));
      gl.uniform1f(locations.pressure, options.pressure ?? 0);
      gl.uniform2f(locations.contact, contact?.[0] ?? 0.5, contact?.[1] ?? 0.5);
      gl.uniform3f(locations.tint, tint[0], tint[1], tint[2]);
      gl.uniform1f(locations.intensity, options.intensity ?? 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (options.duration && (now - started) >= options.duration) { detach(element); return; }
      record.frame = requestAnimationFrame(draw);
    };
    record.frame = requestAnimationFrame(draw);
    return { detach: () => detach(element) };
  }

  function detachAll() { for (const element of [...state.active.keys()]) detach(element); }

  document.addEventListener('visibilitychange', () => { if (document.hidden) detachAll(); });

  /* Ambient energy. Rest, hover, press — the surface is always moving, and interaction
     adds to it rather than stopping it. Text entry is the one exception, because a field
     being typed into is where motion genuinely competes with the task.

     The rate itself belongs to assets/motion.js, which owns the one table and broadcasts
     it. This tier used to keep a second copy of the same numbers, and the copies had
     already drifted apart: this one dropped to zero on text focus and had no blur
     handler at all, so leaving a field by any route left every shader frozen until the
     next click. Listening costs nothing and cannot drift. Loaded without that file, the
     shaders simply stay at the resting rate. */
  root.addEventListener('crystal:ambient-rate', (event) => {
    const rate = Number(event.detail?.rate);
    if (Number.isFinite(rate)) state.energy = rate;
  });

  /* A page has many material surfaces and a browser has few WebGL contexts — Chromium
     starts discarding them around sixteen. Ambient shaders are therefore capped well
     below that and given only to surfaces actually on screen; everything else keeps the
     CSS floor, which is complete on its own. Haze, Stone and Plastic never take a
     context at all: their motion is CSS, which is cheap enough to be everywhere. */
  const MAX_AMBIENT = 6;

  /* What "at rest" means, per material. This is the part an earlier draft got wrong:
     it handed both shaders `progress: 1`, which is not a rest state but the peak of a
     press. For Resin that pinned the lens at full deformation forever — a hard-edged
     band a fifth of the panel deep, with its own dark inner shade, permanently
     embossed around every Resin surface and showing through anything laid over it.
     `progress` is a displacement, so at rest it must be small, and it must move.

     Resin refracts: a shallow lens that breathes slightly while the specular band
     travels around the rim. Frost diffuses: no lens at all, so its progress only
     scales the grain's displacement and its light does not travel. The two materials
     are deliberately given different rest behaviour, because the difference between
     them is the point of the hierarchy.

     Calibrated by measurement, not by eye, against a still capture of the same
     surface (tools/audit-ambient.mjs keeps these numbers honest):

       worst-channel delta        rim mean   rim max   interior mean
       as shipped in 021e0a0         48.73        81            9.35
       Resin at rest, now             1.90        34            0.02
       Frost at rest, now             1.51        26            0.80

     The shipped figures are the two faults compounded: a pinned progress, and a
     panel geometry measured in 0..1 uv, which on a wide control stretched the
     lens band until it reached the middle of the surface. With the geometry
     corrected in _common.glsl the interior stays clean even at progress 1, so it
     is the rim mean that now catches a lens pinned open — all three bounds are
     load-bearing and each of them has been shown to fail on demand.

     `intensity` is high because it scales alpha alone: the lens stays shallow and
     narrow, and only the light travelling over it gets brighter. */
  const REST = {
    'resin-refraction': {
      progress: (t) => 0.15 + 0.05 * Math.sin(t * 0.55),
      contact: (t) => [0.5 + 0.4 * Math.cos(t * 0.22), 0.5 + 0.4 * Math.sin(t * 0.22)],
      intensity: 16,
    },
    /* Frost has no lens, so its progress scales grain displacement rather than a
       deformation, and 1 is not the same mistake here that it was for Resin. 0.85
       is still measurably the better rest value: identical travel (7) and identical
       rim max (26), with rim mean 1.51 against 2.00 and interior 0.80 against 1.13.
       Quieter at rest for nothing given up. */
    'frost-displacement': { progress: 0.85, intensity: 2.2 },
  };
  const AMBIENT_FOR = [['.cr-resin,.cr-glass', 'resin-refraction'], ['.cr-frost,.cr-acrylic', 'frost-displacement']];
  const ambientHandles = new Map();

  function ambient(element, shaderId) {
    if (ambientHandles.has(element) || ambientHandles.size >= MAX_AMBIENT) return null;
    const rest = REST[shaderId];
    if (!rest) return null;
    const pending = attach(element, shaderId, { ...rest, ambient: true });
    ambientHandles.set(element, pending);
    return pending;
  }
  function stopAmbient(element) {
    const pending = ambientHandles.get(element);
    ambientHandles.delete(element);
    Promise.resolve(pending).then((handle) => handle && handle.detach()).catch(() => {});
  }

  /* Give every Resin and Frost surface on the page its rest state, as they come into
     view. This is what the preview calls; a product opts surfaces in itself. */
  function ambientAll(scope = document) {
    if (!supported || !permitted()) return () => {};
    const observer = new IntersectionObserver((entries) => {
      for (const record of entries) {
        const shaderId = AMBIENT_FOR.find(([selector]) => record.target.matches(selector))?.[1];
        if (!shaderId) continue;
        if (record.isIntersecting) ambient(record.target, shaderId);
        else stopAmbient(record.target);
      }
    }, { rootMargin: '64px' });
    for (const [selector] of AMBIENT_FOR)
      for (const element of scope.querySelectorAll(selector)) observer.observe(element);
    return () => { observer.disconnect(); for (const el of [...ambientHandles.keys()]) stopAmbient(el); };
  }

  root.CrystalShaders = Object.freeze({
    attach, detach, detachAll, supported, ambient, stopAmbient, ambientAll,
    permitted, manifestUrl: MANIFEST_URL, maxAmbient: MAX_AMBIENT,
  });

  /* Ambient is the rest state of Resin and Frost, so it starts on its own. It is not a
     decision a page has to remember to make — a material that only comes alive when
     asked is not a material with a rest state. `data-ambient="off"` on the document
     turns it off everywhere, which is what reference captures set, and a product can
     stop any single surface with `stopAmbient`. */
  function startAmbient() {
    if (document.documentElement.dataset.ambient === 'off') return;
    ambientAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startAmbient);
  else startAmbient();
})(window);
