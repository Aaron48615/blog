import assert from 'node:assert/strict';
import test from 'node:test';
import {
    calculateCityStats,
    calculateEnvironmentStats,
    getAqiMeta,
    normalizeLatestEnvironment,
    normalizeMapCities,
} from '../src/utils/mapData.ts';

test('城市数组与分页响应都能解包，并过滤无效坐标', () => {
    const cities = normalizeMapCities({
        list: [
            { id: 1, name: '北京', province: '北京', population: '2189', area: 16410, gdp: '43760', lng: '116.4', lat: 39.9 },
            { id: 2, name: '坐标错误', population: 100, lng: 300, lat: 40 },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
    });

    assert.equal(cities.length, 1);
    assert.equal(cities[0].name, '北京');
    assert.equal(cities[0].population, 2189);
});

test('城市统计直接使用人口“万”和 GDP“亿元”的原始单位', () => {
    const cities = normalizeMapCities([
        { id: 1, name: '北京', population: 2189, gdp: 43760, lng: 116.4, lat: 39.9 },
        { id: 2, name: '上海', population: 2487, gdp: 47218, lng: 121.5, lat: 31.2 },
    ]);

    assert.deepEqual(calculateCityStats(cities), {
        cityCount: 2,
        totalPopulation: 4676,
        totalGdp: 90978,
    });
});

test('环境响应优先选择记录时间最新的一条', () => {
    const environment = normalizeLatestEnvironment([
        { aqi: 120, pm25: 72, weather: '阴', recorded_at: '2026-08-24T08:00:00+08:00' },
        { aqi: '48', pm25: '22', weather: '晴', recorded_at: '2026-08-25T08:00:00+08:00' },
    ]);

    assert.deepEqual(environment, { aqi: 48, pm25: 22, weather: '晴' });
});

test('AQI 边界、颜色和圆半径遵守统一规则', () => {
    assert.equal(getAqiMeta(50).label, '优');
    assert.equal(getAqiMeta(100).label, '良');
    assert.equal(getAqiMeta(150).label, '轻度污染');
    assert.equal(getAqiMeta(151).label, '污染');
    assert.equal(getAqiMeta(1).radius, 5_000);
    assert.equal(getAqiMeta(999).radius, 30_000);
});

test('环境统计在空数据时不产生 NaN，污染城市统一按大于 150 计算', () => {
    assert.deepEqual(calculateEnvironmentStats([]), {
        monitoredCount: 0,
        averageAqi: null,
        excellentCount: 0,
        pollutedCount: 0,
    });

    assert.deepEqual(calculateEnvironmentStats([
        { aqi: 50, pm25: 10, weather: '晴' },
        { aqi: 150, pm25: 80, weather: '阴' },
        { aqi: 151, pm25: 90, weather: '霾' },
    ]), {
        monitoredCount: 3,
        averageAqi: 117,
        excellentCount: 1,
        pollutedCount: 1,
    });
});
