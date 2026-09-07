// Tournament Mode - Freunde in Lernwettbewerbe einladen
const tournaments = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const myTournaments = JSON.parse(localStorage.getItem(`tournaments_${userId}`) || '[]');
    
    const activeTournaments = [
      { id: 't1', name: 'Mathe Meisterschaft', duration: '7 days', participants: 12, prize: '500 XP', status: 'active' },
      { id: 't2', name: 'Quiz Champion', duration: '3 days', participants: 8, prize: '300 XP', status: 'active' },
      { id: 't3', name: 'Speed Learning', duration: '1 day', participants: 5, prize: '200 XP', status: 'active' },
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🏆 Turnier-Modus</h1>
        <p>Fordere Freunde in Lernwettbewerbe heraus</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Meine Turniere</h2>
        ${myTournaments.length > 0
          ? `<div style="display: grid; gap: 1rem;">
              ${myTournaments.map(t => `
                <div class="task-item" style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                  <div>
                    <h3 style="margin: 0 0 0.5rem 0;">${t.name}</h3>
                    <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">
                      👥 ${t.participants} Teilnehmer • 🏆 ${t.prize}
                    </p>
                  </div>
                  <button class="btn btn-primary" onclick="viewTournament('${t.id}')">Ansehen</button>
                </div>
              `).join('')}
            </div>`
          : '<p style="color: #999; text-align: center; padding: 1rem;">Du bist noch in keinem Turnier</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>⚡ Verfügbare Turniere</h2>
        <div style="display: grid; gap: 1.5rem;">
          ${activeTournaments.map(tournament => `
            <div style="border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem;">
              <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin: 0 0 0.5rem 0;">${tournament.name}</h3>
                  <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #666;">
                    <span>⏱️ ${tournament.duration}</span>
                    <span>👥 ${tournament.participants} Teilnehmer</span>
                    <span>🏆 ${tournament.prize}</span>
                  </div>
                </div>
                <span style="background: #4caf50; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold;">AKTIV</span>
              </div>
              
              <div style="background: #f0f0f0; height: 8px; border-radius: 4px; margin-bottom: 1rem; overflow: hidden;">
                <div style="background: #667eea; height: 100%; width: 65%;"></div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <button class="btn btn-primary" onclick="joinTournament('${tournament.id}')">✓ Beitreten</button>
                <button class="btn btn-secondary" onclick="inviteFriendsToTournament('${tournament.id}')">👥 Freunde laden</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎁 Turnier erstellen</h2>
        <button class="btn btn-primary" style="width: 100%; padding: 1rem; margin-bottom: 1rem;" onclick="showCreateTournamentModal()">
          + Neues Turnier erstellen
        </button>
        <p style="color: #999; font-size: 0.9rem;">
          💡 Erstelle dein eigenes Turnier und lade Freunde ein. Der Gewinner erhält bonus XP!
        </p>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>🏅 Turnier-Regeln</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">⏱️ <strong>Zeitlimit:</strong> Turniere haben verschiedene Zeitrahmen</li>
          <li style="padding: 0.5rem 0;">📊 <strong>Ranking:</strong> Basierend auf XP-Gewinn während des Turniers</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Preise:</strong> Bonus XP für Top 3</li>
          <li style="padding: 0.5rem 0;">👥 <strong>Teams:</strong> Solo oder mit Freunden</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function joinTournament(tournamentId) {
  const userId = appState.user.id;
  let tournaments = JSON.parse(localStorage.getItem(`tournaments_${userId}`) || '[]');
  
  if (!tournaments.some(t => t.id === tournamentId)) {
    tournaments.push({
      id: tournamentId,
      joinedAt: new Date().toISOString(),
      xp: 0
    });
    localStorage.setItem(`tournaments_${userId}`, JSON.stringify(tournaments));
    addXP(50, 'tournament_joined');
    alert('✅ Du bist dem Turnier beigetreten!');
  } else {
    alert('Du bist bereits in diesem Turnier!');
  }
  tournaments.render();
}

function inviteFriendsToTournament(tournamentId) {
  alert('👥 Freunde eingeladen zum Turnier!');
}

function showCreateTournamentModal() {
  const name = prompt('Turnier-Name:');
  if (name) {
    const userId = appState.user.id;
    let tournaments = JSON.parse(localStorage.getItem(`tournaments_${userId}`) || '[]');
    
    tournaments.push({
      id: 't_' + Date.now(),
      name,
      participants: 1,
      prize: '300 XP',
      createdAt: new Date().toISOString()
    });
    
    localStorage.setItem(`tournaments_${userId}`, JSON.stringify(tournaments));
    addXP(75, 'tournament_created');
    alert(`✅ Turnier "${name}" erstellt!`);
    tournaments.render();
  }
}

function viewTournament(id) {
  alert(`🏆 Turnier-Details: ${id}`);
}
