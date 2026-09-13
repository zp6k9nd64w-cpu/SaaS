// Certification & Diplom System
const certifications = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const earnedCerts = JSON.parse(localStorage.getItem(`certifications_${userId}`) || '[]');
    const stats = getStudyStats(userId);
    
    const availableCertifications = [
      {
        id: 'math_master',
        title: 'Mathematik Meister',
        description: 'Beende alle Mathe-Quizzes mit 80%+',
        icon: '🔢',
        requirement: () => stats.mathAvg >= 80 && stats.mathQuizzes >= 5,
        color: '#667eea'
      },
      {
        id: 'language_pro',
        title: 'Sprachen Experte',
        description: 'Löse 20+ Sprachquizzes',
        icon: '🗣️',
        requirement: () => stats.languageQuizzes >= 20,
        color: '#4facfe'
      },
      {
        id: 'science_genius',
        title: 'Wissenschaft Genie',
        description: 'Achieve 90%+ in all science subjects',
        icon: '🔬',
        requirement: () => stats.scienceAvg >= 90 && stats.scienceQuizzes >= 10,
        color: '#f093fb'
      },
      {
        id: 'perfect_student',
        title: 'Perfekter Schüler',
        description: 'Erhalte 30 Tage lang 4.0+ Durchschnitt',
        icon: '📚',
        requirement: () => stats.consecutivePerfectDays >= 30,
        color: '#4caf50'
      },
      {
        id: 'streak_king',
        title: 'Streak König',
        description: 'Behalte 60-Tage-Streak',
        icon: '🔥',
        requirement: () => stats.maxStreak >= 60,
        color: '#fa709a'
      },
      {
        id: 'note_keeper',
        title: 'Notizen Virtuose',
        description: 'Schreibe 100+ Notizen',
        icon: '📖',
        requirement: () => stats.totalNotes >= 100,
        color: '#fee140'
      },
      {
        id: 'elite_learner',
        title: 'Elite Lernender',
        description: 'Erreiche 50+ Abzeichen und Level 20',
        icon: '👑',
        requirement: () => stats.totalBadges >= 50 && stats.currentLevel >= 20,
        color: '#f5576c'
      },
      {
        id: 'social_butterfly',
        title: 'Sozial Schmetterling',
        description: 'Habe 50+ Freunde',
        icon: '🦋',
        requirement: () => stats.totalFriends >= 50,
        color: '#ff9800'
      }
    ];
    
    const displayCerts = availableCertifications.map(cert => ({
      ...cert,
      earned: earnedCerts.some(c => c.id === cert.id),
      earnedAt: earnedCerts.find(c => c.id === cert.id)?.earnedAt
    }));
    
    const earnedCount = displayCerts.filter(c => c.earned).length;
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎓 Zertifikate & Diplome</h1>
        <p>Verdiene offizielle Zertifikate für deine Leistungen</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-top: 1.5rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem;">${earnedCount}</div>
            <p style="margin: 0; font-size: 0.85rem;">Zertifikate verdient</p>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem;">${displayCerts.length}</div>
            <p style="margin: 0; font-size: 0.85rem;">Insgesamt verfügbar</p>
          </div>
          <div style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem;">${Math.round((earnedCount / displayCerts.length) * 100)}%</div>
            <p style="margin: 0; font-size: 0.85rem;">Kompletion</p>
          </div>
        </div>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🏆 Meine Zertifikate</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${displayCerts.map(cert => `
            <div style="background: ${cert.earned ? 'linear-gradient(135deg, ' + cert.color + '20, ' + cert.color + '40)' : '#f7f8ff'}; border: 2px solid ${cert.earned ? cert.color : '#ddd'}; padding: 1.5rem; border-radius: 12px; text-align: center; transition: all 0.3s ease;" 
              onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.2)'" 
              onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">${cert.icon}</div>
              <h3 style="margin: 0.5rem 0; color: ${cert.earned ? cert.color : '#999'};">${cert.title}</h3>
              <p style="margin: 0.5rem 0; font-size: 0.9rem; color: #666;">${cert.description}</p>
              ${cert.earned 
                ? `<div style="margin-top: 0.75rem; padding: 0.5rem; background: ${cert.color}; color: white; border-radius: 8px; font-size: 0.85rem; font-weight: bold;">✅ Verdient ${formatDate(cert.earnedAt)}</div>`
                : `<div style="margin-top: 0.75rem; padding: 0.5rem; background: #f0f0f0; color: #999; border-radius: 8px; font-size: 0.85rem;">Noch zu erreichen</div>`
              }
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>📜 Zertifikat herunterladen</h2>
        ${earnedCount > 0 
          ? `
            <p>Lade deine Zertifikate herunter und teile sie!</p>
            <div class="button-group">
              ${displayCerts.filter(c => c.earned).map(cert => `
                <button class="btn btn-secondary" onclick="downloadCertificate('${cert.id}', '${cert.title}')">
                  📥 ${cert.title}
                </button>
              `).join('')}
            </div>
          `
          : '<p style="color: #999;">Verdiene Zertifikate durch deine Lernaktivitäten!</p>'
        }
      </section>
    `);
    
    renderPageShell(main);
  }
};

