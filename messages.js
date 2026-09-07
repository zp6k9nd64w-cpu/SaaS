// Messages & Chat System Page
const messages = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const conversations = JSON.parse(localStorage.getItem(`conversations_${userId}`) || '[]');
    const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
    const friends = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]').filter(f => f.status === 'accepted');
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>💬 Nachrichten</h1>
        <p>Kommuniziere mit deinen Freunden und Lerngruppen</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1.5rem; margin-top: 1.5rem;">
        <!-- Conversations List -->
        <div class="page-card">
          <h2>👥 Unterhaltungen</h2>
          <div style="margin-bottom: 1rem;">
            ${friends.length > 0
              ? friends.map(f => {
                  const friend = allUsers.find(u => u.id === f.friend_id);
                  const conv = conversations.find(c => c.participant_id === f.friend_id);
                  const unreadCount = conv?.messages?.filter(m => !m.read && m.sender_id !== userId).length || 0;
                  const lastMsg = conv?.messages?.[conv.messages.length - 1];
                  
                  return `
                    <div class="task-item" onclick="openConversation('${f.friend_id}')" style="cursor: pointer; border-left: 3px solid ${conv?.active ? '#667eea' : 'transparent'}; padding-left: 0.75rem; transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f7f8ff'" onmouseout="this.style.backgroundColor='white'">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                          <strong>${friend?.username || 'Unbekannt'}</strong>
                          ${lastMsg ? `<p style="margin: 0.25rem 0; font-size: 0.85rem; color: #666; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px;">${lastMsg.sender_id === userId ? 'Du: ' : ''}${lastMsg.content}</p>` : ''}
                        </div>
                        ${unreadCount > 0 ? `<span style="background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">${unreadCount}</span>` : ''}
                      </div>
                    </div>
                  `;
                }).join('')
              : '<p style="color: #999;">Keine Freunde zum Chatten. Verbinde dich zuerst!</p>'
            }
          </div>
        </div>
        
        <!-- Chat Area -->
        <div class="page-card" id="chat-area" style="display: flex; flex-direction: column; max-height: 600px; position: relative;">
          <div id="no-conv-selected" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999;">
            <p style="text-align: center;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
              Wähle eine Unterhaltung aus, um zu chatten
            </p>
          </div>
        </div>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📞 Tipps für effektive Kommunikation</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">💡 <strong>Sei respektvoll:</strong> Behandle andere wie du selbst behandelt werden möchtest</li>
          <li style="padding: 0.5rem 0;">📚 <strong>Teile Ressourcen:</strong> Empfehle gute Lernmaterialien</li>
          <li style="padding: 0.5rem 0;">🤝 <strong>Zusammenarbeit:</strong> Bildet Lerngruppen für bessere Ergebnisse</li>
          <li style="padding: 0.5rem 0;">⏰ <strong>Respektiere Zeit:</strong> Schreibe zu angemessenen Zeiten</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function openConversation(friendId) {
  const userId = appState.user.id;
  const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  const friend = allUsers.find(u => u.id === friendId);
  
  let conversations = JSON.parse(localStorage.getItem(`conversations_${userId}`) || '[]');
  let conv = conversations.find(c => c.participant_id === friendId);
  
  if (!conv) {
    conv = {
      participant_id: friendId,
      active: true,
      createdAt: new Date().toISOString(),
      messages: []
    };
    conversations.push(conv);
  }
  
  // Mark as read
  conv.messages.forEach(m => m.read = true);
  conversations = conversations.map(c => c.participant_id === friendId ? conv : c);
  localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
  
  const chatArea = document.getElementById('chat-area');
  const noConvSelected = document.getElementById('no-conv-selected');
  
  if (noConvSelected) noConvSelected.remove();
  
  const messagesHtml = conv.messages.map(msg => `
    <div style="margin-bottom: 1rem; display: flex; ${msg.sender_id === userId ? 'justify-content: flex-end' : 'justify-content: flex-start'};">
      <div style="max-width: 70%; background: ${msg.sender_id === userId ? '#667eea' : '#e0e0e0'}; color: ${msg.sender_id === userId ? 'white' : '#1b1f32'}; padding: 0.75rem 1rem; border-radius: 12px; word-wrap: break-word;">
        <p style="margin: 0; font-size: 0.9rem;">${escapeHtml(msg.content)}</p>
        <p style="margin: 0.25rem 0 0; font-size: 0.75rem; opacity: 0.7;">${new Date(msg.timestamp).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}</p>
      </div>
    </div>
  `).join('');
  
  chatArea.innerHTML = `
    <div style="flex: 1; overflow-y: auto; padding-bottom: 1rem; margin-bottom: 1rem; border-bottom: 1px solid #ddd;">
      <h3 style="margin-top: 0;">${friend?.username || 'Chat'}</h3>
      ${messagesHtml || '<p style="color: #999; text-align: center;">Starte das Gespräch!</p>'}
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <input type="text" id="message-input" placeholder="Schreibe eine Nachricht..." style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.9rem;">
      <button onclick="sendMessage('${friendId}')" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">📤 Senden</button>
    </div>
  `;
  
  // Focus input
  setTimeout(() => document.getElementById('message-input').focus(), 100);
  
  // Scroll to bottom
  chatArea.querySelector('[style*="overflow-y"]').scrollTop = chatArea.querySelector('[style*="overflow-y"]').scrollHeight;
}

function sendMessage(friendId) {
  const userId = appState.user.id;
  const input = document.getElementById('message-input');
  const content = input.value.trim();
  
  if (!content) return;
  
  let conversations = JSON.parse(localStorage.getItem(`conversations_${userId}`) || '[]');
  let conv = conversations.find(c => c.participant_id === friendId);
  
  if (!conv) {
    conv = {
      participant_id: friendId,
      active: true,
      createdAt: new Date().toISOString(),
      messages: []
    };
    conversations.push(conv);
  }
  
  conv.messages.push({
    id: Date.now(),
    sender_id: userId,
    content: content,
    timestamp: new Date().toISOString(),
    read: false
  });
  
  localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
  
  // Add XP for messaging
  addXP(2, 'message');
  
  input.value = '';
  
  // Simulate friend reply after 2 seconds
  setTimeout(() => {
    if (Math.random() > 0.3) {
      conv.messages.push({
        id: Date.now(),
        sender_id: friendId,
        content: getRandomReply(),
        timestamp: new Date().toISOString(),
        read: false
      });
      localStorage.setItem(`conversations_${userId}`, JSON.stringify(conversations));
      openConversation(friendId);
    }
  }, 2000);
  
  openConversation(friendId);
}

function getRandomReply() {
  const replies = [
    '👍 Guter Punkt!',
    'Ja, das stimmt!',
    'Interessant, lass mich drüber nachdenken',
    '💡 Das ist eine tolle Idee!',
    'Lass uns später darüber sprechen',
    'Danke für die Info!',
    '🔥 Das ist fantastisch!',
    'Sehr hilfreich, danke!'
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
