(function(){
  const btn = document.getElementById('toggleTheme');
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.classList.add('dark');
    if (btn) btn.textContent = 'Светлая тема';
  }
  if (btn) {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      btn.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    });
  }
})();
