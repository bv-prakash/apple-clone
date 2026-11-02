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
 * Promo tiles: one row per tile with an image cell, a text cell
 * and an optional theme cell (light, dark or gray).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const fallbackTheme = block.classList.contains('dark') ? 'dark' : 'light';
  const isFirstSection = block.closest('.section') === block.closest('main')?.querySelector('.section');
  [...block.children].forEach((row, i) => {
    const cells = [...row.children];
    if (!cells.length) {
      row.remove();
      return;
    }

    const themes = cells.map(themeOf);
    const theme = themes.find(Boolean) || fallbackTheme;
    const media = cells.find((cell) => cell.querySelector('picture, img'));
    const text = cells.find((cell, j) => cell !== media && !themes[j] && cell.textContent.trim());

    const tile = document.createElement('div');
    tile.className = `showcase-tile showcase-${theme}`;

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
      // plain paragraphs: above the headline = eyebrow, right after = subhead, later = note
      if (heading) {
        let seenHeading = false;
        [...text.children].forEach((el) => {
          if (el === heading) {
            seenHeading = true;
            return;
          }
          if (el.tagName !== 'P' || el.classList.contains('button-wrapper') || el.querySelector('a')) return;
          if (!seenHeading) el.classList.add('showcase-eyebrow');
          else if (el.previousElementSibling === heading) el.classList.add('showcase-subhead');
          else el.classList.add('showcase-note');
        });
      }
      tile.append(text);
    }

    if (media) {
      media.className = 'showcase-media';
      // an optional second picture is the small-screen version of the artwork;
      // authored side by side they arrive wrapped in a paragraph, so unwrap them
      const pictures = media.querySelectorAll('picture');
      media.replaceChildren(...(pictures.length ? pictures : media.childNodes));
      if (pictures.length > 1) {
        media.classList.add('has-small');
        pictures[1].classList.add('showcase-media-small');
      }
      // the first tile holds the likely LCP image; authoring tools may mark every image lazy
      const loading = i === 0 && isFirstSection ? 'eager' : 'lazy';
      media.querySelectorAll('img').forEach((img) => { img.loading = loading; });
      tile.append(media);
    }

    // the whole tile is a click target for its first link; the buttons stay separate links
    const primary = text?.querySelector('a[href]');
    if (primary) {
      const cover = document.createElement('a');
      cover.className = 'showcase-cover';
      cover.href = primary.href;
      cover.tabIndex = -1;
      cover.setAttribute('aria-hidden', 'true');
      tile.prepend(cover);
    }

    row.replaceWith(tile);
  });
}
