import express from 'express'
import session from 'express-session'
import cookieParser from 'cookie-parser'
import cookie from 'cookie'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import type { message, user } from './types/index.ts'

// todo:数据库
let userList: user[] = [
    {
        id: 'a3962166-7b4c-4773-8f4e-00721508d2a2',
        email: 'test@example.com',
        password: '123456',
        nickname: 'admin',
    },
]
let messagesList: message[] = [
    {
        messageId: 1,
        senderId: 'a3962166-7b4c-4773-8f4e-00721508d2a2',
        senderNickname: 'admin',
        content: 'hello',
    },
]
let messageId = 1

const PORT = 3000
const SECRET = ' vjndjsgioehnrfowjr39j'
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
        secret: 'cf5787de-4e14-4923-9c0c-fe987025eea5',
        resave: false, // 是否每次请求都重新保存 Session（设为 false 提高性能）
        saveUninitialized: false, // 是否自动为未登录的用户初始化一个空 Session（设为 false 节省内存）
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // Cookie 有效期：1天（单位：毫秒）
            secure: false, // 如果是 https 必须设为 true，本地开发 http 设为 false
            httpOnly: true, // 核心安全配置：防止前端通过 JS (document.cookie) 盗取 Session ID
        },
    })
)

server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`)
    console.log(
        'The admin token is:',
        jwt.sign({ id: userList[0]?.id, email: userList[0]?.email }, SECRET, {
            expiresIn: '7 days',
        })
    )
})

io.on('connection', (socket) => {
    console.log('connected')
    // 广播消息
    socket.on('getMessages', () => {
        console.log(socket.handshake.headers.cookie)
        const reqCookie = cookie.parse(socket.handshake.headers.cookie || '')
        // console.log(reqCookie)
        const user = verifyUser(reqCookie.token)
        if (user.verified == true) {
            socket.emit('messagesList', { status: 200, message: user.message, messagesList: messagesList })
        } else {
            socket.emit('messagesList', { status: 403, message: user.message })
        }
    })
    // 接受消息
    socket.on('sendMessage', (content) => {
        messageId += 1
        const newMessage: message = {
            messageId: messageId,
            senderId: 'a3962166-7b4c-4773-8f4e-00721508d2a2',
            senderNickname: 'admin',
            content: 'hello',
        }
        messagesList.push(newMessage)
    })
})

// 登录
app.post('/login', (req, res) => {
    // console.log(req.body)
    // res.send(null)
    const { email, password } = req.body || {}

    if (!email || !password) {
        return res.status(400).json({
            code: 400,
            message: '邮箱或密码不能为空',
        })
    }
    const targetUser = userList.find(
        (u) => u.email === email && u.password === password
    )
    if (!targetUser) {
        return res.status(401).json({
            code: 401,
            message: '邮箱或密码错误',
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

    req.session.user = {
        id: targetUser.id,
        email: targetUser.email,
        nickname: targetUser.nickname,
    }

    res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    }).json({
        code: 200,
        message: '登录成功',
        token: token,
        email: targetUser.email,
        id: targetUser.id,
        nickname: targetUser.nickname,
    })
})

// 注册
app.post('/register', (req, res) => {
    // console.log(req.body)
    // res.send(null)
    const { email, password, nickname } = req.body || {}

    if (!email || !password || !nickname) {
        return res.status(400).json({
            code: 400,
            message: '邮箱、密码或昵称不能为空',
        })
    }
    const isExist = userList.find((u) => u.email === email)
    if (isExist) {
        return res.status(401).json({
            code: 401,
            message: '该账号已存在',
        })
    }
    const newUser: user = {
        id: uuidv4(),
        email: email,
        password: password,
        nickname: nickname,
    }

    userList.push(newUser)

    console.log(userList)

    req.session.user = {
        id: newUser.id,
        email: newUser.email,
        nickname: nickname,
    }

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
            token: token,
            email: newUser.email,
            id: newUser.id,
            nickname: newUser.nickname,
        })
})

// 验证用户
function verifyUser(userToken: string | undefined) {
    if (userToken) {
        try {
            const decoded = jwt.verify(userToken, SECRET)
            // 如果 decoded 是 string，则直接解析；如果是对象，则已经是解析好的 Payload
            const userInfo =
                typeof decoded === 'string' ? JSON.parse(decoded) : decoded

            if (userInfo.id && userInfo.email) {
                const targetUser = userList.find(
                    (u) =>
                        u.email === userInfo.email &&
                        u.id === userInfo.id
                )
                if (targetUser) {
                    return ({
                        verified: true,
                        message: '已验证',
                        user: {
                            id: userInfo.id,
                            email: userInfo.email
                        }
                    })
                } else {
                    return ({
                        verified: false,
                        message: '未知用户',
                    })
                }
            } else {
                return ({
                    verified: false,
                    message: '登录异常',
                })
            }
        } catch {
            return ({
                verified: false,
                message: '登录已过期',
            })
        }
    } else {
        return ({
            verified: false,
            message: '未登录',
        })
    }
}