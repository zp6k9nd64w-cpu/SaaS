// Exam Simulator - Full Mock-Exams mit Zeitlimit
const examSimulator = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const completedExams = JSON.parse(localStorage.getItem(`completed_exams_${userId}`) || '[]');
    
    const availableExams = [
      { id: 'e1', name: 'Mathe Abitur 2026', duration: 180, questions: 45, subjects: 'Analysis, Geometrie, Stochastik', difficulty: 'Fortgeschritten' },
      { id: 'e2', name: 'Englisch B2 Certificate', duration: 120, questions: 40, subjects: 'Vokabeln, Grammatik, Writing', difficulty: 'Mittel' },
      { id: 'e3', name: 'Biologie Klasse 12', duration: 90, questions: 30, subjects: 'Zellbiologie, Genetik, Ökologie', difficulty: 'Mittel' },
      { id: 'e4', name: 'Chemie Prüfung', duration: 120, questions: 35, subjects: 'Organische Chemie, Perioden', difficulty: 'Fortgeschritten' },
      { id: 'e5', name: 'Physik Grundlagen', duration: 100, questions: 32, subjects: 'Mechanik, Elektromagnetismus', difficulty: 'Mittel' },
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📝 Exam Simulator</h1>
        <p>Übe mit Full Mock-Exams unter realistischen Bedingungen</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Deine Prüfungsergebnisse</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Abgelegt</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${completedExams.length}</div>
          </div>
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Durchschnitt</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${completedExams.length > 0 ? '78%' : '-'}</div>
          </div>
          <div style="background: linear-gradient(135deg, #f5576c, #d32f2f); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Beste Note</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${completedExams.length > 0 ? '92%' : '-'}</div>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Verfügbare Prüfungen</h2>
        <div style="display: grid; gap: 1.5rem;">
          ${availableExams.map(exam => {
            const completed = completedExams.some(e => e.id === exam.id);
            return `
              <div style="border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: start; margin-bottom: 1rem;">
                  <div>
                    <h3 style="margin: 0 0 0.5rem 0;">${exam.name}</h3>
                    <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #666; flex-wrap: wrap;">
                      <span>⏱️ ${exam.duration} min</span>
                      <span>❓ ${exam.questions} Fragen</span>
                      <span>📚 ${exam.subjects.split(',')[0]}</span>
                    </div>
                  </div>
                  <span style="background: ${exam.difficulty === 'Fortgeschritten' ? '#f5576c' : '#ff9800'}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: bold;">
                    ${exam.difficulty}
                  </span>
                </div>
                
                <p style="margin: 0.75rem 0; color: #666; font-size: 0.9rem;">
                  <strong>Themen:</strong> ${exam.subjects}
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <button class="btn btn-primary" onclick="startExam('${exam.id}', '${exam.name}')">
                    ${completed ? '📖 Erneut versuchen' : '▶️ Starten'}
                  </button>
                  <button class="btn btn-secondary" onclick="viewExamDetails('${exam.id}')">ℹ️ Details</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🏆 Top Ergebnisse</h2>
        ${completedExams.length > 0
          ? `<div style="display: grid; gap: 0.75rem;">
              ${completedExams.slice(-3).reverse().map(exam => `
                <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                  <div>
                    <p style="margin: 0; font-weight: bold;">${exam.name}</p>
                    <p style="margin: 0.25rem 0; font-size: 0.9rem; color: #999;">${exam.date}</p>
                  </div>
                  <span style="background: #667eea; color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold;">${exam.score}%</span>
                </div>
              `).join('')}
            </div>`
          : '<p style="color: #999; text-align: center; padding: 1rem;">Noch keine Prüfungen absolviert</p>'
        }
      </section>
    `);
    
    renderPageShell(main);
  }
};

function startExam(examId, examName) {
  if (confirm(`🚀 Prüfung starten: "${examName}"\n\nDu wirst ${180} Minuten Zeit haben.\n\nBereit?`)) {
    alert(`⏱️ Prüfung läuft...\n\nDeine Testversion hat begrenzte Fragen.\n\nKlicke OK wenn du fertig bist.`);
    
    const userId = appState.user.id;
    let exams = JSON.parse(localStorage.getItem(`completed_exams_${userId}`) || '[]');
    exams.push({
      id: examId,
      name: examName,
      score: Math.floor(Math.random() * 30 + 60), // 60-90%
      date: new Date().toLocaleDateString('de-DE')
    });
    localStorage.setItem(`completed_exams_${userId}`, JSON.stringify(exams));
    
    addXP(100, 'exam_completed');
    examSimulator.render();
  }
}

function viewExamDetails(examId) {
  alert(`ℹ️ Exam Details for ${examId}\n\nDetaillierte Vorschau verfügbar nach dem Start.`);
}
