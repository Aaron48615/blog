import { useCallback, useEffect, useRef } from 'react'
import { Modal } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import router from '@/router'
import store, { type AppDispatch, type RootState } from '@/store'
import { logout } from '@/store/slice/authSlice'
import {
  isSessionAuthenticationError,
  notifySessionExpired,
  refreshSession,
  subscribeSessionExpired,
} from '@/services/authSession'
import {
  AUTH_REFRESH_RETRY_MS,
  getTokenExpiryMs,
  getTokenRefreshDelay,
} from '@/utils/authToken'

const AUTH_PAGES = ['/login', '/register']

function SessionManager() {
  const token = useSelector((state: RootState) => state.authSlice.token)
  const dispatch = useDispatch<AppDispatch>()
  const [modal, contextHolder] = Modal.useModal()
  const modalOpenRef = useRef(false)

  const handleSessionExpired = useCallback(() => {
    const currentPath = router.state.location.pathname

    if (AUTH_PAGES.includes(currentPath)) {
      dispatch(logout())
      return
    }
    if (modalOpenRef.current) return

    modalOpenRef.current = true
    modal.confirm({
      title: '登录状态已过期',
      content: '当前登录状态已失效，请重新登录后继续操作。',
      okText: '重新登录',
      cancelButtonProps: { style: { display: 'none' } },
      closable: false,
      keyboard: false,
      maskClosable: false,
      onOk: async () => {
        dispatch(logout())
        modalOpenRef.current = false
        if (router.state.location.pathname !== '/login') {
          await router.navigate('/login', { replace: true })
        }
      },
    })
  }, [dispatch, modal])

  useEffect(() => subscribeSessionExpired(handleSessionExpired), [handleSessionExpired])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const scheduleRefresh = (delay: number) => {
      clearTimer()
      timer = setTimeout(() => {
        void runRefresh()
      }, delay)
    }

    const runRefresh = async () => {
      try {
        const refreshed = await refreshSession()
        if (!cancelled && refreshed.token === token) {
          scheduleRefresh(getTokenRefreshDelay(refreshed.token) ?? 0)
        }
      } catch (error) {
        if (cancelled) return
        if (isSessionAuthenticationError(error)) {
          notifySessionExpired()
          return
        }

        const currentToken = store.getState().authSlice.token
        const expiresAt = currentToken ? getTokenExpiryMs(currentToken) : null
        const remainingMs = expiresAt === null ? 0 : expiresAt - Date.now()

        if (!currentToken || remainingMs <= 0) {
          notifySessionExpired()
          return
        }

        scheduleRefresh(Math.min(AUTH_REFRESH_RETRY_MS, remainingMs))
      }
    }

    if (token) {
      const expiresAt = getTokenExpiryMs(token)
      if (expiresAt === null || expiresAt <= Date.now()) {
        notifySessionExpired()
      } else {
        scheduleRefresh(getTokenRefreshDelay(token) ?? 0)
      }
    }

    return () => {
      cancelled = true
      clearTimer()
    }
  }, [token])

  return contextHolder
}

export default SessionManager
