export interface User {
    id: string
    email: string
    password: string
    nickname: string
    token_invalid_before: number
}
export interface Message {
    messageId: number
    senderId: string
    senderNickname: string
    content: string
    date: number
}
export interface VerifyCodeType {
    email: string
    type: string
    code: number
    getTime: number
    failed: number
}
export interface socketError {
    on: 'sendMessage' | 'getBeforeMessage' | 'getAfterMessage' | 'getLatestMessageId'
    shouldOut: boolean
    message: string
}
