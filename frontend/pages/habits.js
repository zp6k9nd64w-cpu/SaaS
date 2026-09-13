// Habit Tracker Page
const habits = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userHabits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === appState.user.id);
    const today = new Date().toISOString().split('T')[0];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎯 Gewohnheits-Tracker</h1>
        <p>Baue gute Lerngewohnheiten auf und halte sie konsistent</p>
        
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showHabitForm()">➕ Neue Gewohnheit</button>
        </div>
      </div>
      
      <div id="habit-form"></div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📅 Deine Gewohnheiten</h2>
        <div style="display: grid; gap: 1rem;">
          ${userHabits.length > 0
            ? userHabits.map((habit, idx) => {
                const completedToday = habit.completedDates?.includes(today);
                const streak = calculateHabitStreak(habit);
                return `
                  <div class="task-item">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                          <span style="font-size: 2rem;">${completedToday ? '✅' : '⭕'}</span>
                          <div>
                            <h3 style="margin: 0; color: #1b1f32;">${habit.name}</h3>
                            <p style="margin: 0.25rem 0; color: #666;">${habit.frequency}</p>
                            <p style="margin: 0.25rem 0; color: #667eea; font-weight: bold;">🔥 ${streak} Tage Streak</p>
                          </div>
                        </div>
                      </div>
                      <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                        <button class="btn ${completedToday ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="toggleHabitComplete(${idx})">
                          ${completedToday ? '↩️ Undo' : '✅ Heute'}
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="deleteHabit(${idx})">🗑️</button>
                      </div>
                    </div>
                    <div style="margin-top: 1rem;">
                      <div style="background: #f0f1f3; border-radius: 8px; height: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${(streak / Math.max(streak, 30)) * 100}%; transition: width 0.3s ease;"></div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')
            : '<p style="color: #999; padding: 1rem;">Keine Gewohnheiten gesetzt. Starten Sie mit einer neuen Gewohnheit!</p>'
          }
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Tipps für erfolgreiche Gewohnheiten</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0.75rem 0;">✨ <strong>Kleine Anfänge:</strong> Starten Sie mit kleinen, erreichbaren Zielen</li>
          <li style="padding: 0.75rem 0;">📅 <strong>Konsistenz:</strong> Die tägliche Wiederholung ist der Schlüssel</li>
          <li style="padding: 0.75rem 0;">🎯 <strong>Spezifisch:</strong> Definieren Sie genau, was die Gewohnheit ist</li>
          <li style="padding: 0.75rem 0;">🔥 <strong>Streaks:</strong> Versuchen Sie, Ihre Streak zu verlängern</li>
          <li style="padding: 0.75rem 0;">🏆 <strong>Belohnung:</strong> Belohnen Sie sich für Erfolge</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showHabitForm() {
  const formContainer = document.getElementById('habit-form');
  if (!formContainer) return;
  
  formContainer.innerHTML = `
    <div class="form-card" style="margin-top: 1.5rem;">
      <h3>Neue Gewohnheit</h3>
      <input type="text" id="habit-name" placeholder="Gewohnheit (z.B. '30 Min Mathe lernen')" required>
      <select id="habit-frequency" required>
        <option value="">Häufigkeit wählen...</option>
        <option value="Täglich">Täglich</option>
        <option value="3x pro Woche">3x pro Woche</option>
        <option value="Wöchentlich">Wöchentlich</option>
      </select>
      <div class="button-group" style="margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="saveHabit()">✅ Gewohnheit starten</button>
        <button class="btn btn-secondary" onclick="document.getElementById('habit-form').innerHTML=''">Abbrechen</button>
      </div>
    </div>
  `;
}

function saveHabit() {
  const name = document.getElementById('habit-name').value;
  const frequency = document.getElementById('habit-frequency').value;
  
  if (!name || !frequency) {
    alert('Bitte alle Felder ausfüllen!');
    return;
  }
  
  let habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]');
  habits.push({
    id: Date.now().toString(),
    user_id: appState.user.id,
    name,
    frequency,
    createdAt: new Date().toISOString(),
    completedDates: [],
    streak: 0
  });
  
  localStorage.setItem('saasDB_habits', JSON.stringify(habits));
  alert('✅ Gewohnheit hinzugefügt!');
  document.getElementById('habit-form').innerHTML = '';
  router.navigate('/habits');
}

function toggleHabitComplete(idx) {
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === appState.user.id);
  const allHabits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  const habit = habits[idx];
  const allIdx = allHabits.findIndex(h => h.id === habit.id);
  
  if (!allHabits[allIdx].completedDates) {
    allHabits[allIdx].completedDates = [];
  }
  
  let isCompleting = false;
  if (allHabits[allIdx].completedDates.includes(today)) {
    allHabits[allIdx].completedDates = allHabits[allIdx].completedDates.filter(d => d !== today);
  } else {
    allHabits[allIdx].completedDates.push(today);
    isCompleting = true;
  }
  
  localStorage.setItem('saasDB_habits', JSON.stringify(allHabits));
  
  // Add XP for completing habit
  if (isCompleting) {
    const result = addXP(25, 'habit_completed');
    if (result.levelUp) {
      alert(`🎉 Gewohnheit abgeschlossen! +25 XP\n🎉 Level Up! Level ${result.level}!`);
    } else {
      alert('✅ Gewohnheit abgeschlossen! +25 XP');
    }
  }
  
  router.navigate('/habits');
}

function deleteHabit(idx) {
  if (!confirm('Gewohnheit wirklich löschen?')) return;
  
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === appState.user.id);
  const allHabits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]');
  const habit = habits[idx];
  
  const filtered = allHabits.filter(h => h.id !== habit.id);
  localStorage.setItem('saasDB_habits', JSON.stringify(filtered));
  router.navigate('/habits');
}

function calculateHabitStreak(habit) {
  if (!habit.completedDates || habit.completedDates.length === 0) return 0;
  
  const sortedDates = habit.completedDates.sort().reverse();
  let streak = 0;
  let expectedDate = new Date();
  
  for (let i = 0; i < sortedDates.length; i++) {
    const currentDate = new Date(sortedDates[i]);
    const diffTime = Math.abs(expectedDate - currentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1 || i === 0) {
      streak++;
      expectedDate = currentDate;
    } else {
      break;
    }
  }
  
  return streak;
}
