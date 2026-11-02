import { decorateIcons } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// matches the breakpoint in header.css
const isDesktop = window.matchMedia('(min-width: 834px)');
const OPEN_DELAY = 150;
const CLOSE_DELAY = 120;
const TOOL_LABELS = { search: 'Search', cart: 'Shopping bag' };

/** @type {AbortController|undefined} */
let teardown;

/**
 * Reads one top-level nav item: its link and any flyout groups below it.
 * A group is an <li> whose leading text is the group title, followed by a <ul> of links.
 * @param {HTMLLIElement} li
 */
function readItem(li) {
  const link = li.querySelector(':scope > a, :scope > p > a');
  const groups = [...li.querySelectorAll(':scope > ul > li')].map((groupLi) => {
    const list = groupLi.querySelector(':scope > ul');
    const titleNode = [...groupLi.childNodes].find((n) => n !== list && n.textContent.trim());
    return {
      title: titleNode ? titleNode.textContent.trim() : '',
      links: list ? [...list.querySelectorAll(':scope > li a')] : [],
    };
  }).filter((group) => group.links.length);
  return { link, groups };
}

function chevron(direction) {
  const span = document.createElement('span');
  span.className = `globalnav-chevron globalnav-chevron-${direction}`;
  span.setAttribute('aria-hidden', 'true');
  return span;
}

function buildFlyout(item, index) {
  const flyout = document.createElement('div');
  flyout.className = 'globalnav-flyout';
  flyout.id = `globalnav-flyout-${index}`;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'globalnav-back';
  back.setAttribute('aria-label', 'Back to main menu');
  back.append(chevron('left'));
  flyout.append(back);

  const inner = document.createElement('div');
  inner.className = 'globalnav-flyout-inner';
  let order = 0;
  item.groups.forEach((group, g) => {
    const col = document.createElement('div');
    col.className = `globalnav-group${g === 0 ? ' globalnav-group-primary' : ''}`;
    if (group.title) {
      const title = document.createElement('h2');
      title.className = 'globalnav-group-title';
      title.textContent = group.title;
      title.style.setProperty('--i', order);
      order += 1;
      col.append(title);
    }
    const ul = document.createElement('ul');
    group.links.forEach((a) => {
      const li = document.createElement('li');
      li.style.setProperty('--i', order);
      order += 1;
      a.className = 'globalnav-flyout-link';
      li.append(a);
      ul.append(li);
    });
    col.append(ul);
    inner.append(col);
  });
  flyout.append(inner);
  return flyout;
}

