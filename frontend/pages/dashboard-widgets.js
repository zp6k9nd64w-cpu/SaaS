// Advanced Dashboard Widgets - Customizable Dashboard
const dashboardWidgets = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const widgets = JSON.parse(localStorage.getItem(`dashboard_widgets_${userId}`) || '[]');
    const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"level": 1, "xp": 0}');
    const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
    const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]').filter(g => g.user_id === userId);
    
    const availableWidgets = [
      { id: 'w1', name: 'XP & Level', icon: '⭐' },
      { id: 'w2', name: 'Aufgaben-Übersicht', icon: '✅' },
      { id: 'w3', name: 'Ziel-Fortschritt', icon: '🎯' },
      { id: 'w4', name: 'Wochenaktivität', icon: '📊' },
      { id: 'w5', name: 'Freunde Online', icon: '👥' },
      { id: 'w6', name: 'Lernstreaks', icon: '🔥' },
      { id: 'w7', name: 'Tägliche Herausforderung', icon: '⚡' },
      { id: 'w8', name: 'Letztes Update', icon: '📢' }
    ];
    
    const activeWidgetIds = widgets.map(w => w.id);
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎨 Dashboard Widgets</h1>
        <p>Personalisiere dein Dashboard mit deinen liebsten Widgets</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📌 Meine Widgets</h2>
        <button class="btn btn-secondary" onclick="showWidgetLibrary()" style="margin-bottom: 1rem;">+ Widget hinzufügen</button>
        
        ${activeWidgetIds.length > 0
          ? `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
              ${widgets.map(widget => `
                <div style="border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem; background: linear-gradient(135deg, #667eea10, #764ba210); position: relative;">
                  <button onclick="removeWidget('${widget.id}')" style="position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.5; hover: opacity: 1;">✕</button>
                  
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem;">${availableWidgets.find(w => w.id === widget.id)?.icon}</span>
                    <h3 style="margin: 0;">${widget.name}</h3>
                  </div>
                  
                  ${widget.id === 'w1' ? `
                    <div style="background: white; padding: 1rem; border-radius: 8px;">
                      <p style="margin: 0; color: #999; font-size: 0.9rem;">Level</p>
                      <p style="margin: 0.25rem 0; font-size: 1.8rem; font-weight: bold; color: #667eea;">${xpData.level}</p>
                      <div style="background: #eee; height: 6px; border-radius: 3px; margin-top: 0.75rem; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: 65%;"></div>
                      </div>
                      <p style="margin: 0.5rem 0 0 0; font-size: 0.8rem; color: #999;">${xpData.xp} / 500 XP</p>
                    </div>
                  ` : ''}
                  
                  ${widget.id === 'w2' ? `
                    <div style="background: white; padding: 1rem; border-radius: 8px;">
                      <p style="margin: 0; font-size: 0.9rem;">
                        <strong>${tasks.filter(t => t.completed).length}/${tasks.length}</strong> erledigt
                      </p>
                      <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #999;">
                        ${tasks.filter(t => !t.completed).length} ausstehend
                      </p>
                    </div>
                  ` : ''}
                  
                  ${widget.id === 'w3' ? `
                    <div style="background: white; padding: 1rem; border-radius: 8px;">
                      <p style="margin: 0; color: #999; font-size: 0.9rem;">Ziele</p>
                      <p style="margin: 0.25rem 0; font-size: 1.8rem; font-weight: bold; color: #667eea;">${goals.filter(g => g.completed).length}/${goals.length}</p>
                      <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #999;">abgeschlossen</p>
                    </div>
                  ` : ''}
                  
                  ${widget.id === 'w4' ? `
                    <div style="background: white; padding: 1rem; border-radius: 8px;">
                      <p style="margin: 0; font-size: 0.85rem; color: #999;">Mo Di Mi Do Fr Sa So</p>
                      <div style="display: flex; gap: 3px; margin-top: 0.5rem;">
                        <span style="width: 20px; height: 20px; background: #c6e48b; border-radius: 3px;"></span>
                        <span style="width: 20px; height: 20px; background: #7bc96f; border-radius: 3px;"></span>
                        <span style="width: 20px; height: 20px; background: #239a3b; border-radius: 3px;"></span>
                        <span style="width: 20px; height: 20px; background: #196127; border-radius: 3px;"></span>
                        <span style="width: 20px; height: 20px; background: #ebedf0; border-radius: 3px;"></span>
                        <span style="width: 20px; height: 20px; background: #c6e48b; border-radius: 3px;"></span>
                        <span style="width: 20px; height: 20px; background: #7bc96f; border-radius: 3px;"></span>
                      </div>
                    </div>
                  ` : ''}
                  
                  ${widget.id === 'w6' ? `
                    <div style="background: white; padding: 1rem; border-radius: 8px;">
                      <p style="margin: 0; color: #999; font-size: 0.9rem;">Aktueller Streak</p>
                      <p style="margin: 0.25rem 0; font-size: 1.8rem; font-weight: bold; color: #f5576c;">7 🔥</p>
                      <p style="margin: 0.5rem 0; font-size: 0.85rem; color: #999;">Tage hintereinander</p>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>`
          : '<p style="color: #999; text-align: center; padding: 1rem;">Keine Widgets. Klick auf "Widget hinzufügen" um anzufangen!</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Widget-Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">🎨 <strong>Personalisierung:</strong> Wähle Widgets die dir wichtig sind</li>
          <li style="padding: 0.5rem 0;">📌 <strong>Übersicht:</strong> Sehe deine wichtigsten Stats auf einen Blick</li>
          <li style="padding: 0.5rem 0;">⚡ <strong>Motivation:</strong> Lass dich durch Streaks und Level motivieren</li>
          <li style="padding: 0.5rem 0;">🎯 <strong>Fokus:</strong> Verfolge deine Top-Prioritäten</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showWidgetLibrary() {
  const userId = appState.user.id;
  const widgets = JSON.parse(localStorage.getItem(`dashboard_widgets_${userId}`) || '[]');
  const activeWidgetIds = widgets.map(w => w.id);
  
  const availableWidgets = [
    { id: 'w1', name: 'XP & Level', icon: '⭐' },
    { id: 'w2', name: 'Aufgaben-Übersicht', icon: '✅' },
    { id: 'w3', name: 'Ziel-Fortschritt', icon: '🎯' },
    { id: 'w4', name: 'Wochenaktivität', icon: '📊' },
    { id: 'w5', name: 'Freunde Online', icon: '👥' },
    { id: 'w6', name: 'Lernstreaks', icon: '🔥' },
    { id: 'w7', name: 'Tägliche Herausforderung', icon: '⚡' },
    { id: 'w8', name: 'Letztes Update', icon: '📢' }
  ];
  
  let html = '<h2>Verfügbare Widgets</h2><div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">';
  
  availableWidgets.forEach(w => {
    const active = activeWidgetIds.includes(w.id);
    html += `
      <button onclick="toggleWidget('${w.id}', '${w.name}')" style="padding: 1rem; border: 2px solid ${active ? '#667eea' : '#ddd'}; border-radius: 8px; background: ${active ? '#f0f4ff' : 'white'}; cursor: pointer; text-align: left; transition: all 0.3s;">
        <span style="font-size: 1.5rem;">${w.icon}</span>
        <p style="margin: 0.5rem 0 0 0; font-weight: bold;">${w.name}</p>
        <p style="margin: 0; font-size: 0.85rem; color: #999;">${active ? '✓ Aktiv' : '+ Hinzufügen'}</p>
      </button>
    `;
  });
  
  html += '</div>';
  
  alert(html);
}

function toggleWidget(widgetId, widgetName) {
  const userId = appState.user.id;
  let widgets = JSON.parse(localStorage.getItem(`dashboard_widgets_${userId}`) || '[]');
  
  const index = widgets.findIndex(w => w.id === widgetId);
  if (index > -1) {
    widgets.splice(index, 1);
  } else {
    widgets.push({ id: widgetId, name: widgetName });
  }
  
  localStorage.setItem(`dashboard_widgets_${userId}`, JSON.stringify(widgets));
  addXP(10, 'widget_added');
  dashboardWidgets.render();
}

function removeWidget(widgetId) {
  const userId = appState.user.id;
  let widgets = JSON.parse(localStorage.getItem(`dashboard_widgets_${userId}`) || '[]');
  widgets = widgets.filter(w => w.id !== widgetId);
  localStorage.setItem(`dashboard_widgets_${userId}`, JSON.stringify(widgets));
  dashboardWidgets.render();
}
