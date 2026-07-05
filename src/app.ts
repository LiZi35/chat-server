import express from 'express'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import { PORT, CORS_ORIGIN } from './config/env.js'
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

app.use(express.json())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(cookieParser())

app.use(authRouter)

setupSocket(io)

server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`)
})
