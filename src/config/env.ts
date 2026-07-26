import 'dotenv/config'

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'production') {
    throw new Error('缺少运行环境，请使用pnpm run dev/start运行')
}

if (
    !process.env.PORT ||
    !process.env.JWT_SECRET ||
    !process.env.CORS_ORIGIN ||
    !process.env.MAIL_HOST ||
    !process.env.MAIL_PORT ||
    !process.env.MAIL_USER ||
    !process.env.MAIL_PASS
) {
    throw new Error('.env缺少配置')
}

export const RUN_ENV = process.env.NODE_ENV

export const PORT = Number(process.env.PORT)
export const SECRET = process.env.JWT_SECRET
export const CORS_ORIGIN = process.env.CORS_ORIGIN

export const MAIL_SENDER = process.env.MAIL_SENDER || 'simple-chatroom'

export const MAIL_HOST = process.env.MAIL_HOST
export const MAIL_PORT = Number(process.env.MAIL_PORT)
export const MAIL_USER = process.env.MAIL_USER
export const MAIL_PASS = process.env.MAIL_PASS
