const API_ROOT = '/api';

async function requestApi(path, options = {}) {
  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    const shouldFallback = !response.ok || response.status === 0 || response.status === 404 || response.status === 501 || !contentType.includes('application/json');

    return {
      ok: response.ok,
      data,
      status: response.status,
      statusText: response.statusText,
      fallback: shouldFallback
    };
  } catch (error) {
    console.warn('API request failed:', error);
    return { ok: false, networkError: true, fallback: true, error };
  }
}

async function apiPost(path, body) {
  const result = await requestApi(path, { method: 'POST', body: JSON.stringify(body) });
  if (result.networkError || result.fallback) {
    return offlineApiPost(path, body);
  }
  return result.data;
}

async function apiGet(path) {
  const result = await requestApi(path, { method: 'GET' });
  if (result.networkError || result.fallback) {
    return offlineApiGet(path);
  }
  return result.data;
}

async function apiPut(path, body) {
  const result = await requestApi(path, { method: 'PUT', body: JSON.stringify(body) });
  if (result.networkError || result.fallback) {
    return offlineApiPut(path, body);
  }
  return result.data;
}

async function apiDelete(path) {
  const result = await requestApi(path, { method: 'DELETE' });
  if (result.networkError || result.fallback) {
    return offlineApiDelete(path);
  }
  return result.data;
}

function offlineApiPost(path, body) {
  mockDB.init();
  if (path === '/login') {
    const user = mockDB.findUser(body.username, body.password);
    if (user) {
      return { success: true, user };
    }
    return { success: false, message: 'Ungültige Anmeldedaten' };
  }
  if (path === '/register') {
    if (mockDB.userExists(body.username, body.email)) {
      return { success: false, message: 'Benutzername oder E-Mail existiert bereits' };
    }
    const user = mockDB.createUser(body.username, body.email, body.password, body.schoolType, body.schoolClass, body.birthdate);
    return { success: true, user };
  }
  if (path === '/upgrade') {
    mockDB.updateUser(body.userId, { subscription: body.plan });
    return { success: true, plan: body.plan };
  }
  if (path === '/tasks') {
    mockDB.createTask(body.userId, body.title, body.description, body.dueDate, body.priority);
    return { success: true };
  }
  if (path === '/grades') {
    mockDB.createGrade(body.userId, body.subject, body.grade, body.date);
    return { success: true };
  }
  if (path === '/ai') {
    return { success: true, answer: `${body.question} – Unsere KI empfiehlt, zuerst die Grundlagen zu prüfen, dann Schritt für Schritt zu lösen. Achte auf die wichtigsten Begriffe, arbeite ein Beispiel durch und überprüfe dein Ergebnis.` };
  }
  return { success: false, message: 'Offline-Fallback nicht verfügbar' };
}

function offlineApiGet(path) {
  mockDB.init();
  if (path.includes('/tasks')) {
    const userId = parseInt(new URLSearchParams(path.split('?')[1]).get('userId'));
    return { tasks: mockDB.getTasks(userId) };
  }
  if (path.includes('/grades')) {
    const userId = parseInt(new URLSearchParams(path.split('?')[1]).get('userId'));
    return { grades: mockDB.getGrades(userId) };
  }
  return { success: false, message: 'Offline-Fallback nicht verfügbar' };
}

function offlineApiPut(path, body) {
  mockDB.init();
  if (path.startsWith('/tasks/')) {
    const taskId = parseInt(path.split('/').pop());
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]');
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      Object.assign(task, { completed: body.completed ? 1 : 0, title: body.title || task.title, description: body.description ?? task.description, priority: body.priority || task.priority, due_date: body.dueDate || task.due_date });
      localStorage.setItem('saasDB_tasks', JSON.stringify(tasks));
      return { success: true, task };
    }
    return { success: false, message: 'Aufgabe nicht gefunden' };
  }
  return { success: false, message: 'Offline-Fallback nicht verfügbar' };
}

function offlineApiDelete(path) {
  mockDB.init();
  if (path.startsWith('/tasks/')) {
    const taskId = parseInt(path.split('/').pop());
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]');
    const filtered = tasks.filter(t => t.id !== taskId);
    localStorage.setItem('saasDB_tasks', JSON.stringify(filtered));
    return { success: true };
  }
  if (path.startsWith('/grades/')) {
    const gradeId = parseInt(path.split('/').pop());
    const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]');
    const filtered = grades.filter(g => g.id !== gradeId);
    localStorage.setItem('saasDB_grades', JSON.stringify(filtered));
    return { success: true };
  }
  return { success: false, message: 'Offline-Fallback nicht verfügbar' };
}
