const path = require('node:path');

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
const usePostgres = Boolean(process.env.DATABASE_URL);

if (isProduction && !usePostgres) {
  throw new Error('DATABASE_URL is required in production; SQLite storage is not persistent on serverless hosts.');
}

let client;
let schemaStatements;

if (usePostgres) {
  const { Pool } = require('pg');
  client = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.PG_POOL_MAX) || 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    ...(process.env.PGSSL === 'disable' ? {} : { ssl: { rejectUnauthorized: true } })
  });
  schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, subscription TEXT NOT NULL DEFAULT 'Free',
      "schoolType" TEXT, "schoolClass" TEXT, birthdate TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', due_date TEXT, priority TEXT NOT NULL DEFAULT 'medium',
      completed INTEGER NOT NULL DEFAULT 0, completed_at TIMESTAMPTZ
    )`,
    `CREATE TABLE IF NOT EXISTS grades (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL, grade TEXT NOT NULL, date TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS privacy_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      show_level INTEGER NOT NULL DEFAULT 0, show_achievements INTEGER NOT NULL DEFAULT 0,
      show_in_leaderboard INTEGER NOT NULL DEFAULT 0, allow_friend_requests INTEGER NOT NULL DEFAULT 1,
      allow_messages INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS friendships (
      id SERIAL PRIMARY KEY, requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(requester_id, addressee_id), CHECK(requester_id <> addressee_id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY, sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, read_at TIMESTAMPTZ
    )`,
    `CREATE TABLE IF NOT EXISTS study_groups (
      id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '',
      join_code TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS study_group_members (
      group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member', joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(group_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS shared_goals (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL,
      target INTEGER NOT NULL DEFAULT 1, progress INTEGER NOT NULL DEFAULT 0,
      due_date TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shared_items (
      id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES study_groups(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '', url TEXT NOT NULL,
      kind TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'private',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS saved_resources (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      PRIMARY KEY(user_id, resource_id)
    )`,
    `CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL DEFAULT '', duration_minutes INTEGER NOT NULL,
      completed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, due_at TEXT NOT NULL, repeat_rule TEXT NOT NULL DEFAULT 'none',
      enabled INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS notification_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      settings_json TEXT NOT NULL DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS xp_events (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL, amount INTEGER NOT NULL, event_key TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ];
} else {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.resolve(process.env.SAAS_SQLITE_PATH || path.join(__dirname, 'saas.db'));
  client = new sqlite3.Database(dbPath, (error) => {
    if (error) console.error('Fehler beim Öffnen der lokalen SQLite-Datenbank:', error.message);
    else console.info('Lokale SQLite-Datenbank verbunden:', dbPath);
  });
  schemaStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, subscription TEXT NOT NULL DEFAULT 'Free',
      schoolType TEXT, schoolClass TEXT, birthdate TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', due_date TEXT, priority TEXT NOT NULL DEFAULT 'medium',
      completed INTEGER NOT NULL DEFAULT 0, completed_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL, grade TEXT NOT NULL, date TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS privacy_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      show_level INTEGER NOT NULL DEFAULT 0, show_achievements INTEGER NOT NULL DEFAULT 0,
      show_in_leaderboard INTEGER NOT NULL DEFAULT 0, allow_friend_requests INTEGER NOT NULL DEFAULT 1,
      allow_messages INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT, requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(requester_id, addressee_id), CHECK(requester_id <> addressee_id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT, sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, read_at TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS study_groups (
      id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '',
      join_code TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS study_group_members (
      group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member', joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(group_id, user_id)
    )`,
    `CREATE TABLE IF NOT EXISTS shared_goals (
      id TEXT PRIMARY KEY, group_id TEXT NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL,
      target INTEGER NOT NULL DEFAULT 1, progress INTEGER NOT NULL DEFAULT 0,
      due_date TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS shared_items (
      id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id TEXT REFERENCES study_groups(id) ON DELETE CASCADE,
      kind TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY, owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '', url TEXT NOT NULL,
      kind TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', visibility TEXT NOT NULL DEFAULT 'private',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS saved_resources (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
      PRIMARY KEY(user_id, resource_id)
    )`,
    `CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT NOT NULL DEFAULT '', duration_minutes INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, due_at TEXT NOT NULL, repeat_rule TEXT NOT NULL DEFAULT 'none',
      enabled INTEGER NOT NULL DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS notification_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      settings_json TEXT NOT NULL DEFAULT '{}'
    )`,
    `CREATE TABLE IF NOT EXISTS xp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason TEXT NOT NULL, amount INTEGER NOT NULL, event_key TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ];
}

function postgresSql(sql) {
  let index = 0;
  const ignoreConflict = /INSERT OR IGNORE INTO/i.test(sql);
  const statement = sql.replace(/\?/g, () => `$${++index}`)
    .replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');
  return ignoreConflict ? `${statement} ON CONFLICT DO NOTHING` : statement;
}

async function query(sql, params = []) {
  await ready;
  if (usePostgres) {
    let statement = postgresSql(sql);
    if (/^\s*INSERT INTO/i.test(statement) && !/\bRETURNING\b/i.test(statement)) {
      statement += ' RETURNING id';
    }
    return client.query(statement, params);
  }
  return new Promise((resolve, reject) => {
    if (/^\s*(SELECT|PRAGMA|WITH)\b/i.test(sql)) {
      client.all(sql, params, (error, rows) => error ? reject(error) : resolve({ rows, rowCount: rows.length }));
      return;
    }
    client.run(sql, params, function(error) {
      if (error) return reject(error);
      resolve({ rows: this.lastID ? [{ id: this.lastID }] : [], rowCount: this.changes });
    });
  });
}

async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

async function run(sql, params = []) {
  const result = await query(sql, params);
  return { lastID: result.rows[0]?.id, changes: result.rowCount };
}

const ready = (async () => {
  if (!usePostgres) {
    await new Promise((resolve, reject) => {
      client.serialize(() => {
        client.run('PRAGMA foreign_keys = ON');
        client.run(schemaStatements[0], (error) => error ? reject(error) : resolve());
      });
    });
    for (const statement of schemaStatements.slice(1)) {
      await new Promise((resolve, reject) => client.run(statement, (error) => error ? reject(error) : resolve()));
    }
    const columns = await new Promise((resolve, reject) => client.all('PRAGMA table_info(users)', (error, rows) => error ? reject(error) : resolve(rows)));
    for (const [name, definition] of [['subscription', "TEXT NOT NULL DEFAULT 'Free'"], ['schoolType', 'TEXT'], ['schoolClass', 'TEXT'], ['birthdate', 'TEXT']]) {
      if (!columns.some((column) => column.name === name)) {
        await new Promise((resolve, reject) => client.run(`ALTER TABLE users ADD COLUMN ${name} ${definition}`, (error) => error ? reject(error) : resolve()));
      }
    }
    const taskColumns = await new Promise((resolve, reject) => client.all('PRAGMA table_info(tasks)', (error, rows) => error ? reject(error) : resolve(rows)));
    if (!taskColumns.some((column) => column.name === 'completed_at')) {
      await new Promise((resolve, reject) => client.run('ALTER TABLE tasks ADD COLUMN completed_at TEXT', (error) => error ? reject(error) : resolve()));
    }
    const resourceColumns = await new Promise((resolve, reject) => client.all('PRAGMA table_info(resources)', (error, rows) => error ? reject(error) : resolve(rows)));
    if (!resourceColumns.some((column) => column.name === 'visibility')) {
      await new Promise((resolve, reject) => client.run("ALTER TABLE resources ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'", (error) => error ? reject(error) : resolve()));
    }
    return;
  }
  for (const statement of schemaStatements) await client.query(statement);
  await client.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ');
  await client.query("ALTER TABLE resources ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private'");
})();

module.exports = {
  dialect: usePostgres ? 'postgres' : 'sqlite',
  ready,
  query,
  get,
  all,
  run,
  close: async () => {
    if (usePostgres) await client.end();
    else await new Promise((resolve, reject) => client.close((error) => error ? reject(error) : resolve()));
  }
};
