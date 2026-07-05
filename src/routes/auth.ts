import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import * as argon2 from 'argon2'
import { SECRET } from '../config/env.js'
import { findUser, addUser } from '../db/index.js'
import type { User } from '../types/index.ts'

const authRouter: ReturnType<typeof Router> = Router()

// 登录
authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body || {}

    if (!email || !password) {
        return res.status(400).json({
            code: 400,
            message: '邮箱或密码不能为空',
        })
    }
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
    const { email, password, nickname } = req.body || {}

    if (!email || !password || !nickname) {
        return res.status(400).json({
            code: 400,
            message: '邮箱、密码或昵称不能为空',
        })
    }
    const isExist = findUser.get(email) as User | undefined
    if (isExist) {
        return res.status(401).json({
            code: 401,
            message: '该账号已存在',
        })
    }
    try {
        const newUser: User = {
            id: uuidv4(),
            email: email,
            password: await argon2.hash(password),
            nickname: nickname,
        }

        addUser.run(uuidv4(), email, await argon2.hash(password), nickname)

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

export default authRouter
