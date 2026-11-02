# Ribbon Block

## Overview

The Ribbon block shows a single-line message on a dark full-width strip above the first tiles, such as a store offer, with an optional call-to-action link and footnote markers.

## Integration

### Block Configuration

This block does not read configuration via `readBlockConfig()`. Content is defined in the block cell.

### Block Structure

One cell (extra cells are merged in order):
- the message text, which may include superscript footnote markers (a marker can link to its footnote)
- the last link that isn't inside a superscript becomes the call to action (`ribbon-link`), shown in blue with a chevron

Example authoring structure:
```
| Ribbon                                                        |
|---------------------------------------------------------------|
| No-cost EMI on selected products with eligible cards.‡ [Shop](/store/) |
```

<!-- ### URL Parameters

No URL parameters affect this block's behavior. -->

<!-- ### Local Storage

No localStorage keys are used by this block. -->

<!-- ### Events

This block does not emit or listen to any custom events. -->

## Behavior Patterns

### Page Context Detection

- **All sizes**: centred text; on narrow screens the message wraps and the call to action stays on one line.

### User Interaction Flows

1. **Follow the offer**: the call-to-action link opens the authored destination.

### Error Handling

- **No link**: the message is shown on its own.