/**
 * Global navigation: brand, top-level items with flyouts, utility icons,
 * and a full-screen menu on small screens.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // local preview serves content under /content; published sites serve it at the root
  const fragment = await loadFragment('/content/nav') || await loadFragment('/nav');

  block.textContent = '';
  if (!fragment) return;
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  const [brandSection, listSection, toolsSection] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'globalnav';
  nav.setAttribute('aria-label', 'Global');

  const bar = document.createElement('div');
  bar.className = 'globalnav-bar';

  // brand
  const brand = document.createElement('div');
  brand.className = 'globalnav-brand';
  const brandLink = brandSection?.querySelector('a');
  if (brandLink) {
    brandLink.className = 'globalnav-brand-link';
    if (!brandLink.getAttribute('aria-label')) {
      const alt = brandLink.querySelector('img')?.alt;
      brandLink.setAttribute('aria-label', alt || brandLink.textContent.trim() || 'Home');
    }
    brand.append(brandLink);
  }

  // top-level items
  const list = document.createElement('ul');
  list.className = 'globalnav-list';
  const items = [...(listSection?.querySelectorAll(':scope .default-content-wrapper > ul > li') || [])]
    .map(readItem)
    .filter((item) => item.link);

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'globalnav-item';
    li.style.setProperty('--i', i + 1);
    item.link.className = 'globalnav-link';
    li.append(item.link);
    if (item.groups.length) {
      li.classList.add('has-flyout');
      const flyout = buildFlyout(item, i);
      const opener = document.createElement('button');
      opener.type = 'button';
      opener.className = 'globalnav-opener';
      opener.setAttribute('aria-expanded', 'false');
      opener.setAttribute('aria-controls', flyout.id);
      opener.setAttribute('aria-label', `${item.link.textContent.trim()} menu`);
      opener.append(chevron('down'));
      li.append(opener, flyout);
    }
    list.append(li);
  });

  // tools (search, bag)
  const tools = document.createElement('div');
  tools.className = 'globalnav-tools';
  toolsSection?.querySelectorAll('a').forEach((a) => {
    a.className = 'globalnav-tool';
    // `:name:` shorthand is only expanded by the publishing pipeline, not in raw fragments
    const shorthand = a.textContent.trim().match(/^:([\w-]+):$/);
    if (shorthand) {
      const icon = document.createElement('span');
      icon.className = `icon icon-${shorthand[1]}`;
      a.replaceChildren(icon);
      a.removeAttribute('title');
      decorateIcons(a);
    }
    if (!a.textContent.trim() && !a.getAttribute('aria-label')) {
      const name = a.querySelector('.icon')?.className.match(/icon-([\w-]+)/)?.[1] || a.pathname.replace(/\W/g, ' ').trim();
      a.setAttribute('aria-label', TOOL_LABELS[name] || name.charAt(0).toUpperCase() + name.slice(1));
    }
    tools.append(a);
  });

  const menuButton = document.createElement('button');
  menuButton.type = 'button';
  menuButton.className = 'globalnav-menutrigger';
  menuButton.setAttribute('aria-controls', 'nav');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Menu');
  menuButton.innerHTML = '<span></span><span></span>';
  tools.append(menuButton);

  const menu = document.createElement('div');
  menu.className = 'globalnav-menu';
  menu.append(list);

  bar.append(brand, menu, tools);
  nav.append(bar);

  const curtain = document.createElement('div');
  curtain.className = 'globalnav-curtain';

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper, curtain);

  // window/media listeners outlive the header when the page is re-rendered (e.g. DA preview);
  // tie them to one controller and abort the previous header's on each decorate
  teardown?.abort();
  const lifecycle = new AbortController();
  teardown = lifecycle;
  const { signal } = lifecycle;

  let openItem = null;
  let hoverItem = null;
  let openTimer;
  let closeTimer;

  function setOpen(li) {
    if (openItem && openItem !== li) {
      openItem.classList.remove('open');
      openItem.querySelector('.globalnav-opener').setAttribute('aria-expanded', 'false');
    }
    openItem = li;
    if (li) {
      li.classList.add('open');
      li.querySelector('.globalnav-opener').setAttribute('aria-expanded', 'true');
      nav.style.setProperty('--flyout-height', `${li.querySelector('.globalnav-flyout').scrollHeight}px`);
    }
    nav.classList.toggle('flyout-open', Boolean(li));
    document.body.classList.toggle('globalnav-flyout-open', Boolean(li) && isDesktop.matches);
  }

  function closeAll() {
    clearTimeout(openTimer);
    setOpen(null);
  }

  function closeSoon() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeAll, CLOSE_DELAY);
  }

  function setMenu(open) {
    nav.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close' : 'Menu');
    document.body.style.overflowY = open ? 'hidden' : '';
    if (!open) {
      nav.classList.remove('submenu-open');
      setOpen(null);
    }
  }

  // desktop: hover intent, delegated so there is one listener for all items
  list.addEventListener('mouseover', (e) => {
    if (!isDesktop.matches) return;
    const li = e.target.closest('.globalnav-item');
    if (!li || li === hoverItem) return;
    hoverItem = li;
    if (!li.classList.contains('has-flyout')) {
      closeSoon();
      return;
    }
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    const delay = nav.classList.contains('flyout-open') ? 0 : OPEN_DELAY;
    openTimer = setTimeout(() => setOpen(li), delay);
  });

  list.addEventListener('click', (e) => {
    const li = e.target.closest('.has-flyout');
    if (!li) return;
    if (e.target.closest('.globalnav-opener')) {
      if (!isDesktop.matches) return;
      const open = li === openItem;
      setOpen(open ? null : li);
      if (!open) li.querySelector('.globalnav-flyout-link')?.focus();
    } else if (e.target.closest('.globalnav-back')) {
      nav.classList.remove('submenu-open');
      setOpen(null);
      li.querySelector('.globalnav-link').focus({ preventScroll: true });
    } else if (e.target.closest('a.globalnav-link') && !isDesktop.matches) {
      // mobile: tapping an item with a flyout drills into its submenu
      e.preventDefault();
      openItem?.classList.remove('open');
      openItem = li;
      li.classList.add('open');
      nav.classList.add('submenu-open');
      li.querySelector('.globalnav-back').focus({ preventScroll: true });
    }
  });

  nav.addEventListener('mouseleave', () => {
    hoverItem = null;
    if (isDesktop.matches) closeSoon();
  });
  nav.addEventListener('mouseenter', () => clearTimeout(closeTimer));

  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) closeAll();
  });

  curtain.addEventListener('click', closeAll);

  menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('menu-open')));

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (nav.classList.contains('flyout-open')) {
      const opener = openItem?.querySelector('.globalnav-opener');
      closeAll();
      opener?.focus();
    } else if (nav.classList.contains('menu-open')) {
      setMenu(false);
      menuButton.focus();
    }
  }, { signal });

  isDesktop.addEventListener('change', () => setMenu(false), { signal });

  signal.addEventListener('abort', () => {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    document.body.classList.remove('globalnav-flyout-open');
    document.body.style.overflowY = '';
  });
}
