import request from '@/utils/request'
import type { ApiResponse, PaginatedData } from '@/types';

export interface CityRecord {
    id: number;
    name: string;
    province?: string;
    population: number | string | null;
    area?: number | string | null;
    gdp?: number | string | null;
    lng?: number | string | null;
    lat?: number | string | null;
}

export interface EnvironmentRecord {
    id?: number;
    city_id?: number;
    aqi: number | string | null;
    pm25?: number | string | null;
    pm10?: number | string | null;
    weather?: string | null;
    temperature?: number | string | null;
    humidity?: number | string | null;
    noise?: number | string | null;
    recorded_at?: string | null;
    created_at?: string | null;
    timestamp?: string | null;
}

export const citiesService = {
    // 城市基础信息
    List(): Promise<ApiResponse<CityRecord[] | PaginatedData<CityRecord>>> {
        return request.get('/cities')
    },
    // 城市环境监测记录
    Environment(id: number): Promise<ApiResponse<EnvironmentRecord[] | PaginatedData<EnvironmentRecord>>> {
        return request.get(`/cities/${id}/environment`)
    },
    // 城市概览
    OverviewInfo(): Promise<ApiResponse> {
        return request.get('/cities/overview')
    },
    // 交通
    TrafficInfo(): Promise<ApiResponse> {
        return request.get('/cities/traffic-ranking')
    },
    // 按类型统计城市事件
    StatsInfo(): Promise<ApiResponse> {
        return request.get('/cities/event-stats')
    },
    // 城市事件列表
    EventsInfo(params: { page: number; pageSize: number }): Promise<ApiResponse> {
        return request.get('/cities/events', {params})
    },
    // 设施统计
    FacilityInfo(): Promise<ApiResponse> {
        return request.get('/cities/facility-stats')
    },
    // 导出城市
    CitiesExport(token: string): Promise<Blob> {
        return request.get('/export/cities', {
            params: { format: 'csv' },
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
    },
    // 导出事件
    EventsExport(token: string): Promise<Blob> {
        return request.get('/export/events', {
            params: { format: 'csv' },
            responseType: 'blob',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
    },
}
