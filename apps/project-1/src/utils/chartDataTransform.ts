export const RECORD_COUNT_FIELD = '__record_count__';
export const CHART_TRANSFORM_METADATA_KEY = '__dataPilotTransform';

export type ChartAggregation = 'none' | 'count' | 'sum' | 'average' | 'max' | 'min';
export type ChartXDisplay = 'cityName';

export interface ChartTransformConfig {
    xField: string;
    yField: string;
    aggregation: ChartAggregation;
    xLabel: string;
    yLabel: string;
    xDisplay?: ChartXDisplay;
    timeGrain?: 'day';
}

export interface StoredChartTransformConfig extends ChartTransformConfig {
    version: 1;
    table: string;
    queryYField: string;
}

export interface ChartTransformResult {
    categories: string[];
    values: number[];
    missingCityIds: Array<number | string>;
    droppedInvalidValues: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isAggregation = (value: unknown): value is ChartAggregation => (
    value === 'none'
    || value === 'count'
    || value === 'sum'
    || value === 'average'
    || value === 'max'
    || value === 'min'
);

export function withChartTransformMetadata(
    option: Record<string, unknown>,
    config: StoredChartTransformConfig,
): Record<string, unknown> {
    return { ...option, [CHART_TRANSFORM_METADATA_KEY]: config };
}

export function readChartTransformMetadata(
    option: Record<string, unknown> | null | undefined,
): StoredChartTransformConfig | null {
    const metadata = option?.[CHART_TRANSFORM_METADATA_KEY];
    if (!isRecord(metadata) || metadata.version !== 1 || !isAggregation(metadata.aggregation)) return null;
    if (
        typeof metadata.table !== 'string'
        || typeof metadata.xField !== 'string'
        || typeof metadata.yField !== 'string'
        || typeof metadata.queryYField !== 'string'
        || typeof metadata.xLabel !== 'string'
        || typeof metadata.yLabel !== 'string'
    ) return null;
    if (metadata.xDisplay !== undefined && metadata.xDisplay !== 'cityName') return null;
    if (metadata.timeGrain !== undefined && metadata.timeGrain !== 'day') return null;
    return metadata as unknown as StoredChartTransformConfig;
}

export function stripChartTransformMetadata(
    option: Record<string, unknown>,
): Record<string, unknown> {
    const cleanOption = { ...option };
    delete cleanOption[CHART_TRANSFORM_METADATA_KEY];
    return cleanOption;
}

const cityKey = (value: unknown) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : String(value ?? '');
};

const dayLabel = (value: unknown) => {
    if (typeof value === 'string') {
        const matched = value.match(/^\d{4}-\d{2}-\d{2}/);
        if (matched) return matched[0];
    }

    const date = new Date(String(value ?? ''));
    if (Number.isNaN(date.getTime())) return String(value ?? '-');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const numericValueOf = (value: unknown) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

export function transformChartRows(
    rows: Record<string, unknown>[],
    config: ChartTransformConfig,
    cityNames: ReadonlyMap<number | string, string> = new Map(),
    limit = 50,
): ChartTransformResult {
    const aggregates = new Map<string, { count: number; sum: number; max: number; min: number }>();
    const missingCityIds: Array<number | string> = [];
    const rawCategories: string[] = [];
    const rawValues: number[] = [];
    let droppedInvalidValues = 0;

    rows.forEach((row) => {
        const rawX = row[config.xField];
        let category = String(rawX ?? '-');

        if (config.timeGrain === 'day') {
            category = dayLabel(rawX);
        }

        if (config.xDisplay === 'cityName') {
            const key = cityKey(rawX);
            const cityName = cityNames.get(key);
            if (cityName) {
                category = cityName;
            } else {
                category = `未知城市（ID: ${String(rawX ?? '-')}）`;
                if (!missingCityIds.includes(key)) missingCityIds.push(key);
            }
        }

        if (config.aggregation === 'none') {
            const numericValue = numericValueOf(row[config.yField]);
            if (numericValue === null) {
                droppedInvalidValues += 1;
                return;
            }
            rawCategories.push(category);
            rawValues.push(numericValue);
            return;
        }

        const current = aggregates.get(category) ?? {
            count: 0,
            sum: 0,
            max: Number.NEGATIVE_INFINITY,
            min: Number.POSITIVE_INFINITY,
        };
        if (config.aggregation === 'count') {
            current.count += 1;
        } else {
            const numericValue = numericValueOf(row[config.yField]);
            if (numericValue !== null) {
                current.count += 1;
                current.sum += numericValue;
                current.max = Math.max(current.max, numericValue);
                current.min = Math.min(current.min, numericValue);
            } else {
                droppedInvalidValues += 1;
            }
        }
        if (current.count > 0) aggregates.set(category, current);
    });

    if (config.aggregation === 'none') {
        return {
            categories: rawCategories.slice(0, limit),
            values: rawValues.slice(0, limit),
            missingCityIds,
            droppedInvalidValues,
        };
    }

    const limitedEntries = [...aggregates.entries()].slice(0, limit);

    return {
        categories: limitedEntries.map(([category]) => category),
        values: limitedEntries.map(([, item]) => {
            if (config.aggregation === 'count') return item.count;
            if (config.aggregation === 'sum') return item.sum;
            if (config.aggregation === 'max') return item.max;
            if (config.aggregation === 'min') return item.min;
            return item.sum / item.count;
        }),
        missingCityIds,
        droppedInvalidValues,
    };
}
