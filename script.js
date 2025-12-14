document.addEventListener('DOMContentLoaded', () => {
  const sections = Array.from(document.querySelectorAll('.section'));
  const toggles = document.querySelectorAll('.toggle');
  const checkboxes = document.querySelectorAll('.section-check');
  const copyButtons = document.querySelectorAll('.copy-btn');
  const searchInput = document.getElementById('searchInput');
  const printBtn = document.getElementById('printBtn');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const tocLinks = document.querySelectorAll('#toc a');
  const storageKey = 'ng-router-guide-progress';
  const themeToggle = document.getElementById('themeToggle');
  const highlightBtn = document.getElementById('highlightBtn');
  const pathSelect = document.getElementById('pathSelect');
  const bookmarkList = document.getElementById('bookmarkList');
  const printSelectedBtn = document.getElementById('printSelectedBtn');

  const bookmarkKey = 'ng-router-guide-bookmarks';
  const notesKey = 'ng-router-guide-notes';
  const themeKey = 'ng-router-guide-theme';

  // Collapse all except first section
  sections.forEach((section, idx) => setCollapsed(section, idx !== 0));

  // Restore progress
  const saved = loadProgress();
  checkboxes.forEach(box => {
    const id = box.dataset.section;
    if (saved[id]) box.checked = true;
    box.addEventListener('change', () => {
      saved[id] = box.checked;
      saveProgress(saved);
      updateProgress();
    });
  });
  updateProgress();

  // Collapsible sections
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest('.section');
      const collapsed = section.classList.contains('collapsed');
      setCollapsed(section, !collapsed);
    });
  });

  // Copy buttons
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('pre').innerText;
      try {
        await navigator.clipboard.writeText(code);
        flash(btn, 'Copied!');
      } catch {
        flash(btn, 'Press Ctrl+C');
      }
    });
  });

  // Search filter
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();
    sections.forEach(section => {
      section.classList.remove('highlight');
      if (!term) {
        section.style.display = '';
        return;
      }
      const text = section.innerText.toLowerCase();
      const match = text.includes(term);
      section.style.display = match ? '' : 'none';
      if (match) {
        section.classList.add('highlight');
        setCollapsed(section, false);
      }
    });
  });

  // Smooth scroll + ensure target is visible
  tocLinks.forEach(link => {
    link.addEventListener('click', evt => {
      evt.preventDefault();
      // reset filters so the target is visible
      if (pathSelect) {
        pathSelect.value = 'all';
        sections.forEach(sec => sec.style.display = '');
      }
      if (searchInput) {
        searchInput.value = '';
        sections.forEach(sec => sec.classList.remove('highlight'));
      }
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        setCollapsed(target, false);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Print
  printBtn.addEventListener('click', () => window.print());
  printSelectedBtn.addEventListener('click', () => {
    const selected = document.querySelectorAll('.print-check:checked');
    const toShow = new Set(Array.from(selected).map(c => c.closest('.section')));
    sections.forEach(sec => {
      if (toShow.size === 0 || toShow.has(sec)) {
        sec.classList.remove('print-hide');
      } else {
        sec.classList.add('print-hide');
      }
    });
    window.print();
    sections.forEach(sec => sec.classList.remove('print-hide'));
  });

  // Theme
  const savedTheme = localStorage.getItem(themeKey);
  if (savedTheme === 'light') document.body.classList.add('light');
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem(themeKey, document.body.classList.contains('light') ? 'light' : 'dark');
  });

  // Highlight best practices
  highlightBtn.addEventListener('click', () => {
    document.querySelectorAll('.best-box, .bp-list').forEach(el => el.classList.toggle('highlight'));
  });

  // Learning path filter
  pathSelect.addEventListener('change', () => {
    const level = pathSelect.value;
    sections.forEach(sec => {
      if (level === 'all') {
        sec.style.display = '';
      } else {
        const secLevel = sec.dataset.level || 'all';
        sec.style.display = secLevel === level ? '' : 'none';
      }
    });
  });

  // Bookmarks
  const savedBookmarks = loadJSON(bookmarkKey, []);
  updateBookmarks(savedBookmarks);
  document.querySelectorAll('.bookmark').forEach(btn => {
    const sec = btn.closest('.section');
    const id = sec.id;
    if (savedBookmarks.includes(id)) btn.classList.add('active');
    btn.addEventListener('click', () => {
      const list = loadJSON(bookmarkKey, []);
      if (list.includes(id)) {
        const next = list.filter(x => x !== id);
        saveJSON(bookmarkKey, next);
        btn.classList.remove('active');
        updateBookmarks(next);
      } else {
        const next = [...list, id];
        saveJSON(bookmarkKey, next);
        btn.classList.add('active');
        updateBookmarks(next);
      }
    });
  });

  // Notes
  const savedNotes = loadJSON(notesKey, {});
  document.querySelectorAll('.notes-box textarea').forEach(area => {
    const key = area.dataset.notesFor;
    area.value = savedNotes[key] || '';
  });
  document.querySelectorAll('.save-note').forEach(btn => {
    const key = btn.dataset.notesFor;
    btn.addEventListener('click', () => {
      const area = document.querySelector(`textarea[data-notes-for="${key}"]`);
      const val = area.value;
      savedNotes[key] = val;
      saveJSON(notesKey, savedNotes);
      flash(btn, 'Saved');
    });
  });

  function setCollapsed(section, collapsed) {
    const body = section.querySelector('.section-body');
    if (collapsed) {
      section.classList.add('collapsed');
      body.style.display = 'none';
      const toggle = section.querySelector('.toggle');
      if (toggle) toggle.textContent = '►';
    } else {
      section.classList.remove('collapsed');
      body.style.display = '';
      const toggle = section.querySelector('.toggle');
      if (toggle) toggle.textContent = '▼';
    }
  }

  function flash(btn, text) {
    const original = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 900);
  }

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }
  function saveProgress(data) {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
  function updateProgress() {
    const total = checkboxes.length;
    const done = Array.from(checkboxes).filter(c => c.checked).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}% complete`;
  }

  function loadJSON(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  }
  function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function updateBookmarks(list) {
    bookmarkList.innerHTML = '';
    list.forEach(id => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = document.getElementById(id)?.dataset.title || id;
      li.appendChild(link);
      bookmarkList.appendChild(li);
    });
  }
});

