// Study Groups Page
const studyGroups = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const allGroups = JSON.parse(localStorage.getItem('saasDB_groups') || '[]');
    const myGroups = allGroups.filter(g => g.owner_id === userId || g.members.some(m => m.id === userId));
    const availableGroups = allGroups.filter(g => !g.members.some(m => m.id === userId) && g.owner_id !== userId);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📚 Lerngruppen</h1>
        <p>Gründe oder trete Lerngruppen bei und lerne gemeinsam</p>
        <button onclick="showCreateGroupModal()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">+ Neue Gruppe</button>
      </div>
      
      ${myGroups.length > 0 ? `
        <section class="page-card" style="margin-top: 1.5rem;">
          <h2>📖 Meine Gruppen (${myGroups.length})</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
            ${myGroups.map(group => `
              <div class="task-item" style="cursor: pointer; transition: all 0.3s ease;" onclick="openGroup('${group.id}')" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.2)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0; color: #667eea;">📚 ${group.name}</h3>
                  ${group.owner_id === userId ? '<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: bold;">Eigentümer</span>' : ''}
                </div>
                <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${group.description || 'Keine Beschreibung'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-size: 0.85rem; color: #999;">👥 ${group.members.length} ${group.members.length === 1 ? 'Mitglied' : 'Mitglieder'}</p>
                  <button onclick="leaveGroup('${group.id}'); event.stopPropagation();" style="padding: 0.4rem 0.8rem; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">Verlassen</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
      
      ${availableGroups.length > 0 ? `
        <section class="page-card" style="margin-top: 1.5rem;">
          <h2>🌟 Verfügbare Gruppen (${availableGroups.length})</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
            ${availableGroups.map(group => `
              <div class="task-item" style="border: 2px solid #ddd; transition: all 0.3s ease;" onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.1)'" onmouseout="this.style.borderColor='#ddd'; this.style.boxShadow='none'">
                <h3 style="margin: 0 0 0.5rem 0; color: #667eea;">📚 ${group.name}</h3>
                <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${group.description || 'Keine Beschreibung'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #eee;">
                  <p style="margin: 0; font-size: 0.85rem; color: #999;">👥 ${group.members.length} ${group.members.length === 1 ? 'Mitglied' : 'Mitglieder'}</p>
                  <button onclick="joinGroup('${group.id}')" style="padding: 0.4rem 0.8rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.85rem;">➕ Beitreten</button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}
      
      ${myGroups.length === 0 && availableGroups.length === 0 ? `
        <div class="page-card" style="margin-top: 1.5rem; text-align: center; padding: 2rem;">
          <p style="font-size: 1.2rem; color: #999;">Keine Gruppen vorhanden</p>
          <p style="color: #999;">Gründe eine neue Gruppe oder warte, bis Freunde eine erstellen!</p>
        </div>
      ` : ''}
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>🎯 Vorteile von Lerngruppen</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">✅ <strong>Zusammenarbeit:</strong> Lernt gemeinsam und helft euch gegenseitig</li>
          <li style="padding: 0.5rem 0;">📚 <strong>Ressourcen teilen:</strong> Teilt Notizen, Quizzes und Lernmaterialien</li>
          <li style="padding: 0.5rem 0;">👥 <strong>Motivation:</strong> Bleibt motiviert durch gegenseitige Unterstützung</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Gruppenfortschritt:</strong> Verfolgt gemeinsame Ziele und Erfolge</li>
          <li style="padding: 0.5rem 0;">💬 <strong>Kommunikation:</strong> Diskutiert Themen und löst Probleme zusammen</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showCreateGroupModal() {
  const name = prompt('Wie soll die Gruppe heißen?');
  if (!name) return;
  
  const description = prompt('Beschreibe die Gruppe kurz:');
  const subject = prompt('Hauptfach (optional):', '');
  
  const userId = appState.user.id;
  const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  const user = allUsers.find(u => u.id === userId);
  
  const groups = JSON.parse(localStorage.getItem('saasDB_groups') || '[]');
  const newGroup = {
    id: `group_${Date.now()}`,
    name: name,
    description: description,
    subject: subject,
    owner_id: userId,
    owner_name: user?.username,
    members: [{id: userId, name: user?.username}],
    sharedResources: [],
    groupGoals: [],
    createdAt: new Date().toISOString()
  };
  
  groups.push(newGroup);
  localStorage.setItem('saasDB_groups', JSON.stringify(groups));
  
  addXP(25, 'group_created');
  
  alert('✅ Gruppe erfolgreich erstellt!');
  studyGroups.render();
}

function openGroup(groupId) {
  const groups = JSON.parse(localStorage.getItem('saasDB_groups') || '[]');
  const group = groups.find(g => g.id === groupId);
  
  if (!group) return;
  
  const userId = appState.user.id;
  const isOwner = group.owner_id === userId;
  const members = group.members || [];
  
  const html = `
    <div class="page-card">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h1>📚 ${group.name}</h1>
          <p>${group.description || 'Keine Beschreibung'}</p>
        </div>
        <button onclick="studyGroups.render()" style="padding: 0.5rem 1rem; background: #ddd; border: none; border-radius: 8px; cursor: pointer;">← Zurück</button>
      </div>
    </div>
    
    <section class="page-card" style="margin-top: 1.5rem;">
      <h2>👥 Mitglieder (${members.length})</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
        ${members.map(member => `
          <div style="padding: 1rem; background: #f7f8ff; border-radius: 10px; text-align: center;">
            <div style="width: 50px; height: 50px; margin: 0 auto 0.5rem; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
              ${member.name.charAt(0).toUpperCase()}
            </div>
            <strong>${member.name}</strong>
            ${member.id === group.owner_id ? '<p style="margin: 0.25rem 0; color: #667eea; font-size: 0.85rem;">Eigentümer</p>' : ''}
          </div>
        `).join('')}
      </div>
      ${isOwner ? `<button onclick="showInviteModal('${groupId}')" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">➕ Mitglied einladen</button>` : ''}
    </section>
    
    <section class="page-card" style="margin-top: 1.5rem;">
      <h2>📚 Gemeinsame Ressourcen</h2>
      <p style="color: #999;">Teilt Notizen, Quizzes und Lernmaterialien (bald verfügbar)</p>
    </section>
    
    <section class="page-card" style="margin-top: 1.5rem;">
      <h2>🎯 Gruppenziele</h2>
      <p style="color: #999;">Legt gemeinsame Lernziele fest (bald verfügbar)</p>
    </section>
  `;
  
  const main = createPageContainer(html);
  renderPageShell(main);
}

function showInviteModal(groupId) {
  const users = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  const groups = JSON.parse(localStorage.getItem('saasDB_groups') || '[]');
  const group = groups.find(g => g.id === groupId);
  
  const nonMembers = users.filter(u => !group.members.some(m => m.id === u.id) && u.id !== group.owner_id);
  
  if (nonMembers.length === 0) {
    alert('Alle verfügbaren Benutzer sind bereits Mitglieder!');
    return;
  }
  
  let userList = nonMembers.map(u => `${u.username} (ID: ${u.id})`).join('\n');
  const selected = prompt(`Wähle einen Benutzer zum Einladen:\n\n${userList}`);
  
  if (!selected) return;
  
  // TODO: Implement invite system with notifications
  alert('Einladung gesendet!');
}

function joinGroup(groupId) {
  const userId = appState.user.id;
  const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  const user = allUsers.find(u => u.id === userId);
  
  const groups = JSON.parse(localStorage.getItem('saasDB_groups') || '[]');
  const group = groups.find(g => g.id === groupId);
  
  if (group && !group.members.some(m => m.id === userId)) {
    group.members.push({id: userId, name: user?.username});
    localStorage.setItem('saasDB_groups', JSON.stringify(groups));
    
    addXP(15, 'group_joined');
    
    alert('✅ Du bist der Gruppe beigetreten!');
    studyGroups.render();
  }
}

function leaveGroup(groupId) {
  if (!confirm('Möchtest du diese Gruppe wirklich verlassen?')) return;
  
  const userId = appState.user.id;
  const groups = JSON.parse(localStorage.getItem('saasDB_groups') || '[]');
  const group = groups.find(g => g.id === groupId);
  
  if (group && group.owner_id !== userId) {
    group.members = group.members.filter(m => m.id !== userId);
    localStorage.setItem('saasDB_groups', JSON.stringify(groups));
    studyGroups.render();
  } else if (group && group.owner_id === userId) {
    alert('⚠️ Als Eigentümer kannst du die Gruppe nicht verlassen. Lösche sie stattdessen oder ernennen einen neuen Eigentümer.');
  }
}
