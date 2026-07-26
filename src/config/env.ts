import 'dotenv/config'

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

export const PORT = Number(process.env.PORT)
export const SECRET = process.env.JWT_SECRET
export const CORS_ORIGIN = process.env.CORS_ORIGIN

export const MAIL_SENDER = process.env.MAIL_SENDER || 'simple-chatroom'

export const MAIL_HOST = process.env.MAIL_HOST
export const MAIL_PORT = Number(process.env.MAIL_PORT)
export const MAIL_USER = process.env.MAIL_USER
export const MAIL_PASS = process.env.MAIL_PASS
