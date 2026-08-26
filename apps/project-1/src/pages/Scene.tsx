import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { Alert, Button, Empty, Spin, theme } from 'antd';
import { CompassOutlined, ReloadOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import { useSelector } from 'react-redux';
import { citiesService } from '@/api/cities';
import type { CityRecord } from '@/api/cities';
import type { PaginatedData } from '@/types';
import type { RootState } from '@/store';
import { getApiErrorMessage } from '@/utils/errors';
import '@/css/Scene.css';

type SceneCity = {
    id: number;
    name: string;
    population: number;
};

type HoverInfo = Pick<SceneCity, 'name' | 'population'>;

type ScenePalette = {
    backgroundStart: string;
    backgroundMiddle: string;
    backgroundEnd: string;
    fog: string;
    floor: string;
    disc: string;
    gridMajor: string;
    gridMinor: string;
    label: string;
    labelActive: string;
};

type RingProps = {
    x: number;
    y: number;
    z: number;
    inner: number;
    outer: number;
    segments: number;
    color: string;
    opacity: number;
};

type CityBarProps = {
    city: SceneCity;
    angle: number;
    height: number;
    color: string;
    delay: number;
    palette: ScenePalette;
    onHover: (city: HoverInfo) => void;
    onLeave: () => void;
};

const FLOOR_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
const BAR_COLORS = [
    '#ff5d6c',
    '#ff9f43',
    '#d7df23',
    '#35c97a',
    '#29b6d8',
    '#4f7cff',
    '#8b6ee8',
    '#e55ea2',
    '#1da7a0',
    '#f4c542',
];
const MAX_CITY_COUNT = 20;
const RING_RADIUS = 5;
const MAX_BAR_HEIGHT = 7;

const hasList = (data: CityRecord[] | PaginatedData<CityRecord>): data is PaginatedData<CityRecord> => (
    !Array.isArray(data) && Array.isArray(data.list)
);

const normalizeCities = (data: CityRecord[] | PaginatedData<CityRecord>): SceneCity[] => {
    const rows = Array.isArray(data) ? data : hasList(data) ? data.list : [];
    return rows
        .map((city) => ({
            id: Number(city.id),
            name: String(city.name ?? '').trim(),
            population: city.population === '' || city.population === null
                ? Number.NaN
                : Number(city.population),
        }))
        .filter((city) => (
            Number.isInteger(city.id)
            && city.id > 0
            && city.name.length > 0
            && Number.isFinite(city.population)
            && city.population >= 0
        ))
        .sort((first, second) => second.population - first.population)
        .slice(0, MAX_CITY_COUNT);
};

const supportsWebGL = () => {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
};

const requestSceneCities = async () => {
    const response = await citiesService.List();
    if (response.code !== 200) throw new Error(response.message || '城市数据加载失败');
    return normalizeCities(response.data);
};

function Ring({ x, y, z, inner, outer, segments, color, opacity }: RingProps) {
    return (
        <mesh position={[x, y, z]} rotation={FLOOR_ROTATION}>
            <ringGeometry args={[inner, outer, segments]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                depthWrite={false}
            />
        </mesh>
    );
}

function CityBar({ city, angle, height, color, delay, palette, onHover, onLeave }: CityBarProps) {
    const [hovered, setHovered] = useState(false);
    const groupRef = useRef<THREE.Group>(null);
    const elapsedRef = useRef(0);
    const animationDoneRef = useRef(false);
    const width = 0.62;
    const x = Math.cos(angle) * RING_RADIUS;
    const z = Math.sin(angle) * RING_RADIUS;

    useFrame((_, delta) => {
        if (!groupRef.current || animationDoneRef.current) return;
        elapsedRef.current += delta;
        const scale = THREE.MathUtils.smoothstep((elapsedRef.current - delay) / 0.55, 0, 1);
        groupRef.current.scale.y = scale;
        if (scale >= 0.999) {
            groupRef.current.scale.y = 1;
            animationDoneRef.current = true;
        }
    });

    const handlePointerOver = (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        setHovered(true);
        onHover(city);
    };

    const handlePointerOut = (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        setHovered(false);
        onLeave();
    };

    return (
        <group ref={groupRef}>
            <Ring x={x} y={0.04} z={z} inner={0.3} outer={0.46} segments={6} color={color} opacity={0.34} />
            <RoundedBox
                args={[width, height, width]}
                radius={0.11}
                smoothness={4}
                position={[x, height / 2, z]}
                onPointerOver={handlePointerOver}
                onPointerOut={handlePointerOut}
            >
                <meshPhysicalMaterial
                    color={color}
                    roughness={0.27}
                    metalness={0.12}
                    clearcoat={0.38}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.72 : 0.14}
                />
            </RoundedBox>
            <Ring
                x={x}
                y={height + 0.04}
                z={z}
                inner={0.22}
                outer={0.3}
                segments={32}
                color={color}
                opacity={hovered ? 0.8 : 0.42}
            />
            {hovered ? (
                <mesh position={[x, height / 2, z]}>
                    <cylinderGeometry args={[width * 0.86, width * 0.86, height, 32, 1, true]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.14}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            ) : null}
            <Html position={[x, -0.43, z]} center style={{ pointerEvents: 'none' }}>
                <span className="scene-city-label" style={{ color: hovered ? palette.labelActive : palette.label }}>
                    {city.name}
                </span>
            </Html>
            <Html position={[x, height + 0.43, z]} center style={{ pointerEvents: 'none' }}>
                <span className="scene-value-label" style={{ color: hovered ? palette.labelActive : palette.label }}>
                    {city.population.toLocaleString('zh-CN')}
                </span>
            </Html>
        </group>
    );
}

function SceneSetup({ palette }: { palette: ScenePalette }) {
    const backgroundTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        if (!context) return new THREE.Texture();
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, palette.backgroundStart);
        gradient.addColorStop(0.48, palette.backgroundMiddle);
        gradient.addColorStop(1, palette.backgroundEnd);
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }, [palette.backgroundEnd, palette.backgroundMiddle, palette.backgroundStart]);

    useEffect(() => {
        return () => {
            backgroundTexture.dispose();
        };
    }, [backgroundTexture]);

    return (
        <>
            <primitive attach="background" object={backgroundTexture} />
            <fog attach="fog" args={[palette.fog, 14, 42]} />
            <ambientLight intensity={0.58} />
            <directionalLight position={[8, 12, 4]} intensity={0.75} />
            <directionalLight position={[-5, 6, -5]} intensity={0.24} color="#66a3ff" />
            <hemisphereLight args={['#ffffff', palette.fog, 0.48]} />

            <mesh position={[0, -0.01, 0]} rotation={FLOOR_ROTATION}>
                <ringGeometry args={[1.55, 7.45, 72]} />
                <meshBasicMaterial
                    color={palette.disc}
                    transparent
                    opacity={0.56}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
            <mesh position={[0, -0.035, 0]} rotation={FLOOR_ROTATION}>
                <planeGeometry args={[25, 25]} />
                <meshStandardMaterial color={palette.floor} roughness={1} metalness={0} />
            </mesh>
            <gridHelper args={[24, 30, palette.gridMajor, palette.gridMinor]} />

            <OrbitControls
                enableDamping
                dampingFactor={0.08}
                minPolarAngle={0.24}
                maxPolarAngle={Math.PI / 2.25}
                minDistance={5}
                maxDistance={20}
                target={[0, 2.2, 0]}
            />
        </>
    );
}

