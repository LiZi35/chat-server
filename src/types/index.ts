export interface user{
    id:string
    email:string
    password:string
    nickName:string
}
export interface message{
    messageId:number
    senderId:string
    senderNickName:string
    content:string
}