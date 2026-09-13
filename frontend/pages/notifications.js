// Advanced Notifications Hub
const notifications = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const allNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]').sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    const unreadCount = allNotifications.filter(n => !n.read).length;
    const grouped = groupNotificationsByDate(allNotifications);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🔔 Benachrichtigungen</h1>
        <p>Bleibe über wichtige Ereignisse auf dem Laufenden</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">${unreadCount}</div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Ungelesen</p>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">${allNotifications.length}</div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Insgesamt</p>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: center;">
            ${unreadCount > 0 ? `
              <button class="btn btn-secondary" onclick="markAllAsRead()" style="flex: 1;">✓ Alle lesen</button>
              <button class="btn btn-secondary" onclick="clearAllNotifications()" style="flex: 1;">🗑️ Löschen</button>
            ` : '<p style="color: #999;">Keine neuen Benachrichtigungen</p>'}
          </div>
        </div>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📨 Benachrichtigungen</h2>
        ${Object.entries(grouped).length > 0
          ? Object.entries(grouped).map(([date, notifs]) => `
              <div style="margin-bottom: 2rem;">
                <h3 style="color: #999; margin-bottom: 1rem; font-size: 0.9rem;">📅 ${date}</h3>
                <div style="display: grid; gap: 0.75rem;">
                  ${notifs.map(notif => `
                    <div class="task-item" style="border-left: 4px solid ${notif.read ? '#ddd' : '#667eea'}; opacity: ${notif.read ? '0.7' : '1'}; padding-left: 1rem;">
                      <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem;">
                            <span style="font-size: 1.3rem;">${notif.icon}</span>
                            <strong>${notif.title}</strong>
                            ${!notif.read ? '<span style="background: #667eea; color: white; padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.7rem; font-weight: bold;">NEU</span>' : ''}
                          </div>
                          <p style="margin: 0.25rem 0; color: #666;">${notif.message}</p>
                          <p style="margin: 0; font-size: 0.85rem; color: #999;">⏰ ${notif.createdAt}</p>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                          ${notif.action ? `<button class="btn btn-sm btn-primary" onclick="handleNotificationAction('${notif.id}')">${notif.action}</button>` : ''}
                          <button class="btn btn-sm btn-secondary" onclick="deleteNotification('${notif.id}')">✕</button>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')
          : '<p style="color: #999; text-align: center; padding: 2rem;">Keine Benachrichtigungen. Du bist auf dem neuesten Stand! 🎉</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>⚙️ Benachrichtigungseinstellungen</h2>
        <div style="display: grid; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" checked style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Nachrichten von Freunden</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Erhalte Benachrichtigungen wenn dir Freunde schreiben</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" checked style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Lernziel-Reminders</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Erhalte Reminders für deine Lernziele</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" checked style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Achievement Unlock-Alerts</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Benachrichtigungen wenn du Abzeichen freischaltest</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" checked style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Tägliche Zusammenfassung</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Täglich eine Zusammenfassung um 19:00</p>
            </div>
          </label>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function groupNotificationsByDate(notifs) {
  const grouped = {};
  
  notifs.forEach(notif => {
    const date = new Date(notif.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateLabel;
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Gestern';
    } else {
      dateLabel = date.toLocaleDateString('de-DE');
    }
    
    if (!grouped[dateLabel]) {
      grouped[dateLabel] = [];
    }
    grouped[dateLabel].push(notif);
  });
  
  return grouped;
}

function markAllAsRead() {
  const userId = appState.user.id;
  const allNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  
  allNotifications.forEach(n => n.read = true);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(allNotifications));
  
  notifications.render();
}

function clearAllNotifications() {
  if (confirm('Alle Benachrichtigungen löschen?')) {
    const userId = appState.user.id;
    localStorage.setItem(`notifications_${userId}`, JSON.stringify([]));
    notifications.render();
  }
}

function deleteNotification(notifId) {
  const userId = appState.user.id;
  const allNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  const filtered = allNotifications.filter(n => n.id !== notifId);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(filtered));
  notifications.render();
}

function handleNotificationAction(notifId) {
  const userId = appState.user.id;
  const allNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  const notif = allNotifications.find(n => n.id === notifId);
  
  if (notif && notif.actionType === 'view_achievement') {
    router.navigate('/achievements');
  } else if (notif && notif.actionType === 'join_event') {
    router.navigate('/challenges');
  }
  
  deleteNotification(notifId);
}

// Push new notification
function addNotification(userId, title, message, icon, actionType = null) {
  let notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  
  notifications.push({
    id: Date.now().toString(),
    title,
    message,
    icon,
    action: actionType ? '👉 Jetzt ansehen' : null,
    actionType,
    read: false,
    createdAt: new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})
  });
  
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications = notifications.slice(-50);
  }
  
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
}
