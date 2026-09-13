// Utility und Helper Funktionen
const appState = {
  user: null,
  subscription: 'Free',
  selectedPlan: 'Core',
  conversation: [],
  tasks: [],
  grades: [],
  notifications: []
};

function saveAppState() {
  localStorage.setItem('saasState', JSON.stringify({
    user: appState.user,
    subscription: appState.subscription
  }));
}

function loadAppState() {
  const data = localStorage.getItem('saasState');
  if (data) {
    const parsed = JSON.parse(data);
    appState.user = parsed.user;
    appState.subscription = parsed.subscription || 'Free';
  }
}

function setUser(user) {
  appState.user = user;
  appState.subscription = user.subscription || 'Free';
  saveAppState();
}

function requireAuth() {
  if (!appState.user) {
    router.navigate('/login');
    return false;
  }
  return true;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('de-DE');
}

function setActiveNavLink() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active-link');
    const href = link.getAttribute('href');
    if (href === `#${window.location.hash.slice(1).split('?')[0]}`) {
      link.classList.add('active-link');
    }
  });
}

function selectPlan(plan) {
  appState.selectedPlan = plan;
  router.navigate(`/abo?plan=${encodeURIComponent(plan)}`);
}

function logoutUser() {
  appState.user = null;
  appState.subscription = 'Free';
  saveAppState();
  router.navigate('/');
}

async function loadTasks() {
  if (!appState.user) return mockData.tasks;
  try {
    const result = await apiGet(`/tasks?userId=${appState.user.id}`);
    return result.tasks || result;
  } catch (error) {
    return mockData.tasks;
  }
}

async function loadGrades() {
  if (!appState.user) return mockData.grades;
  try {
    const result = await apiGet(`/grades?userId=${appState.user.id}`);
    return result.grades || result;
  } catch (error) {
    return mockData.grades;
  }
}

function renderPageShell(content) {
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(new Navbar().render());
  app.appendChild(content);
  setActiveNavLink();
}

function createPageContainer(innerHtml) {
  const main = document.createElement('main');
  main.innerHTML = innerHtml;
  return main;
}

// Task Management
async function deleteTask(taskId) {
  if (!requireAuth()) return;
  await apiDelete(`/tasks/${taskId}`);
  router.navigate('/aufgaben');
}

function showTaskForm() {
  const formContainer = document.getElementById('task-form');
  if (!formContainer) return;
  formContainer.innerHTML = `
    <div class="card form-card">
      <h3>Neue Aufgabe hinzufügen</h3>
      <input type="text" id="task-title" placeholder="Titel" required>
      <input type="text" id="task-description" placeholder="Beschreibung" required>
      <input type="date" id="task-duedate" required>
      <select id="task-priority">
        <option value="low">Niedrig</option>
        <option value="medium" selected>Mittel</option>
        <option value="high">Hoch</option>
      </select>
      <label>Datei anhängen (optional):</label>
      <input type="file" id="task-file" accept=".pdf,.doc,.docx,.jpg,.png">
      <button class="btn" onclick="addTask()">Speichern</button>
      <button class="btn btn-secondary" onclick="document.getElementById('task-form').innerHTML=''" style="margin-left:0.5rem;">Abbrechen</button>
    </div>
  `;
}

async function addTask() {
  const title = document.getElementById('task-title').value;
  const description = document.getElementById('task-description').value;
  const dueDate = document.getElementById('task-duedate').value;
  const priority = document.getElementById('task-priority').value;
  const fileInput = document.getElementById('task-file');
  
  if (!title || !description || !dueDate) {
    alert('Bitte alle Felder ausfüllen');
    return;
  }
  
  let fileUrl = null;
  if (fileInput && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      fileUrl = e.target.result;
      const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]');
      const id = (Math.max(...tasks.map(t => t.id || 0), 0) + 1);
      tasks.push({ id, user_id: appState.user.id, title, description, due_date: dueDate, priority, fileUrl, completed: 0 });
      localStorage.setItem('saasDB_tasks', JSON.stringify(tasks));
      router.navigate('/aufgaben');
    };
    reader.readAsDataURL(file);
  } else {
    await apiPost('/tasks', { userId: appState.user.id, title, description, dueDate, priority });
    router.navigate('/aufgaben');
  }
}

