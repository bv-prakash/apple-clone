/* eslint-disable */
/* global WebImporter */

/**
 * Parser for full-width promo tiles (section.promo.promo-hero) -> Showcase block.
 * One row per tile: image | copy | theme.
 */
function buildCopy(tile, document) {
  const copy = document.createElement('div');
  const eyebrow = tile.querySelector('.promo-eyebrow');
  const heading = tile.querySelector('h1, h2, h3');
  const sub = tile.querySelector('.promo-sub');
  if (eyebrow) {
    const p = document.createElement('p');
    p.textContent = eyebrow.textContent.trim();
    copy.append(p);
  }
  if (heading) {
    const h2 = document.createElement('h2');
    h2.textContent = heading.textContent.trim();
    copy.append(h2);
  }
  if (sub) {
    const p = document.createElement('p');
    p.textContent = sub.textContent.trim();
    copy.append(p);
  }
  tile.querySelectorAll('.promo-ctas a').forEach((a) => {
    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.trim();
    // strong = primary (filled) button, em = secondary (outline) button
    const wrap = document.createElement(a.classList.contains('cta-secondary') ? 'em' : 'strong');
    wrap.append(link);
    p.append(wrap);
    copy.append(p);
  });
  return copy;
}

function buildImage(tile, document) {
  const source = tile.querySelector('img');
  if (!source) return '';
  const img = document.createElement('img');
  img.src = source.getAttribute('src');
  img.alt = source.getAttribute('alt') || '';
  return img;
}

export default function parse(element, { document }) {
  const theme = element.getAttribute('data-theme') || 'light';
  const cells = [[buildImage(element, document), buildCopy(element, document), theme]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Showcase', cells });
  element.replaceWith(block);
}
