const studyGroups = {
  render: async () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📚 Lerngruppen</h1>
        <p>Erstelle Gruppen oder tritt einer Gruppe mit einem Einladungscode bei.</p>
        <button type="button" onclick="showCreateGroupModal()" style="margin-top:1rem;">+ Neue Gruppe</button>
        <form id="join-group-form" style="display:flex;gap:.5rem;margin-top:1rem;">
          <input name="joinCode" required placeholder="Einladungscode" style="flex:1;padding:.75rem;border:1px solid #ddd;border-radius:8px;">
          <button type="submit">Gruppe beitreten</button>
        </form>
      </div>
      <div id="groups-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <section class="page-card" style="margin-top:1.5rem;"><h2>📖 Meine Gruppen</h2><div id="groups-list">Lade Gruppen …</div></section>
      <div id="group-detail"></div>
    `);
    renderPageShell(main);
    document.getElementById('join-group-form').addEventListener('submit', async event => {
      event.preventDefault();
      const joinCode = new FormData(event.currentTarget).get('joinCode').trim();
      try {
        await apiPost('/groups/join', { joinCode });
        event.currentTarget.reset();
        await studyGroups.load();
      } catch (error) {
        studyGroups.showError(error);
      }
    });
    await studyGroups.load();
  },

  load: async () => {
    const list = document.getElementById('groups-list');
    if (!list) return;
    studyGroups.clearError();
    try {
      const data = await apiGet('/groups');
      const groups = data?.groups || [];
      studyGroups.groups = groups;
      list.innerHTML = groups.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:1rem;">
        ${groups.map(group => `
          <article class="task-item">
            <h3 style="margin-top:0;color:#667eea;">📚 ${studyGroupsEscape(group.name)}</h3>
            <p>${studyGroupsEscape(group.description || 'Keine Beschreibung')}</p>
            <p style="color:#777;">${studyGroupsEscape(group.subject || '')} · 👥 ${Number(group.memberCount) || 0}</p>
            ${String(group.ownerId) === String(appState.user.id) ? `<p><strong>Einladungscode:</strong> ${studyGroupsEscape(group.joinCode || 'Nicht verfügbar')}</p>` : ''}
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <button type="button" onclick="studyGroups.open(${studyGroupsArg(group.id)},${studyGroupsArg(group.name)})">Öffnen</button>
              <button type="button" onclick="leaveGroup(${studyGroupsArg(group.id)})">Gruppe verlassen</button>
            </div>
          </article>`).join('')}
      </div>` : '<p>Du bist noch keiner Lerngruppe beigetreten.</p>';
    } catch (error) {
      list.textContent = 'Gruppen konnten nicht geladen werden.';
      studyGroups.showError(error);
    }
  },

  open: async (groupId, groupName) => {
    const detail = document.getElementById('group-detail');
    if (!detail) return;
    detail.innerHTML = '<section class="page-card" style="margin-top:1.5rem;">Lade Gruppendaten …</section>';
    studyGroups.clearError();
    try {
      const [goalsData, itemsData] = await Promise.all([
        apiGet(`/groups/${encodeURIComponent(groupId)}/goals`),
        apiGet(`/groups/${encodeURIComponent(groupId)}/items`)
      ]);
      const goals = goalsData?.goals || [];
      const items = itemsData?.items || [];
      detail.innerHTML = `
        <section class="page-card" style="margin-top:1.5rem;">
          <h2>📚 ${studyGroupsEscape(groupName)}</h2>
          ${studyGroups.groupInviteCode(groupId)}
          <h3>🎯 Gruppenziele</h3>
          <div>${goals.length ? goals.map(goal => `<div class="task-item" style="margin:.5rem 0;">
            <strong>${studyGroupsEscape(goal.title)}</strong>
            <p>Fortschritt: ${studyGroupsEscape(goal.progress ?? 0)} / ${studyGroupsEscape(goal.target ?? '—')}${goal.dueDate ? ` · Fällig: ${studyGroupsEscape(goal.dueDate)}` : ''}</p>
            <form class="group-goal-progress-form" data-goal-id="${studyGroupsEscape(goal.id)}" data-target="${studyGroupsEscape(goal.target)}" style="display:flex;gap:.5rem;align-items:center;">
              <label>Fortschritt <input name="progress" type="number" min="0" max="${studyGroupsEscape(goal.target)}" step="1" required value="${studyGroupsEscape(goal.progress ?? 0)}" style="width:7rem;"></label>
              <button type="submit">Fortschritt aktualisieren</button>
            </form>
          </div>`).join('') : '<p>Noch keine Gruppenziele geteilt.</p>'}</div>
          <form id="group-goal-form" style="display:grid;gap:.5rem;margin-top:1rem;">
            <h4>Gemeinsames Ziel teilen</h4>
            <input name="title" required maxlength="200" placeholder="Zieltitel">
            <input name="target" type="number" min="1" required placeholder="Zielwert">
            <input name="dueDate" type="date">
            <button type="submit">Ziel hinzufügen</button>
          </form>
          <h3 style="margin-top:1.5rem;">📚 Geteilte Inhalte</h3>
          <div>${items.length ? items.map(item => `<div class="task-item" style="margin:.5rem 0;"><strong>${studyGroupsEscape(item.title)}</strong><p>${studyGroupsEscape(item.kind)} · ${studyGroupsEscape(item.content)}</p></div>`).join('') : '<p>Noch keine Inhalte geteilt.</p>'}</div>
          <form id="group-item-form" style="display:grid;gap:.5rem;margin-top:1rem;">
            <h4>Inhalt teilen</h4>
            <select name="kind"><option value="note">Notiz</option><option value="quiz">Quiz</option><option value="resource">Ressource</option></select>
            <input name="title" required maxlength="200" placeholder="Titel">
            <textarea name="content" required maxlength="10000" placeholder="Inhalt"></textarea>
            <button type="submit">Inhalt hinzufügen</button>
          </form>
        </section>`;
      document.getElementById('group-goal-form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const target = Number(form.elements.target.value);
        if (!Number.isFinite(target) || target < 1) return studyGroups.showError(new Error('Gib einen gültigen Zielwert ein.'));
        const goal = {
          title: form.elements.title.value.trim(),
          target,
          dueDate: form.elements.dueDate.value || null
        };
        try {
          await apiPost(`/groups/${encodeURIComponent(groupId)}/goals`, goal);
          await studyGroups.open(groupId, groupName);
        } catch (error) {
          studyGroups.showError(error);
        }
      });
      document.querySelectorAll('.group-goal-progress-form').forEach(form => {
        form.addEventListener('submit', async event => {
          event.preventDefault();
          const progress = Number(form.elements.progress.value);
          const target = Number(form.dataset.target);
          if (!Number.isInteger(progress) || progress < 0 || progress > target) {
            return studyGroups.showError(new Error(`Der Fortschritt muss eine ganze Zahl zwischen 0 und ${target} sein.`));
          }
          try {
            await apiPut(`/groups/${encodeURIComponent(groupId)}/goals/${encodeURIComponent(form.dataset.goalId)}`, { progress });
            await studyGroups.open(groupId, groupName);
          } catch (error) {
            studyGroups.showError(error);
          }
        });
      });
      document.getElementById('group-item-form').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        try {
          await apiPost(`/groups/${encodeURIComponent(groupId)}/items`, {
            kind: form.elements.kind.value,
            title: form.elements.title.value.trim(),
            content: form.elements.content.value.trim()
          });
          await studyGroups.open(groupId, groupName);
        } catch (error) {
          studyGroups.showError(error);
        }
      });
    } catch (error) {
      detail.innerHTML = `<section class="page-card" style="margin-top:1.5rem;">Gruppeninhalte konnten nicht geladen werden.</section>`;
      studyGroups.showError(error);
    }
  },

  groupInviteCode: groupId => {
    const group = (studyGroups.groups || []).find(item => String(item.id) === String(groupId));
    if (!group || String(group.ownerId) !== String(appState.user.id)) return '';
    return `<p><strong>Einladungscode:</strong> ${studyGroupsEscape(group.joinCode || 'Nicht verfügbar')}</p>`;
  },

  showError: error => {
    const node = document.getElementById('groups-error');
    if (node) node.textContent = error?.message || 'Die Gruppenanfrage ist fehlgeschlagen. Bitte versuche es erneut.';
  },

  clearError: () => {
    const node = document.getElementById('groups-error');
    if (node) node.textContent = '';
  }
};

async function showCreateGroupModal() {
  const name = prompt('Wie soll die Gruppe heißen?');
  if (!name?.trim()) return;
  const description = prompt('Beschreibung (optional):', '') || '';
  const subject = prompt('Fach (optional):', '') || '';
  try {
    await apiPost('/groups', { name: name.trim(), description: description.trim(), subject: subject.trim() });
    await studyGroups.load();
  } catch (error) {
    studyGroups.showError(error);
  }
}

async function leaveGroup(groupId) {
  if (!confirm('Möchtest du diese Gruppe wirklich verlassen?')) return;
  try {
    await apiDelete(`/groups/${encodeURIComponent(groupId)}/membership`);
    const detail = document.getElementById('group-detail');
    if (detail) detail.innerHTML = '';
    await studyGroups.load();
  } catch (error) {
    studyGroups.showError(error);
  }
}

function studyGroupsEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function studyGroupsArg(value) {
  return JSON.stringify(String(value)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
