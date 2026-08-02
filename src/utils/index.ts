export function getTokenInvalidBefore() {
    // JWT 的 iat 是秒级；回退 1 秒，避免同秒新签发的 Token 被误判失效
    return Date.now() - 1000
}
