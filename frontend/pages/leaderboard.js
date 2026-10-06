const leaderboard = {
  render: async () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card"><h1>🏆 Leaderboard & Gamification</h1><p>XP und Ranglistenwerte aus deinem Konto.</p></div>
      <div id="leaderboard-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <div id="leaderboard-content" class="page-card" style="margin-top:1.5rem;">Lade Gamification-Daten …</div>
    `);
    renderPageShell(main);
    try {
      const data = await apiGet('/gamification');
      const board = data?.leaderboard || [];
      const content = document.getElementById('leaderboard-content');
      content.innerHTML = `
        <section>
          <h2>📊 Deine Daten</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;">
            <div class="task-item"><strong>${leaderboardEscape(data?.xp ?? '—')}</strong><p>XP</p></div>
            <div class="task-item"><strong>${leaderboardEscape(data?.level ?? '—')}</strong><p>Level</p></div>
            <div class="task-item"><strong>${leaderboardEscape(data?.xpToNext ?? '—')}</strong><p>XP bis zum nächsten Level</p></div>
          </div>
        </section>
        <section style="margin-top:1.5rem;">
          <h2>🥇 Rangliste</h2>
          ${board.length ? `<div style="display:grid;gap:.75rem;">${board.map((entry, index) => `
            <div class="task-item" style="display:flex;align-items:center;justify-content:space-between;">
              <div><strong>#${index + 1} ${leaderboardEscape(entry.username)}</strong></div>
              <strong>${leaderboardEscape(entry.xp)} XP</strong>
            </div>`).join('')}</div>` : '<p>Es sind derzeit keine Ranglisteneinträge verfügbar.</p>'}
        </section>`;
    } catch (error) {
      const content = document.getElementById('leaderboard-content');
      const errorNode = document.getElementById('leaderboard-error');
      if (content) content.textContent = 'Gamification-Daten konnten nicht geladen werden.';
      if (errorNode) errorNode.textContent = error?.message || 'Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.';
    }
  }
};

function leaderboardEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
