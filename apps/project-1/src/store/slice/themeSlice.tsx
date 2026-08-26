import { createSlice } from "@reduxjs/toolkit";

type ThemeMode = 'light' | 'dark'

const themeSlice = createSlice({
    name: 'themeSlice',
    initialState: {
        mode: 'light' as ThemeMode
    },
    reducers: {
        setTheme(state, {payload}:{payload: ThemeMode}){
            state.mode = payload
        }
    }
})

export default themeSlice.reducer;
export const { setTheme } = themeSlice.actions;