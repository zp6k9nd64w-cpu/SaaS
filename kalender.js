// Calendar Page
const kalender = {
  render: async () => {
    if (!requireAuth()) return;
    const tasks = await loadTasks();
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = today.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    let calendarHtml = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin:1rem 0;">';
    ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach(day => {
      calendarHtml += `<div style="text-align:center;font-weight:bold;padding:0.5rem;">${day}</div>`;
    });
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      calendarHtml += '<div></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasTask = tasks.some(t => t.due_date === dateStr);
      calendarHtml += `<div style="padding:0.5rem;border:1px solid #ddd;border-radius:8px;text-align:center;${hasTask ? 'background:#e8f4ff;' : ''}">${d}</div>`;
    }
    calendarHtml += '</div>';
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Kalender</h1>
        <h2>${monthName}</h2>
        ${calendarHtml}
        <h3 style="margin-top:2rem;">Anstehende Aufgaben</h3>
        <div class="task-list">
          ${tasks.filter(t => t.due_date).sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).map(t => `
            <div class="task-item" style="background:#f7f8ff;padding:1rem;border-radius:8px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <strong>${t.title}</strong>
                <p style="margin:0.5rem 0 0 0;color:#666;">${t.description}</p>
                <small style="color:#999;">${formatDate(t.due_date)}</small>
              </div>
              <button class="btn btn-secondary" onclick="deleteTask(${t.id})">Löschen</button>
            </div>
          `).join('')}
        </div>
      </div>
    `);
    renderPageShell(main);
  }
};
