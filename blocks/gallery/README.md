# Gallery Block

## Overview

The Gallery block is a looping carousel of wide artwork slides under an optional centred section title. The active slide is centred with its neighbours peeking in on each side. It autoplays, shows progress dots and a play/pause button, and supports swipe and keyboard navigation.

## Integration

### Block Configuration

This block does not read configuration via `readBlockConfig()`. Content is defined in the block rows.

### Block Structure

- **Title row** (optional) – a row with a heading and no image becomes the centred section title (`gallery-title`) and the carousel's accessible name.
- **Slide rows** – one per slide:
  - **Image cell** – the slide artwork; becomes `gallery-media`. An optional second picture is used below 735px instead of the first.
  - **Caption cell** (optional) – becomes `gallery-caption`, overlaid at the bottom of the active slide. A heading is kept for assistive tech only (the artwork carries the title) and labels the slide's dot; paragraphs are supporting text; a **bold** link becomes a light pill button.

Rows that are neither are skipped.

### Variants

- `compact` – a smaller row of tiles placed after a full-size gallery in the same section. It has no autoplay or controls of its own: it follows the full-size gallery's slide changes and takes over its dots and play/pause button, so both share one set of controls below the compact row.

Example authoring structure:
```
| Gallery            |                                                  |
|--------------------|--------------------------------------------------|
| <h2>Section title</h2> |                                              |
| ![Show 1](s1.jpg)  | <h3>Title</h3><p>Genre · Logline</p>**Stream now** |
| ![Show 2](s2.jpg)  | <h3>Title</h3><p>Genre · Logline</p>**Stream now** |
```

<!-- ### URL Parameters

No URL parameters affect this block's behavior. -->

<!-- ### Local Storage

No localStorage keys are used by this block. -->

<!-- ### Events

This block does not emit or listen to any custom events. -->

## Behavior Patterns

### Page Context Detection

- **One slide**: rendered as a static slide with no loop, controls or timers.
- **Off screen or hidden tab**: autoplay pauses and resumes when the gallery is visible again.
- **Reduced motion**: autoplay is off by default and slide transitions are instant.
- **Removed from the page** (for example when Document Authoring preview re-renders): all timers, observers and listeners are released through a single `AbortController`.

### User Interaction Flows

1. **Autoplay**: slides advance every 5 seconds; the active dot fills to show progress.
2. **Pick a slide**: click a dot, or click a peeking neighbour to bring it to the centre.
3. **Swipe**: drag more than 50px left or right on touch or pointer devices.
4. **Keyboard**: with focus inside the gallery, `ArrowLeft` / `ArrowRight` move between slides; Tab reaches the dots and the play/pause button.
5. **Pause**: the play/pause button stops and restarts autoplay.

### Error Handling

- **No usable rows**: the block renders empty.
- **Layout changes**: a `ResizeObserver` re-centres the active slide when the gallery width changes.
