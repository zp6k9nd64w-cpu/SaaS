// RPG-Style Skill Tree System
const skillTree = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const skillPoints = getAvailableSkillPoints(userId);
    const unlockedSkills = JSON.parse(localStorage.getItem(`skills_${userId}`) || '[]');
    
    const skillTrees = {
      scholar: {
        name: '📚 Gelehrter',
        description: 'Spezialisiere dich auf Wissen und Verständnis',
        skills: [
          { id: 's1', name: 'Schneller Leser', description: '+15% Lesefähigkeit', cost: 1, tier: 1, icon: '📖' },
          { id: 's2', name: 'Gedächtnispalast', description: '+20% Memorization', cost: 2, tier: 2, icon: '🧠' },
          { id: 's3', name: 'Kritisches Denken', description: '+25% Analysefähigkeit', cost: 3, tier: 3, icon: '🎓' }
        ]
      },
      warrior: {
        name: '⚔️ Kämpfer',
        description: 'Kämpfe dich durch schwierige Aufgaben',
        skills: [
          { id: 'w1', name: 'Ausdauer', description: '+10 Energie pro Tag', cost: 1, tier: 1, icon: '⚡' },
          { id: 'w2', name: 'Fokus-Schlag', description: '+30% Aufgaben-Geschwindigkeit', cost: 2, tier: 2, icon: '🎯' },
          { id: 'w3', name: 'Unbezwingbar', description: 'Ignoriere 50% negative Effekte', cost: 3, tier: 3, icon: '🛡️' }
        ]
      },
      mage: {
        name: '🧙 Magier',
        description: 'Nutze Intelligenz und Kreativität',
        skills: [
          { id: 'm1', name: 'Schnelle Notiz', description: '+25% Note-Erstellung Speed', cost: 1, tier: 1, icon: '✨' },
          { id: 'm2', name: 'Spellweaver', description: '+2 Bonus-XP pro Aktivität', cost: 2, tier: 2, icon: '🌟' },
          { id: 'm3', name: 'Zeitmanipulation', description: '+50% Effektivität Bonus-Zeit', cost: 3, tier: 3, icon: '⏰' }
        ]
      },
      rogue: {
        name: '🦁 Schurke',
        description: 'Spezialisiere dich auf Quizzes und Tests',
        skills: [
          { id: 'r1', name: 'Schnelle Fingers', description: '+20% Quiz-Geschwindigkeit', cost: 1, tier: 1, icon: '⚡' },
          { id: 'r2', name: 'Test-Master', description: '+15% Test-Ergebnisse', cost: 2, tier: 2, icon: '🎪' },
          { id: 'r3', name: 'Glücksschlag', description: '+10% Chance auf Bonus-XP', cost: 3, tier: 3, icon: '🍀' }
        ]
      }
    };
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>⚔️ Skill Tree (RPG-Modus)</h1>
        <p>Levele deine Fähigkeiten und spezialisiere dich auf Stärken</p>
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; margin-top: 1rem; text-align: center;">
          <p style="margin: 0; font-size: 0.9rem;">Verfügbare Skill-Punkte</p>
          <div style="font-size: 2.5rem; font-weight: bold; margin: 0.5rem 0;">${skillPoints}</div>
          <p style="margin: 0; font-size: 0.85rem;">Verdiene 5 Level-Ups = 1 Skill-Punkt</p>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
        ${Object.entries(skillTrees).map(([key, tree]) => `
          <div class="page-card">
            <h2>${tree.name}</h2>
            <p style="color: #666; margin-bottom: 1rem;">${tree.description}</p>
            
            <div style="display: grid; gap: 0.75rem;">
              ${tree.skills.map(skill => {
                const unlocked = unlockedSkills.some(s => s.id === skill.id);
                return `
                  <div style="border: 2px solid ${unlocked ? '#4caf50' : '#ddd'}; padding: 1rem; border-radius: 10px; background: ${unlocked ? 'rgba(76, 175, 80, 0.08)' : '#f7f8ff'}; cursor: pointer; transition: all 0.3s ease;" 
                    onmouseover="this.style.transform='translateX(4px)'" 
                    onmouseout="this.style.transform='none'">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">${skill.icon}</span>
                        <strong>${skill.name}</strong>
                      </div>
                      ${unlocked ? '<span style="background: #4caf50; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">✅ Gelernt</span>' : ''}
                    </div>
                    <p style="margin: 0.25rem 0; color: #666; font-size: 0.9rem;">${skill.description}</p>
                    ${!unlocked ? `
                      <button class="btn btn-primary" style="width: 100%; margin-top: 0.75rem; padding: 0.5rem;" onclick="unlockSkill('${skill.id}', ${skill.cost}, '${tree.name}')">
                        Freischalten (${skill.cost} Punkt${skill.cost > 1 ? 'e' : ''})
                      </button>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>🎮 Wie funktioniert das Skill Tree?</h2>
        <ul style="list-style: none; padding: 0; margin: 0;">
          <li style="padding: 0.5rem 0;">1️⃣ <strong>Skill-Punkte verdienen:</strong> Alle 5 Level-Ups bekommst du 1 Punkt</li>
          <li style="padding: 0.5rem 0;">2️⃣ <strong>Skill auswählen:</strong> Wähle aus 4 verschiedenen Klassen</li>
          <li style="padding: 0.5rem 0;">3️⃣ <strong>Freischalten:</strong> Gib Punkte aus um Fähigkeiten zu aktivieren</li>
          <li style="padding: 0.5rem 0;">4️⃣ <strong>Boni genießen:</strong> Jede Fähigkeit gibt dir Vorteile</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Spezialisierung:</strong> Fokussiere auf eine Klasse für mächtige Synergien</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function getAvailableSkillPoints(userId) {
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1}');
  const spentPoints = JSON.parse(localStorage.getItem(`skills_spent_${userId}`) || '[]').reduce((sum, s) => sum + s.cost, 0);
  const earnedPoints = Math.floor((xpData.level - 1) / 5);
  return Math.max(0, earnedPoints - spentPoints);
}

function unlockSkill(skillId, cost, className) {
  const userId = appState.user.id;
  const available = getAvailableSkillPoints(userId);
  
  if (available < cost) {
    alert(`❌ Du brauchst ${cost} Punkte, hast aber nur ${available}`);
    return;
  }
  
  const skills = JSON.parse(localStorage.getItem(`skills_${userId}`) || '[]');
  const spent = JSON.parse(localStorage.getItem(`skills_spent_${userId}`) || '[]');
  
  skills.push({
    id: skillId,
    className,
    unlockedAt: new Date().toISOString()
  });
  
  spent.push({
    skillId,
    cost,
    spentAt: new Date().toISOString()
  });
  
  localStorage.setItem(`skills_${userId}`, JSON.stringify(skills));
  localStorage.setItem(`skills_spent_${userId}`, JSON.stringify(spent));
  
  addXP(100, 'skill_unlocked');
  
  alert(`✅ Fähigkeit freigeschaltet! 🎉\nDu hast ${getAvailableSkillPoints(userId)} Punkte übrig`);
  skillTree.render();
}
