import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import type { EChartsOption } from 'echarts';
import {
    ArrowLeftOutlined,
    CopyOutlined,
    DeleteOutlined,
    EditOutlined,
    LineChartOutlined,
    PlusOutlined,
    ReloadOutlined,
    DashboardTwoTone
} from '@ant-design/icons';
import { Alert, Button, Empty, Form, Input, Modal, Select, Spin, Tag, message, theme } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ChartRender from '@/components/ChartRender';
import { dashboardsService } from '@/api/dashboards';
import type { DashboardChart, DashboardData, DashboardDetailData } from '@/api/dashboards';
import { chartsService } from '@/api/charts';
import type { ChartType } from '@/api/charts';
import { citiesService } from '@/api/cities';
import type { CityRecord } from '@/api/cities';
import { datasourcesService } from '@/api/datasources';
import type { RootState } from '@/store';
import { useAuthority } from '@/hooks/useAuthority';
import {
    readChartTransformMetadata,
    stripChartTransformMetadata,
    transformChartRows,
} from '@/utils/chartDataTransform';
import { buildChartOption, buildChartOptionFromQuery, withoutChartTitle } from '@/utils/chartOptions';
import { getApiErrorMessage } from '@/utils/errors';
import '../css/Dashboards.css';

type DashboardTheme = '浅色' | '深色';

type DashboardFormValues = {
    title: string;
    description?: string;
    theme: DashboardTheme;
};

const getDashboardTheme = (dashboard: DashboardData): DashboardTheme => (
    dashboard.bgTheme === 'dark' ? '深色' : '浅色'
);

const getChartCount = (dashboard: DashboardData) => dashboard._count?.charts ?? 0;

const hasChartOption = (chart: DashboardChart) => (
    chart.chartConfig && Object.keys(chart.chartConfig).length > 0
);

const cityListOf = (data: CityRecord[] | { list: CityRecord[] } | null | undefined) => (
    Array.isArray(data) ? data : data?.list ?? []
);

const storedChartOptionOf = (chart: DashboardChart): EChartsOption => (
    stripChartTransformMetadata(chart.chartConfig ?? {}) as EChartsOption
);

function DashboardMark() {
    return (
        <span className="dashboard-mark" aria-hidden="true">
            <span />
            <span />
            <span />
        </span>
    );
}

