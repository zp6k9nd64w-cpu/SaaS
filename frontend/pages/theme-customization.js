// Theme Customization - Personalisierte Farb-Themes (Elite Only)
const themeCustomization = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const user = JSON.parse(localStorage.getItem(`user_${userId}`) || '{}');
    const isElite = user.plan === 'elite';
    
    if (!isElite) {
      renderPageShell(`
        <div class="page-card" style="text-align: center; padding: 3rem;">
          <h2>🎨 Theme Customization</h2>
          <p style="color: #999; margin: 1rem 0;">Dieses Feature ist nur für Elite-Nutzer verfügbar</p>
          <button class="btn btn-primary" onclick="router.navigate('/abo')">Upgrade zu Elite</button>
        </div>
      `);
      return;
    }
    
    const currentTheme = JSON.parse(localStorage.getItem(`theme_${userId}`) || '{"primary": "#667eea", "secondary": "#764ba2", "accent": "#f5576c"}');
    
    const presetThemes = [
      { name: 'Blau (Standard)', primary: '#667eea', secondary: '#764ba2', accent: '#f5576c' },
      { name: 'Grün (Natur)', primary: '#4caf50', secondary: '#45a049', accent: '#2196f3' },
      { name: 'Lila (Royal)', primary: '#9c27b0', secondary: '#7b1fa2', accent: '#e91e63' },
      { name: 'Orange (Energie)', primary: '#ff9800', secondary: '#f57c00', accent: '#2196f3' },
      { name: 'Rot (Dynamisch)', primary: '#f44336', secondary: '#d32f2f', accent: '#ffeb3b' },
      { name: 'Türkis (Frisch)', primary: '#00bcd4', secondary: '#00838f', accent: '#4caf50' },
      { name: 'Rosa (Soft)', primary: '#e91e63', secondary: '#c2185b', accent: '#9c27b0' },
      { name: 'Indigo (Tiefe)', primary: '#3f51b5', secondary: '#1a237e', accent: '#ff5722' },
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎨 Theme Customization</h1>
        <p>Personalisiere die Farben deiner Plattform</p>
        <p style="color: #999; font-size: 0.9rem;">⭐ Nur für Elite-Mitglieder</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🌈 Preset-Themes</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          ${presetThemes.map(theme => `
            <div style="border: 3px solid ${currentTheme.primary === theme.primary ? '#667eea' : '#ddd'}; border-radius: 12px; padding: 1rem; cursor: pointer; transition: all 0.3s ease;"
              onclick="applyTheme('${theme.primary}', '${theme.secondary}', '${theme.accent}')"
              onmouseover="this.style.transform='translateY(-4px)'"
              onmouseout="this.style.transform='none'">
              <p style="margin: 0 0 0.75rem 0; font-weight: bold; font-size: 0.9rem;">${theme.name}</p>
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                <div style="width: 30%; height: 40px; background: ${theme.primary}; border-radius: 6px;"></div>
                <div style="width: 30%; height: 40px; background: ${theme.secondary}; border-radius: 6px;"></div>
                <div style="width: 40%; height: 40px; background: ${theme.accent}; border-radius: 6px;"></div>
              </div>
              <button class="btn btn-sm btn-primary" style="width: 100%;">✓ Anwenden</button>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎯 Benutzerdefiniert</h2>
        <div style="display: grid; gap: 1.5rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
              🎨 Primärfarbe: ${currentTheme.primary}
            </label>
            <input type="color" value="${currentTheme.primary}" onchange="updateThemeColor('primary', this.value)" style="width: 100%; height: 50px; border: none; border-radius: 8px; cursor: pointer;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
              🎨 Sekundärfarbe: ${currentTheme.secondary}
            </label>
            <input type="color" value="${currentTheme.secondary}" onchange="updateThemeColor('secondary', this.value)" style="width: 100%; height: 50px; border: none; border-radius: 8px; cursor: pointer;">
          </div>
          
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
              🎨 Akzentfarbe: ${currentTheme.accent}
            </label>
            <input type="color" value="${currentTheme.accent}" onchange="updateThemeColor('accent', this.value)" style="width: 100%; height: 50px; border: none; border-radius: 8px; cursor: pointer;">
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>👁️ Vorschau</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <button class="btn" style="background: ${currentTheme.primary}; color: white; padding: 1rem;">Primär</button>
          <button class="btn" style="background: ${currentTheme.secondary}; color: white; padding: 1rem;">Sekundär</button>
          <button class="btn" style="background: ${currentTheme.accent}; color: white; padding: 1rem;">Akzent</button>
          <button class="btn" style="background: ${currentTheme.primary}; color: white; opacity: 0.6; padding: 1rem;">Hover</button>
        </div>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function applyTheme(primary, secondary, accent) {
  const userId = appState.user.id;
  const theme = { primary, secondary, accent };
  localStorage.setItem(`theme_${userId}`, JSON.stringify(theme));
  
  // Apply CSS variables
  document.documentElement.style.setProperty('--primary-color', primary);
  document.documentElement.style.setProperty('--secondary-color', secondary);
  document.documentElement.style.setProperty('--accent-color', accent);
  
  alert('✅ Theme angewendet!');
  themeCustomization.render();
}

function updateThemeColor(key, value) {
  const userId = appState.user.id;
  let theme = JSON.parse(localStorage.getItem(`theme_${userId}`) || '{"primary": "#667eea", "secondary": "#764ba2", "accent": "#f5576c"}');
  theme[key] = value;
  localStorage.setItem(`theme_${userId}`, JSON.stringify(theme));
  
  // Apply immediately
  if (key === 'primary') document.documentElement.style.setProperty('--primary-color', value);
  if (key === 'secondary') document.documentElement.style.setProperty('--secondary-color', value);
  if (key === 'accent') document.documentElement.style.setProperty('--accent-color', value);
  
  themeCustomization.render();
}
