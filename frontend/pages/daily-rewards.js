// Daily Login Rewards - Bonus XP für Konsistenz
const dailyRewards = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const rewardData = JSON.parse(localStorage.getItem(`daily_rewards_${userId}`) || '{}');
    const lastLoginDate = rewardData.lastLogin ? new Date(rewardData.lastLogin).toDateString() : null;
    const today = new Date().toDateString();
    const canClaimToday = lastLoginDate !== today;
    
    const streak = rewardData.streak || 0;
    const totalClaimed = rewardData.totalClaimed || 0;
    
    const rewardSchedule = [
      { day: 1, bonus: '50 XP', milestone: false },
      { day: 2, bonus: '60 XP', milestone: false },
      { day: 3, bonus: '70 XP', milestone: false },
      { day: 4, bonus: '80 XP', milestone: false },
      { day: 5, bonus: '100 XP', milestone: false },
      { day: 6, bonus: '120 XP', milestone: false },
      { day: 7, bonus: '200 XP + 🎁 Badge', milestone: true },
      { day: 14, bonus: '500 XP + ⭐ Badge', milestone: true },
      { day: 30, bonus: '1000 XP + 👑 Badge', milestone: true },
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎁 Tägliche Belohnungen</h1>
        <p>Komme täglich zurück für Bonus XP</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🔥 Dein Streak</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #f5576c, #d32f2f); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Aktueller Streak</p>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 0.5rem 0;">🔥 ${streak}</div>
            <p style="margin: 0; font-size: 0.9rem;">Tage hintereinander</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Insgesamt erhalten</p>
            <div style="font-size: 2.5rem; font-weight: bold; margin: 0.5rem 0;">${totalClaimed}</div>
            <p style="margin: 0; font-size: 0.9rem;">XP Bonus</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Status heute</p>
            <div style="font-size: 1.5rem; font-weight: bold; margin: 0.5rem 0;">${canClaimToday ? '✅ Verfügbar' : '❌ Erledigt'}</div>
            <p style="margin: 0; font-size: 0.9rem;">${canClaimToday ? 'Beanspruchen jetzt' : 'Morgen verfügbar'}</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🏆 Reward-Plan</h2>
        <div style="display: grid; gap: 1rem;">
          ${rewardSchedule.map(reward => {
            const claimed = streak >= reward.day;
            return `
              <div style="padding: 1rem; background: ${claimed ? '#e8f5e9' : '#f7f8ff'}; border-left: 4px solid ${claimed ? '#4caf50' : '#ddd'}; border-radius: 8px; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                <div>
                  <p style="margin: 0; font-weight: bold;">Tag ${reward.day}${reward.milestone ? ' 🎯 Meilenstein' : ''}</p>
                  <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${reward.bonus}</p>
                </div>
                <span style="background: ${claimed ? '#4caf50' : '#ddd'}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold;">
                  ${claimed ? '✓' : '◯'}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Heute</h2>
        ${canClaimToday
          ? `<button class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;" onclick="claimDailyReward()">
              ✨ Tägliche Belohnung abholen (${50 + streak * 10} XP)
            </button>`
          : `<div style="background: #f7f8ff; padding: 1.5rem; border-radius: 8px; text-align: center;">
              <p>✅ Du hast heute bereits deine Belohnung erhalten!</p>
              <p style="color: #999; margin: 0.5rem 0;">Komme morgen wieder für mehr XP</p>
            </div>`
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">🔥 <strong>Streak halten:</strong> Komme jeden Tag zurück!</li>
          <li style="padding: 0.5rem 0;">📈 <strong>Bonus steigt:</strong> Mit jedem Tag mehr XP</li>
          <li style="padding: 0.5rem 0;">🎁 <strong>Meilensteine:</strong> Spezielle Belohnungen alle 7, 14, 30 Tage</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Challenge:</strong> Schaffe einen 30-Tage Streak!</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function claimDailyReward() {
  const userId = appState.user.id;
  let rewardData = JSON.parse(localStorage.getItem(`daily_rewards_${userId}`) || '{}');
  
  const lastLoginDate = rewardData.lastLogin ? new Date(rewardData.lastLogin).toDateString() : null;
  const today = new Date().toDateString();
  
  if (lastLoginDate === today) {
    alert('❌ Du hast heute bereits deine Belohnung erhalten!');
    return;
  }
  
  // Calculate streak
  let streak = (rewardData.streak || 0) + 1;
  const xpBonus = 50 + (streak - 1) * 10; // Scales with streak
  
  rewardData.streak = streak;
  rewardData.lastLogin = new Date().toISOString();
  rewardData.totalClaimed = (rewardData.totalClaimed || 0) + xpBonus;
  
  localStorage.setItem(`daily_rewards_${userId}`, JSON.stringify(rewardData));
  
  const result = addXP(xpBonus, 'daily_reward');
  
  let message = `✅ ${xpBonus} XP erhalten!\n🔥 Streak: ${streak} Tage`;
  
  // Meilenstein-Belohnungen
  if (streak === 7) {
    message += '\n🎁 7-Tage Meilenstein! +100 Bonus XP!';
    addXP(100, 'streak_milestone_7');
  } else if (streak === 14) {
    message += '\n⭐ 14-Tage Meilenstein! +250 Bonus XP!';
    addXP(250, 'streak_milestone_14');
  } else if (streak === 30) {
    message += '\n👑 30-Tage Meilenstein! +500 Bonus XP!';
    addXP(500, 'streak_milestone_30');
  }
  
  if (result.levelUp) {
    message += '\n🎉 LEVEL UP!';
  }
  
  alert(message);
  dailyRewards.render();
}
