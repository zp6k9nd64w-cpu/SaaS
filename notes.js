// Notes App Page
const notes = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const allNotes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === appState.user.id);
    const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === appState.user.id);
    const selectedSubject = sessionStorage.getItem('selectedNoteSubject') || 'Alle';
    
    const displayNotes = selectedSubject === 'Alle' 
      ? allNotes 
      : allNotes.filter(n => n.subject === selectedSubject);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📝 Notizen</h1>
        <p>Erstelle und verwalte deine Lernnotizen</p>
        
        <div class="page-actions">
          <button class="btn btn-primary" onclick="showNoteForm()">➕ Neue Notiz</button>
        </div>
        
        ${subjects.length > 0 ? `
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
            <button class="btn ${selectedSubject === 'Alle' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="filterNotesBySubject('Alle')">Alle</button>
            ${subjects.map(s => `
              <button class="btn ${selectedSubject === s.name ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="filterNotesBySubject('${s.name}')">${s.name}</button>
            `).join('')}
          </div>
        ` : ''}
      </div>
      
      <div id="note-form"></div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📚 ${selectedSubject === 'Alle' ? 'Alle Notizen' : 'Notizen: ' + selectedSubject}</h2>
        <div style="display: grid; gap: 1rem;">
          ${displayNotes.length > 0
            ? displayNotes.map(note => `
                <div class="note-card" style="background: white; border-left: 4px solid #667eea; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <h3 style="margin: 0; color: #1b1f32;">${note.title}</h3>
                      <p style="margin: 0.5rem 0; color: #667eea; font-size: 0.9rem;">📚 ${note.subject}</p>
                      <p style="margin: 0.5rem 0; color: #666; line-height: 1.6; white-space: pre-wrap;">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>
                      <small style="color: #999;">Erstellt: ${formatDate(note.createdAt)}</small>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                      <button class="btn btn-primary btn-sm" onclick="editNote(${displayNotes.indexOf(note)})">✏️</button>
                      <button class="btn btn-secondary btn-sm" onclick="deleteNote('${note.id}')">🗑️</button>
                    </div>
                  </div>
                </div>
              `).join('')
            : '<p style="color: #999; padding: 1rem;">Keine Notizen für diese Kategorie.</p>'
          }
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showNoteForm() {
  const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === appState.user.id);
  const formContainer = document.getElementById('note-form');
  
  if (!formContainer) return;
  formContainer.innerHTML = `
    <div class="form-card" style="margin-top: 1.5rem;">
      <h3>Neue Notiz</h3>
      <input type="text" id="note-title" placeholder="Notiz-Titel (z.B. 'Mathe: Quadratische Funktionen')" required>
      <select id="note-subject" required>
        <option value="">Fach wählen...</option>
        ${subjects.length > 0 
          ? subjects.map(s => `<option value="${s.name}">${s.name}</option>`).join('')
          : '<option disabled>Bitte zuerst Fächer hinzufügen</option>'
        }
      </select>
      <textarea id="note-content" placeholder="Deine Notiz hier eingeben..." style="min-height: 200px; resize: vertical;" required></textarea>
      <div class="button-group" style="margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="saveNote()">✅ Notiz speichern</button>
        <button class="btn btn-secondary" onclick="document.getElementById('note-form').innerHTML=''">Abbrechen</button>
      </div>
    </div>
  `;
}

function saveNote() {
  const title = document.getElementById('note-title').value;
  const subject = document.getElementById('note-subject').value;
  const content = document.getElementById('note-content').value;
  
  if (!title || !subject || !content) {
    alert('Bitte alle Felder ausfüllen!');
    return;
  }
  
  let notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]');
  notes.push({
    id: Date.now().toString(),
    user_id: appState.user.id,
    title,
    subject,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  localStorage.setItem('saasDB_notes', JSON.stringify(notes));
  
  // Add XP for creating note
  const result = addXP(15, 'note_created');
  
  alert(`✅ Notiz gespeichert! +${result.xp > 0 ? '15 XP' : ''}`);
  document.getElementById('note-form').innerHTML = '';
  router.navigate('/notes');
}

function deleteNote(id) {
  if (!confirm('Notiz wirklich löschen?')) return;
  
  let notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]');
  notes = notes.filter(n => n.id !== id);
  
  localStorage.setItem('saasDB_notes', JSON.stringify(notes));
  router.navigate('/notes');
}

function filterNotesBySubject(subject) {
  if (subject === 'Alle') {
    sessionStorage.removeItem('selectedNoteSubject');
  } else {
    sessionStorage.setItem('selectedNoteSubject', subject);
  }
  router.navigate('/notes');
}

function editNote(idx) {
  const subjects = JSON.parse(localStorage.getItem('saasDB_subjects') || '[]').filter(s => s.user_id === appState.user.id);
  const selectedSubject = sessionStorage.getItem('selectedNoteSubject') || 'Alle';
  const allNotes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === appState.user.id);
  const displayNotes = selectedSubject === 'Alle' ? allNotes : allNotes.filter(n => n.subject === selectedSubject);
  const note = displayNotes[idx];
  
  const formContainer = document.getElementById('note-form');
  if (!formContainer) return;
  
  formContainer.innerHTML = `
    <div class="form-card" style="margin-top: 1.5rem;">
      <h3>Notiz bearbeiten</h3>
      <input type="text" id="note-title" value="${note.title}" required>
      <select id="note-subject" required>
        ${subjects.map(s => `<option value="${s.name}" ${s.name === note.subject ? 'selected' : ''}>${s.name}</option>`).join('')}
      </select>
      <textarea id="note-content" style="min-height: 200px;" required>${note.content}</textarea>
      <div class="button-group" style="margin-top: 1.5rem;">
        <button class="btn btn-primary" onclick="updateNote('${note.id}')">💾 Speichern</button>
        <button class="btn btn-secondary" onclick="document.getElementById('note-form').innerHTML=''">Abbrechen</button>
      </div>
    </div>
  `;
}

function updateNote(id) {
  const title = document.getElementById('note-title').value;
  const subject = document.getElementById('note-subject').value;
  const content = document.getElementById('note-content').value;
  
  if (!title || !subject || !content) {
    alert('Bitte alle Felder ausfüllen!');
    return;
  }
  
  let notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]');
  notes = notes.map(n => n.id === id ? { ...n, title, subject, content, updatedAt: new Date().toISOString() } : n);
  
  localStorage.setItem('saasDB_notes', JSON.stringify(notes));
  alert('✅ Notiz aktualisiert!');
  document.getElementById('note-form').innerHTML = '';
  router.navigate('/notes');
}
