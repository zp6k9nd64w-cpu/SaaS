const express = require('express');
const router = express.Router();
const db = require('./database');
const bcrypt = require('bcryptjs');

// Simple in-memory rate limiter per IP (lightweight fallback)
const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMaxRequests = 30;
const ipCounters = new Map();

function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = ipCounters.get(ip) || { count: 0, started: now };
  if (now - entry.started > rateLimitWindowMs) {
    entry.count = 0;
    entry.started = now;
  }
  entry.count += 1;
  ipCounters.set(ip, entry);
  if (entry.count > rateLimitMaxRequests) {
    return res.status(429).json({ success: false, message: 'Zu viele Anfragen — bitte erneut versuchen' });
  }
  next();
}

router.use(rateLimitMiddleware);

const defaultTasks = [
  { id: 1, title: 'Mathe Hausaufgabe', description: 'Kapitel 5 lösen', dueDate: '2024-10-01', priority: 'high', completed: 0 },
  { id: 2, title: 'Englisch Vokabeln', description: '50 neue Wörter lernen', dueDate: '2024-10-02', priority: 'medium', completed: 1 }
];

const defaultGrades = [
  { id: 1, subject: 'Mathe', grade: 'A', date: '2024-09-15' },
  { id: 2, subject: 'Englisch', grade: 'B+', date: '2024-09-16' }
];

function sendError(res, message = 'Serverfehler', code = 500) {
  return res.status(code).json({ success: false, message });
}

function normalizeUserId(userId) {
  const parsed = Number(userId);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return sendError(res, 'Username und Passwort erforderlich', 400);

  db.get(
    'SELECT id, username, email, subscription, schoolType, schoolClass, birthdate, password FROM users WHERE username = ?',
    [username],
    (err, row) => {
      if (err) return sendError(res, 'Datenbankfehler');
      if (!row) return res.status(401).json({ success: false, message: 'Ungültige Anmeldedaten' });
      const storedHash = row.password;
      const valid = bcrypt.compareSync(password, storedHash);
      if (!valid) return res.status(401).json({ success: false, message: 'Ungültige Anmeldedaten' });
      // Remove password before sending user
      delete row.password;
      res.json({ success: true, user: row });
    }
  );
});

router.post('/register', (req, res) => {
  const { username, email, password, schoolType, schoolClass, birthdate } = req.body;
  if (!username || !email || !password || !schoolType || !schoolClass || !birthdate) {
    return sendError(res, 'Alle Felder sind erforderlich', 400);
  }

  // Basic validation
  if (typeof username !== 'string' || username.length < 3 || username.length > 50) return sendError(res, 'Ungültiger Benutzername', 400);
  if (typeof password !== 'string' || password.length < 8) return sendError(res, 'Passwort muss mindestens 8 Zeichen haben', 400);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return sendError(res, 'Ungültige E-Mail-Adresse', 400);

  const hashed = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users(username, email, password, subscription, schoolType, schoolClass, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?)');
  stmt.run(username, email, hashed, 'Free', schoolType, schoolClass, birthdate, function(err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE')) {
        return sendError(res, 'Benutzername oder E-Mail existiert bereits', 400);
      }
      return sendError(res, 'Datenbankfehler');
    }
    res.json({ success: true, user: { id: this.lastID, username, email, subscription: 'Free', schoolType, schoolClass, birthdate } });
  });
  stmt.finalize();
});

router.get('/user/:id', (req, res) => {
  const userId = normalizeUserId(req.params.id);
  if (!userId) return sendError(res, 'Ungültige Benutzer-ID', 400);

  db.get('SELECT id, username, email, subscription, schoolType, schoolClass, birthdate FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return sendError(res, 'Datenbankfehler');
    if (!row) return res.status(404).json({ success: false, message: 'Benutzer nicht gefunden' });
    res.json({ success: true, user: row });
  });
});

router.get('/tasks', (req, res) => {
  const userId = normalizeUserId(req.query.userId);
  if (!userId) return res.json({ tasks: defaultTasks });

  db.all('SELECT id, title, description, due_date as dueDate, priority, completed FROM tasks WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ tasks: rows.length ? rows : defaultTasks });
  });
});

router.post('/tasks', (req, res) => {
  const { userId, title, description, dueDate, priority } = req.body;
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || !title || !dueDate) return sendError(res, 'Aufgabendaten fehlen', 400);

  const stmt = db.prepare('INSERT INTO tasks(user_id, title, description, due_date, priority, completed) VALUES (?, ?, ?, ?, ?, ?)');
  stmt.run(normalizedUserId, title, description, dueDate, priority || 'medium', 0, function(err) {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ success: true, task: { id: this.lastID, userId: normalizedUserId, title, description, dueDate, priority, completed: 0 } });
  });
  stmt.finalize();
});

router.put('/tasks/:id', (req, res) => {
  const { title, description, dueDate, priority, completed } = req.body;
  db.run('UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, completed = ? WHERE id = ?', [title, description, dueDate, priority, completed ? 1 : 0, req.params.id], function(err) {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ success: true, message: 'Aufgabe aktualisiert', id: req.params.id });
  });
});

router.delete('/tasks/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function(err) {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ success: true, message: 'Aufgabe gelöscht' });
  });
});

router.delete('/grades/:id', (req, res) => {
  db.run('DELETE FROM grades WHERE id = ?', [req.params.id], function(err) {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ success: true, message: 'Note gelöscht' });
  });
});

router.get('/grades', (req, res) => {
  const userId = normalizeUserId(req.query.userId);
  if (!userId) return res.json({ grades: defaultGrades });

  db.all('SELECT id, subject, grade, date FROM grades WHERE user_id = ?', [userId], (err, rows) => {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ grades: rows.length ? rows : defaultGrades });
  });
});

router.post('/grades', (req, res) => {
  const { userId, subject, grade, date } = req.body;
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || !subject || !grade || !date) return sendError(res, 'Notendaten fehlen', 400);

  const stmt = db.prepare('INSERT INTO grades(user_id, subject, grade, date) VALUES (?, ?, ?, ?)');
  stmt.run(normalizedUserId, subject, grade, date, function(err) {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ success: true, grade: { id: this.lastID, userId: normalizedUserId, subject, grade, date } });
  });
  stmt.finalize();
});

router.post('/upgrade', (req, res) => {
  const { userId, plan } = req.body;
  const normalizedUserId = normalizeUserId(userId);
  if (!normalizedUserId || !plan) return sendError(res, 'Upgrade-Daten fehlen', 400);

  db.run('UPDATE users SET subscription = ? WHERE id = ?', [plan, normalizedUserId], function(err) {
    if (err) return sendError(res, 'Datenbankfehler');
    res.json({ success: true, plan });
  });
});

router.post('/ai', (req, res) => {
  const { question } = req.body;
  if (!question) return sendError(res, 'Frage fehlt', 400);

  const answer = `${question} – Unsere KI empfiehlt, zuerst die Grundlagen zu prüfen, dann Schritt für Schritt zu lösen. Achte auf die wichtigsten Begriffe, arbeite ein Beispiel durch und überprüfe dein Ergebnis.`;
  res.json({ success: true, answer });
});

module.exports = router;