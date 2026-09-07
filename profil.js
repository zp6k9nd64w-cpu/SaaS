// Profile Page
const profil = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    const streak = mockDB.getStreak(appState.user.id);
    
    const main = createPageContainer(`
      <!-- PROFILE HEADER -->
      <div class="page-card profile-card">
        <h1>👤 Mein Konto</h1>
        <div style="background: linear-gradient(135deg, #667eea15, #764ba215); padding: 1.5rem; border-radius: 12px; margin: 1rem 0;">
          <p style="margin: 0.5rem 0;"><strong>Name:</strong> ${appState.user.username}</p>
          <p style="margin: 0.5rem 0;"><strong>E-Mail:</strong> ${appState.user.email}</p>
          ${appState.user.schoolType ? `<p style="margin: 0.5rem 0;"><strong>Schulart:</strong> ${appState.user.schoolType}</p>` : ''}
          ${appState.user.schoolClass ? `<p style="margin: 0.5rem 0;"><strong>Klasse:</strong> ${appState.user.schoolClass}</p>` : ''}
          ${appState.user.birthdate ? `<p style="margin: 0.5rem 0;"><strong>Geburtsdatum:</strong> ${appState.user.birthdate}</p>` : ''}
          <p style="margin: 0.5rem 0;"><strong>Abonnement:</strong> <span style="color: #667eea; font-weight: bold;">${appState.subscription}</span></p>
          <p style="margin: 0.5rem 0;"><strong>🔥 Lern-Streak:</strong> <span style="color: #ff6b6b; font-weight: bold;">${streak.count} Tage</span></p>
        </div>
      </div>

      <!-- MAIN FEATURE HUB -->
      <div class="page-card" style="margin-top: 1.5rem;">
        <h2>📚 ALLE FEATURES</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
          
          <!-- Learning Section -->
          <div style="border: 1px solid #667eea; border-radius: 12px; padding: 1.5rem; background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: #667eea; margin: 0 0 1rem 0;">📚 LERNEN</h3>
            <a href="#/quiz" class="nav-feature-link">🎯 Quiz</a>
            <a href="#/exam-simulator" class="nav-feature-link">📝 Prüfungen</a>
            <a href="#/spaced-repetition" class="nav-feature-link">🧠 Flashcards</a>
            <a href="#/notes" class="nav-feature-link">📝 Notizen</a>
            <a href="#/aufgaben" class="nav-feature-link">✅ Aufgaben</a>
            <a href="#/habits" class="nav-feature-link">🎯 Gewohnheiten</a>
            <a href="#/faecher" class="nav-feature-link">📚 Fächer</a>
            <a href="#/study-plans" class="nav-feature-link">📋 Pläne</a>
          </div>

          <!-- Analytics Section -->
          <div style="border: 1px solid #667eea; border-radius: 12px; padding: 1.5rem; background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: #667eea; margin: 0 0 1rem 0;">📈 ANALYTICS</h3>
            <a href="#/analytics" class="nav-feature-link">📊 Statistiken</a>
            <a href="#/comparative-analytics" class="nav-feature-link">🔄 Vergleich</a>
            <a href="#/reports" class="nav-feature-link">📋 Reports</a>
            <a href="#/streak-calendar" class="nav-feature-link">🔥 Streaks</a>
            <a href="#/activity-feed" class="nav-feature-link">📰 Activity Feed</a>
          </div>

          <!-- Gamification Section -->
          <div style="border: 1px solid #667eea; border-radius: 12px; padding: 1.5rem; background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: #667eea; margin: 0 0 1rem 0;">🎮 SPIELE</h3>
            <a href="#/daily-rewards" class="nav-feature-link">🎁 Belohnungen</a>
            <a href="#/achievements" class="nav-feature-link">🎖️ Achievements</a>
            <a href="#/badge-shop" class="nav-feature-link">🏅 Badge Shop</a>
            <a href="#/leaderboard" class="nav-feature-link">🏆 Leaderboard</a>
            <a href="#/tournaments" class="nav-feature-link">🏆 Turniere</a>
            <a href="#/skill-tree" class="nav-feature-link">⚔️ Skills</a>
            <a href="#/challenges" class="nav-feature-link">⚡ Challenges</a>
          </div>

          <!-- Social Section -->
          <div style="border: 1px solid #667eea; border-radius: 12px; padding: 1.5rem; background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: #667eea; margin: 0 0 1rem 0;">👥 SOZIAL</h3>
            <a href="#/friends" class="nav-feature-link">👥 Freunde</a>
            <a href="#/messages" class="nav-feature-link">💬 Nachrichten</a>
            <a href="#/study-groups" class="nav-feature-link">📚 Gruppen</a>
            <a href="#/mentorship" class="nav-feature-link">👨‍🏫 Mentoring</a>
            <a href="#/notifications" class="nav-feature-link">🔔 Benachrichtigungen</a>
          </div>

          <!-- Tools Section -->
          <div style="border: 1px solid #667eea; border-radius: 12px; padding: 1.5rem; background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: #667eea; margin: 0 0 1rem 0;">🛠️ TOOLS</h3>
            <a href="#/timer" class="nav-feature-link">⏱️ Timer</a>
            <a href="#/ai-coach" class="nav-feature-link">🤖 AI Coach</a>
            <a href="#/resource-library" class="nav-feature-link">📚 Resources</a>
            <a href="#/media-library" class="nav-feature-link">🎥 Videos</a>
            <a href="#/certifications" class="nav-feature-link">🎓 Zertifikate</a>
          </div>

          <!-- Settings Section -->
          <div style="border: 1px solid #667eea; border-radius: 12px; padding: 1.5rem; background: rgba(102, 126, 234, 0.05);">
            <h3 style="color: #667eea; margin: 0 0 1rem 0;">⚙️ EINSTELLUNGEN</h3>
            <a href="#/theme-customization" class="nav-feature-link">🎨 Themes</a>
            <a href="#/privacy-settings" class="nav-feature-link">🔐 Privacy</a>
            <a href="#/email-notifications" class="nav-feature-link">📧 E-Mail</a>
            <a href="#/subscription-plans" class="nav-feature-link">💳 Abos</a>
          </div>
        </div>
      </div>
      
      <!-- SETTINGS -->
      <div class="page-card" style="margin-top: 1.5rem;">
        <h2>⚙️ Kontoeinstellungen</h2>
        <div class="button-group">
          <button class="btn btn-primary" onclick="requestNotificationPermission()">🔔 Benachrichtigungen</button>
          <button class="btn btn-secondary" onclick="toggleDarkMode()">🌙 Dark Mode</button>
        </div>
        ${appState.subscription === 'Elite' ? `
          <div style="margin-top: 1rem;">
            <button class="btn btn-primary" style="width: 100%;" onclick="enableOfflineMode()">📱 Offline-Modus aktivieren</button>
          </div>
        ` : `
          <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 1rem; border-radius: 10px; margin-top: 1rem;">
            <p style="margin: 0; color: #856404;">💡 <strong>Offline-Modus</strong> ist nur im Elite-Abonnement verfügbar. Upgrade jetzt!</p>
          </div>
        `}
      </div>
      
      <!-- DATA MANAGEMENT -->
      <div class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Daten-Management</h2>
        <div class="button-group">
          <button class="btn btn-primary" onclick="exportDataAsCSV()">📥 CSV exportieren</button>
          <button class="btn btn-primary" onclick="exportDataAsJSON()">📥 JSON exportieren</button>
        </div>
      </div>
      
      <!-- ACCOUNT MANAGEMENT -->
      <div class="page-card" style="margin-top: 1.5rem; border: 2px solid #ff6b6b;">
        <h2>🔐 Konto</h2>
        <div class="button-group">
          <button class="btn btn-secondary" onclick="router.navigate('/abo')">📦 Abo verwalten</button>
          <button class="btn btn-danger" onclick="logoutUser()">🚪 Abmelden</button>
        </div>
      </div>
    `);
    renderPageShell(main);
  }
};
