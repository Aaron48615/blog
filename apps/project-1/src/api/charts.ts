import request from '@/utils/request'
import type { ApiResponse } from '@/types'

export type ChartType = 'bar' | 'pie' | 'line' | 'scatter' | 'table'

export interface ChartRecord {
    id: number
    dashboardId: number
    title: string
    chartType: ChartType
    datasourceId: number | null
    queryConfig: Record<string, unknown> | null
    chartConfig: Record<string, unknown> | null
    position: ChartPosition | null
    sortOrder: number
    createdAt: string
    updatedAt: string
    dashboard?: {
        id: number
        title: string
    }
    datasource?: {
        id: number
        name: string
        type: string
    } | null
}

export interface DashboardOptionRecord {
    id: number
    title: string
}

export interface PaginatedData<T> {
    list: T[]
    total: number
    page: number
    pageSize: number
}

export interface ChartListParams {
    page: number
    pageSize: number
    dashboardId?: number
    chartType?: ChartType
    keyword?: string
}

export interface ChartPosition {
    x: number
    y: number
    w: number
    h: number
}

export interface ChartCreateParams {
    dashboardId: number
    title: string
    chartType: ChartType
    datasourceId?: number | null
    queryConfig?: Record<string, unknown>
    chartConfig?: Record<string, unknown>
    position?: ChartPosition
    sortOrder?: number
}

// 接口文档中更新请求与创建请求共用 ChartCreate 结构
export type ChartUpdateParams = ChartCreateParams

export interface ChartQueryParams {
    startDate?: string
    endDate?: string
}

export interface ChartQuerySeries {
    name: string
    data: number[]
}

export interface ChartQueryResult {
    xAxis: string[]
    series: ChartQuerySeries[]
    raw: Record<string, unknown>[]
    total: number
    detectedFields: {
        x: string
        y: string
    }
}

export type ChartPreviewOption = Record<string, unknown>

const getAuthHeaders = (token: string | null) => token
    ? { Authorization: `Bearer ${token}` }
    : undefined

export const chartsService = {
    // 图表管理列表：只读 GET 请求
    List(params: ChartListParams, token: string | null): Promise<ApiResponse<PaginatedData<ChartRecord>>> {
        return request.get('/charts', {
            params,
            headers: getAuthHeaders(token),
        })
    },

    // 仪表盘筛选项：只读 GET 请求
    DashboardList(token: string | null): Promise<ApiResponse<PaginatedData<DashboardOptionRecord>>> {
        return request.get('/dashboards', {
            params: { page: 1, pageSize: 100 },
            headers: getAuthHeaders(token),
        })
    },

    // 创建图表
    Create(data: ChartCreateParams, token: string | null): Promise<ApiResponse<ChartRecord>> {
        return request.post('/charts', data, {
            headers: getAuthHeaders(token),
        })
    },

    // 获取图表详情
    Detail(id: number, token: string | null): Promise<ApiResponse<ChartRecord>> {
        return request.get(`/charts/${id}`, {
            headers: getAuthHeaders(token),
        })
    },

    // 更新图表
    Update(id: number, data: ChartUpdateParams, token: string | null): Promise<ApiResponse<ChartRecord>> {
        return request.put(`/charts/${id}`, data, {
            headers: getAuthHeaders(token),
        })
    },

    // 删除图表
    Delete(id: number, token: string | null): Promise<ApiResponse<null>> {
        return request.delete(`/charts/${id}`, {
            headers: getAuthHeaders(token),
        })
    },

    // 执行图表数据查询，后端只允许 SELECT
    Query(id: number, data: ChartQueryParams = {}, token: string | null): Promise<ApiResponse<ChartQueryResult>> {
        return request.post(`/charts/${id}/query`, data, {
            headers: getAuthHeaders(token),
        })
    },

    // 文档声明该接口仅执行 SELECT 查询，不创建或修改后端数据
    Preview(id: number, token: string | null): Promise<ApiResponse<ChartPreviewOption>> {
        return request.post(`/charts/${id}/preview`, undefined, {
            headers: getAuthHeaders(token),
        })
    },
}
