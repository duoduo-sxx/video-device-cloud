import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const ErrorPage: React.FC<{ code: 403 | 404 | 500 }> = ({ code }) => {
  const navigate = useNavigate();
  const map = {
    403: { title: '403', subTitle: '抱歉，您没有权限访问该页面（可切换角色登录试试）' },
    404: { title: '404', subTitle: '抱歉，您访问的页面不存在' },
    500: { title: '500', subTitle: '抱歉，服务开小差了，请稍后重试' },
  } as const;
  return (
    <Result
      status={code === 403 ? '403' : code === 500 ? '500' : '404'}
      title={map[code].title}
      subTitle={map[code].subTitle}
      extra={<Button type="primary" onClick={() => navigate('/')}>返回工作台</Button>}
    />
  );
};
export default ErrorPage;
