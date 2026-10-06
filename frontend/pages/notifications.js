// Notifications and page-active reminder schedules.
let notificationReminderTimer = null;
let notificationSettingsCache = { userId: null, settings: null };

const notifications = {
  render: async (reminderError = '', settingsError = '') => {
    if (!requireAuth()) return;
    mockDB.init();
    const userId = String(appState.user.id);
    let reminders = [];
    let loadReminderError = reminderError;
    try {
      const result = await apiGet('/reminders');
      if (result?.success === false) throw new Error(result.message || 'Der Erinnerungsdienst hat die Anfrage abgelehnt.');
      reminders = Array.isArray(result) ? result : result?.reminders;
      if (!Array.isArray(reminders)) throw new Error('Die Erinnerungs-Antwort vom Server hatte ein unerwartetes Format.');
    } catch (error) {
      loadReminderError = `Erinnerungen konnten nicht geladen werden: ${error.message || 'Unbekannter API-Fehler'}`;
    }
    let loadSettingsError = settingsError;
    let settings;
    try {
      const result = await apiGet('/notification-settings');
      notificationAssertApiSuccess(result, 'Der Benachrichtigungsdienst hat die Anfrage abgelehnt.');
      if (!result?.settings || typeof result.settings !== 'object') {
        throw new Error('Die Einstellungs-Antwort vom Server hatte ein unerwartetes Format.');
      }
      settings = { ...notificationDefaultSettings(), ...result.settings };
      notificationSettingsCache = { userId, settings };
    } catch (error) {
      loadSettingsError = `Benachrichtigungseinstellungen konnten nicht geladen werden: ${error.message || 'Unbekannter API-Fehler'}`;
      settings = notificationSettingsCache.userId === userId && notificationSettingsCache.settings
        ? notificationSettingsCache.settings
        : notificationDefaultSettings();
    }
    const allNotifications = notificationReadItems(userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const unreadCount = allNotifications.filter(item => !item.read).length;
    const grouped = groupNotificationsByDate(allNotifications);
    const permissionText = !('Notification' in window) ? 'Browser-Benachrichtigungen werden von diesem Browser nicht unterstützt.'
      : Notification.permission === 'granted' ? 'Browser-Benachrichtigungen sind erlaubt.'
        : Notification.permission === 'denied' ? 'Browser-Benachrichtigungen sind im Browser blockiert. Ändere die Berechtigung in den Website-Einstellungen.'
          : 'Browser-Benachrichtigungen benötigen deine Zustimmung.';

    const main = createPageContainer(`
      <div class="page-card">
        <h1>🔔 Benachrichtigungen</h1>
        <p>Erinnerungen werden nur verarbeitet, solange diese App geöffnet ist. Es gibt keine Hintergrundzustellung. Der Benachrichtigungsverlauf wird lokal auf diesem Gerät gespeichert.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-top:1rem;">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:1.5rem;border-radius:12px;text-align:center;"><div style="font-size:2rem;font-weight:bold;">${unreadCount}</div><p style="margin:0.5rem 0;">Ungelesen</p></div>
          <div style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;padding:1.5rem;border-radius:12px;text-align:center;"><div style="font-size:2rem;font-weight:bold;">${allNotifications.length}</div><p style="margin:0.5rem 0;">Insgesamt</p></div>
          <div style="display:flex;gap:0.5rem;align-items:center;justify-content:center;flex-wrap:wrap;">
            ${unreadCount ? '<button class="btn btn-secondary" onclick="markAllAsRead()">✓ Alle lesen</button>' : '<p style="color:#999;">Keine neuen Benachrichtigungen</p>'}
            ${allNotifications.length ? '<button class="btn btn-secondary" onclick="clearAllNotifications()">🗑️ Alle löschen</button>' : ''}
          </div>
        </div>
      </div>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>📨 Benachrichtigungen</h2>
        ${Object.entries(grouped).length ? Object.entries(grouped).map(([date, items]) => `
          <div style="margin-bottom:2rem;">
            <h3 style="color:#999;margin-bottom:1rem;font-size:0.9rem;">📅 ${notificationEscape(date)}</h3>
            <div style="display:grid;gap:0.75rem;">
              ${items.map(item => `
                <div class="task-item" style="border-left:4px solid ${item.read ? '#ddd' : '#667eea'};opacity:${item.read ? '0.7' : '1'};padding-left:1rem;">
                  <div style="display:flex;justify-content:space-between;align-items:start;gap:0.5rem;">
                    <div style="flex:1;">
                      <strong>${notificationEscape(item.icon || '🔔')} ${notificationEscape(item.title)}</strong>${item.read ? '' : '<span style="margin-left:0.5rem;background:#667eea;color:white;padding:0.2rem 0.5rem;border-radius:12px;font-size:0.7rem;">NEU</span>'}
                      <p style="margin:0.35rem 0;color:#666;">${notificationEscape(item.message)}</p>
                      <small style="color:#999;">⏰ ${notificationEscape(notificationFormatDate(item.createdAt))}</small>
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                      ${item.action ? `<button class="btn btn-sm btn-primary" onclick="handleNotificationAction('${notificationEscape(item.id)}')">${notificationEscape(item.action)}</button>` : ''}
                      <button class="btn btn-sm btn-secondary" onclick="deleteNotification('${notificationEscape(item.id)}')">✕</button>
                    </div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('') : '<p style="color:#999;text-align:center;padding:2rem;">Keine Benachrichtigungen.</p>'}
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>⚙️ Benachrichtigungseinstellungen</h2>
        <div style="display:grid;gap:0.75rem;">
          ${[
            ['friends', 'Nachrichten von Freunden', 'Hinweise zu neuen Nachrichten'],
            ['learningGoals', 'Lernziel-Erinnerungen', 'Erinnerungen an deine Lernroutine'],
            ['achievements', 'Achievement-Hinweise', 'Hinweise zu Erfolgen'],
            ['dailySummary', 'Wiederkehrende Lern-Erinnerung', 'Erinnerung zum gewählten Zeitpunkt, solange diese Seite geöffnet ist']
          ].map(([key, title, description]) => `
            <label style="display:flex;align-items:center;gap:1rem;padding:0.75rem;background:#f7f8ff;border-radius:8px;">
              <input type="checkbox" ${settings[key] ? 'checked' : ''} onchange="notificationUpdateSetting('${key}', this.checked)">
              <span><strong>${title}</strong><br><small style="color:#666;">${description}</small></span>
            </label>`).join('')}
        </div>
        <p style="margin:0.75rem 0;color:#777;font-size:0.9rem;">Diese Einstellungen werden mit deinem Konto synchronisiert. Die Browser-Berechtigung wird dagegen vom Browser auf diesem Gerät verwaltet.</p>
        ${loadSettingsError ? `<p id="notification-settings-status" role="alert" style="padding:0.75rem;background:#ffebee;color:#b71c1c;border-radius:8px;">${notificationEscape(loadSettingsError)}</p>` : '<p id="notification-settings-status" role="status" style="color:#666;"></p>'}
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;margin:1rem 0;padding:1rem;background:#f7f8ff;border-radius:8px;">
          <label>Wiederholung:
            <select onchange="notificationUpdateSetting('repeat', this.value)">
              <option value="none" ${settings.repeat === 'none' ? 'selected' : ''}>Keine</option>
              <option value="daily" ${settings.repeat === 'daily' ? 'selected' : ''}>Täglich</option>
              <option value="weekly" ${settings.repeat === 'weekly' ? 'selected' : ''}>Wöchentlich</option>
            </select>
          </label>
          <label>Wochentag:
            <select onchange="notificationUpdateSetting('weekday', Number(this.value))">
              ${['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'].map((day, index) => `<option value="${index}" ${Number(settings.weekday) === index ? 'selected' : ''}>${day}</option>`).join('')}
            </select>
          </label>
          <label>Uhrzeit: <input type="time" value="${notificationEscape(settings.time || '19:00')}" onchange="notificationUpdateSetting('time', this.value)"></label>
        </div>
        <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;margin-top:1rem;">
          <button class="btn btn-primary" onclick="notificationRequestPermission()">🔔 Browser-Benachrichtigungen aktivieren</button>
          <span style="color:#666;">${notificationEscape(permissionText)}</span>
        </div>
        <div style="margin-top:1rem;padding:1rem;background:#f7f8ff;border-radius:8px;">
          <label><input type="checkbox" ${settings.deadlineReminders ? 'checked' : ''} onchange="notificationUpdateSetting('deadlineReminders', this.checked)"> Fälligkeitserinnerungen aktivieren</label>
          <label style="margin-left:1rem;">Vorlauf:
            <select onchange="notificationUpdateSetting('reminderLeadHours', Number(this.value))">
              ${[0, 1, 6, 12, 24, 48, 72].map(hours => `<option value="${hours}" ${Number(settings.reminderLeadHours) === hours ? 'selected' : ''}>${hours === 0 ? 'am Fälligkeitstag' : `${hours} Std.`}</option>`).join('')}
            </select>
          </label>
        </div>
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>🗓️ Geplante Erinnerungen</h2>
        <p>Termine und Wiederholungen werden über den Server gespeichert. Browser-Benachrichtigungen werden nur geprüft, solange diese Seite geöffnet ist.</p>
        ${loadReminderError ? `<p role="alert" style="padding:0.75rem;background:#ffebee;color:#b71c1c;border-radius:8px;">${notificationEscape(loadReminderError)}</p>` : ''}
        <form onsubmit="notificationCreateReminder(event)" style="display:grid;gap:0.75rem;">
          <input name="title" required maxlength="120" placeholder="Titel der Erinnerung">
          <label>Datum und Uhrzeit <input name="dueAt" required type="datetime-local"></label>
          <label>Wiederholung
            <select name="repeatRule" required>
              <option value="none">Keine</option><option value="daily">Täglich</option><option value="weekly">Wöchentlich</option><option value="monthly">Monatlich</option>
            </select>
          </label>
          <button class="btn btn-primary" type="submit">Erinnerung speichern</button>
        </form>
        <div style="display:grid;gap:0.75rem;margin-top:1rem;">
          ${loadReminderError ? '' : reminders.length ? reminders.map(reminder => `
            <div class="task-item" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem;">
              <div><strong>${notificationEscape(reminder.title)}</strong><p style="margin:0.35rem 0;color:#666;">${notificationEscape(notificationFormatDate(reminder.dueAt))} · ${notificationEscape(notificationRepeatLabel(reminder.repeatRule))}</p></div>
              <button class="btn btn-sm btn-secondary" onclick="notificationDeleteReminder('${notificationEscape(reminder.id)}')">Löschen</button>
            </div>`).join('') : '<p style="color:#999;">Keine geplanten Erinnerungen.</p>'}
        </div>
      </section>`);
    renderPageShell(main);
    notificationCheckSchedules(userId);
    notificationCheckRemoteReminders(userId, reminders);
    if (notificationReminderTimer) clearInterval(notificationReminderTimer);
    notificationReminderTimer = setInterval(() => {
      if (document.visibilityState !== 'hidden' && appState.user && String(appState.user.id) === userId) {
        notificationCheckSchedules(userId);
        notificationLoadAndCheckRemoteReminders(userId);
      }
    }, 60000);
  }
};

function notificationEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function notificationReadItems(userId) {
  try {
    const items = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
    return Array.isArray(items) ? items : [];
  } catch (_) { return []; }
}

function notificationDefaultSettings() {
  return { friends: false, learningGoals: false, achievements: false, dailySummary: false, repeat: 'none', weekday: 1, time: '19:00', deadlineReminders: false, reminderLeadHours: 24 };
}

function notificationReadSettings(userId) {
  return notificationSettingsCache.userId === String(userId) && notificationSettingsCache.settings
    ? notificationSettingsCache.settings
    : notificationDefaultSettings();
}

async function notificationUpdateSetting(key, value) {
  const userId = String(appState.user.id);
  const allowed = ['friends', 'learningGoals', 'achievements', 'dailySummary', 'repeat', 'weekday', 'time', 'deadlineReminders', 'reminderLeadHours'];
  if (!allowed.includes(key)) return;
  const settings = { ...notificationReadSettings(userId), [key]: value };
  try {
    const result = await apiPut('/notification-settings', settings);
    notificationAssertApiSuccess(result, 'Der Server hat das Speichern der Einstellungen abgelehnt.');
    const savedSettings = result?.settings && typeof result.settings === 'object' ? result.settings : settings;
    notificationSettingsCache = { userId, settings: { ...notificationDefaultSettings(), ...savedSettings } };
    await notifications.render();
  } catch (error) {
    await notifications.render('', `Benachrichtigungseinstellung konnte nicht gespeichert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function notificationRequestPermission() {
  if (!('Notification' in window)) {
    alert('Dieser Browser unterstützt keine Browser-Benachrichtigungen.');
    return;
  }
  const permission = await Notification.requestPermission();
  alert(permission === 'granted' ? 'Browser-Benachrichtigungen wurden erlaubt.' : 'Berechtigung nicht erteilt. Du kannst sie in den Website-Einstellungen ändern.');
  notifications.render();
}

function notificationFormatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString('de-DE');
}

function groupNotificationsByDate(items) {
  const grouped = {};
  items.forEach(item => {
    const date = new Date(item.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const label = Number.isNaN(date.getTime()) ? 'Früher'
      : date.toDateString() === today.toDateString() ? 'Heute'
        : date.toDateString() === yesterday.toDateString() ? 'Gestern'
          : date.toLocaleDateString('de-DE');
    (grouped[label] ||= []).push(item);
  });
  return grouped;
}

function markAllAsRead() {
  const userId = String(appState.user.id);
  const items = notificationReadItems(userId);
  items.forEach(item => { item.read = true; });
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(items));
  notifications.render();
}

function clearAllNotifications() {
  if (!confirm('Alle Benachrichtigungen löschen?')) return;
  localStorage.setItem(`notifications_${appState.user.id}`, JSON.stringify([]));
  notifications.render();
}

function deleteNotification(notifId) {
  const userId = String(appState.user.id);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(notificationReadItems(userId).filter(item => String(item.id) !== String(notifId))));
  notifications.render();
}

function handleNotificationAction(notifId) {
  const item = notificationReadItems(String(appState.user.id)).find(entry => String(entry.id) === String(notifId));
  if (item?.actionType === 'view_achievement') router.navigate('/achievements');
  else if (item?.actionType === 'join_event') router.navigate('/challenges');
  deleteNotification(notifId);
}

function addNotification(userId, title, message, icon, actionType = null) {
  let items = notificationReadItems(String(userId));
  items.push({
    id: Date.now().toString(),
    title,
    message,
    icon,
    action: actionType ? '👉 Jetzt ansehen' : null,
    actionType,
    read: false,
    createdAt: new Date().toISOString()
  });
  if (items.length > 50) items = items.slice(-50);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(items));
}

function notificationShowBrowser(title, body, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, tag }); } catch (_) {}
}

function notificationAssertApiSuccess(result, fallbackMessage) {
  if (result?.success === false || (Number(result?.status) >= 400)) {
    throw new Error(result.message || fallbackMessage);
  }
}

function notificationRepeatLabel(rule) {
  return ({ none: 'Keine Wiederholung', daily: 'Täglich', weekly: 'Wöchentlich', monthly: 'Monatlich' })[rule] || 'Keine Wiederholung';
}

async function notificationCreateReminder(event) {
  event.preventDefault();
  const form = event.target;
  const title = form.elements.title.value.trim();
  const dueAt = new Date(form.elements.dueAt.value);
  const repeatRule = form.elements.repeatRule.value;
  if (!title || Number.isNaN(dueAt.getTime()) || !['none', 'daily', 'weekly', 'monthly'].includes(repeatRule)) {
    await notifications.render('Bitte Titel, gültiges Datum/Uhrzeit und eine gültige Wiederholung auswählen.');
    return;
  }
  try {
    const result = await apiPost('/reminders', { title, dueAt: dueAt.toISOString(), repeatRule });
    notificationAssertApiSuccess(result, 'Der Server hat das Speichern der Erinnerung abgelehnt.');
    await notifications.render();
  } catch (error) {
    await notifications.render(`Erinnerung konnte nicht gespeichert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function notificationDeleteReminder(reminderId) {
  if (!confirm('Diese Erinnerung vom Server löschen?')) return;
  try {
    const result = await apiDelete(`/reminders/${encodeURIComponent(reminderId)}`);
    notificationAssertApiSuccess(result, 'Der Server hat das Löschen der Erinnerung abgelehnt.');
    await notifications.render();
  } catch (error) {
    await notifications.render(`Erinnerung konnte nicht gelöscht werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function notificationLoadAndCheckRemoteReminders(userId) {
  try {
    const result = await apiGet('/reminders');
    notificationAssertApiSuccess(result, 'Der Server hat das Laden der Erinnerungen abgelehnt.');
    const reminders = Array.isArray(result) ? result : result?.reminders;
    if (!Array.isArray(reminders)) throw new Error('Die Erinnerungs-Antwort vom Server hatte ein unerwartetes Format.');
    notificationCheckRemoteReminders(userId, reminders);
  } catch (error) {
    console.warn(`Geplante Erinnerungen konnten nicht aktualisiert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

function notificationCheckRemoteReminders(userId, reminders) {
  const sentKey = `remote_reminders_sent_${userId}`;
  let sent = {};
  try { sent = JSON.parse(localStorage.getItem(sentKey) || '{}'); } catch (_) {}
  let changed = false;
  const now = Date.now();
  reminders.forEach(reminder => {
    const dueAt = notificationCurrentOccurrence(reminder, now);
    if (!reminder.id || !reminder.title || !dueAt || dueAt.getTime() > now) return;
    const key = `${reminder.id}:${dueAt.toISOString()}`;
    if (sent[key]) return;
    const body = `Geplante Erinnerung (${notificationRepeatLabel(reminder.repeatRule)}).`;
    addNotification(userId, reminder.title, body, '⏰');
    notificationShowBrowser(reminder.title, body, `reminder-${key}`);
    sent[key] = new Date().toISOString();
    changed = true;
  });
  if (changed) localStorage.setItem(sentKey, JSON.stringify(sent));
}

function notificationCurrentOccurrence(reminder, now) {
  const anchor = new Date(reminder.dueAt);
  if (Number.isNaN(anchor.getTime()) || anchor.getTime() > now) return null;
  if (reminder.repeatRule === 'daily') {
    const intervals = Math.floor((now - anchor.getTime()) / 86400000);
    return new Date(anchor.getTime() + intervals * 86400000);
  }
  if (reminder.repeatRule === 'weekly') {
    const intervals = Math.floor((now - anchor.getTime()) / (7 * 86400000));
    return new Date(anchor.getTime() + intervals * 7 * 86400000);
  }
  if (reminder.repeatRule === 'monthly') {
    const months = (new Date(now).getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
      new Date(now).getUTCMonth() - anchor.getUTCMonth();
    const occurrenceForMonth = offset => {
      const targetMonth = anchor.getUTCMonth() + offset;
      const firstOfMonth = new Date(Date.UTC(anchor.getUTCFullYear(), targetMonth, 1, anchor.getUTCHours(), anchor.getUTCMinutes(), anchor.getUTCSeconds()));
      const day = Math.min(anchor.getUTCDate(), new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() + 1, 0)).getUTCDate());
      firstOfMonth.setUTCDate(day);
      return firstOfMonth;
    };
    let occurrence = occurrenceForMonth(months);
    if (occurrence.getTime() > now) occurrence = occurrenceForMonth(months - 1);
    return occurrence;
  }
  return anchor;
}

async function notificationCheckSchedules(userId) {
  const settings = notificationReadSettings(userId);
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (settings.dailySummary && settings.repeat !== 'none' && settings.time === currentTime) {
    const isDue = settings.repeat === 'daily' || (settings.repeat === 'weekly' && now.getDay() === Number(settings.weekday));
    const period = settings.repeat === 'weekly'
      ? (() => {
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        return `week-${monday.getFullYear()}-${monday.getMonth() + 1}-${monday.getDate()}`;
      })()
      : `day-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const sentKey = `notification_schedule_sent_${userId}`;
    if (isDue && localStorage.getItem(sentKey) !== period) {
      const title = 'Deine Lern-Erinnerung';
      const body = 'Zeit für deine geplante Lerneinheit.';
      addNotification(userId, title, body, '📚');
      notificationShowBrowser(title, body, `study-${userId}-${period}`);
      localStorage.setItem(sentKey, period);
    }
  }
  if (!settings.deadlineReminders) return;
  let tasks;
  try {
    tasks = (await loadTasks()).filter(task => String(task.user_id) === String(userId) && task.due_date && !task.completed);
  } catch (error) {
    const status = document.getElementById('notification-settings-status');
    if (status) {
      status.setAttribute('role', 'alert');
      status.textContent = `Aufgaben für Fälligkeitserinnerungen konnten nicht geladen werden: ${error.message || 'Unbekannter API-Fehler'}`;
    }
    return;
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const leadDays = Number(settings.reminderLeadHours) / 24;
  const sentKey = `deadline_reminders_sent_${userId}`;
  let sent = {};
  try {
    const saved = JSON.parse(localStorage.getItem(sentKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) sent = saved;
  } catch (_) {}
  let changed = false;
  tasks.forEach(task => {
    const dueDate = new Date(`${task.due_date}T00:00:00`);
    const daysUntil = (dueDate - today) / 86400000;
    const key = `${task.id}:${task.due_date}`;
    if (Number.isFinite(daysUntil) && daysUntil >= 0 && daysUntil <= leadDays && !sent[key]) {
      const body = `„${task.title}“ ist am ${task.due_date} fällig.`;
      addNotification(userId, 'Aufgabe bald fällig', body, '⏰');
      notificationShowBrowser('Aufgabe bald fällig', body, `deadline-${userId}-${key}`);
      sent[key] = new Date().toISOString();
      changed = true;
    }
  });
  if (changed) localStorage.setItem(sentKey, JSON.stringify(sent));
}
