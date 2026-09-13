// Dashboard Page
const dashboard = {
  render: async () => {
    if (!requireAuth()) return;
    mockDB.init();
    const tasks = await loadTasks();
    const grades = await loadGrades();
    const reminders = mockDB.getReminders(appState.user.id);
    const streak = mockDB.getStreak(appState.user.id);

    checkBadges(appState.user.id);
    checkReminders();

    const completionRate = Math.min(100, Math.round((tasks.filter((task) => task.completed).length / Math.max(tasks.length, 1)) * 100));

    const main = createPageContainer(`
      <section class="dashboard-hero">
        <div class="page-card dashboard-welcome">
          <span class="eyebrow">Executive Workspace</span>
          <h1>Hallo ${appState.user.username}</h1>
          <p>Dein Lernfortschritt wird hier in einem klaren, kontrollierten Überblick zusammengefasst.</p>
          <div class="dashboard-badges">
            <span class="badge">${appState.subscription} Abonnement</span>
            <span class="badge badge--soft">${completionRate}% abgeschlossen</span>
          </div>
        </div>
        <div class="page-card dashboard-metrics">
          <div>
            <strong>${tasks.length}</strong>
            <span>aktive Aufgaben</span>
          </div>
          <div>
            <strong>${grades.length}</strong>
            <span>bewertete Tests</span>
          </div>
          <div>
            <strong>🔥 ${streak.count}</strong>
            <span>Streak Tage</span>
          </div>
        </div>
      </section>

      ${reminders.length > 0 ? `
      <section class="page-card reminder-card">
        <h2>📌 Anstehende Aufgaben</h2>
        <div class="task-list">
          ${reminders.slice(0, 3).map((t) => `
            <div class="task-item">
              <strong>${t.title}</strong>
              <small>${formatDate(t.due_date)}</small>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <section class="dashboard-grid">
        <div class="card progress-card">
          <h2>Lernfortschritt</h2>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionRate}%;">${completionRate}%</div>
          </div>
          <p class="subtle-text">Die Plattform passt die nächsten Schritte an deine aktuelle Leistung an.</p>
        </div>
        <div class="card streak-card">
          <h2>Lernstreak-Tracker</h2>
          <p>🔥 Du bist auf einer ${streak.count}-Tage-Streak. Bleib dran!</p>
        </div>
      </section>

      <section class="dashboard-links">
        <h2>Schnellzugriff</h2>
        <div class="link-grid">
          ${[
            { title: 'Statistiken', description: 'Dein Lernfortschritt in Diagrammen & Statistiken.', route: '/statistiken', available: true, note: 'Ansehen' },
            { title: 'Lernziele', description: 'Setze Ziele und verfolge deinen Fortschritt.', route: '/goals', available: true, note: 'Ziele verwalten' },
            { title: 'Wochenbericht', description: 'Übersicht deiner Leistung für diese Woche.', route: '/weekly-summary', available: true, note: 'Anschauen' },
            { title: 'Timer', description: 'Pomodoro-Timer für konzentriertes Lernen.', route: '/timer', available: true, note: 'Timer starten' },
            { title: 'Fächer', description: 'Verwalte deine Schulfächer und Kurse.', route: '/faecher', available: true, note: 'Fächer verwalten' },
            { title: 'AI-Lern-Assistent', description: 'Direkte Lernhilfe für Aufgaben und Fragen.', route: '/ai-assistent', available: appState.subscription !== 'Free', note: appState.subscription === 'Free' ? 'Verfügbar ab Core' : 'Jetzt nutzen' },
            { title: 'Tests', description: 'Erzeuge individuelle Prüfungsvorbereitung nach Fach.', route: '/tests', available: true, note: 'Direkt starten' },
            { title: 'Kalender', description: 'Plane deine Aufgaben und Termine übersichtlich.', route: '/kalender', available: true, note: 'Zur Planung' },
            { title: 'Noten', description: 'Überblick über deine aktuellen Noten und Entwicklungen.', route: '/noten', available: true, note: 'Mehr erfahren' },
            { title: 'Aufgaben', description: 'Sieh deine To-Dos und füge neue Aufgaben hinzu.', route: '/aufgaben', available: true, note: 'Aufgaben öffnen' },
            { title: 'Abo verwalten', description: 'Upgrade für mehr Funktionen und KI-Zugriff.', route: '/abo', available: true, note: 'Jetzt ansehen' }
          ].map((item) => `
            <div class="card nav-card ${item.available ? '' : 'locked'}" style="cursor: pointer;" onclick="router.navigate('${item.available ? item.route : '/abo'}')">
              <h3>${item.title}</h3>
              <p>${item.description}</p>
              <div class="nav-card-footer">
                <span class="note">${item.note}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="card tasks-card">
          <h2>Aktuelle Aufgaben</h2>
          <div class="task-list">
            ${tasks.slice(0, 5).map((t) => `<div class="task-item"><strong>${t.title}</strong><br><small>${formatDate(t.due_date)}</small></div>`).join('')}
          </div>
        </div>
        <div class="card grades-card">
          <h2>Notenübersicht</h2>
          <div class="grade-list">
            ${grades.slice(0, 5).map((g) => `<div class="grade-item"><strong>${g.subject}</strong>: ${g.grade}</div>`).join('')}
          </div>
        </div>
      </section>
    `);
    renderPageShell(main);
  }
};
