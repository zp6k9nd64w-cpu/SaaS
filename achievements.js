// Achievements Page - 40+ Custom Badges
const achievements = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const unlockedBadges = JSON.parse(localStorage.getItem(`achievements_${userId}`) || '[]');
    const stats = getAchievementStats(userId);
    
    const allAchievements = [
      // Learning Badges
      { id: 'first_task', name: 'Getting Started', description: 'Erledige deine erste Aufgabe', emoji: '🚀', category: 'Learning' },
      { id: 'task_master_10', name: 'Task Master', description: 'Erledige 10 Aufgaben', emoji: '✅', category: 'Learning' },
      { id: 'task_master_50', name: 'Task Legend', description: 'Erledige 50 Aufgaben', emoji: '⭐', category: 'Learning' },
      { id: 'perfect_week', name: 'Perfect Week', description: 'Alle Aufgaben einer Woche erledigt', emoji: '🎯', category: 'Learning' },
      { id: 'grade_collector', name: 'Grade Collector', description: 'Trag 10 Noten ein', emoji: '📊', category: 'Grades' },
      { id: 'straight_as', name: 'Straight A\'s', description: 'Bekommme 5 Note 1-2', emoji: '🏆', category: 'Grades' },
      { id: 'note_taker', name: 'Note Taker', description: 'Erstelle 10 Notizen', emoji: '📝', category: 'Notes' },
      { id: 'quiz_master', name: 'Quiz Master', description: 'Löse 10 Quiz', emoji: '🎯', category: 'Quizzes' },
      { id: 'quiz_perfectionist', name: 'Perfectionist', description: 'Löse Quiz mit 100%', emoji: '💯', category: 'Quizzes' },
      { id: 'goal_setter', name: 'Goal Setter', description: 'Erstelle dein erstes Lernziel', emoji: '🎯', category: 'Goals' },
      { id: 'goal_achiever_5', name: 'Goal Achiever', description: 'Erreiche 5 Lernziele', emoji: '🏅', category: 'Goals' },
      { id: 'goal_achiever_20', name: 'Goal Master', description: 'Erreiche 20 Lernziele', emoji: '👑', category: 'Goals' },
      
      // Streak Badges
      { id: 'streak_7', name: '7-Day Warrior', description: '7 Tage Streak', emoji: '🔥', category: 'Streaks' },
      { id: 'streak_30', name: '30-Day Champion', description: '30 Tage Streak', emoji: '🌟', category: 'Streaks' },
      { id: 'streak_100', name: '100-Day Legend', description: '100 Tage Streak', emoji: '👑', category: 'Streaks' },
      
      // Gamification Badges
      { id: 'xp_500', name: 'XP Collector', description: 'Verdiene 500 XP', emoji: '💎', category: 'XP' },
      { id: 'xp_2500', name: 'XP Hoarder', description: 'Verdiene 2500 XP', emoji: '🏆', category: 'XP' },
      { id: 'xp_10000', name: 'XP Legend', description: 'Verdiene 10000 XP', emoji: '🌟', category: 'XP' },
      { id: 'level_5', name: 'Rising Star', description: 'Erreiche Level 5', emoji: '⭐', category: 'Levels' },
      { id: 'level_10', name: 'Level 10 Master', description: 'Erreiche Level 10', emoji: '🥇', category: 'Levels' },
      { id: 'level_20', name: 'Legendary Master', description: 'Erreiche Level 20', emoji: '👑', category: 'Levels' },
      
      // Habit Badges
      { id: 'habit_master', name: 'Habit Master', description: 'Erstelle 5 Gewohnheiten', emoji: '⚙️', category: 'Habits' },
      { id: 'habit_streak', name: 'Consistent Learner', description: 'Behalte Gewohnheit 30 Tage bei', emoji: '🔄', category: 'Habits' },
      
      // Time-based Badges
      { id: 'night_owl', name: 'Night Owl', description: 'Lerne nach 22:00 Uhr', emoji: '🌙', category: 'Time' },
      { id: 'early_bird', name: 'Early Bird', description: 'Lerne vor 07:00 Uhr', emoji: '🌅', category: 'Time' },
      { id: 'morning_person', name: 'Morning Person', description: 'Lerne 10x morgens', emoji: '🌞', category: 'Time' },
      
      // Subject Badges
      { id: 'math_lover', name: 'Math Lover', description: 'Erledige 20 Mathe-Aufgaben', emoji: '🔢', category: 'Subjects' },
      { id: 'language_master', name: 'Language Master', description: 'Erledige 20 Sprach-Aufgaben', emoji: '🗣️', category: 'Subjects' },
      { id: 'science_genius', name: 'Science Genius', description: 'Erledige 20 Wissenschafts-Aufgaben', emoji: '🔬', category: 'Subjects' },
      
      // Social Badges
      { id: 'team_player', name: 'Team Player', description: 'Teile Lernziele mit Freunden', emoji: '🤝', category: 'Social' },
      { id: 'influencer', name: 'Influencer', description: 'Habe 10 Freunde', emoji: '⭐', category: 'Social' },
      
      // Challenge Badges
      { id: 'speedrunner', name: 'Speedrunner', description: 'Erledige 5 Aufgaben an einem Tag', emoji: '⚡', category: 'Challenges' },
      { id: 'comeback_king', name: 'Comeback King', description: 'Reaktiviere deinen Account nach 30 Tagen Pause', emoji: '🎯', category: 'Challenges' },
      { id: 'superb_performance', name: 'Superb Performance', description: 'Löse 10 Quiz mit über 90%', emoji: '✨', category: 'Challenges' },
    ];
    
    const displayAchievements = allAchievements.map(ach => ({
      ...ach,
      unlocked: unlockedBadges.some(b => b.id === ach.id),
      unlockedAt: unlockedBadges.find(b => b.id === ach.id)?.unlockedAt
    }));
    
    const categories = [...new Set(displayAchievements.map(a => a.category))];
    const unlockedCount = displayAchievements.filter(a => a.unlocked).length;
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🏆 Achievements</h1>
        <p>Sammle Abzeichen durch deine Lernaktivitäten</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem;">${unlockedCount}</div>
            <p style="margin: 0; font-size: 0.85rem;">Abzeichen freigeschaltet</p>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem;">${displayAchievements.length}</div>
            <p style="margin: 0; font-size: 0.85rem;">Insgesamt verfügbar</p>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem;">${Math.round((unlockedCount / displayAchievements.length) * 100)}%</div>
            <p style="margin: 0; font-size: 0.85rem;">Kompletion</p>
          </div>
        </div>
      </div>
      
      ${categories.map(category => `
        <section class="page-card" style="margin-top: 1.5rem;">
          <h2>${category}</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem;">
            ${displayAchievements.filter(a => a.category === category).map(ach => `
              <div class="achievement-badge" style="padding: 1rem; border-radius: 12px; text-align: center; border: 2px solid ${ach.unlocked ? '#667eea' : '#ddd'}; background: ${ach.unlocked ? 'rgba(102, 126, 234, 0.08)' : '#f7f8ff'}; cursor: pointer; transition: all 0.3s ease;" title="${ach.name}">
                <div style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: ${ach.unlocked ? '1' : '0.3'};">${ach.emoji}</div>
                <p style="font-size: 0.8rem; margin: 0.25rem 0; font-weight: bold; color: #1b1f32;">${ach.name}</p>
                <p style="font-size: 0.7rem; margin: 0; color: #999;">${ach.description}</p>
                ${ach.unlocked ? `<p style="font-size: 0.7rem; color: #667eea; margin-top: 0.5rem;">✅ Freigeschaltet</p>` : ''}
              </div>
            `).join('')}
          </div>
        </section>
      `).join('')}
    `);
    
    renderPageShell(main);
  }
};

function getAchievementStats(userId) {
  const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
  const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]').filter(g => g.user_id === userId);
  const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]').filter(g => g.user_id === userId);
  const notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === userId);
  const quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]').filter(q => q.user_id === userId);
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === userId);
  
  return {
    completedTasks: tasks.filter(t => t.completed).length,
    totalGrades: grades.length,
    completedGoals: goals.filter(g => g.progress >= g.target).length,
    totalNotes: notes.length,
    totalQuizzes: quizzes.length,
    totalHabits: habits.length
  };
}
