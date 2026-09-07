// Daily Challenges & Events System
const challenges = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const dailyChallenges = generateDailyChallenges(userId);
    const completedToday = JSON.parse(localStorage.getItem(`challenges_completed_${userId}`) || '[]').filter(c => 
      c.completedAt.includes(new Date().toISOString().split('T')[0])
    );
    
    const activeChallenges = generateActiveChallenges();
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>⚡ Tägliche Herausforderungen</h1>
        <p>Meistere tägliche Quests und verdiene Bonus-XP</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Heute's Quest (${completedToday.length}/${dailyChallenges.length} abgeschlossen)</h2>
        <div style="margin: 1.5rem 0;">
          <div style="width: 100%; height: 12px; background: #ddd; border-radius: 6px; overflow: hidden;">
            <div style="width: ${(completedToday.length / dailyChallenges.length) * 100}%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s ease;"></div>
          </div>
        </div>
        
        <div style="display: grid; gap: 1rem;">
          ${dailyChallenges.map((challenge, idx) => {
            const completed = completedToday.some(c => c.id === challenge.id);
            return `
              <div class="task-item" style="border: 2px solid ${completed ? '#4caf50' : '#ddd'}; padding: 1.5rem; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <div>
                  <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">${challenge.icon}</span>
                    <div>
                      <h3 style="margin: 0;">${challenge.title}</h3>
                      <p style="margin: 0.25rem 0; color: #667eea; font-weight: bold;">+${challenge.xpReward} XP</p>
                    </div>
                  </div>
                  <p style="margin: 0.5rem 0; color: #666;">${challenge.description}</p>
                  <p style="margin: 0; font-size: 0.85rem; color: #999;">📊 Fortschritt: ${challenge.progress}/${challenge.target}</p>
                </div>
                <div style="text-align: right;">
                  ${completed 
                    ? `<div style="background: #4caf50; color: white; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold;">✅ Erledigt</div>`
                    : `<button class="btn btn-primary" onclick="claimChallenge('${challenge.id}')" style="padding: 0.75rem 1.5rem;">Beanspruchen</button>`
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🏆 Aktive Events</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
          ${activeChallenges.map(event => `
            <div style="border: 2px solid #ff9800; padding: 1.5rem; border-radius: 12px; background: linear-gradient(135deg, #ff980015, #f5576c15);">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 style="margin: 0;">${event.icon} ${event.name}</h3>
                <span style="background: #ff9800; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">⏰ ${event.daysLeft} Tage</span>
              </div>
              <p style="margin: 0.5rem 0; color: #666;">${event.description}</p>
              <p style="margin: 0.5rem 0; color: #667eea; font-weight: bold;">💰 Preis: ${event.reward}</p>
              <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" onclick="joinEvent('${event.id}')">
                ➕ Teilnehmen
              </button>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Bonus-Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">🎯 <strong>Tägliche Quests:</strong> Absolviere alle für Maximum XP</li>
          <li style="padding: 0.5rem 0;">🔥 <strong>Streak:</strong> Schließe jeden Tag eine Quest ab für Bonuspunkte</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Events:</strong> Nehme an zeitlich begrenzten Events teil</li>
          <li style="padding: 0.5rem 0;">💎 <strong>Rare Rewards:</strong> Einige Events bieten seltene Belohnungen</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function generateDailyChallenges(userId) {
  const seed = new Date().toISOString().split('T')[0];
  const challenges = [
    { id: 'task1', icon: '✅', title: 'Aufgaben Meister', description: 'Erledige 3 Aufgaben', target: 3, xpReward: 30 },
    { id: 'quiz1', icon: '🎯', title: 'Quiz Champion', description: 'Löse 2 Quiz mit 80%+', target: 2, xpReward: 40 },
    { id: 'note1', icon: '📝', title: 'Notizen Sammler', description: 'Schreibe 2 Notizen', target: 2, xpReward: 25 },
    { id: 'habit1', icon: '🔥', title: 'Gewohnheit Held', description: 'Absolviere deine Gewohnheit', target: 1, xpReward: 25 },
    { id: 'social1', icon: '👥', title: 'Sozial Schmetterling', description: 'Sende 3 Nachrichten', target: 3, xpReward: 20 }
  ];
  
  // Mock progress
  return challenges.map(ch => ({
    ...ch,
    progress: Math.floor(Math.random() * (ch.target + 1))
  }));
}

function generateActiveChallenges() {
  return [
    {
      id: 'event1',
      icon: '🏆',
      name: 'Mega Quiz Event',
      description: 'Löse 50 Quiz-Fragen und gewinne Epic Badges',
      daysLeft: 5,
      reward: '⭐ Epic Badge'
    },
    {
      id: 'event2',
      icon: '🔥',
      name: '30-Day Streak Challenge',
      description: 'Behalte 30 Tage lang deine Gewohnheit',
      daysLeft: 15,
      reward: '👑 Legendärer Badge'
    },
    {
      id: 'event3',
      icon: '📚',
      name: 'Lese Marathon',
      description: 'Lese 100 Seiten Schullektüre und verdiene Rewards',
      daysLeft: 8,
      reward: '📖 500 Bonus-XP'
    }
  ];
}

function claimChallenge(challengeId) {
  const userId = appState.user.id;
  const completed = JSON.parse(localStorage.getItem(`challenges_completed_${userId}`) || '[]');
  const today = new Date().toISOString().split('T')[0];
  
  // Find challenge to get XP reward
  const challenges = generateDailyChallenges(userId);
  const challenge = challenges.find(c => c.id === challengeId);
  
  if (challenge) {
    completed.push({
      id: challengeId,
      completedAt: new Date().toISOString()
    });
    localStorage.setItem(`challenges_completed_${userId}`, JSON.stringify(completed));
    
    const result = addXP(challenge.xpReward, 'challenge_completed');
    alert(`✅ Challenge erledigt! +${challenge.xpReward} XP${result.levelUp ? '\n🎉 LEVEL UP!' : ''}`);
    
    challenges.render();
  }
}

function joinEvent(eventId) {
  const userId = appState.user.id;
  const events = JSON.parse(localStorage.getItem(`events_joined_${userId}`) || '[]');
  
  if (!events.some(e => e.eventId === eventId)) {
    events.push({
      eventId,
      joinedAt: new Date().toISOString(),
      progress: 0
    });
    localStorage.setItem(`events_joined_${userId}`, JSON.stringify(events));
    
    addXP(15, 'event_joined');
    alert('✅ Event beigetreten!');
    challenges.render();
  }
}
