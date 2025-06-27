function formatAmount(num) {
  return Number(num || 0).toLocaleString('ru-RU');
}

function formatInputNumber(el) {
  el.addEventListener('input', () => {
    const val = el.value.replace(/\s+/g, '').replace(/\D/g, '');
    el.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  });
}

async function loadSettings() {
  const s = await apiFetch('/api/admin/settings');
  const form = document.getElementById('settingsForm');
  form.salaryRate.value = formatAmount(s.salaryRate);
  form.profitPercent.value = s.profitPercent;
  form.taxPercent.value = s.taxPercent;
}

document.getElementById('settingsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.salaryRate = Number(String(data.salaryRate).replace(/\s+/g, '')) || 0;
  await apiFetch('/api/admin/settings', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
});

async function loadTypes() {
  const types = await apiFetch('/api/admin/types');
  document.getElementById('types').innerHTML = types.map(t => `<li data-id="${t.id}" class="list-item flex items-center justify-between gap-2">${t.name}<button data-act="delete" class="text-red-600 hover:text-red-800 px-2">✖</button></li>`).join('');
}

document.getElementById('typeForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/types', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  loadTypes();
});

document.getElementById('types').addEventListener('click', async e => {
  if (e.target.dataset.act === 'delete') {
    const id = e.target.parentElement.dataset.id;
    await apiFetch(`/api/admin/types?id=${id}`, {method:'DELETE'});
    loadTypes();
  }
});

async function loadCats() {
  const cats = await apiFetch('/api/admin/categories');
  document.getElementById('cats').innerHTML = cats.map(c => `<li data-id="${c.id}" class="list-item flex items-center justify-between gap-2">${c.name}<button data-act="delete" class="text-red-600 hover:text-red-800 px-2">✖</button></li>`).join('');
}

document.getElementById('catForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/categories', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  loadCats();
});

document.getElementById('cats').addEventListener('click', async e => {
  if (e.target.dataset.act === 'delete') {
    const id = e.target.parentElement.dataset.id;
    await apiFetch(`/api/admin/categories?id=${id}`, {method:'DELETE'});
    loadCats();
  }
});

async function loadClients() {
  const clients = await apiFetch('/api/admin/clients');
  document.getElementById('clients').innerHTML = clients.map(c => `<li data-id="${c.id}" class="list-item flex items-center justify-between gap-2">${c.name}<button data-act="delete" class="text-red-600 hover:text-red-800 px-2">✖</button></li>`).join('');
}

document.getElementById('clientForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  await apiFetch('/api/admin/clients', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  loadClients();
});

document.getElementById('clients')?.addEventListener('click', async e => {
  if (e.target.dataset.act === 'delete') {
    const id = e.target.parentElement.dataset.id;
    await apiFetch(`/api/admin/clients?id=${id}`, {method:'DELETE'});
    loadClients();
  }
});

loadSettings();
loadTypes();
loadCats();
loadClients();
formatInputNumber(document.querySelector('#settingsForm input[name=salaryRate]'));
