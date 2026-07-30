import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import * as argon2 from 'argon2'
import crypto from 'node:crypto'
import { SECRET } from '../config/env.js'
import {
    findUser,
    addUser,
    setVerifyCode,
    isSent,
    deleteVerifyCode,
    updatePassword,
} from '../db/index.js'
import type { User, VerifyCodeType } from '../types/index.ts'
import { sendVerifyCodeMail } from '../services/mail.js'
import {
    forgetPasswordDataSchema,
    loginDataSchema,
    registerDataSchema,
    sendVerifyCodeDataSchema,
} from '../schema/index.js'
import { z } from 'zod'

const authRouter: ReturnType<typeof Router> = Router()

// 登录
authRouter.post('/login', async (req, res) => {
    const result = loginDataSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            code: 400,
            message: '输入格式不合法',
            errorTree: z.treeifyError(result.error),
        })
    }

    const { email, password } = result.data

    const targetUser = findUser.get(email) as User | undefined
    if (!targetUser) {
        return res.status(401).json({
            code: 401,
            message: '邮箱或密码错误',
        })
    }
    try {
        const isMatch = await argon2.verify(targetUser.password, password)
        if (!isMatch) {
            return res.status(401).json({
                code: 401,
                message: '邮箱或密码错误',
            })
        }
    } catch (error) {
        console.log('verify error', error)
        return res.status(500).json({
            code: 500,
            message: '密码验证失败',
        })
    }

    // jwt签名
    const token = jwt.sign(
        {
            id: targetUser.id,
            email: targetUser.email,
        },
        SECRET,
        {
            expiresIn: '7 days',
        }
    )

    res.cookie('token', token, {
        httpOnly: true,
        secure: req.secure,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    }).json({
        code: 200,
        message: '登录成功',
        email: targetUser.email,
        id: targetUser.id,
        nickname: targetUser.nickname,
    })
})

// 注册
authRouter.post('/register', async (req, res) => {
    const result = registerDataSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            code: 400,
            message: '输入格式不合法',
            errorTree: z.treeifyError(result.error),
        })
    }

    const { email, password, nickname, code } = result.data

    const isExist = findUser.get(email) as User | undefined
    if (isExist) {
        return res.status(409).json({
            code: 409,
            message: '该账号已存在',
        })
    }

    const verifyCode = isSent.get(email) as VerifyCodeType | undefined
    if (!verifyCode || verifyCode.type !== 'register') {
        return res.status(400).json({
            code: 400,
            message: '未请求验证码',
        })
    }
    if (new Date().getTime() - verifyCode.getTime > 1000 * 60 * 5) {
        return res.status(400).json({
            code: 400,
            message: '验证码已过期',
        })
    }
    if (Number(verifyCode.code) !== Number(code)) {
        return res.status(400).json({
            code: 400,
            message: '验证码错误',
        })
    }

    deleteVerifyCode.run(email)

    try {
        const newUser: User = {
            id: uuidv4(),
            email: email,
            password: await argon2.hash(password),
            nickname: nickname,
            token_invalid_before: new Date().getTime(),
        }

        addUser.run(newUser.id, email, newUser.password, nickname, newUser.token_invalid_before)

        try {
            // jwt签名
            const token = jwt.sign(
                {
                    id: newUser.id,
                    email: newUser.email,
                },
                SECRET,
                {
                    expiresIn: '7 days',
                }
            )

            res.cookie('token', token, {
                httpOnly: true,
                secure: req.secure,
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
            })
                .status(201)
                .json({
                    code: 201,
                    message: '注册成功',
                    email: newUser.email,
                    id: newUser.id,
                    nickname: newUser.nickname,
                })
        } catch (error) {
            console.error('Error signing JWT:', error)
            res.status(500).json({
                code: 500,
                message: '服务器错误',
            })
        }
    } catch (error) {
        console.error('Error hashing password:', error)
        res.status(500).json({
            code: 500,
            message: '服务器错误',
        })
    }
})

// 发送验证码
authRouter.post('/sendVerifyCode', async (req, res) => {
    const result = sendVerifyCodeDataSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            code: 400,
            message: '输入格式不合法',
            errorTree: z.treeifyError(result.error),
        })
    }

    const { email, type } = result.data

    if (type === 'register') {
        const verifyUser = findUser.get(email)
        if (verifyUser) {
            return res.status(409).json({
                code: 409,
                message: '用户已存在',
            })
        }
    }

    const code = crypto.randomInt(100000, 1000000)

    const user = isSent.get(email) as VerifyCodeType | undefined
    if (user) {
        if (new Date().getTime() - user.getTime < 1000 * 60) {
            return res.status(400).json({
                code: 400,
                message: '发送验证码过于频繁',
            })
        } else {
            deleteVerifyCode.run(email)
        }
    }

    const sendType = (function (type: string): string {
        if (type === 'register') {
            return '注册'
        } else if (type === 'forgetPassword') {
            return '忘记密码'
        } else {
            return '验证邮箱'
        }
    })(type)

    try {
        await sendVerifyCodeMail(email, sendType, code)
        setVerifyCode.run(email, type, code, new Date().getTime())
    } catch (error) {
        return res.status(500).json({
            code: 500,
            message: '服务器异常',
        })
    }

    res.json({
        code: 200,
        message: '验证码发送成功',
    })
})

// 忘记密码
authRouter.post('/forgetPassword', async (req, res) => {
    const result = forgetPasswordDataSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            code: 400,
            message: '输入格式不合法',
            errorTree: z.treeifyError(result.error),
        })
    }

    const { email, verifyCode, newPassword } = result.data

    const dataVerifyCode = isSent.get(email) as VerifyCodeType | undefined

    if (!dataVerifyCode || dataVerifyCode.type !== 'forgetPassword') {
        return res.status(400).json({
            code: 400,
            message: '未请求验证码',
        })
    }

    if (new Date().getTime() - dataVerifyCode.getTime > 1000 * 60 * 5) {
        return res.status(400).json({
            code: 400,
            message: '验证码已过期',
        })
    }

    if (Number(verifyCode) !== Number(dataVerifyCode.code)) {
        return res.status(400).json({
            code: 400,
            message: '验证码不正确',
        })
    }

    const user = findUser.get(email) as User | undefined
    if (!user) {
        return res.status(400).json({
            code: 400,
            message: '用户未找到',
        })
    }

    try {
        if (await argon2.verify(user.password, newPassword)) {
            return res.status(400).json({
                code: 400,
                message: '新密码与旧密码相等',
            })
        }
    } catch (error) {
        console.error('Error hashing password:', error)
        return res.status(500).json({
            code: 500,
            message: '服务器错误',
        })
    }

    try {
        const hashedPassword = await argon2.hash(newPassword)
        updatePassword.run(hashedPassword, new Date().getTime(), email)
        deleteVerifyCode.run(email)
        return res.status(200).json({
            code: 200,
            message: '密码修改成功',
        })
    } catch (error) {
        console.error('Error hashing password or database:', error)
        return res.status(500).json({
            code: 500,
            message: '服务器错误',
        })
    }
})

export default authRouter
