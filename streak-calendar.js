// Streak Calendar Visualization - GitHub Style
const streakCalendar = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === userId);
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
    
    // Calculate calendar data
    const lastYear = getLast365Days();
    const activityMap = buildActivityMap(tasks, habits);
    
    // Group into weeks
    const weeks = [];
    for (let i = 0; i < lastYear.length; i += 7) {
      weeks.push(lastYear.slice(i, i + 7));
    }
    
    const maxActivity = Math.max(...Object.values(activityMap), 1);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🔥 Streak Kalender</h1>
        <p>Visualisiere deine Lernaktivität wie auf GitHub</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem; overflow-x: auto;">
        <h2>📅 Aktivität (Letztes Jahr)</h2>
        
        <div style="display: inline-grid; grid-template-columns: repeat(${weeks.length}, 12px); gap: 2px; padding: 1rem; background: #f7f8ff; border-radius: 12px;">
          ${weeks.map((week, weekIdx) => `
            <div style="display: grid; grid-template-rows: repeat(7, 12px); gap: 2px;">
              ${week.map((date, dayIdx) => {
                const dateStr = date.toISOString().split('T')[0];
                const activity = activityMap[dateStr] || 0;
                const intensity = Math.min(activity / (maxActivity / 4), 4);
                const colors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'];
                const color = colors[Math.floor(intensity)];
                
                return `
                  <div style="width: 12px; height: 12px; background: ${color}; border-radius: 2px; cursor: pointer;" 
                    title="${dateStr}: ${activity} Aktivitäten"
                    onmouseover="this.style.outline='2px solid #667eea'; this.style.outlineOffset='2px'"
                    onmouseout="this.style.outline='none'"></div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
        
        <div style="display: flex; align-items: center; gap: 1rem; margin-top: 1.5rem; font-size: 0.9rem;">
          <span>Weniger</span>
          <div style="display: grid; grid-template-columns: repeat(5, 16px); gap: 2px;">
            <div style="width: 16px; height: 16px; background: #ebedf0; border-radius: 2px;"></div>
            <div style="width: 16px; height: 16px; background: #c6e48b; border-radius: 2px;"></div>
            <div style="width: 16px; height: 16px; background: #7bc96f; border-radius: 2px;"></div>
            <div style="width: 16px; height: 16px; background: #239a3b; border-radius: 2px;"></div>
            <div style="width: 16px; height: 16px; background: #196127; border-radius: 2px;"></div>
          </div>
          <span>Mehr</span>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Übersicht</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Aktive Tage (letztes Jahr)</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${Object.values(activityMap).filter(a => a > 0).length}</div>
            <p style="margin: 0; font-size: 0.85rem;">/ 365 Tage</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Längster Streak</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${calculateLongestStreak(activityMap)}</div>
            <p style="margin: 0; font-size: 0.85rem;">Tage hintereinander</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px;">
            <p style="margin: 0; opacity: 0.9;">Durchschnittliche Aktivität</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${(Object.values(activityMap).reduce((a, b) => a + b, 0) / 365).toFixed(1)}</div>
            <p style="margin: 0; font-size: 0.85rem;">pro Tag</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Top Aktivitätstage</h2>
        <div style="display: grid; gap: 0.5rem;">
          ${Object.entries(activityMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([date, count]) => {
              const dateObj = new Date(date);
              return `
                <div style="padding: 0.75rem; background: #f7f8ff; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                  <span>${dateObj.toLocaleDateString('de-DE', {weekday: 'long', month: 'short', day: 'numeric'})}</span>
                  <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-weight: bold;">${count} Aktivitäten</span>
                </div>
              `;
            }).join('')}
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function getLast365Days() {
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
}

function buildActivityMap(tasks, habits) {
  const map = {};
  
  // Count completed tasks
  tasks.forEach(task => {
    if (task.completed) {
      const date = task.due_date || new Date().toISOString().split('T')[0];
      map[date] = (map[date] || 0) + 1;
    }
  });
  
  // Count habit completions
  habits.forEach(habit => {
    if (habit.completedDates) {
      habit.completedDates.forEach(date => {
        map[date] = (map[date] || 0) + 1;
      });
    }
  });
  
  return map;
}

function calculateLongestStreak(activityMap) {
  const sortedDates = Object.keys(activityMap).filter(d => activityMap[d] > 0).sort();
  
  let longestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffTime = currDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, currentStreak);
  return longestStreak;
}
