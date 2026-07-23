export interface User {
    id: string
    email: string
    password: string
    nickname: string
}
export interface Message {
    messageId: number
    senderId: string
    senderNickname: string
    content: string
    date: Date
}
export interface VerifyCodeType {
    email: string
    type: string
    code: number
    getTime: number
}
