import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve('data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const dbPath = path.join(dataDir, 'app.db');

export const db = new Database(dbPath);


db.prepare(`
  CREATE TABLE IF NOT EXISTS Books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    s3_storage_key TEXT NOT NULL,
    title TEXT NOT NULL
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS DeviceDownloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deviceId TEXT NOT NULL,
    bookId INTEGER NOT NULL,
    FOREIGN KEY (bookId) REFERENCES Books(id) ON DELETE CASCADE
  )
`).run();
