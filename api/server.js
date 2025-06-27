const http = require('http');
const fs = require('fs');
const path = require('path');
const { readJSON, writeJSON } = require('../lib/storage');

function generateId() {
  return Date.now();
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

function logHistory(action, data) {
  const history = readJSON('history.json');
  history.push({ id: generateId(), time: new Date().toISOString(), action, ...data });
  writeJSON('history.json', history);
}

function notFound(res) {
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
}

function handleProjects(req, res, id) {
  const projects = readJSON('projects.json');

  if (req.method === 'GET') {
    if (id) {
      const project = projects.find(p => p.id === id);
      if (!project) return notFound(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(project));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
    }
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      body.id = generateId();
      body.start = new Date().toISOString().slice(0,10);
      body.status = 'Активный';
      body.amount = Number(String(body.amount).replace(/\s+/g, '')) || 0;
      body.currency = body.currency || 'USD';
      body.monthly = Boolean(body.monthly);
      body.starred = Boolean(body.starred);
      if (body.monthly) delete body.deadline;
      projects.push(body);
      writeJSON('projects.json', projects);
      logHistory('create_project', { projectId: body.id, name: body.name });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else if (req.method === 'PUT' && id) {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      const project = projects.find(p => p.id === id);
      if (!project) return notFound(res);
      if (body.status === 'Завершено' && project.status !== 'Завершено' && !project.finished) {
        project.finished = new Date().toISOString();
      }
      if (body.monthly) delete body.deadline;
      Object.assign(
        project,
        body,
        {
          monthly: body.monthly !== undefined ? Boolean(body.monthly) : project.monthly,
          starred: body.starred !== undefined ? Boolean(body.starred) : project.starred
        }
      );
      writeJSON('projects.json', projects);
      logHistory('update_project', { projectId: project.id, name: project.name });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(project));
    });
  } else if (req.method === 'DELETE' && id) {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return notFound(res);
    const [removed] = projects.splice(index, 1);
    logHistory('delete_project', { projectId: removed.id, name: removed.name });
    writeJSON('projects.json', projects);
    res.writeHead(204); res.end();
  } else {
    notFound(res);
  }
}

function handleExpenses(req, res, id) {
  const expenses = readJSON('expenses.json');

  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(expenses));
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      body.id = generateId();
      body.projectId = Number(body.projectId);
      if (!body.date) {
        const projects = readJSON('projects.json');
        const p = projects.find(pr => pr.id === body.projectId) || {};
        body.date = p.deadline || p.start || new Date().toISOString().slice(0,10);
      }
      expenses.push(body);
      writeJSON('expenses.json', expenses);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else if (req.method === 'DELETE' && id) {
    const index = expenses.findIndex(e => e.id === id);
    if (index === -1) return notFound(res);
    expenses.splice(index, 1);
    writeJSON('expenses.json', expenses);
    res.writeHead(204); res.end();
  } else {
    notFound(res);
  }
}

function handleTasks(req, res, id) {
  const tasks = readJSON('tasks.json');
  if (req.method === 'GET') {
    if (id) {
      const task = tasks.find(t => t.id === id);
      if (!task) return notFound(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    } else {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const projectId = Number(url.searchParams.get('projectId'));
      const list = projectId ? tasks.filter(t => t.projectId === projectId) : tasks;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(list));
    }
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      body.id = generateId();
      body.projectId = Number(body.projectId);
      body.status = 'В работе';
      body.created = new Date().toISOString().slice(0,10);
      if (body.deadline) body.deadline = body.deadline;
      tasks.push(body);
      // set project status to 'В работе'
      const projects = readJSON('projects.json');
      const proj = projects.find(p => p.id === body.projectId);
      if (proj && proj.status !== 'Завершено') {
        proj.status = 'В работе';
        writeJSON('projects.json', projects);
        logHistory('update_project', { projectId: proj.id, name: proj.name });
      }
      logHistory('create_task', { projectId: body.projectId, taskId: body.id, name: body.name });
      writeJSON('tasks.json', tasks);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else if (req.method === 'PUT' && id) {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      const task = tasks.find(t => t.id === id);
      if (!task) return notFound(res);
      if (body.status === 'Завершено' && task.status !== 'Завершено' && !task.finished) {
        task.finished = new Date().toISOString();
      }
      Object.assign(task, body);
      writeJSON('tasks.json', tasks);
      logHistory('update_task', { projectId: task.projectId, taskId: task.id, name: task.name });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(task));
    });
  } else if (req.method === 'DELETE' && id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return notFound(res);
    const [removed] = tasks.splice(index, 1);
    logHistory('delete_task', { projectId: removed.projectId, taskId: removed.id, name: removed.name });
    writeJSON('tasks.json', tasks);
    res.writeHead(204); res.end();
  } else {
    notFound(res);
  }
}

