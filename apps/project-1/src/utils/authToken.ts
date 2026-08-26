export const AUTH_REFRESH_LEAD_MS = 30_000
export const AUTH_REFRESH_RETRY_MS = 5_000

export interface AuthRetryState {
  skipAuthRefresh?: boolean
  authRetry?: boolean
  token: string | null
  now?: number
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const paddingLength = (4 - (normalized.length % 4)) % 4
  const binary = atob(normalized.padEnd(normalized.length + paddingLength, '='))
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export function getTokenExpiryMs(token: string): number | null {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null

    const payload = JSON.parse(decodeBase64Url(payloadPart)) as { exp?: unknown }
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null

    return payload.exp * 1000
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiresAt = getTokenExpiryMs(token)

  return expiresAt === null || now >= expiresAt
}

export function getTokenRefreshDelay(
  token: string,
  now = Date.now(),
  leadMs = AUTH_REFRESH_LEAD_MS,
): number | null {
  const expiresAt = getTokenExpiryMs(token)
  if (expiresAt === null) return null

  return Math.max(0, expiresAt - now - leadMs)
}

export function canRetryAuthRequest({
  skipAuthRefresh,
  authRetry,
  token,
  now = Date.now(),
}: AuthRetryState): boolean {
  return !skipAuthRefresh && !authRetry && Boolean(token) && !isTokenExpired(token!, now)
}

export function createSingleFlight<T>(operation: () => Promise<T>): () => Promise<T> {
  let activePromise: Promise<T> | null = null

  return () => {
    if (!activePromise) {
      activePromise = operation().finally(() => {
        activePromise = null
      })
    }

    return activePromise
  }
}
