const API_ROOT = '/api';
const serverRequiredPaths = /^\/(friends|messages|groups|resources|study-sessions|analytics|reminders|notification-settings|privacy|xp|gamification|comparisons)(\/|$)/;
const accountPaths = new Set(['/login', '/register', '/me', '/logout']);

function apiError(result) {
  return new Error(result.data?.message || `Die API-Anfrage ist fehlgeschlagen (HTTP ${result.status}).`);
}

function unavailableApiError() {
  return new Error('Der Online-Dienst ist nicht erreichbar. Bitte prüfe die Verbindung und versuche es erneut.');
}

async function requestApi(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_ROOT}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      signal: controller.signal,
      ...options
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      data = await response.text().catch(() => null);
    }

    return {
      ok: response.ok,
      data,
      status: response.status,
      statusText: response.statusText,
      fallback: response.status === 404 || response.status === 501 || !contentType.includes('application/json')
    };
  } catch (error) {
    console.warn('API request failed:', error);
    return { ok: false, networkError: true, fallback: true, error };
  } finally {
    clearTimeout(timeout);
  }
}

async function apiPost(path, body) {
  const result = await requestApi(path, { method: 'POST', body: JSON.stringify(body) });
  if (serverRequiredPaths.test(path) && (result.networkError || result.status === 404 || result.status === 501)) {
    throw unavailableApiError();
  }
  if (accountPaths.has(path) && result.networkError) throw unavailableApiError();
  if (result.networkError || result.fallback && (result.status === 404 || result.status === 501)) {
    return offlineApiPost(path, body);
  }
  if (!result.ok) {
    if (serverRequiredPaths.test(path) || !accountPaths.has(path)) throw apiError(result);
    return { ...(result.data || {}), status: result.status };
  }
  return result.data;
}

async function apiGet(path) {
  const result = await requestApi(path, { method: 'GET' });
  if ((serverRequiredPaths.test(path) || path === '/me') && (result.networkError || result.status === 404 || result.status === 501)) {
    if (path === '/me') return { success: false, status: result.status };
    throw unavailableApiError();
  }
  if (result.networkError || result.fallback && (result.status === 404 || result.status === 501)) {
    return offlineApiGet(path);
  }
  if (!result.ok) {
    if (!accountPaths.has(path)) throw apiError(result);
    return { ...(result.data || {}), status: result.status };
  }
  return result.data;
}

async function apiPut(path, body) {
  const result = await requestApi(path, { method: 'PUT', body: JSON.stringify(body) });
  if (serverRequiredPaths.test(path) && (result.networkError || result.status === 404 || result.status === 501)) {
    throw unavailableApiError();
  }
  if (result.networkError || result.fallback && (result.status === 404 || result.status === 501)) {
    return offlineApiPut(path, body);
  }
  if (!result.ok) throw apiError(result);
  return result.data;
}

async function apiDelete(path) {
  const result = await requestApi(path, { method: 'DELETE' });
  if (serverRequiredPaths.test(path) && (result.networkError || result.status === 404 || result.status === 501)) {
    throw unavailableApiError();
  }
  if (result.networkError || result.fallback && (result.status === 404 || result.status === 501)) {
    return offlineApiDelete(path);
  }
  if (!result.ok) throw apiError(result);
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
