// User-managed YouTube lessons, learning paths, timestamps, and notes.
const mediaLibrary = {
  render: () => {
    if (!requireAuth()) return;
    mockDB.init();
    const userId = String(appState.user.id);
    const videos = mediaReadVideos(userId);
    const paths = mediaReadPaths(userId);
    const watched = JSON.parse(localStorage.getItem(`watched_${userId}`) || '[]');
    const videoCards = videos.map(video => {
      const pathOptions = paths.map(path => `<option value="${mediaEscape(path.id)}" ${video.pathIds?.includes(path.id) ? 'selected' : ''}>${mediaEscape(path.title)}</option>`).join('');
      return `
        <article class="task-item" style="padding:1rem;border:1px solid #ddd;border-radius:12px;">
          <div style="display:flex;justify-content:space-between;gap:1rem;align-items:start;">
            <div><h3 style="margin:0;">${mediaEscape(video.title)}</h3><p style="margin:0.35rem 0;color:#667eea;">${mediaEscape(video.category || 'Ohne Kategorie')}</p></div>
            <button class="btn btn-sm btn-secondary" onclick="mediaDeleteVideo('${mediaEscape(video.id)}')">Entfernen</button>
          </div>
          <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:0.75rem 0;">
            <iframe src="https://www.youtube-nocookie.com/embed/${video.youtubeId}${mediaStartParam(video.timestamps?.[0]?.seconds)}"
              title="${mediaEscape(video.title)}" style="position:absolute;inset:0;width:100%;height:100%;border:0;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
          </div>
          <p style="overflow-wrap:anywhere;"><a href="${mediaEscape(video.url)}" target="_blank" rel="noopener noreferrer">Auf YouTube öffnen</a></p>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="mediaMarkWatched('${mediaEscape(video.id)}')">${watched.includes(video.id) ? '✅ Als angesehen markiert' : '☐ Als angesehen markieren'}</button>
            ${paths.length ? `<select id="media-path-${mediaEscape(video.id)}"><option value="">Lernpfad auswählen</option>${pathOptions}</select><button class="btn btn-secondary" onclick="mediaAssignPath('${mediaEscape(video.id)}')">Pfad speichern</button>` : ''}
          </div>
          <h4 style="margin-bottom:0.5rem;">Zeitmarken</h4>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
            ${(video.timestamps || []).map((mark, index) => `<a class="btn btn-secondary" target="_blank" rel="noopener noreferrer" href="${mediaEscape(mediaTimestampUrl(video, mark.seconds))}">${mediaEscape(mark.label)} (${mediaFormatTime(mark.seconds)})</a><button class="btn btn-sm btn-secondary" aria-label="Zeitmarke löschen" onclick="mediaDeleteTimestamp('${mediaEscape(video.id)}', ${index})">✕</button>`).join('') || '<span style="color:#999;">Noch keine Zeitmarken.</span>'}
          </div>
          <form onsubmit="mediaAddTimestamp(event, '${mediaEscape(video.id)}')" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">
            <input name="label" required maxlength="80" placeholder="Thema / Zeitmarkenname">
            <input name="time" required placeholder="Zeit z. B. 3:25" pattern="\\d{1,2}:\\d{2}(:\\d{2})?" title="mm:ss oder hh:mm:ss">
            <button class="btn btn-secondary" type="submit">Zeitmarke hinzufügen</button>
          </form>
          <label for="media-notes-${mediaEscape(video.id)}"><strong>Meine Notizen</strong></label>
          <textarea id="media-notes-${mediaEscape(video.id)}" maxlength="5000" style="width:100%;min-height:100px;">${mediaEscape(video.notes || '')}</textarea>
          <button class="btn btn-secondary" style="margin-top:0.5rem;" onclick="mediaSaveNotes('${mediaEscape(video.id)}')">Notizen speichern</button>
        </article>`;
    }).join('');

    const main = createPageContainer(`
      <div class="page-card">
        <h1>🎬 Medien-Bibliothek</h1>
        <p>Füge eigene YouTube-Links hinzu, bette Videos ein und organisiere sie in Lernpfaden. Videos werden nicht vorgegeben.</p>
      </div>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>➕ YouTube-Video hinzufügen</h2>
        <form onsubmit="mediaAddVideo(event)" style="display:grid;gap:0.75rem;">
          <input id="media-url" required type="url" placeholder="YouTube-URL (youtube.com oder youtu.be)">
          <input id="media-title" required maxlength="120" placeholder="Videotitel">
          <input id="media-category" maxlength="80" placeholder="Fach / Kategorie (optional)">
          <button class="btn btn-primary" type="submit">Video speichern</button>
        </form>
        <p style="color:#777;font-size:0.9rem;">Es werden YouTube-Video-URLs unterstützt; Wiedergabe im Embed hängt von den Einbettungseinstellungen des Videos ab.</p>
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>🧭 Lernpfade</h2>
        <form onsubmit="mediaCreatePath(event)" style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <input name="title" required maxlength="100" placeholder="Name des Lernpfads">
          <button class="btn btn-primary" type="submit">Lernpfad erstellen</button>
        </form>
        ${paths.length ? `<div style="display:grid;gap:0.75rem;margin-top:1rem;">${paths.map(path => {
          const linked = videos.filter(video => video.pathIds?.includes(path.id));
          return `<div class="task-item" style="padding:1rem;"><strong>${mediaEscape(path.title)}</strong><p style="margin:0.5rem 0;">${linked.length ? linked.map(video => mediaEscape(video.title)).join(' · ') : 'Noch keine Videos zugeordnet.'}</p><button class="btn btn-sm btn-secondary" onclick="mediaDeletePath('${mediaEscape(path.id)}')">Lernpfad löschen</button></div>`;
        }).join('')}</div>` : '<p style="color:#999;margin-top:1rem;">Noch keine Lernpfade erstellt.</p>'}
      </section>
      <section class="page-card" style="margin-top:1.5rem;">
        <h2>📺 Meine Videos</h2>
        <p>${videos.length} gespeichert · ${watched.length} von mir als angesehen markiert</p>
        <div style="display:grid;gap:1.25rem;">${videoCards || '<p style="color:#999;">Noch keine Videos hinzugefügt.</p>'}</div>
      </section>`);
    renderPageShell(main);
  }
};

function mediaEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function mediaReadVideos(userId) {
  try {
    const videos = JSON.parse(localStorage.getItem(`media_videos_${userId}`) || '[]');
    return Array.isArray(videos) ? videos : [];
  } catch (_) { return []; }
}

function mediaReadPaths(userId) {
  try {
    const paths = JSON.parse(localStorage.getItem(`media_paths_${userId}`) || '[]');
    return Array.isArray(paths) ? paths : [];
  } catch (_) { return []; }
}

function mediaYouTubeId(value) {
  try {
    const url = new URL(value);
    let id = '';
    if (url.hostname === 'youtu.be' || url.hostname.endsWith('.youtu.be')) id = url.pathname.split('/').filter(Boolean)[0] || '';
    else if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
      else if (/^\/(embed|shorts|live)\//.test(url.pathname)) id = url.pathname.split('/')[2] || '';
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch (_) { return null; }
}

function mediaAddVideo(event) {
  event.preventDefault();
  const url = document.getElementById('media-url').value.trim();
  const youtubeId = mediaYouTubeId(url);
  if (!youtubeId) {
    alert('Bitte eine gültige YouTube-Video-URL eintragen.');
    return;
  }
  const userId = String(appState.user.id);
  const videos = mediaReadVideos(userId);
  if (videos.some(video => video.youtubeId === youtubeId)) {
    alert('Dieses Video ist bereits in deiner Bibliothek.');
    return;
  }
  videos.push({
    id: `video_${Date.now()}`,
    url,
    youtubeId,
    title: document.getElementById('media-title').value.trim(),
    category: document.getElementById('media-category').value.trim(),
    notes: '',
    timestamps: [],
    pathIds: [],
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(videos));
  mediaLibrary.render();
}

function mediaCreatePath(event) {
  event.preventDefault();
  const title = event.target.elements.title.value.trim();
  if (!title) return;
  const userId = String(appState.user.id);
  const paths = mediaReadPaths(userId);
  paths.push({ id: `path_${Date.now()}`, title, createdAt: new Date().toISOString() });
  localStorage.setItem(`media_paths_${userId}`, JSON.stringify(paths));
  mediaLibrary.render();
}

function mediaAssignPath(videoId) {
  const userId = String(appState.user.id);
  const select = document.getElementById(`media-path-${videoId}`);
  const videos = mediaReadVideos(userId);
  const video = videos.find(item => item.id === videoId);
  if (!video) return;
  const pathId = select.value;
  video.pathIds = video.pathIds || [];
  video.pathIds = pathId ? [...new Set([...video.pathIds, pathId])] : [];
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(videos));
  mediaLibrary.render();
}

function mediaDeleteVideo(videoId) {
  if (!confirm('Dieses Video und seine Notizen entfernen?')) return;
  const userId = String(appState.user.id);
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(mediaReadVideos(userId).filter(video => video.id !== videoId)));
  localStorage.setItem(`watched_${userId}`, JSON.stringify((JSON.parse(localStorage.getItem(`watched_${userId}`) || '[]')).filter(id => id !== videoId)));
  mediaLibrary.render();
}

function mediaDeletePath(pathId) {
  const userId = String(appState.user.id);
  localStorage.setItem(`media_paths_${userId}`, JSON.stringify(mediaReadPaths(userId).filter(path => path.id !== pathId)));
  const videos = mediaReadVideos(userId).map(video => ({ ...video, pathIds: (video.pathIds || []).filter(id => id !== pathId) }));
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(videos));
  mediaLibrary.render();
}

