// Weekly Summary Page
const weeklySummary = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
    const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]').filter(g => g.user_id === userId);
    const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]').filter(g => g.user_id === userId);
    const streakData = JSON.parse(localStorage.getItem('saasDB_streaks') || '{}');
    
    // Calculate week start (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysBack);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Filter for this week
    const weekTasks = tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
    
    const weekGrades = grades.filter(g => {
      const gradeDate = new Date(g.date);
      return gradeDate >= weekStart && gradeDate <= weekEnd;
    });
    
    const completedTasks = weekTasks.filter(t => t.completed).length;
    const completionRate = weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 0;
    const avgGrade = weekGrades.length > 0 ? (weekGrades.reduce((sum, g) => sum + g.grade, 0) / weekGrades.length).toFixed(2) : 'N/A';
    const goalsCompleted = goals.filter(g => g.progress > 0).length;
    const streak = streakData[userId]?.streak || 0;
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📊 Wochenzusammenfassung</h1>
        <p>Übersicht deiner Leistungen für diese Woche</p>
      </div>
      
      <div class="stats-grid" style="margin-bottom: 2rem;">
        <div class="stat-box">
          <div class="stat-value">${completionRate}%</div>
          <div class="stat-label">Aufgaben erledigt</div>
          <small>${completedTasks} von ${weekTasks.length}</small>
        </div>
        <div class="stat-box">
          <div class="stat-value">${avgGrade}</div>
          <div class="stat-label">Durchschnittliche Note</div>
          <small>${weekGrades.length} Noten</small>
        </div>
        <div class="stat-box">
          <div class="stat-value">${goalsCompleted}</div>
          <div class="stat-label">Ziele bearbeitet</div>
          <small>Diese Woche</small>
        </div>
        <div class="stat-box">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">Lern-Streak</div>
          <small>Tage in Folge</small>
        </div>
      </div>
      
      <section class="page-card">
        <h2>📝 Aufgaben dieser Woche</h2>
        <div style="display: grid; gap: 1rem;">
          ${weekTasks.length > 0
            ? weekTasks.map(t => `
                <div class="task-item">
                  <div style="display: flex; align-items: start; gap: 1rem;">
                    <span style="font-size: 1.2rem;">${t.completed ? '✅' : '⏳'}</span>
                    <div style="flex: 1;">
                      <strong>${t.title}</strong>
                      <p style="margin: 0.25rem 0; color: #666;">${t.description}</p>
                      <small style="color: #999;">Fällig: ${formatDate(t.due_date)}</small>
                    </div>
                  </div>
                </div>
              `).join('')
            : '<p style="color: #999;">Keine Aufgaben diese Woche</p>'
          }
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📚 Noten dieser Woche</h2>
        <div style="display: grid; gap: 1rem;">
          ${weekGrades.length > 0
            ? weekGrades.map(g => `
                <div class="task-item">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong>${g.subject}</strong>
                      <p style="margin: 0.25rem 0; color: #666;">Datum: ${formatDate(g.date)}</p>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${g.grade}</div>
                      <small style="color: #999;">${g.type}</small>
                    </div>
                  </div>
                </div>
              `).join('')
            : '<p style="color: #999;">Keine Noten diese Woche</p>'
          }
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Tipps zur Steigerung deiner Produktivität</h2>
        <div style="background: linear-gradient(135deg, #667eea15, #764ba215); padding: 1.5rem; border-radius: 12px; border-left: 4px solid #667eea;">
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 0.5rem 0;">✨ Nutze den Pomodoro-Timer für konzentriertes Lernen</li>
            <li style="padding: 0.5rem 0;">📚 Organisiere deine Aufgaben nach Fächern</li>
            <li style="padding: 0.5rem 0;">🎯 Setze dir wöchentliche Lernziele</li>
            <li style="padding: 0.5rem 0;">🔔 Aktiviere Benachrichtigungen für Erinnerungen</li>
            <li style="padding: 0.5rem 0;">💾 Nutze den Offline-Modus mit Elite (auch unterwegs Zugriff)</li>
          </ul>
        </div>
      </section>
      
      <div class="page-actions">
        <button class="btn btn-primary" onclick="router.navigate('/aufgaben')">Aufgaben anschauen</button>
        <button class="btn btn-secondary" onclick="router.navigate('/dashboard')">Zum Dashboard</button>
      </div>
    `);
    
    renderPageShell(main);
  }
};
