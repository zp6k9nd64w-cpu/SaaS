// Badge Shop - Virtuelle Currency System
const badgeShop = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1, "currency": 0}');
    const ownedBadges = JSON.parse(localStorage.getItem(`owned_badges_${userId}`) || '[]');
    
    const shopBadges = [
      { id: 'premium_1', name: '⭐ Premium Star', cost: 500, desc: 'Glänzender Premium-Stern' },
      { id: 'elite_crown', name: '👑 Elite Crown', cost: 1000, desc: 'Exklusives Elite-Abzeichen' },
      { id: 'speedster', name: '⚡ Speedster', cost: 300, desc: 'Schnelle Lerner' },
      { id: 'guru', name: '🧙 Knowledge Guru', cost: 750, desc: 'Wissens-Experte' },
      { id: 'legend', name: '🦁 Legend', cost: 1500, desc: 'Legendärer Status' },
      { id: 'diamond', name: '💎 Diamond', cost: 2000, desc: 'Diamant-Sammler' },
      { id: 'phoenix', name: '🔥 Phoenix', cost: 1200, desc: 'Auferstehungs-Kraft' },
      { id: 'sparkle', name: '✨ Sparkle', cost: 400, desc: 'Glitzernder Glanz' },
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🏅 Badge Shop</h1>
        <p>Kaufe exklusive Abzeichen mit XP-Währung</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>💰 Dein Kontostand</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Level</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${xpData.level}</div>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Abzeichen-Coins</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${xpData.currency || 0}</div>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <p style="margin: 0; opacity: 0.9;">Gekauft</p>
            <div style="font-size: 2rem; font-weight: bold; margin: 0.5rem 0;">${ownedBadges.length}</div>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🛍️ Verfügbare Abzeichen</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${shopBadges.map(badge => {
            const owned = ownedBadges.includes(badge.id);
            const canBuy = (xpData.currency || 0) >= badge.cost;
            return `
              <div style="border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem; text-align: center; background: ${owned ? '#f0f4ff' : 'white'}; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.2)'"
                onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${badge.name.split(' ')[0]}</div>
                <h3 style="margin: 0.5rem 0; font-size: 0.95rem;">${badge.name}</h3>
                <p style="margin: 0.25rem 0; color: #666; font-size: 0.85rem;">${badge.desc}</p>
                <div style="background: #f0f0f0; padding: 0.75rem; border-radius: 8px; margin: 1rem 0;">
                  <span style="font-weight: bold; color: #f5576c;">${badge.cost} Coins</span>
                </div>
                ${owned 
                  ? '<button class="btn btn-secondary" disabled>✓ Besitzt</button>'
                  : `<button class="btn ${canBuy ? 'btn-primary' : 'btn-secondary'}" ${canBuy ? `onclick="buyBadge('${badge.id}', ${badge.cost})"` : 'disabled'}>
                      ${canBuy ? '🛒 Kaufen' : '❌ Zu teuer'}
                    </button>`
                }
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Coins verdienen</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">✅ <strong>Task erledigt:</strong> +10 Coins</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Quiz absolviert:</strong> +25 Coins</li>
          <li style="padding: 0.5rem 0;">📚 <strong>Notiz erstellt:</strong> +15 Coins</li>
          <li style="padding: 0.5rem 0;">🔥 <strong>7-Tage Streak:</strong> +100 Coins</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Achievement:</strong> +50 Coins</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function buyBadge(badgeId, cost) {
  const userId = appState.user.id;
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1, "currency": 0}');
  let ownedBadges = JSON.parse(localStorage.getItem(`owned_badges_${userId}`) || '[]');
  
  if ((xpData.currency || 0) >= cost) {
    xpData.currency = (xpData.currency || 0) - cost;
    ownedBadges.push(badgeId);
    
    localStorage.setItem(`xp_${userId}`, JSON.stringify(xpData));
    localStorage.setItem(`owned_badges_${userId}`, JSON.stringify(ownedBadges));
    
    addNotification(userId, '🎉 Abzeichen gekauft!', `Neues Abzeichen freigeschaltet`, '🏅');
    alert(`✅ Abzeichen gekauft! ${xpData.currency} Coins verbleibend`);
    badgeShop.render();
  }
}