// Grade Management
async function deleteGrade(gradeId) {
  if (!requireAuth()) return;
  await apiDelete(`/grades/${gradeId}`);
  router.navigate('/noten');
}

function showGradeForm() {
  const formContainer = document.getElementById('grade-form');
  if (!formContainer) return;
  formContainer.innerHTML = `
    <div class="card form-card">
      <h3>Note hinzufügen</h3>
      <input type="text" id="grade-subject" placeholder="Fach" required>
      <input type="text" id="grade-value" placeholder="Note (z.B. 1, 1+, 2-, B)" required>
      <input type="date" id="grade-date" required>
      <button class="btn" onclick="addGrade()">Speichern</button>
      <button class="btn btn-secondary" onclick="document.getElementById('grade-form').innerHTML=''" style="margin-left:0.5rem;">Abbrechen</button>
    </div>
  `;
}

async function addGrade() {
  const subject = document.getElementById('grade-subject').value;
  const grade = document.getElementById('grade-value').value;
  const date = document.getElementById('grade-date').value;
  if (!subject || !grade || !date) {
    alert('Bitte alle Felder ausfüllen');
    return;
  }
  await apiPost('/grades', { userId: appState.user.id, subject, grade, date });
  router.navigate('/noten');
}

// AI Conversation
function renderConversation() {
  const conversationEl = document.getElementById('conversation');
  if (!conversationEl) return;
  conversationEl.innerHTML = appState.conversation.map(item => `
    <div class="message ${item.sender}">
      <p>${item.text}</p>
    </div>
  `).join('');
  conversationEl.scrollTop = conversationEl.scrollHeight;
}

async function sendAIQuestion() {
  const input = document.getElementById('ai-question');
  const message = input.value.trim();
  if (!message) return;
  appState.conversation.push({ sender: 'user', text: message });
  renderConversation();
  input.value = '';
  try {
    const result = await apiPost('/ai', { question: message });
    appState.conversation.push({ sender: 'ai', text: result.answer });
  } catch (error) {
    appState.conversation.push({ sender: 'ai', text: 'Leider ist der AI-Dienst nicht verfügbar. Versuche es später erneut.' });
  }
  renderConversation();
}

// Test Generation
function generateTest(subject) {
  if (!subject) subject = document.getElementById('test-subject').value;
  const content = document.getElementById('test-content');
  let testHtml = '';
  if (subject === 'Mathe') {
    testHtml = `
      <div class="analysis-card">
        <h3>Mathe-Training</h3>
        <p>Frage 1: Was ist 2+2?</p>
        <p>Frage 2: Löse 5x - 3 = 17.</p>
        <h4>Analyse</h4>
        <p>Konzentriere dich besonders auf Gleichungen und einfache Algebra.</p>
      </div>
    `;
  } else if (subject === 'Englisch') {
    testHtml = `
      <div class="analysis-card">
        <h3>Englisch-Training</h3>
        <p>Frage 1: Übersetze den Satz: "I am learning every day."</p>
        <p>Frage 2: Finde den Fehler: "She go to school."</p>
        <h4>Analyse</h4>
        <p>Übe Zeitformen und Satzbau, um parallele Strukturen sicherer zu nutzen.</p>
      </div>
    `;
  } else if (subject === 'Deutsch') {
    testHtml = `
      <div class="analysis-card">
        <h3>Deutsch-Training</h3>
        <p>Frage 1: Setze den richtigen Artikel ein: "___ Apfel".</p>
        <p>Frage 2: Bilde den Plural von: "das Buch".</p>
        <h4>Analyse</h4>
        <p>Stärke deine Grammatikkenntnisse besonders bei Artikeln und Satzbau.</p>
      </div>
    `;
  } else if (subject === 'Biologie') {
    testHtml = `
      <div class="analysis-card">
        <h3>Biologie-Training</h3>
        <p>Frage 1: Nenne die drei Zelltypen.</p>
        <p>Frage 2: Erkläre kurz den Unterschied zwischen Fotosynthese und Atmung.</p>
        <h4>Analyse</h4>
        <p>Nutze Diagramme und Vergleiche, um komplexe Prozesse besser zu verstehen.</p>
      </div>
    `;
  } else if (subject === 'Geschichte') {
    testHtml = `
      <div class="analysis-card">
        <h3>Geschichte-Training</h3>
        <p>Frage 1: Nenne drei Ursachen des Zweiten Weltkriegs.</p>
        <p>Frage 2: Was war die Industrielle Revolution?</p>
        <h4>Analyse</h4>
        <p>Fokussiere dich auf Zeitstrahlen und Schlüsselpersonen.</p>
      </div>
    `;
  }
  content.innerHTML = testHtml;
}

