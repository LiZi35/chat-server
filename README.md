# chat-server
[simple-chatroom](https://github.com/LiZi35/simple-chatroom)的后端

技术栈：express+socket.io。使用SQLite存取数据

支持收发文字消息


## 运行
后端暂未支持https，建议搭配反代使用

clone 本项目
```shell
git clone https://github.com/LiZi35/chat-server.git
```
```shell
cd chat-server
```
复制`.env.example`为`.env`
```shell
cp .env.example .env
```
使用 vscode 等编辑器编辑`.env`。例如：
```ini
# 后端的端口
PORT='3000'
# JWT密钥，使用随机字符填写
JWT_SECRET='abcdefg123456'
# CORS源,填写前端运行的地址
CORS_ORIGIN='https://example.com'

# 邮箱的服务器地址，例如：smtp.163.com
MAIL_HOST='smtp.163.com'
# 邮箱地址的端口，一般为465
MAIL_PORT=465
# 邮箱的名称，例如example@example.com
MAIL_USER='example@example.com'
# 邮箱的密码，请从邮箱官网中启用SMTP并获取填写授权码
MAIL_PASS='1234567abcdefg'
# 发送邮件时发件人的名称，不填则默认为simple-chatroom
MAIL_SENDER='chatroom'
```

安装依赖：
```shell
pnpm install
```
构建：
```shell
pnpm build
```
运行：
```shell
pnpm start
```

## 其他
~~本项目主要为古法编程而成~~