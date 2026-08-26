import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { LoginData, UserInfo } from '@/types';

interface AuthState {
    token: string | null;
    user: UserInfo | null;
}

const initialState: AuthState = {
    token: null,
    user: null,
};

const authSlice = createSlice({
    name: 'authSlice',
    initialState,
    reducers: {
        setInfo(state, { payload }: PayloadAction<LoginData>) {
            state.token = payload.token;
            state.user = payload.user;
        },
        logout(state) {
            state.token = null;
            state.user = null
        }
    }
})

export default authSlice.reducer;
export const { setInfo, logout } = authSlice.actions;
