import { useCallback, useEffect, useState } from "react";
import { citiesService } from "@/api/cities";
import "../css/Dashboard.css";
import { ReloadOutlined, DashboardOutlined, QuestionCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined, ThunderboltOutlined, FireOutlined } from '@ant-design/icons'
import { Button, Popover, Col, Row, Statistic, Card, Table, Tag, message } from "antd";
import type { TableColumnsType } from 'antd';
import type { EChartsOption } from 'echarts';
import { createStaticStyles } from 'antd-style';
import ChartRender from '../components/ChartRender'
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

type CityEvent = {
    id: number;
    title: string;
    eventType: string;
    severity: string;
    status: string;
    reportedAt: string;
    city?: {
        name: string;
    };
};

type EventsData = {
    list: CityEvent[];
    total: number;
    page: number;
    pageSize: number;
};

type CityOverview = {
    totalCities: number;
    avgCongestionIndex: number | null;
    avgAqi: number | null;
    pendingEvents: number;
    eventProcessRate: number;
    avgPM25: number | null;
    avgTemperature: number | null;
};

type TrafficRankingItem = {
    name: string;
    value: number;
};

type EventStatsData = {
    byType: Array<{ type: string; count: number }>;
};

type FacilityStat = {
    type: string;
    count: number;
};

type MetricLevel = 'green' | 'yellow' | 'red';

// 自定义组件类
const classNames = createStaticStyles(({ css }) => ({
    root: css`
        border: 1px solid #ccc;
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 8px;
        height: 130px;
        box-sizing: border-box;
    `,
}));

