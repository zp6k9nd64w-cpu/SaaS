// Mentorship & Tutoring System
const mentorship = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
    const user = allUsers.find(u => u.id === userId);
    const myMentors = JSON.parse(localStorage.getItem(`mentors_${userId}`) || '[]');
    const myStudents = JSON.parse(localStorage.getItem(`students_${userId}`) || '[]');
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>👨‍🏫 Mentorship System</h1>
        <p>Lerne von Mentoren oder unterrichte andere Schüler</p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem;">
        <!-- Mentors Section -->
        <section class="page-card">
          <h2>👨‍🏫 Meine Mentoren</h2>
          <button class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;" onclick="showFindMentorDialog()">
            🔍 Mentor finden
          </button>
          
          ${myMentors.length > 0
            ? `<div style="display: grid; gap: 0.75rem;">
                ${myMentors.map(mentor => {
                  const mentorUser = allUsers.find(u => u.id === mentor.mentor_id);
                  return `
                    <div class="task-item">
                      <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                          <strong>${mentorUser?.username || 'Mentor'}</strong>
                          <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">📚 Spezialist in: Mathe, Englisch</p>
                          <p style="margin: 0.25rem 0; color: #999; font-size: 0.85rem;">⭐ ${mentor.sessions || 0} Sessions abgeschlossen</p>
                        </div>
                        <button class="btn btn-sm btn-secondary" onclick="removeMentor('${mentor.mentor_id}')">✕</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>`
            : '<p style="color: #999;">Du hast noch keinen Mentor. Finde einen!</p>'
          }
        </section>
        
        <!-- Students Section -->
        <section class="page-card">
          <h2>👨‍🎓 Meine Schüler</h2>
          <button class="btn btn-secondary" style="width: 100%; margin-bottom: 1rem;" onclick="toggleMentorMode()">
            📝 Mentor-Modus: ${user?.isMentor ? '✅' : '❌'}
          </button>
          
          ${myStudents.length > 0
            ? `<div style="display: grid; gap: 0.75rem;">
                ${myStudents.map(student => {
                  const studentUser = allUsers.find(u => u.id === student.student_id);
                  return `
                    <div class="task-item">
                      <div>
                        <strong>${studentUser?.username || 'Schüler'}</strong>
                        <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">📊 Level ${Math.floor(Math.random() * 20)}</p>
                        <p style="margin: 0.25rem 0; color: #999; font-size: 0.85rem;">⏰ Zuletzt aktiv: vor 2h</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>`
            : '<p style="color: #999;">Keine Schüler. Aktiviere Mentor-Modus!</p>'
          }
        </section>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📅 Mentoring Sessions</h2>
        <button class="btn btn-primary" style="margin-bottom: 1rem;" onclick="scheduleSession()">
          📅 Session planen
        </button>
        
        <div style="display: grid; gap: 0.75rem;">
          <div class="task-item" style="border-left: 4px solid #667eea;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>Mathe Tutoring mit Alex</strong>
                <p style="margin: 0.25rem 0; color: #667eea;">📅 Morgen um 14:00</p>
                <p style="margin: 0.25rem 0; color: #999; font-size: 0.9rem;">Thema: Quadratische Gleichungen</p>
              </div>
              <span style="background: #667eea; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">Geplant</span>
            </div>
          </div>
          
          <div class="task-item" style="border-left: 4px solid #4caf50;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong>Englisch Conversation</strong>
                <p style="margin: 0.25rem 0; color: #4caf50;">✅ Abgeschlossen</p>
                <p style="margin: 0.25rem 0; color: #999; font-size: 0.9rem;">Dauer: 45 Minuten • Feedback: Sehr gut!</p>
              </div>
              <span style="background: #4caf50; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">Abgeschlossen</span>
            </div>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>📚 Mentoring Vorteile</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <h3 style="margin-top: 0;">👨‍🎓 Als Schüler:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 0.25rem 0;">✅ 1-on-1 Anleitung</li>
              <li style="padding: 0.25rem 0;">✅ Personalisierte Pläne</li>
              <li style="padding: 0.25rem 0;">✅ +50 XP pro Session</li>
              <li style="padding: 0.25rem 0;">✅ Schneller Fortschritt</li>
            </ul>
          </div>
          <div>
            <h3 style="margin-top: 0;">👨‍🏫 Als Mentor:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="padding: 0.25rem 0;">✅ +100 XP pro Session</li>
              <li style="padding: 0.25rem 0;">✅ Mentor Badge</li>
              <li style="padding: 0.25rem 0;">✅ Premium Status</li>
              <li style="padding: 0.25rem 0;">✅ Reputation-Punkte</li>
            </ul>
          </div>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showFindMentorDialog() {
  const allUsers = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  const expertUsers = allUsers.filter(u => u.id !== appState.user.id).slice(0, 5);
  
  let list = expertUsers.map(u => `${u.username}`).join('\n');
  const selected = prompt(`Wähle einen Mentor:\n\n${list}`);
  
  if (selected) {
    const mentor = allUsers.find(u => u.username === selected);
    if (mentor) {
      const userId = appState.user.id;
      let mentors = JSON.parse(localStorage.getItem(`mentors_${userId}`) || '[]');
      
      if (!mentors.some(m => m.mentor_id === mentor.id)) {
        mentors.push({
          mentor_id: mentor.id,
          startedAt: new Date().toISOString(),
          sessions: 0
        });
        localStorage.setItem(`mentors_${userId}`, JSON.stringify(mentors));
        
        // Add mentor's student
        let students = JSON.parse(localStorage.getItem(`students_${mentor.id}`) || '[]');
        students.push({
          student_id: userId,
          startedAt: new Date().toISOString(),
          sessions: 0
        });
        localStorage.setItem(`students_${mentor.id}`, JSON.stringify(students));
        
        addXP(25, 'mentor_assigned');
        alert(`✅ ${mentor.username} ist jetzt dein Mentor!`);
        mentorship.render();
      }
    }
  }
}

function removeMentor(mentorId) {
  const userId = appState.user.id;
  const mentors = JSON.parse(localStorage.getItem(`mentors_${userId}`) || '[]');
  localStorage.setItem(`mentors_${userId}`, JSON.stringify(mentors.filter(m => m.mentor_id !== mentorId)));
  mentorship.render();
}

function toggleMentorMode() {
  const userId = appState.user.id;
  const users = JSON.parse(localStorage.getItem('saasDB_users') || '[]');
  const user = users.find(u => u.id === userId);
  
  if (user) {
    user.isMentor = !user.isMentor;
    localStorage.setItem('saasDB_users', JSON.stringify(users));
    
    if (user.isMentor) {
      addXP(100, 'mentor_mode_enabled');
      alert('✅ Du bist jetzt ein Mentor!');
    }
    
    mentorship.render();
  }
}

function scheduleSession() {
  const date = prompt('Datum und Zeit (z.B. Morgen 14:00):');
  const topic = prompt('Thema:');
  
  if (date && topic) {
    addXP(20, 'session_scheduled');
    alert('✅ Session geplant!');
  }
}
