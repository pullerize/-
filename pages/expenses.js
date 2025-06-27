function formatAmount(num) {
  return Number(num || 0).toLocaleString('ru-RU');
}

function formatInputNumber(el) {
  el.addEventListener('input', () => {
    const val = el.value.replace(/\s+/g, '').replace(/\D/g, '');
    el.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  });
}

async function load() {
  const [expensesRes, projectsRes] = await Promise.all([
    fetch('/api/expenses'),
    fetch('/api/projects')
  ]);
  const items = await expensesRes.json();
  const projects = await projectsRes.json();
  const pMap = Object.fromEntries(projects.map(p => [p.id, p]));
  const list = document.getElementById('list');
  list.innerHTML = items.map(i => {
    const project = pMap[i.projectId] || {};
    const amount = formatAmount(i.amount);
    return `<tr data-id="${i.id}"><td class="text-center">${project.name||''}</td><td class="text-center">${i.category||''}</td><td class="text-center">${amount} ${i.currency||''}</td><td class="flex justify-center"><button data-act="delete" class="btn btn-red px-2 py-1 text-sm">🗑️</button></td></tr>`;
  }).join('');
}

async function loadLists() {
  const [projectsRes, catsRes] = await Promise.all([
    fetch('/api/projects'),
    fetch('/api/admin/categories')
  ]);
  const projects = await projectsRes.json();
  const cats = await catsRes.json();
  document.getElementById('expenseProject').innerHTML = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  document.getElementById('catList').innerHTML = cats.map(c => `<option value="${c.name}">`).join('');
}

document.getElementById('expenseForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  const projectId = Number(data.projectId);
  const projects = await fetch('/api/projects').then(r=>r.json());
  const proj = projects.find(p => p.id === projectId);
  data.date = proj?.deadline || proj?.start;
  data.amount = Number(String(data.amount).replace(/\s+/g, '')) || 0;
  await fetch('/api/expenses', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  form.reset();
  load();
});

document.getElementById('list').addEventListener('click', async e => {
  const row = e.target.closest('tr');
  if (!row) return;
  const id = row.dataset.id;
  if (e.target.dataset.act === 'delete') {
    await fetch(`/api/expenses/${id}`, {method:'DELETE'});
    load();
  }
});

load();
loadLists();
formatInputNumber(document.querySelector('#expenseForm input[name=amount]'));
