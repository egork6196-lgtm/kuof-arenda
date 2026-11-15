function typeHeroCopy() {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const navigation = performance.getEntriesByType('navigation')[0];
  if (motion.matches || navigation?.type === 'back_forward' || window.scrollY > 0 ||
      (window.location.hash && window.location.hash !== '#main')) {
    return;
  }

  const lines = document.querySelectorAll('[data-type-line]');
  const originals = [];
  let delay = 100;

  function revealAt(element) {
    element.classList.add('hero-type');
    element.style.setProperty('--type-delay', `${delay}ms`);
  }

  for (const line of lines) {
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.append(...Array.from(line.childNodes, node => node.cloneNode(true)));

    for (const node of Array.from(visual.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const characters = document.createDocumentFragment();
        for (const character of node.textContent) {
          const glyph = document.createElement('span');
          glyph.textContent = character;
          revealAt(glyph);
          characters.append(glyph);
          delay += 38;
        }
        node.replaceWith(characters);
      } else if (node.hasAttribute('data-type-tail')) {
        revealAt(node);
      }
    }

    const original = document.createElement('span');
    original.className = 'sr-only';
    original.append(...line.childNodes);
    line.append(original, visual);
    originals.push({ line, original });
    delay += 130;
  }

  window.setTimeout(() => {
    for (const { line, original } of originals) {
      line.replaceChildren(...original.childNodes);
    }
  }, delay);
}

typeHeroCopy();

const categorySelect = document.querySelector('[data-category-select]');

if (categorySelect) {
  const panels = Array.from(document.querySelectorAll('[data-category-panel]'));
  const categories = Array.from(categorySelect.querySelectorAll('input[name="category"]'));

  function showCategory(selected) {
    selected.checked = true;

    for (const panel of panels) {
      panel.hidden = panel.dataset.categoryPanel !== selected.value;
    }
  }

  function showCategoryFromHash() {
    const category = categories.find(input => `#${input.value}` === window.location.hash);

    if (category) {
      showCategory(category);
      document.getElementById(category.value)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  const initialCategory = categories.find(input => input.checked) ?? categories[0];

  if (initialCategory) {
    showCategory(initialCategory);
    categorySelect.hidden = false;
    showCategoryFromHash();

    categorySelect.addEventListener('change', event => {
      if (categories.includes(event.target)) {
        showCategory(event.target);
        window.history.replaceState(window.history.state, '', `#${event.target.value}`);
      }
    });

    window.addEventListener('hashchange', showCategoryFromHash);
  }
}

function isBackdropEvent(event, dialog) {
  if (event.target !== dialog) {
    return false;
  }

  const bounds = dialog.getBoundingClientRect();
  return event.clientX < bounds.left || event.clientX > bounds.right ||
    event.clientY < bounds.top || event.clientY > bounds.bottom;
}

const dialog = document.getElementById('listing-detail');

if (typeof dialog?.showModal === 'function') {
  const detailTitle = dialog.querySelector('[data-detail-title]');
  const detailImage = dialog.querySelector('[data-detail-image]');
  const detailPhoto = dialog.querySelector('[data-detail-photo]');
  let previousOpener;
  let pointerStartedOnBackdrop = false;

  for (const opener of document.querySelectorAll('[data-open-detail]')) {
    const card = opener.closest('.listing-card');
    const title = card.querySelector('h3');
    const image = card.querySelector('img');

    opener.addEventListener('click', () => {
      detailTitle.textContent = title.textContent;
      detailImage.alt = image.alt;
      detailImage.setAttribute('width', image.getAttribute('width'));
      detailImage.setAttribute('height', image.getAttribute('height'));
      detailImage.src = image.src;
      detailPhoto.href = image.src;
      previousOpener = opener;
      pointerStartedOnBackdrop = false;
      dialog.showModal();
    });
    opener.hidden = false;
  }

  for (const closer of dialog.querySelectorAll('[data-close-detail]')) {
    closer.addEventListener('click', () => dialog.close());
  }

  dialog.addEventListener('pointerdown', event => {
    pointerStartedOnBackdrop = isBackdropEvent(event, dialog);
  });

  dialog.addEventListener('click', event => {
    if (pointerStartedOnBackdrop && isBackdropEvent(event, dialog)) {
      dialog.close();
    }

    pointerStartedOnBackdrop = false;
  });

  dialog.addEventListener('close', () => {
    previousOpener?.focus({ preventScroll: true });
  });
}

const catalog = document.querySelector('.catalog');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (catalog && !reducedMotion.matches && 'IntersectionObserver' in window) {
  let revealingPanel;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.find(entry => entry.isIntersecting && !entry.target.hidden);
    if (!visible) {
      return;
    }

    observer.disconnect();
    catalog.classList.remove('is-awaiting-reveal');
    revealingPanel = visible.target;
    revealingPanel.classList.add('is-revealing');
  }, { rootMargin: '0px 0px -100px 0px' });

  function finishReveal() {
    observer.disconnect();
    catalog.classList.remove('is-awaiting-reveal');
    revealingPanel?.classList.remove('is-revealing');
    revealingPanel = null;
  }

  function finishIfPanelChanged() {
    if (revealingPanel?.hidden) {
      finishReveal();
    }
  }

  catalog.classList.add('is-awaiting-reveal');
  for (const panel of catalog.querySelectorAll('[data-category-panel]')) {
    observer.observe(panel);
  }

  categorySelect?.addEventListener('change', finishIfPanelChanged);
  window.addEventListener('hashchange', finishIfPanelChanged);
  reducedMotion.addEventListener('change', finishReveal, { once: true });

  catalog.addEventListener('focusin', event => {
    if (event.target.closest('.listing-card')) {
      finishReveal();
    }
  });

  catalog.addEventListener('animationend', event => {
    if (revealingPanel && event.animationName === 'listing-reveal' &&
        event.target === revealingPanel.lastElementChild) {
      finishReveal();
    }
  });
}
