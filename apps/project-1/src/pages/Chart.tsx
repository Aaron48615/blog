import {
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    PlusOutlined,
    ReloadOutlined,
    UndoOutlined,
} from '@ant-design/icons'
import { Button, Empty, Flex, Modal, Select, Space, Spin, Table, Tag, Typography, message, theme } from 'antd'
import type { TableColumnsType } from 'antd'
import type { CSSProperties } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { chartsService } from '@/api/charts'
import type { ChartRecord, ChartType, DashboardOptionRecord } from '@/api/charts'
import ChartRender from '@/components/ChartRender'
import type { RootState } from '@/store'
import '@/css/Chart.css'

const TYPE_META: Record<ChartType, { label: string; color: string }> = {
    bar: { label: '柱状图', color: 'blue' },
    pie: { label: '饼图', color: 'gold' },
    line: { label: '折线图', color: 'cyan' },
    scatter: { label: '散点图', color: 'purple' },
    table: { label: '数据表', color: 'default' },
}

const formatDateTime = (value: string) => {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value || '-'
    }

    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date).replaceAll('/', '-')
}

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message
    }

    return fallback
}

function Chart() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { token: themeToken } = theme.useToken()
    const authToken = useSelector((state: RootState) => state.authSlice.token)
    const initialDashboardId = Number(searchParams.get('dashboard')) || undefined

    const [charts, setCharts] = useState<ChartRecord[]>([])
    const [dashboardOptions, setDashboardOptions] = useState<DashboardOptionRecord[]>([])
    const [dashboardId, setDashboardId] = useState<number | undefined>(initialDashboardId)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [previewItem, setPreviewItem] = useState<ChartRecord>()
    const [previewOption, setPreviewOption] = useState<Record<string, unknown>>()
    const [previewLoading, setPreviewLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<number>()
    const [modal, modalContextHolder] = Modal.useModal()

    const fetchCharts = useCallback(async (showSuccess = false) => {
        setLoading(true)

        try {
            const response = await chartsService.List({
                page,
                pageSize,
                dashboardId,
            }, authToken)

            if (response.code !== 200) {
                throw new Error(response.message || '获取图表列表失败')
            }

            setCharts(response.data?.list ?? [])
            setTotal(response.data?.total ?? 0)

            if (showSuccess) {
                message.success('页面数据已刷新')
            }
        } catch (error) {
            setCharts([])
            setTotal(0)
            message.error(getErrorMessage(error, '获取图表列表失败'))
        } finally {
            setLoading(false)
        }
    }, [authToken, dashboardId, page, pageSize])

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchCharts(), 0)
        return () => window.clearTimeout(timer)
    }, [fetchCharts])

    useEffect(() => {
        const fetchDashboards = async () => {
            try {
                const response = await chartsService.DashboardList(authToken)

                if (response.code !== 200) {
                    throw new Error(response.message || '获取仪表盘列表失败')
                }

                setDashboardOptions(response.data?.list ?? [])
            } catch (error) {
                setDashboardOptions([])
                message.error(getErrorMessage(error, '获取仪表盘列表失败'))
            }
        }

        void fetchDashboards()
    }, [authToken])

    const handleDashboardChange = (value?: number) => {
        setDashboardId(value)
        setPage(1)
        setSearchParams(value ? { dashboard: String(value) } : {}, { replace: true })
    }

    const handlePreview = async (item: ChartRecord) => {
        setPreviewItem(item)
        setPreviewOption(undefined)
        setPreviewLoading(true)

        try {
            const response = await chartsService.Preview(item.id, authToken)

            if (response.code !== 200) {
                throw new Error(response.message || '图表预览加载失败')
            }

            setPreviewOption(response.data)
        } catch (error) {
            message.error(getErrorMessage(error, '图表预览加载失败'))
        } finally {
            setPreviewLoading(false)
        }
    }

    const closePreview = () => {
        setPreviewItem(undefined)
        setPreviewOption(undefined)
    }

    const handleDelete = (item: ChartRecord) => {
        modal.confirm({
            title: '确认删除图表？',
            content: `图表“${item.title}”删除后无法恢复。`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                setDeletingId(item.id)
                try {
                    const response = await chartsService.Delete(item.id, authToken)
                    if (response.code !== 200) throw new Error(response.message || '图表删除失败')
                    message.success('图表删除成功')
                    if (charts.length === 1 && page > 1) setPage((current) => current - 1)
                    else await fetchCharts()
                } catch (error) {
                    message.error(getErrorMessage(error, '图表删除失败'))
                    throw error
                } finally {
                    setDeletingId(undefined)
                }
            },
        })
    }

    const columns: TableColumnsType<ChartRecord> = [
        { title: 'ID', dataIndex: 'id', width: 72 },
        {
            title: '图表标题',
            dataIndex: 'title',
            width: 230,
            render: (title: string) => <Typography.Text className="chart-name">{title}</Typography.Text>,
        },
        {
            title: '类型',
            dataIndex: 'chartType',
            width: 110,
            render: (chartType: ChartType) => {
                const typeMeta = TYPE_META[chartType] ?? { label: chartType || '未知', color: 'default' }
                return <Tag color={typeMeta.color}>{typeMeta.label}</Tag>
            },
        },
        {
            title: '所属仪表盘',
            dataIndex: 'dashboard',
            width: 180,
            render: (dashboard: ChartRecord['dashboard']) => dashboard?.title ?? '-',
        },
        {
            title: '数据源',
            dataIndex: 'datasource',
            width: 190,
            render: (datasource: ChartRecord['datasource']) => (
                <span className="source-cell">
                    {datasource ? `${datasource.name}（${datasource.type}）` : '未关联数据源'}
                </span>
            ),
        },
        {
            title: '更新时间',
            dataIndex: 'updatedAt',
            width: 170,
            render: formatDateTime,
        },
        {
            title: '操作',
            key: 'actions',
            width: 246,
            fixed: 'right',
            render: (_, item) => (
                <Space size={8} wrap={false}>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => void handlePreview(item)}>预览</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/chart/${item.id}/edit`)}>编辑</Button>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={deletingId === item.id}
                        onClick={() => handleDelete(item)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ]

    return (
        <section
            className="chart-management-page"
            style={{
                '--chart-surface': themeToken.colorBgContainer,
                '--chart-surface-muted': themeToken.colorFillAlter,
                '--chart-text': themeToken.colorText,
            } as CSSProperties}
        >
            {modalContextHolder}
            <div className="chart-page-heading">
                <div>
                    <Typography.Title level={3}>图表管理</Typography.Title>
                    <Typography.Text type="secondary">集中管理数据图表及其所属仪表盘</Typography.Text>
                </div>
                <span className="chart-total-badge">共 {total} 个图表</span>
            </div>

            <div className="chart-toolbar">
                <Flex gap={10} wrap align="center">
                    <Select
                        allowClear
                        value={dashboardId}
                        className="dashboard-filter"
                        placeholder="按仪表盘筛选"
                        options={dashboardOptions.map((item) => ({ value: item.id, label: item.title }))}
                        onChange={handleDashboardChange}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/chart/add')}>新建图表</Button>
                    <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void fetchCharts(true)}>刷新</Button>
                    <Button icon={<UndoOutlined />} disabled={!dashboardId} onClick={() => handleDashboardChange(undefined)}>重置筛选</Button>
                </Flex>
            </div>

            <div className="chart-table-shell">
                <Table<ChartRecord>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={charts}
                    scroll={{ x: 1200 }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50],
                        showTotal: (count) => `共 ${count} 条`,
                        showLessItems: true,
                    }}
                    onChange={(pagination) => {
                        setPage(pagination.current ?? 1)
                        setPageSize(pagination.pageSize ?? 10)
                    }}
                />
            </div>

            <Modal
                open={Boolean(previewItem)}
                title={previewItem ? `图表预览：${previewItem.title}` : '图表预览'}
                width={760}
                footer={null}
                destroyOnHidden
                centered
                onCancel={closePreview}
                className="chart-preview-modal"
            >
                <div className="chart-preview-content">
                    {previewLoading ? (
                        <div className="chart-preview-state"><Spin size="large" /></div>
                    ) : previewOption ? (
                        <ChartRender option={previewOption} height={380} />
                    ) : (
                        <div className="chart-preview-state"><Empty description="暂无可预览数据" /></div>
                    )}
                </div>
            </Modal>
        </section>
    )
}

export default Chart
