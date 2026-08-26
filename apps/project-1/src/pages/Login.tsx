import LoginBG from '../components/LoginBG.jsx'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Form, Input, message, Spin } from 'antd'
import { UserOutlined, LockOutlined, VerifiedOutlined } from '@ant-design/icons';
import type { AppDispatch } from '../store'
import type { FormProps } from 'antd';
// import { setToken, setUserInfo } from '../store/slice/userSlice'
import { setInfo } from '@/store/slice/authSlice.tsx'
import '../css/Login.css'
import { useEffect, useState } from 'react'
import { authService } from '@/api/auth.ts'
import { useCaptcha } from '@/hooks/useCaptcha.tsx';

type FieldType = {
  username: string;
  password: string;
  captcha: string;
};

function Login() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const {
    captchaId,
    captchaSvg,
    captchaLoading,
    refreshCaptcha,
  } = useCaptcha()
  const [form] = Form.useForm<FieldType>();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setLoading(true)
    try {
      const res = await authService.Login({
        username: values.username,
        password: values.password,
        captchaId,
        captchaCode: values.captcha,
      })
      console.log(res);
      // console.log(values);
      if (res.code === 200) {
        message.success(res.message);
        dispatch(setInfo({ token: res.data.token, user: res.data.user }));
        navigate('/')
      }
    } catch (err) {
      // throw new Error()
      console.log('登录报错', err);
      message.error('登录失败，请重试');
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

  return (
    <div className="login">
      <LoginBG></LoginBG>

      <div className="loginMain">
        <h1>云枢智慧城市数据平台</h1>
        <Form
          form={form}
          className="form"
          onFinish={onFinish}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名!' }]}
          >
            <Input
              placeholder="用户名"
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
          >
            <Input.Password
              placeholder="密码"
              prefix={<LockOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            rules={[{ required: true, message: '请输入验证码!' }]}
          >
            <Input
              placeholder="验证码"
              prefix={<VerifiedOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <div>
              {captchaLoading ? <Spin size="large" className='spin' /> : (
                <img src={`data:image/svg+xml;base64,${btoa(captchaSvg)}`}
                alt="验证码"
                title="点击更换验证码"
                className='captchaImg'
                onClick={()=>{
                  form.resetFields(['captcha'])
                  void refreshCaptcha()
                }}/>
              )}
            </div>
          </Form.Item>

          <Form.Item label={null}>
            <Button className="submitButton" type="primary" htmlType="submit" loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="pageSwitch">
          还没有账号？ <Link to="/register">去注册</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
