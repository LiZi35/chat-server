# chat-server
[simple-chatroom](https://github.com/LiZi35/simple-chatroom)的后端

技术栈：express+socket.io。使用SQLite存取数据

支持收发文字消息

---

## 运行
后端暂未支持https，建议搭配反代使用

复制`.env.example`为`.env`
```shell
cp .env.example .env
```
使用 vscode 等编辑器编辑`.env`。例如：
```ini
# 后端的端口
PORT='3000'
# JWT密钥，使用随机字符填写
JWT_SECRET='abcdefg123456higklmn'
# session密钥，使用随机字符填写
EXPRESS_SESSION_SECRET='abcdefg123456higklmn'
# CORS源,填写前端运行的地址
CORS_ORIGIN='https://example.com'
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

---
## 其他
~~本项目主要为古法编程而成~~