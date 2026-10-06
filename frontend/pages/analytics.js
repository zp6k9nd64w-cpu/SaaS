const analytics = {
  render: async () => {
    if (!requireAuth()) return;

    const main = createPageContainer(`
      <div class="page-card"><h1>📊 Lernanalysen</h1><p>Auswertung deiner Aufgaben, Noten und erfassten Lernzeit.</p></div>
      <div id="analytics-error" role="alert" style="color:#b00020;margin-top:1rem;"></div>
      <div id="analytics-content" class="page-card" style="margin-top:1.5rem;">Lade deine Analysen …</div>
    `);
    renderPageShell(main);

    try {
      const data = await apiGet('/analytics');
      analytics.renderData(data || {});
    } catch (error) {
      const message = document.getElementById('analytics-error');
      const content = document.getElementById('analytics-content');
      if (content) content.textContent = 'Deine Analysen konnten nicht geladen werden.';
      if (message) message.textContent = error?.message || 'Die Anfrage ist fehlgeschlagen.';
    }
  },

  renderData: ({ tasks = [], grades = [], studySessions = [] }) => {
    const content = document.getElementById('analytics-content');
    if (!content) return;

    const completedTasks = tasks.filter(task => Number(task.completed) === 1 || task.completed === true);
    const gradeRows = grades.map(grade => ({
      ...grade,
      value: analytics.parseGrade(grade.grade)
    }));
    const numericGrades = gradeRows.filter(grade => grade.value !== null);
    const averageGrade = numericGrades.length
      ? (numericGrades.reduce((sum, grade) => sum + grade.value, 0) / numericGrades.length).toFixed(2)
      : null;
    const totalMinutes = studySessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0);
    const subjects = [...new Set(grades.map(grade => grade.subject).filter(Boolean))];
    const weeklyActivity = analytics.activityByDay(tasks, studySessions);
    const weeklyMaximum = Math.max(...weeklyActivity.map(day => day.minutes + day.tasks), 1);

    const subjectCards = subjects.map(subject => {
      const subjectGrades = numericGrades.filter(grade => grade.subject === subject);
      const subjectTasks = tasks.filter(task => task.subject === subject);
      const subjectMinutes = studySessions
        .filter(session => session.subject === subject)
        .reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0);
      const average = subjectGrades.length
        ? (subjectGrades.reduce((sum, grade) => sum + grade.value, 0) / subjectGrades.length).toFixed(2)
        : null;
      return `<article class="task-item" style="padding:1rem;">
        <strong>${analytics.escape(subject)}</strong>
        <p style="margin:.4rem 0;color:#555;">${average === null ? 'Keine auswertbaren Zahlen-Noten' : `Notendurchschnitt: ${average} (${subjectGrades.length} Einträge)`}</p>
        <p style="margin:0;color:#777;">${subjectTasks.length} Aufgaben · ${subjectMinutes} erfasste Lernminuten</p>
      </article>`;
    }).join('');

    const projections = analytics.predictions(numericGrades);
    const activityBars = weeklyActivity.map(day => `
      <div style="text-align:center;min-width:34px;">
        <div title="${day.tasks} Aufgaben, ${day.minutes} Lernminuten" style="height:100px;display:flex;align-items:end;justify-content:center;background:#eef0f7;border-radius:6px 6px 0 0;">
          <div style="width:70%;height:${Math.max(4, Math.round(((day.minutes + day.tasks) / weeklyMaximum) * 100))}%;background:linear-gradient(180deg,#667eea,#764ba2);border-radius:6px 6px 0 0;"></div>
        </div>
        <small>${day.label}</small>
      </div>`).join('');

    content.innerHTML = `
      <section>
        <h2>📈 Überblick</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;">
          <div class="task-item"><strong>${tasks.length ? Math.round(completedTasks.length / tasks.length * 100) : 0}%</strong><p>Aufgaben erledigt (${completedTasks.length}/${tasks.length})</p></div>
          <div class="task-item"><strong>${averageGrade ?? '—'}</strong><p>Notendurchschnitt (${numericGrades.length} Zahlen-Noten)</p></div>
          <div class="task-item"><strong>${Math.floor(totalMinutes / 60)} Std. ${totalMinutes % 60} Min.</strong><p>Erfasste Lernzeit (${studySessions.length} Sessions)</p></div>
        </div>
      </section>
      <section style="margin-top:1.5rem;">
        <h2>⏱️ Aktivität der letzten sieben Tage</h2>
        <p style="color:#666;">Nur erfasste Lern-Sessions und tatsächliche Erledigungszeitpunkte werden berücksichtigt. Frühere Aufgaben ohne Erledigungszeitpunkt erscheinen nicht in diesem Diagramm.</p>
        <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:.5rem;align-items:end;">${activityBars}</div>
      </section>
      <section style="margin-top:1.5rem;">
        <h2>📚 Fachbezogene Auswertung</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;">
          ${subjectCards || '<p>Noch keine Fächer in deinen Noten erfasst.</p>'}
        </div>
      </section>
      <section style="margin-top:1.5rem;">
        <h2>📉 Notenverlauf</h2>
        ${analytics.gradeChart(numericGrades)}
      </section>
      <section style="margin-top:1.5rem;">
        <h2>🔮 Grobe Trend-Prognose</h2>
        <p style="color:#666;">Reine lineare Fortschreibung vorhandener Zahlen-Noten, keine Vorhersage oder Garantie. Mindestens zwei datierte Noten pro Fach erforderlich.</p>
        ${projections.length ? `<div style="display:grid;gap:.5rem;">${projections.map(item => `
          <div class="task-item" style="display:flex;justify-content:space-between;gap:1rem;">
            <strong>${analytics.escape(item.subject)}</strong>
            <span>${item.value.toFixed(2)} (geschätzt; ${item.count} Noten)</span>
          </div>`).join('')}</div>` : '<p>Für eine Trend-Schätzung braucht es mindestens zwei numerische Noten pro Fach.</p>'}
      </section>`;
  },

  parseGrade: value => {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const parsed = Number(String(value).trim().replace(',', '.'));
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 6 ? parsed : null;
  },

  activityByDay: (tasks, sessions) => {
    const now = new Date();
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
      const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push({
        isoDate,
        label: date.toLocaleDateString('de-DE', { weekday: 'short' }),
        minutes: 0,
        tasks: 0
      });
    }
    const byDate = new Map(days.map(day => [day.isoDate, day]));
    sessions.forEach(session => {
      const day = byDate.get(String(session.completedAt || '').slice(0, 10));
      if (day) day.minutes += Number(session.durationMinutes || 0);
    });
    tasks.forEach(task => {
      if (Number(task.completed) !== 1 && task.completed !== true) return;
      const day = byDate.get(String(task.completedAt || '').slice(0, 10));
      if (day) day.tasks += 1;
    });
    return days;
  },

  gradeChart: grades => {
    const ordered = grades.slice().sort((first, second) => String(first.date).localeCompare(String(second.date)));
    if (ordered.length < 2) return '<p>Trage mindestens zwei Zahlen-Noten ein, um den Verlauf zu sehen.</p>';
    const width = 640;
    const height = 220;
    const points = ordered.map((grade, index) => {
      const x = 24 + index * ((width - 48) / (ordered.length - 1));
      const y = 18 + ((grade.value - 1) / 5) * (height - 48);
      return `${x},${y}`;
    }).join(' ');
    const labels = [ordered[0], ordered.at(-1)].map((grade, index) => `
      <text x="${index ? width - 24 : 24}" y="${height - 4}" text-anchor="${index ? 'end' : 'start'}" fill="currentColor" font-size="12">${analytics.escape(grade.date)}</text>`).join('');
    return `<div style="overflow-x:auto;"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Notenverlauf, Skala 1 bis 6" style="width:100%;min-width:360px;max-height:260px;">
      <line x1="24" y1="18" x2="24" y2="${height - 24}" stroke="#aaa"/>
      <line x1="24" y1="${height - 24}" x2="${width - 24}" y2="${height - 24}" stroke="#aaa"/>
      <polyline points="${points}" fill="none" stroke="#667eea" stroke-width="3"/>
      ${points.split(' ').map(point => `<circle cx="${point.split(',')[0]}" cy="${point.split(',')[1]}" r="4" fill="#764ba2"/>`).join('')}
      <text x="24" y="14" fill="currentColor" font-size="12">1 (besser)</text>
      <text x="24" y="${height - 32}" fill="currentColor" font-size="12">6</text>${labels}
    </svg></div>`;
  },

  predictions: grades => {
    const bySubject = new Map();
    grades.forEach(grade => {
      if (!grade.subject || !grade.date || Number.isNaN(Date.parse(grade.date))) return;
      if (!bySubject.has(grade.subject)) bySubject.set(grade.subject, []);
      bySubject.get(grade.subject).push(grade);
    });
    return [...bySubject.entries()].flatMap(([subject, rows]) => {
      const ordered = rows.slice().sort((first, second) => String(first.date).localeCompare(String(second.date)));
      if (ordered.length < 2) return [];
      const values = ordered.map(row => row.value);
      const meanX = (values.length - 1) / 2;
      const meanY = values.reduce((sum, value) => sum + value, 0) / values.length;
      const numerator = values.reduce((sum, value, index) => sum + (index - meanX) * (value - meanY), 0);
      const denominator = values.reduce((sum, _, index) => sum + (index - meanX) ** 2, 0);
      const slope = denominator ? numerator / denominator : 0;
      return [{ subject, value: Math.max(1, Math.min(6, meanY + slope * (values.length - meanX))), count: values.length }];
    });
  },

  escape: value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
};
