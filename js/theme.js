(function () {
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    document.documentElement.classList.toggle('dark', dark);
  }

  // Apply immediately from localStorage to prevent FOUC
  var saved = localStorage.getItem('bvt_theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved === 'dark' || (!saved && prefersDark));

  // Event delegation — button is injected later by partials.js
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#theme-toggle')) return;
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
    localStorage.setItem('bvt_theme', !isDark ? 'dark' : 'light');
  });
})();
