import { KeyOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import {
  Avatar,
  Button,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  Tag,
  Typography,
  message,
  theme,
} from 'antd'
import axios from 'axios'
import { useState, type CSSProperties } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { usersService } from '@/api/users'
import type { AppDispatch, RootState } from '@/store'
import { logout } from '@/store/slice/authSlice'
import '../css/Profile.css'

const { Title, Text, Paragraph } = Typography

// 密码表单
interface PasswordFormValues {
  password: string
  confirmPassword: string
}

// 角色标签颜色
const roleColorMap: Record<string, string> = {
  super_admin: 'red',
  admin: 'orange',
  analyst: 'blue',
  user: 'default',
}

// 格式化日期时间
function formatDateTime(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 获取错误提示
function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || '密码修改失败，请稍后重试'
  }

  if (typeof error === 'object' && error && 'message' in error) {
    return String(error.message)
  }

  return '密码修改失败，请稍后重试'
}

function Profile() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [form] = Form.useForm<PasswordFormValues>()
  const [modal, modalContextHolder] = Modal.useModal()
  const [messageApi, messageContextHolder] = message.useMessage()
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { token: themeToken } = theme.useToken()
  const { token, user } = useSelector((state: RootState) => state.authSlice)

  // 关闭密码弹窗
  const closePasswordModal = () => {
    setPasswordModalOpen(false)
    form.resetFields()
  }

  // 提交新密码
  const handlePasswordSubmit = async () => {
    if (!user || !token) {
      messageApi.error('登录信息已失效，请重新登录')
      dispatch(logout())
      navigate('/login', { replace: true })
      return
    }

    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const response = await usersService.UpdateUser(user.id, { password: values.password }, token)

      if (response.code < 200 || response.code >= 300) {
        throw new Error(response.message || '密码修改失败')
      }

      messageApi.success(response.message || '密码修改成功')
      closePasswordModal()
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      messageApi.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  // 退出登录
  const handleLogout = () => {
    modal.confirm({
      title: '确认退出登录？',
      content: '退出后需要重新登录才能继续使用云枢智慧城市数据平台。',
      okText: '退出登录',
      cancelText: '取消',
      okButtonProps: { danger: true },
      icon: <LogoutOutlined style={{ color: themeToken.colorError }} />,
      onOk: () => {
        dispatch(logout())
        messageApi.success('已退出登录')
        navigate('/login', { replace: true })
      },
    })
  }

  // 用户信息缺失
  if (!user) {
    return (
      <div className="profile-empty">
        <Text type="secondary">暂无用户信息，请重新登录</Text>
        <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
          去登录
        </Button>
      </div>
    )
  }

  return (
    <section
      className="profile-page"
      style={{
        '--profile-border': themeToken.colorBorderSecondary,
        '--profile-label-bg': themeToken.colorFillAlter,
        '--profile-card-bg': themeToken.colorBgContainer,
        '--profile-label-color': themeToken.colorTextSecondary,
      } as CSSProperties}
    >
      {modalContextHolder}
      {messageContextHolder}
      {/* 个人信息卡片 */}
      <div className="profile-card">
        {/* 用户身份 */}
        <header className="profile-identity">
          <Avatar
            className="profile-avatar"
            size={76}
            src={user.avatar || undefined}
            icon={<UserOutlined />}
          />
          <Title level={3}>{user.username}</Title>
          <Tag color={roleColorMap[user.role?.code] || 'default'}>
            {user.role?.name || '普通用户'}
          </Tag>
        </header>

        <Divider />

        {/* 详细信息 */}
        <Descriptions
          className="profile-descriptions"
          bordered
          column={1}
          size="small"
          items={[
            { key: 'username', label: '用户名', children: user.username },
            { key: 'email', label: '邮箱', children: user.email || '-' },
            { key: 'role', label: '角色', children: user.role?.name || '-' },
            {
              key: 'status',
              label: '状态',
              children: <Tag color={user.status === 1 ? 'success' : 'error'}>{user.status === 1 ? '启用' : '禁用'}</Tag>,
            },
            { key: 'lastLogin', label: '最后登录', children: formatDateTime(user.lastLogin) },
            { key: 'createdAt', label: '注册时间', children: formatDateTime(user.createdAt) },
          ]}
        />

        <Divider />

        {/* 页面操作 */}
        <div className="profile-actions">
          <Button icon={<KeyOutlined />} onClick={() => setPasswordModalOpen(true)}>
            修改密码
          </Button>
          <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </div>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        open={passwordModalOpen}
        okText="确认修改"
        cancelText="取消"
        confirmLoading={submitting}
        mask={{ closable: !submitting }}
        closable={!submitting}
        onOk={handlePasswordSubmit}
        onCancel={closePasswordModal}
        destroyOnHidden
      >
        <Paragraph type="secondary" className="password-tip">
          新密码至少 8 位，并且需要同时包含字母和数字。
        </Paragraph>
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label="新密码"
            name="password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码不能少于 8 位' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '密码必须同时包含字母和数字' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="请再次输入新密码"
              autoComplete="new-password"
              onPressEnter={handlePasswordSubmit}
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  )
}

export default Profile
