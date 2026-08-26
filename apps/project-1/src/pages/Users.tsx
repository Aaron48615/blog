import {
    DeleteOutlined,
    KeyOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    UploadOutlined,
    UserOutlined,
} from '@ant-design/icons';
import {
    Avatar,
    Button,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Tooltip,
    Upload,
    message,
} from 'antd';
import type { TableColumnsType, UploadProps } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { CreateUserParams } from '@/api/users';
import { usersService } from '@/api/users';
import type { RootState } from '@/store';
import type { RoleInfo, UserInfo } from '@/types';
import { getApiErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';
import '@/css/SystemManagement.css';

interface UserFilters {
    username?: string;
    status?: number;
    roleId?: number;
}

interface UserFormValues {
    username: string;
    password?: string;
    email?: string;
    roleId: number;
    status?: number;
}

const roleColor = (code?: string) => ({
    super_admin: 'red',
    admin: 'orange',
    analyst: 'blue',
    user: 'default',
}[code ?? ''] ?? 'default');

function Users() {
    const currentUser = useSelector((state: RootState) => state.authSlice.user);
    const [searchForm] = Form.useForm<UserFilters>();
    const [userForm] = Form.useForm<UserFormValues>();
    const [modal, modalContextHolder] = Modal.useModal();
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [roles, setRoles] = useState<RoleInfo[]>([]);
    const [filters, setFilters] = useState<UserFilters>({});
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
    const [avatar, setAvatar] = useState<string>();
    const [submitting, setSubmitting] = useState(false);
    const [actionId, setActionId] = useState<number>();
    const pageSize = 10;

    const isProtected = useCallback((user: UserInfo) => (
        user.id === currentUser?.id
        || user.username.toLowerCase() === 'root'
        || user.role?.code === 'super_admin'
    ), [currentUser?.id]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await usersService.List({ page, pageSize, ...filters });
            if (response.code !== 200) throw new Error(response.message || '用户列表加载失败');
            setUsers(response.data?.list ?? []);
            setTotal(response.data?.total ?? 0);
        } catch (error) {
            setUsers([]);
            setTotal(0);
            message.error(getApiErrorMessage(error, '用户列表加载失败'));
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => {
        const timer = window.setTimeout(() => void fetchUsers(), 0);
        return () => window.clearTimeout(timer);
    }, [fetchUsers]);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await usersService.Roles();
                if (response.code !== 200) throw new Error(response.message || '角色列表加载失败');
                setRoles(response.data ?? []);
            } catch (error) {
                message.error(getApiErrorMessage(error, '角色列表加载失败'));
            }
        };
        void fetchRoles();
    }, []);

    const openCreate = () => {
        setEditingUser(null);
        setAvatar(undefined);
        userForm.resetFields();
        setFormOpen(true);
    };

    const openEdit = (user: UserInfo) => {
        setEditingUser(user);
        setAvatar(user.avatar ?? undefined);
        userForm.setFieldsValue({
            username: user.username,
            email: user.email ?? undefined,
            roleId: user.roleId,
            status: user.status,
        });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingUser(null);
        setAvatar(undefined);
        userForm.resetFields();
    };

    const saveUser = async () => {
        try {
            const values = await userForm.validateFields();
            setSubmitting(true);
            if (editingUser) {
                const response = await usersService.UpdateUser(editingUser.id, {
                    email: values.email?.trim(),
                    avatar,
                    roleId: values.roleId,
                });
                if (response.code !== 200) throw new Error(response.message || '用户修改失败');

                if (values.status !== undefined && values.status !== editingUser.status) {
                    if (isProtected(editingUser)) throw new Error('受保护账号不能修改状态');
                    const statusResponse = await usersService.ToggleStatus(editingUser.id, values.status);
                    if (statusResponse.code !== 200) throw new Error(statusResponse.message || '用户状态修改失败');
                }
                message.success('用户信息修改成功');
            } else {
                const payload: CreateUserParams = {
                    username: values.username.trim(),
                    password: values.password ?? '',
                    roleId: values.roleId,
                    email: values.email?.trim() || undefined,
                    avatar,
                };
                const response = await usersService.Create(payload);
                if (response.code !== 200) throw new Error(response.message || '用户创建失败');
                message.success('用户创建成功');
            }
            closeForm();
            setPage(1);
            await fetchUsers();
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            message.error(getApiErrorMessage(error, '用户保存失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const confirmStatus = (user: UserInfo, checked: boolean) => {
        if (isProtected(user)) return;
        modal.confirm({
            title: checked ? '确认启用用户？' : '确认禁用用户？',
            content: `${checked ? '启用' : '禁用'}后将影响“${user.username}”的登录状态。`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                setActionId(user.id);
                try {
                    const response = await usersService.ToggleStatus(user.id, checked ? 1 : 0);
                    if (response.code !== 200) throw new Error(response.message || '状态修改失败');
                    message.success('用户状态已更新');
                    await fetchUsers();
                } catch (error) {
                    message.error(getApiErrorMessage(error, '状态修改失败'));
                    throw error;
                } finally {
                    setActionId(undefined);
                }
            },
        });
    };

    const confirmResetPassword = (user: UserInfo) => {
        if (isProtected(user)) return;
        modal.confirm({
            title: '确认重置密码？',
            content: `系统将为“${user.username}”生成一个 8 位随机密码。`,
            okText: '重置密码',
            cancelText: '取消',
            onOk: async () => {
                setActionId(user.id);
                try {
                    const response = await usersService.ResetPassword(user.id);
                    if (response.code !== 200) throw new Error(response.message || '密码重置失败');
                    const newPassword = response.data?.newPassword;
                    modal.success({
                        title: '密码已重置',
                        content: (
                            <div className="password-result">
                                <p>请立即复制并安全交给该用户，关闭后页面不会保留。</p>
                                <Input value={newPassword} readOnly />
                                <Button
                                    type="primary"
                                    onClick={() => void navigator.clipboard.writeText(newPassword).then(
                                        () => message.success('密码已复制'),
                                        () => message.error('复制失败，请手动复制'),
                                    )}
                                >
                                    复制新密码
                                </Button>
                            </div>
                        ),
                    });
                } catch (error) {
                    message.error(getApiErrorMessage(error, '密码重置失败'));
                    throw error;
                } finally {
                    setActionId(undefined);
                }
            },
        });
    };

    const confirmDelete = (user: UserInfo) => {
        if (isProtected(user)) return;
        modal.confirm({
            title: '确认删除用户？',
            content: `用户“${user.username}”删除后不可恢复；存在关联数据时后端会拒绝删除。`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                setActionId(user.id);
                try {
                    const response = await usersService.Delete(user.id);
                    if (response.code !== 200) throw new Error(response.message || '用户删除失败');
                    message.success('用户删除成功');
                    if (users.length === 1 && page > 1) setPage((current) => current - 1);
                    else await fetchUsers();
                } catch (error) {
                    message.error(getApiErrorMessage(error, '用户删除失败'));
                    throw error;
                } finally {
                    setActionId(undefined);
                }
            },
        });
    };

    const uploadProps: UploadProps = {
        accept: '.jpg,.jpeg,.png,.gif,.webp',
        showUploadList: false,
        beforeUpload(file) {
            const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
            if (!supported) {
                message.error('仅支持 JPG、PNG、GIF 或 WebP 图片');
                return Upload.LIST_IGNORE;
            }
            if (file.size > 2 * 1024 * 1024) {
                message.error('头像文件不能超过 2MB');
                return Upload.LIST_IGNORE;
            }
            return true;
        },
        async customRequest({ file, onSuccess, onError }) {
            try {
                const response = await usersService.UploadAvatar(file as File);
                if (response.code !== 200) throw new Error(response.message || '头像上传失败');
                setAvatar(response.data.url);
                message.success('头像上传成功');
                onSuccess?.(response.data);
            } catch (error) {
                message.error(getApiErrorMessage(error, '头像上传失败'));
                onError?.(error as Error);
            }
        },
    };

    const columns: TableColumnsType<UserInfo> = [
        { title: '序号', width: 70, render: (_, __, index) => (page - 1) * pageSize + index + 1 },
        { title: 'ID', dataIndex: 'id', width: 70 },
        {
            title: '头像', dataIndex: 'avatar', width: 76,
            render: (value: string | null) => <Avatar src={value || undefined} icon={<UserOutlined />} />,
        },
        { title: '用户名', dataIndex: 'username', width: 130 },
        { title: '邮箱', dataIndex: 'email', width: 190, render: (value: string | null) => value || '-' },
        {
            title: '角色', dataIndex: 'role', width: 120,
            render: (role: RoleInfo) => <Tag color={roleColor(role?.code)}>{role?.name ?? '-'}</Tag>,
        },
        {
            title: '状态', dataIndex: 'status', width: 90,
            render: (status: number, user) => (
                <Tooltip title={isProtected(user) ? '受保护账号不能修改状态' : undefined}>
                    <Switch
                        checked={status === 1}
                        loading={actionId === user.id}
                        disabled={isProtected(user)}
                        onChange={(checked) => confirmStatus(user, checked)}
                    />
                </Tooltip>
            ),
        },
        { title: '最后登录', dataIndex: 'lastLogin', width: 175, render: formatDateTime },
        { title: '创建时间', dataIndex: 'createdAt', width: 175, render: formatDateTime },
        {
            title: '操作', key: 'actions', width: 235, fixed: 'right',
            render: (_, user) => {
                const protectedUser = isProtected(user);
                return (
                    <Space size={4}>
                        <Button type="link" size="small" onClick={() => openEdit(user)}>编辑</Button>
                        <Tooltip title={protectedUser ? '受保护账号不能重置密码' : undefined}>
                            <Button type="link" size="small" disabled={protectedUser} icon={<KeyOutlined />} onClick={() => confirmResetPassword(user)}>重置密码</Button>
                        </Tooltip>
                        <Tooltip title={protectedUser ? '受保护账号不能删除' : undefined}>
                            <Button type="link" danger size="small" disabled={protectedUser} icon={<DeleteOutlined />} onClick={() => confirmDelete(user)}>删除</Button>
                        </Tooltip>
                    </Space>
                );
            },
        },
    ];

    return (
        <section className="system-management-page">
            {modalContextHolder}
            <h1>用户管理</h1>
            <Form<UserFilters> form={searchForm} layout="inline" className="system-filter-form">
                <Form.Item name="username"><Input allowClear placeholder="用户名" /></Form.Item>
                <Form.Item name="status">
                    <Select allowClear placeholder="状态" options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]} />
                </Form.Item>
                <Form.Item name="roleId">
                    <Select allowClear placeholder="角色" options={roles.map((role) => ({ value: role.id, label: role.name }))} />
                </Form.Item>
                <Form.Item>
                    <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={() => {
                            setFilters(searchForm.getFieldsValue());
                            setPage(1);
                        }}>查询</Button>
                        <Button icon={<ReloadOutlined />} onClick={() => {
                            searchForm.resetFields();
                            setFilters({});
                            setPage(1);
                        }}>重置</Button>
                    </Space>
                </Form.Item>
            </Form>

            <Button type="primary" icon={<PlusOutlined />} className="system-primary-action" onClick={openCreate}>添加用户</Button>

            <div className="system-table-shell">
                <Table<UserInfo>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={users}
                    scroll={{ x: 1320 }}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: false,
                        showTotal: (count) => `共 ${count} 条`,
                        onChange: setPage,
                    }}
                />
            </div>

            <Modal
                title={editingUser ? '编辑用户' : '添加用户'}
                open={formOpen}
                okText="确定"
                cancelText="取消"
                confirmLoading={submitting}
                onOk={() => void saveUser()}
                onCancel={closeForm}
                destroyOnHidden
            >
                <Form<UserFormValues> form={userForm} layout="vertical" className="system-modal-form">
                    <Form.Item
                        name="username"
                        label="用户名"
                        validateTrigger="onBlur"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            ...(!editingUser ? [{
                                async validator(_: unknown, value?: string) {
                                    if (!value?.trim()) return;
                                    const response = await usersService.CheckUsername(value.trim());
                                    if (response.data?.exists) throw new Error('用户名已存在');
                                },
                            }] : []),
                        ]}
                    >
                        <Input disabled={Boolean(editingUser)} maxLength={20} placeholder="请输入用户名" />
                    </Form.Item>
                    {!editingUser ? (
                        <Form.Item
                            name="password"
                            label="密码"
                            rules={[
                                { required: true, message: '请输入密码' },
                                { min: 8, message: '密码至少 8 位' },
                                { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '密码必须同时包含字母和数字' },
                            ]}
                        >
                            <Input.Password autoComplete="new-password" placeholder="请输入密码" />
                        </Form.Item>
                    ) : null}
                    <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item label="头像">
                        <Space align="center">
                            <Avatar size={64} src={avatar} icon={<UserOutlined />} />
                            <Upload {...uploadProps}><Button icon={<UploadOutlined />}>上传头像</Button></Upload>
                        </Space>
                    </Form.Item>
                    <Form.Item name="roleId" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                        <Select placeholder="请选择角色" options={roles.map((role) => ({ value: role.id, label: role.name }))} />
                    </Form.Item>
                    {editingUser ? (
                        <Form.Item name="status" label="状态">
                            <Select
                                disabled={isProtected(editingUser)}
                                options={[{ value: 1, label: '启用' }, { value: 0, label: '禁用' }]}
                            />
                        </Form.Item>
                    ) : null}
                </Form>
            </Modal>
        </section>
    );
}

export default Users;