function handleFinances(req, res) {
  if (req.method === 'GET') {
    const projects = readJSON('projects.json');
    const expenses = readJSON('expenses.json');
    const settings = readJSON('settings.json');
    const tax = settings.taxPercent || 0;
    const profitPercent = settings.profitPercent || 20;
    const finances = projects.map(p => {
      const projectExpenses = expenses.filter(e => e.projectId === p.id);
      const totalExpenses = projectExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const amount = Number(p.amount || 0);
      const taxAmount = (amount - totalExpenses) * (tax / 100);
      const net = amount - totalExpenses - taxAmount;
      const myPart = net * (profitPercent / 100);
      return { projectId: p.id, name: p.name, start: p.start, amount, tax: taxAmount, expenses: totalExpenses, net, myPart };
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(finances));
  } else {
    notFound(res);
  }
}

function handleAdminSettings(req, res) {
  if (req.method === 'GET') {
    const settings = readJSON('settings.json', {});
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(settings));
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      writeJSON('settings.json', body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else {
    notFound(res);
  }
}

function handleAdminTypes(req, res) {
  const types = readJSON('types.json');
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(types));
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      body.id = generateId();
      types.push(body);
      writeJSON('types.json', types);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else if (req.method === 'DELETE') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get('id'));
    const index = types.findIndex(t => t.id === id);
    if (index === -1) return notFound(res);
    types.splice(index, 1);
    writeJSON('types.json', types);
    res.writeHead(204); res.end();
  } else {
    notFound(res);
  }
}

function handleAdminCategories(req, res) {
  const categories = readJSON('categories.json');
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(categories));
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      body.id = generateId();
      categories.push(body);
      writeJSON('categories.json', categories);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else if (req.method === 'DELETE') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get('id'));
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return notFound(res);
    categories.splice(index, 1);
    writeJSON('categories.json', categories);
    res.writeHead(204); res.end();
  } else {
    notFound(res);
  }
}

function handleAdminClients(req, res) {
  const clients = readJSON('clients.json');
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(clients));
  } else if (req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) { res.writeHead(400); res.end(); return; }
      body.id = generateId();
      clients.push(body);
      writeJSON('clients.json', clients);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  } else if (req.method === 'DELETE') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const id = Number(url.searchParams.get('id'));
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) return notFound(res);
    clients.splice(index, 1);
    writeJSON('clients.json', clients);
    res.writeHead(204); res.end();
  } else {
    notFound(res);
  }
}

function handleHistory(req, res) {
  if (req.method === 'GET') {
    const history = readJSON('history.json');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(history));
  } else {
    notFound(res);
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  function parseId() {
    const parts = url.pathname.split('/');
    const idx = parts[3];
    const queryId = url.searchParams.get('id');
    const idStr = idx || queryId;
    return idStr ? Number(idStr) : undefined;
  }

  if (url.pathname.startsWith('/api/projects')) {
    return handleProjects(req, res, parseId());
  }
  if (url.pathname.startsWith('/api/expenses')) {
    return handleExpenses(req, res, parseId());
  }
  if (url.pathname === '/api/finances') return handleFinances(req, res);
  if (url.pathname === '/api/history') return handleHistory(req, res);
  if (url.pathname === '/api/admin/settings') return handleAdminSettings(req, res);
  if (url.pathname === '/api/admin/types') return handleAdminTypes(req, res);
  if (url.pathname === '/api/admin/categories') return handleAdminCategories(req, res);
  if (url.pathname === '/api/admin/clients') return handleAdminClients(req, res);
  if (url.pathname.startsWith('/api/tasks')) {
    return handleTasks(req, res, parseId());
  }

  const relative = url.pathname === '/' ? 'projects.html' : url.pathname.replace(/^\//, '');
  const filePath = path.join(__dirname, '..', 'pages', relative);
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
