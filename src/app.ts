import express from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import { PORT, CORS_ORIGIN, RUN_ENV } from './config/env.js'
import authRouter from './routes/auth.js'
import { setupSocket } from './socket/index.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST'],
    },
})

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
})

app.use(express.json())
if (RUN_ENV === 'production') {
    app.use(helmet())
} else {
    app.use(
        helmet({
            contentSecurityPolicy: false,
        })
    )
}
app.use(limiter)
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(cookieParser())

app.use(authRouter)

setupSocket(io)

server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`)
})
