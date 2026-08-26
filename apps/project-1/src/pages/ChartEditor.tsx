import {
    BarChartOutlined,
    DatabaseOutlined,
    DotChartOutlined,
    EyeOutlined,
    LineChartOutlined,
    PieChartOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Input,
    Row,
    Select,
    Space,
    Spin,
    Steps,
    Tag,
    Typography,
    message,
} from 'antd';
import type { EChartsOption } from 'echarts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { chartsService } from '@/api/charts';
import type { ChartRecord, ChartType, DashboardOptionRecord } from '@/api/charts';
import { citiesService } from '@/api/cities';
import type { CityRecord } from '@/api/cities';
import { datasourcesService } from '@/api/datasources';
import type { DataFieldRecord, DataSourceRecord, DataTableRecord } from '@/api/datasources';
import ChartRender from '@/components/ChartRender';
import type { RootState } from '@/store';
import {
    RECORD_COUNT_FIELD,
    readChartTransformMetadata,
    stripChartTransformMetadata,
    transformChartRows,
    withChartTransformMetadata,
} from '@/utils/chartDataTransform';
import type { ChartAggregation, StoredChartTransformConfig } from '@/utils/chartDataTransform';
import { buildChartOption } from '@/utils/chartOptions';
import { getApiErrorMessage } from '@/utils/errors';
import '@/css/ChartEditor.css';

type SupportedChartType = Exclude<ChartType, 'table'>;

const TABLE_META: Record<string, { label: string; rows: string }> = {
    cities: { label: '城市基础信息', rows: '约 20 行数据' },
    city_events: { label: '城市事件', rows: '约 4,000 行数据' },
    environment_data: { label: '环境监测数据', rows: '约 5,000 行数据' },
    facilities: { label: '公共设施', rows: '约 1,200 行数据' },
    traffic_data: { label: '交通流量数据', rows: '约 5,000 行数据' },
};

const FIELD_LABELS: Record<string, string> = {
    id: '记录 ID', city_id: '城市名称', name: '名称', province: '省份', population: '人口（万）',
    area: '面积（km²）', gdp: 'GDP（亿元）', lng: '经度', lat: '纬度', district: '辖区',
    road_name: '道路名称', congestion_index: '拥堵指数', traffic_flow: '车流量',
    avg_speed: '平均车速（km/h）', aqi: 'AQI 空气质量', pm25: 'PM2.5', pm10: 'PM10',
    temperature: '气温（°C）', humidity: '湿度（%）', noise: '噪音（dB）', weather: '天气',
    type: '设施类型', capacity: '容量', event_type: '事件类型', title: '事件标题',
    severity: '严重程度', status: '状态', recorded_at: '记录时间', reported_at: '上报时间',
};

const CHART_TYPES: Array<{ value: SupportedChartType; label: string; icon: ReactNode }> = [
    { value: 'bar', label: '柱状图', icon: <BarChartOutlined /> },
    { value: 'line', label: '折线图', icon: <LineChartOutlined /> },
    { value: 'pie', label: '饼图', icon: <PieChartOutlined /> },
    { value: 'scatter', label: '散点图', icon: <DotChartOutlined /> },
];

const AGGREGATION_OPTIONS: Array<{ value: ChartAggregation; label: string }> = [
    { value: 'none', label: '不聚合' },
    { value: 'sum', label: '求和' },
    { value: 'average', label: '平均值' },
    { value: 'max', label: '最大值' },
    { value: 'min', label: '最小值' },
];

const tableNameOf = (table: DataTableRecord) => table.tableName ?? table.name ?? '';
const fieldNameOf = (field: DataFieldRecord) => field.columnName ?? field.name ?? '';
const fieldTypeOf = (field: DataFieldRecord) => field.dataType ?? field.type ?? '';
const fieldBusinessLabel = (field: DataFieldRecord, table: string) => {
    const name = fieldNameOf(field);
    if (name === 'city_id' || (table === 'cities' && name === 'name')) return '城市名称';
    return FIELD_LABELS[name] ?? name;
};
const fieldLabel = (field: DataFieldRecord, table: string) => {
    const name = fieldNameOf(field);
    const type = fieldTypeOf(field) || '未知类型';
    return `${fieldBusinessLabel(field, table)}（${name} · ${type}）`;
};
const isNumericField = (field: DataFieldRecord) => /int|real|float|double|decimal|number|numeric/i.test(fieldTypeOf(field));
const isTimeField = (field: DataFieldRecord) => (
    /date|time/i.test(fieldTypeOf(field)) || /(?:_at|_date|time)$/i.test(fieldNameOf(field))
);
const cityListOf = (data: CityRecord[] | { list: CityRecord[] } | null | undefined) => (
    Array.isArray(data) ? data : data?.list ?? []
);
const stringValue = (record: Record<string, unknown> | null, key: string) => {
    const value = record?.[key];
    return typeof value === 'string' ? value : '';
};

function ChartEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = useSelector((state: RootState) => state.authSlice.token);
    const chartId = Number(id);
    const isEdit = Number.isInteger(chartId) && chartId > 0;

    const [step, setStep] = useState(0);
    const [dashboards, setDashboards] = useState<DashboardOptionRecord[]>([]);
    const [sources, setSources] = useState<DataSourceRecord[]>([]);
    const [tables, setTables] = useState<DataTableRecord[]>([]);
    const [fields, setFields] = useState<DataFieldRecord[]>([]);
    const [cities, setCities] = useState<CityRecord[]>([]);
    const [dashboardId, setDashboardId] = useState<number | undefined>(() => {
        const preset = Number(searchParams.get('dashboard'));
        return Number.isInteger(preset) && preset > 0 ? preset : undefined;
    });
    const [datasourceId, setDatasourceId] = useState<number>();
    const [selectedTable, setSelectedTable] = useState('');
    const [xField, setXField] = useState('');
    const [yField, setYField] = useState('');
    const [aggregation, setAggregation] = useState<ChartAggregation>();
    const [title, setTitle] = useState('');
    const [chartType, setChartType] = useState<SupportedChartType>('bar');
    const [previewOption, setPreviewOption] = useState<EChartsOption>();
    const [previewTransformConfig, setPreviewTransformConfig] = useState<StoredChartTransformConfig>();
    const [initialLoading, setInitialLoading] = useState(true);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageError, setPageError] = useState('');

    const numericFields = useMemo(() => {
        return fields.filter(isNumericField);
    }, [fields]);

    const cityNames = useMemo(() => new Map<number | string, string>(
        cities.map((city) => [city.id, city.name]),
    ), [cities]);

    const isBuiltInTable = Boolean(TABLE_META[selectedTable]);
    const selectedXField = fields.find((field) => fieldNameOf(field) === xField);
    const selectedYField = fields.find((field) => fieldNameOf(field) === yField);
    const xLabel = selectedXField ? fieldBusinessLabel(selectedXField, selectedTable) : xField;
    const yLabel = yField === RECORD_COUNT_FIELD
        ? '记录数量'
        : selectedYField ? fieldBusinessLabel(selectedYField, selectedTable) : yField;

    const loadFields = useCallback(async (sourceId: number, table: string) => {
        setFieldsLoading(true);
        try {
            const response = await datasourcesService.Fields(sourceId, table);
            if (response.code !== 200) throw new Error(response.message || '字段加载失败');
            setFields(response.data ?? []);
        } finally {
            setFieldsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            setInitialLoading(true);
            setPageError('');
            try {
                const [dashboardResponse, sourceResponse, detailResponse, cityResponse] = await Promise.all([
                    chartsService.DashboardList(token),
                    datasourcesService.List({ page: 1, pageSize: 100 }),
                    isEdit ? chartsService.Detail(chartId, token) : Promise.resolve(null),
                    citiesService.List().catch(() => null),
                ]);
                if (dashboardResponse.code !== 200) throw new Error(dashboardResponse.message || '仪表盘加载失败');
                if (sourceResponse.code !== 200) throw new Error(sourceResponse.message || '数据源加载失败');
                if (detailResponse && detailResponse.code !== 200) throw new Error(detailResponse.message || '图表详情加载失败');

                const sourceList = sourceResponse.data?.list ?? [];
                const detail = detailResponse?.data as ChartRecord | undefined;
                const preferredSource = detail?.datasourceId
                    ? sourceList.find((source) => source.id === detail.datasourceId)
                    : sourceList.find((source) => /datapilot|sqlite|内置/i.test(`${source.name} ${source.type}`)) ?? sourceList[0];
                const sourceId = preferredSource?.id;

                setDashboards(dashboardResponse.data?.list ?? []);
                setSources(sourceList);
                setDatasourceId(sourceId);
                if (cityResponse?.code === 200) setCities(cityListOf(cityResponse.data));

                if (detail) {
                    const detailType = detail.chartType === 'table' ? 'bar' : detail.chartType;
                    const storedTransform = readChartTransformMetadata(detail.chartConfig);
                    setDashboardId(detail.dashboardId);
                    setTitle(detail.title);
                    setChartType(detailType);
                    setSelectedTable(stringValue(detail.queryConfig, 'table'));
                    setXField(stringValue(detail.queryConfig, 'xField'));
                    setYField(storedTransform?.yField ?? stringValue(detail.queryConfig, 'yField'));
                    setAggregation(storedTransform?.aggregation);
                    setPreviewTransformConfig(storedTransform ?? undefined);
                    if (detail.chartConfig) {
                        setPreviewOption(stripChartTransformMetadata(detail.chartConfig) as EChartsOption);
                    }
                }

                if (sourceId) {
                    const tablesResponse = await datasourcesService.Tables(sourceId);
                    if (tablesResponse.code !== 200) throw new Error(tablesResponse.message || '数据表加载失败');
                    setTables(tablesResponse.data ?? []);
                    const detailTable = detail ? stringValue(detail.queryConfig, 'table') : '';
                    if (detailTable) await loadFields(sourceId, detailTable);
                }
            } catch (error) {
                setPageError(getApiErrorMessage(error, '图表编辑器加载失败'));
            } finally {
                setInitialLoading(false);
            }
        };
        void initialize();
    }, [chartId, isEdit, loadFields, token]);

    const chooseTable = async (table: string) => {
        if (!datasourceId) return;
        setSelectedTable(table);
        setXField('');
        setYField('');
        setAggregation(undefined);
        setFields([]);
        setPreviewOption(undefined);
        setPreviewTransformConfig(undefined);
        try {
            await loadFields(datasourceId, table);
        } catch (error) {
            message.error(getApiErrorMessage(error, '字段加载失败'));
        }
    };

    const generatePreview = async () => {
        const selectedAggregation = isBuiltInTable ? aggregation : 'none';
        if (!datasourceId || !selectedTable || !xField || !yField || !selectedAggregation || !title.trim()) return;
        const queryYField = yField === RECORD_COUNT_FIELD
            ? fieldNameOf(fields.find((field) => fieldNameOf(field) === 'id') ?? numericFields[0])
            : yField;
        if (!queryYField) {
            message.warning('当前数据表缺少可用于统计记录数量的物理字段');
            return;
        }
        setPreviewLoading(true);
        try {
            const response = await datasourcesService.Query(datasourceId, { table: selectedTable, xField, yField: queryYField });
            if (response.code !== 200) throw new Error(response.message || '预览数据查询失败');
            const rows = response.data?.rows ?? [];
            if (!rows.length) {
                message.warning('当前查询没有返回数据，请重新选择字段');
                return;
            }

            const transformConfig: StoredChartTransformConfig = {
                version: 1,
                table: selectedTable,
                xField,
                yField,
                queryYField,
                aggregation: selectedAggregation,
                xLabel,
                yLabel,
                xDisplay: xField === 'city_id' ? 'cityName' : undefined,
                timeGrain: selectedXField && isTimeField(selectedXField) ? 'day' : undefined,
            };
            const transformed = transformChartRows(rows, transformConfig, cityNames);
            if (!transformed.values.length) {
                message.warning(
                    transformed.droppedInvalidValues > 0
                        ? `Y 轴字段“${yLabel}”不包含可绘制的数值，请重新选择`
                        : '当前配置没有可绘制的数据',
                );
                return;
            }
            const option = buildChartOption({
                title: title.trim(),
                chartType,
                xField: 'name',
                yField: 'value',
                xLabel,
                yLabel,
                rows: transformed.categories.map((name, index) => ({ name, value: transformed.values[index] })),
            });
            setPreviewOption(option);
            setPreviewTransformConfig(isBuiltInTable ? transformConfig : undefined);
            setStep(3);
        } catch (error) {
            message.error(getApiErrorMessage(error, '预览生成失败'));
        } finally {
            setPreviewLoading(false);
        }
    };

    const saveChart = async () => {
        const queryYField = previewTransformConfig?.queryYField ?? yField;
        if (!dashboardId || !datasourceId || !selectedTable || !xField || !queryYField || !title.trim() || !previewOption) {
            message.warning('请先完成图表配置并生成预览');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                dashboardId,
                datasourceId,
                title: title.trim(),
                chartType,
                queryConfig: { table: selectedTable, xField, yField: queryYField },
                chartConfig: previewTransformConfig
                    ? withChartTransformMetadata(previewOption as Record<string, unknown>, previewTransformConfig)
                    : previewOption as Record<string, unknown>,
            };
            const response = isEdit
                ? await chartsService.Update(chartId, payload, token)
                : await chartsService.Create(payload, token);
            if (response.code !== 200) throw new Error(response.message || '图表保存失败');
            message.success(isEdit ? '图表修改成功' : '图表创建成功');
            navigate('/chart');
        } catch (error) {
            message.error(getApiErrorMessage(error, '图表保存失败'));
        } finally {
            setSaving(false);
        }
    };

    const stepItems = [
        { title: '选择仪表盘', icon: <DatabaseOutlined /> },
        { title: '配置数据', icon: <DatabaseOutlined /> },
        { title: '选择类型', icon: <BarChartOutlined /> },
        { title: '预览保存', icon: <EyeOutlined /> },
    ];

    if (initialLoading) return <div className="chart-editor-loading"><Spin size="large" /></div>;

    return (
        <section className="chart-editor-page">
            <header className="chart-editor-title">
                <Typography.Title level={3}>{isEdit ? '编辑图表' : '新建图表'}</Typography.Title>
                <Typography.Text type="secondary">{isEdit ? `图表 #${chartId}` : '按步骤配置数据并保存到仪表盘'}</Typography.Text>
            </header>

            {pageError ? <Alert type="error" showIcon message={pageError} className="chart-editor-alert" /> : null}
            <Steps current={step} size="small" items={stepItems} className="chart-editor-steps" />

            {step === 0 ? (
                <Card title="选择目标仪表盘" className="chart-editor-card">
                    <Select
                        value={dashboardId}
                        placeholder="选择仪表盘"
                        className="chart-editor-dashboard-select"
                        options={dashboards.map((dashboard) => ({ value: dashboard.id, label: dashboard.title }))}
                        onChange={setDashboardId}
                    />
                    <Typography.Paragraph type="secondary" className="chart-editor-help">
                        图表将添加到选中的仪表盘中。如需新建仪表盘，请先到仪表盘管理页面创建。
                    </Typography.Paragraph>
                    <Button type="primary" disabled={!dashboardId} onClick={() => setStep(1)}>下一步</Button>
                </Card>
            ) : null}

            {step === 1 ? (
                <Card title="配置数据查询" className="chart-editor-card">
                    <div className="chart-editor-source">
                        <span>数据源：</span>
                        <Tag color="blue">{sources.find((source) => source.id === datasourceId)?.name ?? '云枢内置数据库'}</Tag>
                    </div>
                    <Typography.Text strong>数据表</Typography.Text>
                    <div className="chart-table-options">
                        {tables.map((table) => {
                            const name = tableNameOf(table);
                            const meta = TABLE_META[name];
                            return (
                                <button
                                    type="button"
                                    key={name}
                                    className={`chart-table-option ${selectedTable === name ? 'is-selected' : ''}`}
                                    onClick={() => void chooseTable(name)}
                                >
                                    <strong>{meta?.label ?? name}</strong>
                                    <code>{name}</code>
                                    <small>{meta?.rows ?? (table.estimatedRows ? `约 ${table.estimatedRows.toLocaleString()} 行数据` : '内置数据表')}</small>
                                </button>
                            );
                        })}
                    </div>

                    {selectedTable ? (
                        <div className="chart-fields-panel">
                            <Typography.Text strong>选择字段</Typography.Text>
                            <Spin spinning={fieldsLoading}>
                                <Row gutter={16}>
                                    <Col xs={24} md={isBuiltInTable ? 8 : 12}>
                                        <label>X 轴 — 分类维度（如城市名、日期、类型）</label>
                                        <Select
                                            value={xField || undefined}
                                            placeholder="选择分类字段"
                                            options={fields.map((field) => ({
                                                value: fieldNameOf(field),
                                                label: fieldLabel(field, selectedTable),
                                            }))}
                                            onChange={(value) => {
                                                setXField(value);
                                                setPreviewOption(undefined);
                                                setPreviewTransformConfig(undefined);
                                            }}
                                        />
                                    </Col>
                                    <Col xs={24} md={isBuiltInTable ? 8 : 12}>
                                        <label>Y 轴 — 数值指标（如人口、GDP、AQI）</label>
                                        <Select
                                            value={yField || undefined}
                                            placeholder="选择数值字段"
                                            options={[
                                                ...(isBuiltInTable ? [{ value: RECORD_COUNT_FIELD, label: '记录数量（前端统计）' }] : []),
                                                ...numericFields.map((field) => ({
                                                    value: fieldNameOf(field),
                                                    label: fieldLabel(field, selectedTable),
                                                })),
                                            ]}
                                            onChange={(value) => {
                                                setYField(value);
                                                setAggregation(value === RECORD_COUNT_FIELD ? 'count' : undefined);
                                                setPreviewOption(undefined);
                                                setPreviewTransformConfig(undefined);
                                            }}
                                        />
                                    </Col>
                                    {isBuiltInTable ? (
                                        <Col xs={24} md={8}>
                                            <label>统计方式 — 相同 X 轴值如何合并</label>
                                            <Select
                                                value={aggregation}
                                                placeholder="选择统计方式"
                                                disabled={!yField || yField === RECORD_COUNT_FIELD}
                                                options={yField === RECORD_COUNT_FIELD
                                                    ? [{ value: 'count', label: '计数' }]
                                                    : AGGREGATION_OPTIONS}
                                                onChange={(value) => {
                                                    setAggregation(value);
                                                    setPreviewOption(undefined);
                                                    setPreviewTransformConfig(undefined);
                                                }}
                                            />
                                        </Col>
                                    ) : null}
                                </Row>
                            </Spin>
                        </div>
                    ) : null}
                    <Space className="chart-editor-actions">
                        <Button onClick={() => setStep(0)}>上一步</Button>
                        <Button
                            type="primary"
                            disabled={!xField || !yField || (isBuiltInTable && !aggregation)}
                            onClick={() => setStep(2)}
                        >
                            下一步
                        </Button>
                    </Space>
                </Card>
            ) : null}

            {step === 2 ? (
                <Card title="选择图表类型" className="chart-editor-card">
                    <label className="chart-editor-field-label">图表标题</label>
                    <Input value={title} maxLength={50} placeholder="输入图表标题" onChange={(event) => setTitle(event.target.value)} />
                    <label className="chart-editor-field-label">图表类型</label>
                    <div className="chart-type-options">
                        {CHART_TYPES.map((item) => (
                            <button
                                type="button"
                                key={item.value}
                                className={`chart-type-option ${chartType === item.value ? 'is-selected' : ''}`}
                                onClick={() => setChartType(item.value)}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <Space className="chart-editor-actions">
                        <Button onClick={() => setStep(1)}>上一步</Button>
                        <Button type="primary" loading={previewLoading} disabled={!title.trim()} onClick={() => void generatePreview()}>预览</Button>
                    </Space>
                </Card>
            ) : null}

            {step === 3 ? (
                <Card
                    title={`预览：${title}`}
                    extra={<Tag color="blue">{CHART_TYPES.find((item) => item.value === chartType)?.label}</Tag>}
                    className="chart-editor-card chart-preview-card"
                >
                    {previewOption ? <ChartRender option={previewOption} height={420} /> : <Empty description="暂无预览" />}
                    <Space className="chart-editor-actions">
                        <Button onClick={() => setStep(2)}>上一步</Button>
                        <Button icon={<EyeOutlined />} loading={previewLoading} onClick={() => void generatePreview()}>重新生成预览</Button>
                        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void saveChart()}>
                            {isEdit ? '保存修改' : '保存到仪表盘'}
                        </Button>
                    </Space>
                </Card>
            ) : null}
        </section>
    );
}

export default ChartEditor;
