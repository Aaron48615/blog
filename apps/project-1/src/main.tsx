import './config/amap.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { Provider, useSelector } from 'react-redux'
import store, { persistor } from './store'
import type { RootState } from './store'
import { PersistGate } from 'redux-persist/integration/react'
import './index.css'
import { Spin, ConfigProvider, theme as antdTheme } from 'antd'
import SessionManager from '@/components/SessionManager'

function ThemeRoot() {
  const {mode} = useSelector((s: RootState) => s.themeSlice)

  return (
    <ConfigProvider
      theme={{
        algorithm:
          mode === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <SessionManager />
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<Spin />} persistor={persistor}>
        <ThemeRoot />
      </PersistGate>
    </Provider>
  </StrictMode>,
)