function Dashboards() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { token: themeToken } = theme.useToken();
    const authToken = useSelector((state: RootState) => state.authSlice.token) as string | null;
    const { hasAuthority } = useAuthority();
    const [form] = Form.useForm<DashboardFormValues>();
    const [modal, modalContextHolder] = Modal.useModal();
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [editingDashboard, setEditingDashboard] = useState<DashboardData | null>(null);
    const [dashboardList, setDashboardList] = useState<DashboardData[]>([]);
    const [dashboardDetail, setDashboardDetail] = useState<DashboardDetailData | null>(null);
    const [listLoading, setListLoading] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [listError, setListError] = useState('');
    const [detailError, setDetailError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [cloningId, setCloningId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [liveChartOptions, setLiveChartOptions] = useState<Record<number, EChartsOption>>({});

    const selectedDashboardId = useMemo(() => {
        const view = searchParams.get('view');
        if (!view) return null;
        const id = Number(view);
        return Number.isInteger(id) && id > 0 ? id : null;
    }, [searchParams]);

    const currentDashboardDetail = useMemo(
        () => dashboardDetail?.id === selectedDashboardId ? dashboardDetail : null,
        [dashboardDetail, selectedDashboardId],
    );

    const selectedDashboard = useMemo(
        () => currentDashboardDetail ?? dashboardList.find((item) => item.id === selectedDashboardId) ?? null,
        [currentDashboardDetail, dashboardList, selectedDashboardId],
    );

    const detailCharts = useMemo(
        () => [...(currentDashboardDetail?.charts ?? [])].sort(
            (first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
        ),
        [currentDashboardDetail],
    );

    const pageStyle = {
        '--dashboard-surface': themeToken.colorBgContainer,
        '--dashboard-text': themeToken.colorText,
        '--dashboard-text-secondary': themeToken.colorTextSecondary,
        '--dashboard-border': themeToken.colorBorderSecondary,
        '--dashboard-hover': themeToken.colorFillTertiary,
    } as CSSProperties;

    const loadDashboardList = useCallback(async () => {
        if (!authToken) {
            setListError('登录状态不可用，请重新登录后再试');
            return;
        }

        setListLoading(true);
        setListError('');
        try {
            const response = await dashboardsService.DashboardList(
                { page: 1, pageSize: 100 },
                authToken,
            );
            if (response.code !== 200) {
                throw new Error(response.message || '仪表盘列表加载失败');
            }
            setDashboardList(response.data?.list ?? []);
        } catch {
            setListError('仪表盘数据加载失败，请稍后重试');
        } finally {
            setListLoading(false);
        }
    }, [authToken]);

    const loadDashboardDetail = useCallback(async (id: number) => {
        if (!authToken) {
            setDetailError('登录状态不可用，请重新登录后再试');
            return;
        }

        setDetailLoading(true);
        setDetailError('');
        try {
            const response = await dashboardsService.DashboardDetail(id, authToken);
            if (response.code !== 200) {
                throw new Error(response.message || '仪表盘详情加载失败');
            }
            setDashboardDetail(response.data);
            const options: Record<number, EChartsOption> = {};
            const charts = response.data?.charts ?? [];
            const transformConfigs = new Map(charts.map((chart) => [
                chart.id,
                readChartTransformMetadata(chart.chartConfig),
            ]));
            const requiresCityNames = [...transformConfigs.values()].some(
                (config) => config?.xDisplay === 'cityName',
            );
            const cityResponse = requiresCityNames
                ? await citiesService.List().catch(() => null)
                : null;
            const cityNames = new Map<number | string, string>(
                cityResponse?.code === 200
                    ? cityListOf(cityResponse.data).map((city) => [city.id, city.name])
                    : [],
            );

            await Promise.allSettled(charts.map(async (chart) => {
                if (chart.chartType === 'table') return;
                const transformConfig = transformConfigs.get(chart.id);
                if (transformConfig && chart.datasourceId) {
                    const queryResponse = await datasourcesService.Query(chart.datasourceId, {
                        table: transformConfig.table,
                        xField: transformConfig.xField,
                        yField: transformConfig.queryYField,
                    });
                    if (queryResponse.code !== 200) return;
                    const transformed = transformChartRows(
                        queryResponse.data?.rows ?? [],
                        transformConfig,
                        cityNames,
                    );
                    if (!transformed.values.length) return;
                    options[chart.id] = buildChartOption({
                        title: chart.title,
                        chartType: chart.chartType as Exclude<ChartType, 'table'>,
                        xField: 'name',
                        yField: 'value',
                        xLabel: transformConfig.xLabel,
                        yLabel: transformConfig.yLabel,
                        rows: transformed.categories.map((name, index) => ({
                            name,
                            value: transformed.values[index],
                        })),
                        showTitle: false,
                    });
                    return;
                }
                const queryResponse = await chartsService.Query(chart.id, {}, authToken);
                if (queryResponse.code === 200) {
                    options[chart.id] = buildChartOptionFromQuery(chart.title, chart.chartType as ChartType, queryResponse.data, false);
                }
            }));
            setLiveChartOptions(options);
        } catch {
            setDashboardDetail(null);
            setLiveChartOptions({});
            setDetailError('仪表盘详情加载失败，请稍后重试');
        } finally {
            setDetailLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        if (selectedDashboardId === null) {
            const timer = window.setTimeout(() => void loadDashboardList(), 0);
            return () => window.clearTimeout(timer);
        }
    }, [loadDashboardList, selectedDashboardId]);

    useEffect(() => {
        if (selectedDashboardId !== null) {
            const timer = window.setTimeout(() => void loadDashboardDetail(selectedDashboardId), 0);
            return () => window.clearTimeout(timer);
        }
    }, [loadDashboardDetail, selectedDashboardId]);

    const openCreateModal = () => {
        setEditingDashboard(null);
        form.setFieldsValue({ title: '', description: '', theme: '浅色' });
        setModalMode('create');
    };

    const openEditModal = (event: MouseEvent, dashboard: DashboardData) => {
        event.stopPropagation();
        setEditingDashboard(dashboard);
        form.setFieldsValue({
            title: dashboard.title,
            description: dashboard.description ?? '',
            theme: getDashboardTheme(dashboard),
        });
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setEditingDashboard(null);
        form.resetFields();
    };

    const handleSaveDashboard = async () => {
        if (!authToken) return;
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const payload = {
                title: values.title.trim(),
                description: values.description?.trim(),
                bgTheme: values.theme === '深色' ? 'dark' as const : 'light' as const,
            };
            const response = modalMode === 'edit' && editingDashboard
                ? await dashboardsService.DashboardUpdate(editingDashboard.id, payload, authToken)
                : await dashboardsService.DashboardCreate(payload, authToken);
            if (response.code !== 200) throw new Error(response.message || '仪表盘保存失败');
            message.success(modalMode === 'edit' ? '仪表盘修改成功' : '仪表盘创建成功');
            closeModal();
            await loadDashboardList();
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            message.error(getApiErrorMessage(error, '仪表盘保存失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleClone = async (dashboard: DashboardData) => {
        if (!authToken) return;
        setCloningId(dashboard.id);
        try {
            const response = await dashboardsService.DashboardClone(dashboard.id, authToken);
            if (response.code !== 200) throw new Error(response.message || '仪表盘克隆失败');
            message.success(`已克隆“${dashboard.title}”`);
            await loadDashboardList();
        } catch (error) {
            message.error(getApiErrorMessage(error, '仪表盘克隆失败'));
        } finally {
            setCloningId(null);
        }
    };

    const handleDelete = (dashboard: DashboardData) => {
        if (!authToken) return;
        modal.confirm({
            title: '确认删除仪表盘？',
            content: `“${dashboard.title}”及其 ${getChartCount(dashboard)} 个关联图表、地图图层将被级联删除，且无法恢复。`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                setDeletingId(dashboard.id);
                try {
                    const response = await dashboardsService.DashboardDelete(dashboard.id, authToken);
                    if (response.code !== 200) throw new Error(response.message || '仪表盘删除失败');
                    message.success('仪表盘删除成功');
                    await loadDashboardList();
                } catch (error) {
                    message.error(getApiErrorMessage(error, '仪表盘删除失败'));
                    throw error;
                } finally {
                    setDeletingId(null);
                }
            },
        });
    };

    const showDashboard = (dashboard: DashboardData) => {
        navigate(`/dashboards?view=${dashboard.id}`);
    };

    const handleCardKeyDown = (event: KeyboardEvent, dashboard: DashboardData) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            showDashboard(dashboard);
        }
    };

    const refreshPageData = () => {
        if (selectedDashboardId !== null) {
            void loadDashboardDetail(selectedDashboardId);
            return;
        }
        void loadDashboardList();
    };

    if (selectedDashboardId !== null) {
        const selectedTheme = selectedDashboard ? getDashboardTheme(selectedDashboard) : '浅色';
        return (
            <section className="dashboard-manager" style={pageStyle}>
                {modalContextHolder}
                <header className="dashboard-detail-header">
                    <div>
                        <Button
                            type="text"
                            className="dashboard-back-button"
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/dashboards')}
                        >
                            返回
                        </Button>
                        <h1>{selectedDashboard?.title ?? '仪表盘详情'}</h1>
                        <p>{selectedDashboard?.description || '暂无描述'}</p>
                    </div>
                    <div className="dashboard-detail-actions">
                        <Tag variant="filled" color={selectedTheme === '浅色' ? 'blue' : 'default'}>
                            {selectedTheme}主题
                        </Tag>
                        <Button
                            icon={<ReloadOutlined spin={detailLoading} />}
                            onClick={refreshPageData}
                            disabled={detailLoading}
                        >
                            刷新
                        </Button>
                    </div>
                </header>

                {detailLoading && !currentDashboardDetail ? (
                    <div className="dashboard-request-state"><Spin size="large" /></div>
                ) : detailError ? (
                    <Alert
                        type="error"
                        showIcon
                        message={detailError}
                        action={<Button size="small" onClick={refreshPageData}>重试</Button>}
                    />
                ) : detailCharts.length === 0 ? (
                    <div className="dashboard-request-state"><Empty description="该仪表盘暂未添加图表" /></div>
                ) : (
                    <div className="dashboard-chart-grid">
                        {detailCharts.map((chart) => (
                            <article className="dashboard-chart-card" key={chart.id}>
                                <div className="dashboard-chart-card__header">
                                    <span>{chart.title}</span>
                                    <Tag variant="filled">{chart.chartType}</Tag>
                                </div>
                                <div className="dashboard-chart-card__content">
                                    {chart.chartType === 'table' || (!liveChartOptions[chart.id] && !hasChartOption(chart)) ? (
                                        <div className="dashboard-chart-empty">
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description={chart.chartType === 'table' ? '表格图表暂不支持预览' : '暂无图表配置'}
                                            />
                                        </div>
                                    ) : (
                                        <ChartRender
                                            option={withoutChartTitle(liveChartOptions[chart.id] ?? storedChartOptionOf(chart))}
                                            height="252px"
                                        />
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    return (
        <section className="dashboard-manager" style={pageStyle}>
            {modalContextHolder}
            <header className="dashboard-manager__header">
                <h1>
                    <DashboardMark />
                    仪表盘管理
                </h1>
                <div className="dashboard-manager__actions">
                    <Button
                        icon={<ReloadOutlined spin={listLoading} />}
                        onClick={refreshPageData}
                        disabled={listLoading}
                    >
                        刷新
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                        新建仪表盘
                    </Button>
                </div>
            </header>

            {listLoading && dashboardList.length === 0 ? (
                <div className="dashboard-request-state"><Spin size="large" /></div>
            ) : listError ? (
                <Alert
                    type="error"
                    showIcon
                    message={listError}
                    action={<Button size="small" onClick={refreshPageData}>重试</Button>}
                />
            ) : dashboardList.length === 0 ? (
                <div className="dashboard-request-state"><Empty description="暂无仪表盘数据" /></div>
            ) : (
                <div className="dashboard-card-grid">
                    {dashboardList.map((dashboard) => (
                        <article className="dashboard-manage-card" key={dashboard.id}>
                            <div
                                className="dashboard-manage-card__body"
                                role="button"
                                tabIndex={0}
                                onClick={() => showDashboard(dashboard)}
                                onKeyDown={(event) => handleCardKeyDown(event, dashboard)}
                            >
                                <div className="dashboard-manage-card__icon">
                                    <DashboardTwoTone />
                                </div>
                                <div className="dashboard-manage-card__copy">
                                    <h2>{dashboard.title}</h2>
                                    <p>{dashboard.description || '暂无描述'}</p>
                                    <div className="dashboard-manage-card__meta">
                                        <span>{getChartCount(dashboard)} 个图表</span>
                                        <Tag variant="filled" color={getDashboardTheme(dashboard) === '浅色' ? 'blue' : 'default'}>
                                            {getDashboardTheme(dashboard)}
                                        </Tag>
                                    </div>
                                </div>
                            </div>
                            <div className="dashboard-manage-card__footer" onClick={(event) => event.stopPropagation()}>
                                <Button type="text" icon={<PlusOutlined />} onClick={() => navigate(`/chart/add?dashboard=${dashboard.id}`)}>
                                    添加图表
                                </Button>
                                <Button type="text" icon={<EditOutlined />} onClick={(event) => openEditModal(event, dashboard)}>
                                    编辑
                                </Button>
                                <Button type="text" icon={<CopyOutlined />} loading={cloningId === dashboard.id} onClick={() => void handleClone(dashboard)}>
                                    克隆
                                </Button>
                                {hasAuthority('dashboards:delete') ? (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        loading={deletingId === dashboard.id}
                                        onClick={() => handleDelete(dashboard)}
                                    >
                                        删除
                                    </Button>
                                ) : <span className="dashboard-action-placeholder" />}
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <Modal
                title={modalMode === 'edit' ? '编辑仪表盘' : '新建仪表盘'}
                open={modalMode !== null}
                okText="确定"
                cancelText="取消"
                width={500}
                centered
                destroyOnHidden
                onCancel={closeModal}
                confirmLoading={submitting}
                onOk={() => void handleSaveDashboard()}
            >
                <Form<DashboardFormValues>
                    form={form}
                    layout="vertical"
                    className="dashboard-form"
                >
                    <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入仪表盘名称' }]}>
                        <Input placeholder="仪表盘名称" />
                    </Form.Item>
                    <Form.Item label="描述" name="description">
                        <Input.TextArea placeholder="仪表盘用途说明" rows={3} maxLength={120} />
                    </Form.Item>
                    <Form.Item label="主题" name="theme">
                        <Select
                            options={[
                                { value: '浅色', label: '浅色主题' },
                                { value: '深色', label: '深色主题' },
                            ]}
                        />
                    </Form.Item>
                </Form>
                {modalMode === 'edit' && editingDashboard ? (
                    <div className="dashboard-form__hint">
                        <LineChartOutlined /> 当前关联 {getChartCount(editingDashboard)} 个图表
                    </div>
                ) : null}
            </Modal>
        </section>
    );
}

export default Dashboards;
