async function loadAlerts(){
  const [projectsRes, tasksRes] = await Promise.all([
    fetch('/api/projects'),
    fetch('/api/tasks')
  ]);
  const projects = await projectsRes.json();
  const tasks = await tasksRes.json();
  const now = Date.now();
  const items = [];
  for(const p of projects){
    if(p.deadline && p.status !== 'Завершено'){
      const diff = new Date(p.deadline) - now;
      if(diff <= 86400000 && diff > 0){
        items.push({name:p.name, deadline:p.deadline, type:'Проект', id:p.id});
      }
    }
  }
  for(const t of tasks){
    if(t.deadline && t.status !== 'Завершено'){
      const diff = new Date(t.deadline) - now;
      if(diff <= 86400000 && diff > 0){
        items.push({name:t.name, deadline:t.deadline, type:'Задача', id:t.id, projectId:t.projectId});
      }
    }
  }
  const container = document.getElementById('globalAlerts');
  if(!container) return;
  container.innerHTML = items.map(it=>
    `<div data-deadline="${it.deadline}" class="alert-box text-sm mb-1">
      Дедлайн ${it.type.toLowerCase()} "${it.name}" скоро закончится
      <div class="timer"></div>
      <button onclick="location.href='/project.html?id=${it.projectId||it.id}'">Перейти</button>
    </div>`
  ).join('');
  updateAlertTimers();
}

function updateAlertTimers(){
  const now = Date.now();
  document.querySelectorAll('#globalAlerts [data-deadline]').forEach(el=>{
    const dl = new Date(el.dataset.deadline);
    const diff = dl - now;
    if(isNaN(diff)){el.querySelector('.timer').textContent='';return;}
    const d=Math.floor(diff/86400000);
    const h=Math.floor(diff/3600000)%24;
    const m=Math.floor(diff/60000)%60;
    const s=Math.floor(diff/1000)%60;
    el.querySelector('.timer').textContent = `${d}д ${h}ч ${m}м ${s}с`;
  });
}

setInterval(updateAlertTimers,1000);
loadAlerts();
