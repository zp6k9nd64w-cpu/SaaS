const privacySettings = {
  values: {},

  render: async () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card"><h1>🔐 Datenschutz & Privatsphäre</h1><p>Verwalte, welche optionalen Informationen du teilen möchtest.</p></div>
      <div id="privacy-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>📊 Sichtbarkeit</h2>
        <div id="privacy-controls">Lade Einstellungen …</div>
      </section>
    `);
    renderPageShell(main);
    await privacySettings.load();
  },

  load: async () => {
    const controls = document.getElementById('privacy-controls');
    if (!controls) return;
    const errorNode = document.getElementById('privacy-error');
    errorNode.textContent = '';
    try {
      const response = await apiGet('/privacy');
      const data = response?.settings || {};
      const keys = ['show_level', 'show_achievements', 'show_in_leaderboard', 'allow_friend_requests', 'allow_messages'];
      privacySettings.values = Object.fromEntries(keys.map(key => [key, privacySettings.toBoolean(data[key])]));
      controls.innerHTML = `
        <div style="display:grid;gap:1rem;">
          ${privacySettings.control('show_level', 'Level anzeigen', 'Dein Level darf in unterstützten Ansichten erscheinen.')}
          ${privacySettings.control('show_achievements', 'Erfolge anzeigen', 'Deine Erfolge dürfen angezeigt werden.')}
          ${privacySettings.control('show_in_leaderboard', 'Im Leaderboard erscheinen', 'Deine Teilnahme am Leaderboard erlauben.')}
          ${privacySettings.control('allow_friend_requests', 'Freundschaftsanfragen erlauben', 'Andere Benutzer dürfen dir Anfragen senden.')}
          ${privacySettings.control('allow_messages', 'Nachrichten erlauben', 'Nachrichten sind weiterhin auf bestätigte Freunde beschränkt.')}
        </div>
        <p style="color:#666;font-size:.9rem;margin-top:1rem;">Optionen sind standardmäßig deaktiviert. Schule, Geburtsdatum, E-Mail und Noten werden hier nicht freigegeben.</p>`;
    } catch (error) {
      controls.textContent = 'Einstellungen konnten nicht geladen werden.';
      errorNode.textContent = privacySettings.error(error);
    }
  },

  control: (key, title, description) => `
    <label style="display:flex;align-items:center;gap:1rem;cursor:pointer;padding:.75rem;background:#f7f8ff;border-radius:8px;">
      <input type="checkbox" data-privacy-key="${key}" ${privacySettings.values[key] ? 'checked' : ''} onchange="updatePrivacySetting('${key}',this.checked)" style="width:20px;height:20px;">
      <span><strong>${title}</strong><p style="margin:.25rem 0;color:#666;font-size:.9rem;">${description}</p></span>
    </label>`,

  toBoolean: value => value === true || value === 1 || value === 'true',

  error: error => error?.message || 'Die Datenschutzeinstellung konnte nicht gespeichert werden.'
};

async function updatePrivacySetting(key, value) {
  const allowed = ['show_level', 'show_achievements', 'show_in_leaderboard', 'allow_friend_requests', 'allow_messages'];
  if (!allowed.includes(key)) return;
  const errorNode = document.getElementById('privacy-error');
  const control = document.querySelector(`[data-privacy-key="${key}"]`);
  if (errorNode) errorNode.textContent = '';
  try {
    await apiPut('/privacy', { [key]: Boolean(value) });
    privacySettings.values[key] = Boolean(value);
  } catch (error) {
    if (control) control.checked = Boolean(privacySettings.values[key]);
    if (errorNode) errorNode.textContent = privacySettings.error(error);
  }
}
