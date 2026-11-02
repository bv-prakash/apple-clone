/* eslint-disable */
/* global WebImporter */

import { buildCopy, buildImage } from './showcase.js';

/**
 * Parser for the two-column promo grid (div.promo-grid) -> Showcase (grid) block.
 * One row per tile: image | copy | theme.
 */
export default function parse(element, { document }) {
  const cells = [...element.querySelectorAll(':scope > .promo')].map((tile) => [
    buildImage(tile, document),
    buildCopy(tile, document),
    tile.getAttribute('data-theme') || 'light',
  ]);
  if (!cells.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'Showcase (grid)', cells });
  element.replaceWith(block);
}
