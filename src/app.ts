import express, {
    type Request,
    type Response,
    type NextFunction,
    type ErrorRequestHandler,
} from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import cors from 'cors'
import { PORT, CORS_ORIGIN, RUN_ENV, TRUST_PROXY } from './config/env.js'
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

if (TRUST_PROXY > 0) {
    app.set('trust proxy', TRUST_PROXY)
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: '请求过于频繁，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false,
    ipv6Subnet: 56,
})

app.use(limiter)
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
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(cookieParser())

app.use(authRouter)

app.use((req, res, next) => {
    res.status(404).json({
        code: 404,
        message: '接口不存在',
    })
})

app.use((error: ErrorRequestHandler, req: Request, res: Response, next: NextFunction) => {
    console.error(error)
    res.status(500).json({
        code: 500,
        message: '服务器错误',
    })
})

setupSocket(io)

server.listen(PORT, () => {
    console.log(`server is running at port ${PORT}`)
})
