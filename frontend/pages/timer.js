// Pomodoro Timer Page
const timer = {
  render: () => {
    if (!requireAuth()) return;
    const main = createPageContainer(`
      <div class="page-card">
        <h1>Fokus-Timer (Pomodoro)</h1>
        <p>Nutze die Pomodoro-Technik für produktives Lernen</p>
      </div>
      
      <section class="timer-section">
        <div class="timer-card">
          <div class="timer-display" id="timer-display">25:00</div>
          <div class="timer-controls">
            <button class="btn btn-primary" id="start-btn" onclick="startTimer()">▶ Starten</button>
            <button class="btn btn-secondary" id="pause-btn" onclick="pauseTimer()" style="display: none;">⏸ Pause</button>
            <button class="btn btn-secondary" onclick="resetTimer()">🔄 Reset</button>
          </div>
          
          <div class="timer-options" style="margin-top: 2rem;">
            <label>Arbeitszeit (Minuten):</label>
            <input type="number" id="work-time" value="25" min="1" max="60" style="width: 100px; padding: 0.5rem;">
            <label style="margin-left:1rem;">Fach (optional):</label>
            <input type="text" id="study-subject" maxlength="80" placeholder="z. B. Mathematik" style="max-width:220px;padding:0.5rem;">
            
            <label style="margin-top: 1rem; display: block;">Pausenzeit (Minuten):</label>
            <input type="number" id="break-time" value="5" min="1" max="30" style="width: 100px; padding: 0.5rem;">
          </div>
          
          <div class="timer-status" id="timer-status" style="margin-top: 1rem; padding: 1rem; background: #f0f1f3; border-radius: 12px; text-align: center; font-weight: bold;">
            Bereit zum Starten
          </div>
        </div>
      </section>
      
      <section class="page-card" style="margin-top: 2rem;">
        <h2>Tipps für produktives Lernen</h2>
        <ul style="padding-left: 1.5rem;">
          <li>Arbeite 25 Minuten konzentriert, dann 5 Minuten Pause</li>
          <li>Nach 4 Zyklen eine längere Pause (15-30 Min) machen</li>
          <li>Alle Ablenkungen während der Arbeitszeit wegschaffen</li>
          <li>Die Pomodoro-Technik hilft beim fokussierten Lernen</li>
        </ul>
      </section>
    `);
    renderPageShell(main);
  }
};

let timerInterval = null;
let isRunning = false;
let timeLeft = 1500; // 25 Minuten in Sekunden
let isWorkTime = true;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  const status = document.getElementById('timer-status');
  if (display) {
    display.textContent = formatTime(timeLeft);
    if (status) {
      status.textContent = isWorkTime ? '🔴 Arbeitszeit' : '🟢 Pausenzeit';
    }
  }
}

function startTimer() {
  if (isRunning) return;
  const workMinutes = Number(document.getElementById('work-time').value);
  const breakMinutes = Number(document.getElementById('break-time').value);
  if (!Number.isInteger(workMinutes) || workMinutes < 1 || workMinutes > 60 ||
      !Number.isInteger(breakMinutes) || breakMinutes < 1 || breakMinutes > 30) {
    document.getElementById('timer-status').textContent = 'Bitte gib gültige Arbeits- und Pausenzeiten ein.';
    return;
  }
  const workTime = workMinutes * 60;
  const breakTime = breakMinutes * 60;
  if (isWorkTime && timeLeft === 1500) timeLeft = workTime;
  
  isRunning = true;
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'inline-block';
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft === 0) {
      const message = isWorkTime 
        ? `✅ Gut gemacht! Nimm dir jetzt eine ${breakMinutes}-Minuten Pause.`
        : '🚀 Pausen-Zeit vorbei! Zurück zur Arbeit!';
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', { body: message, icon: '⏰' });
      }
      
      if (isWorkTime) {
        const subject = document.getElementById('study-subject').value.trim();
        apiPost('/study-sessions', { durationMinutes: workMinutes, subject })
          .then(() => addXP(workMinutes >= 20 ? 20 : 10, 'study_session_completed'))
          .catch(error => {
            document.getElementById('timer-status').textContent = `Session beendet, aber nicht gespeichert: ${error.message}`;
          });
      }

      isWorkTime = !isWorkTime;
      timeLeft = isWorkTime ? workTime : breakTime;
      updateTimerDisplay();
      
      // Auto-restart optional
      // startTimer();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  document.getElementById('start-btn').style.display = 'inline-block';
  document.getElementById('pause-btn').style.display = 'none';
}

function resetTimer() {
  pauseTimer();
  const workTime = Number(document.getElementById('work-time').value) * 60;
  timeLeft = workTime;
  isWorkTime = true;
  updateTimerDisplay();
}
