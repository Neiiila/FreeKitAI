// Runs before first paint to avoid a theme flash. Light is the default; a saved choice wins.
(function () {
  var theme = 'light';
  try {
    var saved = localStorage.getItem('fk-theme');
    if (saved === 'dark' || saved === 'light') theme = saved;
  } catch (e) { /* storage unavailable: keep default */ }
  document.documentElement.setAttribute('data-theme', theme);
})();
