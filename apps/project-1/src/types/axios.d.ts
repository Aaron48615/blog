import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean
    skipAuthRefresh?: boolean
    authRetry?: boolean
  }
}
