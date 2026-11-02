const AUTOPLAY_DELAY = 5000;

/**
 * Marks a second picture in a media cell as the small-screen version.
 * @param {Element} media
 */
function decorateMedia(media) {
  media.className = 'gallery-media';
  // pictures authored side by side arrive wrapped in a paragraph, so unwrap them
  const pictures = media.querySelectorAll('picture');
  media.replaceChildren(...(pictures.length ? pictures : media.childNodes));
  if (pictures.length > 1) {
    media.classList.add('has-small');
    pictures[1].classList.add('gallery-media-small');
  }
  media.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
}

/**
 * Builds one slide from an authored row (image cell + caption cell).
 * @param {Element} row
 * @param {number} index
 * @param {number} total
 * @returns {HTMLLIElement}
 */
function buildSlide(row, index, total) {
  const cells = [...row.children];
  const media = cells.find((cell) => cell.querySelector('picture, img'));
  const caption = cells.find((cell) => cell !== media && cell.textContent.trim());

  const slide = document.createElement('li');
  slide.className = 'gallery-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${index + 1} of ${total}`);
  decorateMedia(media);
  slide.append(media);
  if (caption) {
    caption.className = 'gallery-caption';
    // the artwork carries the title, so the heading is kept for assistive tech only
    caption.querySelector('h2, h3, h4')?.classList.add('gallery-caption-title');
    slide.append(caption);
  }
  return slide;
}

function cloneSlide(slide) {
  const clone = slide.cloneNode(true);
  clone.classList.add('gallery-clone');
  clone.setAttribute('aria-hidden', 'true');
  clone.inert = true;
  return clone;
}

/**
 * The full-size gallery before this one in the same section, if any.
 * @param {Element} block
 * @returns {Element|undefined}
 */
function findLead(block) {
  const wrappers = [...block.closest('.section').querySelectorAll('.gallery-wrapper')];
  const own = block.closest('.gallery-wrapper');
  return wrappers
    .slice(0, wrappers.indexOf(own))
    .reverse()
    .map((wrapper) => wrapper.querySelector('.gallery:not(.compact)'))
    .find(Boolean);
}

