// Subjects Management Page
const subjects = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    const userSubjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === appState.user.id);
    
    const availableSubjects = ['Mathe', 'Englisch', 'Deutsch', 'Biologie', 'Chemie', 'Physik', 'Geschichte', 'Geographie', 'Informatik', 'Kunst', 'Musik', 'Sport', 'Ethik', 'Religion'];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Meine Fächer</h1>
        <p>Verwalte deine Schulfächer für bessere Organisation</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>Fach hinzufügen</h2>
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem;">
          <select id="subject-select" style="padding: 0.75rem;">
            <option value="">Fach wählen...</option>
            ${availableSubjects.map(s => `<option value="${s}">${s}</option>`).join('')}
          </select>
          <button class="btn btn-primary" onclick="addSubject()">➕ Hinzufügen</button>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>Deine Fächer</h2>
        <div class="subjects-grid">
          ${userSubjects.length > 0
            ? userSubjects.map(subj => `
                <div class="subject-card">
                  <h3>${subj.name}</h3>
                  <p>${subj.color}</p>
                  <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn btn-sm btn-secondary" onclick="deleteSubject('${subj.id}')">🗑️ Löschen</button>
                  </div>
                </div>
              `).join('')
            : '<p style="color: #999;">Keine Fächer hinzugefügt. Starten Sie mit Ihren Hauptfächern!</p>'
          }
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function addSubject() {
  const select = document.getElementById('subject-select');
  const subjectName = select.value;
  
  if (!subjectName) {
    alert('Bitte ein Fach wählen');
    return;
  }
  
  if (!localStorage.getItem('saasDB_subjects')) {
    localStorage.setItem('saasDB_subjects', JSON.stringify([]));
  }
  
  const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]');
  
  if (subjects.some(s => s.user_id === appState.user.id && s.name === subjectName)) {
    alert('Dieses Fach ist bereits hinzugefügt');
    return;
  }
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  subjects.push({
    id: Date.now().toString(),
    user_id: appState.user.id,
    name: subjectName,
    color: colors[Math.floor(Math.random() * colors.length)]
  });
  
  localStorage.setItem('saasDB_subjects', JSON.stringify(subjects));
  select.value = '';
  router.navigate('/faecher');
}

function deleteSubject(id) {
  if (!confirm('Fach wirklich löschen?')) return;
  let subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]');
  subjects = subjects.filter(s => s.id !== id);
  localStorage.setItem('saasDB_subjects', JSON.stringify(subjects));
  router.navigate('/faecher');
}
