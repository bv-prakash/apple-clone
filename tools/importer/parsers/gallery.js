/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the streaming shows strip (section.shows) -> Gallery block.
 * One row per show: key art | title, description and CTA.
 */
export default function parse(element, { document }) {
  const cells = [...element.querySelectorAll('.show')].map((show) => {
    const source = show.querySelector('img');
    const img = document.createElement('img');
    if (source) {
      img.src = source.getAttribute('src');
      img.alt = source.getAttribute('alt') || '';
    }

    const caption = document.createElement('div');
    const title = show.querySelector('h2, h3, h4');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      caption.append(h3);
    }
    show.querySelectorAll('.show-info p').forEach((p) => {
      const para = document.createElement('p');
      para.textContent = p.textContent.trim();
      caption.append(para);
    });
    const cta = show.querySelector('a.cta');
    if (cta) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const link = document.createElement('a');
      link.href = cta.getAttribute('href');
      link.textContent = cta.textContent.trim();
      strong.append(link);
      p.append(strong);
      caption.append(p);
    }
    return [source ? img : '', caption];
  });
  if (!cells.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Gallery', cells });
  element.replaceWith(block);
}
