const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const router = express.Router();
const SESSION_COOKIE = 'saas_session';
const SESSION_DAYS = 7;
const XP_REWARDS = Object.freeze({
  task_completed: 10,
  grade_added: 15,
  quiz_completed: 20,
  note_created: 5,
  goal_completed: 10,
  habit_completed: 25,
  study_session_completed: 20,
  daily_reward: 25,
  resource_shared: 10,
  resource_downloaded: 2,
  streak_milestone_7: 25,
  streak_milestone_14: 40,
  streak_milestone_30: 60,
  group_created: 10,
  group_joined: 5,
  message: 1,
  social_request: 1,
  friend_accepted: 2,
  video_watched: 5,
  podcast_subscribed: 2,
  cert_downloaded: 5,
  plan_upgraded: 10,
  coach_interaction: 2,
  mentor_assigned: 2,
  mentor_mode_enabled: 5,
  session_scheduled: 3,
  flashcard_created: 2,
  widget_added: 1,
  event_joined: 3,
  event_created: 5,
  tournament_joined: 5,
  tournament_created: 10,
  exam_completed: 10,
  plan_enrolled: 5,
  challenge_completed: 10,
  skill_unlocked: 15
});

router.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Zu viele Anfragen — bitte erneut versuchen.' }
}));

router.use((req, res, next) => {
  db.ready.then(() => next(), next);
});

function sendError(res, message, code = 500) {
  return res.status(code).json({ success: false, message });
}

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    subscription: user.subscription,
    schoolType: user.schoolType,
    schoolClass: user.schoolClass
  };
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || '';
  for (const part of cookies.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return null;
}

function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL === '1',
    sameSite: 'lax',
    path: '/'
  });
}

