import jwt from 'jsonwebtoken'
import { SECRET } from '../config/env.js'
import { findUser } from '../db/index.js'
import type { User } from '../types/index.js'

/** 验证用户 */
export function verifyUser(userToken: string | undefined): {
    verified: boolean
    message: string
    user?: { id: string; email: string; nickname: string }
} {
    if (userToken) {
        try {
            const decoded = jwt.verify(userToken, SECRET)
            // 如果 decoded 是 string，则直接解析；如果是对象，则已经是解析好的 Payload
            const userInfo = typeof decoded === 'string' ? JSON.parse(decoded) : decoded

            if (userInfo.id && userInfo.email) {
                const targetUser = findUser.get(userInfo.email) as User | undefined
                if (targetUser) {
                    if (
                        targetUser.token_invalid_before &&
                        userInfo.iat * 1000 <= Number(targetUser.token_invalid_before)
                    ) {
                        return {
                            verified: false,
                            message: 'EXPIRED_USER',
                        }
                    }
                    return {
                        verified: true,
                        message: 'VERIFIED_USER',
                        user: {
                            id: targetUser.id,
                            email: targetUser.email,
                            nickname: targetUser.nickname,
                        },
                    }
                } else {
                    return {
                        verified: false,
                        message: 'UNKNOWN_USER',
                    }
                }
            } else {
                return {
                    verified: false,
                    message: 'ABNORMAL_USER',
                }
            }
        } catch {
            return {
                verified: false,
                message: 'EXPIRED_USER',
            }
        }
    } else {
        return {
            verified: false,
            message: 'NOT_LOGGED_IN',
        }
    }
}
