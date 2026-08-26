import request from '@/utils/request';
import type { ApiResponse } from '@/types';

export type DashboardThemeValue = 'light' | 'dark';

export interface DashboardChart {
    id: number;
    dashboardId: number;
    title: string;
    chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'table' | string;
    datasourceId?: number | null;
    queryConfig?: Record<string, unknown> | null;
    chartConfig: Record<string, unknown> | null;
    position?: Record<string, unknown> | null;
    sortOrder?: number;
}

export interface DashboardData {
    id: number;
    title: string;
    description: string | null;
    layout: Array<Record<string, unknown>> | null;
    isPublic: number;
    bgTheme: DashboardThemeValue;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
    creator?: {
        id: number;
        username: string;
    };
    _count?: {
        charts: number;
    };
}

export interface DashboardDetailData extends DashboardData {
    charts: DashboardChart[];
    mapLayers?: Array<Record<string, unknown>>;
}

export interface DashboardListData {
    list: DashboardData[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DashboardListParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
}

export interface DashboardSaveParams {
    title: string;
    description?: string;
    layout?: Array<Record<string, unknown>>;
    bgTheme?: DashboardThemeValue;
}

const authHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
});

export const dashboardsService = {
    // 只读：分页获取仪表盘列表
    DashboardList(params: DashboardListParams, token: string): Promise<ApiResponse<DashboardListData>> {
        return request.get('/dashboards', {
            params,
            headers: authHeaders(token),
        });
    },

    // 创建仪表盘
    DashboardCreate(data: DashboardSaveParams, token: string): Promise<ApiResponse<DashboardData>> {
        return request.post('/dashboards', data, {
            headers: authHeaders(token),
        });
    },

    // 只读：获取仪表盘详情及其图表列表
    DashboardDetail(id: number, token: string): Promise<ApiResponse<DashboardDetailData>> {
        return request.get(`/dashboards/${id}`, {
            headers: authHeaders(token),
        });
    },

    // 更新仪表盘
    DashboardUpdate(
        id: number,
        data: DashboardSaveParams,
        token: string,
    ): Promise<ApiResponse<DashboardDetailData>> {
        return request.put(`/dashboards/${id}`, data, {
            headers: authHeaders(token),
        });
    },

    // 删除仪表盘
    DashboardDelete(id: number, token: string): Promise<ApiResponse> {
        return request.delete(`/dashboards/${id}`, {
            headers: authHeaders(token),
        });
    },

    // 克隆仪表盘及其关联图表、地图图层
    DashboardClone(id: number, token: string): Promise<ApiResponse<DashboardDetailData>> {
        return request.post(`/dashboards/${id}/clone`, undefined, {
            headers: authHeaders(token),
        });
    },
};
