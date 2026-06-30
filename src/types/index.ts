export interface user {
    id: string
    email: string
    password: string
    nickname: string
}
export interface message {
    messageId: number
    senderId: string
    senderNickname: string
    content: string
    date: Date
}
