import cookie from 'cookie'
import type { Server } from 'socket.io'
import { verifyUser } from '../middleware/auth.js'
import {
    addMessages,
    getAfterMessage,
    getBeforeMessage,
    getLatestMessageId,
    getAMessage,
    getLastMessageIdNumber,
} from '../db/index.js'

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
        // console.log('connected')
        // 接受消息
        socket.on('sendMessage', (content: string) => {
            if (socket.data.user) {
                addMessages.run(
                    socket.data.user.id,
                    socket.data.user.nickname,
                    content,
                    new Date().getTime()
                )
                const res = {
                    status: 200,
                    message: '新消息',
                    newMessages: getAMessage.get(getLastMessageIdNumber()),
                }
                io.emit('newMessage', res)
            } else {
                socket.emit('error', '未认证')
            }
        })

        socket.on('getAfterMessage', (messageId: number, limit: number) => {
            if (socket.data.user) {
                const result = getAfterMessage.all(messageId, limit)
                socket.emit('AfterMessagesList', {
                    status: 200,
                    messageId: messageId,
                    limit: limit,
                    messageList: result,
                })
            } else {
                socket.emit('error', '未认证')
            }
        })

        socket.on('getBeforeMessage', (messageId: number, limit: number) => {
            if (socket.data.user) {
                const result = getBeforeMessage.all(messageId, limit)
                socket.emit('BeforeMessagesList', {
                    status: 200,
                    messageId: messageId,
                    limit: limit,
                    messageList: result,
                })
            } else {
                socket.emit('error', '未认证')
            }
        })

        socket.on('getLatestMessageId', () => {
            if (socket.data.user) {
                const result = getLatestMessageId.get() as { LatestMessageId: number | null }
                if (result.LatestMessageId) {
                    socket.emit('LatestMessageId', result.LatestMessageId)
                } else {
                    socket.emit('LatestMessageId', {
                        status: 200,
                        LatestMessageId: 0,
                    })
                }
            } else {
                socket.emit('error', '未认证')
            }
        })
    })
}