function Dashboard() {
    const navigate = useNavigate();
    const token = useSelector((state: RootState) => state.authSlice.token);
    const [messageApi, contextHolder] = message.useMessage();
    const [exporting, setExporting] = useState<'cities' | 'events' | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    // 时间
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const day = now.getDay();
    // 城市概览、交通情况、类型事件、设施统计、事件列表
    const [overview, setOverview] = useState<CityOverview | null>(null);
    const [traffic, setTraffic] = useState<TrafficRankingItem[]>([]);
    const [stats, setStats] = useState<EventStatsData | null>(null);
    const [facility, setFacility] = useState<FacilityStat[]>([]);
    const [events, setEvents] = useState<EventsData>({ list: [], total: 0, page: 1, pageSize: 8 });
    const [eventPage, setEventPage] = useState(1);
    const [eventLoading, setEventLoading] = useState(false);
    const eventPageSize = 8;

    // 把接口返回的 CSV Blob 转成浏览器下载文件
    const downloadCsv = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    // 导出城市或事件数据
    const handleExport = async (type: 'cities' | 'events') => {
        if (!token) {
            messageApi.error('登录状态已失效，请重新登录');
            return;
        }

        setExporting(type);
        try {
            const blob = type === 'cities'
                ? await citiesService.CitiesExport(token)
                : await citiesService.EventsExport(token);
            downloadCsv(blob, type === 'cities' ? '城市数据.csv' : '城市事件数据.csv');
            messageApi.success('导出成功');
        } catch {
            messageApi.error('导出失败，请稍后重试');
        } finally {
            setExporting(null);
        }
    };

    // 处理城市概览数据
    const newOverview = overview ? [
        {
            title: '监测城市',
            value: overview.totalCities,
            level: getLevel('totalCities', overview.totalCities),
            prefix: getPrefix('totalCities', overview.totalCities),
            status: getStatus('totalCities', overview.totalCities),
        },
        {
            title: '交通拥堵指数',
            value: overview.avgCongestionIndex,
            level: getLevel('avgCongestionIndex', overview.avgCongestionIndex),
            prefix: getPrefix('avgCongestionIndex', overview.avgCongestionIndex),
            status: getStatus('avgCongestionIndex', overview.avgCongestionIndex),
        },
        {
            title: '平均 AQI',
            value: overview.avgAqi,
            level: getLevel('avgAqi', overview.avgAqi),
            prefix: getPrefix('avgAqi', overview.avgAqi),
            status: getStatus('avgAqi', overview.avgAqi),
        },
        {
            title: '待处理事件',
            value: overview.pendingEvents,
            level: getLevel('pendingEvents', overview.pendingEvents),
            prefix: getPrefix('pendingEvents', overview.pendingEvents),
            status: getStatus('pendingEvents', overview.pendingEvents),
        },
        {
            title: '事件处理率',
            value: overview.eventProcessRate,
            level: getLevel('eventProcessRate', overview.eventProcessRate),
            prefix: getPrefix('eventProcessRate', overview.eventProcessRate),
            suffix: '%',
            status: getStatus('eventProcessRate', overview.eventProcessRate),
        },
        {
            title: 'PM2.5 均值',
            value: overview.avgPM25,
            level: getLevel('avgPM25', overview.avgPM25),
            prefix: <ThunderboltOutlined />,
            suffix: 'μg/m³',
        },
        {
            title: '平均气温',
            value: overview.avgTemperature,
            level: getLevel('avgTemperature', overview.avgTemperature),
            prefix: <FireOutlined />,
            suffix: '°C',
        },
        {
            title: '今日事件',
            value: events.total,
            level: getLevel('todayEvents', events.total),
            prefix: <ThunderboltOutlined />,
        },
    ] : []
    // 数据的三挡颜色
    const levelColor: Record<MetricLevel, string> = {
        green: '#52c41a',
        yellow: '#faad14',
        red: '#ff4d4f',
    };
    // 柱状图option
    const barOption: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '0',
            top: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                data: facility.map(item => item.type),
                axisTick: {
                    alignWithLabel: true
                }
            }
        ],
        yAxis: [
            {
                type: 'value'
            }
        ],
        series: [
            {
                name: 'Direct',
                type: 'bar',
                barWidth: '30%',
                data: facility.map(item => item.count)
            }
        ]
    }

    // 交通数据，按拥堵指数从高到低排序
    const trafficRows = traffic
        .map(item => ({
            name: item.name,
            value: item.value,
        }))
        .sort((first, second) => second.value - first.value);

    // 横向柱状图option
    const trafficOption: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: '{b}: {c}'
        },
        grid: {
            left: '5%',
            right: '20%',
            top: '0%',
            bottom: '0%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '拥堵指数',
            max: 10,
            splitLine: {
                lineStyle: {
                    color: '#d9e0ef'
                }
            }
        },
        yAxis: {
            type: 'category',
            inverse: true,
            data: trafficRows.map(item => item.name)
        },
        series: [
            {
                name: '拥堵指数',
                type: 'bar',
                barWidth: '58%',
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c}'
                },
                itemStyle: {
                    color: (params) => Number(params.value) >= 7 ? '#ff2d43' : '#ff9d00',
                    borderRadius: [0, 4, 4, 0]
                },
                data: trafficRows.map(item => item.value)
            }
        ]
    };

    // 事件类型数据
    const eventRows = (stats?.byType ?? [])
        .map(item => ({
            name: item.type,
            value: item.count,
        }))
        .filter(item => item.value > 0);

    // 环形图option
    const eventOption: EChartsOption = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}<br/>{c} 件 ({d}%)'
        },
        legend: {
            bottom: 0,
            left: 'center',
            type: 'scroll'
        },
        series: [
            {
                name: '事件类型',
                type: 'pie',
                radius: ['42%', '68%'],
                center: ['50%', '42%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    formatter: '{b}\n{d}%'
                },
                data: eventRows
            }
        ]
    };

    // 最新城市事件表格列
    const eventColumns: TableColumnsType<CityEvent> = [
        {
            title: '城市',
            key: 'city',
            render: (_, record) => record.city?.name ?? '-',
        },
        {
            title: '事件',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: '类型',
            dataIndex: 'eventType',
            key: 'eventType',
        },
        {
            title: '级别',
            dataIndex: 'severity',
            key: 'severity',
            render: (value: string) => {
                const colorMap: Record<string, string> = {
                    紧急: 'red',
                    高: 'orange',
                    中: 'blue',
                    低: 'default',
                };
                return <Tag color={colorMap[value] ?? 'default'}>{value}</Tag>;
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (value: string) => {
                const colorMap: Record<string, string> = {
                    待处理: 'gold',
                    处理中: 'blue',
                    已处理: 'green',
                };
                return <Tag color={colorMap[value] ?? 'default'}>{value}</Tag>;
            },
        },
        {
            title: '上报时间',
            dataIndex: 'reportedAt',
            key: 'reportedAt',
            render: (value: string) => value ? value.slice(0, 16) : '-',
        },
    ];

    // 数据颜色判断
    function getLevel(metric: string, rawValue: unknown): MetricLevel {
        const value = Number(rawValue);

        // 接口数据为空或不是数字时
        if (!Number.isFinite(value)) return 'yellow';
        switch (metric) {
            // 监测覆盖城市数量
            case 'totalCities':
                if (value >= 20) return 'green';
                if (value >= 10) return 'yellow';
                return 'red';

            // 拥堵指数
            case 'avgCongestionIndex':
                if (value <= 4) return 'green';
                if (value <= 6) return 'yellow';
                return 'red';

            // AQI
            case 'avgAqi':
                if (value <= 50) return 'green';
                if (value <= 100) return 'yellow';
                return 'red';

            // 待处理事件
            case 'pendingEvents':
                if (value < 500) return 'green';
                if (value < 1000) return 'yellow';
                return 'red';

            // 事件处理率
            case 'eventProcessRate':
                if (value >= 30) return 'green';
                if (value >= 20) return 'yellow';
                return 'red';

            // PM2.5
            case 'avgPM25':
                if (value <= 35) return 'green';
                if (value <= 75) return 'yellow';
                return 'red';

            // 平均气温
            case 'avgTemperature':
                if (value >= 18 && value <= 26) return 'green';
                if (value >= 10 && value <= 32) return 'yellow';
                return 'red';

            // 今日事件
            case 'todayEvents':
                if (value < 1000) return 'green';
                if (value < 3000) return 'yellow';
                return 'red';

            default:
                return 'yellow';
        }
    }
    // 数据状态判断
    function getStatus(metric: string, rawValue: unknown) {
        const value = Number(rawValue);

        // 接口数据为空或不是数字时
        if (!Number.isFinite(value)) return '未知';
        switch (metric) {
            // 监测覆盖城市数量
            case 'totalCities':
                if (value >= 20) return '全覆盖';
                if (value >= 10) return '覆盖较广';
                return '覆盖过少';

            // 拥堵指数
            case 'avgCongestionIndex':
                if (value <= 4) return '畅通';
                if (value <= 6) return '较拥堵';
                return '拥堵严重';

            // AQI
            case 'avgAqi':
                if (value <= 50) return '优';
                if (value <= 100) return '良好';
                return '差';

            // 待处理事件
            case 'pendingEvents':
                if (value <= 200) return '关注度达标';
                if (value <= 500) return '关注度尚可';
                return '急需关注';

            // 事件处理率
            case 'eventProcessRate':
                if (value >= 30) return '处理速度达标';
                if (value >= 20) return '处理速度尚可';
                return '需加快处理速度';

            default:
                return '未知';
        }
    }
    // 前缀样式判断
    function getPrefix(metric: string, rawValue: unknown) {
        if (getLevel(metric, rawValue) === 'red') return <WarningOutlined />
        if (getLevel(metric, rawValue) === 'yellow') return <ExclamationCircleOutlined />
        if (getLevel(metric, rawValue) === 'green') return <CheckCircleOutlined />
    }

    const fetchData = useCallback(async () => {
        try {
            const [overview, traffic, stats, facility] = await Promise.all([
                citiesService.OverviewInfo(),
                citiesService.TrafficInfo(),
                citiesService.StatsInfo(),
                citiesService.FacilityInfo(),
            ])
            setOverview(overview.data as CityOverview);
            setTraffic(traffic.data as TrafficRankingItem[]);
            setStats(stats.data as EventStatsData);
            setFacility(facility.data as FacilityStat[]);
        } catch {
            throw new Error;
        }
    }, [])

    // 按当前页码请求城市事件，分页器切换页码时会重新执行
    const fetchEvents = useCallback(async () => {
        setEventLoading(true);
        try {
            const response = await citiesService.EventsInfo({
                page: eventPage,
                pageSize: eventPageSize,
            });
            setEvents(response.data as EventsData);
        } catch {
            throw new Error;
        } finally {
            setEventLoading(false);
        }
    }, [eventPage])

    // 手动刷新只重新请求仪表盘数据，不刷新整个页面
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchData(), fetchEvents()]);
            messageApi.success('刷新成功');
        } catch {
            messageApi.error('刷新失败，请稍后重试');
        } finally {
            setRefreshing(false);
        }
    };

    console.log(stats)

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchData().catch(() => messageApi.error('仪表盘数据加载失败，请稍后重试'));
        }, 0);
        return () => window.clearTimeout(timer);
    }, [fetchData, messageApi])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchEvents().catch(() => messageApi.error('事件数据加载失败，请稍后重试'));
        }, 0);
        return () => window.clearTimeout(timer);
    }, [fetchEvents, messageApi])

    useEffect(() => {
        const timer = setInterval(() => {
            void fetchData().catch(() => undefined);
            void fetchEvents().catch(() => undefined);
        }, 1000 * 60 * 5)
        return () => clearInterval(timer)
    }, [fetchData, fetchEvents])

    return (
        <>
            {contextHolder}
            <div className="dashboard-page-content">
            <header className="dashboard-header">
                <div className="dashboard-head-left">
                    <h2 style={{ margin: 0 }}>智慧城市运行总览</h2>
                    <div style={{ color: '#959698' }}>{`全国重点城市实时监测数据 · ${year}年${month}月${date}日星期${weekDays[day]}`}</div>
                </div>
                <div className="dashboard-head-right">
                    <Button color="default" variant="outlined" size='small' loading={exporting === 'cities'} onClick={() => handleExport('cities')}>导出城市</Button>
                    <Button color="default" variant="outlined" size='small' loading={exporting === 'events'} onClick={() => handleExport('events')}>导出事件</Button>
                    <Button color="default" variant="outlined" size='small' onClick={() => navigate('/dashboards')}><DashboardOutlined />管理仪表盘</Button>
                    <Popover content='每五分钟自动刷新'>
                        <span style={{ fontSize: 12, color: '#959698' }}>自动刷新<QuestionCircleOutlined /></span>
                    </Popover>
                    <Button color="default" variant="outlined" loading={refreshing} onClick={handleRefresh}><ReloadOutlined />刷新</Button>
                </div>
            </header>
            <main>
                <Row gutter={10}>
                    {newOverview.map((item, index) => (
                        <Col xs={24} sm={12} md={8} lg={6} xl={3} key={index} span={6}>
                            <div className={classNames.root}>
                                <Statistic
                                    title={item.title}
                                    value={item.value ?? '-'}
                                    prefix={
                                        <span style={{ color: levelColor[item.level] }}>
                                            {item.prefix}
                                        </span>
                                    }
                                    suffix={
                                        <span style={{ color: levelColor[item.level] }}>
                                            {item.suffix}
                                        </span>
                                    }
                                    styles={{ content: { color: levelColor[item.level] } }}
                                />
                                {item.status ? (
                                    <div style={{ color: levelColor[item.level], fontSize: 12, marginTop: 8 }}>
                                        {item.status}
                                    </div>
                                ) : null}
                            </div>
                        </Col>
                    ))}
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                        <Card title="🏢 公共设施分布">
                            {
                                barOption ? <ChartRender option={barOption} height={'250px'} /> : <div>暂无数据</div>
                            }
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} md={12}>
                        <Card title="🚦 城市交通拥堵排行">
                            {
                                trafficRows.length ? <ChartRender option={trafficOption} height={'300px'} /> : <div>暂无数据</div>
                            }
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card title="🚨 城市事件类型分布">
                            {
                                eventRows.length ? <ChartRender option={eventOption} height={'300px'} /> : <div>暂无数据</div>
                            }
                        </Card>
                    </Col>
                </Row>

                <Row>
                    <Col span={24}>
                        <Card
                            title="📋 最新城市事件"
                            extra={`共 ${events.total} 条`}
                        >
                            <Table<CityEvent>
                                rowKey="id"
                                columns={eventColumns}
                                dataSource={events.list}
                                loading={eventLoading}
                                pagination={{
                                    current: eventPage,
                                    pageSize: eventPageSize,
                                    total: events.total,
                                    showSizeChanger: false,
                                }}
                                onChange={(pagination) => {
                                    setEventPage(pagination.current ?? 1);
                                }}
                            />
                        </Card>
                    </Col>
                </Row>
            </main>
            </div>
        </>
    )
}

export default Dashboard;
