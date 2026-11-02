/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the global navigation (header nav.site-nav) -> nav fragment.
 * Output is three sections: brand | menu list | tools.
 * Menu items carry their flyout as a nested list of "Group title" items, each with a link list.
 */
const ICONS = { 'action-search': 'search', 'action-bag': 'cart' };

export default function parse(element, { document }) {
  const frag = document.createElement('div');

  // brand
  const logo = element.querySelector('.site-logo');
  if (logo) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = logo.getAttribute('href') || '/';
    const source = logo.querySelector('img');
    if (source) {
      const img = document.createElement('img');
      img.src = source.getAttribute('src');
      img.alt = source.getAttribute('alt') || '';
      a.append(img);
    } else {
      a.textContent = logo.textContent.trim();
    }
    p.append(a);
    frag.append(p, document.createElement('hr'));
  }

  // menu
  const menu = document.createElement('ul');
  element.querySelectorAll('.site-menu > li').forEach((item) => {
    const top = item.querySelector(':scope > a');
    if (!top) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = top.getAttribute('href');
    a.textContent = top.textContent.trim();
    li.append(a);

    const groups = item.querySelectorAll('.flyout-group');
    if (groups.length) {
      const groupList = document.createElement('ul');
      groups.forEach((group) => {
        const groupLi = document.createElement('li');
        const title = group.querySelector('h2, h3, h4');
        groupLi.append(document.createTextNode(title ? title.textContent.trim() : ''));
        const links = document.createElement('ul');
        group.querySelectorAll('li a').forEach((link) => {
          const linkLi = document.createElement('li');
          const linkA = document.createElement('a');
          linkA.href = link.getAttribute('href');
          linkA.textContent = link.textContent.trim();
          linkLi.append(linkA);
          links.append(linkLi);
        });
        groupLi.append(links);
        groupList.append(groupLi);
      });
      li.append(groupList);
    }
    menu.append(li);
  });
  frag.append(menu, document.createElement('hr'));

  // tools
  element.querySelectorAll('.site-actions a').forEach((action) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = action.getAttribute('href');
    const iconName = Object.keys(ICONS).find((cls) => action.classList.contains(cls));
    a.textContent = iconName ? `:${ICONS[iconName]}:` : action.textContent.trim();
    p.append(a);
    frag.append(p);
  });

  element.replaceWith(...frag.childNodes);
}
