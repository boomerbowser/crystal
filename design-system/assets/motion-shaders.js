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
  function tintOf(element) {
    const value = getComputedStyle(element).getPropertyValue('--cr-accent')
      || getComputedStyle(document.documentElement).getPropertyValue('--cr-accent');
    const parts = (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    if (parts.length === 3) return parts.map((c) => Math.pow(c / 255, 2.2));
    return [0.45, 0.22, 0.94].map((c) => c);
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
      const seconds = record.ambient ? record.clock : (now - started) / 1000;
      const progress = typeof options.progress === 'function'
        ? options.progress(seconds) : (options.progress ?? 1);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(locations.time, seconds);
      gl.uniform2f(locations.resolution, canvas.width, canvas.height);
      gl.uniform1f(locations.progress, Math.max(0, Math.min(1, progress)));
      gl.uniform1f(locations.pressure, options.pressure ?? 0);
      gl.uniform2f(locations.contact, options.contact?.[0] ?? 0.5, options.contact?.[1] ?? 0.5);
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
     being typed into is where motion genuinely competes with the task. */
  let settle;
  const energise = (rate) => {
    state.energy = rate;
    clearTimeout(settle);
    settle = setTimeout(() => { state.energy = 0.6; }, 900);
  };
  root.addEventListener('pointerover', (event) => {
    if (event.target instanceof Element
      && event.target.closest('button,a,[role=button],.cr-control')) energise(1);
  }, { passive: true });
  root.addEventListener('pointerdown', () => energise(2.4), { passive: true });
  root.addEventListener('focusin', (event) => {
    const field = event.target;
    const typing = field instanceof Element && field.matches(
      'input:not([type=range],[type=checkbox],[type=radio],[type=button],[type=submit],[type=reset]),textarea,[contenteditable=true]');
    state.energy = typing ? 0 : 0.6;
  }, { passive: true });

  /* A page has many material surfaces and a browser has few WebGL contexts — Chromium
     starts discarding them around sixteen. Ambient shaders are therefore capped well
     below that and given only to surfaces actually on screen; everything else keeps the
     CSS floor, which is complete on its own. Haze, Stone and Plastic never take a
     context at all: their motion is CSS, which is cheap enough to be everywhere. */
  const MAX_AMBIENT = 6;
  const AMBIENT_FOR = [['.cr-resin,.cr-glass', 'resin-refraction'], ['.cr-frost,.cr-acrylic', 'frost-displacement']];
  const ambientHandles = new Map();

  function ambient(element, shaderId) {
    if (ambientHandles.has(element) || ambientHandles.size >= MAX_AMBIENT) return null;
    /* 2.2 is where the shader's own alpha ceiling takes over — past it nothing changes,
       which is the material's low-amplitude rule holding rather than a number chosen by
       eye. Below it the effect measures a worst-channel delta of 3 against a still
       surface, which is present in a contract and absent to a person. */
    const pending = attach(element, shaderId, { ambient: true, progress: 1, intensity: 2.2 });
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
