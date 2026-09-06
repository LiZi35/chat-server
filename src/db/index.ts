import Database, { type Database as DatabaseType, type Statement } from 'better-sqlite3'

const db: DatabaseType = new Database('data.db')
db.pragma('journal_mode = WAL')

db.exec(`
    CREATE TABLE IF NOT EXISTS users(
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        nickname TEXT,
        token_invalid_before INTEGER
    );
    CREATE TABLE IF NOT EXISTS messages(
        messageId INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId TEXT,
        senderNickname TEXT,
        content TEXT,
        date INTEGER
    );
    CREATE TABLE IF NOT EXISTS verifyCode(
        email TEXT PRIMARY KEY,
        type TEXT,
        code INTEGER,
        getTime INTEGER,
        failed INTEGER DEFAULT 0
    );
`)

/** .all() */
export const getMessages: Statement = db.prepare(`
    SELECT * FROM messages;
`)
/** .run(senderId,senderNickname,content,date) */
export const addMessages: Statement = db.prepare(`
    INSERT INTO messages (senderId,senderNickname,content,date)
    VALUES (?,?,?,?);
`)
/** .run(id,email,password,nickname,token_invalid_before) */
export const addUser: Statement = db.prepare(`
    INSERT INTO users (id,email,password,nickname,token_invalid_before)
    VALUES (?,?,?,?,?);
`)
/** .get(email) */
export const findUser: Statement = db.prepare(`
    SELECT id,email,password,nickname,token_invalid_before FROM users
    WHERE email = ?;
`)

/** .run(email,type,code,getTime) */
export const setVerifyCode: Statement = db.prepare(`
    INSERT INTO verifyCode(email,type,code,getTime)
    VALUES (?,?,?,?);
`)
/** .get(email) */
export const isSent: Statement = db.prepare(`
    SELECT * FROM verifyCode
    WHERE email = ?;
`)
/** .run(email) */
export const deleteVerifyCode: Statement = db.prepare(`
    DELETE FROM verifyCode
    WHERE email = ?;
`)
/** .run(newPassword,token_invalid_before,email) */
export const updatePassword: Statement = db.prepare(`
    UPDATE users
    SET password = ?,token_invalid_before=?
    WHERE email = ?;
`)
/** .all(messageId,limit) */
export const getAfterMessage: Statement = db.prepare(`
    SELECT * FROM messages
    WHERE messageId > ?
    ORDER BY messageId ASC
    LIMIT ?;
`)
/** .all(messageId,limit) */
export const getBeforeMessage: Statement = db.prepare(`
    SELECT * FROM messages
    WHERE messageId < ?
    ORDER BY messageId DESC 
    LIMIT ?;
`)
/** .get() */
export const getLatestMessageId: Statement = db.prepare(`
    SELECT max(messageId) AS "LatestMessageId" FROM messages
`)
/** .get(messageId) */
export const getAMessage: Statement = db.prepare(`
    SELECT * FROM messages
    WHERE messageId = ?
`)
export function getLastMessageIdNumber() {
    const result = getLatestMessageId.get() as { LatestMessageId: number | null }
    return result.LatestMessageId
}

/** .run(failed,email) */
export const updateVerifyCodeFail: Statement = db.prepare(`
    UPDATE verifyCode
    SET failed = ?
    WHERE email = ?
`)

export default db
