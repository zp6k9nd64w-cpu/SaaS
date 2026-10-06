const friends = {
  render: async () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card"><h1>👥 Soziales Netzwerk</h1><p>Finde andere Lernende und verwalte Freundschaftsanfragen.</p></div>
      <div id="friends-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>🌟 Lernende suchen</h2>
        <form id="friend-search-form" style="display:flex;gap:.5rem;">
          <input name="query" type="search" required placeholder="Benutzername suchen" style="flex:1;padding:.75rem;border:1px solid #ddd;border-radius:8px;">
          <button class="btn btn-primary" type="submit">Suchen</button>
        </form>
        <div id="friend-search-results" style="margin-top:1rem;"></div>
      </section>
      <section class="page-card" style="margin-top:1.5rem;"><h2>📬 Freundschaftsanfragen</h2><div id="friend-requests">Lade Anfragen …</div></section>
      <section class="page-card" style="margin-top:1.5rem;"><h2>👫 Meine Freunde</h2><div id="friend-list">Lade Freunde …</div></section>
    `);
    renderPageShell(main);

    document.getElementById('friend-search-form').addEventListener('submit', async event => {
      event.preventDefault();
      const query = new FormData(event.currentTarget).get('query').trim();
      if (!query) return;
      const result = document.getElementById('friend-search-results');
      result.textContent = 'Suche …';
      try {
        const data = await apiGet(`/friends/search?q=${encodeURIComponent(query)}`);
        const users = data?.users || [];
        result.innerHTML = users.length ? users.map(user => `
          <div class="task-item" style="display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;">
            <strong>${friendsEscape(user.username)}</strong>
            <button type="button" onclick="sendFriendRequest(${friendsArg(user.id)})">Freundschaftsanfrage senden</button>
          </div>`).join('') : '<p>Keine passenden Benutzer gefunden.</p>';
      } catch (error) {
        result.innerHTML = `<p role="alert" style="color:#b00020;">${friendsEscape(friendsError(error))}</p>`;
      }
    });
    await friends.load();
  },

  load: async () => {
    const errorNode = document.getElementById('friends-error');
    const requestsNode = document.getElementById('friend-requests');
    const listNode = document.getElementById('friend-list');
    if (!requestsNode || !listNode) return;
    errorNode.textContent = '';
    try {
      const data = await apiGet('/friends');
      const records = data?.friends || [];
      const userId = String(appState.user.id);
      const accepted = records.filter(friend => friend.status === 'accepted');
      const incoming = records.filter(friend => friend.status === 'pending' && String(friend.addresseeId) === userId);
      requestsNode.innerHTML = incoming.length ? incoming.map(friend => `
        <div class="task-item" style="display:flex;justify-content:space-between;align-items:center;margin:.5rem 0;">
          <strong>${friendsEscape(friend.username || 'Benutzer')}</strong>
          <div style="display:flex;gap:.5rem;">
            <button type="button" onclick="respondFriendRequest(${friendsArg(friend.id)},'accepted')">Annehmen</button>
            <button type="button" onclick="respondFriendRequest(${friendsArg(friend.id)},'declined')">Ablehnen</button>
          </div>
        </div>`).join('') : '<p>Keine offenen Anfragen.</p>';
      listNode.innerHTML = accepted.length ? accepted.map(friend => `
        <div class="task-item" style="display:flex;justify-content:space-between;align-items:center;margin:.5rem 0;">
          <strong>${friendsEscape(friend.username || 'Benutzer')}</strong>
          <button type="button" onclick="removeFriend(${friendsArg(friend.id)})">Freund entfernen</button>
        </div>`).join('') : '<p>Du hast noch keine Freunde.</p>';
    } catch (error) {
      errorNode.textContent = friendsError(error);
      requestsNode.textContent = 'Anfragen konnten nicht geladen werden.';
      listNode.textContent = 'Freunde konnten nicht geladen werden.';
    }
  }
};

async function sendFriendRequest(userId) {
  try {
    await apiPost(`/friends/${encodeURIComponent(userId)}`);
    const result = document.getElementById('friend-search-results');
    if (result) result.textContent = 'Freundschaftsanfrage gesendet.';
    await friends.load();
  } catch (error) {
    const node = document.getElementById('friends-error');
    if (node) node.textContent = friendsError(error);
  }
}

async function respondFriendRequest(friendshipId, status) {
  try {
    await apiPut(`/friends/${encodeURIComponent(friendshipId)}`, { status });
    await friends.load();
  } catch (error) {
    const node = document.getElementById('friends-error');
    if (node) node.textContent = friendsError(error);
  }
}

async function removeFriend(friendshipId) {
  if (!confirm('Möchtest du diesen Freund wirklich entfernen?')) return;
  try {
    await apiDelete(`/friends/${encodeURIComponent(friendshipId)}`);
    await friends.load();
  } catch (error) {
    const node = document.getElementById('friends-error');
    if (node) node.textContent = friendsError(error);
  }
}

function friendsError(error) {
  return error?.message || 'Die Anfrage ist fehlgeschlagen. Bitte versuche es erneut.';
}

function friendsEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function friendsArg(value) {
  return JSON.stringify(String(value)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
