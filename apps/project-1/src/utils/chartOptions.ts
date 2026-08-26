import type { EChartsOption } from 'echarts';
import type { ChartQueryResult, ChartType } from '@/api/charts';

interface ChartOptionInput {
    title: string;
    chartType: Exclude<ChartType, 'table'>;
    xField: string;
    yField: string;
    xLabel?: string;
    yLabel?: string;
    rows: Record<string, unknown>[];
    showTitle?: boolean;
}

const baseOption = (title: string, showTitle = true): EChartsOption => ({
    ...(showTitle ? {
        title: { text: title, left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } },
    } : {}),
    tooltip: { trigger: 'axis' },
    grid: { left: 32, right: 72, top: 64, bottom: 54, containLabel: true },
});

export function buildChartOption({
    title,
    chartType,
    xField,
    yField,
    xLabel = xField,
    yLabel = yField,
    rows,
    showTitle = true,
}: ChartOptionInput): EChartsOption {
    const normalized = rows
        .map((row) => ({ name: String(row[xField] ?? '-'), value: Number(row[yField]) }))
        .filter((item) => Number.isFinite(item.value))
        .slice(0, 50);

    if (chartType === 'pie') {
        return {
            ...(showTitle ? {
                title: { text: title, left: 'center', textStyle: { fontSize: 16, fontWeight: 600 } },
            } : {}),
            tooltip: { trigger: 'item' },
            legend: { type: 'scroll', bottom: 0 },
            series: [{
                name: yLabel,
                type: 'pie',
                radius: ['38%', '66%'],
                center: ['50%', '47%'],
                data: normalized,
                label: { formatter: '{b}: {d}%' },
            }],
        };
    }

    return {
        ...baseOption(title, showTitle),
        xAxis: {
            type: 'category',
            name: xLabel,
            data: normalized.map((item) => item.name),
            axisLabel: { rotate: normalized.length > 10 ? 28 : 0, hideOverlap: true },
        },
        yAxis: { type: 'value', name: yLabel },
        series: [{
            name: yLabel,
            type: chartType,
            smooth: chartType === 'line',
            symbolSize: chartType === 'scatter' ? 11 : undefined,
            data: normalized.map((item) => item.value),
            itemStyle: chartType === 'bar' ? { borderRadius: [4, 4, 0, 0] } : undefined,
        }],
    };
}

export function buildChartOptionFromQuery(
    title: string,
    chartType: ChartType,
    result: ChartQueryResult,
    showTitle = true,
): EChartsOption {
    if (chartType === 'pie') {
        const values = result.series[0]?.data ?? [];
        return buildChartOption({
            title,
            chartType,
            xField: 'name',
            yField: 'value',
            rows: result.xAxis.map((name, index) => ({ name, value: values[index] })),
            showTitle,
        });
    }

    const safeType = chartType === 'table' ? 'bar' : chartType;
    return {
        ...baseOption(title, showTitle),
        legend: { bottom: 0 },
        xAxis: { type: 'category', data: result.xAxis, axisLabel: { hideOverlap: true } },
        yAxis: { type: 'value' },
        series: result.series.map((series) => ({
            name: series.name,
            type: safeType,
            smooth: safeType === 'line',
            data: series.data,
        })),
    };
}

export function withoutChartTitle(option: EChartsOption): EChartsOption {
    const titlelessOption = { ...option };
    delete titlelessOption.title;
    return titlelessOption;
}
