const comparativeAnalytics = {
  render: async () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card"><h1>📊 Vergleiche</h1><p>Vergleichswerte, die andere Lernende zur Anzeige freigegeben haben.</p></div>
      <div id="comparisons-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>🏆 Verfügbare Vergleiche</h2>
        <div id="comparisons-list">Lade Vergleiche …</div>
      </section>
    `);
    renderPageShell(main);
    try {
      const data = await apiGet('/comparisons');
      const comparisons = data?.comparisons || [];
      const list = document.getElementById('comparisons-list');
      list.innerHTML = comparisons.length ? `<div style="display:grid;gap:1rem;">
        ${comparisons.map(person => `
          <div class="task-item" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <strong>${comparativeAnalyticsEscape(person.username)}</strong>
              ${person.showLevel ? '<p style="margin:.25rem 0;color:#667eea;">Level-Anzeige freigegeben</p>' : ''}
            </div>
            <strong>${comparativeAnalyticsEscape(person.xp ?? '—')} XP</strong>
          </div>`).join('')}
      </div>` : '<p>Es sind derzeit keine freigegebenen Vergleichsdaten verfügbar.</p>';
    } catch (error) {
      const list = document.getElementById('comparisons-list');
      const errorNode = document.getElementById('comparisons-error');
      if (list) list.textContent = 'Vergleichsdaten konnten nicht geladen werden.';
      if (errorNode) errorNode.textContent = error?.message || 'Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.';
    }
  }
};

function comparativeAnalyticsEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
