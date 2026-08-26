import LoginBG from '../components/LoginBG.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Form, Input, Spin, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, CheckOutlined, VerifiedOutlined } from '@ant-design/icons';
import { authService } from '@/api/auth.ts';
import type { FormProps } from 'antd'
import '../css/Login.css'
import { useEffect, useRef, useState } from 'react';
// import { useDispatch } from 'react-redux';
import { useCaptcha } from '@/hooks/useCaptcha.tsx';

type RegisterFieldType = {
  username: string
  email?: string
  password: string
  confirmPassword: string
  captcha: string
}

function Register() {
  const navigate = useNavigate();
  // const dispatch = useDispatch();
  const {
    captchaId,
    captchaSvg,
    captchaLoading,
    refreshCaptcha,
  } = useCaptcha()
  const [form] = Form.useForm<RegisterFieldType>();
  const [loading, setLoading] = useState(false);
    const timerRef = useRef<number | null>(null)

  const onFinish: FormProps<RegisterFieldType>['onFinish'] = async (values) => {
    // 注册接口接入后，在这里提交表单数据
    setLoading(true);
    try {
      const res = await authService.Register({
        username: values.username,
        password: values.password,
        email: values.email || undefined,
        captchaId,
        captchaCode: values.captcha,
      })
      console.log(res);
      // console.log(values);
      if (res.code === 200) {
        message.success(res.message);
        timerRef.current = setTimeout(() => {
          navigate('/login')
        }, 2000);
      }
    } catch (err) {
      // throw new Error()
      console.log('注册报错', err);
      message.error('注册失败，请重试');
      form.resetFields(['captcha']);
      await refreshCaptcha();
    } finally {
      setLoading(false)
    }
  }

  // const init = useCallback(async () => {
  //   refreshCaptcha();
  // }, [])
  // useEffect(() => {
  //   init();
  // }, [init])
  useEffect(()=>{
    refreshCaptcha()
  },[refreshCaptcha])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return (
    <div className="login register">
      <LoginBG></LoginBG>

      <div className="loginMain registerMain">
        <h1>云枢智慧城市数据平台</h1>
        <Form
          className="form"
          form={form}
          // name="register"
          onFinish={onFinish}
        // autoComplete="off"
        // requiredMark={false}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[{ type: 'email', message: '请输入正确的邮箱!' }]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱（选填）"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
              message: '密码至少8位，且必须包含字母和数字!',
            },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码!' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                message: '请输入正确的密码格式!',
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<CheckOutlined />}
              placeholder="确认密码"
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            rules={[{ required: true, message: '请输入验证码!' }]}
          >
            <Input
              prefix={<VerifiedOutlined />}
              placeholder="验证码"
            />
          </Form.Item>

          <Form.Item>
            <div>
              {captchaLoading ? <Spin size="large" className='spin' /> : (
                <img src={`data:image/svg+xml;base64,${btoa(captchaSvg)}`}
                  alt="验证码"
                  title="点击更换验证码"
                  className='captchaImg'
                  onClick={() => {
                    form.resetFields(['captcha'])
                    void refreshCaptcha()
                  }} />
              )}
            </div>
          </Form.Item>

          <Form.Item label={null}>
            <Button className="submitButton" type="primary" htmlType="submit" loading={loading}>
              注册
            </Button>
          </Form.Item>
        </Form>

        <div className="pageSwitch">
          已有账号？ <Link to="/login">去登录</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
