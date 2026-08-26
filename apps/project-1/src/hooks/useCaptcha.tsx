import { message } from 'antd'
import { useCallback, useState } from 'react'
import { authService } from '@/api/auth'

export function useCaptcha() {
  const [captchaId, setCaptchaId] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  const refreshCaptcha = useCallback(async () => {
    setCaptchaLoading(true)

    try {
      const res = await authService.Captcha()

      if (res.code !== 200) {
        throw new Error(res.message || '验证码获取失败')
      }

      setCaptchaId(res.data.captchaId)
      setCaptchaSvg(res.data.svg)

      return true
    } catch (error) {
      console.error('获取验证码失败', error)
      setCaptchaId('')
      setCaptchaSvg('')
      message.error('验证码获取失败，请刷新重试')

      return false
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  return {
    captchaId,
    captchaSvg,
    captchaLoading,
    refreshCaptcha,
  }
}