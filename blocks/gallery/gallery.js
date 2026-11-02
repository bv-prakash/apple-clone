const AUTOPLAY_DELAY = 5000;

/**
 * Builds one slide from an authored row (image cell + caption cell).
 * @param {Element} row
 * @returns {HTMLLIElement|null}
 */
function buildSlide(row, index, total) {
  const cells = [...row.children];
  const media = cells.find((cell) => cell.querySelector('picture, img'));
  if (!media) return null;
  const caption = cells.find((cell) => cell !== media && cell.textContent.trim());

  const slide = document.createElement('li');
  slide.className = 'gallery-slide';
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${index + 1} of ${total}`);
  media.className = 'gallery-media';
  media.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
  slide.append(media);
  if (caption) {
    caption.className = 'gallery-caption';
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
 * Looping gallery with peeking neighbours, autoplay, dots and swipe.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const slides = rows
    .map((row, i) => buildSlide(row, i, rows.length))
    .filter(Boolean);
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

  const controls = document.createElement('div');
  controls.className = 'gallery-controls';
  const dots = document.createElement('div');
  dots.className = 'gallery-dots';
  const dotButtons = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.dataset.index = i + 1;
    const title = slide.querySelector('.gallery-caption :is(h2, h3, strong)');
    dot.setAttribute('aria-label', `Show slide ${i + 1}${title ? `: ${title.textContent.trim()}` : ''}`);
    return dot;
  });
  dots.append(...dotButtons);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gallery-toggle';
  controls.append(dots, toggle);
  block.append(controls);

  let index = 1;
  let timer;
  let playing = !reduceMotion;
  let visible = false;
  let current = -1;

  // every listener and observer hangs off this, so teardown is one call
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

    const next = realIndex();
    if (next !== current) {
      if (current >= 0) {
        dotButtons[current].classList.remove('active', 'progress');
        dotButtons[current].removeAttribute('aria-current');
      }
      dotButtons[next].classList.add('active');
      dotButtons[next].setAttribute('aria-current', 'true');
      current = next;
    }
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
    index = Math.max(0, Math.min(next, items.length - 1));
    position(true);
    restartProgress();
    schedule();
  }

  function updateToggle() {
    toggle.classList.toggle('paused', !playing);
    toggle.setAttribute('aria-label', playing ? 'Pause gallery' : 'Play gallery');
    block.classList.toggle('playing', playing);
  }

  // jump from a clone back to its real slide once the slide-in finishes
  track.addEventListener('transitionend', (e) => {
    if (e.target !== track) return;
    if (index === 0 || index === items.length - 1) {
      index = index === 0 ? slides.length : 1;
      position(false);
    }
  }, { signal });

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
    const item = e.target.closest('.gallery-slide');
    const i = items.indexOf(item);
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

  // re-centre when the layout width changes (replaces a window resize listener)
  let frame;
  const resize = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => position(false));
  });
  resize.observe(viewport);

  signal.addEventListener('abort', () => {
    stop();
    cancelAnimationFrame(frame);
    visibility.disconnect();
    resize.disconnect();
  });

  updateToggle();
  position(false);
  restartProgress();
}
