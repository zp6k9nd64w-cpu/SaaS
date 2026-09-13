// Friends & Social System Page
const friends = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
    const friendsList = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]');
    const friendRequests = JSON.parse(localStorage.getItem(`friend_requests_${userId}`) || '[]');
    
    const myFriends = allUsers.filter(u => friendsList.some(f => f.friend_id === u.id && f.status === 'accepted'));
    const pendingRequests = friendRequests.filter(r => r.status === 'pending');
    const otherUsers = allUsers.filter(u => u.id !== userId && !myFriends.find(f => f.id === u.id) && !friendRequests.find(r => r.user_id === u.id));
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>👥 Soziales Netzwerk</h1>
        <p>Verbinde dich mit anderen Lernenden und teile Erfolge</p>
      </div>
      
      ${pendingRequests.length > 0 ? `
        <section class="page-card" style="margin-top: 1.5rem; border: 2px solid #ff9800;">
          <h2>📬 Freundschaftsanfragen (${pendingRequests.length})</h2>
          <div style="display: grid; gap: 0.75rem;">
            ${pendingRequests.map(req => {
              const user = allUsers.find(u => u.id === req.requester_id);
              return `
                <div class="task-item" style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong>${user?.username || 'Unbekannter Benutzer'}</strong>
                    <p style="margin: 0; font-size: 0.9rem; color: #667eea;">Möchte dir beitreten</p>
                  </div>
                  <div style="display: flex; gap: 0.5rem;">
                    <button onclick="acceptFriend('${req.requester_id}')" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">✅ Annehmen</button>
                    <button onclick="rejectFriend('${req.requester_id}')" style="padding: 0.5rem 1rem; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer;">❌ Ablehnen</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      ` : ''}
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>👫 Meine Freunde (${myFriends.length})</h2>
        ${myFriends.length > 0
          ? `<div style="display: grid; gap: 0.75rem;">
              ${myFriends.map(friend => {
                const friendStats = getFriendStats(friend.id);
                return `
                  <div class="task-item" style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                    <div>
                      <strong>${friend.username}</strong>
                      <p style="margin: 0.25rem 0; color: #667eea;">Level ${friendStats.level} • ${friendStats.xp} XP</p>
                      <p style="margin: 0; font-size: 0.85rem; color: #999;">📚 ${friendStats.completedTasks} Aufgaben • 📖 ${friendStats.notes} Notizen</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                      <button onclick="viewFriendProfile('${friend.id}')" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; border: none; border-radius: 8px; cursor: pointer;">👁️ Profil</button>
                      <button onclick="removeFriend('${friend.id}')" style="padding: 0.5rem 1rem; background: #f44336; color: white; border: none; border-radius: 8px; cursor: pointer;">✕</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>`
          : '<p style="color: #999;">Du hast noch keine Freunde. Verbinde dich mit anderen!</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🌟 Andere Lernende (${otherUsers.length})</h2>
        ${otherUsers.length > 0
          ? `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
              ${otherUsers.slice(0, 12).map(user => {
                const userStats = getFriendStats(user.id);
                return `
                  <div style="border: 1px solid #ddd; padding: 1rem; border-radius: 10px; text-align: center; transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.1)'" onmouseout="this.style.borderColor='#ddd'; this.style.boxShadow='none'">
                    <div style="width: 60px; height: 60px; margin: 0 auto 0.5rem; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">
                      ${user.username.charAt(0).toUpperCase()}
                    </div>
                    <strong style="display: block; margin: 0.5rem 0;">${user.username}</strong>
                    <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">Level ${userStats.level}</p>
                    <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #999;">${userStats.xp} XP • ${userStats.completedTasks} Aufgaben</p>
                    <button onclick="sendFriendRequest('${user.id}')" style="margin-top: 0.75rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold;">👋 Anfrage</button>
                  </div>
                `;
              }).join('')}
            </div>`
          : '<p style="color: #999;">Keine weiteren Benutzer verfügbar</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>🏆 Freund-Leaderboard</h2>
        <div style="display: grid; gap: 0.5rem;">
          ${myFriends.length > 0
            ? myFriends.map((friend, idx) => {
                const friendStats = getFriendStats(friend.id);
                return `
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: white; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                      <strong style="font-size: 1.2rem;">#${idx + 1}</strong>
                      <div>
                        <strong>${friend.username}</strong>
                        <p style="margin: 0; color: #667eea; font-size: 0.9rem;">Level ${friendStats.level}</p>
                      </div>
                    </div>
                    <strong style="font-size: 1.1rem; color: #667eea;">${friendStats.xp} XP</strong>
                  </div>
                `;
              }).join('')
            : '<p style="color: #999; margin: 0;">Füge Freunde hinzu, um ein Freund-Leaderboard zu sehen</p>'
          }
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function getFriendStats(userId) {
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"total_xp": 0, "level": 1}');
  const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
  const notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === userId);
  
  return {
    level: xpData.level,
    xp: xpData.total_xp,
    completedTasks: tasks.filter(t => t.completed).length,
    notes: notes.length
  };
}

function sendFriendRequest(targetId) {
  const userId = appState.user.id;
  const requests = JSON.parse(localStorage.getItem(`friend_requests_${targetId}`) || '[]');
  
  if (!requests.find(r => r.requester_id === userId)) {
    requests.push({
      id: Date.now(),
      requester_id: userId,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(`friend_requests_${targetId}`, JSON.stringify(requests));
    
    // Add XP for social action
    addXP(5, 'social_request');
    
    alert('✅ Freundschaftsanfrage gesendet!');
    friends.render();
  }
}

function acceptFriend(fromId) {
  const userId = appState.user.id;
  
  // Add to my friends
  const myFriends = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]');
  myFriends.push({
    friend_id: fromId,
    status: 'accepted',
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(`friends_${userId}`, JSON.stringify(myFriends));
  
  // Add reciprocal
  const theirFriends = JSON.parse(localStorage.getItem(`friends_${fromId}`) || '[]');
  theirFriends.push({
    friend_id: userId,
    status: 'accepted',
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(`friends_${fromId}`, JSON.stringify(theirFriends));
  
  // Remove request
  const requests = JSON.parse(localStorage.getItem(`friend_requests_${userId}`) || '[]');
  const updated = requests.map(r => r.requester_id === fromId ? {...r, status: 'accepted'} : r);
  localStorage.setItem(`friend_requests_${userId}`, JSON.stringify(updated));
  
  addXP(10, 'friend_accepted');
  alert('✅ Freund hinzugefügt!');
  friends.render();
}

function rejectFriend(fromId) {
  const userId = appState.user.id;
  const requests = JSON.parse(localStorage.getItem(`friend_requests_${userId}`) || '[]');
  const updated = requests.filter(r => r.requester_id !== fromId);
  localStorage.setItem(`friend_requests_${userId}`, JSON.stringify(updated));
  friends.render();
}

function removeFriend(friendId) {
  if (!confirm('Möchtest du diesen Freund wirklich entfernen?')) return;
  
  const userId = appState.user.id;
  const myFriends = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]');
  localStorage.setItem(`friends_${userId}`, JSON.stringify(myFriends.filter(f => f.friend_id !== friendId)));
  
  const theirFriends = JSON.parse(localStorage.getItem(`friends_${friendId}`) || '[]');
  localStorage.setItem(`friends_${friendId}`, JSON.stringify(theirFriends.filter(f => f.friend_id !== userId)));
  
  friends.render();
}

function viewFriendProfile(friendId) {
  // TODO: Implement friend profile view
  alert('Freund-Profil wird noch implementiert');
}

// Add XP helper function (will be added to helpers.js)
function addXP(amount, reason = 'activity') {
  if (!appState.user) return;
  
  const userId = appState.user.id;
  const xpKey = `xp_${userId}`;
  const xpData = JSON.parse(localStorage.getItem(xpKey) || '{"total_xp": 0, "level": 1, "xp_to_next": 500}');
  
  xpData.total_xp += amount;
  
  // Level progression (each level requires 500 more XP than previous)
  let xpNeeded = 500;
  let currentLevel = 1;
  let totalXpSpent = 0;
  
  while (totalXpSpent + xpNeeded <= xpData.total_xp) {
    totalXpSpent += xpNeeded;
    currentLevel++;
    xpNeeded = 500 * currentLevel;
  }
  
  xpData.level = currentLevel;
  xpData.xp_to_next = totalXpSpent + xpNeeded - xpData.total_xp;
  
  localStorage.setItem(xpKey, JSON.stringify(xpData));
}
