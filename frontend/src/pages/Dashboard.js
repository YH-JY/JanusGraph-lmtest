import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Tag, Alert, Spin } from 'antd';
import { 
  CloudServerOutlined, 
  ShareAltOutlined, 
  SafetyOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    k8s: { namespaces: 0, pods: 0, services: 0, deployments: 0 },
    graph: { total_vertices: 0, total_edges: 0 },
    risk: { high_risk_count: 0, privileged_pod_count: 0, exposed_service_count: 0 }
  });
  const [riskFactors, setRiskFactors] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [healthRes, riskRes] = await Promise.all([
        axios.get('/api/health'),
        axios.get('/api/attack/risk')
      ]);

      if (healthRes.status === 200 && riskRes.status === 200) {
        const riskData = riskRes.data.data;
        
        // 计算统计数据
        const statsData = {
          k8s: {
            namespaces: 0,
            pods: 0,
            services: 0,
            deployments: 0
          },
          graph: {
            total_vertices: riskData.total_vertices || 0,
            total_edges: 0
          },
          risk: {
            high_risk_count: riskData.high_risk_count || 0,
            privileged_pod_count: riskData.privileged_pod_count || 0,
            exposed_service_count: riskData.exposed_service_count || 0
          }
        };

        setStats(statsData);
        setRiskFactors(riskData.risk_factors || []);
      }
    } catch (err) {
      console.error('获取仪表板数据失败:', err);
      setError('无法获取数据，请确保后端服务正在运行');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (count) => {
    if (count > 5) return 'high';
    if (count > 0) return 'medium';
    return 'low';
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getRiskProgress = (count, threshold = 10) => {
    const percentage = Math.min((count / threshold) * 100, 100);
    return percentage;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="错误"
        description={error}
        type="error"
        showIcon
        action={
          <button onClick={fetchDashboardData}>重试</button>
        }
      />
    );
  }

  return (
    <div>
      <h2>云原生资产安全仪表板</h2>
      
      {/* K8s资源统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="命名空间"
              value={stats.k8s.namespaces}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pod数量"
              value={stats.k8s.pods}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="服务数量"
              value={stats.k8s.services}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="部署数量"
              value={stats.k8s.deployments}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图数据库统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="图顶点总数"
              value={stats.graph.total_vertices}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="图边总数"
              value={stats.graph.total_edges}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="高风险节点"
              value={stats.risk.high_risk_count}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 安全风险评估 */}
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="安全风险指标">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>特权容器</span>
                <Tag color={getRiskColor(getRiskLevel(stats.risk.privileged_pod_count))}>
                  {stats.risk.privileged_pod_count}
                </Tag>
              </div>
              <Progress
                percent={getRiskProgress(stats.risk.privileged_pod_count)}
                strokeColor={getRiskColor(getRiskLevel(stats.risk.privileged_pod_count))}
                showInfo={false}
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>暴露服务</span>
                <Tag color={getRiskColor(getRiskLevel(stats.risk.exposed_service_count))}>
                  {stats.risk.exposed_service_count}
                </Tag>
              </div>
              <Progress
                percent={getRiskProgress(stats.risk.exposed_service_count)}
                strokeColor={getRiskColor(getRiskLevel(stats.risk.exposed_service_count))}
                showInfo={false}
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>高风险节点</span>
                <Tag color={getRiskColor(getRiskLevel(stats.risk.high_risk_count))}>
                  {stats.risk.high_risk_count}
                </Tag>
              </div>
              <Progress
                percent={getRiskProgress(stats.risk.high_risk_count)}
                strokeColor={getRiskColor(getRiskLevel(stats.risk.high_risk_count))}
                showInfo={false}
              />
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="风险因素分析">
            <List
              dataSource={riskFactors}
              renderItem={(factor) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ExclamationCircleOutlined style={{ color: getRiskColor(factor.severity) }} />}
                    title={
                      <span style={{ color: getRiskColor(factor.severity) }}>
                        {factor.factor.replace(/_/g, ' ')}
                      </span>
                    }
                    description={factor.description}
                  />
                  <div>
                    <Tag color={getRiskColor(factor.severity)}>
                      {factor.severity}
                    </Tag>
                    <span style={{ marginLeft: 8 }}>
                      数量: {factor.count}
                    </span>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无风险因素' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;