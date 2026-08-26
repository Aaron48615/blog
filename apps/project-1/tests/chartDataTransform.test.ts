import assert from 'node:assert/strict';
import test from 'node:test';
import {
    RECORD_COUNT_FIELD,
    readChartTransformMetadata,
    stripChartTransformMetadata,
    transformChartRows,
    withChartTransformMetadata,
} from '../src/utils/chartDataTransform.ts';

test('城市 ID 按名称分组并统计记录数量', () => {
    const result = transformChartRows(
        [
            { city_id: 1 },
            { city_id: 1 },
            { city_id: 2 },
            { city_id: 3 },
        ],
        {
            xField: 'city_id',
            yField: RECORD_COUNT_FIELD,
            aggregation: 'count',
            xLabel: '城市名称',
            yLabel: '记录数量',
            xDisplay: 'cityName',
        },
        new Map([[1, '北京'], [2, '上海']]),
    );

    assert.deepEqual(result.categories, ['北京', '上海', '未知城市（ID: 3）']);
    assert.deepEqual(result.values, [2, 1, 1]);
    assert.deepEqual(result.missingCityIds, [3]);
    assert.equal(result.droppedInvalidValues, 0);
});

test('平均值聚合忽略无效数值并报告丢弃数量', () => {
    const result = transformChartRows(
        [
            { district: '朝阳区', aqi: 80 },
            { district: '朝阳区', aqi: '100' },
            { district: '朝阳区', aqi: '无数据' },
            { district: '海淀区', aqi: 60 },
        ],
        {
            xField: 'district',
            yField: 'aqi',
            aggregation: 'average',
            xLabel: '辖区',
            yLabel: 'AQI 空气质量',
        },
    );

    assert.deepEqual(result.categories, ['朝阳区', '海淀区']);
    assert.deepEqual(result.values, [90, 60]);
    assert.equal(result.droppedInvalidValues, 1);
});

test('时间字段固定按天分组后再求和', () => {
    const result = transformChartRows(
        [
            { recorded_at: '2026-08-24T01:10:00+08:00', traffic_flow: 100 },
            { recorded_at: '2026-08-24T19:30:00+08:00', traffic_flow: 250 },
            { recorded_at: '2026-08-25T09:00:00+08:00', traffic_flow: 80 },
        ],
        {
            xField: 'recorded_at',
            yField: 'traffic_flow',
            aggregation: 'sum',
            xLabel: '记录日期',
            yLabel: '车流量',
            timeGrain: 'day',
        },
    );

    assert.deepEqual(result.categories, ['2026-08-24', '2026-08-25']);
    assert.deepEqual(result.values, [350, 80]);
});

test('无效日期保留可识别的原值而不产生 Invalid Date', () => {
    const result = transformChartRows(
        [{ recorded_at: '时间待补录', traffic_flow: 12 }],
        {
            xField: 'recorded_at',
            yField: 'traffic_flow',
            aggregation: 'sum',
            xLabel: '记录日期',
            yLabel: '车流量',
            timeGrain: 'day',
        },
    );

    assert.deepEqual(result.categories, ['时间待补录']);
    assert.deepEqual(result.values, [12]);
});

test('最大值和最小值按分类计算', () => {
    const rows = [
        { city: '北京', temperature: 18 },
        { city: '北京', temperature: 31 },
        { city: '上海', temperature: 22 },
        { city: '上海', temperature: 28 },
    ];
    const baseConfig = {
        xField: 'city',
        yField: 'temperature',
        xLabel: '城市',
        yLabel: '气温',
    } as const;

    const maximum = transformChartRows(rows, { ...baseConfig, aggregation: 'max' });
    const minimum = transformChartRows(rows, { ...baseConfig, aggregation: 'min' });

    assert.deepEqual(maximum.values, [31, 28]);
    assert.deepEqual(minimum.values, [18, 22]);
});

test('不聚合时保留每条有效记录及其原始顺序', () => {
    const result = transformChartRows(
        [
            { city: '北京', population: 2154 },
            { city: '上海', population: '2489' },
            { city: '广州', population: null },
        ],
        {
            xField: 'city',
            yField: 'population',
            aggregation: 'none',
            xLabel: '城市',
            yLabel: '人口',
        },
    );

    assert.deepEqual(result.categories, ['北京', '上海']);
    assert.deepEqual(result.values, [2154, 2489]);
    assert.equal(result.droppedInvalidValues, 1);
});

test('Y 轴全部无效时返回空结果和丢弃数量', () => {
    const result = transformChartRows(
        [
            { city: '北京', aqi: null },
            { city: '上海', aqi: '无数据' },
        ],
        {
            xField: 'city',
            yField: 'aqi',
            aggregation: 'average',
            xLabel: '城市',
            yLabel: 'AQI',
        },
    );

    assert.deepEqual(result.categories, []);
    assert.deepEqual(result.values, []);
    assert.equal(result.droppedInvalidValues, 2);
});

test('先聚合全部记录再限制最多五十个分类', () => {
    const rows = [
        ...Array.from({ length: 60 }, () => ({ city: '重庆' })),
        ...Array.from({ length: 59 }, (_, index) => ({ city: `城市${index + 1}` })),
    ];
    const result = transformChartRows(rows, {
        xField: 'city',
        yField: RECORD_COUNT_FIELD,
        aggregation: 'count',
        xLabel: '城市',
        yLabel: '记录数量',
    });

    assert.equal(result.categories.length, 50);
    assert.equal(result.categories[0], '重庆');
    assert.equal(result.values[0], 60);
});

test('转换配置随图表快照保存且传给 ECharts 前会被剥离', () => {
    const config = {
        version: 1 as const,
        table: 'facilities',
        xField: 'city_id',
        yField: RECORD_COUNT_FIELD,
        queryYField: 'id',
        aggregation: 'count' as const,
        xLabel: '城市名称',
        yLabel: '记录数量',
        xDisplay: 'cityName' as const,
    };
    const stored = withChartTransformMetadata({ series: [{ type: 'bar' }] }, config);

    assert.deepEqual(readChartTransformMetadata(stored), config);
    assert.deepEqual(stripChartTransformMetadata(stored), { series: [{ type: 'bar' }] });
});
