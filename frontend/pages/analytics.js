// Advanced Study Analytics Page
const analytics = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
    const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]').filter(g => g.user_id === userId);
    const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === userId);
    
    // Berechne Statistiken
    const completionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0;
    const avgGrade = grades.length > 0 ? (grades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / grades.length).toFixed(2) : 'N/A';
    const highestGrade = grades.length > 0 ? Math.min(...grades.map(g => parseFloat(g.grade))) : 'N/A';
    const lowestGrade = grades.length > 0 ? Math.max(...grades.map(g => parseFloat(g.grade))) : 'N/A';
    
    // Subject Performance
    const subjectPerformance = {};
    grades.forEach(grade => {
      if (!subjectPerformance[grade.subject]) {
        subjectPerformance[grade.subject] = { grades: [], count: 0 };
      }
      subjectPerformance[grade.subject].grades.push(parseFloat(grade.grade));
      subjectPerformance[grade.subject].count++;
    });
    
    const subjectAvgs = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      avg: (data.grades.reduce((a, b) => a + b, 0) / data.grades.length).toFixed(2),
      count: data.count
    })).sort((a, b) => a.avg - b.avg);
    
    // Weekly stats (last 7 days)
    const lastWeek = new Array(7).fill(0);
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      lastWeek[6 - i] = tasks.filter(t => t.completed && t.dueDate.includes(dateStr.substring(5))).length;
    }
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📊 Study Analytics</h1>
        <p>Detaillierte Analyse deines Lernfortschritts</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📈 Wichtigste Kennzahlen</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Abschlussquote</p>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 0.5rem 0;">${completionRate}%</div>
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; overflow: hidden;">
              <div style="width: ${completionRate}%; height: 100%; background: white;"></div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Durchschnittliche Note</p>
            <div style="font-size: 2.5rem; font-weight: bold;">${avgGrade}</div>
            <p style="margin: 0.5rem 0; font-size: 0.85rem;">Aus ${grades.length} Noten</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Beste Note</p>
            <div style="font-size: 2.5rem; font-weight: bold;">${highestGrade}</div>
            <p style="margin: 0.5rem 0; font-size: 0.85rem;">Dein Persönliches Best</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Schwäche</p>
            <div style="font-size: 2.5rem; font-weight: bold;">${lowestGrade}</div>
            <p style="margin: 0.5rem 0; font-size: 0.85rem;">Zu verbessern</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Leistung nach Fach</h2>
        <div style="display: grid; gap: 1rem;">
          ${subjectAvgs.length > 0
            ? subjectAvgs.map(subj => `
                <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 1rem; align-items: center; padding: 1rem; background: #f7f8ff; border-radius: 10px;">
                  <div>
                    <strong>${subj.subject}</strong>
                    <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${subj.count} ${subj.count === 1 ? 'Note' : 'Noten'}</p>
                  </div>
                  <div style="width: 200px; height: 30px; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
                    <div style="width: ${(parseFloat(subj.avg) / 6) * 100}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); position: relative;">
                      <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: white; font-size: 0.85rem; font-weight: bold;">${subj.avg}</span>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <strong style="color: ${parseFloat(subj.avg) <= 2 ? '#4caf50' : parseFloat(subj.avg) <= 3 ? '#ff9800' : '#f44336'};">${subj.avg}</strong>
                  </div>
                </div>
              `).join('')
            : '<p style="color: #999;">Keine Noten vorhanden</p>'
          }
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📅 Wöchentliche Aktivität</h2>
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem;">
          ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, idx) => `
            <div style="text-align: center;">
              <div style="height: ${Math.max(20, lastWeek[idx] * 30)}px; background: linear-gradient(180deg, #667eea, #764ba2); border-radius: 8px 8px 0 0; margin-bottom: 0.5rem; transition: all 0.3s ease;"></div>
              <p style="margin: 0; font-size: 0.85rem; font-weight: bold;">${lastWeek[idx]}</p>
              <p style="margin: 0.25rem 0; font-size: 0.75rem; color: #999;">${day}</p>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>💡 Empfehlungen</h2>
        <ul style="list-style: none; padding: 0;">
          ${completionRate < 50 ? `<li style="padding: 0.75rem 0; color: #f44336;">⚠️ <strong>Bearbeitungsquote niedrig:</strong> Versuche, mehr Aufgaben zu erledigen!</li>` : ''}
          ${parseFloat(avgGrade) > 4 ? `<li style="padding: 0.75rem 0; color: #ff9800;">⚠️ <strong>Noten-Durchschnitt:</strong> Fokussiere auf schwierige Fächer</li>` : ''}
          ${tasks.length === 0 ? `<li style="padding: 0.75rem 0; color: #2196f3;">💡 <strong>Tipp:</strong> Erstelle deine erste Aufgabe</li>` : ''}
          ${grades.length === 0 ? `<li style="padding: 0.75rem 0; color: #2196f3;">💡 <strong>Tipp:</strong> Trage deine Noten ein für bessere Analyse</li>` : ''}
          ${completionRate > 80 ? `<li style="padding: 0.75rem 0; color: #4caf50;">✅ <strong>Großartig:</strong> Du machst fantastische Fortschritte!</li>` : ''}
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};
