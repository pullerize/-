function formatAmount(num) {
  return Number(num || 0).toLocaleString('ru-RU');
}

async function load() {
  const res = await fetch('/api/finances');
  let items = await res.json();
  const filter = document.getElementById('timeFilter').value;
  const now = new Date();
  items = items.filter(i => {
    const d = i.start ? new Date(i.start) : null;
    if (!d) return true;
    if (filter === 'week') {
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }
    if (filter === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (filter === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const list = document.getElementById('list');
  list.innerHTML = items.map(i =>
    `<tr><td class="text-center">${i.name}</td><td class="text-center">${formatAmount(i.net)}</td><td class="text-center">${formatAmount(i.myPart)}</td></tr>`
  ).join('');

  // build monthly income graph
  const monthly = {};
  for (const i of items) {
    const month = i.start ? new Date(i.start).toLocaleDateString('ru-RU', {month:'short'}) : 'unknown';
    if (!monthly[month]) monthly[month] = {amount:0,tax:0,expenses:0,net:0,myPart:0};
    monthly[month].amount += i.amount || 0;
    monthly[month].tax += i.tax || 0;
    monthly[month].expenses += i.expenses || 0;
    monthly[month].net += i.net || 0;
    monthly[month].myPart += i.myPart || 0;
  }
  const graph = document.getElementById('graph');
  const rows = Object.entries(monthly).sort().map(([m,v]) =>
    `<tr><td class="p-2 text-center">${m}</td><td class="p-2 text-center">${formatAmount(v.amount)}</td><td class="p-2 text-center">${formatAmount(v.tax)}</td><td class="p-2 text-center">${formatAmount(v.expenses)}</td><td class="p-2 text-center">${formatAmount(v.net)}</td><td class="p-2 text-center">${formatAmount(v.myPart)}</td></tr>`
  ).join('');
  graph.innerHTML = `<table class="table border border-gray-300"><thead class="bg-gray-200 dark:bg-gray-700 sticky top-0"><tr><th class="p-2">Месяц</th><th class="p-2">Сумма</th><th class="p-2">Налоги</th><th class="p-2">Расходы</th><th class="p-2">Чистая прибыль</th><th class="p-2">Моя доля</th></tr></thead><tbody>${rows}</tbody></table>`;
}

document.getElementById('timeFilter').addEventListener('change', load);

load();
