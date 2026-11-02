import { loadFragment } from '../fragment/fragment.js';

// matches the breakpoint in footer.css
const isDesktop = window.matchMedia('(min-width: 834px)');

/**
 * Turns a list of "Title + links" items into directory columns that
 * collapse into accordions on small screens.
 * @param {Element} section
 */
function buildDirectory(section) {
  const directory = document.createElement('nav');
  directory.className = 'footer-directory';
  directory.setAttribute('aria-label', 'Site directory');

  const columns = section.querySelectorAll('.default-content-wrapper > ul > li');
  columns.forEach((li, i) => {
    const list = li.querySelector(':scope > ul');
    const titleNode = [...li.childNodes].find((n) => n !== list && n.textContent.trim());
    if (!list) return;

    const column = document.createElement('div');
    column.className = 'footer-column';

    const id = `footer-column-${i}`;
    const heading = document.createElement('h3');
    heading.className = 'footer-column-title';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = titleNode ? titleNode.textContent.trim() : '';
    heading.append(toggle);

    list.id = id;
    list.className = 'footer-column-list';

    column.append(heading, list);
    directory.append(column);
  });

  // one delegated listener for every column toggle
  directory.addEventListener('click', (e) => {
    const toggle = e.target.closest('.footer-column-title button');
    if (!toggle || isDesktop.matches) return;
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.closest('.footer-column').classList.toggle('open', open);
  });
  return directory;
}

/**
 * Footer: fine-print notes, a site directory and a legal row.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // local preview serves content under /content; published sites serve it at the root
  const fragment = await loadFragment('/content/footer') || await loadFragment('/footer');

  block.textContent = '';
  if (!fragment) return;

  const [notesSection, directorySection, legalSection] = fragment.querySelectorAll(':scope > .section');
  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  if (notesSection) {
    const notes = document.createElement('div');
    notes.className = 'footer-notes';
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
