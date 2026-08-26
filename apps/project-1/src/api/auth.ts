import request from '@/utils/request'
import type { LoginParams, CaptchaData, LoginData, ApiResponse, RegisterParams, UserInfo } from '@/types';

export const authService = {
    // 登录
    Login(data: LoginParams): Promise<ApiResponse<LoginData>> {
        return request.post('/auth/login', data, {
            skipAuth: true,
            skipAuthRefresh: true,
        })
    },
    // 获取验证码
    Captcha(): Promise<ApiResponse<CaptchaData>> {
        return request.get('/auth/captcha', {
            skipAuth: true,
            skipAuthRefresh: true,
        })
    },
    // 注册
    Register(data: RegisterParams): Promise<ApiResponse<UserInfo>> {
        return request.post('/auth/register', data, {
            skipAuth: true,
            skipAuthRefresh: true,
        })
    }
}
// 封装请求的方法和以前不同，这次是写在一个大对象里，调用就写authService.Xxx()
