// Podcast & Video Learning Library
const mediaLibrary = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    
    const userId = appState.user.id;
    const watchedVideos = JSON.parse(localStorage.getItem(`watched_${userId}`) || '[]');
    
    const videos = [
      { id: 'v1', title: 'Mathe-Grundlagen: Algebra Meistern', channel: 'MatheMaster', duration: '45min', views: 12500, rating: 4.8, category: 'Mathe', thumbnail: '📐' },
      { id: 'v2', title: 'Englisch Conversation - Anfänger bis Fortgeschrittene', channel: 'EnglishWay', duration: '60min', views: 8300, rating: 4.9, category: 'Englisch', thumbnail: '🗣️' },
      { id: 'v3', title: 'Biologie: Der menschliche Körper erklärt', channel: 'BioLab', duration: '52min', views: 15200, rating: 4.7, category: 'Biologie', thumbnail: '🧬' },
      { id: 'v4', title: 'Chemie - Periodensystem verstehen', channel: 'ChemieLive', duration: '38min', views: 5600, rating: 4.6, category: 'Chemie', thumbnail: '⚗️' },
      { id: 'v5', title: 'Geschichte: Die Renaissance', channel: 'HistoryX', duration: '55min', views: 9800, rating: 4.8, category: 'Geschichte', thumbnail: '🏛️' },
      { id: 'v6', title: 'Deutsch: Literaturanalyse Tipps', channel: 'DeutschPro', duration: '41min', views: 7200, rating: 4.7, category: 'Deutsch', thumbnail: '📚' }
    ];
    
    const podcasts = [
      { id: 'p1', title: 'Lernweise Podcast - Effizient studieren', host: 'Prof. Schmidt', duration: '35min', episodes: 124, category: 'Lerntechniken', icon: '🎧' },
      { id: 'p2', title: 'Abi-Crashkurs Podcast', host: 'Student Success', duration: '40min', episodes: 89, category: 'Prüfungsvorbereitung', icon: '🎯' },
      { id: 'p3', title: 'Science Simplified - Wissenschaft verstehen', host: 'Dr. Meyer', duration: '30min', episodes: 156, category: 'Wissenschaft', icon: '🔬' },
      { id: 'p4', title: 'Motivation Daily - Dein Lern-Coach', host: 'Life Coach', duration: '20min', episodes: 200, category: 'Motivation', icon: '💪' }
    ];
    
    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎬 Medien-Bibliothek</h1>
        <p>Lerne von YouTube Videos und Podcasts</p>
      </div>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎥 Videos nach Kategorie</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;">
          ${videos.map(video => {
            const watched = watchedVideos.includes(video.id);
            return `
              <div style="border: 1px solid #ddd; border-radius: 12px; overflow: hidden; transition: all 0.3s ease;" 
                onmouseover="this.style.boxShadow='0 8px 20px rgba(102, 126, 234, 0.2)'; this.style.transform='translateY(-4px)'" 
                onmouseout="this.style.boxShadow='none'; this.style.transform='none'">
                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 3rem; text-align: center; font-size: 3rem;">
                  ${video.thumbnail}
                </div>
                <div style="padding: 1rem;">
                  <h3 style="margin: 0 0 0.5rem 0; font-size: 0.95rem;">${video.title}</h3>
                  <p style="margin: 0.25rem 0; font-size: 0.9rem; color: #667eea;">${video.channel}</p>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.75rem 0; font-size: 0.85rem; color: #999;">
                    <span>⏱️ ${video.duration}</span>
                    <span>👁️ ${(video.views / 1000).toFixed(1)}K</span>
                    <span>⭐ ${video.rating}</span>
                  </div>
                  <button class="btn btn-primary" style="width: 100%; padding: 0.5rem;" onclick="watchVideo('${video.id}', '${video.title}')">
                    ${watched ? '✅ Angesehen' : '▶️ Abspielen'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>🎧 Podcasts</h2>
        <div style="display: grid; gap: 1rem;">
          ${podcasts.map(podcast => `
            <div class="task-item" style="display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: center;">
              <div>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                  <span style="font-size: 1.5rem;">${podcast.icon}</span>
                  <div>
                    <strong>${podcast.title}</strong>
                    <p style="margin: 0.25rem 0; font-size: 0.9rem; color: #667eea;">${podcast.host}</p>
                  </div>
                </div>
                <p style="margin: 0; font-size: 0.85rem; color: #999;">
                  🎙️ ${podcast.episodes} Episoden • ⏱️ ${podcast.duration} pro Episode
                </p>
              </div>
              <button class="btn btn-primary" onclick="subscribeToChannel('${podcast.id}')">+ Abonnieren</button>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem;">
        <h2>📊 Deine Fortschritte</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">${watchedVideos.length}</div>
            <p style="margin: 0; font-size: 0.9rem;">Videos angesehen</p>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">${Math.round(watchedVideos.length * 45 / 60)}</div>
            <p style="margin: 0; font-size: 0.9rem;">Stunden gelernt</p>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb, #f5576c); color: white; padding: 1.5rem; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: bold;">${watchedVideos.length * 50}</div>
            <p style="margin: 0; font-size: 0.9rem;">Bonus XP verdient</p>
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 1.5rem; background: linear-gradient(135deg, #667eea15, #764ba215);">
        <h2>💡 Video-Lernen Tipps</h2>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 0.5rem 0;">🎯 <strong>Aktives Lernen:</strong> Mache Notizen während du Videos schaust</li>
          <li style="padding: 0.5rem 0;">⏩ <strong>Geschwindigkeit:</strong> Nutze 1.25x oder 1.5x Speed für Effizienz</li>
          <li style="padding: 0.5rem 0;">📝 <strong>Zusammenfassung:</strong> Schreibe nach jedem Video kurze Notes</li>
          <li style="padding: 0.5rem 0;">🔄 <strong>Wiederholung:</strong> Schau Videos erneut für bessere Retention</li>
          <li style="padding: 0.5rem 0;">🎧 <strong>Podcasts:</strong> Perfekt für Lernpausen und Spaziergang</li>
        </ul>
      </section>
    `);
    
    renderPageShell(main);
  }
};

function watchVideo(videoId, title) {
  const userId = appState.user.id;
  let watched = JSON.parse(localStorage.getItem(`watched_${userId}`) || '[]');
  
  if (!watched.includes(videoId)) {
    watched.push(videoId);
    localStorage.setItem(`watched_${userId}`, JSON.stringify(watched));
    
    // Award XP
    const result = addXP(50, 'video_watched');
    alert(`✅ Video angesehen! +50 XP${result.levelUp ? '\n🎉 LEVEL UP!' : ''}`);
  }
  
  mediaLibrary.render();
}

function subscribeToChannel(podcastId) {
  const userId = appState.user.id;
  let subscriptions = JSON.parse(localStorage.getItem(`subscriptions_${userId}`) || '[]');
  
  if (!subscriptions.includes(podcastId)) {
    subscriptions.push(podcastId);
    localStorage.setItem(`subscriptions_${userId}`, JSON.stringify(subscriptions));
    
    addXP(25, 'podcast_subscribed');
    alert('✅ Podcast abonniert!');
  } else {
    subscriptions = subscriptions.filter(s => s !== podcastId);
    localStorage.setItem(`subscriptions_${userId}`, JSON.stringify(subscriptions));
    alert('❌ Abonnement entfernt');
  }
  
  mediaLibrary.render();
}
