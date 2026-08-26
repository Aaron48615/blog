import axios, { type InternalAxiosRequestConfig } from "axios";
import router from '@/router'
import store from '@/store'
import {
  isSessionRefreshCancelledError,
  notifySessionExpired,
  refreshSession,
} from '@/services/authSession'
import { canRetryAuthRequest } from '@/utils/authToken'

const instance = axios.create({
  baseURL: "/api",  // 这个/api就是新配置的代理路径前缀
  timeout: 10000,
});

// 添加请求拦截器
instance.interceptors.request.use(
  function (config) {
    // 在请求发送之前执行某些操作
    const token = store.getState().authSlice.token
    if (config.skipAuth || !token) {
      config.headers.delete('Authorization')
    } else {
      // 始终使用 Redux 中的最新 Token，避免业务层传入已经刷新的旧 Token
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    return config;
  },
  function (error) {
    // 处理请求错误
    return Promise.reject(error);
  }
);

async function retryAfterRefresh(
  config: InternalAxiosRequestConfig,
  originalError: unknown,
): Promise<unknown> {
  if (config.skipAuthRefresh) {
    return Promise.reject(originalError)
  }

  const token = store.getState().authSlice.token
  if (!token) {
    return Promise.reject(originalError)
  }

  if (!canRetryAuthRequest({
    skipAuthRefresh: config.skipAuthRefresh,
    authRetry: config.authRetry,
    token,
  })) {
    notifySessionExpired()
    return Promise.reject(originalError)
  }

  config.authRetry = true

  try {
    const refreshed = await refreshSession()
    config.headers.set('Authorization', `Bearer ${refreshed.token}`)
    return instance.request(config)
  } catch (error) {
    if (isSessionRefreshCancelledError(error) || !store.getState().authSlice.token) {
      return Promise.reject(originalError)
    }
    notifySessionExpired()
    return Promise.reject(originalError)
  }
}

// 添加响应拦截器
instance.interceptors.response.use(
  function (response) {
    // 状态码在 2xx 范围内的响应会触发此函数
    // 处理响应数据
    const data = response.data

    if (data?.code === 401) {
      return retryAfterRefresh(response.config, data)
    }

    // 兼容 HTTP 为 200，但业务状态码为 5xx 的情况
    if (data?.code >= 500 && data?.code < 600) {
      if (router.state.location.pathname !== '/500') {
        void router.navigate('/500', { replace: true })
      }

      return Promise.reject(data)
    }

    return response.data;
  },
  function (error) {
    // 状态码不在 2xx 范围内的响应会触发此函数
    // 处理响应错误
    const status = error.response?.status

    if (status === 401 && error.config) {
      return retryAfterRefresh(error.config, error)
    }

    // 处理 HTTP 5xx 服务端错误
    if (status >= 500 && status < 600) {
      if (router.state.location.pathname !== '/500') {
        void router.navigate('/500', { replace: true })
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
