import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined, SettingOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Space, Spin, Table, Tag, Tooltip, Tree, message } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Key } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { extractPermissionIds, rolesService } from '@/api/roles';
import type { PermissionNode, RoleCreateParams } from '@/api/roles';
import type { RoleInfo } from '@/types';
import { getApiErrorMessage } from '@/utils/errors';
import '@/css/SystemManagement.css';

interface RoleRow extends RoleInfo {
    userCount: number;
}

interface RoleFormValues {
    name: string;
    code: string;
    description?: string;
}

interface PermissionTreeItem {
    key: number;
    title: string;
    children?: PermissionTreeItem[];
}

function permissionTreeData(nodes: PermissionNode[]): PermissionTreeItem[] {
    return [...nodes]
        .sort((first, second) => first.sortOrder - second.sortOrder)
        .map((node) => ({
            key: node.id,
            title: `${node.label} (${node.name})`,
            children: node.children?.length ? permissionTreeData(node.children) : undefined,
        }));
}

function Roles() {
    const [form] = Form.useForm<RoleFormValues>();
    const [modal, modalContextHolder] = Modal.useModal();
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [permissions, setPermissions] = useState<PermissionNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [permissionOpen, setPermissionOpen] = useState(false);
    const [permissionRole, setPermissionRole] = useState<RoleRow | null>(null);
    const [checkedKeys, setCheckedKeys] = useState<Key[]>([]);
    const [permissionReady, setPermissionReady] = useState(false);
    const [permissionLoading, setPermissionLoading] = useState(false);
    const [actionId, setActionId] = useState<number>();

    const treeData = useMemo(() => permissionTreeData(permissions), [permissions]);

    const loadRoles = useCallback(async () => {
        setLoading(true);
        try {
            const response = await rolesService.List();
            if (response.code !== 200) throw new Error(response.message || '角色列表加载失败');
            const list = response.data ?? [];
            const counts = await Promise.all(list.map(async (role) => {
                try {
                    const countResponse = await rolesService.UserCount(role.id);
                    return countResponse.code === 200 ? countResponse.data?.total ?? 0 : 0;
                } catch {
                    return 0;
                }
            }));
            setRoles(list.map((role, index) => ({ ...role, userCount: counts[index] })));
        } catch (error) {
            setRoles([]);
            message.error(getApiErrorMessage(error, '角色列表加载失败'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => void loadRoles(), 0);
        const loadPermissions = async () => {
            try {
                const response = await rolesService.Permissions();
                if (response.code !== 200) throw new Error(response.message || '权限树加载失败');
                setPermissions(response.data ?? []);
            } catch (error) {
                message.error(getApiErrorMessage(error, '权限树加载失败'));
            }
        };
        void loadPermissions();
        return () => window.clearTimeout(timer);
    }, [loadRoles]);

    const openCreate = () => {
        setEditingRole(null);
        form.resetFields();
        setFormOpen(true);
    };

    const openEdit = (role: RoleRow) => {
        setEditingRole(role);
        form.setFieldsValue({ name: role.name, code: role.code, description: role.description ?? '' });
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setEditingRole(null);
        form.resetFields();
    };

    const saveRole = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const payload: RoleCreateParams = {
                name: values.name.trim(),
                code: values.code.trim(),
                description: values.description?.trim() || undefined,
            };
            const response = editingRole
                ? await rolesService.Update(editingRole.id, payload)
                : await rolesService.Create(payload);
            if (response.code !== 200) throw new Error(response.message || '角色保存失败');
            message.success(editingRole ? '角色修改成功' : '角色创建成功');
            closeForm();
            await loadRoles();
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            message.error(getApiErrorMessage(error, '角色保存失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const openPermissions = async (role: RoleRow) => {
        setPermissionRole(role);
        setCheckedKeys([]);
        setPermissionReady(false);
        setPermissionOpen(true);
        setPermissionLoading(true);
        try {
            const response = await rolesService.Detail(role.id);
            if (response.code !== 200) throw new Error(response.message || '角色权限加载失败');
            const ids = extractPermissionIds(response.data);
            if (ids === null) {
                setPermissionReady(false);
                return;
            }
            setCheckedKeys(ids);
            setPermissionReady(true);
        } catch (error) {
            message.error(getApiErrorMessage(error, '角色权限加载失败'));
        } finally {
            setPermissionLoading(false);
        }
    };

    const savePermissions = async () => {
        if (!permissionRole || !permissionReady) return;
        const permissionIds = checkedKeys.map(Number).filter(Number.isInteger);
        if (permissionRole.code === 'super_admin' && permissionIds.length === 0) {
            message.error('超级管理员权限不能为空');
            return;
        }
        setSubmitting(true);
        try {
            const response = await rolesService.SetPermissions(permissionRole.id, permissionIds);
            if (response.code !== 200) throw new Error(response.message || '权限保存失败');
            message.success('角色权限保存成功');
            setPermissionOpen(false);
        } catch (error) {
            message.error(getApiErrorMessage(error, '权限保存失败'));
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (role: RoleRow) => {
        if (role.code === 'super_admin') return;
        modal.confirm({
            title: '确认删除角色？',
            content: `角色“${role.name}”删除后不可恢复；存在关联用户时后端会拒绝删除。`,
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: async () => {
                setActionId(role.id);
                try {
                    const response = await rolesService.Delete(role.id);
                    if (response.code !== 200) throw new Error(response.message || '角色删除失败');
                    message.success('角色删除成功');
                    await loadRoles();
                } catch (error) {
                    message.error(getApiErrorMessage(error, '角色删除失败'));
                    throw error;
                } finally {
                    setActionId(undefined);
                }
            },
        });
    };

    const columns: TableColumnsType<RoleRow> = [
        { title: '序号', width: 70, render: (_, __, index) => index + 1 },
        { title: '角色名称', dataIndex: 'name', width: 150 },
        { title: '编码', dataIndex: 'code', width: 160, render: (code: string) => <Tag>{code}</Tag> },
        { title: '描述', dataIndex: 'description', render: (description: string | null) => description || '-' },
        { title: '用户数', dataIndex: 'userCount', width: 90 },
        {
            title: '状态', dataIndex: 'status', width: 90,
            render: (status: number) => <Tag color={status === 1 ? 'success' : 'default'}>{status === 1 ? '启用' : '禁用'}</Tag>,
        },
        {
            title: '操作', key: 'actions', width: 300,
            render: (_, role) => (
                <Space size={4}>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(role)}>编辑</Button>
                    <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => void openPermissions(role)}>配置权限</Button>
                    <Tooltip title={role.code === 'super_admin' ? '超级管理员角色不能删除' : undefined}>
                        <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            loading={actionId === role.id}
                            disabled={role.code === 'super_admin'}
                            onClick={() => confirmDelete(role)}
                        >
                            删除
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <section className="system-management-page role-management-page">
            {modalContextHolder}
            <h1><SafetyCertificateOutlined /> 角色权限管理</h1>
            <Button type="primary" icon={<PlusOutlined />} className="system-primary-action" onClick={openCreate}>添加角色</Button>

            <div className="system-table-shell">
                <Table<RoleRow>
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={roles}
                    pagination={false}
                    scroll={{ x: 980 }}
                />
            </div>

            <Modal
                title={editingRole ? '编辑角色' : '添加角色'}
                open={formOpen}
                okText="确定"
                cancelText="取消"
                confirmLoading={submitting}
                onOk={() => void saveRole()}
                onCancel={closeForm}
                destroyOnHidden
            >
                <Form<RoleFormValues> form={form} layout="vertical" className="system-modal-form">
                    <Form.Item name="name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]}>
                        <Input maxLength={30} placeholder="如：数据分析师" />
                    </Form.Item>
                    <Form.Item
                        name="code"
                        label="角色编码"
                        extra="唯一标识，如 analyst。创建后不可修改"
                        rules={[
                            { required: true, message: '请输入角色编码' },
                            { pattern: /^[a-z][a-z0-9_]*$/, message: '仅支持小写字母、数字和下划线，并以字母开头' },
                        ]}
                    >
                        <Input disabled={Boolean(editingRole)} maxLength={40} placeholder="如：analyst" />
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input.TextArea rows={3} maxLength={120} placeholder="角色描述" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`配置权限 - ${permissionRole?.name ?? ''}`}
                open={permissionOpen}
                okText="确定"
                cancelText="取消"
                confirmLoading={submitting}
                okButtonProps={{ disabled: !permissionReady || permissionLoading }}
                onOk={() => void savePermissions()}
                onCancel={() => setPermissionOpen(false)}
                destroyOnHidden
            >
                {!permissionReady && !permissionLoading ? (
                    <Alert
                        type="warning"
                        showIcon
                        message="接口未返回可识别的已有权限 ID"
                        description="为防止全量覆盖时误清空权限，本次禁止保存。请先确认角色详情接口的权限字段。"
                    />
                ) : null}
                <div className="permission-tree-shell">
                    <Spin spinning={permissionLoading}>
                        <Tree
                            checkable
                            blockNode
                            disabled={!permissionReady}
                            treeData={treeData}
                            checkedKeys={checkedKeys}
                            onCheck={(keys) => setCheckedKeys(Array.isArray(keys) ? keys : keys.checked)}
                        />
                    </Spin>
                </div>
            </Modal>
        </section>
    );
}

export default Roles;
