// Calendar Page
let kalenderVisibleDate = new Date();
let kalenderReminderSettings = null;

function kalenderDefaultReminderSettings() {
  return {
    friends: false,
    learningGoals: false,
    achievements: false,
    dailySummary: false,
    repeat: 'none',
    weekday: 1,
    time: '19:00',
    deadlineReminders: false,
    reminderLeadHours: 24
  };
}

const kalender = {
  render: async (pageError = '') => {
    if (!requireAuth()) return;
    const userId = String(appState.user.id);
    const tasks = (await loadTasks()).filter(task => String(task.user_id) === userId);
    let settings = kalenderReminderSettings || kalenderDefaultReminderSettings();
    let settingsError = '';
    try {
      const result = await apiGet('/notification-settings');
      if (result?.success === false || Number(result?.status) >= 400) {
        throw new Error(result.message || 'Der Server hat die Benachrichtigungseinstellungen nicht bereitgestellt.');
      }
      if (!result?.settings || typeof result.settings !== 'object') {
        throw new Error('Die Einstellungs-Antwort vom Server hatte ein unerwartetes Format.');
      }
      settings = { ...kalenderDefaultReminderSettings(), ...result.settings };
      kalenderReminderSettings = settings;
    } catch (error) {
      settingsError = `Einstellungen konnten nicht vom Server geladen werden: ${error.message || 'Unbekannter API-Fehler'}`;
    }
    const monthDate = new Date(kalenderVisibleDate.getFullYear(), kalenderVisibleDate.getMonth(), 1);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = monthDate.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = monthDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    const pad = value => String(value).padStart(2, '0');
    let calendarHtml = '<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin:1rem 0;">';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(day => {
      calendarHtml += `<div style="text-align:center;font-weight:bold;padding:0.5rem;">${day}</div>`;
    });
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calendarHtml += '<div></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const dayTasks = tasks.filter(task => task.due_date === dateStr);
      calendarHtml += `
        <div ondragover="event.preventDefault(); this.style.background='#dceaff'" ondragleave="this.style.background=''"
          ondrop="kalenderDropTask(event, '${dateStr}')"
          style="min-height:76px;padding:0.4rem;border:1px solid #ddd;border-radius:8px;${dayTasks.length ? 'background:#e8f4ff;' : ''}">
          <strong>${day}</strong>
          ${dayTasks.map(task => `<div style="font-size:0.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${kalenderEscape(task.title)}</div>`).join('')}
        </div>`;
    }
    calendarHtml += '</div>';

    kalenderCheckDeadlineReminders(tasks, userId, settings);
    const sortedTasks = tasks.slice().sort((a, b) => (a.due_date || '9999-12-31').localeCompare(b.due_date || '9999-12-31'));
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Kalender</h1>
        ${pageError ? `<p role="alert" style="padding:0.75rem;background:#ffebee;color:#b71c1c;border-radius:8px;">${kalenderEscape(pageError)}</p>` : ''}
        <div style="display:flex;gap:0.75rem;align-items:center;justify-content:space-between;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="kalenderMoveMonth(-1)">← Vorheriger Monat</button>
          <h2 style="margin:0;text-transform:capitalize;">${monthName}</h2>
          <div style="display:flex;gap:0.5rem;">
            <button class="btn btn-secondary" onclick="kalenderGoToday()">Heute</button>
            <button class="btn btn-secondary" onclick="kalenderMoveMonth(1)">Nächster Monat →</button>
          </div>
        </div>
        ${calendarHtml}
        <p style="color:#666;">Aufgaben per Drag-and-drop auf einen Tag ziehen, um das Fälligkeitsdatum zu ändern.</p>
        <button class="btn btn-primary" onclick="kalenderExportIcs()">📅 Aufgaben als ICS exportieren</button>
        <div style="margin-top:1rem;padding:1rem;background:#f7f8ff;border-radius:8px;">
          <strong>Fälligkeitserinnerungen</strong>
          <p style="margin:0.4rem 0;color:#666;">Erinnerungen werden beim Öffnen dieser Seite für anstehende Aufgaben geprüft. Browser-Benachrichtigungen benötigen eine erteilte Berechtigung und diese Seite muss geöffnet sein.</p>
          ${settingsError ? `<p role="alert" style="color:#b71c1c;">${kalenderEscape(settingsError)} Änderungen können derzeit nicht synchronisiert werden.</p>` : ''}
          <label><input type="checkbox" ${settings.deadlineReminders ? 'checked' : ''} onchange="kalenderToggleDeadlineReminders(this.checked)"> Erinnerungen aktivieren</label>
          <label style="margin-left:1rem;">Vorlauf:
            <select onchange="kalenderSetReminderLead(this.value)">
              ${[0, 1, 6, 12, 24, 48, 72].map(hours => `<option value="${hours}" ${Number(settings.reminderLeadHours ?? 24) === hours ? 'selected' : ''}>${hours === 0 ? 'am Fälligkeitstag' : `${hours} Std.`}</option>`).join('')}
            </select>
          </label>
        </div>
        <h3 style="margin-top:2rem;">Aufgaben</h3>
        <div class="task-list">
          ${sortedTasks.length ? sortedTasks.map(task => `
            <div class="task-item" draggable="true" ondragstart="kalenderDragTask(event, '${kalenderEscape(String(task.id))}')"
              style="background:#f7f8ff;padding:1rem;margin-bottom:0.75rem;border-radius:8px;display:flex;justify-content:space-between;align-items:center;gap:1rem;cursor:grab;">
              <div>
                <strong>${kalenderEscape(task.title)}</strong>
                <p style="margin:0.5rem 0 0;color:#666;">${kalenderEscape(task.description || '')}</p>
                <small style="color:#999;">${task.due_date ? kalenderEscape(formatDate(task.due_date)) : 'Kein Fälligkeitsdatum'}</small>
              </div>
              <button class="btn btn-secondary" onclick="deleteTask(${Number(task.id)})">Löschen</button>
            </div>`).join('') : '<p style="color:#999;">Keine Aufgaben vorhanden.</p>'}
        </div>
      </div>`);
    renderPageShell(main);
  }
};

function kalenderEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function kalenderMoveMonth(amount) {
  kalenderVisibleDate = new Date(kalenderVisibleDate.getFullYear(), kalenderVisibleDate.getMonth() + amount, 1);
  kalender.render();
}

function kalenderGoToday() {
  kalenderVisibleDate = new Date();
  kalender.render();
}

function kalenderDragTask(event, taskId) {
  event.dataTransfer.setData('text/plain', taskId);
  event.dataTransfer.effectAllowed = 'move';
}

async function kalenderDropTask(event, dueDate) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData('text/plain');
  const userId = String(appState.user.id);
  const tasks = (await loadTasks()).filter(item => String(item.user_id) === userId);
  const task = tasks.find(item => String(item.id) === String(taskId));
  if (!task) return;
  try {
    const result = await apiPut(`/tasks/${encodeURIComponent(task.id)}`, { dueDate });
    if (result?.success === false || Number(result?.status) >= 400) {
      throw new Error(result.message || 'Der Server hat die Änderung des Fälligkeitsdatums abgelehnt.');
    }
    await kalender.render();
  } catch (error) {
    await kalender.render(`Fälligkeitsdatum konnte nicht gespeichert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function kalenderExportIcs() {
  const userId = String(appState.user.id);
  let tasks;
  try {
    tasks = (await loadTasks()).filter(task => String(task.user_id) === userId);
  } catch (error) {
    await kalender.render(`Aufgaben konnten für den ICS-Export nicht geladen werden: ${error.message || 'Unbekannter API-Fehler'}`);
    return;
  }
  tasks = tasks.map(task => ({ ...task, due_date: task.due_date || task.dueDate }))
    .filter(task => /^\d{4}-\d{2}-\d{2}$/.test(task.due_date || ''));
  const escapeIcs = value => String(value || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
  const events = tasks.map(task => {
    const date = task.due_date.replace(/-/g, '');
    return `BEGIN:VEVENT\nUID:${escapeIcs(task.id)}-${userId}@saas.local\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\nDTSTART;VALUE=DATE:${date}\nSUMMARY:${escapeIcs(task.title)}\nDESCRIPTION:${escapeIcs(task.description)}\nEND:VEVENT`;
  });
  const content = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//SaaS//Task Calendar//DE\nCALSCALE:GREGORIAN\n${events.join('\n')}\nEND:VCALENDAR`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aufgaben.ics';
  link.click();
  URL.revokeObjectURL(url);
}

async function kalenderSaveReminderSettings(update) {
  const settings = { ...kalenderDefaultReminderSettings(), ...(kalenderReminderSettings || {}), ...update };
  try {
    const result = await apiPut('/notification-settings', settings);
    if (result?.success === false || Number(result?.status) >= 400) {
      throw new Error(result.message || 'Der Server hat die Änderung abgelehnt.');
    }
    kalenderReminderSettings = { ...settings, ...(result?.settings || {}) };
    await kalender.render();
  } catch (error) {
    await kalender.render(`Benachrichtigungseinstellung konnte nicht gespeichert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function kalenderToggleDeadlineReminders(enabled) {
  await kalenderSaveReminderSettings({ deadlineReminders: enabled });
  if (enabled && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

async function kalenderSetReminderLead(hours) {
  await kalenderSaveReminderSettings({ reminderLeadHours: Number(hours) });
}

function kalenderCheckDeadlineReminders(tasks, userId, settings) {
  if (!settings.deadlineReminders) return;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const leadDays = Number(settings.reminderLeadHours ?? 24) / 24;
  const sentKey = `deadline_reminders_sent_${userId}`;
  let sent = {};
  try {
    const saved = JSON.parse(localStorage.getItem(sentKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) sent = saved;
  } catch (_) {}
  let changed = false;
  tasks.filter(task => task.due_date && !task.completed).forEach(task => {
    const due = new Date(`${task.due_date}T00:00:00`);
    const daysUntil = (due - today) / 86400000;
    const id = `${task.id}:${task.due_date}`;
    if (!Number.isNaN(daysUntil) && daysUntil >= 0 && daysUntil <= leadDays && !sent[id]) {
      const message = `„${task.title}“ ist am ${task.due_date} fällig.`;
      if (typeof addNotification === 'function') addNotification(userId, 'Aufgabe bald fällig', message, '⏰');
      if ('Notification' in window && Notification.permission === 'granted') new Notification('Aufgabe bald fällig', { body: message });
      sent[id] = new Date().toISOString();
      changed = true;
    }
  });
  if (changed) localStorage.setItem(sentKey, JSON.stringify(sent));
}
