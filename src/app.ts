import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import cookie from 'cookie'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import type { User } from './types/index.ts'
import * as argon2 from 'argon2'
import Database from 'better-sqlite3'

if (!process.env.PORT || !process.env.JWT_SECRET || !process.env.EXPRESS_SESSION_SECRET) {
    throw new Error('.env缺少配置')
}

const db = new Database('data.db')
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

const getMessages = db.prepare(`
    SELECT * FROM messages;
`)
/** .run(senderId,senderNickname,content,date) */
const addMessages = db.prepare(`
    INSERT INTO messages (senderId,senderNickname,content,date)
    VALUES (?,?,?,?);
`)
/** .run(id,email,password,nickname) */
const addUser = db.prepare(`
    INSERT INTO users (id,email,password,nickname)
    VALUES (?,?,?,?);
`)
/** .get(email) */
const findUser = db.prepare(`
    SELECT id,email,password,nickname FROM users
    WHERE email = ?;
`)

const PORT = Number(process.env.PORT)
const SECRET = process.env.JWT_SECRET
const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST'],
    },
})
app.use(express.json())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
            secure: false, // 如果是 https 必须设为 true，本地开发 http 设为 false
            httpOnly: true,
        },
    })
)

server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`)
    /* console.log(
        'The admin token is:',
        jwt.sign({ id: userList[0]?.id, email: userList[0]?.email }, SECRET, {
            expiresIn: '7 days',
        })
    ) */
    console.log(getMessages.all())
})

io.use((socket, next) => {
    const reqCookie = cookie.parse(socket.handshake.headers.cookie || '')
    const user = verifyUser(reqCookie.token)
    if (user.verified && user.user) {
        socket.data.user = user.user
        next()
    } else {
        next(new Error(user.message))
    }
})

io.on('connection', (socket) => {
    console.log('connected')
    // 广播消息
    socket.on('getMessages', () => {
        if (socket.data.user) {
            socket.emit('messagesList', {
                status: 200,
                message: '认证成功',
                messagesList: getMessages.all(),
            })
        } else {
            socket.emit('error', '未认证')
        }
    })
    // 接受消息
    socket.on('sendMessage', (content: string) => {
        if (socket.data.user) {
            addMessages.run(socket.data.user.id, socket.data.user.nickname,content,new Date().getTime())
            io.emit('messagesList', {
                status: 200,
                message: '新消息',
                messagesList: getMessages.all(),
            })
        } else {
            socket.emit('error', '未认证')
        }
    })
})

// 登录
app.post('/login', async (req, res) => {
    // console.log(req.body)
    // res.send(null)
    const { email, password } = req.body || {}

    if (!email || !password) {
        return res.status(400).json({
            code: 400,
            message: '邮箱或密码不能为空',
        })
    }
    const targetUser = findUser.get(email) as User | undefined
    if (!targetUser) {
        return res.status(401).json({
            code: 401,
            message: '邮箱或密码错误',
        })
    }
    try {
        const isMatch = await argon2.verify(targetUser.password, password)
        if (!isMatch) {
            return res.status(401).json({
                code: 401,
                message: '邮箱或密码错误',
            })
        }
    } catch (error) {
        console.log('verify error', error)
        return res.status(500).json({
            code: 500,
            message: '密码验证失败',
        })
    }

    // jwt签名
    const token = jwt.sign(
        {
            id: targetUser.id,
            email: targetUser.email,
        },
        SECRET,
        {
            expiresIn: '7 days',
        }
    )

    /* req.session.user = {
        id: targetUser.id,
        email: targetUser.email,
        nickname: targetUser.nickname,
    } */

    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    }).json({
        code: 200,
        message: '登录成功',
        // token: token,
        email: targetUser.email,
        id: targetUser.id,
        nickname: targetUser.nickname,
    })
})

// 注册
app.post('/register', async (req, res) => {
    const { email, password, nickname } = req.body || {}

    if (!email || !password || !nickname) {
        return res.status(400).json({
            code: 400,
            message: '邮箱、密码或昵称不能为空',
        })
    }
    const isExist = findUser.get(email) as User | undefined
    if (isExist) {
        return res.status(401).json({
            code: 401,
            message: '该账号已存在',
        })
    }
    try {
        const newUser: User = {
            id: uuidv4(),
            email: email,
            password: await argon2.hash(password),
            nickname: nickname,
        }

        addUser.run(uuidv4(), email, await argon2.hash(password), nickname)

        console.log(db.exec(`SELECT * FROM users`))

        /* req.session.user = {
            id: newUser.id,
            email: newUser.email,
            nickname: nickname,
        } */

        try {
            // jwt签名
            const token = jwt.sign(
                {
                    id: newUser.id,
                    email: newUser.email,
                },
                SECRET,
                {
                    expiresIn: '7 days',
                }
            )

            res.cookie('token', token, {
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
            })
                .status(201)
                .json({
                    code: 201,
                    message: '注册成功',
                    // token: token,
                    email: newUser.email,
                    id: newUser.id,
                    nickname: newUser.nickname,
                })
        } catch (error) {
            console.error('Error signing JWT:', error)
            res.status(500).json({
                code: 500,
                message: '服务器错误',
            })
        }
    } catch (error) {
        console.error('Error hashing password:', error)
        res.status(500).json({
            code: 500,
            message: '服务器错误',
        })
    }
})

/** 验证用户 */
function verifyUser(userToken: string | undefined): {
    verified: boolean
    message: string
    user?: { id: string; email: string; nickname: string }
} {
    if (userToken) {
        try {
            const decoded = jwt.verify(userToken, SECRET)
            // 如果 decoded 是 string，则直接解析；如果是对象，则已经是解析好的 Payload
            const userInfo = typeof decoded === 'string' ? JSON.parse(decoded) : decoded

            if (userInfo.id && userInfo.email) {
                const targetUser = findUser.get(userInfo.email) as User | undefined
                if (targetUser) {
                    return {
                        verified: true,
                        message: 'VERIFIED_USER',
                        user: {
                            id: targetUser.id,
                            email: targetUser.email,
                            nickname: targetUser.nickname,
                        },
                    }
                } else {
                    return {
                        verified: false,
                        message: 'UNKNOWN_USER',
                    }
                }
            } else {
                return {
                    verified: false,
                    message: 'ABNORMAL_USER',
                }
            }
        } catch {
            return {
                verified: false,
                message: 'EXPIRED_USER',
            }
        }
    } else {
        return {
            verified: false,
            message: 'NOT_LOGGED_IN',
        }
    }
}
