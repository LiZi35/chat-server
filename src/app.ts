import express from "express"
import session from 'express-session'
import { Server } from "socket.io";
import { createServer } from 'node:http';
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from "uuid"
import type { user } from "./types/index.ts"

let userList: user[] = [
    { id: 'a3962166-7b4c-4773-8f4e-00721508d2a2', email: 'test@example.com', password: '123456', nickName: 'admin' }
]
let messageList

const PORT = 3000
const app = express()
const server = createServer(app)
const io = new Server(server)
app.use(express.json())
app.use(cors())
app.use(session({
    secret: 'cf5787de-4e14-4923-9c0c-fe987025eea5',
    resave: false, // 是否每次请求都重新保存 Session（设为 false 提高性能）
    saveUninitialized: false, // 是否自动为未登录的用户初始化一个空 Session（设为 false 节省内存）
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Cookie 有效期：1天（单位：毫秒）
        secure: false, // 如果是 https 必须设为 true，本地开发 http 设为 false
        httpOnly: true // 核心安全配置：防止前端通过 JS (document.cookie) 盗取 Session ID
    }
}))



server.listen(PORT, () => {
    console.log(`server is running`)
})

// 登录
app.post('/login', (req, res) => {
    // console.log(req.body)
    // res.send(null)
    const { email, password } = req.body || {}

    if (!email || !password) {
        return res.status(400).json({
            code: 400,
            message: "邮箱或密码不能为空"
        })
    }
    const targetUser = userList.find(u => u.email === email && u.password === password)
    if (!targetUser) {
        return res.status(401).json({
            code: 401,
            message: "邮箱或密码错误"
        })
    }
    req.session.user = {
        id: targetUser.id,
        email: targetUser.email,
        nickName: targetUser.nickName
    }
    res.json({
        code: 200,
        message: '登录成功',
        email: targetUser.email,
        id: targetUser.id
    })

})

app.post('/register', (req, res) => {
    // console.log(req.body)
    // res.send(null)
    const { email, password, nickName } = req.body || {}

    if (!email || !password || nickName) {
        return res.status(400).json({
            code: 400,
            message: "邮箱或密码不能为空"
        })
    }
    const isExist = userList.find(u => u.email === email)
    if (isExist) {
        return res.status(401).json({
            code: 401,
            message: "该账号已存在"
        })
    }
    const newUser: user = { id: uuidv4(), email: email, password: password, nickName: nickName }

    userList.push(newUser)
    console.log(userList)
    req.session.user = {
        id: newUser.id,
        email: newUser.email,
        nickName: nickName
    }
    res.status(201).json({
        code: 201,
        message: '注册成功',
        email: newUser.email,
        id: newUser.id,
        nickName: newUser.nickName
    })
})