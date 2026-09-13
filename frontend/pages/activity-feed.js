// Activity Feed & Social Timeline
const activityFeed = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
    const friends = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]').filter(f => f.status === 'accepted');
    const friendIds = friends.map(f => f.friend_id);
    
    // Gather all activities
    const activities = generateActivityFeed(userId, friendIds, allUsers);
    const sortedActivities = activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📰 Aktivitäts-Feed</h1>
        <p>Sehe was deine Freunde und du alles erreicht hast</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Zentrales Aktivitätslog</h2>
        <div style="display: grid; gap: 1.5rem;">
          ${sortedActivities.length > 0
            ? sortedActivities.slice(0, 20).map(activity => `
                <div style="border-left: 4px solid ${activity.color}; padding: 1rem 0 1rem 1rem; border-radius: 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <div>
                      <p style="margin: 0; font-weight: bold; font-size: 1rem;">
                        <span style="font-size: 1.3rem;">${activity.icon}</span>
                        ${activity.user}
                      </p>
                      <p style="margin: 0.25rem 0; color: ${activity.color}; font-weight: bold;">${activity.title}</p>
                    </div>
                    <span style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; color: #666;">
                      ${getTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p style="margin: 0.5rem 0 0 0; color: #666; font-size: 0.95rem;">${activity.description}</p>
                  ${activity.badge ? `<p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">🏆 ${activity.badge}</p>` : ''}
                </div>
              `).join('')
            : '<p style="color: #999; text-align: center; padding: 2rem;">Keine Aktivitäten. Starten Sie jetzt zu lernen!</p>'
          }
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>👥 Freundes Highlights</h2>
        <div style="display: grid; gap: 1rem;">
          ${friends.length > 0
            ? friends.slice(0, 5).map(friendship => {
                const friend = allUsers.find(u => u.id === friendship.friend_id);
                const friendStats = getFriendStats(friendship.friend_id);
                return `
                  <div class="task-item" style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                    <div>
                      <strong>${friend?.username || 'Freund'}</strong>
                      <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">
                        Level ${friendStats.level} • 
                        🔥 ${friendStats.maxStreak} Tage Streak • 
                        ⭐ ${friendStats.badges} Badges
                      </p>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="router.navigate('/friends')">Profil</button>
                  </div>
                `;
              }).join('')
            : '<p style="color: #999;">Keine Freunde. Verbinde dich um deren Aktivitäten zu sehen!</p>'
          }
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Aktivitäts-Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">🎯 <strong>Sichtbarkeit:</strong> Teile deine Erfolge mit Freunden</li>
          <li style="padding: 0.5rem 0;">🔥 <strong>Motivation:</strong> Sehe wie deine Freunde lernen</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Wettbewerb:</strong> Freundlicher Wettbewerb motiviert</li>
          <li style="padding: 0.5rem 0;">📊 <strong>Durchschnitt:</strong> Vergleiche Lernprozesse</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function generateActivityFeed(userId, friendIds, allUsers) {
  const activities = [];
  const allUserIds = [userId, ...friendIds];
  
  allUserIds.forEach(uid => {
    const user = allUsers.find(u => u.id === uid);
    if (!user) return;
    
    // Tasks completed
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === uid && t.completed);
    tasks.slice(-3).forEach(task => {
      activities.push({
        user: user.username,
        title: 'Aufgabe erledigt',
        description: `"${task.title}" abgeschlossen`,
        icon: '✅',
        color: '#4caf50',
        timestamp: task.due_date,
        type: 'task'
      });
    });
    
    // Quiz completed
    const quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]').filter(q => q.user_id === uid);
    quizzes.slice(-2).forEach(quiz => {
      activities.push({
        user: user.username,
        title: 'Quiz absolviert',
        description: `${quiz.title} mit 85% Erfolg`,
        icon: '🎯',
        color: '#2196f3',
        timestamp: quiz.createdAt,
        type: 'quiz'
      });
    });
    
    // Badges unlocked
    const badges = JSON.parse(localStorage.getItem(`achievements_${uid}`) || '[]');
    badges.slice(-2).forEach(badge => {
      activities.push({
        user: user.username,
        title: 'Abzeichen freigeschaltet',
        description: 'Hat ein neues Abzeichen verdient',
        icon: '🎖️',
        color: '#ff9800',
        badge: badge.id,
        timestamp: badge.unlockedAt,
        type: 'badge'
      });
    });
    
    // Level up
    const xpData = JSON.parse(localStorage.getItem(`xp_${uid}`) || '{"level": 1}');
    if (xpData.level > 1) {
      activities.push({
        user: user.username,
        title: 'Level Up!',
        description: `Ist jetzt Level ${xpData.level}`,
        icon: '⭐',
        color: '#667eea',
        timestamp: new Date().toISOString(),
        type: 'levelup'
      });
    }
  });
  
  return activities;
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'Jetzt';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Jetzt';
  if (diffMins < 60) return `vor ${diffMins}m`;
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays < 7) return `vor ${diffDays}d`;
  return date.toLocaleDateString('de-DE');
}

function getFriendStats(friendId) {
  const xpData = JSON.parse(localStorage.getItem(`xp_${friendId}`) || '{"level": 1}');
  const badges = JSON.parse(localStorage.getItem(`achievements_${friendId}`) || '[]');
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === friendId);
  
  let maxStreak = 0;
  habits.forEach(h => {
    const streak = calculateHabitStreak(h);
    maxStreak = Math.max(maxStreak, streak);
  });
  
  return {
    level: xpData.level,
    badges: badges.length,
    maxStreak
  };
}
