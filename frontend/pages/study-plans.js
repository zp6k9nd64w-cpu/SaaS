// Study Plans & Curricula - Structured Learning Paths
const studyPlans = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const myPlans = JSON.parse(localStorage.getItem(`study_plans_${userId}`) || '[]');
    
    const availableCurricula = [
      {
        id: 'c1',
        name: 'Mathematik Abitur 2024',
        description: 'Kompletter Mathe-Lehrplan für das Abitur',
        duration: '120 Stunden',
        modules: 12,
        difficulty: 'Fortgeschritten',
        category: '📐 Mathematik',
        progress: 45,
        lessons: [
          'Funktionen & Gleichungen',
          'Differentialrechnung',
          'Integralrechnung',
          'Analytische Geometrie',
          'Stochastik & Kombinatorik'
        ]
      },
      {
        id: 'c2',
        name: 'English B2/C1 Level',
        description: 'Cambridge Certificate Vorbereitung',
        duration: '90 Stunden',
        modules: 8,
        difficulty: 'Fortgeschritten',
        category: '🗣️ Englisch',
        progress: 0,
        lessons: [
          'Business English',
          'Academic Writing',
          'Listening Comprehension',
          'Speaking Practice',
          'Exam Strategies'
        ]
      },
      {
        id: 'c3',
        name: 'Biologie Abitur Essentials',
        description: 'Core Topics für Bio-Abitur',
        duration: '100 Stunden',
        modules: 10,
        difficulty: 'Mittel',
        category: '🧬 Biologie',
        progress: 0,
        lessons: [
          'Zellbiologie',
          'Genetik',
          'Evolution',
          'Ökologie',
          'Humanbiologie'
        ]
      }
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📚 Lernpläne & Curricula</h1>
        <p>Folge strukturierten Lernpfaden für deine Ziele</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📋 Meine Lernpläne</h2>
        ${myPlans.length > 0
          ? `<div style="display: grid; gap: 1rem;">
              ${myPlans.map(plan => `
                <div class="task-item">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div>
                      <h3 style="margin: 0 0 0.25rem 0;">${plan.name}</h3>
                      <p style="margin: 0.25rem 0; color: #667eea; font-size: 0.9rem;">${plan.category}</p>
                    </div>
                    <span style="background: #f0f0f0; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">
                      ${plan.progress}% Fertig
                    </span>
                  </div>
                  <div style="background: #eee; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.75rem;">
                    <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${plan.progress}%;"></div>
                  </div>
                  <p style="margin: 0.5rem 0; color: #666; font-size: 0.9rem;">${plan.lessons.slice(0, 2).join(' • ')}</p>
                  <button class="btn btn-primary" style="margin-top: 0.75rem;" onclick="continuePlan('${plan.id}')">Fortsetzen</button>
                </div>
              `).join('')}
            </div>`
          : '<p style="color: #999; text-align: center; padding: 1rem;">Keine aktiven Lernpläne</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Verfügbare Curricula</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          ${availableCurricula.map(curriculum => {
            const isEnrolled = myPlans.some(p => p.id === curriculum.id);
            return `
              <div style="border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem; transition: all 0.3s ease;"
                onmouseover="this.style.borderColor='#667eea'; this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.2)'"
                onmouseout="this.style.borderColor='#ddd'; this.style.boxShadow='none'">
                <h3 style="margin: 0 0 0.5rem 0;">${curriculum.category}</h3>
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${curriculum.name}</h4>
                <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9rem;">${curriculum.description}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem; font-size: 0.9rem;">
                  <div>
                    <p style="margin: 0; color: #999;">Dauer</p>
                    <p style="margin: 0; font-weight: bold;">${curriculum.duration}</p>
                  </div>
                  <div>
                    <p style="margin: 0; color: #999;">Module</p>
                    <p style="margin: 0; font-weight: bold;">${curriculum.modules}</p>
                  </div>
                </div>
                
                <div style="background: #f7f8ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                  <p style="margin: 0; color: #667eea; font-size: 0.85rem; font-weight: bold;">Inhalte:</p>
                  <p style="margin: 0.25rem 0; color: #666; font-size: 0.85rem;">
                    ${curriculum.lessons.slice(0, 3).map(l => `✓ ${l}`).join('<br>')}
                  </p>
                </div>
                
                <button class="btn btn-primary" style="width: 100%;" onclick="enrollPlan('${curriculum.id}', '${curriculum.name}')">
                  ${isEnrolled ? '✅ Eingeschrieben' : '+ Beitreten'}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Lernplan-Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">📅 <strong>Konsistenz:</strong> Löse täglich mindestens eine Lektion</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Struktur:</strong> Folge dem vordefinierten Pfad für optimales Lernen</li>
          <li style="padding: 0.5rem 0;">📊 <strong>Tracking:</strong> Beobachte deinen Fortschritt in Echtzeit</li>
          <li style="padding: 0.5rem 0;">⭐ <strong>Abzeichen:</strong> Verdiene Abzeichen beim Abschluss von Modulen</li>
          <li style="padding: 0.5rem 0;">🏆 <strong>Zertifikat:</strong> Erhalte ein Zertifikat nach Fertigstellung</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function enrollPlan(planId, planName) {
  const userId = appState.user.id;
  let plans = JSON.parse(localStorage.getItem(`study_plans_${userId}`) || '[]');
  
  if (!plans.some(p => p.id === planId)) {
    plans.push({
      id: planId,
      name: planName,
      progress: 0,
      lessons: [],
      enrolledAt: new Date().toISOString(),
      category: '📚'
    });
    
    localStorage.setItem(`study_plans_${userId}`, JSON.stringify(plans));
    addXP(75, 'plan_enrolled');
    alert(`✅ Du bist "${planName}" beigetreten!`);
  }
  
  studyPlans.render();
}

function continuePlan(planId) {
  alert(`▶️ Lernplan weiterführen: ${planId}`);
}
