const goals = {
  render: async () => {
    if (!requireAuth()) return;
    mockDB.init();
    const userGoals = mockDB.getGoals(appState.user.id);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎯 Lernziele</h1>
        <p>Setze dir Ziele und verfolge deinen Fortschritt</p>
        
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showGoalForm()">➕ Neues Ziel</button>
        </div>
        
        <div id="goal-form"></div>
      </div>
      
      <section class="goals-list" style="margin-top: 1.5rem;">
        ${userGoals.length > 0
          ? userGoals.map(goal => `
              <div class="task-item">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                  <div style="flex: 1;">
                    <h3 style="margin: 0; color: #1b1f32;">${goal.title}</h3>
                    <p style="color: #666; margin: 0.5rem 0 0 0;">Ziel: ${goal.target} (${goal.frequency})</p>
                    <small style="color: #999;">Fällig: ${formatDate(goal.dueDate)}</small>
                    <div class="progress-bar" style="margin-top: 0.75rem;">
                      <div class="progress-fill" style="width: ${(goal.progress / goal.target) * 100}%;"></div>
                    </div>
                    <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #667eea; font-weight: 600;">Fortschritt: ${goal.progress}/${goal.target}</p>
                  </div>
                  <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
                    <button class="btn btn-primary btn-sm" onclick="updateGoalProgress(${goal.id}, ${Math.min(goal.progress + 1, goal.target)})">+1</button>
                    <button class="btn btn-secondary btn-sm" onclick="deleteGoal(${goal.id})">🗑️</button>
                  </div>
                </div>
              </div>
            `).join('')
          : '<p style="padding: 1rem; color: #999;">Keine Ziele gesetzt. Erstelle eines, um dich selbst zu motivieren!</p>'
        }
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showGoalForm() {
  const formContainer = document.getElementById('goal-form');
  if (!formContainer) return;
  formContainer.innerHTML = `
    <div class="form-card" style="margin-top: 1.5rem;">
      <h3>Neues Lernziel</h3>
      <input type="text" id="goal-title" placeholder="Zielbezeichnung (z.B. 'Mathe Tests lösen')" required>
      <input type="number" id="goal-target" placeholder="Anziel (z.B. 10)" min="1" required>
      <select id="goal-frequency" required>
        <option value="">Häufigkeit wählen...</option>
        <option value="täglich">Täglich</option>
        <option value="wöchentlich">Wöchentlich</option>
        <option value="monatlich">Monatlich</option>
      </select>
      <label>Fälligkeitsdatum:</label>
      <input type="date" id="goal-duedate" required>
      <div class="button-group" style="margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="addGoal()">✅ Ziel erstellen</button>
        <button class="btn btn-secondary" onclick="document.getElementById('goal-form').innerHTML=''">Abbrechen</button>
      </div>
    </div>
  `;
}

function addGoal() {
  const title = document.getElementById('goal-title').value;
  const target = parseInt(document.getElementById('goal-target').value);
  const frequency = document.getElementById('goal-frequency').value;
  const dueDate = document.getElementById('goal-duedate').value;
  
  if (!title || !target || !frequency || !dueDate) {
    alert('Bitte alle Felder ausfüllen');
    return;
  }
  
  createGoal(title, target, frequency, dueDate);
  router.navigate('/goals');
}
