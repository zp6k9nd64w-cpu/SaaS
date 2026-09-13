// Tasks Page
const aufgaben = {
  render: async () => {
    if (!requireAuth()) return;
    const tasks = await loadTasks();
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Aufgaben</h1>
        <p>Verwalte deine Aufgaben und Hausaufgaben</p>
        
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showTaskForm()">➕ Neue Aufgabe</button>
          <button class="btn btn-secondary" onclick="showTaskFilter()">🔍 Filter</button>
        </div>
      </div>
      
      <div id="task-form"></div>
      
      <div class="filters-bar" id="filters-bar" style="display: none; background: #f7f8ff; padding: 1rem; border-radius: 12px; margin: 1rem 0; display: none;">
        <input type="text" id="search-input" placeholder="Aufgabe suchen..." onkeyup="filterTasks()" style="width: 100%; padding: 0.75rem; margin-bottom: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <select id="priority-filter" onchange="filterTasks()">
            <option value="">Alle Prioritäten</option>
            <option value="high">🔴 Hoch</option>
            <option value="medium">🟡 Mittel</option>
            <option value="low">🟢 Niedrig</option>
          </select>
          <select id="status-filter" onchange="filterTasks()">
            <option value="">Alle Status</option>
            <option value="completed">✅ Erledigt</option>
            <option value="pending">⏳ Ausstehend</option>
          </select>
        </div>
      </div>
      
      <div class="task-list" style="margin-top:1.5rem;" id="task-list">
        ${tasks.length > 0 ? tasks.map(t => `
          <div class="task-item" data-priority="${t.priority}" data-status="${t.completed ? 'completed' : 'pending'}" data-search="${(t.title + t.description).toLowerCase()}">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                  <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="markTaskComplete(${t.id}, this.checked)" style="cursor: pointer; width: 20px; height: 20px;">
                  <span style="font-size: 0.85rem; padding: 0.25rem 0.5rem; background: ${t.priority === 'high' ? '#ffebee' : t.priority === 'medium' ? '#fff9c4' : '#e8f5e9'}; border-radius: 6px; color: ${t.priority === 'high' ? '#c62828' : t.priority === 'medium' ? '#f57f17' : '#2e7d32'}; font-weight: bold;">
                    ${t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢'} ${t.priority === 'high' ? 'Hoch' : t.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                  </span>
                </div>
                <strong style="${t.completed ? 'text-decoration: line-through; color: #999;' : ''}">${t.title}</strong>
                <p style="margin:0.5rem 0;color:#666;">${t.description}</p>
                ${t.fileUrl ? '<small style="color: #2c3edc;">📎 Datei angehängt</small><br>' : ''}
                <small style="color:#999;">${formatDate(t.due_date)}</small>
              </div>
              <button class="btn btn-sm btn-secondary" onclick="deleteTask(${t.id})">🗑️</button>
            </div>
          </div>
        `).join('') : '<p style="color: #999; padding: 1rem;">Keine Aufgaben. Erstellen Sie eine, um zu beginnen!</p>'}
      </div>
    `);
    renderPageShell(main);
  }
};

function showTaskFilter() {
  const filterBar = document.getElementById('filters-bar');
  filterBar.style.display = filterBar.style.display === 'none' ? 'block' : 'none';
}

function filterTasks() {
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const priorityFilter = document.getElementById('priority-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  
  const tasks = document.querySelectorAll('.task-item');
  tasks.forEach(task => {
    const matches = 
      task.getAttribute('data-search').includes(searchText) &&
      (!priorityFilter || task.getAttribute('data-priority') === priorityFilter) &&
      (!statusFilter || task.getAttribute('data-status') === statusFilter);
    
    task.style.display = matches ? 'block' : 'none';
  });
}

function markTaskComplete(taskId, completed) {
  const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]');
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = completed ? 1 : 0;
    localStorage.setItem('saasDB_tasks', JSON.stringify(tasks));
    updateStreak(appState.user.id);
    checkBadges(appState.user.id);
    
    // Add XP for completing task
    if (completed) {
      const result = addXP(10, 'task_completed');
      if (result.levelUp) {
        alert(`🎉 Level Up! Du bist jetzt Level ${result.level}!`);
      }
    }
    
    router.navigate('/aufgaben');
  }
}
