import { z } from 'zod'

export const loginDataSchema = z.object({
    email: z.email('请输入正确的邮箱地址').toLowerCase(),
    password: z
        .string('密码需要为字符串')
        .min(8, '密码需要大于8个字符')
        .max(32, '密码不能超过32个字符'),
})

export const registerDataSchema = loginDataSchema.extend({
    nickname: z
        .string('用户名需要为字符串')
        .min(3, '用户名不能小于3个字符')
        .max(8, '用户名不能大于8个字符'),
    code: z.coerce
        .number('验证码需要为数字')
        .int('验证码需要为整数')
        .min(100000, '验证码为6位数字')
        .max(999999, '验证码为6位数字'),
})

export const sendVerifyCodeDataSchema = z.object({
    email: z.email('请输入正确的邮箱地址').toLowerCase(),
    type: z.enum(['register', 'forgetPassword'], '非法的请求参数'),
})

export const forgetPasswordDataSchema = z.object({
    email: z.email('请输入正确的邮箱地址').toLowerCase(),
    verifyCode: z.coerce
        .number('验证码需要为数字')
        .int('验证码需要为整数')
        .min(100000, '验证码为6位数字')
        .max(999999, '验证码为6位数字'),
    newPassword: z
        .string('密码需要为字符串')
        .min(8, '密码需要大于8个字符')
        .max(32, '密码不能超过32个字符'),
})

export const sendMessageDataSchema = z.object({
    content: z.string('内容不为字符串').min(1, '消息内容不能为空').max(300, '消息长度过大'),
})
export const getLimitMessagesDataSchema = z.object({
    messageId:z.number('参数需要为数字').min(0,'消息ID不能小于0'),
    limit:z.number('参数需要为数字').min(1,'消息数量不能小于1').max(60,'消息数量不能大于60'),
})
