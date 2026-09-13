// Quiz Page - Interactive Quiz Creator & Solver
const quiz = {
  render: async () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]').filter(q => q.user_id === appState.user.id);
    const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === appState.user.id);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎯 Quiz & Tests</h1>
        <p>Erstelle eigene Quiz oder löse bestehende Tests</p>
        
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showQuizForm()">➕ Neues Quiz</button>
          <button class="btn btn-secondary" onclick="toggleQuizList()">📋 Meine Quiz</button>
        </div>
      </div>
      
      <div id="quiz-form"></div>
      
      <div id="quiz-list-container" style="display: none;">
        <section class="page-card">
          <h2>Deine Quiz</h2>
          <div style="display: grid; gap: 1rem;">
            ${quizzes.length > 0
              ? quizzes.map((q, idx) => `
                  <div class="task-item">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                      <div style="flex: 1;">
                        <h3 style="margin: 0; color: #1b1f32;">${q.title}</h3>
                        <p style="margin: 0.25rem 0; color: #666;">Fach: ${q.subject} | ${q.questions.length} Fragen</p>
                        <p style="margin: 0.25rem 0; color: #999;">Erstellt: ${formatDate(q.createdAt)}</p>
                      </div>
                      <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary btn-sm" onclick="startQuiz(${idx})">▶️ Starten</button>
                        <button class="btn btn-secondary btn-sm" onclick="deleteQuiz(${idx})">🗑️</button>
                      </div>
                    </div>
                  </div>
                `).join('')
              : '<p style="color: #999; padding: 1rem;">Noch kein Quiz erstellt.</p>'
            }
          </div>
        </section>
      </div>
    `);
    
    renderPageShell(main);
  }
};

function showQuizForm() {
  const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === appState.user.id);
  const formContainer = document.getElementById('quiz-form');
  
  if (!formContainer) return;
  formContainer.innerHTML = `
    <div class="form-card" style="margin-top: 1.5rem;">
      <h3>Neues Quiz erstellen</h3>
      <input type="text" id="quiz-title" placeholder="Quiz-Name (z.B. 'Mathe Kapitel 5')" required>
      <select id="quiz-subject" required>
        <option value="">Fach wählen...</option>
        ${subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('')}
      </select>
      <div id="questions-container" style="margin: 1rem 0;">
        <h4>Fragen (mindestens 1)</h4>
        <div id="questions-list"></div>
        <button class="btn btn-secondary" onclick="addQuizQuestion()" style="width: 100%; margin-top: 0.5rem;">+ Frage hinzufügen</button>
      </div>
      <div class="button-group" style="margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="saveQuiz()">✅ Quiz speichern</button>
        <button class="btn btn-secondary" onclick="document.getElementById('quiz-form').innerHTML=''">Abbrechen</button>
      </div>
    </div>
  `;
  
  // Add first question
  addQuizQuestion();
}

function addQuizQuestion() {
  const questionsList = document.getElementById('questions-list');
  if (!questionsList) return;
  
  const qIndex = questionsList.children.length;
  const questionHTML = `
    <div class="quiz-question" style="background: #f7f8ff; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; border: 1px solid rgba(102, 126, 234, 0.2);">
      <input type="text" placeholder="Frage ${qIndex + 1}" class="question-text" required style="width: 100%; margin-bottom: 0.5rem; padding: 0.75rem; border-radius: 8px; border: 1px solid #ddd;">
      <div class="answers-list" style="margin-top: 0.5rem;">
        <input type="text" placeholder="Antwort A" class="answer-text" style="width: 100%; margin: 0.25rem 0; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
        <input type="text" placeholder="Antwort B" class="answer-text" style="width: 100%; margin: 0.25rem 0; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
        <input type="text" placeholder="Antwort C" class="answer-text" style="width: 100%; margin: 0.25rem 0; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
        <input type="text" placeholder="Antwort D" class="answer-text" style="width: 100%; margin: 0.25rem 0; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
      </div>
      <label style="margin-top: 0.5rem; display: block;">Richtige Antwort:</label>
      <select class="correct-answer" required style="width: 100%; padding: 0.5rem; border-radius: 8px; border: 1px solid #ddd;">
        <option value="">Wähle richtige Antwort...</option>
        <option value="0">A</option>
        <option value="1">B</option>
        <option value="2">C</option>
        <option value="3">D</option>
      </select>
      <button class="btn btn-danger btn-sm" style="width: 100%; margin-top: 0.5rem;" onclick="this.parentElement.remove()">🗑️ Frage löschen</button>
    </div>
  `;
  
  const div = document.createElement('div');
  div.innerHTML = questionHTML;
  questionsList.appendChild(div.firstElementChild);
}

function saveQuiz() {
  const title = document.getElementById('quiz-title').value;
  const subject = document.getElementById('quiz-subject').value;
  const questionDivs = document.querySelectorAll('.quiz-question');
  
  if (!title || !subject || questionDivs.length === 0) {
    alert('Bitte alle Felder ausfüllen und mindestens eine Frage hinzufügen!');
    return;
  }
  
  const questions = Array.from(questionDivs).map((qDiv) => {
    const questionText = qDiv.querySelector('.question-text').value;
    const answers = Array.from(qDiv.querySelectorAll('.answer-text')).map(a => a.value);
    const correctIndex = parseInt(qDiv.querySelector('.correct-answer').value);
    
    return { questionText, answers, correctIndex };
  });
  
  let quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]');
  quizzes.push({
    id: Date.now(),
    user_id: appState.user.id,
    title,
    subject,
    questions,
    createdAt: new Date().toISOString(),
    scores: []
  });
  
  localStorage.setItem('saasDB_quizzes', JSON.stringify(quizzes));
  alert('✅ Quiz gespeichert!');
  document.getElementById('quiz-form').innerHTML = '';
  router.navigate('/quiz');
}

function toggleQuizList() {
  const container = document.getElementById('quiz-list-container');
  if (container) {
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
  }
}

function startQuiz(quizIndex) {
  const quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]').filter(q => q.user_id === appState.user.id);
  const quiz = quizzes[quizIndex];
  
  localStorage.setItem('currentQuiz', JSON.stringify({ ...quiz, index: quizIndex }));
  router.navigate('/quiz-solve');
}

function deleteQuiz(quizIndex) {
  if (!confirm('Quiz wirklich löschen?')) return;
  
  let quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]');
  quizzes = quizzes.filter(q => q.user_id !== appState.user.id || quizzes.indexOf(q) !== quizIndex);
  
  localStorage.setItem('saasDB_quizzes', JSON.stringify(quizzes));
  router.navigate('/quiz');
}
