# Header Block

## Overview

Global navigation: a dark translucent bar pinned to the top of the page with the brand mark, top-level links with flyout panels, and utility icons (search, bag). Desktop shows dark hover flyouts that dim and blur the page behind them; small screens get a dark full-screen menu with drill-in submenus.

## Integration

### Content

The nav fragment is loaded with `loadSiteFragment('nav')` from `blocks/fragment/fragment.js` (`/content/nav` in local preview, `/nav` on published sites). It has three sections:

1. **Brand** – a link, usually wrapping the logo image.
2. **Menu** – a list. Each item is a link, optionally followed by a nested list of groups. A group is an item whose leading text is the group title, followed by a list of links. The first group is shown in the large type style.
3. **Tools** – links. `:search:` / `:cart:` style icon shorthand is expanded into icons, and icon-only links get an accessible label.

### Metadata

None. The fragment path is derived from where the page is served, so local preview and published sites both resolve without an extra request.

## Behavior Patterns

- **Desktop (≥ 834px):** hovering an item opens its flyout after a short delay; moving between items switches instantly. The bar grows to the flyout height and a curtain blurs the page. The chevron next to each link opens the flyout from the keyboard. `Escape`, clicking the curtain, or leaving the nav closes it.
- **Mobile:** the menu button morphs into a close icon and opens a full-screen menu whose items fade in with a stagger. Tapping an item with a flyout slides in its submenu with a back button. Body scrolling is locked while the menu is open.
- **Reduced motion:** all transitions are disabled.

### Lifecycle

Window and media-query listeners are tied to an `AbortController`. Decorating a new header (for example when Document Authoring preview re-renders the page) aborts the previous one, clearing its timers, listeners, body classes and scroll lock.

## Files

- `header.js` – builds the nav from the fragment and wires the interactions.
- `header.css` – mobile-first styles; desktop layout from 834px.
