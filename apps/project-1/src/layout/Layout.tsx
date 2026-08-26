import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { HomeOutlined, DownOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, DashboardOutlined, DatabaseOutlined, LineChartOutlined, FundViewOutlined, EnvironmentOutlined, BarChartOutlined, RobotOutlined, SettingOutlined, SafetyOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme, Flex, Breadcrumb, Dropdown, Space, Avatar, Switch } from 'antd';
import type { MenuProps } from 'antd';
import type { RootState } from '@/store';
import './index.css'
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthority } from '@/hooks/useAuthority';
import { logout } from '@/store/slice/authSlice';
import { setTheme } from '@/store/slice/themeSlice';

const { Header, Sider, Content } = Layout;

interface AppMenuItem {
    key: string;
    icon?: ReactNode;
    label: string;
    roles?: string[];
    children?: AppMenuItem[];
    disabled?: boolean;
}

// 菜单配置
const ALL_MENUS: AppMenuItem[] = [
    {
        key: '/',
        icon: <DashboardOutlined />,
        label: '仪表盘',
        roles: ['super_admin', 'admin', 'analyst', 'user']
    },
    {
        key: 'data',
        icon: <DatabaseOutlined />,
        label: '数据管理',
        roles: ['super_admin', 'admin', 'analyst'],
        children: [
            {
                key: '/dashboards',
                icon: <DashboardOutlined />,
                label: '仪表盘管理',
            },
            {
                key: '/chart',
                icon: <LineChartOutlined />,
                label: '图表管理',
            }
        ]
    },
    {
        key: 'visible',
        icon: <FundViewOutlined />,
        label: '可视化',
        roles: ['super_admin', 'admin', 'analyst', 'user'],
        children: [
            {
                key: '/map',
                icon: <EnvironmentOutlined />,
                label: '地图管理',
            },
            {
                key: '/scene',
                icon: <BarChartOutlined />,
                label: '3D视图',
            }
        ]
    },
    {
        key: '/ai',
        icon: <RobotOutlined />,
        label: 'AI 助手',
        roles: ['super_admin', 'admin', 'analyst', 'user'],
    },
    {
        key: 'system',
        icon: <SettingOutlined />,
        label: '系统管理',
        roles: ['super_admin', 'admin'],
        children: [
            {
                key: '/users',
                icon: <UserSwitchOutlined />,
                label: '用户管理',
            },
            {
                key: '/roles',
                icon: <SafetyOutlined />,
                label: '角色权限',
            }
        ]
    },
    {
        key: '/profile',
        icon: <UserOutlined />,
        label: '个人中心',
        roles: ['super_admin', 'admin', 'analyst', 'user'],
    },
]

// 自动推导权限
const getPermissionByKey = (key: string) => {
    // 首页路径比较特殊
    if (key === '/' || key === '/dashboard') {
        return 'dashboard:view'
    }
    return `${key.replace('/', '')}:view`
}

// 按角色过滤菜单项
const filterMenus = (menus: AppMenuItem[], code?: string) => {
    return menus.filter((item) => !item.roles || Boolean(code && item.roles.includes(code)))
}

// 为菜单设置禁用项
const setMenuDisabled = (menus: AppMenuItem[], hasAuthority: (permission: string) => boolean): AppMenuItem[] => {
    return menus.map(item => {
        // 一级菜单，只递归处理它的二级菜单
        if (item.children) {
            return {
                ...item,
                children: setMenuDisabled(item.children, hasAuthority),
            }
        }
        const permission = getPermissionByKey(item.key)

        return {
            ...item,
            disabled: !hasAuthority(permission),
        }
    })
}

