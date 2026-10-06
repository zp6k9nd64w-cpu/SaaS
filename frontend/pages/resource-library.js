// Resource Library - API-backed resource links and saved choices.
const resourceLibrary = {
  render: async (errorMessage = '') => {
    if (!requireAuth()) return;
    mockDB.init();
    let resources = [];
    let loadError = errorMessage;
    try {
      const result = await apiGet('/resources');
      resourceAssertApiSuccess(result, 'Der Ressourcen-Dienst hat die Anfrage abgelehnt.');
      resources = Array.isArray(result) ? result : result?.resources;
      if (!Array.isArray(resources)) throw new Error('Die Ressourcen-Antwort vom Server hatte ein unerwartetes Format.');
    } catch (error) {
      loadError = `Ressourcen konnten nicht geladen werden: ${error.message || 'Unbekannter API-Fehler'}`;
    }

    const userId = String(appState.user.id);
    const privateResources = resources.filter(resource => (resource.visibility || 'private') === 'private' && String(resource.ownerId) === userId);
    const friendResources = resources.filter(resource => resource.visibility === 'friends');
    const communityResources = resources.filter(resource => resource.visibility === 'community');
    const savedResources = resources.filter(resource => resource.saved);
    const resourceCard = resource => `
      <article class="task-item" style="border:1px solid #ddd;border-radius:12px;padding:1rem;">
        <div style="display:flex;justify-content:space-between;gap:1rem;align-items:start;">
          <div>
            <strong>${resourceEscape(resource.title)}</strong>
            ${resource.subject ? `<p style="margin:0.25rem 0;color:#667eea;">${resourceEscape(resource.subject)}</p>` : ''}
            ${resource.description ? `<p style="margin:0.5rem 0;color:#666;">${resourceEscape(resource.description)}</p>` : ''}
            <small style="color:#999;">${String(resource.ownerId) === userId ? 'Von dir' : `Geteilt von ${resourceEscape(resource.author || 'Nutzer')}`} · ${resourceKindLabel(resource.kind)} · ${resourceVisibilityLabel(resource.visibility || 'private')}</small>
          </div>
          ${String(resource.ownerId) === userId ? `<button class="btn btn-sm btn-secondary" onclick="deleteResource('${resourceEscape(resource.id)}')">🗑️ Entfernen</button>` : ''}
        </div>
        ${resource.url && resourceValidUrl(resource.url) ? `
          <p style="overflow-wrap:anywhere;"><a href="${resourceEscape(resource.url)}" target="_blank" rel="noopener noreferrer">${resourceEscape(resource.url)}</a></p>
          <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
            <a class="btn btn-primary" href="${resourceEscape(resource.url)}" target="_blank" rel="noopener noreferrer">🔗 Ressource öffnen</a>
            <button class="btn btn-secondary" onclick="toggleSaveResource('${resourceEscape(resource.id)}', ${!resource.saved})">${resource.saved ? '⭐ Gespeichert' : '☆ Speichern'}</button>
          </div>` : '<p style="color:#999;">Der Server hat für diese Ressource keine gültige http(s)-URL gespeichert.</p>'}
      </article>`;
    const errorBanner = loadError ? `<p role="alert" style="padding:0.75rem;background:#ffebee;color:#b71c1c;border-radius:8px;">${resourceEscape(loadError)}</p>` : '';
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📚 Ressourcen-Bibliothek</h1>
        <p>Teile echte Ressourcen-Links mit der Community. Daten und Speicherstatus werden mit dem Server synchronisiert; es werden keine Dateien hochgeladen oder Downloads simuliert.</p>
        ${errorBanner}
      </div>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>📤 Ressource hinzufügen</h2>
        <form onsubmit="createResource(event)" style="display:grid;gap:0.75rem;">
          <input id="resource-title" required maxlength="120" placeholder="Titel der Ressource">
          <input id="resource-url" required type="url" placeholder="https://… (öffentlicher Link)">
          <input id="resource-subject" maxlength="80" placeholder="Fach oder Kategorie (optional)">
          <select id="resource-kind" required>
            <option value="link">Link</option><option value="article">Artikel</option><option value="video">Video</option><option value="document">Dokument-Link</option>
          </select>
          <label>Sichtbarkeit
            <select id="resource-visibility" required>
              <option value="private" selected>Privat – nur ich</option>
              <option value="friends">Freunde – nur bestätigte Freunde</option>
              <option value="community">Community – angemeldete Nutzer</option>
            </select>
          </label>
          <textarea id="resource-description" maxlength="500" placeholder="Beschreibung (optional)"></textarea>
          <button class="btn btn-primary" type="submit">➕ Link speichern</button>
        </form>
        <p style="color:#666;">Private Ressourcen sind nur für dich sichtbar. Freunde-Ressourcen sind für bestätigte Freunde sichtbar; Community-Ressourcen für angemeldete Nutzer.</p>
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>🔒 Private Ressourcen – nur ich</h2>
        <div style="display:grid;gap:1rem;">${loadError ? '' : privateResources.length ? privateResources.map(resourceCard).join('') : '<p style="color:#999;">Keine privaten Ressourcen.</p>'}</div>
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>👥 Ressourcen für bestätigte Freunde</h2>
        <input id="resource-search" type="search" placeholder="🔍 Ressourcen durchsuchen…" oninput="resourceFilterCards()" style="width:100%;padding:0.75rem;margin-bottom:1rem;">
        <div id="friends-resource-list" style="display:grid;gap:1rem;">
          ${loadError ? '' : friendResources.length ? friendResources.map(resourceCard).join('') : '<p style="color:#999;">Keine Ressourcen mit Freunde-Sichtbarkeit verfügbar.</p>'}
        </div>
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>🌍 Community-Ressourcen – angemeldete Nutzer</h2>
        <div id="community-resource-list" style="display:grid;gap:1rem;">
          ${loadError ? '' : communityResources.length ? communityResources.map(resourceCard).join('') : '<p style="color:#999;">Keine Community-Ressourcen verfügbar.</p>'}
        </div>
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>💾 Gespeicherte Ressourcen</h2>
        <div style="display:grid;gap:1rem;">
          ${loadError ? '' : savedResources.length ? `
            <h3>Privat</h3>${savedResources.filter(resource => (resource.visibility || 'private') === 'private').map(resourceCard).join('') || '<p>Keine.</p>'}
            <h3>Freunde</h3>${savedResources.filter(resource => resource.visibility === 'friends').map(resourceCard).join('') || '<p>Keine.</p>'}
            <h3>Community</h3>${savedResources.filter(resource => resource.visibility === 'community').map(resourceCard).join('') || '<p>Keine.</p>'}
          ` : '<p style="color:#999;">Noch keine Ressourcen gespeichert.</p>'}
        </div>
      </section>`);
    renderPageShell(main);
  }
};

function resourceEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function resourceValidUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password;
  } catch (_) {
    return false;
  }
}

function resourceKindLabel(kind) {
  return ({ article: 'Artikel', video: 'Video', document: 'Dokument', link: 'Link' })[kind] || 'Link';
}

function resourceVisibilityLabel(visibility) {
  return ({ private: 'Privat', friends: 'Freunde', community: 'Community' })[visibility] || 'Privat';
}

function resourceAssertApiSuccess(result, fallbackMessage) {
  if (result?.success === false || Number(result?.status) >= 400) {
    throw new Error(result.message || fallbackMessage);
  }
}

async function createResource(event) {
  event.preventDefault();
  const title = document.getElementById('resource-title').value.trim();
  const url = document.getElementById('resource-url').value.trim();
  if (!title || !resourceValidUrl(url)) {
    alert('Bitte einen Titel und eine gültige http(s)-URL eingeben.');
    return;
  }
  const payload = {
    title,
    subject: document.getElementById('resource-subject').value.trim(),
    url,
    kind: document.getElementById('resource-kind').value,
    visibility: document.getElementById('resource-visibility').value,
    description: document.getElementById('resource-description').value.trim()
  };
  try {
    const result = await apiPost('/resources', payload);
    resourceAssertApiSuccess(result, 'Der Server hat das Speichern abgelehnt.');
    await resourceLibrary.render();
  } catch (error) {
    await resourceLibrary.render(`Ressource konnte nicht gespeichert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function toggleSaveResource(resourceId, saved) {
  try {
    const result = await apiPut(`/resources/${encodeURIComponent(resourceId)}/saved`, { saved });
    resourceAssertApiSuccess(result, 'Der Server hat die Änderung abgelehnt.');
    await resourceLibrary.render();
  } catch (error) {
    await resourceLibrary.render(`Speicherstatus konnte nicht aktualisiert werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

async function deleteResource(resourceId) {
  if (!confirm('Ressource dauerhaft vom Server löschen?')) return;
  try {
    const result = await apiDelete(`/resources/${encodeURIComponent(resourceId)}`);
    resourceAssertApiSuccess(result, 'Der Server hat das Löschen abgelehnt.');
    await resourceLibrary.render();
  } catch (error) {
    await resourceLibrary.render(`Ressource konnte nicht gelöscht werden: ${error.message || 'Unbekannter API-Fehler'}`);
  }
}

function resourceFilterCards() {
  const query = document.getElementById('resource-search').value.trim().toLocaleLowerCase();
  document.querySelectorAll('#friends-resource-list article, #community-resource-list article').forEach(card => {
    card.style.display = card.textContent.toLocaleLowerCase().includes(query) ? '' : 'none';
  });
}