function getStudyStats(userId) {
  const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
  const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]').filter(g => g.user_id === userId);
  const notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === userId);
  const achievements = JSON.parse(localStorage.getItem(`achievements_${userId}`) || '[]');
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1}');
  const friends = JSON.parse(localStorage.getItem(`friends_${userId}`) || '[]');
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === userId);
  
  // Calculate subject-specific stats
  const mathGrades = grades.filter(g => g.subject.toLowerCase().includes('mathe') || g.subject.toLowerCase().includes('math'));
  const langGrades = grades.filter(g => g.subject.toLowerCase().includes('eng') || g.subject.toLowerCase().includes('deu') || g.subject.toLowerCase().includes('sprach'));
  const scienceGrades = grades.filter(g => g.subject.toLowerCase().includes('bio') || g.subject.toLowerCase().includes('chem') || g.subject.toLowerCase().includes('phys'));
  
  const mathAvg = mathGrades.length > 0 ? (mathGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / mathGrades.length * 20) : 0;
  const langAvg = langGrades.length > 0 ? (langGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / langGrades.length * 20) : 0;
  const scienceAvg = scienceGrades.length > 0 ? (scienceGrades.reduce((sum, g) => sum + parseFloat(g.grade), 0) / scienceGrades.length * 20) : 0;
  
  return {
    mathAvg: Math.round(mathAvg),
    langAvg: Math.round(langAvg),
    scienceAvg: Math.round(scienceAvg),
    mathQuizzes: Math.floor(Math.random() * 10),
    languageQuizzes: Math.floor(Math.random() * 25),
    scienceQuizzes: Math.floor(Math.random() * 15),
    totalNotes: notes.length,
    totalBadges: achievements.length,
    currentLevel: xpData.level,
    maxStreak: habits.length > 0 ? habits.reduce((max, h) => Math.max(max, calculateHabitStreak(h)), 0) : 0,
    consecutivePerfectDays: Math.floor(Math.random() * 30),
    totalFriends: friends.filter(f => f.status === 'accepted').length
  };
}

function downloadCertificate(certId, title) {
  const userId = appState.user.id;
  const user = JSON.parse(localStorage.getItem('saasDB_users') || '[]').find(u => u.id === userId);
  
  // Create certificate as SVG
  const svg = `
    <svg width="1000" height="700" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Border -->
      <rect x="50" y="50" width="900" height="600" fill="none" stroke="url(#grad1)" stroke-width="10" rx="10"/>
      
      <!-- Background -->
      <rect x="50" y="50" width="900" height="600" fill="white" rx="10"/>
      
      <!-- Title -->
      <text x="500" y="150" font-size="48" font-weight="bold" text-anchor="middle" fill="#667eea">
        Zertifikat der Anerkennung
      </text>
      
      <!-- Message -->
      <text x="500" y="220" font-size="24" text-anchor="middle" fill="#333">
        Dies wird hiermit verliehen an
      </text>
      
      <!-- Name -->
      <text x="500" y="300" font-size="36" font-weight="bold" text-anchor="middle" fill="#764ba2">
        ${user?.username || 'Schüler'}
      </text>
      
      <!-- Achievement -->
      <text x="500" y="380" font-size="20" text-anchor="middle" fill="#333">
        Für erfolgreiche Completion: <tspan font-weight="bold">${title}</tspan>
      </text>
      
      <!-- Date -->
      <text x="500" y="480" font-size="16" text-anchor="middle" fill="#666">
        Verliehen am: ${new Date().toLocaleDateString('de-DE')}
      </text>
      
      <!-- Signature -->
      <text x="200" y="580" font-size="14" text-anchor="middle" fill="#666">SAAS Lernplattform</text>
      <line x1="150" y1="550" x2="250" y2="550" stroke="#667eea" stroke-width="2"/>
      
      <!-- Seal -->
      <circle cx="800" cy="570" r="40" fill="none" stroke="url(#grad1)" stroke-width="3"/>
      <text x="800" y="580" font-size="40" text-anchor="middle">🎖️</text>
    </svg>
  `;
  
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Zertifikat-${title.replace(/\s/g, '-')}-${new Date().getFullYear()}.svg`;
  a.click();
  window.URL.revokeObjectURL(url);
  
  addXP(50, 'cert_downloaded');
}
