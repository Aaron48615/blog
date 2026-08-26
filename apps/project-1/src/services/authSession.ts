import axios from 'axios'
import store from '@/store'
import { setInfo } from '@/store/slice/authSlice'
import type { ApiResponse, LoginData } from '@/types'
import { createSingleFlight, isTokenExpired } from '@/utils/authToken'

type SessionExpiredListener = () => void

const refreshClient = axios.create({
  baseURL: '/api',
  timeout: 10_000,
})

const sessionExpiredListeners = new Set<SessionExpiredListener>()

export class SessionAuthenticationError extends Error {
  readonly reason: 'missing-token' | 'expired-token' | 'unauthorized' | 'invalid-response'

  constructor(
    reason: SessionAuthenticationError['reason'],
    message: string,
  ) {
    super(message)
    this.name = 'SessionAuthenticationError'
    this.reason = reason
  }
}

export class SessionRefreshCancelledError extends Error {
  constructor() {
    super('刷新期间登录状态已经发生变化')
    this.name = 'SessionRefreshCancelledError'
  }
}

export function isSessionRefreshCancelledError(error: unknown): boolean {
  return error instanceof SessionRefreshCancelledError
}

export function isSessionAuthenticationError(error: unknown): boolean {
  if (error instanceof SessionAuthenticationError) return true

  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { code?: unknown } | undefined
    return error.response?.status === 401 || responseData?.code === 401
  }

  return false
}

export function subscribeSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListeners.add(listener)

  return () => {
    sessionExpiredListeners.delete(listener)
  }
}

export function notifySessionExpired(): void {
  sessionExpiredListeners.forEach(listener => listener())
}

async function performRefresh(): Promise<LoginData> {
  const token = store.getState().authSlice.token
  if (!token) {
    throw new SessionAuthenticationError('missing-token', '当前没有可用于刷新的 Token')
  }
  if (isTokenExpired(token)) {
    throw new SessionAuthenticationError('expired-token', 'Token 已过期，无法继续刷新')
  }

  const response = await refreshClient.post<ApiResponse<LoginData>>('/auth/refresh', undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const result = response.data

  if (result.code === 401) {
    throw new SessionAuthenticationError('unauthorized', result.message || '刷新 Token 失败')
  }
  if (result.code >= 500 && result.code < 600) {
    throw new Error(result.message || '刷新服务暂时不可用')
  }
  if (
    result.code !== 200
    || !result.data
    || typeof result.data.token !== 'string'
    || !result.data.user
  ) {
    throw new SessionAuthenticationError('invalid-response', '刷新接口返回的数据不完整')
  }

  // 用户可能在刷新请求进行期间主动退出或切换账号，迟到的响应不能覆盖新状态
  if (store.getState().authSlice.token !== token) {
    throw new SessionRefreshCancelledError()
  }

  store.dispatch(setInfo(result.data))
  return result.data
}

const runRefreshSingleFlight = createSingleFlight(performRefresh)

export function refreshSession(): Promise<LoginData> {
  return runRefreshSingleFlight()
}
