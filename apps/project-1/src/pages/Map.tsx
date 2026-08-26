import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import {
    Alert,
    Card,
    Col,
    Empty,
    Row,
    Segmented,
    Spin,
    Statistic,
    theme,
} from 'antd';
import {
    CheckCircleOutlined,
    CloudOutlined,
    EnvironmentOutlined,
    NodeIndexOutlined,
    RiseOutlined,
    TeamOutlined,
    WarningOutlined,
} from '@ant-design/icons';
import { citiesService } from '@/api/cities';
import { getApiErrorMessage } from '@/utils/errors';
import {
    calculateCityStats,
    calculateEnvironmentStats,
    getAqiMeta,
    normalizeLatestEnvironment,
    normalizeMapCities,
} from '@/utils/mapData';
import type { MapCity, MapEnvironment } from '@/utils/mapData';
import '@/css/Map.css';

type MapMode = 'city' | 'environment';
type MapPosition = [number, number] | AMapPosition;

interface AMapPosition {
    getLng?: () => number;
    getLat?: () => number;
}

interface AMapInstance {
    destroy: () => void;
    resize: () => void;
    setZoomAndCenter: (zoom: number, center: MapPosition) => void;
}

interface AMapOverlay {
    setMap: (map: AMapInstance | null) => void;
    on: (eventName: 'click', handler: () => void) => void;
    off: (eventName: 'click', handler: () => void) => void;
}

interface AMapMarker extends AMapOverlay {
    getPosition: () => MapPosition;
}

interface AMapCircle extends AMapOverlay {
    getCenter: () => MapPosition;
}

interface AMapInfoWindow {
    setContent: (content: HTMLElement) => void;
    open: (map: AMapInstance, position: MapPosition) => void;
    close: () => void;
}

interface AMapNamespace {
    Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapInstance;
    Marker: new (options: Record<string, unknown>) => AMapMarker;
    Circle: new (options: Record<string, unknown>) => AMapCircle;
    InfoWindow: new (options?: Record<string, unknown>) => AMapInfoWindow;
}

interface OverlayBinding {
    overlay: AMapOverlay;
    handler: () => void;
}

interface CityEnvironment {
    city: MapCity;
    environment: MapEnvironment;
}

const BEIJING_CENTER: [number, number] = [116.397428, 39.90923];
const INITIAL_ZOOM = 11;
const DETAIL_ZOOM = 12;
const ENVIRONMENT_CITY_LIMIT = 10;
const MAP_KEY = import.meta.env.VITE_AMAP_KEY?.trim();
const SECURITY_KEY = import.meta.env.VITE_AMAP_SECURITY_KEY?.trim();
const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 });

let amapSdkPromise: Promise<AMapNamespace> | null = null;

const loadAmapSdk = () => {
    if (!MAP_KEY || !SECURITY_KEY) {
        return Promise.reject(new Error('高德地图 Key 或安全码未配置'));
    }

    if (!amapSdkPromise) {
        amapSdkPromise = AMapLoader.load({
            key: MAP_KEY,
            version: '2.0',
        }) as Promise<AMapNamespace>;
        amapSdkPromise = amapSdkPromise.catch((error) => {
            amapSdkPromise = null;
            throw error;
        });
    }

    return amapSdkPromise;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
}[character] ?? character));

const createCityLabel = (name: string) => (
    `<span class="map-city-label">${escapeHtml(name)}</span>`
);

const createInfoContent = (
    title: string,
    rows: Array<[string, string]>,
    badge?: { text: string; color: string },
) => {
    const content = document.createElement('section');
    content.className = 'map-info-window';

    const heading = document.createElement('div');
    heading.className = 'map-info-window__heading';

    const headingText = document.createElement('strong');
    headingText.textContent = title;
    heading.appendChild(headingText);

    if (badge) {
        const badgeElement = document.createElement('span');
        badgeElement.className = 'map-info-window__badge';
        badgeElement.style.color = badge.color;
        badgeElement.style.backgroundColor = `${badge.color}18`;
        badgeElement.textContent = badge.text;
        heading.appendChild(badgeElement);
    }

    content.appendChild(heading);

    const details = document.createElement('div');
    details.className = 'map-info-window__details';
    rows.forEach(([label, value]) => {
        const row = document.createElement('p');
        row.textContent = `${label}：${value}`;
        details.appendChild(row);
    });
    content.appendChild(details);

    return content;
};

