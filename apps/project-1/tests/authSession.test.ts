import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import test from 'node:test'
import {
  AUTH_REFRESH_LEAD_MS,
  canRetryAuthRequest,
  createSingleFlight,
  getTokenExpiryMs,
  getTokenRefreshDelay,
  isTokenExpired,
} from '../src/utils/authToken.ts'

function createToken(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64url')

  return `header.${encoded}.signature`
}

test('能够解析 Base64URL JWT 的 exp，并支持中文载荷', () => {
  const token = createToken({ exp: 2_000_000_000, name: '测试用户' })

  assert.equal(getTokenExpiryMs(token), 2_000_000_000_000)
})

test('缺少 exp、格式错误和非数字 exp 都视为无效 Token', () => {
  assert.equal(getTokenExpiryMs(createToken({ name: 'test' })), null)
  assert.equal(getTokenExpiryMs(createToken({ exp: '123' })), null)
  assert.equal(getTokenExpiryMs('invalid-token'), null)
  assert.equal(getTokenExpiryMs('header.%%%.signature'), null)
})

test('只按照真实过期时间判断，不再提前 20 秒判定过期', () => {
  const now = 1_000_000
  const token = createToken({ exp: (now + 20_000) / 1000 })

  assert.equal(isTokenExpired(token, now), false)
  assert.equal(isTokenExpired(token, now + 20_000), true)
})

test('Token 距离过期 60 秒时，30 秒后触发刷新', () => {
  const now = 1_000_000
  const token = createToken({ exp: (now + 60_000) / 1000 })

  assert.equal(getTokenRefreshDelay(token, now), AUTH_REFRESH_LEAD_MS)
})

test('Token 距离过期不足 30 秒时立即刷新', () => {
  const now = 1_000_000
  const token = createToken({ exp: (now + 10_000) / 1000 })

  assert.equal(getTokenRefreshDelay(token, now), 0)
})

test('并发刷新调用共享同一个进行中的 Promise', async () => {
  let calls = 0
  let finish: ((value: string) => void) | undefined
  const operation = () => {
    calls += 1
    return new Promise<string>(resolve => {
      finish = resolve
    })
  }
  const singleFlight = createSingleFlight(operation)
  const first = singleFlight()
  const second = singleFlight()

  assert.strictEqual(first, second)
  assert.equal(calls, 1)
  finish?.('new-token')
  assert.deepEqual(await Promise.all([first, second]), ['new-token', 'new-token'])
})

test('刷新失败后释放并发锁，后续调用可以重新执行', async () => {
  let calls = 0
  const singleFlight = createSingleFlight(async () => {
    calls += 1
    if (calls === 1) throw new Error('temporary failure')
    return 'success'
  })

  await assert.rejects(singleFlight(), /temporary failure/)
  assert.equal(await singleFlight(), 'success')
  assert.equal(calls, 2)
})

test('鉴权请求只有在 Token 有效且尚未重试时允许刷新', () => {
  const now = 1_000_000
  const validToken = createToken({ exp: (now + 60_000) / 1000 })
  const expiredToken = createToken({ exp: (now - 1_000) / 1000 })

  assert.equal(canRetryAuthRequest({ token: validToken, now }), true)
  assert.equal(canRetryAuthRequest({ token: validToken, now, authRetry: true }), false)
  assert.equal(canRetryAuthRequest({ token: validToken, now, skipAuthRefresh: true }), false)
  assert.equal(canRetryAuthRequest({ token: expiredToken, now }), false)
  assert.equal(canRetryAuthRequest({ token: null, now }), false)
})
