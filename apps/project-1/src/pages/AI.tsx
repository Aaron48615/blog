import { useEffect, useRef, useState } from "react";
import type { ReactNode } from 'react';
import { useSelector } from "react-redux";
import { Alert, Avatar, Button, Card, Flex, Form, Input, Modal, Spin, Typography, theme } from "antd";
import { CheckCircleFilled, UserOutlined, DeepSeekFilled, SendOutlined, SettingOutlined } from '@ant-design/icons'
import '../css/AI.css'
import store, { type RootState } from '@/store';
import {
    isSessionRefreshCancelledError,
    notifySessionExpired,
    refreshSession,
} from '@/services/authSession';

const { Text } = Typography;

type AiRole = 'assistant' | 'user';

interface AiMessage {
    id: number;
    role: AiRole;
    content: string;
    streaming?: boolean;
}

interface AiConfig {
    aiKey?: string;
    aiBaseUrl?: string;
    aiModel?: string;
}

interface AiEvent {
    type: 'thinking' | 'text' | 'done' | 'fallback';
    content?: string;
}

const readConfig = (): AiConfig => {
    try {
        const stored = localStorage.getItem('datapilot_ai_config');
        return stored ? JSON.parse(stored) as AiConfig : {};
    } catch {
        return {};
    }
};

