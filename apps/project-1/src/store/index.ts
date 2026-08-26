import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore,} from 'redux-persist'
import storage from 'redux-persist/es/storage'
// import userSlice from './slice/userSlice'
import authSlice from './slice/authSlice'
import themeSlice from './slice/themeSlice'

const rootReducer = combineReducers({
  authSlice,
  themeSlice
})

const persistConfig = {
  key: 'reduxPersist',
  storage,
}

const persisteds = persistReducer(persistConfig, rootReducer)

const store = configureStore({
  reducer: persisteds,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch
export default store
export const persistor = persistStore(store)
export type AppDispatch = typeof store.dispatch;