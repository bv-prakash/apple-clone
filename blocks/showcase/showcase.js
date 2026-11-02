const THEMES = ['light', 'dark', 'gray'];

/**
 * Returns the theme keyword a cell holds, if that is all it holds.
 * @param {Element} cell
 * @returns {string|undefined}
 */
function themeOf(cell) {
  if (!cell || cell.querySelector('picture, img, a')) return undefined;
  const text = cell.textContent.trim().toLowerCase();
  return THEMES.includes(text) ? text : undefined;
}

/**
 * Animates tiles in once they scroll into view.
 * @param {Element[]} tiles
 */
function observeTiles(tiles) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !('IntersectionObserver' in window)) {
    tiles.forEach((tile) => tile.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -15% 0px' });
  tiles.forEach((tile) => observer.observe(tile));
}

/**
 * Promo tiles: one row per tile with an image cell, a text cell
 * and an optional theme cell (light, dark or gray).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const tiles = [];
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    if (!cells.length) {
      row.remove();
      return;
    }

    const theme = cells.map(themeOf).find(Boolean)
      || (block.classList.contains('dark') ? 'dark' : 'light');
    const media = cells.find((cell) => cell.querySelector('picture, img'));
    const text = cells.find((cell) => cell !== media && !themeOf(cell)
      && cell.textContent.trim());

    const tile = document.createElement('div');
    tile.className = `showcase-tile showcase-${theme}`;
    // the first tile on the page is the LCP candidate; never hide it
    if (i === 0 && block.closest('.section') === block.closest('main')?.querySelector('.section')) {
      tile.classList.add('in-view');
    }

    if (text) {
      text.className = 'showcase-copy';
      const heading = text.querySelector('h1, h2, h3, h4');
      if (heading) heading.classList.add('showcase-headline');
      const ctas = text.querySelectorAll('.button-wrapper');
      if (ctas.length) {
        const group = document.createElement('div');
        group.className = 'showcase-ctas';
        ctas[0].before(group);
        ctas.forEach((cta) => group.append(cta));
      }
      // short paragraphs above the headline read as an eyebrow label
      const first = text.firstElementChild;
      if (first && first.tagName === 'P' && heading && !first.querySelector('a')) {
        first.classList.add('showcase-eyebrow');
      }
      tile.append(text);
    }

    if (media) {
      media.className = 'showcase-media';
      const img = media.querySelector('img');
      // the first tile is the likely LCP image; authoring tools may mark every image lazy
      if (img) img.loading = tile.classList.contains('in-view') ? 'eager' : 'lazy';
      tile.append(media);
    }

    row.replaceWith(tile);
    tiles.push(tile);
  });

  observeTiles(tiles);
}
