/* eslint-disable */
/* global WebImporter */

import showcaseParser from './parsers/showcase.js';
import showcaseGridParser from './parsers/showcase-grid.js';
import galleryParser from './parsers/gallery.js';
import cleanupTransformer from './transformers/site-cleanup.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "description": "Homepage: full-width promo tiles, a two-column promo grid and a streaming gallery.",
  "urls": [],
  "blocks": [
    {
      "name": "showcase",
      "instances": [
        "main > section.promo.promo-hero"
      ]
    },
    {
      "name": "showcase-grid",
      "instances": [
        "main > div.promo-grid"
      ]
    },
    {
      "name": "gallery",
      "instances": [
        "main > section.shows"
      ]
    }
  ],
  "sections": []
};

const parsers = {
  'showcase': showcaseParser,
  'showcase-grid': showcaseGridParser,
  'gallery': galleryParser,
};
const transformers = [cleanupTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

// The source pages are a local stand-in, so their origin is meaningless once imported.
// Images live in the code repo (/images/...), so keep them root-relative.
function makeImagesRootRelative(main, originalURL) {
  const { origin } = new URL(originalURL);
  main.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (src.startsWith(origin)) img.setAttribute('src', src.slice(origin.length));
  });
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
    makeImagesRootRelative(main, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
