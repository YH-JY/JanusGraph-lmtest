import React from 'react';
import { Routes, Route, Layout, Menu, Typography, Button, Space, message } from 'antd';
import { 
  DashboardOutlined, 
  CloudOutlined, 
  ShareAltOutlined, 
  SafetyOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import K8sCollector from './pages/K8sCollector';
import GraphVisualization from './pages/GraphVisualization';
import AttackAnalysis from './pages/AttackAnalysis';
import { useNavigate, useLocation } from 'react-router-dom';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/k8s-collector',
      icon: <CloudOutlined />,
      label: 'K8s数据收集',
    },
    {
      key: '/graph-visualization',
      icon: <ShareAltOutlined />,
      label: '图谱可视化',
    },
    {
      key: '/attack-analysis',
      icon: <SafetyOutlined />,
      label: '攻击路径分析',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleFullProcess = async () => {
    try {
      message.loading('正在执行完整流程...', 0);
      const response = await fetch('/api/full-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      message.destroy();
      const result = await response.json();
      
      if (result.success) {
        message.success('完整流程执行成功！');
        // 跳转到图谱可视化页面
        navigate('/graph-visualization');
      } else {
        message.error(`执行失败: ${result.error}`);
      }
    } catch (error) {
      message.destroy();
      message.error('执行过程中发生错误');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          JanusGraph K8s Platform
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={handleFullProcess}
          >
            执行完整流程
          </Button>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: 8,
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/k8s-collector" element={<K8sCollector />} />
              <Route path="/graph-visualization" element={<GraphVisualization />} />
              <Route path="/attack-analysis" element={<AttackAnalysis />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default App;