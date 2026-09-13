// Grades Page
const noten = {
  render: async () => {
    if (!requireAuth()) return;
    const grades = await loadGrades();
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Notenübersicht</h1>
        <p>Verwalte und verfolge deine Schulnoten</p>
        
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showGradeForm()">➕ Note hinzufügen</button>
        </div>
        
        <div id="grade-form"></div>
        
        <div class="grade-list" style="margin-top:1.5rem;">
          ${grades.length > 0
            ? grades.map(g => `
                <div class="task-item">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong>${g.subject}</strong>
                      <p style="margin: 0.25rem 0; color: #666;">${g.type}</p>
                      <small style="color: #999;">${formatDate(g.date)}</small>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                      <div style="font-size: 2rem; font-weight: bold; color: #667eea; min-width: 50px; text-align: center;">${g.grade}</div>
                      <button class="btn btn-sm btn-secondary" onclick="deleteGrade(${g.id})">🗑️ Löschen</button>
                    </div>
                  </div>
                </div>
              `).join('')
            : '<p style="color: #999; padding: 1rem;">Keine Noten eingetragen</p>'
          }
        </div>
      </div>
    `);
    renderPageShell(main);
  }
};
