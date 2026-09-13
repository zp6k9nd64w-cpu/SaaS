// Advanced Performance Reports
const reports = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const stats = calculateDetailedStats(userId);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📊 Leistungsbericht</h1>
        <p>Detaillierte Analyse deiner Lernaktivitäten und Fortschritt</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📈 Überblick</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Gesamt XP</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${stats.totalXP.toLocaleString()}</div>
            <p style="margin: 0; font-size: 0.85rem;">Level ${stats.currentLevel}</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Gesamte Lernzeit</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${stats.totalLearningHours}h</div>
            <p style="margin: 0; font-size: 0.85rem;">Diese Woche: ${stats.weeklyHours}h</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Gesamte Aktivitäten</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${stats.totalActivities}</div>
            <p style="margin: 0; font-size: 0.85rem;">Aufgaben, Quizzes, Notizen</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Durchschnittliche Note</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${stats.avgGrade}</div>
            <p style="margin: 0; font-size: 0.85rem;">Aus ${stats.totalGrades} Noten</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📚 Fachspezifische Leistung</h2>
        <div style="display: grid; gap: 1rem;">
          ${Object.entries(stats.subjectPerformance).map(([subject, data]) => `
            <div style="padding: 1rem; background: #f7f8ff; border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>${subject}</strong>
                <span style="color: #667eea; font-weight: bold;">${data.avgGrade}</span>
              </div>
              <div style="width: 100%; height: 8px; background: white; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                <div style="width: ${(data.avgGrade / 6) * 100}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2);"></div>
              </div>
              <p style="margin: 0; font-size: 0.85rem; color: #999;">📊 ${data.count} Einträge • 🎯 Ziel: ${data.goal}</p>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Aktivitätsverteilung</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: linear-gradient(135deg, #667eea15, #667eea40); border-radius: 10px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
            <p style="margin: 0.5rem 0; font-weight: bold;">${stats.totalTasks}</p>
            <p style="margin: 0; font-size: 0.9rem; color: #667eea;">Aufgaben abgeschlossen</p>
          </div>
          
          <div style="padding: 1rem; background: linear-gradient(135deg, #4facfe15, #4facfe40); border-radius: 10px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
            <p style="margin: 0.5rem 0; font-weight: bold;">${stats.totalQuizzes}</p>
            <p style="margin: 0; font-size: 0.9rem; color: #4facfe;">Quiz gelöst</p>
          </div>
          
          <div style="padding: 1rem; background: linear-gradient(135deg, #f093fb15, #f093fb40); border-radius: 10px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📖</div>
            <p style="margin: 0.5rem 0; font-weight: bold;">${stats.totalNotes}</p>
            <p style="margin: 0; font-size: 0.9rem; color: #f093fb;">Notizen erstellt</p>
          </div>
          
          <div style="padding: 1rem; background: linear-gradient(135deg, #4caf5015, #4caf5040); border-radius: 10px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔥</div>
            <p style="margin: 0.5rem 0; font-weight: bold;">${stats.maxStreak}</p>
            <p style="margin: 0; font-size: 0.9rem; color: #4caf50;">Tage Streak</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎓 Lernempfehlungen</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${getRecommendations(stats).map(rec => `
            <li style="padding: 1rem 0; border-bottom: 1px solid #eee;">
              <p style="margin: 0; font-weight: bold; color: #667eea;">${rec.icon} ${rec.title}</p>
              <p style="margin: 0.5rem 0 0 0; color: #666;">${rec.description}</p>
            </li>
          `).join('')}
        </ul>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="exportReport()">📥 Bericht exportieren (PDF)</button>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function calculateDetailedStats(userId) {
  const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
  const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]').filter(g => g.user_id === userId);
  const notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === userId);
  const quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]').filter(q => q.user_id === userId);
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === userId);
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"total_xp": 0, "level": 1}');
  
  // Calculate subject performance
  const subjectPerformance = {};
  grades.forEach(grade => {
    if (!subjectPerformance[grade.subject]) {
      subjectPerformance[grade.subject] = { grades: [], count: 0 };
    }
    subjectPerformance[grade.subject].grades.push(parseFloat(grade.grade));
    subjectPerformance[grade.subject].count++;
  });
  
  const subjectStats = {};
  Object.entries(subjectPerformance).forEach(([subject, data]) => {
    const avg = (data.grades.reduce((a, b) => a + b, 0) / data.grades.length).toFixed(2);
    subjectStats[subject] = {
      avgGrade: avg,
      count: data.count,
      goal: (Math.random() * 2 + 1).toFixed(2)
    };
  });
  
  const avgGrade = grades.length > 0 
    ? (grades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / grades.length).toFixed(2)
    : 'N/A';
  
  return {
    totalXP: xpData.total_xp,
    currentLevel: xpData.level,
    totalTasks: tasks.filter(t => t.completed).length,
    totalQuizzes: quizzes.length,
    totalNotes: notes.length,
    totalGrades: grades.length,
    avgGrade,
    totalActivities: tasks.length + quizzes.length + notes.length,
    totalLearningHours: Math.round((tasks.length + quizzes.length + notes.length) / 2),
    weeklyHours: Math.round(Math.random() * 10 + 5),
    maxStreak: habits.length > 0 ? Math.max(...habits.map(h => calculateHabitStreak(h))) : 0,
    subjectPerformance: subjectStats
  };
}

function getRecommendations(stats) {
  const recommendations = [];
  
  if (stats.totalTasks < 20) {
    recommendations.push({
      icon: '📌',
      title: 'Mehr Aufgaben bearbeiten',
      description: 'Du hast weniger als 20 Aufgaben bearbeitet. Erstelle mehr Aufgaben für bessere Fortschritte.'
    });
  }
  
  if (parseFloat(stats.avgGrade) > 3.5) {
    recommendations.push({
      icon: '📚',
      title: 'Schwierige Fächer üben',
      description: `Dein Durchschnitt ist ${stats.avgGrade}. Konzentriere dich auf schwierigere Themen.`
    });
  }
  
  if (stats.totalNotes < 10) {
    recommendations.push({
      icon: '📝',
      title: 'Mehr Notizen machen',
      description: 'Notizen helfen bei der Retention. Schreibe mehr detaillierte Notizen.'
    });
  }
  
  if (stats.maxStreak < 7) {
    recommendations.push({
      icon: '🔥',
      title: 'Konsistenz verbessern',
      description: 'Versuche, mindestens 7 Tage in Folge zu lernen für bessere Ergebnisse.'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      icon: '🌟',
      title: 'Du machst großartige Fortschritte!',
      description: 'Weiter so! Du bist auf dem richtigen Weg zum Erfolg.'
    });
  }
  
  return recommendations;
}

function exportReport() {
  alert('📥 Report-Export wird vorbereitet...\n(PDF-Export kommt bald!)');
}
