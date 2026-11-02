/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the global footer (footer.site-footer) -> footer fragment.
 * Output is three sections: fine-print notes | directory list | legal row.
 */
function copyInline(source, document) {
  const p = document.createElement('p');
  source.childNodes.forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'A') {
      const a = document.createElement('a');
      a.href = node.getAttribute('href');
      a.textContent = node.textContent.trim();
      p.append(a);
    } else {
      p.append(document.createTextNode(node.textContent));
    }
  });
  return p;
}

function copyLinkList(source, document) {
  const ul = document.createElement('ul');
  source.querySelectorAll(':scope > li').forEach((item) => {
    const link = item.querySelector('a');
    if (!link) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    li.append(a);
    ul.append(li);
  });
  return ul;
}

export default function parse(element, { document }) {
  const frag = document.createElement('div');

  element.querySelectorAll('.footer-notes > p').forEach((p) => frag.append(copyInline(p, document)));
  frag.append(document.createElement('hr'));

  const directory = document.createElement('ul');
  element.querySelectorAll('.footer-directory .footer-col').forEach((col) => {
    const title = col.querySelector('h2, h3, h4');
    const list = col.querySelector('ul');
    if (!list) return;
    const li = document.createElement('li');
    li.append(document.createTextNode(title ? title.textContent.trim() : ''));
    li.append(copyLinkList(list, document));
    directory.append(li);
  });
  frag.append(directory, document.createElement('hr'));

  const legal = element.querySelector('.footer-legal');
  if (legal) {
    [...legal.children].forEach((child) => {
      if (child.tagName === 'UL') frag.append(copyLinkList(child, document));
      else if (child.tagName === 'P') frag.append(copyInline(child, document));
    });
  }

  element.replaceWith(...frag.childNodes);
}