/**
 * Looping gallery with peeking neighbours, autoplay, dots and swipe.
 * A `compact` gallery placed after a full-size one in the same section follows
 * its slide changes and takes over its controls, so both share one set of dots.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const titleRow = rows.find((row) => !row.querySelector('picture, img') && row.querySelector('h1, h2, h3'));
  const slideRows = rows.filter((row) => row !== titleRow && row.querySelector('picture, img'));
  const slides = slideRows.map((row, i) => buildSlide(row, i, slideRows.length));
  const compact = block.classList.contains('compact');
  block.textContent = '';

  if (titleRow) {
    const title = titleRow.querySelector('h1, h2, h3');
    title.classList.add('gallery-title');
    block.append(title);
  }
  if (!slides.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', block.querySelector('.gallery-title')?.textContent.trim() || 'Featured gallery');

  const viewport = document.createElement('div');
  viewport.className = 'gallery-viewport';
  const track = document.createElement('ul');
  track.className = 'gallery-track';
  viewport.append(track);
  block.append(viewport);

  // a single slide needs no loop, controls or timers
  if (slides.length === 1) {
    slides[0].classList.add('active');
    track.append(slides[0]);
    return;
  }

  // clones on both ends make the loop seamless
  const items = [cloneSlide(slides[slides.length - 1]), ...slides, cloneSlide(slides[0])];
  track.append(...items);

  let index = 1;
  let current = -1;
  const lifecycle = new AbortController();
  const { signal } = lifecycle;
  const realIndex = () => (index - 1 + slides.length) % slides.length;

  function position(animate) {
    const target = items[index];
    const offset = target.offsetLeft - (viewport.clientWidth - target.offsetWidth) / 2;
    track.classList.toggle('no-transition', !animate || reduceMotion);
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    // only touch the slides whose state actually changed
    const prev = track.querySelector('.gallery-slide.active');
    if (prev !== target) {
      prev?.classList.remove('active');
      target.classList.add('active');
      [prev, target].forEach((item) => {
        if (!item || item.classList.contains('gallery-clone')) return;
        const active = item === target;
        item.setAttribute('aria-hidden', String(!active));
        item.inert = !active;
      });
    }
  }

  // jump from a clone back to its real slide once the slide-in finishes
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track) return;
    if (index === 0 || index === items.length - 1) {
      index = index === 0 ? slides.length : 1;
      position(false);
    }
  }, { signal });

  let frame;
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => position(false));
  });
  resize.observe(viewport);
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
  });

  /* compact: mirror the lead gallery */
  if (compact) {
    const lead = findLead(block);
    position(false);
    if (!lead) return;
    lead.addEventListener('gallery:change', (e) => {
      if (!block.isConnected) {
        lifecycle.abort();
        return;
      }
      const { step } = e.detail;
      index = step
        ? Math.max(0, Math.min(index + step, items.length - 1))
        : (e.detail.index % slides.length) + 1;
      position(true);
    }, { signal });
    const controls = lead.querySelector('.gallery-controls');
    if (controls) block.append(controls);
    return;
  }

  /* full size: autoplay, dots, play/pause, swipe */
  const controls = document.createElement('div');
  controls.className = 'gallery-controls';
  const dots = document.createElement('div');
  dots.className = 'gallery-dots';
  const dotButtons = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.dataset.index = i + 1;
    const title = slide.querySelector('.gallery-caption-title');
    dot.setAttribute('aria-label', `Show slide ${i + 1}${title ? `: ${title.textContent.trim()}` : ''}`);
    return dot;
  });
  dots.append(...dotButtons);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gallery-toggle';
  controls.append(dots, toggle);
  block.append(controls);

  let timer;
  let playing = !reduceMotion;
  let visible = false;

  function syncDots() {
    const next = realIndex();
    if (next === current) return;
    if (current >= 0) {
      dotButtons[current].classList.remove('active', 'progress');
      dotButtons[current].removeAttribute('aria-current');
    }
    dotButtons[next].classList.add('active');
    dotButtons[next].setAttribute('aria-current', 'true');
    current = next;
  }

  function stop() {
    clearTimeout(timer);
    timer = undefined;
  }

  function schedule() {
    stop();
    if (!block.isConnected) {
      lifecycle.abort();
      return;
    }
    if (!playing || !visible || document.hidden) return;
    // eslint-disable-next-line no-use-before-define
    timer = setTimeout(() => go(index + 1), AUTOPLAY_DELAY);
  }

  function restartProgress() {
    const dot = dotButtons[current];
    dot.classList.remove('progress');
    if (!playing) return;
    // re-adding the class on the next frame restarts the CSS animation without a forced reflow
    requestAnimationFrame(() => dot.classList.add('progress'));
  }

  function go(next) {
    const step = next - index;
    index = Math.max(0, Math.min(next, items.length - 1));
    position(true);
    syncDots();
    restartProgress();
    schedule();
    // followers mirror single steps so they loop the same way; jumps go straight to the slide
    block.dispatchEvent(new CustomEvent('gallery:change', {
      detail: Math.abs(step) === 1 ? { step } : { index: realIndex() },
    }));
  }

  function updateToggle() {
    toggle.classList.toggle('paused', !playing);
    toggle.setAttribute('aria-label', playing ? 'Pause gallery' : 'Play gallery');
    block.classList.toggle('playing', playing);
  }

  // listen on the controls so they keep working after a compact gallery adopts them
  dots.addEventListener('click', (e) => {
    const dot = e.target.closest('.gallery-dot');
    if (dot) go(Number(dot.dataset.index));
  }, { signal });

  toggle.addEventListener('click', () => {
    playing = !playing;
    updateToggle();
    restartProgress();
    schedule();
  }, { signal });

  // clicking a peeking neighbour brings it to the centre
  track.addEventListener('click', (e) => {
    const i = items.indexOf(e.target.closest('.gallery-slide'));
    if (i < 0 || i === index) return;
    e.preventDefault();
    go(i);
  }, { signal });

  // swipe
  let startX = null;
  viewport.addEventListener('pointerdown', (e) => { startX = e.clientX; }, { signal });
  viewport.addEventListener('pointercancel', () => { startX = null; }, { signal });
  viewport.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  }, { signal });

  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(index + 1);
    if (e.key === 'ArrowLeft') go(index - 1);
  }, { signal });

  document.addEventListener('visibilitychange', schedule, { signal });

  // only autoplay while on screen
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  visibility.observe(block);

  signal.addEventListener('abort', () => {
    stop();
    visibility.disconnect();
  });

  updateToggle();
  position(false);
  syncDots();
  restartProgress();
}
