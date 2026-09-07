// Quiz Solve Page
const quizSolve = {
  render: () => {
    if (!requireAuth()) return;
    
    const currentQuiz = JSON.parse(localStorage.getItem('currentQuiz') || 'null');
    if (!currentQuiz) {
      renderPageShell(createPageContainer('<p>Kein Quiz ausgewählt. <a href="#/quiz">Zurück</a></p>'));
      return;
    }
    
    const answers = JSON.parse(sessionStorage.getItem('quizAnswers') || '{}');
    const currentQuestion = parseInt(sessionStorage.getItem('currentQuestion') || '0');
    const question = currentQuiz.questions[currentQuestion];
    
    if (!question) {
      // Quiz fertig - Ergebnisse anzeigen
      const score = Object.values(answers).filter((ans, idx) => ans == currentQuiz.questions[idx]?.correctIndex).length;
      const percentage = Math.round((score / currentQuiz.questions.length) * 100);
      
      // Award XP for completing quiz
      const xpReward = Math.floor(20 + (percentage / 10));
      const result = addXP(xpReward, 'quiz_completed');
      
      const main = createPageContainer(`
        <div class="page-card" style="text-align: center;">
          <h1>🎉 Quiz beendet!</h1>
          <div style="font-size: 3rem; color: #667eea; margin: 1rem 0;">${percentage}%</div>
          <p style="font-size: 1.2rem; color: #58607a;">Dein Ergebnis: ${score}/${currentQuiz.questions.length} richtig</p>
          <p style="font-size: 1rem; color: #4caf50; font-weight: bold; margin-top: 1rem;">+${xpReward} XP ${result.levelUp ? '🎉 LEVEL UP!' : ''}</p>
          
          <div style="margin: 2rem 0; background: linear-gradient(135deg, #667eea15, #764ba215); padding: 1.5rem; border-radius: 12px;">
            <h3>Zusammenfassung</h3>
            ${currentQuiz.questions.map((q, idx) => `
              <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid ${answers[idx] == q.correctIndex ? '#4caf50' : '#f44336'};">
                <strong>${idx + 1}. ${q.questionText}</strong>
                <p style="margin: 0.5rem 0; color: #666;">Deine Antwort: <span style="color: ${answers[idx] == q.correctIndex ? '#4caf50' : '#f44336'};">${q.answers[answers[idx]]}</span></p>
                ${answers[idx] != q.correctIndex ? `<p style="margin: 0.5rem 0; color: #4caf50;">✅ Richtige Antwort: ${q.answers[q.correctIndex]}</p>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="button-group" style="margin: 2rem 0;">
            <button class="btn btn-primary" onclick="router.navigate('/quiz')">Zurück zu Quiz</button>
            <button class="btn btn-secondary" onclick="restartQuiz()">🔄 Wiederholen</button>
          </div>
        </div>
      `);
      
      renderPageShell(main);
      sessionStorage.removeItem('quizAnswers');
      sessionStorage.removeItem('currentQuestion');
      return;
    }
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>${currentQuiz.title}</h1>
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1rem; border-radius: 12px; margin: 1rem 0;">
          <p style="margin: 0;">Frage ${currentQuestion + 1} von ${currentQuiz.questions.length}</p>
          <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.3); border-radius: 4px; margin-top: 0.5rem;">
            <div style="width: ${((currentQuestion + 1) / currentQuiz.questions.length) * 100}%; height: 100%; background: white; border-radius: 4px; transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>${question.questionText}</h2>
        
        <div style="display: grid; gap: 1rem; margin-top: 1.5rem;">
          ${question.answers.map((answer, idx) => `
            <button class="answer-btn" style="padding: 1rem; border: 2px solid #ddd; border-radius: 12px; background: white; cursor: pointer; transition: all 0.3s ease;" 
              onclick="selectAnswer(${idx})" id="answer-${idx}">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #667eea; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                  ${String.fromCharCode(65 + idx)}
                </div>
                <span style="text-align: left;">${answer}</span>
              </div>
            </button>
          `).join('')}
        </div>
        
        <div class="button-group" style="margin-top: 2rem;">
          ${currentQuestion > 0 ? '<button class="btn btn-secondary" onclick="previousQuestion()">⬅️ Zurück</button>' : ''}
          <button class="btn btn-primary" style="flex: 1;" onclick="nextQuestion()" id="next-btn" disabled>Weiter ➜</button>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function selectAnswer(idx) {
  // Store answer
  let answers = JSON.parse(sessionStorage.getItem('quizAnswers') || '{}');
  const currentQuestion = parseInt(sessionStorage.getItem('currentQuestion') || '0');
  answers[currentQuestion] = idx;
  sessionStorage.setItem('quizAnswers', JSON.stringify(answers));
  
  // Visual feedback
  document.querySelectorAll('.answer-btn').forEach((btn, i) => {
    btn.style.borderColor = i === idx ? '#667eea' : '#ddd';
    btn.style.background = i === idx ? 'rgba(102, 126, 234, 0.08)' : 'white';
  });
  
  // Enable next button
  document.getElementById('next-btn').disabled = false;
}

function nextQuestion() {
  let currentQuestion = parseInt(sessionStorage.getItem('currentQuestion') || '0');
  currentQuestion++;
  sessionStorage.setItem('currentQuestion', currentQuestion);
  router.navigate('/quiz-solve');
}

function previousQuestion() {
  let currentQuestion = parseInt(sessionStorage.getItem('currentQuestion') || '0');
  if (currentQuestion > 0) {
    currentQuestion--;
    sessionStorage.setItem('currentQuestion', currentQuestion);
    router.navigate('/quiz-solve');
  }
}

function restartQuiz() {
  sessionStorage.removeItem('quizAnswers');
  sessionStorage.setItem('currentQuestion', '0');
  router.navigate('/quiz-solve');
}
