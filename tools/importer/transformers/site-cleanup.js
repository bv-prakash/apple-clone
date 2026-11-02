/* eslint-disable */
/* global WebImporter */

/**
 * Removes non-content markup before parsing, and unwraps the page landmarks
 * after parsing so only authored content remains.
 */
export default function transform(hookName, element) {
  if (hookName === 'beforeTransform') {
    WebImporter.DOMUtils.remove(element, ['script', 'style', 'noscript', 'link', 'meta']);
  }
  if (hookName === 'afterTransform') {
    element.querySelectorAll('main, header, footer').forEach((landmark) => {
      landmark.replaceWith(...landmark.childNodes);
    });
  }
}