function requireAuth(req, res, next) {
  const publicRoutes = new Set(['/login', '/register', '/health']);
  if (publicRoutes.has(req.path) && req.method === 'POST' || req.path === '/health' && req.method === 'GET') {
    return next();
  }

  const token = getCookie(req, SESSION_COOKIE);
  if (!token || token.length > 128) return sendError(res, 'Bitte melde dich erneut an.', 401);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  db.get(
    `SELECT users.id, users.username, users.email, users.subscription, users."schoolType" AS "schoolType",
      users."schoolClass" AS "schoolClass"
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    [tokenHash, new Date().toISOString()]
  ).then((user) => {
    if (!user) {
      clearSessionCookie(res);
      return sendError(res, 'Sitzung abgelaufen. Bitte melde dich erneut an.', 401);
    }
    req.user = user;
    next();
  }, next);
}

router.use(requireAuth);

async function createSession(user, res) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const existingSettings = await db.get('SELECT user_id FROM privacy_settings WHERE user_id = ?', [user.id]);
  if (!existingSettings) await db.run('INSERT INTO privacy_settings(user_id) VALUES (?)', [user.id]);
  await db.run('INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)', [tokenHash, user.id, expiresAt]);
  setSessionCookie(res, token);
  return safeUser(user);
}

function requireText(value, label, maxLength = 200) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
    const error = new Error(`${label} muss zwischen 1 und ${maxLength} Zeichen lang sein.`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

async function areFriends(firstId, secondId) {
  return Boolean(await db.get(
    `SELECT id FROM friendships
     WHERE status = 'accepted' AND
       ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))`,
    [firstId, secondId, secondId, firstId]
  ));
}

async function isGroupMember(groupId, userId) {
  return Boolean(await db.get('SELECT 1 AS member FROM study_group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]));
}

router.get('/health', (req, res) => {
  res.json({ success: true, database: db.dialect });
});

router.post('/register', async (req, res, next) => {
  try {
    const username = requireText(req.body.username, 'Benutzername', 50);
    const email = requireText(req.body.email, 'E-Mail-Adresse', 254).toLowerCase();
    const password = req.body.password;
    const schoolType = requireText(req.body.schoolType, 'Schulart', 80);
    const schoolClass = requireText(req.body.schoolClass, 'Klasse', 40);
    const birthdate = requireText(req.body.birthdate, 'Geburtsdatum', 10);
    if (username.length < 3) return sendError(res, 'Benutzername muss mindestens 3 Zeichen lang sein.', 400);
    if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
      return sendError(res, 'Passwort muss mindestens 12 Zeichen lang sein.', 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendError(res, 'Ungültige E-Mail-Adresse.', 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || Number.isNaN(Date.parse(birthdate))) {
      return sendError(res, 'Ungültiges Geburtsdatum.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await db.run(
      `INSERT INTO users(username, email, password, subscription, "schoolType", "schoolClass", birthdate)
       VALUES (?, ?, ?, 'Free', ?, ?, ?)`,
      [username, email, passwordHash, schoolType, schoolClass, birthdate]
    );
    const user = await db.get(
      `SELECT id, username, email, subscription, "schoolType" AS "schoolType", "schoolClass" AS "schoolClass"
       FROM users WHERE id = ?`,
      [inserted.lastID]
    );
    await db.run('INSERT INTO privacy_settings(user_id) VALUES (?)', [user.id]);
    const responseUser = await createSession(user, res);
    return res.status(201).json({ success: true, user: responseUser });
  } catch (error) {
    if (/UNIQUE|duplicate key/i.test(error.message)) return sendError(res, 'Benutzername oder E-Mail existiert bereits.', 409);
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const username = requireText(req.body.username, 'Benutzername', 254);
    if (typeof req.body.password !== 'string' || !req.body.password || req.body.password.length > 128) return sendError(res, 'Passwort erforderlich oder zu lang.', 400);
    const user = await db.get(
      `SELECT id, username, email, subscription, password,
        "schoolType" AS "schoolType", "schoolClass" AS "schoolClass"
       FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)`,
      [username, username]
    );
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return sendError(res, 'Ungültige Anmeldedaten.', 401);
    }
    const responseUser = await createSession(user, res);
    return res.json({ success: true, user: responseUser });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.get('/me', (req, res) => res.json({ success: true, user: safeUser(req.user) }));

router.post('/logout', async (req, res, next) => {
  const token = getCookie(req, SESSION_COOKIE);
  try {
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
    }
    clearSessionCookie(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/user/:id', async (req, res, next) => {
  if (String(req.user.id) !== req.params.id) return sendError(res, 'Nicht autorisiert.', 403);
  try {
    res.json({ success: true, user: safeUser(req.user) });
  } catch (error) {
    next(error);
  }
});

router.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await db.all(
      'SELECT id, user_id, title, description, due_date, due_date AS dueDate, priority, completed, completed_at AS completedAt FROM tasks WHERE user_id = ? ORDER BY due_date',
      [req.user.id]
    );
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

router.post('/tasks', async (req, res, next) => {
  try {
    const title = requireText(req.body.title, 'Aufgabentitel', 160);
    const description = typeof req.body.description === 'string' ? req.body.description.slice(0, 2000) : '';
    const dueDate = req.body.dueDate ? requireText(req.body.dueDate, 'Fälligkeitsdatum', 10) : null;
    if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate)))) {
      return sendError(res, 'Ungültiges Fälligkeitsdatum.', 400);
    }
    const priority = ['low', 'medium', 'high'].includes(req.body.priority) ? req.body.priority : 'medium';
    const result = await db.run(
      'INSERT INTO tasks(user_id, title, description, due_date, priority, completed) VALUES (?, ?, ?, ?, ?, 0)',
      [req.user.id, title, description, dueDate, priority]
    );
    res.status(201).json({ success: true, task: { id: result.lastID, title, description, dueDate, priority, completed: 0 } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.put('/tasks/:id', async (req, res, next) => {
  try {
    const current = await db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!current) return sendError(res, 'Aufgabe nicht gefunden.', 404);
    const title = req.body.title === undefined ? current.title : requireText(req.body.title, 'Aufgabentitel', 160);
    const description = req.body.description === undefined ? current.description : String(req.body.description).slice(0, 2000);
    const dueDate = req.body.dueDate === undefined ? current.due_date : req.body.dueDate;
    const priority = req.body.priority === undefined ? current.priority : req.body.priority;
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return sendError(res, 'Ungültiges Fälligkeitsdatum.', 400);
    if (!['low', 'medium', 'high'].includes(priority)) return sendError(res, 'Ungültige Priorität.', 400);
    const completed = req.body.completed === undefined ? current.completed : req.body.completed ? 1 : 0;
    await db.run(
      `UPDATE tasks SET title = ?, description = ?, due_date = ?, priority = ?, completed = ?,
       completed_at = CASE WHEN ? = 1 AND completed = 0 THEN CURRENT_TIMESTAMP WHEN ? = 0 THEN NULL ELSE completed_at END
       WHERE id = ? AND user_id = ?`,
      [title, description, dueDate, priority, completed, completed, completed, req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.delete('/tasks/:id', async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return sendError(res, 'Aufgabe nicht gefunden.', 404);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/grades', async (req, res, next) => {
  try {
    const grades = await db.all('SELECT id, subject, grade, date FROM grades WHERE user_id = ? ORDER BY date', [req.user.id]);
    res.json({ grades });
  } catch (error) {
    next(error);
  }
});

router.post('/grades', async (req, res, next) => {
  try {
    const subject = requireText(req.body.subject, 'Fach', 100);
    const grade = requireText(req.body.grade, 'Note', 20);
    const date = requireText(req.body.date, 'Datum', 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return sendError(res, 'Ungültiges Notendatum.', 400);
    const result = await db.run('INSERT INTO grades(user_id, subject, grade, date) VALUES (?, ?, ?, ?)', [req.user.id, subject, grade, date]);
    res.status(201).json({ success: true, grade: { id: result.lastID, subject, grade, date } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.delete('/grades/:id', async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM grades WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return sendError(res, 'Note nicht gefunden.', 404);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/friends', async (req, res, next) => {
  try {
    const friends = await db.all(
      `SELECT f.id, f.status, f.requester_id AS requesterId, f.addressee_id AS addresseeId,
        u.id AS userId, u.username
       FROM friendships f JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
       WHERE f.requester_id = ? OR f.addressee_id = ? ORDER BY f.created_at DESC`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json({ friends });
  } catch (error) {
    next(error);
  }
});

router.get('/friends/search', async (req, res, next) => {
  const term = String(req.query.q || '').trim();
  if (term.length < 2) return res.json({ users: [] });
  try {
    const users = await db.all(
      `SELECT u.id, u.username FROM users u
       JOIN privacy_settings p ON p.user_id = u.id AND p.allow_friend_requests = 1
       WHERE u.id <> ? AND LOWER(u.username) LIKE LOWER(?) ORDER BY u.username LIMIT 20`,
      [req.user.id, `%${term.slice(0, 50)}%`]
    );
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.post('/friends/:id', async (req, res, next) => {
  const friendId = Number(req.params.id);
  if (!Number.isSafeInteger(friendId) || friendId < 1 || friendId === req.user.id) return sendError(res, 'Ungültiger Benutzer.', 400);
  try {
    const target = await db.get(
      `SELECT u.id FROM users u JOIN privacy_settings p ON p.user_id = u.id
       WHERE u.id = ? AND p.allow_friend_requests = 1`,
      [friendId]
    );
    if (!target) return sendError(res, 'Benutzer nicht gefunden oder nimmt keine Anfragen an.', 404);
    const duplicate = await db.get(
      'SELECT id FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)',
      [req.user.id, friendId, friendId, req.user.id]
    );
    if (duplicate) return sendError(res, 'Anfrage oder Freundschaft besteht bereits.', 409);
    const result = await db.run('INSERT INTO friendships(requester_id, addressee_id) VALUES (?, ?)', [req.user.id, friendId]);
    res.status(201).json({ success: true, id: result.lastID });
  } catch (error) {
    next(error);
  }
});

router.put('/friends/:id', async (req, res, next) => {
  const status = req.body.status;
  if (!['accepted', 'declined'].includes(status)) return sendError(res, 'Ungültige Antwort.', 400);
  try {
    const request = await db.get('SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?', [req.params.id, req.user.id, 'pending']);
    if (!request) return sendError(res, 'Freundschaftsanfrage nicht gefunden.', 404);
    if (status === 'declined') await db.run('DELETE FROM friendships WHERE id = ?', [request.id]);
    else await db.run('UPDATE friendships SET status = ? WHERE id = ?', [status, request.id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/friends/:id', async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)', [req.params.id, req.user.id, req.user.id]);
    if (!result.changes) return sendError(res, 'Freundschaft nicht gefunden.', 404);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/messages/:friendId', async (req, res, next) => {
  const friendId = Number(req.params.friendId);
  try {
    if (!await areFriends(req.user.id, friendId)) return sendError(res, 'Nachrichten sind nur mit bestätigten Freunden möglich.', 403);
    const settings = await db.get('SELECT allow_messages FROM privacy_settings WHERE user_id = ?', [friendId]);
    if (!settings?.allow_messages) return sendError(res, 'Dieser Benutzer nimmt keine Nachrichten an.', 403);
    const messages = await db.all(
      `SELECT id, sender_id AS senderId, recipient_id AS recipientId, body, created_at AS createdAt, read_at AS readAt
       FROM messages WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
       ORDER BY created_at LIMIT 200`,
      [req.user.id, friendId, friendId, req.user.id]
    );
    await db.run('UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE sender_id = ? AND recipient_id = ? AND read_at IS NULL', [friendId, req.user.id]);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.post('/messages/:friendId', async (req, res, next) => {
  const friendId = Number(req.params.friendId);
  try {
    const body = requireText(req.body.body, 'Nachricht', 2000);
    if (!await areFriends(req.user.id, friendId)) return sendError(res, 'Nachrichten sind nur mit bestätigten Freunden möglich.', 403);
    const settings = await db.get('SELECT allow_messages FROM privacy_settings WHERE user_id = ?', [friendId]);
    if (!settings?.allow_messages) return sendError(res, 'Dieser Benutzer nimmt keine Nachrichten an.', 403);
    const result = await db.run('INSERT INTO messages(sender_id, recipient_id, body) VALUES (?, ?, ?)', [req.user.id, friendId, body]);
    res.status(201).json({ success: true, id: result.lastID });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.get('/groups', async (req, res, next) => {
  try {
    const groups = await db.all(
      `SELECT g.id, g.name, g.description, g.subject, g.owner_id AS ownerId,
        CASE WHEN g.owner_id = ? THEN g.join_code ELSE NULL END AS "joinCode",
        (SELECT COUNT(*) FROM study_group_members m WHERE m.group_id = g.id) AS memberCount
       FROM study_groups g JOIN study_group_members mine ON mine.group_id = g.id AND mine.user_id = ?
       ORDER BY g.created_at DESC`,
      [req.user.id, req.user.id]
    );
    res.json({ groups });
  } catch (error) {
    next(error);
  }
});

router.post('/groups', async (req, res, next) => {
  try {
    const name = requireText(req.body.name, 'Gruppenname', 80);
    const description = typeof req.body.description === 'string' ? req.body.description.slice(0, 500) : '';
    const subject = typeof req.body.subject === 'string' ? req.body.subject.slice(0, 80) : '';
    const id = crypto.randomUUID();
    const joinCode = crypto.randomBytes(8).toString('hex');
    await db.run('INSERT INTO study_groups(id, owner_id, name, description, subject, join_code) VALUES (?, ?, ?, ?, ?, ?)', [id, req.user.id, name, description, subject, joinCode]);
    await db.run('INSERT INTO study_group_members(group_id, user_id, role) VALUES (?, ?, ?)', [id, req.user.id, 'owner']);
    res.status(201).json({ success: true, group: { id, name, description, subject, ownerId: req.user.id, joinCode, memberCount: 1 } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.post('/groups/join', async (req, res, next) => {
  const code = String(req.body.joinCode || '').trim();
  if (!/^[a-f0-9]{16}$/i.test(code)) return sendError(res, 'Ungültiger Beitrittscode.', 400);
  try {
    const group = await db.get('SELECT id FROM study_groups WHERE join_code = ?', [code]);
    if (!group) return sendError(res, 'Gruppe nicht gefunden.', 404);
    await db.run('INSERT INTO study_group_members(group_id, user_id) VALUES (?, ?)', [group.id, req.user.id]);
    res.json({ success: true, groupId: group.id });
  } catch (error) {
    if (/UNIQUE|duplicate key/i.test(error.message)) return sendError(res, 'Du bist bereits Mitglied dieser Gruppe.', 409);
    next(error);
  }
});

router.delete('/groups/:id/membership', async (req, res, next) => {
  try {
    const group = await db.get('SELECT owner_id FROM study_groups WHERE id = ?', [req.params.id]);
    if (!group) return sendError(res, 'Gruppe nicht gefunden.', 404);
    if (group.owner_id === req.user.id) return sendError(res, 'Die Gruppenleitung kann die Gruppe nicht verlassen; lösche die Gruppe stattdessen.', 400);
    const result = await db.run('DELETE FROM study_group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return sendError(res, 'Du bist kein Mitglied dieser Gruppe.', 404);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/groups/:id/goals', async (req, res, next) => {
  try {
    if (!await isGroupMember(req.params.id, req.user.id)) return sendError(res, 'Kein Zugriff auf diese Gruppe.', 403);
    res.json({ goals: await db.all('SELECT id, title, target, progress, due_date AS dueDate FROM shared_goals WHERE group_id = ? ORDER BY created_at DESC', [req.params.id]) });
  } catch (error) {
    next(error);
  }
});

router.post('/groups/:id/goals', async (req, res, next) => {
  try {
    if (!await isGroupMember(req.params.id, req.user.id)) return sendError(res, 'Kein Zugriff auf diese Gruppe.', 403);
    const title = requireText(req.body.title, 'Zieltitel', 120);
    const target = Number(req.body.target || 1);
    if (!Number.isSafeInteger(target) || target < 1 || target > 100000) return sendError(res, 'Ungültiger Zielwert.', 400);
    const id = crypto.randomUUID();
    await db.run('INSERT INTO shared_goals(id, group_id, owner_id, title, target, due_date) VALUES (?, ?, ?, ?, ?, ?)', [id, req.params.id, req.user.id, title, target, req.body.dueDate || null]);
    res.status(201).json({ success: true, goal: { id, title, target, progress: 0 } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.put('/groups/:id/goals/:goalId', async (req, res, next) => {
  try {
    if (!await isGroupMember(req.params.id, req.user.id)) return sendError(res, 'Kein Zugriff auf diese Gruppe.', 403);
    const goal = await db.get('SELECT target FROM shared_goals WHERE id = ? AND group_id = ?', [req.params.goalId, req.params.id]);
    if (!goal) return sendError(res, 'Gruppenziel nicht gefunden.', 404);
    const progress = Number(req.body.progress);
    if (!Number.isSafeInteger(progress) || progress < 0 || progress > goal.target) return sendError(res, 'Fortschritt muss zwischen 0 und dem Zielwert liegen.', 400);
    await db.run('UPDATE shared_goals SET progress = ? WHERE id = ? AND group_id = ?', [progress, req.params.goalId, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/groups/:id/items', async (req, res, next) => {
  try {
    if (!await isGroupMember(req.params.id, req.user.id)) return sendError(res, 'Kein Zugriff auf diese Gruppe.', 403);
    res.json({ items: await db.all('SELECT id, kind, title, content, created_at AS createdAt FROM shared_items WHERE group_id = ? ORDER BY created_at DESC', [req.params.id]) });
  } catch (error) {
    next(error);
  }
});

router.post('/groups/:id/items', async (req, res, next) => {
  try {
    if (!await isGroupMember(req.params.id, req.user.id)) return sendError(res, 'Kein Zugriff auf diese Gruppe.', 403);
    const kind = ['note', 'quiz', 'resource'].includes(req.body.kind) ? req.body.kind : null;
    if (!kind) return sendError(res, 'Ungültiger Inhaltstyp.', 400);
    const title = requireText(req.body.title, 'Titel', 120);
    const content = requireText(req.body.content, 'Inhalt', 10000);
    const id = crypto.randomUUID();
    await db.run('INSERT INTO shared_items(id, owner_id, group_id, kind, title, content) VALUES (?, ?, ?, ?, ?, ?)', [id, req.user.id, req.params.id, kind, title, content]);
    res.status(201).json({ success: true, item: { id, kind, title, content } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.get('/resources', async (req, res, next) => {
  try {
    const resources = await db.all(
      `SELECT r.id, r.owner_id AS ownerId, u.username AS author, r.title, r.subject, r.url, r.kind,
        r.description, r.visibility, r.created_at AS createdAt,
        CASE WHEN s.user_id IS NULL THEN 0 ELSE 1 END AS saved
       FROM resources r JOIN users u ON u.id = r.owner_id
       LEFT JOIN saved_resources s ON s.resource_id = r.id AND s.user_id = ?
       LEFT JOIN friendships f ON f.status = 'accepted' AND
         ((f.requester_id = ? AND f.addressee_id = r.owner_id) OR (f.requester_id = r.owner_id AND f.addressee_id = ?))
       WHERE r.owner_id = ? OR r.visibility = 'community' OR (r.visibility = 'friends' AND f.id IS NOT NULL)
       ORDER BY r.created_at DESC LIMIT 100`,
      [req.user.id, req.user.id, req.user.id, req.user.id]
    );
    res.json({ resources });
  } catch (error) {
    next(error);
  }
});

router.post('/resources', async (req, res, next) => {
  try {
    const title = requireText(req.body.title, 'Titel', 120);
    const subject = typeof req.body.subject === 'string' ? req.body.subject.slice(0, 80) : '';
    const url = requireText(req.body.url, 'URL', 2000);
    const parsedUrl = new URL(url);
    if (!['https:', 'http:'].includes(parsedUrl.protocol) || parsedUrl.username || parsedUrl.password) {
      return sendError(res, 'Nur gültige HTTP(S)-Links ohne eingebettete Zugangsdaten sind erlaubt.', 400);
    }
    const kind = ['article', 'video', 'document', 'link'].includes(req.body.kind) ? req.body.kind : 'link';
    const description = typeof req.body.description === 'string' ? req.body.description.slice(0, 500) : '';
    const visibility = ['private', 'friends', 'community'].includes(req.body.visibility) ? req.body.visibility : 'private';
    const id = crypto.randomUUID();
    await db.run('INSERT INTO resources(id, owner_id, title, subject, url, kind, description, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, req.user.id, title, subject, parsedUrl.href, kind, description, visibility]);
    res.status(201).json({ success: true, resource: { id, ownerId: req.user.id, title, subject, url: parsedUrl.href, kind, description, visibility } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    if (error instanceof TypeError) return sendError(res, 'Ungültige URL.', 400);
    next(error);
  }
});

router.delete('/resources/:id', async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM resources WHERE id = ? AND owner_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return sendError(res, 'Ressource nicht gefunden.', 404);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.put('/resources/:id/saved', async (req, res, next) => {
  try {
    const resource = await db.get(
      `SELECT r.id FROM resources r LEFT JOIN friendships f ON f.status = 'accepted' AND
        ((f.requester_id = ? AND f.addressee_id = r.owner_id) OR (f.requester_id = r.owner_id AND f.addressee_id = ?))
       WHERE r.id = ? AND (r.owner_id = ? OR r.visibility = 'community' OR (r.visibility = 'friends' AND f.id IS NOT NULL))`,
      [req.user.id, req.user.id, req.params.id, req.user.id]
    );
    if (!resource) return sendError(res, 'Ressource nicht gefunden.', 404);
    if (req.body.saved === true) {
      const existing = await db.get('SELECT user_id FROM saved_resources WHERE user_id = ? AND resource_id = ?', [req.user.id, req.params.id]);
      if (!existing) await db.run('INSERT INTO saved_resources(user_id, resource_id) VALUES (?, ?)', [req.user.id, req.params.id]);
    } else {
      await db.run('DELETE FROM saved_resources WHERE user_id = ? AND resource_id = ?', [req.user.id, req.params.id]);
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/study-sessions', async (req, res, next) => {
  try {
    const durationMinutes = Number(req.body.durationMinutes);
    if (!Number.isSafeInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 360) {
      return sendError(res, 'Lernzeit muss zwischen 1 und 360 Minuten liegen.', 400);
    }
    const subject = typeof req.body.subject === 'string' ? req.body.subject.slice(0, 80) : '';
    const id = crypto.randomUUID();
    await db.run('INSERT INTO study_sessions(id, user_id, subject, duration_minutes) VALUES (?, ?, ?, ?)', [id, req.user.id, subject, durationMinutes]);
    res.status(201).json({ success: true, id });
  } catch (error) {
    next(error);
  }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const [tasks, grades, sessions] = await Promise.all([
      db.all('SELECT id, title, due_date AS dueDate, completed, completed_at AS completedAt FROM tasks WHERE user_id = ?', [req.user.id]),
      db.all('SELECT subject, grade, date FROM grades WHERE user_id = ? ORDER BY date', [req.user.id]),
      db.all('SELECT subject, duration_minutes AS durationMinutes, completed_at AS completedAt FROM study_sessions WHERE user_id = ? ORDER BY completed_at', [req.user.id])
    ]);
    res.json({ tasks, grades, studySessions: sessions });
  } catch (error) {
    next(error);
  }
});

router.get('/reminders', async (req, res, next) => {
  try {
    res.json({ reminders: await db.all('SELECT id, title, due_at AS dueAt, repeat_rule AS repeatRule, enabled FROM reminders WHERE user_id = ? ORDER BY due_at', [req.user.id]) });
  } catch (error) {
    next(error);
  }
});

router.post('/reminders', async (req, res, next) => {
  try {
    const title = requireText(req.body.title, 'Erinnerungstitel', 120);
    const dueAt = requireText(req.body.dueAt, 'Erinnerungszeitpunkt', 40);
    if (!Number.isFinite(Date.parse(dueAt))) return sendError(res, 'Ungültiger Zeitpunkt.', 400);
    const repeatRule = ['none', 'daily', 'weekly', 'monthly'].includes(req.body.repeatRule) ? req.body.repeatRule : 'none';
    const id = crypto.randomUUID();
    await db.run('INSERT INTO reminders(id, user_id, title, due_at, repeat_rule) VALUES (?, ?, ?, ?, ?)', [id, req.user.id, title, new Date(dueAt).toISOString(), repeatRule]);
    res.status(201).json({ success: true, reminder: { id, title, dueAt: new Date(dueAt).toISOString(), repeatRule, enabled: 1 } });
  } catch (error) {
    if (error.status) return sendError(res, error.message, error.status);
    next(error);
  }
});

router.delete('/reminders/:id', async (req, res, next) => {
  try {
    const result = await db.run('DELETE FROM reminders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!result.changes) return sendError(res, 'Erinnerung nicht gefunden.', 404);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

const defaultNotificationSettings = Object.freeze({
  friends: false,
  learningGoals: false,
  achievements: false,
  dailySummary: false,
  repeat: 'none',
  weekday: 1,
  time: '19:00',
  deadlineReminders: false,
  reminderLeadHours: 24
});

router.get('/notification-settings', async (req, res, next) => {
  try {
    const row = await db.get('SELECT settings_json AS settings FROM notification_settings WHERE user_id = ?', [req.user.id]);
    const saved = row ? JSON.parse(row.settings) : {};
    res.json({ settings: { ...defaultNotificationSettings, ...saved } });
  } catch (error) {
    next(error);
  }
});

router.put('/notification-settings', async (req, res, next) => {
  const allowed = new Set(Object.keys(defaultNotificationSettings));
  if (Object.keys(req.body).some((key) => !allowed.has(key))) return sendError(res, 'Unbekannte Benachrichtigungseinstellung.', 400);
  try {
    const row = await db.get('SELECT settings_json AS settings FROM notification_settings WHERE user_id = ?', [req.user.id]);
    const current = { ...defaultNotificationSettings, ...(row ? JSON.parse(row.settings) : {}) };
    const updated = { ...current, ...req.body };
    for (const key of ['friends', 'learningGoals', 'achievements', 'dailySummary', 'deadlineReminders']) {
      if (typeof updated[key] !== 'boolean') return sendError(res, 'Benachrichtigungseinstellungen müssen boolesche Werte sein.', 400);
    }
    if (!['none', 'daily', 'weekly', 'monthly'].includes(updated.repeat)) return sendError(res, 'Ungültige Wiederholung.', 400);
    if (!Number.isSafeInteger(updated.weekday) || updated.weekday < 0 || updated.weekday > 6) return sendError(res, 'Ungültiger Wochentag.', 400);
    if (typeof updated.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(updated.time)) return sendError(res, 'Ungültige Uhrzeit.', 400);
    if (!Number.isSafeInteger(updated.reminderLeadHours) || updated.reminderLeadHours < 0 || updated.reminderLeadHours > 168) {
      return sendError(res, 'Ungültiger Vorlauf für Erinnerungen.', 400);
    }
    await db.run(
      `INSERT INTO notification_settings(user_id, settings_json) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET settings_json = excluded.settings_json`,
      [req.user.id, JSON.stringify(updated)]
    );
    res.json({ success: true, settings: updated });
  } catch (error) {
    next(error);
  }
});

router.get('/privacy', async (req, res, next) => {
  try {
    let settings = await db.get('SELECT show_level, show_achievements, show_in_leaderboard, allow_friend_requests, allow_messages FROM privacy_settings WHERE user_id = ?', [req.user.id]);
    if (!settings) {
      await db.run('INSERT INTO privacy_settings(user_id) VALUES (?)', [req.user.id]);
      settings = await db.get('SELECT show_level, show_achievements, show_in_leaderboard, allow_friend_requests, allow_messages FROM privacy_settings WHERE user_id = ?', [req.user.id]);
    }
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.put('/privacy', async (req, res, next) => {
  const keys = ['show_level', 'show_achievements', 'show_in_leaderboard', 'allow_friend_requests', 'allow_messages'];
  if (keys.some((key) => req.body[key] !== undefined && typeof req.body[key] !== 'boolean')) {
    return sendError(res, 'Datenschutzeinstellungen müssen boolesche Werte sein.', 400);
  }
  try {
    let settings = await db.get('SELECT * FROM privacy_settings WHERE user_id = ?', [req.user.id]);
    if (!settings) {
      await db.run('INSERT INTO privacy_settings(user_id) VALUES (?)', [req.user.id]);
      settings = await db.get('SELECT * FROM privacy_settings WHERE user_id = ?', [req.user.id]);
    }
    const values = keys.map((key) => req.body[key] === undefined ? settings[key] : req.body[key] ? 1 : 0);
    await db.run(
      `UPDATE privacy_settings SET show_level = ?, show_achievements = ?, show_in_leaderboard = ?,
        allow_friend_requests = ?, allow_messages = ? WHERE user_id = ?`,
      [...values, req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/xp', async (req, res, next) => {
  const reward = XP_REWARDS[req.body.reason];
  if (!reward) return sendError(res, 'Unbekannte Lernaktivität.', 400);
  const eventKey = typeof req.body.eventKey === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(req.body.eventKey)
    ? req.body.eventKey
    : null;
  if (!eventKey) return sendError(res, 'Eindeutige Aktivitäts-ID erforderlich.', 400);
  try {
    const today = new Date().toISOString().slice(0, 10);
    const earnedToday = await db.get(
      'SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_events WHERE user_id = ? AND created_at >= ?',
      [req.user.id, today]
    );
    if (Number(earnedToday.xp) + reward > 500) return sendError(res, 'Das tägliche XP-Limit ist erreicht.', 429);
    const result = await db.run('INSERT OR IGNORE INTO xp_events(user_id, reason, amount, event_key) VALUES (?, ?, ?, ?)', [req.user.id, req.body.reason, reward, eventKey]);
    if (!result.changes) return sendError(res, 'Diese Aktivität wurde bereits gutgeschrieben.', 409);
    const total = await db.get('SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_events WHERE user_id = ?', [req.user.id]);
    res.status(201).json({ success: true, amount: reward, totalXP: Number(total.xp) });
  } catch (error) {
    next(error);
  }
});

router.get('/gamification', async (req, res, next) => {
  try {
    const total = await db.get('SELECT COALESCE(SUM(amount), 0) AS xp FROM xp_events WHERE user_id = ?', [req.user.id]);
    const xp = Number(total.xp);
    let level = 1;
    let threshold = 500;
    let spent = 0;
    while (spent + threshold <= xp) {
      spent += threshold;
      level += 1;
      threshold = 500 * level;
    }
    const leaderboard = await db.all(
      `SELECT u.username, COALESCE(SUM(x.amount), 0) AS xp
       FROM privacy_settings p JOIN users u ON u.id = p.user_id
       LEFT JOIN xp_events x ON x.user_id = u.id
       WHERE p.show_in_leaderboard = 1 GROUP BY u.id, u.username
       ORDER BY xp DESC LIMIT 10`
    );
    res.json({ xp, level, xpToNext: spent + threshold - xp, leaderboard });
  } catch (error) {
    next(error);
  }
});

router.get('/comparisons', async (req, res, next) => {
  try {
    const comparisons = await db.all(
      `SELECT u.id, u.username, COALESCE(SUM(x.amount), 0) AS xp,
        CASE WHEN p.show_level = 1 THEN 1 ELSE 0 END AS showLevel
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
       JOIN privacy_settings p ON p.user_id = u.id
       LEFT JOIN xp_events x ON x.user_id = u.id
       WHERE f.status = 'accepted' AND p.show_in_leaderboard = 1 AND (f.requester_id = ? OR f.addressee_id = ?)
       GROUP BY u.id, u.username, p.show_level ORDER BY xp DESC`,
      [req.user.id, req.user.id, req.user.id]
    );
    res.json({ comparisons });
  } catch (error) {
    next(error);
  }
});

router.post('/upgrade', async (req, res, next) => {
  sendError(res, 'Planwechsel sind erst nach Einrichtung eines Zahlungsanbieters verfügbar.', 501);
});

router.post('/ai', (req, res) => {
  if (typeof req.body.question !== 'string' || !req.body.question.trim() || req.body.question.length > 2000) {
    return sendError(res, 'Bitte gib eine Frage mit höchstens 2000 Zeichen ein.', 400);
  }
  const answer = `${req.body.question.trim()} – Unsere KI empfiehlt, zuerst die Grundlagen zu prüfen, dann Schritt für Schritt zu lösen. Achte auf die wichtigsten Begriffe, arbeite ein Beispiel durch und überprüfe dein Ergebnis.`;
  res.json({ success: true, answer });
});

router.use((error, req, res, next) => {
  console.error('API request failed:', error);
  if (res.headersSent) return next(error);
  sendError(res, 'Die Anfrage konnte nicht verarbeitet werden.');
});

module.exports = router;