const statisticCard = (
    title: string,
    value: number | string,
    icon: ReactNode,
    color: string,
    suffix?: string,
) => (
    <Card className="map-stat-card" size="small">
        <Statistic
            title={title}
            value={value}
            prefix={icon}
            suffix={suffix}
            groupSeparator=","
            styles={{ content: { color, fontSize: 20 } }}
        />
    </Card>
);

export default function MapPage() {
    const { token } = theme.useToken();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<AMapInstance | null>(null);
    const infoWindowRef = useRef<AMapInfoWindow | null>(null);
    const overlayBindingsRef = useRef<OverlayBinding[]>([]);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    const [mode, setMode] = useState<MapMode>('city');
    const [amap, setAmap] = useState<AMapNamespace | null>(null);
    const [mapGeneration, setMapGeneration] = useState(0);
    const [sdkLoading, setSdkLoading] = useState(true);
    const [sdkError, setSdkError] = useState('');
    const [cities, setCities] = useState<MapCity[]>([]);
    const [cityLoading, setCityLoading] = useState(true);
    const [cityError, setCityError] = useState('');
    const [environments, setEnvironments] = useState<CityEnvironment[]>([]);
    const [environmentLoading, setEnvironmentLoading] = useState(true);
    const [environmentFailureCount, setEnvironmentFailureCount] = useState(0);

    const clearOverlays = useCallback(() => {
        infoWindowRef.current?.close();
        overlayBindingsRef.current.forEach(({ overlay, handler }) => {
            overlay.off('click', handler);
            overlay.setMap(null);
        });
        overlayBindingsRef.current = [];
    }, []);

    useEffect(() => {
        let active = true;

        loadAmapSdk()
            .then((namespace) => {
                if (!active) return;
                setAmap(namespace);
                setSdkError('');
            })
            .catch((error: unknown) => {
                if (!active) return;
                setSdkError(getApiErrorMessage(error, '高德地图加载失败，请检查配置和网络'));
            })
            .finally(() => {
                if (active) setSdkLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const requestData = async () => {
            setCityLoading(true);
            setCityError('');

            try {
                const response = await citiesService.List();
                if (response.code !== 200) throw new Error(response.message || '城市数据加载失败');

                const cityRows = normalizeMapCities(response.data);
                if (!active) return;
                setCities(cityRows);
                setCityLoading(false);

                const environmentCities = cityRows.slice(0, ENVIRONMENT_CITY_LIMIT);
                const results = await Promise.allSettled(
                    environmentCities.map(async (city) => {
                        const environmentResponse = await citiesService.Environment(city.id);
                        if (environmentResponse.code !== 200) {
                            throw new Error(environmentResponse.message || `${city.name}环境数据加载失败`);
                        }
                        const environment = normalizeLatestEnvironment(environmentResponse.data);
                        return environment ? { city, environment } : null;
                    }),
                );

                if (!active) return;
                const successful: CityEnvironment[] = [];
                let failedCount = 0;
                results.forEach((result) => {
                    if (result.status === 'fulfilled' && result.value) {
                        successful.push(result.value);
                    } else {
                        failedCount += 1;
                    }
                });
                setEnvironments(successful);
                setEnvironmentFailureCount(failedCount);
            } catch (error: unknown) {
                if (!active) return;
                setCityError(getApiErrorMessage(error, '城市数据加载失败'));
                setCities([]);
                setEnvironments([]);
            } finally {
                if (active) {
                    setCityLoading(false);
                    setEnvironmentLoading(false);
                }
            }
        };

        void requestData();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const container = mapContainerRef.current;
        if (!amap || !container || mapRef.current) return;

        const map = new amap.Map(container, {
            zoom: INITIAL_ZOOM,
            center: BEIJING_CENTER,
            mapStyle: 'amap://styles/light',
            resizeEnable: true,
        });
        const infoWindow = new amap.InfoWindow({ offset: [0, -24] });

        mapRef.current = map;
        infoWindowRef.current = infoWindow;
        resizeObserverRef.current = new ResizeObserver(() => map.resize());
        resizeObserverRef.current.observe(container);
        setMapGeneration((generation) => generation + 1);

        return () => {
            clearOverlays();
            resizeObserverRef.current?.disconnect();
            resizeObserverRef.current = null;
            infoWindow.close();
            infoWindowRef.current = null;
            map.destroy();
            mapRef.current = null;
        };
    }, [amap, clearOverlays]);

    useEffect(() => {
        const map = mapRef.current;
        const infoWindow = infoWindowRef.current;
        if (!amap || !map || !infoWindow || mapGeneration === 0) return;

        clearOverlays();
        map.setZoomAndCenter(INITIAL_ZOOM, BEIJING_CENTER);

        if (mode === 'city') {
            cities.forEach((city) => {
                const marker = new amap.Marker({
                    position: [city.lng, city.lat],
                    label: {
                        content: createCityLabel(city.name),
                        direction: 'bottom',
                        offset: [0, 10],
                    },
                });
                const handler = () => {
                    infoWindow.setContent(createInfoContent(city.name, [
                        ['省份', city.province],
                        ['人口', `${numberFormatter.format(city.population)} 万人`],
                        ['面积', `${numberFormatter.format(city.area)} km²`],
                        ['GDP', `${numberFormatter.format(city.gdp)} 亿元`],
                    ]));
                    infoWindow.open(map, marker.getPosition());
                    map.setZoomAndCenter(DETAIL_ZOOM, marker.getPosition());
                };
                marker.on('click', handler);
                marker.setMap(map);
                overlayBindingsRef.current.push({ overlay: marker, handler });
            });
        } else {
            environments.forEach(({ city, environment }) => {
                const aqiMeta = getAqiMeta(environment.aqi);
                const circle = new amap.Circle({
                    center: [city.lng, city.lat],
                    radius: aqiMeta.radius,
                    fillColor: aqiMeta.color,
                    fillOpacity: 0.3,
                    strokeColor: aqiMeta.color,
                    strokeWeight: 3,
                    zIndex: 10,
                });
                const handler = () => {
                    infoWindow.setContent(createInfoContent(`${city.name}环境`, [
                        ['AQI', numberFormatter.format(environment.aqi)],
                        ['PM2.5', environment.pm25 === null ? '暂无数据' : `${numberFormatter.format(environment.pm25)} μg/m³`],
                        ['天气', environment.weather],
                    ], {
                        text: aqiMeta.label,
                        color: aqiMeta.color,
                    }));
                    infoWindow.open(map, circle.getCenter());
                    map.setZoomAndCenter(DETAIL_ZOOM, circle.getCenter());
                };
                circle.on('click', handler);
                circle.setMap(map);
                overlayBindingsRef.current.push({ overlay: circle, handler });
            });
        }

        return clearOverlays;
    }, [amap, cities, clearOverlays, environments, mapGeneration, mode]);

    const cityStats = useMemo(() => calculateCityStats(cities), [cities]);
    const environmentStats = useMemo(
        () => calculateEnvironmentStats(environments.map((item) => item.environment)),
        [environments],
    );

    const mapState = useMemo(() => {
        if (sdkError) return { type: 'error' as const, title: '地图加载失败', description: sdkError };
        if (cityError) return { type: 'error' as const, title: '数据加载失败', description: cityError };
        if (sdkLoading || cityLoading) return { type: 'loading' as const, description: '正在加载地图和城市数据…' };
        if (!cities.length) return { type: 'empty' as const, description: '暂无有效城市坐标' };
        if (mode === 'environment' && environmentLoading) {
            return { type: 'loading' as const, description: '正在加载环境监测数据…' };
        }
        if (mode === 'environment' && !environments.length) {
            return { type: 'empty' as const, description: '暂无可展示的环境监测数据' };
        }
        return null;
    }, [cities.length, cityError, cityLoading, environmentLoading, environments.length, mode, sdkError, sdkLoading]);

    const pageStyle = {
        '--map-border': token.colorBorderSecondary,
        '--map-panel': token.colorBgContainer,
        '--map-text': token.colorText,
        '--map-muted': token.colorTextSecondary,
        '--map-shadow': token.boxShadowTertiary,
    } as CSSProperties;

    return (
        <section className="map-page" style={pageStyle}>
            <div className="map-toolbar">
                <Segmented
                    value={mode}
                    onChange={(value) => setMode(value as MapMode)}
                    options={[
                        { icon: <EnvironmentOutlined />, label: '城市标记', value: 'city' },
                        { icon: <NodeIndexOutlined />, label: '环境监测', value: 'environment' },
                    ]}
                />
                <span className="map-toolbar__hint">点击标记查看详情 · 滚轮缩放 · 拖动浏览</span>
            </div>

            {mode === 'city' ? (
                <Row className="map-stat-grid" gutter={[12, 12]}>
                    <Col xs={24} sm={8}>
                        {statisticCard('覆盖城市', cityStats.cityCount, <EnvironmentOutlined />, '#1677ff')}
                    </Col>
                    <Col xs={24} sm={8}>
                        {statisticCard('总人口（万）', Math.round(cityStats.totalPopulation), <TeamOutlined />, '#52c41a')}
                    </Col>
                    <Col xs={24} sm={8}>
                        {statisticCard('总 GDP（亿）', Math.round(cityStats.totalGdp), <RiseOutlined />, '#fa8c16')}
                    </Col>
                </Row>
            ) : (
                <Row className="map-stat-grid" gutter={[12, 12]}>
                    <Col xs={12} md={6}>
                        {statisticCard('监测城市', environmentStats.monitoredCount, <EnvironmentOutlined />, '#1677ff')}
                    </Col>
                    <Col xs={12} md={6}>
                        {statisticCard(
                            '平均 AQI',
                            environmentStats.averageAqi ?? '--',
                            <CloudOutlined />,
                            environmentStats.averageAqi !== null
                                ? getAqiMeta(environmentStats.averageAqi).color
                                : token.colorTextDisabled,
                        )}
                    </Col>
                    <Col xs={12} md={6}>
                        {statisticCard('空气优良', environmentStats.excellentCount, <CheckCircleOutlined />, '#52c41a', '城')}
                    </Col>
                    <Col xs={12} md={6}>
                        {statisticCard('污染城市', environmentStats.pollutedCount, <WarningOutlined />, '#ff4d4f', '城')}
                    </Col>
                </Row>
            )}

            {mode === 'environment' && environmentFailureCount > 0 ? (
                <Alert
                    className="map-partial-alert"
                    type="warning"
                    showIcon
                    title={`${environmentFailureCount} 个城市环境数据获取失败，已展示其余可用数据`}
                />
            ) : null}

            <Card className="map-stage" styles={{ body: { padding: 0, height: '100%' } }}>
                <div ref={mapContainerRef} className="map-stage__canvas" aria-label="城市地图" />
                {mapState ? (
                    <div className="map-stage__state">
                        {mapState.type === 'loading' ? (
                            <div className="map-state-loading">
                                <Spin size="large" />
                                <span>{mapState.description}</span>
                            </div>
                        ) : mapState.type === 'empty' ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={mapState.description} />
                        ) : (
                            <Alert
                                type="error"
                                showIcon
                                title={mapState.title}
                                description={mapState.description}
                            />
                        )}
                    </div>
                ) : null}
            </Card>
        </section>
    );
}
