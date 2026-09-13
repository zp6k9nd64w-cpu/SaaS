// Subscription Plans & Billing - Premium Features
const subscriptionPlans = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const user = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    const currentPlan = user.plan || 'free';
    
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: '0€',
        period: 'Kostenlos',
        features: [
          '✓ 5 Aufgaben/Monat',
          '✓ Basic Quizzes',
          '✓ Einfache Noten',
          '✓ Grund-Analytics',
          '✗ Keine Freunde',
          '✗ Kein Leaderboard'
        ],
        button: 'Aktueller Plan'
      },
      {
        id: 'pro',
        name: 'Pro',
        price: '9€',
        period: '/Monat',
        popular: true,
        features: [
          '✓ Unlimitierte Aufgaben',
          '✓ Advanced Quizzes',
          '✓ Vollständige Analytics',
          '✓ Freunde & Chat',
          '✓ Leaderboard',
          '✓ Study Groups'
        ],
        button: currentPlan === 'pro' ? 'Aktueller Plan' : 'Upgrade'
      },
      {
        id: 'elite',
        name: 'Elite',
        price: '19€',
        period: '/Monat',
        popular: false,
        features: [
          '✓ Alles aus Pro +',
          '✓ AI Study Coach',
          '✓ Custom Themes',
          '✓ Advanced Reports',
          '✓ Mentorship',
          '✓ Tournaments',
          '✓ Private Tutoring',
          '✓ Priority Support'
        ],
        button: currentPlan === 'elite' ? 'Aktueller Plan' : 'Upgrade'
      }
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>💳 Abonnement-Pläne</h1>
        <p>Wähle den Plan der am besten zu dir passt</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Dein aktueller Plan</h2>
        <div style="padding: 2rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 12px; text-align: center;">
          <p style="margin: 0; font-size: 1.2rem;">📊 ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan</p>
          <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Läuft bis: ${new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE')}</p>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>💰 Vergleiche unsere Pläne</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem;">
          ${plans.map(plan => `
            <div style="border: ${plan.popular ? '3px solid #667eea' : '2px solid #ddd'}; border-radius: 12px; padding: 2rem; text-align: center; position: relative; transition: all 0.3s ease;"
              onmouseover="this.style.boxShadow='0 10px 30px rgba(102, 126, 234, 0.3)'; this.style.transform='translateY(-4px)'"
              onmouseout="this.style.boxShadow='none'; this.style.transform='none'">
              ${plan.popular ? '<div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #667eea; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; font-size: 0.9rem;">BELIEBT</div>' : ''}
              
              <h3 style="margin: 0 0 1rem 0; font-size: 1.5rem;">${plan.name}</h3>
              <p style="margin: 0; font-size: 2.5rem; font-weight: bold; color: #667eea;">${plan.price}</p>
              <p style="margin: 0.5rem 0 1.5rem 0; color: #999;">${plan.period}</p>
              
              <ul style="list-style: none; padding: 0; text-align: left; margin: 1.5rem 0;">
                ${plan.features.map(feature => `
                  <li style="padding: 0.5rem 0; border-bottom: 1px solid #eee; color: #666; font-size: 0.9rem;">${feature}</li>
                `).join('')}
              </ul>
              
              <button class="btn ${plan.button === 'Aktueller Plan' ? 'btn-secondary' : 'btn-primary'}" style="width: 100%; margin-top: 1.5rem;"
                onclick="upgradePlan('${plan.id}')"
                ${plan.button === 'Aktueller Plan' ? 'disabled' : ''}>
                ${plan.button}
              </button>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>❓ Häufig gestellte Fragen</h2>
        <div style="display: grid; gap: 1rem;">
          <div>
            <p style="margin: 0 0 0.5rem 0; font-weight: bold;">Kann ich jederzeit upgraden?</p>
            <p style="margin: 0; color: #666;">Ja, du kannst jederzeit upgraden oder dein Abonnement verwalten.</p>
          </div>
          
          <div>
            <p style="margin: 0 0 0.5rem 0; font-weight: bold;">Können Sie monatlich kündigen?</p>
            <p style="margin: 0; color: #666;">Ja, ohne Kündigungsfrist. Jederzeit verfügbar.</p>
          </div>
          
          <div>
            <p style="margin: 0 0 0.5rem 0; font-weight: bold;">Gibt es Rabatte?</p>
            <p style="margin: 0; color: #666;">Ja, 20% Rabatt bei Jahresabonnement. Kontaktiere uns!</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📋 Zahlungsmethoden</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 1.5rem;">💳</p>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Kreditkarte</p>
          </div>
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 1.5rem;">🏦</p>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">Banküberweisung</p>
          </div>
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 1.5rem;">📱</p>
            <p style="margin: 0.5rem 0; font-size: 0.9rem;">PayPal</p>
          </div>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function upgradePlan(planId) {
  const userId = appState.user.id;
  let user = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
  
  if (planId === 'free') {
    alert('❌ Du bist bereits im Free Plan');
    return;
  }
  
  const cost = planId === 'pro' ? 9 : 19;
  
  if (confirm(`Upgrade zu ${planId.toUpperCase()} Plan (${cost}€/Monat)?\n\nDie Zahlung wird sofort abgebucht.`)) {
    user.plan = planId;
    user.upgradeDate = new Date().toISOString();
    localStorage.setItem(`user_${userId}`, JSON.stringify(user));
    
    addXP(200, 'plan_upgraded');
    
    alert(`✅ Erfolgreiches Upgrade!\n\n🎉 Willkommen im ${planId.toUpperCase()} Plan!\n\nDu hast Zugriff auf alle ${planId === 'elite' ? 'exklusiven' : 'Premium'}-Features.`);
    subscriptionPlans.render();
  }
}
