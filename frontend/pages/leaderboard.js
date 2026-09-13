// Leaderboard & Gamification Page
const leaderboard = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    // Get all users with stats
    const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
    const stats = allUsers.map(user => {
      const xpData = JSON.parse(localStorage.getItem(`xp_${user.id}`) || '{"total_xp": 0, "level": 1, "xp_to_next": 0}');
      const badges = JSON.parse(localStorage.getItem(`badges_${user.id}`) || '[]');
      const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === user.id);
      const completedTasks = tasks.filter(t => t.completed).length;
      
      return {
        user,
        totalXP: xpData.total_xp,
        level: xpData.level,
        badges: badges.length,
        completedTasks,
        streak: calculateUserStreak(user.id)
      };
    }).sort((a, b) => b.totalXP - a.totalXP);
    
    const currentUserRank = stats.findIndex(s => s.user.id === appState.user.id) + 1;
    const currentUserStats = stats.find(s => s.user.id === appState.user.id);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🏆 Leaderboard & Ranking</h1>
        <p>Vergleiche deine Leistung mit anderen Lernenden</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Dein Ranking</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold;">#${currentUserRank}</div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Platzierung</p>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold;">${currentUserStats?.level || 1}</div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Level</p>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold;">${currentUserStats?.totalXP || 0}</div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">XP Punkte</p>
          </div>
          <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold;">${currentUserStats?.badges || 0}</div>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Abzeichen</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🥇 Top 10 Lernende</h2>
        <div style="display: grid; gap: 0.75rem;">
          ${stats.slice(0, 10).map((stat, idx) => `
            <div class="task-item" style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">
                  ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div>
                  <strong>${stat.user.username}</strong>
                  <p style="margin: 0; font-size: 0.9rem; color: #667eea;">Level ${stat.level} • ${stat.totalXP} XP</p>
                </div>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-weight: bold;">${stat.badges} 🎖️</p>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>📈 Wie man XP verdient:</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0.75rem 0;">✅ <strong>Aufgabe erledigt:</strong> +10 XP</li>
          <li style="padding: 0.75rem 0;">📝 <strong>Note eingetragen:</strong> +15 XP</li>
          <li style="padding: 0.75rem 0;">🎯 <strong>Quiz gelöst:</strong> +20 XP</li>
          <li style="padding: 0.75rem 0;">📚 <strong>Notiz erstellt:</strong> +5 XP</li>
          <li style="padding: 0.75rem 0;">🎯 <strong>Ziel aktualisiert:</strong> +10 XP</li>
          <li style="padding: 0.75rem 0;">🔥 <strong>Tägliche Gewohnheit:</strong> +25 XP</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function calculateUserStreak(userId) {
  const habitData = JSON.parse(localStorage.getItem('saasDB_habits') || '[]');
  const userHabits = habitData.filter(h => h.user_id === userId);
  
  if (userHabits.length === 0) return 0;
  
  let maxStreak = 0;
  userHabits.forEach(habit => {
    const streak = calculateHabitStreak(habit);
    maxStreak = Math.max(maxStreak, streak);
  });
  
  return maxStreak;
}