function AI() {
    const { token: themeToken } = theme.useToken()
    const user = useSelector((state: RootState) => state.authSlice.user)
    const [messages, setMessages] = useState<AiMessage[]>([{
        id: 1,
        role: 'assistant',
        content: '你好！我是 **云枢 AI 助手** 🤖\n\n💡 当前运行在**内置规则模式**（未配置 AI Key），数据查询为真实数据库查询，闲聊回复为规则匹配。\n\n我可以查询真实的智慧城市数据：\n\n📊 **概览** — 城市运行 KPI\n🚗 **交通排行** — 拥堵指数排名\n🌿 **天气** — 各城市天气\n🏥 **设施** — 公共设施统计\n🚨 **事件** — 最新城市事件\n📍 **城市名** — 查询具体城市\n\n直接输入关键词即可 👇\n\n> 如需大模型对话，点击右上角 ⚙️ 配置自己的 API Key'
    }])
    const [inputValue, setInputValue] = useState('');
    const [configOpen, setConfigOpen] = useState(false)
    const [configured, setConfigured] = useState(() => Boolean(readConfig().aiKey))
    const [configForm] = Form.useForm<AiConfig>()
    const contentRef = useRef<HTMLDivElement | null>(null)

    const handleOpenConfig = () => {
        const cfg = readConfig()
        configForm.setFieldsValue({
            aiKey: cfg.aiKey || '',
            aiBaseUrl: cfg.aiBaseUrl || 'https://api.deepseek.com',
            aiModel: cfg.aiModel || 'deepseek-v4-flash',
        })
        setConfigOpen(true)
    }
    const handleSaveConfig = async () => {
        const values = await configForm.validateFields()
        const cfg = {
            aiKey: values.aiKey?.trim() ?? '',
            aiBaseUrl: values.aiBaseUrl?.trim(),
            aiModel: values.aiModel?.trim(),
        }
        localStorage.setItem('datapilot_ai_config', JSON.stringify(cfg))
        setConfigured(Boolean(cfg.aiKey))
        setConfigOpen(false)
    }
    const renderMain = (val: string) => {
        const nodes: ReactNode[] = [];
        let text = val;
        let keys = 0
        while (text.length > 0) {
            const main = text.match(/\*\*(.*?)\*\*/);
            if (main && main.index != undefined) {
                if (main.index) {
                    nodes.push(text.substring(0, main.index))
                }
                nodes.push(
                    <b key={keys}>{main[1]}</b>
                )
                keys += 100;
                text = text.substring(main.index + main[0].length);
            } else {
                nodes.push(text)
                break;
            }
        }
        return nodes
    }
    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text) return;
        const userMessage: AiMessage = { id: Date.now(), role: 'user', content: text };
        const aiMessage: AiMessage = { id: Date.now() + 1, role: 'assistant', content: '', streaming: true };
        setMessages(prev => [...prev, userMessage, aiMessage])
        const history = [...messages, userMessage].map(item => ({ role: item.role, content: item.content }))
        setInputValue('')
        try {
            // const res = await streamChat(history, token)
            // console.log(res,'res')
            for await (const event of streamChat(history)) {
                setMessages(prev => {
                    const idx = prev.findIndex(item => item.id == aiMessage.id);
                    if (idx == -1) return prev;
                    const updates = [...prev];
                    const msg = { ...updates[idx] }
                    if (event.type == 'text') {
                        msg.content += event.content ?? ''
                    } else if (event.type == 'done') {
                        msg.streaming = false;
                    }

                    updates[idx] = msg
                    return updates;
                })
            }
        } catch {
            setMessages(prev => prev.map(item => item.id === aiMessage.id
                ? { ...item, content: item.content || '连接失败，请稍后重试。', streaming: false }
                : item))
        } finally {
            setMessages(prev => prev.map(item => item.id === aiMessage.id
                ? { ...item, streaming: false }
                : item))
        }
    }

    useEffect(()=>{
        if (messages.length > 1) {
            contentRef.current?.scrollIntoView({behavior: 'smooth'})
        }
    },[messages])

    async function* streamChat(
        history: Array<{ role: AiRole; content: string }>,
    ): AsyncGenerator<AiEvent> {
        // console.log(messages, token);
        const requestStream = async (retried = false): Promise<Response> => {
            const cfg = readConfig();
            const currentToken = store.getState().authSlice.token
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
                // x-ai-key: API Key
                // x-ai-base-url: API 基础地址
                // x-ai-model: 模型名称
                ...(cfg.aiKey ? { 'X-AI-KEY': cfg.aiKey } : {}),
                ...(cfg.aiBaseUrl ? { 'X-AI-BASE-URL': cfg.aiBaseUrl } : {}),
                ...(cfg.aiModel ? { 'X-AI-MODEL': cfg.aiModel } : {}),
            }
            const response = await fetch('/api/ai/chat', {
                method: 'post',
                headers,
                body: JSON.stringify({ messages: history })
            })

            if (response.status !== 401) return response
            if (retried) {
                notifySessionExpired()
                return response
            }

            try {
                await refreshSession()
                return requestStream(true)
            } catch (error) {
                if (isSessionRefreshCancelledError(error) || !store.getState().authSlice.token) {
                    throw new Error('登录状态已经发生变化', { cause: error })
                }
                notifySessionExpired()
                throw new Error('登录状态已过期', { cause: error })
            }
        }

        const response = await requestStream()
        let news = '';
        if (!response.ok || !response.body) throw new Error('连接失败');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            news += decoder.decode(value, { stream: true });
            const lines = news.split('\n');
            news = lines.pop() ?? '';

            for (const key of lines) {
                if (key.startsWith('data: ')) {
                    try {
                        yield JSON.parse(key.slice(6)) as AiEvent
                    } catch {
                        // 忽略单条格式不完整的 SSE 消息，继续读取后续内容
                    }
                }
            }
        }
        const trailing = news.trim();
        if (trailing.startsWith('data: ')) {
            try {
                yield JSON.parse(trailing.slice(6)) as AiEvent;
            } catch {
                // 连接结束时残留内容不完整，不影响已经收到的消息
            }
        }
    }

    return (
        <div className="ai-page">
            <Card
                className="ai-chat-card"
                styles={{ body: { padding: 0, height: '100%' } }}
            >
                {/* 头部 */}
                <header
                    className="ai-chat-header"
                    style={{ borderColor: themeToken.colorBorderSecondary }}
                >
                    <Flex align="center" justify="space-between" gap={12}>
                        <Text strong className="ai-toolbar-title">
                            <DeepSeekFilled />
                            智慧城市数据助手
                        </Text>
                        <Button
                            size="small"
                            icon={<SettingOutlined />}
                            onClick={handleOpenConfig}
                        >
                            {configured ? (
                                <span className="ai-configured-text">
                                    已配置 <CheckCircleFilled />
                                </span>
                            ) : '配置 API'}
                        </Button>
                    </Flex>
                </header>
                {/* 消息 */}
                <div
                    className="main ai-message-list"
                    style={{ backgroundColor: themeToken.colorFillQuaternary }}
                >
                    {
                        messages.map(msg => {
                            const isUser = msg.role == 'user'

                            return (
                                <Flex
                                    key={msg.id}
                                    className={`ai-message-row ${isUser ? 'is-user' : 'is-assistant'}`}
                                    justify={isUser ? 'flex-end' : 'flex-start'}
                                    align="flex-start"
                                    gap={12}
                                >
                                    {!isUser && (
                                        <Avatar
                                            className="ai-message-avatar"
                                            icon={<DeepSeekFilled />}
                                            style={{ backgroundColor: themeToken.colorPrimary }}
                                        />
                                    )}
                                    <div
                                        className="ai-message-bubble"
                                        style={{
                                            color: isUser ? themeToken.colorTextLightSolid : themeToken.colorText,
                                            backgroundColor: isUser ? themeToken.colorPrimary : themeToken.colorBgContainer,
                                            borderColor: isUser ? themeToken.colorPrimary : themeToken.colorBorderSecondary,
                                        }}
                                    >
                                        {msg.role == 'assistant' && !msg.content
                                            ? <Spin size="small" />
                                            : renderMain(msg.content)}
                                    </div>
                                    {isUser && (
                                        <Avatar
                                            className="ai-message-avatar"
                                            src={user?.avatar}
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: themeToken.colorPrimaryActive }}
                                        />
                                    )}
                                </Flex>
                            )
                        })
                    }
                    <div ref={contentRef}></div>
                </div>
                {/* 输入框 */}
                <div
                    className="enter ai-composer"
                    style={{ borderColor: themeToken.colorBorderSecondary }}
                >
                    <Flex align="flex-end" gap={12}>
                        <Input.TextArea
                            className="ai-composer-input"
                            placeholder="输入关键词：概览 | 交通排行 | 天气 | 设施 | 事件 | 北京"
                            autoSize={{ minRows: 1, maxRows: 4 }}
                            onPressEnter={(e) => {
                                if (!e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <Button
                            type="primary"
                            size="large"
                            icon={<SendOutlined />}
                            disabled={!inputValue.trim()}
                            onClick={() => handleSend()}
                            aria-label="发送消息"
                        >
                            发送
                        </Button>
                    </Flex>
                </div>
            </Card>
            <Modal
                title={(
                    <Flex align="center" gap={8}>
                        <SettingOutlined />
                        <span>配置你的 AI 密钥</span>
                    </Flex>
                )}
                open={configOpen}
                okText="保存并生效"
                cancelText="取消"
                onOk={handleSaveConfig}
                onCancel={() => setConfigOpen(false)}
                destroyOnHidden
            >
                <Alert
                    className="ai-config-alert"
                    type="warning"
                    showIcon
                    title={(
                        <span>
                            只需填写 Key：前往{' '}
                            <Typography.Link href="https://platform.deepseek.com" target="_blank">
                                platform.deepseek.com
                            </Typography.Link>{' '}
                            注册并创建 API Key。地址和模型名已有默认值。
                        </span>
                    )}
                />
                <Form form={configForm} layout="vertical" className="ai-config-form">
                    <Form.Item
                        name="aiKey"
                        label="API Key"
                        rules={[{ required: true, message: '请输入 API Key' }]}
                    >
                        <Input.Password placeholder="请输入 API Key" />
                    </Form.Item>
                    <Form.Item
                        name="aiBaseUrl"
                        label="Base URL（选填）"
                        extra="默认 DeepSeek，换其他模型时修改"
                    >
                        <Input placeholder="https://api.deepseek.com" />
                    </Form.Item>
                    <Form.Item
                        name="aiModel"
                        label="模型名（选填）"
                        extra="默认 deepseek-v4-flash"
                    >
                        <Input placeholder="deepseek-v4-flash" />
                    </Form.Item>
                    <Text type="secondary" className="ai-config-note">
                        配置保存在当前浏览器。不填 Key 则使用内置规则
                    </Text>
                </Form>
            </Modal>
        </div>
    )
}

export default AI;
