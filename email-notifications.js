// Email Notifications System
const emailNotifications = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const emailSettings = JSON.parse(localStorage.getItem(`email_settings_${userId}`) || '{}');
    const emailHistory = JSON.parse(localStorage.getItem(`email_history_${userId}`) || '[]');
    
    const defaultSettings = {
      daily_digest: true,
      achievements: true,
      friend_requests: true,
      level_ups: true,
      reminders: true,
      challenges: true,
      email_addr: appState.user.email || 'user@example.com'
    };
    
    const settings = { ...defaultSettings, ...emailSettings };
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📧 Email Benachrichtigungen</h1>
        <p>Verwalte deine Email-Mitteilungen</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📬 Email-Adresse</h2>
        <div style="display: grid; gap: 1rem;">
          <input type="email" id="emailAddr" value="${settings.email_addr}" style="padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;">
          <button class="btn btn-primary" onclick="saveEmailAddress()">💾 Speichern</button>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>⚙️ Benachrichtigungs-Einstellungen</h2>
        <div style="display: grid; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.daily_digest ? 'checked' : ''} onchange="updateEmailSetting('daily_digest', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>🌙 Tägliche Zusammenfassung</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Jeden Abend um 19:00 Uhr</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.achievements ? 'checked' : ''} onchange="updateEmailSetting('achievements', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>🎖️ Achievements</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Sofort wenn du Abzeichen unlockst</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.level_ups ? 'checked' : ''} onchange="updateEmailSetting('level_ups', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>⭐ Level-Ups</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Herzlichen Glückwunsch zum nächsten Level</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.friend_requests ? 'checked' : ''} onchange="updateEmailSetting('friend_requests', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>👥 Freundschaftsanfragen</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Wenn dir jemand folgen möchte</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.reminders ? 'checked' : ''} onchange="updateEmailSetting('reminders', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>⏰ Erinnerungen</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Erinnerungen an überfällige Aufgaben</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.challenges ? 'checked' : ''} onchange="updateEmailSetting('challenges', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>⚡ Tägliche Challenges</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Neue Herausforderungen verfügbar</p>
            </div>
          </label>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📬 Email-Verlauf</h2>
        ${emailHistory.length > 0
          ? `<div style="display: grid; gap: 0.75rem;">
              ${emailHistory.slice(-5).reverse().map(email => `
                <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px; border-left: 4px solid #667eea;">
                  <p style="margin: 0 0 0.25rem 0; font-weight: bold;">${email.subject}</p>
                  <p style="margin: 0; font-size: 0.85rem; color: #999;">📅 ${email.date}</p>
                </div>
              `).join('')}
            </div>`
          : '<p style="color: #999; text-align: center; padding: 1rem;">Noch keine Emails versendet</p>'
        }
      </section>
    `);
    
    renderPageShell(main);
  }
};

function updateEmailSetting(key, value) {
  const userId = appState.user.id;
  let settings = JSON.parse(localStorage.getItem(`email_settings_${userId}`) || '{}');
  settings[key] = value;
  localStorage.setItem(`email_settings_${userId}`, JSON.stringify(settings));
}

function saveEmailAddress() {
  const userId = appState.user.id;
  const email = document.getElementById('emailAddr').value;
  
  if (!email.includes('@')) {
    alert('❌ Bitte gib eine gültige Email-Adresse ein');
    return;
  }
  
  let settings = JSON.parse(localStorage.getItem(`email_settings_${userId}`) || '{}');
  settings.email_addr = email;
  localStorage.setItem(`email_settings_${userId}`, JSON.stringify(settings));
  
  alert('✅ Email-Adresse gespeichert!');
}

function sendTestEmail() {
  const userId = appState.user.id;
  let history = JSON.parse(localStorage.getItem(`email_history_${userId}`) || '[]');
  history.push({
    subject: 'Test Email - Alles funktioniert!',
    date: new Date().toLocaleString('de-DE')
  });
  localStorage.setItem(`email_history_${userId}`, JSON.stringify(history));
  alert('✅ Test-Email versendet!');
}
