# Footer Block

## Overview

The Footer block renders the site footer from a fragment: fine-print notes, a directory of link columns, and a legal row with copyright, legal links and locale. On small screens the directory columns collapse into accordions.

## Integration

### Content

The footer fragment is loaded with `loadSiteFragment('footer')` from `blocks/fragment/fragment.js` (`/content/footer` in local preview, `/footer` on published sites). It has three sections:

1. **Notes** – an optional numbered list of footnotes (matching superscript markers on the page), then paragraphs of fine print. Links are underlined.
2. **Directory** – lists of groups. Each list is one column and each item a group: its leading text is the group title, followed by a list of links, so a column can stack several groups. With a single list, every item becomes its own column.
3. **Legal** – paragraphs (shopping help line, copyright, locale) and one list of legal links. On desktop the last paragraph (locale) is pushed to the right.

### Block Configuration

No configuration is read via `readBlockConfig()`.

<!-- ### URL Parameters

No URL parameters affect this block's behavior. -->

<!-- ### Local Storage

No localStorage keys are used by this block. -->

<!-- ### Events

This block does not emit or listen to any custom events. -->

## Behavior Patterns

### Page Context Detection

- **Mobile (< 834px)**: each group title is a button that expands or collapses its links, with a plus that turns into a cross.
- **Desktop (≥ 834px)**: columns sit side by side with their groups stacked and expanded; the titles are not interactive.
- **Reduced motion**: accordion transitions are disabled.

### User Interaction Flows

1. **Expand a group (mobile)**: tap the group title; `aria-expanded` and the `open` class toggle. A single delegated listener on the directory handles every column.

### Error Handling

- **Missing fragment**: the footer renders empty.
- **Missing sections**: each section is optional; only those present are rendered.
- **Items without a link list**: skipped in the directory; empty columns are dropped.
