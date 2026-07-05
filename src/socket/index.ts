import cookie from 'cookie'
import type { Server } from 'socket.io'
import { verifyUser } from '../middleware/auth.js'
import { getMessages, addMessages } from '../db/index.js'

export function setupSocket(io: Server) {
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
                addMessages.run(socket.data.user.id, socket.data.user.nickname, content, new Date().getTime())
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
}
