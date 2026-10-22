/**
 * JWT Token 校验与解析工具
 */

export interface JwtPayload {
  exp?: number
  iat?: number
  sub?: string
  [key: string]: any
}

/**
 * 安全地对 base64url 进行解码（支持 UTF-8 多字节字符）
 */
export function decodeBase64Url(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new TextDecoder().decode(bytes)
  } catch {
    return ''
  }
}

/**
 * 解析 JWT 的 Payload 数据
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const jsonStr = decodeBase64Url(parts[1])
    if (!jsonStr) return null
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

/**
 * 校验 Token 是否已经过期
 * @param token JWT 字符串
 * @returns true 表示已过期或无效，false 表示仍然有效
 */
export function isTokenExpired(token: string): boolean {
  if (!token) return true

  const parts = token.split('.')
  // 若非 3 段式 JWT，不做时间戳校验
  if (parts.length !== 3) {
    return false
  }

  const payload = parseJwtPayload(token)
  if (!payload) {
    // 无法解析 payload，视为无效/过期
    return true
  }

  if (typeof payload.exp === 'number') {
    const nowInSeconds = Math.floor(Date.now() / 1000)
    // 提前 5 秒判定为过期，预留网络往返缓冲时间
    return nowInSeconds >= payload.exp - 5
  }

  return false
}

/**
 * 清除本地登录凭据
 */
export function clearAuthStorage(): void {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  } catch {
    // ignore
  }
}
