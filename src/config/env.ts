import 'dotenv/config'

if (
    !process.env.PORT ||
    !process.env.JWT_SECRET ||
    !process.env.EXPRESS_SESSION_SECRET ||
    !process.env.CORS_ORIGIN
) {
    throw new Error('.env缺少配置')
}

export const PORT = Number(process.env.PORT)
export const SECRET = process.env.JWT_SECRET
export const CORS_ORIGIN = process.env.CORS_ORIGIN
