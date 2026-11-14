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

for (const opener of document.querySelectorAll('[data-open-detail]')) {
  const dialog = document.getElementById(opener.dataset.openDetail);

  if (typeof dialog?.showModal !== 'function') {
    continue;
  }

  let pointerStartedOnBackdrop = false;

  opener.addEventListener('click', () => {
    pointerStartedOnBackdrop = false;
    dialog.showModal();
  });

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
    opener.focus({ preventScroll: true });
  });

  opener.hidden = false;
}
