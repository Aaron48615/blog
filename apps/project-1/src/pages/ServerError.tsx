import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

function ServerError() {
    const navigate = useNavigate();
    return (
        <Result
            status="500"
            title="500"
            subTitle="服务器好像出错了"
            extra={<Button type="primary" onClick={()=>navigate('/')}>返回首页</Button>}
        />
    )
}

export default ServerError;