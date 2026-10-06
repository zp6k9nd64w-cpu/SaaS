const messages = {
  render: async () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card"><h1>💬 Nachrichten</h1><p>Unterhalte dich mit bestätigten Freunden.</p></div>
      <div id="messages-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <div style="display:grid;grid-template-columns:1fr 2fr;gap:1.5rem;margin-top:1.5rem;">
        <section class="page-card"><h2>👥 Unterhaltungen</h2><div id="message-friends">Lade Freunde …</div></section>
        <section class="page-card" id="chat-area" style="display:flex;flex-direction:column;min-height:350px;max-height:600px;">
          <div style="display:flex;align-items:center;justify-content:center;flex:1;color:#999;"><p>Wähle einen Freund aus, um Nachrichten zu laden.</p></div>
        </section>
      </div>
    `);
    renderPageShell(main);
    await messages.loadFriends();
  },

  loadFriends: async () => {
    const node = document.getElementById('message-friends');
    if (!node) return;
    try {
      const data = await apiGet('/friends');
      const userId = String(appState.user.id);
      const accepted = (data?.friends || []).filter(friend => friend.status === 'accepted');
      node.innerHTML = accepted.length ? accepted.map(friend => {
        const friendUserId = messages.friendUserId(friend, userId);
        return `<button type="button" onclick="openConversation(${messagesArg(friendUserId)},${messagesArg(friend.username || 'Freund')})" class="task-item" style="display:block;width:100%;text-align:left;margin:.5rem 0;cursor:pointer;">
          <strong>${messagesEscape(friend.username || 'Freund')}</strong>
        </button>`;
      }).join('') : '<p>Keine bestätigten Freunde zum Chatten.</p>';
    } catch (error) {
      node.innerHTML = `<p role="alert" style="color:#b00020;">${messagesEscape(messagesError(error))}</p>`;
    }
  },

  friendUserId: (friend, currentUserId) => {
    if (friend.userId != null) return friend.userId;
    return String(friend.requesterId) === currentUserId ? friend.addresseeId : friend.requesterId;
  }
};

async function openConversation(friendId, username) {
  const chatArea = document.getElementById('chat-area');
  if (!chatArea) return;
  chatArea.innerHTML = '<p>Nachrichten werden geladen …</p>';
  try {
    const friendsData = await apiGet('/friends');
    const userId = String(appState.user.id);
    const accepted = (friendsData?.friends || []).some(friend =>
      friend.status === 'accepted' && String(messages.friendUserId(friend, userId)) === String(friendId)
    );
    if (!accepted) throw new Error('Nachrichten sind nur mit bestätigten Freunden möglich.');
    const data = await apiGet(`/messages/${encodeURIComponent(friendId)}`);
    const items = data?.messages || [];
    chatArea.innerHTML = `
      <div id="message-list" style="flex:1;overflow-y:auto;padding-bottom:1rem;margin-bottom:1rem;border-bottom:1px solid #ddd;">
        <h3 style="margin-top:0;">${messagesEscape(username)}</h3>
        ${items.length ? items.map(message => {
          const own = String(message.senderId) === userId;
          const timestamp = message.createdAt ? new Date(message.createdAt).toLocaleString('de-DE') : '';
          return `<div style="margin-bottom:1rem;display:flex;justify-content:${own ? 'flex-end' : 'flex-start'};">
            <div style="max-width:75%;background:${own ? '#667eea' : '#e0e0e0'};color:${own ? 'white' : '#1b1f32'};padding:.75rem 1rem;border-radius:12px;word-wrap:break-word;">
              <p style="margin:0;font-size:.9rem;">${messagesEscape(message.body)}</p>
              <p style="margin:.25rem 0 0;font-size:.75rem;opacity:.7;">${messagesEscape(timestamp)}</p>
            </div>
          </div>`;
        }).join('') : '<p style="color:#999;text-align:center;">Noch keine Nachrichten.</p>'}
      </div>
      <form id="send-message-form" style="display:flex;gap:.5rem;">
        <input name="body" type="text" required maxlength="5000" placeholder="Schreibe eine Nachricht …" style="flex:1;padding:.75rem;border:1px solid #ddd;border-radius:8px;">
        <button type="submit">📤 Senden</button>
      </form>`;
    document.getElementById('send-message-form').addEventListener('submit', async event => {
      event.preventDefault();
      const input = event.currentTarget.elements.body;
      const body = input.value.trim();
      if (!body) return;
      const errorNode = document.getElementById('messages-error');
      errorNode.textContent = '';
      try {
        await apiPost(`/messages/${encodeURIComponent(friendId)}`, { body });
        await openConversation(friendId, username);
      } catch (error) {
        errorNode.textContent = messagesError(error);
      }
    });
    const list = document.getElementById('message-list');
    list.scrollTop = list.scrollHeight;
  } catch (error) {
    const errorNode = document.getElementById('messages-error');
    if (errorNode) errorNode.textContent = messagesError(error);
    chatArea.innerHTML = '<p>Diese Unterhaltung konnte nicht geladen werden.</p>';
  }
}

function messagesError(error) {
  return error?.message || 'Die Nachrichtenanfrage ist fehlgeschlagen. Bitte versuche es erneut.';
}

function messagesEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function messagesArg(value) {
  return JSON.stringify(String(value)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