function Scene() {
    const { token } = theme.useToken();
    const mode = useSelector((state: RootState) => state.themeSlice.mode);
    const [cities, setCities] = useState<SceneCity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [webglAvailable] = useState(() => supportsWebGL());

    const palette = useMemo<ScenePalette>(() => mode === 'dark' ? {
        backgroundStart: '#182238',
        backgroundMiddle: '#101827',
        backgroundEnd: '#090e18',
        fog: '#101827',
        floor: '#101827',
        disc: '#25334d',
        gridMajor: '#30405e',
        gridMinor: '#1d2940',
        label: '#aebbd0',
        labelActive: '#ffffff',
    } : {
        backgroundStart: '#ffffff',
        backgroundMiddle: '#eff5fb',
        backgroundEnd: '#dfe8f2',
        fog: '#dfe8f2',
        floor: '#f7f9fc',
        disc: '#dce6f0',
        gridMajor: '#d6e0eb',
        gridMinor: '#e7edf4',
        label: '#65758b',
        labelActive: '#172033',
    }, [mode]);

    const loadCities = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setCities(await requestSceneCities());
        } catch (loadError) {
            setCities([]);
            setError(getApiErrorMessage(loadError, '城市数据加载失败，请稍后重试'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        void requestSceneCities()
            .then((data) => {
                if (!cancelled) setCities(data);
            })
            .catch((loadError) => {
                if (!cancelled) setError(getApiErrorMessage(loadError, '城市数据加载失败，请稍后重试'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const maxPopulation = useMemo(() => (
        cities.reduce((maximum, city) => Math.max(maximum, city.population), 1)
    ), [cities]);

    const pageStyle = {
        '--scene-panel': token.colorBgContainer,
        '--scene-border': token.colorBorderSecondary,
        '--scene-text': token.colorText,
        '--scene-text-secondary': token.colorTextSecondary,
        '--scene-primary': token.colorPrimary,
        '--scene-shadow': mode === 'dark' ? '0 20px 50px rgba(0, 0, 0, 0.3)' : '0 20px 50px rgba(31, 69, 118, 0.1)',
    } as CSSProperties;

    const renderStage = () => {
        if (!webglAvailable) {
            return (
                <div className="scene-state">
                    <Alert
                        type="warning"
                        showIcon
                        title="当前浏览器无法使用 WebGL"
                        description="请开启浏览器硬件加速，或更换支持 WebGL 的浏览器后重试。"
                    />
                </div>
            );
        }
        if (loading) {
            return (
                <div className="scene-state scene-state--loading">
                    <Spin size="large" />
                </div>
            );
        }
        if (error) {
            return (
                <div className="scene-state">
                    <Alert
                        type="error"
                        showIcon
                        title="3D 场景数据加载失败"
                        description={error}
                        action={<Button icon={<ReloadOutlined />} onClick={() => void loadCities()}>重试</Button>}
                    />
                </div>
            );
        }
        if (!cities.length) {
            return (
                <div className="scene-state">
                    <Empty description="暂无可用于 3D 展示的城市人口数据" />
                </div>
            );
        }

        return (
            <>
                {hoverInfo ? (
                    <div className="scene-hover-card" aria-live="polite">
                        <span>当前城市</span>
                        <strong>{hoverInfo.name}</strong>
                        <b>{hoverInfo.population.toLocaleString('zh-CN')} <small>万人</small></b>
                    </div>
                ) : null}
                <Canvas
                    camera={{ position: [0, 12.5, 13.5], fov: 50 }}
                    dpr={[1, 1.5]}
                    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                >
                    <Suspense fallback={<Html center><span className="scene-canvas-loading">场景加载中...</span></Html>}>
                        <SceneSetup palette={palette} />
                        {cities.map((city, index) => {
                            const angle = (index / cities.length) * Math.PI * 2 - Math.PI / 2;
                            const height = Math.max((city.population / maxPopulation) * MAX_BAR_HEIGHT, 0.42);
                            return (
                                <CityBar
                                    key={city.id}
                                    city={city}
                                    angle={angle}
                                    height={height}
                                    color={BAR_COLORS[index % BAR_COLORS.length]}
                                    delay={index * 0.045}
                                    palette={palette}
                                    onHover={setHoverInfo}
                                    onLeave={() => setHoverInfo(null)}
                                />
                            );
                        })}
                    </Suspense>
                </Canvas>
            </>
        );
    };

    return (
        <section className="scene-page" style={pageStyle}>
            <div className="scene-stage">
                <div className="scene-stage__bar">
                    <div>
                        <i />
                        <span>柱高代表人口规模</span>
                    </div>
                    <span><CompassOutlined /> 拖拽旋转 · 滚轮缩放 · 悬停查看</span>
                </div>
                <div className="scene-stage__canvas">
                    {renderStage()}
                </div>
            </div>
        </section>
    );
}

export default Scene;
