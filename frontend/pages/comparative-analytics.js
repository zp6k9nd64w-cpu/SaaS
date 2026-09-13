// Comparative Analytics - Vergleich mit Freunden/Klasse
const comparativeAnalytics = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
    const friends = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]').filter(f => f.status === 'accepted');
    const userXP = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1, "xp": 0}');
    
    // Erstelle Vergleichsdaten
    const friendsComparison = friends.slice(0, 5).map(f => {
      const friendXP = JSON.parse(localStorage.getItem(`xp_${f.friend_id}`) || '{"level": 1}');
      const friend = allUsers.find(u => u.id === f.friend_id);
      return {
        name: friend?.username || 'Freund',
        level: friendXP.level,
        xp: friendXP.xp || 0
      };
    });
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📊 Vergleichende Analysen</h1>
        <p>Vergleiche deinen Fortschritt mit Freunden</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🏆 Level-Vergleich</h2>
        <div style="display: grid; gap: 1rem;">
          <div style="padding: 1rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 8px;">
            <p style="margin: 0 0 0.5rem 0; opacity: 0.9;">Dein Level</p>
            <div style="font-size: 2.5rem; font-weight: bold;">${userXP.level}</div>
          </div>
          
          ${friendsComparison.map((friend, idx) => `
            <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px; display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
              <div>
                <p style="margin: 0; font-weight: bold;">${friend.name}</p>
                <p style="margin: 0; color: #999; font-size: 0.9rem;">Level ${friend.level}</p>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${friend.level}</div>
                ${friend.level > userXP.level ? '📈' : '📉'}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📈 Aktivitäts-Vergleich</h2>
        <div style="display: grid; gap: 1.5rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="background: #f7f8ff; padding: 1rem; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 0.9rem;">Deine Aktivität</p>
              <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0; color: #667eea;">42</div>
              <p style="margin: 0; font-size: 0.85rem; color: #999;">Diese Woche</p>
            </div>
            <div style="background: #f7f8ff; padding: 1rem; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #999; font-size: 0.9rem;">Durchschnitt</p>
              <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0; color: #667eea;">38</div>
              <p style="margin: 0; font-size: 0.85rem; color: #999;">Freunde</p>
            </div>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Kategorie-Vergleich</h2>
        <div style="display: grid; gap: 1rem;">
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong>Quiz-Erfolgsrate</strong>
              <span style="color: #667eea; font-weight: bold;">82%</span>
            </div>
            <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: #667eea; height: 100%; width: 82%;"></div>
            </div>
          </div>
          
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong>Noten-Qualität</strong>
              <span style="color: #4caf50; font-weight: bold;">78%</span>
            </div>
            <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: #4caf50; height: 100%; width: 78%;"></div>
            </div>
          </div>
          
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong>Konsistenz (Streaks)</strong>
              <span style="color: #f5576c; font-weight: bold;">91%</span>
            </div>
            <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: #f5576c; height: 100%; width: 91%;"></div>
            </div>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Insights</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">✅ <strong>Stärke:</strong> Du bist konsistenter als 75% deiner Freunde</li>
          <li style="padding: 0.5rem 0;">📈 <strong>Trend:</strong> Dein Level-Fortschritt ist +2 Level diese Woche</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Ziel:</strong> Noch 3 Level bis zum nächsten Achievement</li>
          <li style="padding: 0.5rem 0;">💪 <strong>Tipp:</strong> Steigere deine Aktivität um 20% für mehr XP</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};
