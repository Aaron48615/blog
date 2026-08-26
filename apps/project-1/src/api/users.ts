import request from '@/utils/request'
import type { ApiResponse, PaginatedData, RoleInfo, UserInfo } from '@/types'

export interface UserListParams {
    page: number
    pageSize: number
    username?: string
    status?: number
    roleId?: number
}

export interface CreateUserParams {
    username: string
    password: string
    roleId: number
    email?: string
    avatar?: string
}

export interface UpdateUserParams {
    username?: string
    email?: string
    avatar?: string
    roleId?: number
    password?: string
}

export interface UploadAvatarResult {
    url: string
    filename: string
}

export const usersService = {
    List(params: UserListParams): Promise<ApiResponse<PaginatedData<UserInfo>>> {
        return request.get('/users', { params })
    },

    Detail(id: number): Promise<ApiResponse<UserInfo>> {
        return request.get(`/users/${id}`)
    },

    Create(data: CreateUserParams): Promise<ApiResponse<UserInfo>> {
        return request.post('/users', data)
    },

    // 修改当前用户资料或密码
    UpdateUser(id: number, data: UpdateUserParams, token?: string | null): Promise<ApiResponse<UserInfo>> {
        return request.put(`/users/${id}`, data, {
            headers: token ? {
                Authorization: `Bearer ${token}`,
            } : undefined,
        })
    },

    ToggleStatus(id: number, status: number): Promise<ApiResponse<null>> {
        return request.patch(`/users/${id}/status`, { status })
    },

    ResetPassword(id: number): Promise<ApiResponse<{ newPassword: string }>> {
        return request.put(`/users/${id}/password`)
    },

    Delete(id: number): Promise<ApiResponse<null>> {
        return request.delete(`/users/${id}`)
    },

    CheckUsername(username: string): Promise<ApiResponse<{ exists: boolean }>> {
        return request.get('/users/check-username', { params: { username } })
    },

    Roles(): Promise<ApiResponse<RoleInfo[]>> {
        return request.get('/roles')
    },

    UploadAvatar(file: File): Promise<ApiResponse<UploadAvatarResult>> {
        const formData = new FormData()
        formData.append('file', file)
        return request.post('/upload/avatar', formData)
    },
}
