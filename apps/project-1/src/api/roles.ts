import request from '@/utils/request';
import type { ApiResponse, PaginatedData, RoleInfo, UserInfo } from '@/types';

export interface RoleCreateParams {
    name: string;
    code: string;
    description?: string;
}

export interface PermissionNode {
    id: number;
    name: string;
    label: string;
    parentId: number | null;
    type: 'menu' | 'button' | 'api';
    path: string | null;
    icon: string | null;
    sortOrder: number;
    children?: PermissionNode[];
}

export type RoleDetail = RoleInfo & {
    permissionIds?: number[];
    permissions?: Array<PermissionNode | { id?: number; permissionId?: number; permission?: PermissionNode }>;
    rolePermissions?: Array<{ permissionId?: number; permission?: PermissionNode }>;
};

export const extractPermissionIds = (role: RoleDetail): number[] | null => {
    if (Array.isArray(role.permissionIds)) {
        return role.permissionIds.filter((id): id is number => Number.isInteger(id));
    }

    const relations = role.permissions ?? role.rolePermissions;
    if (!Array.isArray(relations)) return null;

    const ids = relations
        .map((item) => {
            if ('permissionId' in item && Number.isInteger(item.permissionId)) return item.permissionId;
            if ('permission' in item && item.permission) return item.permission.id;
            return 'id' in item ? item.id : undefined;
        })
        .filter((id): id is number => Number.isInteger(id));
    return ids;
};

export const rolesService = {
    List(): Promise<ApiResponse<RoleInfo[]>> {
        return request.get('/roles');
    },

    Detail(id: number): Promise<ApiResponse<RoleDetail>> {
        return request.get(`/roles/${id}`);
    },

    Create(data: RoleCreateParams): Promise<ApiResponse<RoleInfo>> {
        return request.post('/roles', data);
    },

    Update(id: number, data: RoleCreateParams): Promise<ApiResponse<RoleInfo>> {
        return request.put(`/roles/${id}`, data);
    },

    Delete(id: number): Promise<ApiResponse<null>> {
        return request.delete(`/roles/${id}`);
    },

    Permissions(): Promise<ApiResponse<PermissionNode[]>> {
        return request.get('/permissions');
    },

    SetPermissions(id: number, permissionIds: number[]): Promise<ApiResponse<null>> {
        return request.put(`/roles/${id}/permissions`, { permissionIds });
    },

    UserCount(roleId: number): Promise<ApiResponse<PaginatedData<UserInfo>>> {
        return request.get('/users', { params: { roleId, page: 1, pageSize: 1 } });
    },
};
