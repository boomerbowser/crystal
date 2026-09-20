/* Icon gallery. Reads the generated manifest and renders a searchable grid.
   Without JavaScript the chapter still states where the complete list lives. */
(function () {
  'use strict';
  const mount = document.getElementById('icon-gallery');
  if (!mount) return;

  const manifestUrl = mount.dataset.manifest;
  const base = manifestUrl.replace(/manifest\.json$/, '');

  fetch(manifestUrl).then((r) => r.json()).then((data) => {
    mount.textContent = '';

    const controls = document.createElement('div');
    controls.className = 'icon-controls';

    const label = document.createElement('label');
    label.className = 'icon-search';
    label.htmlFor = 'icon-search';
    label.textContent = 'Search icons';

    const input = document.createElement('input');
    input.type = 'search';
    input.id = 'icon-search';
    input.className = 'cr-input';
    input.placeholder = 'workspace, arrow, calendar…';
    input.setAttribute('aria-describedby', 'icon-count');

    const count = document.createElement('p');
    count.id = 'icon-count';
    count.className = 'stage-note';
    count.setAttribute('role', 'status');

    label.append(input);
    controls.append(label);
    mount.append(controls, count);

    const grid = document.createElement('ul');
    grid.className = 'icon-grid';
    mount.append(grid);

    const render = (query) => {
      const needle = query.trim().toLowerCase();
      const matches = needle
        ? data.icons.filter((i) => i.id.includes(needle) || i.name.toLowerCase().includes(needle))
        : data.icons;

      grid.textContent = '';
      count.textContent = needle
        ? `${matches.length} of ${data.total} icons match “${query.trim()}”.`
        : `${data.total} icons. ${data.sources.crystal.count} original to Crystal, ${data.sources.lucide.count} derived from Lucide under the ISC License.`;

      const fragment = document.createDocumentFragment();
      for (const icon of matches.slice(0, 400)) {
        const item = document.createElement('li');
        item.className = 'icon-cell';

        const art = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        art.setAttribute('viewBox', '0 0 24 24');
        art.setAttribute('aria-hidden', 'true');
        art.setAttribute('focusable', 'false');
        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        /* Original symbols live in the sprite; vendored icons are their own files. */
        use.setAttribute('href', icon.source === 'crystal'
          ? `../assets/icons.svg#${icon.id}`
          : `${base}${icon.id}.svg#icon`);
        art.append(use);

        /* A sourced file has no internal id, so inline it instead of referencing one. */
        if (icon.source !== 'crystal') {
          art.replaceChildren();
          fetch(`${base}${icon.id}.svg`).then((r) => r.text()).then((svg) => {
            const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement;
            art.replaceChildren(...Array.from(parsed.childNodes));
          }).catch(() => { art.replaceChildren(); });
        }

        const name = document.createElement('code');
        name.textContent = icon.id;

        item.append(art, name);
        fragment.append(item);
      }
      grid.append(fragment);

      if (matches.length > 400) {
        const more = document.createElement('p');
        more.className = 'stage-note';
        more.textContent = `Showing the first 400. Narrow the search to see the rest.`;
        grid.after(more);
      }
    };

    render('');
    let pending;
    input.addEventListener('input', () => {
      clearTimeout(pending);
      pending = setTimeout(() => render(input.value), 120);
    });
  }).catch(() => {
    mount.textContent = 'The icon manifest could not be loaded. It is at assets/icons/manifest.json.';
  });
})();
