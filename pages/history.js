async function loadHistory(){
  const res = await fetch('/api/history');
  const items = await res.json();
  const list = document.getElementById('list');
  const labels = {
    create_project: 'Создан проект',
    update_project: 'Изменён проект',
    delete_project: 'Удалён проект',
    create_task: 'Создана задача',
    update_task: 'Изменена задача',
    delete_task: 'Удалена задача'
  };
  list.innerHTML = items.map(i =>
    `<tr><td class="text-center">${new Date(i.time).toLocaleString()}</td><td class="text-center">${labels[i.action]||i.action}</td><td class="text-center">${i.name||''}</td><td class="text-center">${i.taskId||''}</td></tr>`
  ).join('');
}

loadHistory();