// layout渲染
export default function Layouts() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const user = useSelector((state: RootState) => state.authSlice.user);
    // useCallback(() => { }, [])
    const { roleCode, hasAuthority } = useAuthority();
    // 不同角色渲染不同的菜单
    // const menuItems = useMemo(() => filterMenus(ALL_MENUS, roleCode), [roleCode])
    const menuItems = useMemo(() => {
        const visibleMenus = filterMenus(ALL_MENUS, roleCode)
        return setMenuDisabled(visibleMenus, hasAuthority)
    }, [roleCode, hasAuthority])
    // 切换明暗主题
    const { mode } = useSelector((s: RootState) => s.themeSlice)
    // 控制刷新页面后默认打开的菜单
    const [openKeys, setOpenKeys] = useState<string[]>([])

    // 切换菜单项
    const handleMenu: MenuProps['onClick'] = ({ key }) => {
        navigate(key);
    }
    // 登出
    const handleLogOut = () => {
        dispatch(logout())
    }
    // 面包屑当前菜单路径
    const currentMenu = (() => {
        for (const menu of menuItems) {
            if (menu.key === location.pathname) {
                return { current: menu };
            }

            const child = menu.children?.find(
                item => item.key === location.pathname || location.pathname.startsWith(`${item.key}/`)
            );

            if (child) {
                return { parent: menu, current: child };
            }
        }

        return undefined;
    })();
    // 换主题
    const changeTheme = (value: boolean) => {
        dispatch(setTheme(value ? 'dark' : 'light'));
    };
    // 刷新页面默认展开二级菜单
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const parentMenu = menuItems.find(item => {
                return item.children?.some(item1 => item1.key === location.pathname)
            })
            if (parentMenu) {
                setOpenKeys([parentMenu.key]);
                // console.log(parentMenu.key)
            }
        }, 0)
        return () => window.clearTimeout(timer)
    }, [location.pathname, menuItems])
    // RBAC页面路由守卫
    useEffect(() => {
        const urlMap: Record<string, string> = {
            '/': 'dashboard:view',
            '/dashboard': 'dashboard:view',
            '/dashboards': 'dashboards:view',
            '/chart': 'chart:view',
            '/map': 'map:view',
            '/scene': 'scene:view',
            '/ai': 'ai:view',
            '/users': 'users:view',
            '/roles': 'roles:view',
            '/profile': 'profile:view',
        }
        const permissionKey = location.pathname.startsWith('/chart/') ? '/chart' : location.pathname;
        const permission = urlMap[permissionKey];
        if (permission && !hasAuthority(permission)) {
            navigate('/403')
        }
    }, [location.pathname, navigate, hasAuthority])

    // console.log(roleCode, '角色')
    // console.log(user)
    // console.log(menuItems)
    // console.log(currentMenu)

    return (
        <Layout>
            <Sider theme={mode} trigger={null} collapsible collapsed={collapsed} className='sider'>
                <div className="demo-logo-vertical" />
                <h2 className={`sider-brand ${collapsed ? 'is-collapsed' : ''}`}>
                    {collapsed ? '云枢' : '云枢智慧城市数据平台'}
                </h2>
                <Menu
                    mode="inline"
                    theme={mode}
                    items={menuItems as MenuProps['items']}
                    onClick={handleMenu}
                    selectedKeys={[location.pathname]}
                    openKeys={openKeys}
                    onOpenChange={(keys) => {
                        setOpenKeys(keys);
                        // console.log(keys)
                    }}
                />
            </Sider>
            <Layout>
                <Header style={{
                    padding: 0,
                    background: colorBgContainer
                }}>
                    <Flex gap="medium" align='center' style={{ width: '100%' }}>
                        <Button
                            type="text"
                            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                            onClick={() => setCollapsed(!collapsed)}
                            style={{
                                fontSize: '16px',
                                width: 48,
                                height: 64,
                                marginLeft: 16
                            }}

                        />
                        <Switch
                            checked={mode === 'dark'}
                            onChange={changeTheme}
                            checkedChildren="Dark"
                            unCheckedChildren="Light"
                        />
                        <Breadcrumb
                            className="breadcrumb"
                            items={
                                currentMenu?.parent
                                    ?
                                    [
                                        {
                                            href: '/',
                                            title: <HomeOutlined />,
                                        },
                                        {
                                            title: (
                                                <>
                                                    <span>{currentMenu?.parent?.label || '未知页面'}</span>
                                                </>
                                            ),
                                        },
                                        {
                                            href: `${location.pathname}`,
                                            title: (
                                                <>
                                                    <span>{currentMenu?.current?.label || '未知页面'}</span>
                                                </>
                                            ),
                                        },
                                    ]
                                    :
                                    [
                                        {
                                            href: '/',
                                            title: <HomeOutlined />,
                                        },
                                        {
                                            href: `${location.pathname}`,
                                            title: (
                                                <>
                                                    <span>{currentMenu?.current?.label || '未知页面'}</span>
                                                </>
                                            ),
                                        },
                                    ]
                            }
                        />
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: '/profile',
                                        label: (<span onClick={() => {
                                            navigate('/profile')
                                        }}>个人中心</span>)
                                    },
                                    {
                                        key: '1',
                                        danger: true,
                                        label: (<span onClick={() => handleLogOut()}>退出登录</span>)
                                    }
                                ]
                            }}
                        >
                            <Space style={{ marginLeft: 'auto', marginRight: '20px' }}>
                                <Avatar
                                    style={{ backgroundColor: '#498FFF' }}
                                    src={user?.avatar || undefined}
                                    icon={!user?.avatar ? <UserOutlined /> : undefined}
                                />
                                <span>{user?.username || '未登录用户'}</span>
                                <DownOutlined />
                            </Space>
                        </Dropdown>

                    </Flex>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 16,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        height: 'calc(100vh - 64px - 48px)',
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout >
    );
}
