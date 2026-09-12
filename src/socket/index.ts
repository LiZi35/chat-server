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
import { getLimitMessagesDataSchema, sendMessageDataSchema } from '../schema/index.js'
import { getUserToken } from '../utils/index.js'
import type { socketError } from '../types/index.js'

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
        socket.on('sendMessage', (dataContent: string) => {
            if (verifyUser(getUserToken(socket.handshake.headers.cookie)).verified) {
                const result = sendMessageDataSchema.safeParse({ content: dataContent })
                if (result.success) {
                    const { content } = result.data
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
                    socket.emit('error', <socketError>{
                        on: 'sendMessage',
                        shouldOut: false,
                        message: '参数错误' + result.error.message,
                    })
                }
            } else {
                socket.emit('error', <socketError>{
                    on: 'sendMessage',
                    shouldOut: true,
                    message: '未认证',
                })
            }
        })

        socket.on('getAfterMessage', (dataMessageId: number, dataLimit: number) => {
            if (verifyUser(getUserToken(socket.handshake.headers.cookie)).verified) {
                const dataResult = getLimitMessagesDataSchema.safeParse({
                    messageId: dataMessageId,
                    limit: dataLimit,
                })
                if (dataResult.success) {
                    const { messageId, limit } = dataResult.data
                    const result = getAfterMessage.all(messageId, limit)
                    socket.emit('AfterMessagesList', {
                        status: 200,
                        messageId: messageId,
                        limit: limit,
                        messageList: result,
                    })
                } else {
                    socket.emit('error', <socketError>{
                        on: 'getAfterMessage',
                        shouldOut: false,
                        message: '参数错误' + dataResult.error.message,
                    })
                }
            } else {
                socket.emit('error', <socketError>{
                    on: 'getAfterMessage',
                    shouldOut: true,
                    message: '未认证',
                })
            }
        })

        socket.on('getBeforeMessage', (dataMessageId: number, dataLimit: number) => {
            if (verifyUser(getUserToken(socket.handshake.headers.cookie)).verified) {
                const dataResult = getLimitMessagesDataSchema.safeParse({
                    messageId: dataMessageId,
                    limit: dataLimit,
                })
                if (dataResult.success) {
                    const { messageId, limit } = dataResult.data
                    const result = getBeforeMessage.all(messageId, limit)
                    socket.emit('BeforeMessagesList', {
                        status: 200,
                        messageId: messageId,
                        limit: limit,
                        messageList: result,
                    })
                } else {
                    socket.emit('error', <socketError>{
                        on: 'getBeforeMessage',
                        shouldOut: false,
                        message: '参数错误' + dataResult.error.message,
                    })
                }
            } else {
                socket.emit('error', <socketError>{
                    on: 'getBeforeMessage',
                    shouldOut: true,
                    message: '未认证',
                })
            }
        })

        socket.on('getLatestMessageId', () => {
            if (verifyUser(getUserToken(socket.handshake.headers.cookie)).verified) {
                const result = getLatestMessageId.get() as { LatestMessageId: number | null }
                if (result.LatestMessageId) {
                    socket.emit('LatestMessageId', {
                        status: 200,
                        latestMessageId: result.LatestMessageId,
                    })
                } else {
                    socket.emit('LatestMessageId', {
                        status: 200,
                        latestMessageId: 0,
                    })
                }
            } else {
                socket.emit('error', <socketError>{
                    on: 'getLatestMessageId',
                    shouldOut: true,
                    message: '未认证',
                })
            }
        })
    })
}
