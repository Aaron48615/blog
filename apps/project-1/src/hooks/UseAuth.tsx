import type { ReactNode } from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import type { RootState } from '@/store'
import { isTokenExpired } from '@/utils/authToken'

const whiteList = ['/login', '/register']
// 路由守卫组件：校验JWT（JSONWebToken）是否存在过期
function UseAuth({ children }: { children: ReactNode }) {
  const { token } = useSelector((state: RootState) => state.authSlice)
  const location = useLocation()

  // 对于白名单页面，已经登录存在token，重定向到首页；如果没有登录，再正常渲染登录页面
  if (whiteList.includes(location.pathname)) {
    if (token && !isTokenExpired(token)) {
      return <Navigate to="/"></Navigate>
    }
    return children
  }

  // 对于非白名单页面，没有token时会重定向到登录页
  if (!token) {
    return <Navigate to="/login"></Navigate>
  }

  // Token 已过期时先阻止受保护页面渲染，由全局会话管理器弹窗提示重新登录
  if (isTokenExpired(token)) {
    return <Spin fullscreen tip="正在检查登录状态..." />
  }

  return children
}

export default UseAuth
