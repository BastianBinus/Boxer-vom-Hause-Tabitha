(function () {
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    document.documentElement.classList.toggle('dark', dark);
  }

  // Apply immediately from localStorage to prevent FOUC
  var saved = localStorage.getItem('bvt_theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (!saved && prefersDark));

  function closeNav() {
    var nav = document.getElementById('site-nav');
    var toggle = document.getElementById('nav-toggle');
    if (nav) nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', function (e) {
    // Theme toggle
    if (e.target.closest('#theme-toggle')) {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      applyTheme(!isDark);
      localStorage.setItem('bvt_theme', !isDark ? 'dark' : 'light');
      return;
    }

    // Hamburger nav toggle
    if (e.target.closest('#nav-toggle')) {
      var nav = document.getElementById('site-nav');
      var toggle = document.getElementById('nav-toggle');
      if (!nav) return;
      var isOpen = nav.classList.toggle('is-open');
      if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
      return;
    }

    // Close nav on outside click or nav link click
    if (!e.target.closest('.site-header') || e.target.closest('.nav-link')) {
      closeNav();
    }
  });
})();
