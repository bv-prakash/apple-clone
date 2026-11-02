# Showcase Block

## Overview

The Showcase block renders large promotional tiles: a headline, a short subhead, call-to-action buttons and a product image. Tiles fade and slide in as they scroll into view. The default variant stacks full-width tiles; the `grid` variant lays smaller tiles out two per row from tablet width up.

## Integration

### Block Configuration

This block does not read configuration via `readBlockConfig()`. Content is defined in the block rows.

### Block Structure

Each row becomes one tile. Cells can be in any order:
- **Image cell** – a picture; becomes `showcase-media`.
- **Copy cell** – becomes `showcase-copy`:
  - an optional short paragraph before the heading → eyebrow label (`showcase-eyebrow`)
  - a heading → headline (`showcase-headline`)
  - the paragraph right after the heading → subhead (`showcase-subhead`)
  - any later plain paragraphs → small print (`showcase-note`)
  - links authored as **bold** → filled button, *italic* → outline button
- **Theme cell** (optional) – `light`, `dark` or `gray`. Defaults to `light`, or `dark` when the block has the `dark` class.

Example authoring structure:
```
| Showcase (grid)  |                                                 |      |
|------------------|-------------------------------------------------|------|
| ![Watch](w.jpg)  | <h2>Watch</h2><p>Subhead</p>**Learn more** *Buy* | dark |
| ![Tablet](t.jpg) | <h2>Tablet</h2><p>Subhead</p>**Learn more** *Buy* | gray |
```

### Variants

- `grid` – two tiles per row from 735px; smaller headline and subhead sizes. Light tiles use the light grey surface so they stand out from the page.

<!-- ### URL Parameters

No URL parameters affect this block's behavior. -->

<!-- ### Local Storage

No localStorage keys are used by this block. -->

<!-- ### Events

This block does not emit or listen to any custom events. -->

## Behavior Patterns

### Page Context Detection

- **First tile on the page**: shown immediately and its image loads eagerly, because it is the likely LCP element.
- **Other tiles**: images load lazily and the tile animates in when it scrolls into view (`revealOnScroll` from `scripts/scripts.js`). The shared observer disconnects once every tile has been revealed.
- **Reduced motion**: tiles are shown without animation.

### User Interaction Flows

1. **Browse**: scrolling reveals each tile; on devices with a fine pointer, hovering a tile gently scales its image.
2. **Act**: the buttons link to the product and shop pages authored in the copy cell.

### Error Handling

- **Empty rows**: removed.
- **Missing cells**: a tile renders with whatever is present (copy only, image only, or both).
- **Unknown theme text**: treated as copy, and the default theme is used.
