async function loadProjects() {
  const res = await fetch('/api/projects');
  const items = await res.json();
  const list = document.getElementById('list');
  list.innerHTML = items.map(i => {
    const start = i.start ? formatDate(i.start) : '';
    const end = i.monthly ? 'ежемесячно' : i.deadline ? formatDate(i.deadline) : '';
    const amount = typeof i.amount === 'number' ? formatAmount(i.amount) : '';
    return `<tr data-id="${i.id}"><td class="text-center"><button data-act="star" class="mr-1">${i.starred ? '★' : '☆'}</button><span class="underline text-blue-600 cursor-pointer">${i.name}</span></td><td class="text-center">${i.client||''}</td><td class="text-center">${i.type||''}</td><td class="text-center">${start}</td><td class="text-center">${end}</td><td class="text-center">${amount} ${i.currency||''}</td><td class="text-center">${i.status||''}</td><td class="actions flex justify-center gap-2"><button data-act="finish" class="btn btn-green px-2 py-1 text-sm">✔</button><button data-act="delete" class="btn btn-red px-2 py-1 text-sm">🗑️</button></td></tr>`;
  }).join('');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatAmount(num) {
  return num.toLocaleString('ru-RU');
}

function formatInputNumber(el) {
  el.addEventListener('input', () => {
    const val = el.value.replace(/\s+/g, '').replace(/\D/g, '');
    el.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  });
}

async function loadLists() {
  const [typesRes, clientsRes] = await Promise.all([
    fetch('/api/admin/types'),
    fetch('/api/admin/clients')
  ]);
  const types = await typesRes.json();
  const clients = await clientsRes.json();
  document.getElementById('typeSelect').innerHTML = types.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
  document.getElementById('clientSelect').innerHTML = clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

document.getElementById('projectForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form).entries());
  data.monthly = form.monthly.checked;
  data.starred = form.starred.checked;
  data.amount = Number(String(data.amount).replace(/\s+/g, '')) || 0;
  await fetch('/api/projects', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  form.reset();
  loadProjects();
});

document.getElementById('list').addEventListener('click', async e => {
  const row = e.target.closest('tr');
  if (!row) return;
  const id = row.dataset.id;
  if (e.target.dataset.act === 'finish') {
    await fetch(`/api/projects/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'Завершено'})});
    loadProjects();
    return;
  }
  if (e.target.dataset.act === 'star') {
    const starred = e.target.textContent === '☆';
    await fetch(`/api/projects/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({starred})});
    loadProjects();
    return;
  }
  if (e.target.dataset.act === 'delete') {
    await fetch(`/api/projects/${id}`, {method:'DELETE'});
    loadProjects();
    return;
  }
  if (e.target.tagName === 'SPAN' && e.target.classList.contains('underline')) {
    window.location = `/project.html?id=${id}`;
  }
});

loadProjects();
loadLists();
formatInputNumber(document.querySelector('#projectForm input[name=amount]'));
