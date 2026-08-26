import request from '@/utils/request';
import type { ApiResponse, PaginatedData } from '@/types';

export interface DataSourceRecord {
    id: number;
    name: string;
    type: string;
    status: number;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DataTableRecord {
    tableName?: string;
    name?: string;
    estimatedRows?: number;
}

export interface DataFieldRecord {
    columnName?: string;
    name?: string;
    dataType?: string;
    type?: string;
}

export interface DataSourceQueryResult {
    columns: Array<{ columnName: string; dataType: string }>;
    rows: Record<string, unknown>[];
    total: number;
    sql?: string;
}

export const datasourcesService = {
    List(params: { page?: number; pageSize?: number; keyword?: string } = {}): Promise<ApiResponse<PaginatedData<DataSourceRecord>>> {
        return request.get('/datasources', { params });
    },

    Tables(id: number): Promise<ApiResponse<DataTableRecord[]>> {
        return request.get(`/datasources/${id}/tables`);
    },

    Fields(id: number, table: string): Promise<ApiResponse<DataFieldRecord[]>> {
        return request.get(`/datasources/${id}/tables/${table}/fields`);
    },

    Query(id: number, data: { table: string; xField: string; yField: string }): Promise<ApiResponse<DataSourceQueryResult>> {
        return request.post(`/datasources/${id}/query`, data);
    },
};
