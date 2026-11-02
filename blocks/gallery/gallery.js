const AUTOPLAY_DELAY = 5000;

/**
 * Builds one slide from an authored row (image cell + caption cell).
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildSlide(row) {
  const cells = [...row.children];
  const media = cells.find((cell) => cell.querySelector('picture, img'));
  if (!media) return null;
  const caption = cells.find((cell) => cell !== media && cell.textContent.trim());

  const slide = document.createElement('li');
  slide.className = 'gallery-slide';
  media.className = 'gallery-media';
  slide.append(media);
  if (caption) {
    caption.className = 'gallery-caption';
    slide.append(caption);
  }
  return slide;
}

/**
 * Looping gallery with peeking neighbours, autoplay, dots and swipe.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const slides = [...block.children].map(buildSlide).filter(Boolean);
  block.textContent = '';
  if (!slides.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured gallery');

  const viewport = document.createElement('div');
  viewport.className = 'gallery-viewport';
  const track = document.createElement('ul');
  track.className = 'gallery-track';
  viewport.append(track);

  slides.forEach((slide, i) => {
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    slide.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
  });

  // clones on both ends make the loop seamless
  const loop = slides.length > 1;
  const items = [...slides];
  if (loop) {
    const head = slides[slides.length - 1].cloneNode(true);
    const tail = slides[0].cloneNode(true);
    [head, tail].forEach((clone) => {
      clone.classList.add('gallery-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.inert = true;
    });
    items.unshift(head);
    items.push(tail);
  }
  track.append(...items);

  const controls = document.createElement('div');
  controls.className = 'gallery-controls';
  const dots = document.createElement('div');
  dots.className = 'gallery-dots';
  const dotButtons = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    const title = slide.querySelector('.gallery-caption h3, .gallery-caption h2, .gallery-caption strong');
    dot.setAttribute('aria-label', `Show slide ${i + 1}${title ? `: ${title.textContent.trim()}` : ''}`);
    dots.append(dot);
    return dot;
  });
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gallery-toggle';
  controls.append(dots, toggle);

  block.append(viewport);
  if (loop) block.append(controls);

  let index = loop ? 1 : 0;
  let timer;
  let playing = loop && !reduceMotion;

  const realIndex = () => (loop ? (index - 1 + slides.length) % slides.length : index);

  function position(animate = true) {
    const target = items[index];
    const offset = target.offsetLeft - (viewport.clientWidth - target.offsetWidth) / 2;
    track.classList.toggle('no-transition', !animate || reduceMotion);
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    items.forEach((item, i) => {
      const active = i === index;
      item.classList.toggle('active', active);
      if (!item.classList.contains('gallery-clone')) {
        item.setAttribute('aria-hidden', String(!active));
        item.inert = !active;
      }
    });
    dotButtons.forEach((dot, i) => {
      dot.classList.toggle('active', i === realIndex());
      dot.setAttribute('aria-current', String(i === realIndex()));
    });
  }

  function updateToggle() {
    toggle.classList.toggle('paused', !playing);
    toggle.setAttribute('aria-label', playing ? 'Pause gallery' : 'Play gallery');
    block.classList.toggle('playing', playing);
  }

  function schedule() {
    clearTimeout(timer);
    if (playing) {
      // eslint-disable-next-line no-use-before-define
      timer = setTimeout(() => go(index + 1), AUTOPLAY_DELAY);
    }
  }

  function go(next) {
    if (!loop) return;
    index = Math.max(0, Math.min(next, items.length - 1));
    position(true);
    // restart the dot progress animation
    dotButtons.forEach((dot) => dot.classList.remove('progress'));
    // eslint-disable-next-line no-unused-expressions
    dots.offsetWidth;
    if (playing) dotButtons[realIndex()].classList.add('progress');
    schedule();
  }

  track.addEventListener('transitionend', (e) => {
    if (e.target !== track) return;
    if (index === 0) {
      index = slides.length;
      position(false);
    } else if (index === items.length - 1) {
      index = 1;
      position(false);
    }
  });

  dotButtons.forEach((dot, i) => dot.addEventListener('click', () => go(i + 1)));
  toggle.addEventListener('click', () => {
    playing = !playing;
    updateToggle();
    go(index);
  });

  // clicking a peeking neighbour brings it to the centre
  items.forEach((item, i) => item.addEventListener('click', (e) => {
    if (i === index) return;
    e.preventDefault();
    go(i);
  }));

  // swipe
  let startX = null;
  viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  viewport.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  });

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  });

  // only autoplay while visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (!playing) return;
      if (entry.isIntersecting) go(index);
      else clearTimeout(timer);
    }).observe(block);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else if (playing) schedule();
  });

  let resizeFrame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => position(false));
  });

  updateToggle();
  requestAnimationFrame(() => position(false));
  // images change slide widths as they load
  block.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', () => position(false), { once: true });
  });
}