// Dark Mode Toggle
function toggleDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  const newDarkMode = !isDark;
  localStorage.setItem('darkMode', newDarkMode);
  applyDarkMode(newDarkMode);
}

function applyDarkMode(isDark) {
  const root = document.documentElement;
  if (isDark) {
    root.style.setProperty('--bg-primary', '#1a1a1a');
    root.style.setProperty('--bg-secondary', '#2d2d2d');
    root.style.setProperty('--text-primary', '#e0e0e0');
    root.style.setProperty('--text-secondary', '#b0b0b0');
    root.style.setProperty('--border-color', '#444');
    document.body.classList.add('dark-mode');
  } else {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f7f8ff');
    root.style.setProperty('--text-primary', '#333');
    root.style.setProperty('--text-secondary', '#666');
    root.style.setProperty('--border-color', '#ddd');
    document.body.classList.remove('dark-mode');
  }
}

// Reminders
function checkReminders() {
  if (!appState.user) return;
  const reminders = mockDB.getReminders(appState.user.id);
  reminders.slice(0, 3).forEach(task => {
    const daysUntil = Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 1 && Notification.permission === 'granted') {
      new Notification('Aufgaben-Erinnerung', {
        body: `"${task.title}" ist ${daysUntil === 0 ? 'heute' : 'morgen'} fällig!`,
        icon: '📌'
      });
    }
  });
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// Badges & Streaks
function checkBadges(userId) {
  mockDB.init();
  const tasks = mockDB.getTasks(userId);
  const completedTasks = tasks.filter(t => t.completed).length;
  const grades = mockDB.getGrades(userId);
  
  if (completedTasks === 5) mockDB.createBadge(userId, 'Fleißig', '⭐', '5 Aufgaben abgeschlossen', new Date());
  if (completedTasks === 20) mockDB.createBadge(userId, 'Super Fleißig', '🌟', '20 Aufgaben abgeschlossen', new Date());
  if (grades.length === 10) mockDB.createBadge(userId, 'Prüfungspro', '📊', '10 Noten erfasst', new Date());
}

function updateStreak(userId) {
  const streak = mockDB.getStreak(userId);
  const today = new Date().toDateString();
  const lastDate = streak.lastDate ? new Date(streak.lastDate).toDateString() : null;
  
  if (lastDate === today) return streak.count;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastDate === yesterday.toDateString()) {
    mockDB.updateStreak(userId, streak.count + 1, new Date());
    return streak.count + 1;
  } else {
    mockDB.updateStreak(userId, 1, new Date());
    return 1;
  }
}

