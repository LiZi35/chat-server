import Database, { type Database as DatabaseType, type Statement } from 'better-sqlite3'

const db: DatabaseType = new Database('data.db')
db.pragma('journal_mode = WAL')

db.exec(`
    CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        nickname TEXT
    );
    CREATE TABLE IF NOT EXISTS messages(
        messageId INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId TEXT,
        senderNickname TEXT,
        content TEXT,
        date INTEGER
    );
`)

export const getMessages: Statement = db.prepare(`
    SELECT * FROM messages;
`)
/** .run(senderId,senderNickname,content,date) */
export const addMessages: Statement = db.prepare(`
    INSERT INTO messages (senderId,senderNickname,content,date)
    VALUES (?,?,?,?);
`)
/** .run(id,email,password,nickname) */
export const addUser: Statement = db.prepare(`
    INSERT INTO users (id,email,password,nickname)
    VALUES (?,?,?,?);
`)
/** .get(email) */
export const findUser: Statement = db.prepare(`
    SELECT id,email,password,nickname FROM users
    WHERE email = ?;
`)

export default db
