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
  const workTime = parseInt(document.getElementById('work-time').value) * 60;
  const breakTime = parseInt(document.getElementById('break-time').value) * 60;
  
  isRunning = true;
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'inline-block';
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    
    if (timeLeft === 0) {
      const message = isWorkTime 
        ? `✅ Gut gemacht! Nimm dir jetzt eine ${Math.floor(breakTime / 60)}-Minuten Pause.`
        : '🚀 Pausen-Zeit vorbei! Zurück zur Arbeit!';
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Timer', { body: message, icon: '⏰' });
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
  const workTime = parseInt(document.getElementById('work-time').value) * 60;
  timeLeft = workTime;
  isWorkTime = true;
  updateTimerDisplay();
}
