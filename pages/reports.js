async function loadProjects() {
  const from = document.querySelector('[name=from]').value;
  const to = document.querySelector('[name=to]').value;
  const res = await fetch('/api/projects');
  let items = await res.json();
  if (from) items = items.filter(p => new Date(p.start) >= new Date(from));
  if (to) items = items.filter(p => new Date(p.start) <= new Date(to));
  const list = items.map(p => `<label class="block"><input type="checkbox" value="${p.id}" checked class="mr-1">${p.name}</label>`).join('');
  document.getElementById('projects').innerHTML = list || '<p>Нет проектов</p>';
}

document.getElementById('loadBtn').addEventListener('click', async () => {
  await loadProjects();
  document.getElementById('projectModal').classList.remove('hidden');
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('projectModal').classList.add('hidden');
});

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

function formatDateTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleString('ru-RU', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
}

function formatAmount(n) {
  return Number(n || 0).toLocaleString('ru-RU');
}

async function makeProjectReport() {
  const ids = Array.from(document.querySelectorAll('#projects input:checked')).map(i=>Number(i.value));
  if (!ids.length) return;
  document.getElementById('projectModal').classList.add('hidden');
  const [projects, tasks] = await Promise.all([
    fetch('/api/projects').then(r=>r.json()),
    fetch('/api/tasks').then(r=>r.json())
  ]);
  const selected = projects.filter(p=>ids.includes(p.id));
  let html = '<h2 class="text-xl font-semibold mb-4">Проектный отчёт</h2>';
  for (const p of selected) {
    const tlist = tasks.filter(t=>t.projectId===p.id);
    const rows = tlist.map(t=>`<tr><td class="p-2 text-left">${t.name}</td><td class="p-2 text-left">${t.description||''}</td><td class="p-2 text-left">${t.status}</td><td class="p-2 text-left">${formatDateTime(t.finished)}</td></tr>`).join('');
    const finishPart = p.finished ? ` | Завершён: ${formatDate(p.finished)}` : '';
    html += `<div class="report-project dark:border-gray-700">
      <div class="text-lg font-bold mb-1">${p.name}</div>
      <div class="text-base mb-1">${p.client||''} | ${p.type||''} | статус: ${p.status}</div>
      <div class="text-base">Создан: ${formatDate(p.start)} | Дедлайн: ${p.monthly?'ежемесячно':formatDate(p.deadline)}${finishPart}</div>
      <table class="table my-3 text-left"><thead><tr><th class="p-2">Задача</th><th class="p-2">Описание</th><th class="p-2">Статус</th><th class="p-2">Завершено</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  }
  document.getElementById('report').innerHTML = html;
  prepareDownload();
}

document.getElementById('projReport').addEventListener('click', makeProjectReport);

async function makeFinanceReport() {
  const ids = Array.from(document.querySelectorAll('#projects input:checked')).map(i=>Number(i.value));
  if (!ids.length) return;
  document.getElementById('projectModal').classList.add('hidden');
  const finances = await fetch('/api/finances').then(r=>r.json());
  const selected = finances.filter(f=>ids.includes(f.projectId));
  let html = '<h2 class="text-xl font-semibold mb-2">Финансовый отчёт</h2>';
  html += '<table class="table border border-gray-300"><thead class="bg-gray-200 dark:bg-gray-700"><tr><th class="p-2">Проект</th><th class="p-2">Сумма</th><th class="p-2">Налоги</th><th class="p-2">Расходы</th><th class="p-2">Чистая прибыль</th><th class="p-2">Доля исполнителя</th></tr></thead><tbody>';
  html += selected.map(f=>`<tr><td class="p-2 text-center">${f.name}</td><td class="p-2 text-center">${formatAmount(f.amount)}</td><td class="p-2 text-center">${formatAmount(f.tax)}</td><td class="p-2 text-center">${formatAmount(f.expenses)}</td><td class="p-2 text-center">${formatAmount(f.net)}</td><td class="p-2 text-center">${formatAmount(f.myPart)}</td></tr>`).join('');
  html += '</tbody></table>';
  document.getElementById('report').innerHTML = html;
  prepareDownload();
}

document.getElementById('finReport').addEventListener('click', makeFinanceReport);

function prepareDownload() {
  const link = document.getElementById('download');
  link.classList.remove('hidden');
  link.onclick = () => {
    const html = '<html><head><meta charset="UTF-8"></head><body>' + document.getElementById('report').innerHTML + '</body></html>';
    const blob = window.htmlDocx.asBlob(html);
    window.saveAs(blob, 'report.docx');
  };
}
