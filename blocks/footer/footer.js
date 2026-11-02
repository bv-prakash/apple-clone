import { loadSiteFragment } from '../fragment/fragment.js';

// matches the breakpoint in footer.css
const isDesktop = window.matchMedia('(min-width: 834px)');

/**
 * Builds one "Title + links" group that collapses into an accordion on small screens.
 * @param {HTMLLIElement} li
 * @param {string} id
 * @returns {HTMLDivElement|null}
 */
function buildGroup(li, id) {
  const list = li.querySelector(':scope > ul');
  if (!list) return null;
  const titleNode = [...li.childNodes].find((n) => n !== list && n.textContent.trim());

  const group = document.createElement('div');
  group.className = 'footer-group';
  const heading = document.createElement('h3');
  heading.className = 'footer-group-title';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = titleNode ? titleNode.textContent.trim() : '';
  heading.append(toggle);

  list.id = id;
  list.className = 'footer-group-list';
  group.append(heading, list);
  return group;
}

/**
 * Builds the site directory. Each list in the section is one column and each of its
 * items a group of links, so a column can stack several groups. A section with a
 * single list gets one column per item.
 * @param {Element} section
 */
function buildDirectory(section) {
  const directory = document.createElement('nav');
  directory.className = 'footer-directory';
  directory.setAttribute('aria-label', 'Site directory');

  const lists = [...section.querySelectorAll('.default-content-wrapper > ul')];
  const columns = lists.length > 1
    ? lists.map((ul) => [...ul.children])
    : [...(lists[0]?.children || [])].map((li) => [li]);

  let count = 0;
  columns.forEach((items) => {
    const column = document.createElement('div');
    column.className = 'footer-column';
    items.forEach((li) => {
      const group = buildGroup(li, `footer-group-${count}`);
      count += 1;
      if (group) column.append(group);
    });
    if (column.children.length) directory.append(column);
  });

  // one delegated listener for every group toggle
  directory.addEventListener('click', (e) => {
    const toggle = e.target.closest('.footer-group-title button');
    if (!toggle || isDesktop.matches) return;
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.closest('.footer-group').classList.toggle('open', open);
  });
  return directory;
}

/**
 * Footer: footnotes and fine print, a site directory and a legal row.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await loadSiteFragment('footer');

  block.textContent = '';
  if (!fragment) return;

  const [notesSection, directorySection, legalSection] = fragment.querySelectorAll(':scope > .section');
  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  if (notesSection) {
    const notes = document.createElement('div');
    notes.className = 'footer-notes';
    // footnote markers on the page link here
    notes.id = 'footnotes';
    notes.append(...notesSection.querySelector('.default-content-wrapper')?.childNodes || []);
    inner.append(notes);
  }

  if (directorySection) inner.append(buildDirectory(directorySection));

  if (legalSection) {
    const legal = document.createElement('div');
    legal.className = 'footer-legal';
    legal.append(...legalSection.querySelector('.default-content-wrapper')?.childNodes || []);
    legal.querySelector('ul')?.classList.add('footer-legal-links');
    inner.append(legal);
  }

  block.append(inner);
}
