// AI Study Coach - Personalisierte Lernempfehlungen
const aiCoach = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1}');
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
    const analytics = generateAIAnalytics(userId);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🤖 AI Study Coach</h1>
        <p>Dein persönlicher KI-Lernassistent</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>👋 Hallo ${appState.user.username}!</h2>
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 2rem; border-radius: 12px; text-align: center; margin-bottom: 1rem;">
          <p style="margin: 0; font-size: 1.2rem;">🎯 Level ${xpData.level} Lerner</p>
          <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Du machst großartige Fortschritte! Hier sind meine Empfehlungen für heute:</p>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Deine Lernmuster</h2>
        <div style="display: grid; gap: 1.5rem;">
          <div style="background: #f7f8ff; padding: 1.5rem; border-radius: 8px;">
            <p style="margin: 0 0 0.75rem 0; font-weight: bold;">⏰ Beste Lernzeit</p>
            <p style="margin: 0; font-size: 1.2rem; color: #667eea; font-weight: bold;">Montags 10:00 - 12:00 Uhr</p>
            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">Du erreichst 87% Konzentration zu dieser Zeit</p>
          </div>
          
          <div style="background: #f7f8ff; padding: 1.5rem; border-radius: 8px;">
            <p style="margin: 0 0 0.75rem 0; font-weight: bold;">📚 Lieblingsfach</p>
            <p style="margin: 0; font-size: 1.2rem; color: #4caf50; font-weight: bold;">Mathematik</p>
            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">Du spendest ${Math.floor(analytics.hoursPerSubject['Mathematik'] || 0)} Stunden/Woche</p>
          </div>
          
          <div style="background: #f7f8ff; padding: 1.5rem; border-radius: 8px;">
            <p style="margin: 0 0 0.75rem 0; font-weight: bold;">📈 Verbesserungsgebiet</p>
            <p style="margin: 0; font-size: 1.2rem; color: #f5576c; font-weight: bold;">Englisch</p>
            <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.9rem;">+15% Erfolgsrate möglichin 2 Wochen</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Heute's Empfehlungen</h2>
        <div style="display: grid; gap: 1rem;">
          <div class="task-item" style="border-left: 4px solid #4caf50; padding-left: 1rem;">
            <h3 style="margin: 0 0 0.5rem 0;">✅ Quiz machen</h3>
            <p style="margin: 0; color: #666;">Quizze erhöhen deine Quiz-Erfolgsrate um 34% basierend auf deinen Daten</p>
            <button class="btn btn-sm btn-primary" style="margin-top: 0.75rem;" onclick="router.navigate('/quiz')">Start →</button>
          </div>
          
          <div class="task-item" style="border-left: 4px solid #f5576c; padding-left: 1rem;">
            <h3 style="margin: 0 0 0.5rem 0;">📝 Englisch üben</h3>
            <p style="margin: 0; color: #666;">Dein schwächstes Fach braucht diese Woche 3 extra Stunden</p>
            <button class="btn btn-sm btn-primary" style="margin-top: 0.75rem;" onclick="router.navigate('/subjects')">Zum Fach →</button>
          </div>
          
          <div class="task-item" style="border-left: 4px solid #667eea; padding-left: 1rem;">
            <h3 style="margin: 0 0 0.5rem 0;">🧠 Flashcards</h3>
            <p style="margin: 0; color: #666;">20 neue Vokabeln warten auf dich in der Spaced Repetition</p>
            <button class="btn btn-sm btn-primary" style="margin-top: 0.75rem;" onclick="router.navigate('/spaced-repetition')">Starten →</button>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎓 Intelligente Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.75rem 0; border-bottom: 1px solid #eee;">
            <strong>💡 Tipp 1:</strong> Du lernst besser mit Quiz-Tests. Mache täglich 2-3 Quiz.
          </li>
          <li style="padding: 0.75rem 0; border-bottom: 1px solid #eee;">
            <strong>💡 Tipp 2:</strong> Englisch braucht mehr Zeit. Erhöhe auf 4 Stunden/Woche.
          </li>
          <li style="padding: 0.75rem 0;">
            <strong>💡 Tipp 3:</strong> Dein Streak ist bei 7 Tagen. Halte durch für Meilenstein!
          </li>
        </ul>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>💬 Chat mit deinem Coach</h2>
        <div style="display: grid; gap: 1rem;">
          <input type="text" id="coachQuestion" placeholder="Stelle eine Frage an deinen AI Coach..." style="padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px;">
          <button class="btn btn-primary" onclick="askCoach()">💭 Frag den Coach</button>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function generateAIAnalytics(userId) {
  return {
    hoursPerSubject: {
      'Mathematik': 8,
      'Englisch': 3,
      'Biologie': 5,
      'Deutsch': 4
    },
    bestTime: '10:00-12:00',
    favorite: 'Mathematik',
    improvement: 'Englisch'
  };
}

function askCoach() {
  const question = document.getElementById('coachQuestion').value;
  
  if (!question.trim()) {
    alert('Bitte stelle eine Frage!');
    return;
  }
  
  const responses = [
    '💡 Das ist eine großartig Frage! Basierend auf deinen Daten empfehle ich mehr Quiz-Übungen.',
    '🎯 Guter Gedanke! Versuche, deine Englisch-Zeit um 2 Stunden pro Woche zu erhöhen.',
    '📚 Exzellent! Deine aktuelle Strategie funktioniert gut. Halte es so!',
    '🚀 Das ist der richtige Weg! Dein Fortschritt zeigt +15% diese Woche.',
    '⭐ Interessant! Ich sehe, dass du in diesem Bereich schnelle Fortschritte machst.'
  ];
  
  const response = responses[Math.floor(Math.random() * responses.length)];
  alert(`🤖 AI Coach:\n\n${response}`);
  
  addXP(15, 'coach_interaction');
  document.getElementById('coachQuestion').value = '';
}
