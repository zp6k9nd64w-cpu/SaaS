const statistiken = {
  render: async () => {
    if (!requireAuth()) return;
    const stats = calculateStatistics();
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Dein Lernfortschritt</h1>
        <p>Übersicht deiner Statistiken und Entwicklung</p>
      </div>
      
      <section class="stats-grid">
        <div class="stat-box">
          <strong>${stats.completionRate}%</strong>
          <span>Aufgabenquote</span>
          <div class="progress-bar" style="margin-top: 0.5rem;">
            <div class="progress-fill" style="width: ${stats.completionRate}%;"></div>
          </div>
        </div>
        
        <div class="stat-box">
          <strong>${stats.completedTasks}/${stats.totalTasks}</strong>
          <span>Aufgaben erledigt</span>
        </div>
        
        <div class="stat-box">
          <strong>${stats.avgGrade}</strong>
          <span>Durchschnittsnote</span>
        </div>
        
        <div class="stat-box">
          <strong>🔥 ${stats.streak}</strong>
          <span>Tage Streak</span>
        </div>
      </section>
      
      <section class="page-card">
        <h2>Noten nach Fach</h2>
        <div class="subject-stats">
          ${Object.entries(stats.subjectAverages).length > 0
            ? Object.entries(stats.subjectAverages).map(([subject, avg]) => `
                <div class="subject-stat">
                  <strong>${subject}</strong>
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(avg / 6) * 100}%;"></div>
                  </div>
                  <span>${avg}</span>
                </div>
              `).join('')
            : '<p>Noch keine Noten vorhanden.</p>'
          }
        </div>
      </section>
      
      <section class="page-card">
        <h2>Abzeichen</h2>
        <div class="badges-grid">
          ${(() => {
            mockDB.init();
            const badges = mockDB.getBadges(appState.user.id);
            return badges.length > 0
              ? badges.map(b => `
                  <div class="badge-item">
                    <span class="badge-icon">${b.icon}</span>
                    <strong>${b.name}</strong>
                    <p>${b.description}</p>
                  </div>
                `).join('')
              : '<p>Arbeite weiter – schalte Abzeichen frei!</p>';
          })()}
        </div>
      </section>
      
      <section class="page-card">
        <h2>Deine Daten</h2>
        <button class="btn" onclick="exportDataAsCSV()">Als CSV exportieren</button>
        <button class="btn btn-secondary" onclick="exportDataAsJSON()" style="margin-left: 0.5rem;">Als JSON exportieren</button>
      </section>
    `);
    
    renderPageShell(main);
  }
};
