const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'saas.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
  } else {
    console.log('Datenbank verbunden:', dbPath);
  }
});

function runSchemaStatement(statement, params = []) {
  return new Promise((resolve, reject) => {
    db.run(statement, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

function getTableColumns(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await getTableColumns(tableName);
  if (!columns.some((column) => column.name === columnName)) {
    await runSchemaStatement(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function createSchema() {
  try {
    await runSchemaStatement(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      subscription TEXT DEFAULT 'Free',
      schoolType TEXT,
      schoolClass TEXT,
      birthdate TEXT
    )`);

    await runSchemaStatement(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      due_date TEXT,
      priority TEXT,
      completed INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await runSchemaStatement(`CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      subject TEXT,
      grade TEXT,
      date TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    await ensureColumn('users', 'subscription', "TEXT DEFAULT 'Free'");
    await ensureColumn('users', 'schoolType', 'TEXT');
    await ensureColumn('users', 'schoolClass', 'TEXT');
    await ensureColumn('users', 'birthdate', 'TEXT');

    const hashedTestPassword = bcrypt.hashSync('Test1234!', 10);
    await runSchemaStatement(
      `INSERT OR IGNORE INTO users (username, email, password, subscription) VALUES (?, ?, ?, ?)`,
      ['testuser', 'testuser@example.com', hashedTestPassword, 'Core']
    );

    console.log('Datenbankschema initialisiert.');
  } catch (error) {
    console.error('Schema-Initialisierung fehlgeschlagen:', error);
  }
}

createSchema();

module.exports = db;