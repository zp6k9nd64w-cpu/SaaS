// Resource Library - PDFs, Skripte, Notizen teilen
const resourceLibrary = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const myResources = JSON.parse(localStorage.getItem(`resources_${userId}`) || '[]');
    const savedResources = JSON.parse(localStorage.getItem(`saved_resources_${userId}`) || '[]');
    
    const communityResources = [
      { id: 'r1', title: 'Mathe Formelsammlung', author: 'Prof. Schmidt', type: 'PDF', downloads: 245, rating: 4.8, subject: 'Mathematik' },
      { id: 'r2', title: 'Biologie Lernzettel', author: 'Anna K.', type: 'PDF', downloads: 189, rating: 4.7, subject: 'Biologie' },
      { id: 'r3', title: 'Englisch Vokabeln Deck', author: 'Learning Hub', type: 'Flashcards', downloads: 312, rating: 4.9, subject: 'Englisch' },
      { id: 'r4', title: 'Geschichte Timeline', author: 'History Pro', type: 'PDF', downloads: 156, rating: 4.6, subject: 'Geschichte' },
      { id: 'r5', title: 'Chemie Reaktionstypen', author: 'Chem Master', type: 'PDF', downloads: 198, rating: 4.7, subject: 'Chemie' },
      { id: 'r6', title: 'Deutsch Literatur Analyse', author: 'Deutsch Team', type: 'Script', downloads: 224, rating: 4.8, subject: 'Deutsch' },
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>📚 Ressourcen-Bibliothek</h1>
        <p>Teile und entdecke Lernmaterialien der Community</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📤 Meine Ressourcen</h2>
        <button class="btn btn-primary" style="width: 100%; margin-bottom: 1rem;" onclick="showUploadModal()">
          ➕ Neue Ressource hochladen
        </button>
        
        ${myResources.length > 0
          ? `<div style="display: grid; gap: 1rem;">
              ${myResources.map(resource => `
                <div class="task-item" style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
                  <div>
                    <strong>${resource.title}</strong>
                    <p style="margin: 0.25rem 0; color: #999; font-size: 0.9rem;">
                      📥 ${resource.downloads || 0} Downloads • ⭐ ${resource.rating || 0}
                    </p>
                  </div>
                  <button class="btn btn-sm btn-secondary" onclick="deleteResource('${resource.id}')">🗑️</button>
                </div>
              `).join('')}
            </div>`
          : '<p style="color: #999; text-align: center; padding: 1rem;">Noch keine Ressourcen hochgeladen</p>'
        }
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🌍 Community Ressourcen</h2>
        <div style="display: grid; gap: 1rem; margin-bottom: 1rem;">
          <input type="text" placeholder="🔍 Ressourcen durchsuchen..." style="padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-size: 1rem;">
        </div>
        
        <div style="display: grid; gap: 1.5rem;">
          ${communityResources.map(resource => {
            const isSaved = savedResources.includes(resource.id);
            return `
              <div style="border: 2px solid #ddd; border-radius: 12px; padding: 1.5rem;">
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: start; margin-bottom: 1rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                      <span style="font-size: 1.5rem;">
                        ${resource.type === 'PDF' ? '📄' : resource.type === 'Flashcards' ? '🎴' : '📋'}
                      </span>
                      <h3 style="margin: 0;">${resource.title}</h3>
                    </div>
                    <p style="margin: 0; color: #667eea; font-size: 0.9rem;">von ${resource.author}</p>
                  </div>
                  <span style="background: #f0f0f0; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; color: #666;">
                    ${resource.subject}
                  </span>
                </div>
                
                <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem; font-size: 0.9rem; color: #666;">
                  <span>📥 ${resource.downloads}</span>
                  <span>⭐ ${resource.rating}</span>
                  <span>${resource.type}</span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                  <button class="btn btn-primary" onclick="downloadResource('${resource.id}')">📥 Download</button>
                  <button class="btn btn-secondary" onclick="toggleSaveResource('${resource.id}')" style="background: ${isSaved ? '#667eea' : '#ddd'}; color: ${isSaved ? 'white' : '#333'};">
                    ${isSaved ? '⭐ Gespeichert' : '☆ Speichern'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>💾 Gespeicherte Ressourcen</h2>
        ${savedResources.length > 0
          ? `<p style="color: #666;">Du hast ${savedResources.length} Ressourcen gespeichert</p>`
          : '<p style="color: #999;">Noch keine Ressourcen gespeichert</p>'
        }
      </section>
    `);
    
    renderPageShell(main);
  }
};

function showUploadModal() {
  const title = prompt('Ressourcen-Titel:');
  if (title) {
    const userId = appState.user.id;
    let resources = JSON.parse(localStorage.getItem(`resources_${userId}`) || '[]');
    
    resources.push({
      id: 'r_' + Date.now(),
      title,
      type: 'PDF',
      downloads: 0,
      rating: 0,
      uploadedAt: new Date().toISOString()
    });
    
    localStorage.setItem(`resources_${userId}`, JSON.stringify(resources));
    addXP(50, 'resource_shared');
    alert(`✅ Ressource "${title}" hochgeladen!`);
    resourceLibrary.render();
  }
}

function downloadResource(resourceId) {
  alert(`📥 Ressource wird heruntergeladen...\n\n✅ Download abgeschlossen!`);
  addXP(20, 'resource_downloaded');
}

function toggleSaveResource(resourceId) {
  const userId = appState.user.id;
  let saved = JSON.parse(localStorage.getItem(`saved_resources_${userId}`) || '[]');
  
  if (saved.includes(resourceId)) {
    saved = saved.filter(r => r !== resourceId);
  } else {
    saved.push(resourceId);
  }
  
  localStorage.setItem(`saved_resources_${userId}`, JSON.stringify(saved));
  resourceLibrary.render();
}

function deleteResource(resourceId) {
  if (confirm('Ressource löschen?')) {
    const userId = appState.user.id;
    let resources = JSON.parse(localStorage.getItem(`resources_${userId}`) || '[]');
    resources = resources.filter(r => r.id !== resourceId);
    localStorage.setItem(`resources_${userId}`, JSON.stringify(resources));
    alert('✅ Ressource gelöscht');
    resourceLibrary.render();
  }
}
