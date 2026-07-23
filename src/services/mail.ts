import nodemailer from 'nodemailer'
import fs from 'node:fs/promises'
import { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_SENDER, MAIL_USER } from '../config/env.js'

const address = MAIL_SENDER + ' <' + MAIL_USER + '>'

const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: true,
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
    },
})

export async function sendVerifyCodeMail(toMail: string, type: string, code: number) {
    const template = await fs.readFile('src/template/mail_code.html', 'utf8')
    const html = template
        .split(/\r?\n/)
        .filter((line) => !line.includes('write by ChatGPT'))
        .join('\n')
        .replace('{{CODE}}', code.toString())
        .replace('{{type}}', type)
        .replace('{{EXPIRE}}', '5')
        .replace('{{APP_NAME}}', 'simple-chatroom')
        .replace('{{YEAR}}', new Date().getFullYear().toString())
    await transporter.sendMail({
        to: toMail,
        from: address,
        subject: '您的验证码',
        html: html,
    })
}