// Export Daten
function exportDataAsCSV() {
  if (!appState.user) return;
  mockDB.init();
  const tasks = mockDB.getTasks(appState.user.id);
  const grades = mockDB.getGrades(appState.user.id);
  
  let csv = 'Typ,Titel/Fach,Beschreibung/Note,Datum\n';
  
  tasks.forEach(t => {
    csv += `Aufgabe,"${t.title}","${t.description}","${t.due_date}"\n`;
  });
  
  grades.forEach(g => {
    csv += `Note,"${g.subject}","${g.grade}","${g.date}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAAS-Export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

function exportDataAsJSON() {
  if (!appState.user) return;
  mockDB.init();
  const offlineData = mockDB.getOfflineData(appState.user.id);
  
  const json = JSON.stringify(offlineData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SAAS-Backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Goal Management
function createGoal(title, target, frequency, dueDate) {
  if (!appState.user) return;
  mockDB.init();
  mockDB.createGoal(appState.user.id, title, target, frequency, dueDate);
}

function updateGoalProgress(goalId, progress) {
  mockDB.updateGoal(goalId, { progress });
}

function deleteGoal(goalId) {
  mockDB.deleteGoal(goalId);
  router.navigate('/goals');
}

// Statistiken berechnen
function calculateStatistics() {
  if (!appState.user) return null;
  mockDB.init();
  const tasks = mockDB.getTasks(appState.user.id);
  const grades = mockDB.getGrades(appState.user.id);
  
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const avgGrade = grades.length > 0 
    ? (grades.reduce((sum, g) => {
        const gradeVal = parseFloat(g.grade);
        return !isNaN(gradeVal) ? sum + gradeVal : sum;
      }, 0) / grades.length).toFixed(2)
    : 'N/A';
  
  const subjectGrades = {};
  grades.forEach(g => {
    if (!subjectGrades[g.subject]) subjectGrades[g.subject] = [];
    subjectGrades[g.subject].push(parseFloat(g.grade) || 0);
  });
  
  const subjectAverages = {};
  Object.keys(subjectGrades).forEach(subject => {
    const avg = (subjectGrades[subject].reduce((a, b) => a + b, 0) / subjectGrades[subject].length).toFixed(2);
    subjectAverages[subject] = avg;
  });
  
  return {
    totalTasks,
    completedTasks,
    completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
    totalGrades: grades.length,
    avgGrade,
    subjectAverages,
    streak: mockDB.getStreak(appState.user.id).count
  };
}

// Offline-Modus (nur Elite)
function enableOfflineMode() {
  if (appState.subscription !== 'Elite') {
    alert('Offline-Modus ist nur im Elite-Abonnement verfügbar.');
    return;
  }
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      alert('Offline-Modus aktiviert! Du kannst jetzt auch ohne Internet arbeiten.');
    }).catch(err => console.log('Service Worker Fehler:', err));
  }
}

function checkOfflineMode() {
  if (appState.subscription === 'Elite' && 'serviceWorker' in navigator) {
    return navigator.serviceWorker.controller !== null;
  }
  return false;
}

// ===== XP & GAMIFICATION SYSTEM =====

// Add XP for various activities
function addXP(amount, reason = 'activity') {
  if (!appState.user) return;
  
  const userId = appState.user.id;
  const xpKey = `xp_${userId}`;
  const xpData = JSON.parse(localStorage.getItem(xpKey) || '{"total_xp": 0, "level": 1, "xp_to_next": 500, "milestones": []}');
  
  xpData.total_xp += amount;
  
  // Level progression
  let xpNeeded = 500;
  let currentLevel = 1;
  let totalXpSpent = 0;
  
  while (totalXpSpent + xpNeeded <= xpData.total_xp) {
    totalXpSpent += xpNeeded;
    currentLevel++;
    xpNeeded = 500 * currentLevel;
  }
  
  const oldLevel = xpData.level;
  xpData.level = currentLevel;
  xpData.xp_to_next = totalXpSpent + xpNeeded - xpData.total_xp;
  xpData.last_updated = new Date().toISOString();
  
  // Track level ups
  if (oldLevel < currentLevel) {
    if (!xpData.milestones) xpData.milestones = [];
    xpData.milestones.push({
      level: currentLevel,
      achievedAt: new Date().toISOString()
    });
    
    // Show level up notification
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(`🎉 Level Up! Du bist jetzt Level ${currentLevel}`);
    }
  }
  
  localStorage.setItem(xpKey, JSON.stringify(xpData));
  
  // Track XP activity for achievements
  trackXPActivity(userId, amount, reason);
  
  return {level: currentLevel, xp: xpData.total_xp, levelUp: oldLevel < currentLevel};
}

// Track activities for achievement unlocking
function trackXPActivity(userId, amount, reason) {
  const activityKey = `activities_${userId}`;
  const activities = JSON.parse(localStorage.getItem(activityKey) || '[]');
  
  activities.push({
    type: reason,
    xp: amount,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 1000 activities
  if (activities.length > 1000) {
    activities.shift();
  }
  
  localStorage.setItem(activityKey, JSON.stringify(activities));
  
  // Check for achievement unlocks
  checkAchievementUnlocks(userId);
}

// Check and unlock achievements
function checkAchievementUnlocks(userId) {
  const achievements = JSON.parse(localStorage.getItem(`achievements_${userId}`) || '[]');
  const stats = getAchievementStats(userId);
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"total_xp": 0, "level": 1}');
  
  const achievementChecks = [
    { id: 'first_task', condition: () => stats.completedTasks >= 1 },
    { id: 'task_master_10', condition: () => stats.completedTasks >= 10 },
    { id: 'task_master_50', condition: () => stats.completedTasks >= 50 },
    { id: 'grade_collector', condition: () => stats.totalGrades >= 10 },
    { id: 'note_taker', condition: () => stats.totalNotes >= 10 },
    { id: 'quiz_master', condition: () => stats.totalQuizzes >= 10 },
    { id: 'goal_setter', condition: () => stats.totalGoals >= 1 },
    { id: 'goal_achiever_5', condition: () => stats.completedGoals >= 5 },
    { id: 'xp_500', condition: () => xpData.total_xp >= 500 },
    { id: 'xp_2500', condition: () => xpData.total_xp >= 2500 },
    { id: 'level_5', condition: () => xpData.level >= 5 },
    { id: 'level_10', condition: () => xpData.level >= 10 },
    { id: 'habit_master', condition: () => stats.totalHabits >= 5 }
  ];
  
  achievementChecks.forEach(check => {
    const alreadyUnlocked = achievements.some(a => a.id === check.id);
    
    if (!alreadyUnlocked && check.condition()) {
      achievements.push({
        id: check.id,
        unlockedAt: new Date().toISOString()
      });
      localStorage.setItem(`achievements_${userId}`, JSON.stringify(achievements));
      
      // Show achievement unlocked notification
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('🏆 Abzeichen freigeschaltet!');
      }
    }
  });
}

function getAchievementStats(userId) {
  const tasks = JSON.parse(localStorage.getItem('saasDB_tasks') || '[]').filter(t => t.user_id === userId);
  const grades = JSON.parse(localStorage.getItem('saasDB_grades') || '[]').filter(g => g.user_id === userId);
  const goals = JSON.parse(localStorage.getItem('saasDB_goals') || '[]').filter(g => g.user_id === userId);
  const notes = JSON.parse(localStorage.getItem('saasDB_notes') || '[]').filter(n => n.user_id === userId);
  const quizzes = JSON.parse(localStorage.getItem('saasDB_quizzes') || '[]').filter(q => q.user_id === userId);
  const habits = JSON.parse(localStorage.getItem('saasDB_habits') || '[]').filter(h => h.user_id === userId);
  
  return {
    completedTasks: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
    totalGrades: grades.length,
    completedGoals: goals.filter(g => g.progress >= g.target).length,
    totalGoals: goals.length,
    totalNotes: notes.length,
    totalQuizzes: quizzes.length,
    totalHabits: habits.length
  };
}

// Get user level and XP info
function getUserXPInfo(userId) {
  const xpData = JSON.parse(localStorage.getItem(`xp_${userId}`) || '{"total_xp": 0, "level": 1, "xp_to_next": 500}');
  return xpData;
}

// Calculate habit streak
function calculateHabitStreak(habit) {
  if (!habit.completedDates) return 0;
  
  const dates = habit.completedDates.sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < dates.length; i++) {
    const date = new Date(dates[i]);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (date.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
