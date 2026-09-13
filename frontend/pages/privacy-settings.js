// Privacy Settings - Datenschutz & Profile Visibility
const privacySettings = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const privacyData = JSON.parse(localStorage.getItem(`privacy_${userId}`) || '{}');
    
    const defaults = {
      profile_visibility: 'friends',
      show_level: true,
      show_achievements: true,
      show_stats: false,
      allow_messages: 'friends',
      allow_challenges: 'friends',
      show_in_leaderboard: true,
      data_collection: true
    };
    
    const settings = { ...defaults, ...privacyData };
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🔐 Datenschutz & Privatsphäre</h1>
        <p>Kontrolliere wer dein Profil sehen kann</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>👤 Profil-Sichtbarkeit</h2>
        <div style="display: grid; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Profil sichtbar für:</label>
            <select style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px;" onchange="updatePrivacySetting('profile_visibility', this.value)">
              <option value="public" ${settings.profile_visibility === 'public' ? 'selected' : ''}>🌐 Öffentlich (Alle)</option>
              <option value="friends" ${settings.profile_visibility === 'friends' ? 'selected' : ''}>👥 Nur Freunde</option>
              <option value="private" ${settings.profile_visibility === 'private' ? 'selected' : ''}>🔒 Privat (Nur ich)</option>
            </select>
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Nachrichten von:</label>
            <select style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px;" onchange="updatePrivacySetting('allow_messages', this.value)">
              <option value="anyone" ${settings.allow_messages === 'anyone' ? 'selected' : ''}>Jedem erlauben</option>
              <option value="friends" ${settings.allow_messages === 'friends' ? 'selected' : ''}>Nur Freunden</option>
              <option value="none" ${settings.allow_messages === 'none' ? 'selected' : ''}>Niemandem</option>
            </select>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Statistiken & Ranking</h2>
        <div style="display: grid; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.show_level ? 'checked' : ''} onchange="updatePrivacySetting('show_level', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Mein Level anzeigen</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Zeige mein aktuelles Level auf meinem Profil</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.show_achievements ? 'checked' : ''} onchange="updatePrivacySetting('show_achievements', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Achievements anzeigen</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Zeige meine Abzeichen und Erfolge</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.show_stats ? 'checked' : ''} onchange="updatePrivacySetting('show_stats', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Detaillierte Statistiken</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Zeige meine Lernstatistiken anderen</p>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.show_in_leaderboard ? 'checked' : ''} onchange="updatePrivacySetting('show_in_leaderboard', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Im Leaderboard anzeigen</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Mein Rank im globalen Leaderboard</p>
            </div>
          </label>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🔧 Datenverarbeitung</h2>
        <div style="display: grid; gap: 1rem;">
          <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; padding: 0.75rem; background: #f7f8ff; border-radius: 8px;">
            <input type="checkbox" ${settings.data_collection ? 'checked' : ''} onchange="updatePrivacySetting('data_collection', this.checked)" style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <strong>Anonyme Datenerfassung</strong>
              <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">Hilf uns mit anonymen Daten die App zu verbessern</p>
            </div>
          </label>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>⚠️ Datenschutz</h2>
        <div style="display: grid; gap: 0.75rem; font-size: 0.9rem; color: #666;">
          <p>📋 <strong>Datenrichtlinie:</strong> Deine Daten sind verschlüsselt und sicher</p>
          <p>🗑️ <strong>Datenlöschung:</strong> Du kannst jederzeit dein Konto löschen</p>
          <p>📤 <strong>Export:</strong> Lade deine Daten als JSON herunter</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
          <button class="btn btn-secondary" onclick="exportUserData()">📥 Daten exportieren</button>
          <button class="btn btn-secondary" onclick="deleteAccount()">🗑️ Konto löschen</button>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function updatePrivacySetting(key, value) {
  const userId = appState.user.id;
  let privacy = JSON.parse(localStorage.getItem(`privacy_${userId}`) || '{}');
  privacy[key] = value;
  localStorage.setItem(`privacy_${userId}`, JSON.stringify(privacy));
}

function exportUserData() {
  const userId = appState.user.id;
  const data = {
    user: JSON.parse(localStorage.getItem(`user_${userId}`) || '{}'),
    xp: JSON.parse(localStorage.getItem(`xp_${userId}`) || '{}'),
    achievements: JSON.parse(localStorage.getItem(`achievements_${userId}`) || '[]'),
    privacy: JSON.parse(localStorage.getItem(`privacy_${userId}`) || '{}')
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user_data_${userId}.json`;
  a.click();
  
  alert('✅ Deine Daten wurden heruntergeladen!');
}

function deleteAccount() {
  if (confirm('⚠️ WARNUNG: Dies kann nicht rückgängig gemacht werden. Alle deine Daten werden gelöscht. Willst du fortfahren?')) {
    const userId = appState.user.id;
    localStorage.removeItem(`user_${userId}`);
    localStorage.removeItem(`xp_${userId}`);
    localStorage.removeItem(`achievements_${userId}`);
    alert('❌ Konto gelöscht');
    window.location.hash = '#/login';
  }
}
