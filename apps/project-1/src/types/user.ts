export interface LoginParams {
    username: string,
    password: string,
    captchaId: string,
    captchaCode: string
}

export interface CaptchaData {
    captchaId: string,
    svg: string
}

export interface RoleInfo {
    id: number,
    name: string,
    code: string,
    description: string | null,
    status: number,
    createdAt: string,
    updatedAt: string
}

export interface UserInfo {
    id: number,
    username: string,
    email: string | null,
    avatar: string | null,
    status: number,
    roleId: number,
    role: RoleInfo,
    lastLogin: string | null,
    createdAt: string,
    updatedAt: string
}

export interface LoginData {
    token: string,
    user: UserInfo
}

export interface RegisterParams {
    username: string,
    email: string | undefined,
    password: string,
    captchaId: string,
    captchaCode: string
}