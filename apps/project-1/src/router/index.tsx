import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import UseAuth from '../hooks/UseAuth.tsx'
import type { ComponentType, LazyExoticComponent } from 'react'

const ErrorPage = lazy(() => import('../pages/Error'))
const Forbidden = lazy(() => import('@/pages/Forbidden'))
const ServerError = lazy(() => import('@/pages/ServerError'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const Layouts = lazy(() => import('@/layout/Layout'))
const Dashboard = lazy(() => import('@/pages/Dashboard.tsx'))
const Dashboards = lazy(() => import('@/pages/Dashboards.tsx'))
const Chart = lazy(() => import('@/pages/Chart.tsx'))
const ChartEditor = lazy(() => import('@/pages/ChartEditor.tsx'))
const Map = lazy(() => import('@/pages/Map.tsx'))
const Scene = lazy(() => import('@/pages/Scene.tsx'))
const AI = lazy(() => import('@/pages/AI.tsx'))
const Users = lazy(() => import('@/pages/Users.tsx'))
const Roles = lazy(() => import('@/pages/Roles.tsx'))
const Profile = lazy(() => import('@/pages/Profile.tsx'))

const withSuspense = (Component: LazyExoticComponent<ComponentType>) => (
  <Suspense fallback={'loading...'}>
    <Component />
  </Suspense>
)


const routes = [
  {
    path: '/',
    element: (
      <UseAuth>
        {withSuspense(Layouts)}
      </UseAuth>
    ),
    errorElement: withSuspense(ServerError),
    children: [
      {
        index: true,
        element: (
          <UseAuth>
            {withSuspense(Dashboard)}
          </UseAuth>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <UseAuth>
            <Navigate to='/' />
          </UseAuth>
        ),
      },
      {
        path: 'dashboards',
        element: (
          <UseAuth>
            {withSuspense(Dashboards)}
          </UseAuth>
        ),
      },
      {
        path: 'chart',
        element: (
          <UseAuth>
            {withSuspense(Chart)}
          </UseAuth>
        ),
      },
      {
        path: 'chart/new',
        element: (
          <UseAuth>
            {withSuspense(ChartEditor)}
          </UseAuth>
        ),
      },
      {
        path: 'chart/add',
        element: (
          <UseAuth>
            {withSuspense(ChartEditor)}
          </UseAuth>
        ),
      },
      {
        path: 'chart/:id/edit',
        element: (
          <UseAuth>
            {withSuspense(ChartEditor)}
          </UseAuth>
        ),
      },
      {
        path: 'map',
        element: (
          <UseAuth>
            {withSuspense(Map)}
          </UseAuth>
        ),
      },
      {
        path: 'scene',
        element: (
          <UseAuth>
            {withSuspense(Scene)}
          </UseAuth>
        ),
      },
      {
        path: 'ai',
        element: (
          <UseAuth>
            {withSuspense(AI)}
          </UseAuth>
        ),
      },
      {
        path: 'users',
        element: (
          <UseAuth>
            {withSuspense(Users)}
          </UseAuth>
        ),
      },
      {
        path: 'system/user',
        element: <Navigate to="/users" replace />,
      },
      {
        path: 'roles',
        element: (
          <UseAuth>
            {withSuspense(Roles)}
          </UseAuth>
        ),
      },
      {
        path: 'system/role',
        element: <Navigate to="/roles" replace />,
      },
      {
        path: 'profile',
        element: (
          <UseAuth>
            {withSuspense(Profile)}
          </UseAuth>
        ),
      },
    ]
  },
  {
    path: '/login',
    element: (
      <UseAuth>
        {withSuspense(Login)}
      </UseAuth>
    ),
  },
  {
    path: '/register',
    element: withSuspense(Register),
  },
  {
    path: '/403',
    element: withSuspense(Forbidden),
  },
  {
    path: '/404',
    element: withSuspense(ErrorPage),
  },
  {
    path: '/500',
    element: withSuspense(ServerError),
  },
  {
    path: '*',
    element: withSuspense(ErrorPage),
  },
]

const router = createBrowserRouter(routes)

export default router