function mediaSaveNotes(videoId) {
  const userId = String(appState.user.id);
  const videos = mediaReadVideos(userId);
  const video = videos.find(item => item.id === videoId);
  if (!video) return;
  video.notes = document.getElementById(`media-notes-${videoId}`).value;
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(videos));
  alert('Notizen gespeichert.');
}

function mediaParseTime(value) {
  const parts = value.split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(part => !Number.isInteger(part) || part < 0)) return null;
  if (parts.slice(1).some(part => part > 59)) return null;
  return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function mediaFormatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const remainder = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function mediaAddTimestamp(event, videoId) {
  event.preventDefault();
  const form = event.target;
  const label = form.elements.label.value.trim();
  const seconds = mediaParseTime(form.elements.time.value.trim());
  if (seconds === null) {
    alert('Zeit bitte als mm:ss oder hh:mm:ss eingeben.');
    return;
  }
  const userId = String(appState.user.id);
  const videos = mediaReadVideos(userId);
  const video = videos.find(item => item.id === videoId);
  if (!video) return;
  video.timestamps = video.timestamps || [];
  video.timestamps.push({ label, seconds });
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(videos));
  mediaLibrary.render();
}

function mediaDeleteTimestamp(videoId, index) {
  const userId = String(appState.user.id);
  const videos = mediaReadVideos(userId);
  const video = videos.find(item => item.id === videoId);
  if (!video) return;
  video.timestamps.splice(index, 1);
  localStorage.setItem(`media_videos_${userId}`, JSON.stringify(videos));
  mediaLibrary.render();
}

function mediaTimestampUrl(video, seconds) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}&t=${Number(seconds)}s`;
}

function mediaStartParam(seconds) {
  return Number.isFinite(Number(seconds)) ? `?start=${Number(seconds)}` : '';
}

function mediaMarkWatched(videoId) {
  const userId = String(appState.user.id);
  const watched = JSON.parse(localStorage.getItem(`watched_${userId}`) || '[]');
  if (!watched.includes(videoId)) {
    watched.push(videoId);
    localStorage.setItem(`watched_${userId}`, JSON.stringify(watched));
  }
  mediaLibrary.render();
}
