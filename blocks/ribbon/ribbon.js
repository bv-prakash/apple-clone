/**
 * Ribbon: a one-line message strip with an optional call-to-action link.
 * The last link in the block becomes the call to action; footnote markers stay inline.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'ribbon-content';
  [...block.querySelectorAll(':scope > div > div')].forEach((cell) => {
    content.append(...cell.childNodes);
  });
  block.replaceChildren(content);

  const links = [...content.querySelectorAll('a[href]')].filter((a) => !a.closest('sup'));
  const cta = links[links.length - 1];
  if (cta) {
    cta.className = 'ribbon-link';
    cta.removeAttribute('title');
    // keep the call to action on the same line as the message where it fits
    cta.before(' ');
  }
}
