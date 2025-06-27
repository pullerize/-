const params = new URLSearchParams(location.search);
const id = Number(params.get('id'));
let editingTaskId = null;

function formatAmount(num) {
  return Number(num || 0).toLocaleString('ru-RU');
}

function formatInputNumber(el) {
  el.addEventListener('input', () => {
    const val = el.value.replace(/\s+/g, '').replace(/\D/g, '');
    el.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  });
}

async function loadLists(p) {
  const [clientsRes, typesRes] = await Promise.all([
    fetch('/api/admin/clients'),
    fetch('/api/admin/types')
  ]);
  const clients = await clientsRes.json();
  const types = await typesRes.json();
  const clientSel = document.getElementById('clientSelect');
  const typeSel = document.getElementById('typeSelect');
  if (clientSel) clientSel.innerHTML = clients.map(c => `<option value="${c.name}" ${p.client===c.name?'selected':''}>${c.name}</option>`).join('');
  if (typeSel) typeSel.innerHTML = types.map(t => `<option value="${t.name}" ${p.type===t.name?'selected':''}>${t.name}</option>`).join('');
}

async function loadProject() {
  const res = await fetch(`/api/projects/${id}`);
  const p = await res.json();
  document.getElementById('title').textContent = p.name;
  const timerEl = document.getElementById('projectTimer');
  timerEl.dataset.deadline = p.deadline || '';
  const form = document.getElementById('projectForm');
  form.innerHTML = `
    <input name="name" value="${p.name}" class="border rounded-xl p-2 flex-grow" />
    <select name="client" class="border rounded-xl p-2 flex-grow" id="clientSelect"></select>
    <select name="type" class="border rounded-xl p-2 flex-grow" id="typeSelect"></select>
    <input name="deadline" type="date" value="${p.deadline||''}" class="border rounded-xl p-2" />
    <label class="flex items-center gap-1 text-sm"><input type="checkbox" name="monthly" ${p.monthly?'checked':''}/> ежемесячно</label>
    <input name="amount" type="text" value="${formatAmount(p.amount||0)}" class="border rounded-xl p-2 w-32" />
    <select name="currency" class="border rounded-xl p-2">
      <option value="USD" ${p.currency==='USD'?'selected':''}>$</option>
      <option value="SUM" ${p.currency==='SUM'?'selected':''}>сум</option>
    </select>
    <input name="status" value="${p.status||''}" class="border rounded-xl p-2 w-32" />
    <label class="flex items-center gap-1 text-sm"><input type="checkbox" name="starred" ${p.starred?'checked':''}/> важный</label>
    <button class="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-all">Сохранить</button>
  `;
  formatInputNumber(form.querySelector('input[name="amount"]'));
  await loadLists(p);
  updateTimers();
}

async function saveProject(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.monthly = e.target.monthly.checked;
  data.starred = e.target.starred.checked;
  data.amount = Number(String(data.amount).replace(/\s+/g, '')) || 0;
  await fetch(`/api/projects/${id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  loadProject();
}

document.getElementById('projectForm').addEventListener('submit', saveProject);

async function loadTasks() {
  const res = await fetch(`/api/tasks?projectId=${id}`);
  const tasks = await res.json();
  const list = document.getElementById('taskList');
  list.innerHTML = tasks.map(t =>
    `<tr data-id="${t.id}"><td class="text-center">${t.name}<div class="text-xs text-gray-500 text-center">${t.description||''}</div><div class="timer-box text-xs mt-1" data-deadline="${t.deadline||''}"></div></td><td class="text-center">${t.status}</td><td class="actions flex justify-center gap-2"><button data-act="finish" class="btn btn-green px-2 py-1 text-sm">✅</button><button data-act="edit" class="btn btn-yellow px-2 py-1 text-sm">✏️</button><button data-act="delete" class="btn btn-red px-2 py-1 text-sm">🗑️</button></td></tr>`
  ).join('');
  updateTimers();
}

document.getElementById('taskForm').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  data.projectId = id;
  if(editingTaskId){
    await fetch(`/api/tasks/${editingTaskId}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
    editingTaskId = null;
    e.target.querySelector('button').textContent = 'Добавить';
    cancelBtn.classList.add('hidden');
  } else {
    await fetch('/api/tasks', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)});
  }
  e.target.reset();
  loadTasks();
});

const cancelBtn = document.getElementById('cancelEdit');

document.getElementById('taskList').addEventListener('click', async e => {
  const row = e.target.closest('tr');
  if (!row) return;
  const tid = row.dataset.id;
  if (e.target.dataset.act === 'finish') {
    await fetch(`/api/tasks/${tid}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({status:'Завершено'})});
  } else if (e.target.dataset.act === 'edit') {
    const form = document.getElementById('taskForm');
    form.name.value = row.children[0].firstChild.textContent;
    form.description.value = row.children[0].querySelector('div')?.textContent || '';
    form.deadline.value = row.children[0].querySelector('[data-deadline]')?.dataset.deadline || '';
    editingTaskId = tid;
    form.querySelector('button').textContent = 'Сохранить';
    cancelBtn.classList.remove('hidden');
  } else if (e.target.dataset.act === 'delete') {
    await fetch(`/api/tasks/${tid}`, {method:'DELETE'});
  }
  loadTasks();
});

cancelBtn.addEventListener('click', () => {
  editingTaskId = null;
  document.getElementById('taskForm').reset();
  document.getElementById('taskForm').querySelector('button').textContent = 'Добавить';
  cancelBtn.classList.add('hidden');
});

loadProject();
loadTasks();

function updateTimers() {
  const now = Date.now();
  document.querySelectorAll('[data-deadline]').forEach(el => {
    const dl = el.dataset.deadline;
    if (!dl) { el.textContent = ''; return; }
    const diff = new Date(dl) - now;
    if (isNaN(diff)) { el.textContent = ''; return; }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor(diff / (1000*60*60)) % 24;
    const m = Math.floor(diff / (1000*60)) % 60;
    const s = Math.floor(diff / 1000) % 60;
    el.textContent = `${d}д ${h}ч ${m}м ${s}с`;
    if (diff <= 86400000) {
      el.classList.add('text-red-600');
    } else {
      el.classList.remove('text-red-600');
    }
  });
}

setInterval(updateTimers, 1000);
