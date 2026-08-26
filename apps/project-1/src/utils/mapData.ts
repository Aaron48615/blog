import type { CityRecord, EnvironmentRecord } from '@/api/cities';
import type { PaginatedData } from '@/types';

export interface MapCity {
    id: number;
    name: string;
    province: string;
    population: number;
    area: number;
    gdp: number;
    lng: number;
    lat: number;
}

export interface MapEnvironment {
    aqi: number;
    pm25: number | null;
    weather: string;
}

export interface AqiMeta {
    color: string;
    label: '优' | '良' | '轻度污染' | '污染';
    radius: number;
}

const isPaginatedData = <T>(data: T[] | PaginatedData<T>): data is PaginatedData<T> => (
    !Array.isArray(data) && Array.isArray(data.list)
);

const finiteNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

export const unwrapMapRows = <T>(data: T[] | PaginatedData<T>): T[] => (
    Array.isArray(data) ? data : isPaginatedData(data) ? data.list : []
);

export function normalizeMapCities(data: CityRecord[] | PaginatedData<CityRecord>): MapCity[] {
    return unwrapMapRows(data)
        .map((city) => {
            const id = finiteNumber(city.id);
            const population = finiteNumber(city.population);
            const area = finiteNumber(city.area);
            const gdp = finiteNumber(city.gdp);
            const lng = finiteNumber(city.lng);
            const lat = finiteNumber(city.lat);

            return {
                id,
                name: String(city.name ?? '').trim(),
                province: String(city.province ?? '').trim() || '未提供',
                population: population ?? 0,
                area: area ?? 0,
                gdp: gdp ?? 0,
                lng,
                lat,
            };
        })
        .filter((city): city is MapCity => (
            city.id !== null
            && Number.isInteger(city.id)
            && city.id > 0
            && city.name.length > 0
            && city.lng !== null
            && city.lat !== null
            && city.lng >= -180
            && city.lng <= 180
            && city.lat >= -90
            && city.lat <= 90
        ));
}

const recordTime = (record: EnvironmentRecord) => {
    const rawTime = record.recorded_at ?? record.created_at ?? record.timestamp;
    if (!rawTime) return Number.NEGATIVE_INFINITY;
    const timestamp = new Date(rawTime).getTime();
    return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
};

export function normalizeLatestEnvironment(
    data: EnvironmentRecord[] | PaginatedData<EnvironmentRecord>,
): MapEnvironment | null {
    const validRecords = unwrapMapRows(data)
        .map((record, index) => ({ record, index, time: recordTime(record) }))
        .filter(({ record }) => {
            const aqi = finiteNumber(record.aqi);
            return aqi !== null && aqi >= 0;
        })
        .sort((first, second) => (
            second.time === first.time ? first.index - second.index : second.time - first.time
        ));

    const latest = validRecords[0]?.record;
    if (!latest) return null;

    return {
        aqi: finiteNumber(latest.aqi) ?? 0,
        pm25: finiteNumber(latest.pm25),
        weather: String(latest.weather ?? '').trim() || '暂无数据',
    };
}

export function getAqiMeta(aqi: number): AqiMeta {
    const safeAqi = Number.isFinite(aqi) ? Math.max(0, aqi) : 0;
    const radius = Math.min(30_000, Math.max(5_000, safeAqi * 100));

    if (safeAqi <= 50) return { color: '#52c41a', label: '优', radius };
    if (safeAqi <= 100) return { color: '#fadb14', label: '良', radius };
    if (safeAqi <= 150) return { color: '#fa8c16', label: '轻度污染', radius };
    return { color: '#ff4d4f', label: '污染', radius };
}

export function calculateCityStats(cities: readonly MapCity[]) {
    return cities.reduce((stats, city) => ({
        cityCount: stats.cityCount + 1,
        totalPopulation: stats.totalPopulation + city.population,
        totalGdp: stats.totalGdp + city.gdp,
    }), {
        cityCount: 0,
        totalPopulation: 0,
        totalGdp: 0,
    });
}

export function calculateEnvironmentStats(environments: readonly MapEnvironment[]) {
    const totalAqi = environments.reduce((total, environment) => total + environment.aqi, 0);
    return {
        monitoredCount: environments.length,
        averageAqi: environments.length ? Math.round(totalAqi / environments.length) : null,
        excellentCount: environments.filter((environment) => environment.aqi <= 50).length,
        pollutedCount: environments.filter((environment) => environment.aqi > 150).length,
    };
}
