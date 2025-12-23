import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Select, 
  Button, 
  Table, 
  Space, 
  Tag, 
  Alert,
  Spin,
  Collapse,
  Timeline,
  Modal
} from 'antd';
import { 
  SafetyOutlined, 
  SearchOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { Panel } = Collapse;

const AttackAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [attackPaths, setAttackPaths] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [filters, setFilters] = useState({
    sourceType: '',
    targetType: '',
    maxDepth: 5
  });
  const [pathModalVisible, setPathModalVisible] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);

  useEffect(() => {
    fetchRiskAssessment();
  }, []);

  const fetchRiskAssessment = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/attack/risk');
      if (response.data.success) {
        setRiskAssessment(response.data.data);
      }
    } catch (error) {
      console.error('获取风险评估失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPaths = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.sourceType) params.append('source_type', filters.sourceType);
      if (filters.targetType) params.append('target_type', filters.targetType);
      params.append('max_depth', filters.maxDepth.toString());

      const response = await axios.get(`/api/attack/paths?${params}`);
      if (response.data.success) {
        setAttackPaths(response.data.data);
      }
    } catch (error) {
      console.error('查找攻击路径失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const showPathDetails = (path) => {
    setSelectedPath(path);
    setPathModalVisible(true);
  };

  const formatPathStep = (step, index) => {
    if (step.type === 'vertex') {
      const props = step.properties || {};
      return (
        <Timeline.Item
          key={index}
          dot={<SafetyOutlined style={{ color: '#1890ff' }} />}
        >
          <div>
            <strong>{props.name || props.label || 'Unknown'}</strong>
            <br />
            <Tag color="blue">{step.type}</Tag>
            {props.type && <Tag color="green">{props.type}</Tag>}
            {props.namespace && <Tag>{props.namespace}</Tag>}
          </div>
        </Timeline.Item>
      );
    } else {
      return (
        <Timeline.Item
          key={index}
          dot={<SearchOutlined style={{ color: '#faad14' }} />}
        >
          <div>
            <strong>{step.label}</strong>
            <br />
            <Tag color="orange">{step.type}</Tag>
          </div>
        </Timeline.Item>
      );
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const pathColumns = [
    {
      title: '攻击路径',
      key: 'path',
      render: (_, record) => {
        const path = record;
        if (!path || path.length === 0) return '-';
        
        const start = path.find(p => p.type === 'vertex');
        const end = path.slice().reverse().find(p => p.type === 'vertex');
        
        return (
          <div>
            <div><strong>起始:</strong> {start?.properties?.name || 'Unknown'}</div>
            <div><strong>目标:</strong> {end?.properties?.name || 'Unknown'}</div>
            <div><strong>路径长度:</strong> {path.length}</div>
          </div>
        );
      }
    },
    {
      title: '涉及节点',
      key: 'nodes',
      render: (_, record) => {
        const path = record || [];
        const vertices = path.filter(p => p.type === 'vertex');
        return (
          <div>
            {vertices.slice(0, 3).map((v, i) => (
              <Tag key={i} color="blue" style={{ margin: '2px' }}>
                {v.properties?.name || v.properties?.label}
              </Tag>
            ))}
            {vertices.length > 3 && <Tag>+{vertices.length - 3}</Tag>}
          </div>
        );
      }
    },
    {
      title: '风险等级',
      key: 'risk',
      render: (_, record) => {
        // 简单的风险评估逻辑
        const path = record || [];
        const vertices = path.filter(p => p.type === 'vertex');
        const highRiskNodes = vertices.filter(v => 
          v.properties?.risk_level === 'high'
        ).length;
        
        let riskLevel = 'low';
        if (highRiskNodes > 0) riskLevel = 'high';
        else if (path.length > 4) riskLevel = 'medium';
        
        return (
          <Tag color={getRiskColor(riskLevel)}>
            {riskLevel.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showPathDetails(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>攻击路径分析</h2>
      
      {/* 风险评估概览 */}
      {riskAssessment && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <div className="stats-card">
                <ExclamationCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {riskAssessment.high_risk_count}
                  </div>
                  <div>高风险节点</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="stats-card">
                <SafetyOutlined style={{ fontSize: 32, color: '#faad14' }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {riskAssessment.privileged_pod_count}
                  </div>
                  <div>特权容器</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="stats-card">
                <SearchOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                    {riskAssessment.exposed_service_count}
                  </div>
                  <div>暴露服务</div>
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <div className="stats-card">
                <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {riskAssessment.total_vertices}
                  </div>
                  <div>总节点数</div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索条件 */}
      <Card title="搜索攻击路径" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 8 }}>起始节点类型:</label>
            <Select
              style={{ width: '100%' }}
              placeholder="选择起始节点类型"
              allowClear
              value={filters.sourceType}
              onChange={(value) => setFilters({...filters, sourceType: value})}
            >
              <Option value="Pod">Pod</Option>
              <Option value="Service">Service</Option>
              <Option value="Namespace">Namespace</Option>
              <Option value="Deployment">Deployment</Option>
              <Option value="ClusterRole">ClusterRole</Option>
            </Select>
          </Col>
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 8 }}>目标节点类型:</label>
            <Select
              style={{ width: '100%' }}
              placeholder="选择目标节点类型"
              allowClear
              value={filters.targetType}
              onChange={(value) => setFilters({...filters, targetType: value})}
            >
              <Option value="Pod">Pod</Option>
              <Option value="Service">Service</Option>
              <Option value="Namespace">Namespace</Option>
              <Option value="Deployment">Deployment</Option>
              <Option value="ClusterRole">ClusterRole</Option>
            </Select>
          </Col>
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 8 }}>最大路径深度:</label>
            <Select
              style={{ width: '100%' }}
              value={filters.maxDepth}
              onChange={(value) => setFilters({...filters, maxDepth: value})}
            >
              <Option value={3}>3</Option>
              <Option value={5}>5</Option>
              <Option value={7}>7</Option>
              <Option value={10}>10</Option>
            </Select>
          </Col>
          <Col span={6}>
            <label style={{ display: 'block', marginBottom: 8 }}>&nbsp;</label>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearchPaths}
              loading={loading}
            >
              搜索路径
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 攻击路径结果 */}
      <Card title="攻击路径列表">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : attackPaths.length === 0 ? (
          <Alert
            message="暂无攻击路径"
            description="请设置搜索条件并点击搜索按钮查找攻击路径"
            type="info"
            showIcon
          />
        ) : (
          <Table
            dataSource={attackPaths}
            columns={pathColumns}
            rowKey={(_, index) => index}
            pagination={{ pageSize: 10 }}
            expandable={{
              expandedRowRender: (record) => {
                const path = record || [];
                const vertices = path.filter(p => p.type === 'vertex');
                const edges = path.filter(p => p.type === 'edge');
                
                return (
                  <div style={{ margin: 0 }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <strong>涉及节点:</strong>
                        <div style={{ marginTop: 8 }}>
                          {vertices.map((v, i) => (
                            <Tag key={i} color="blue" style={{ margin: '2px' }}>
                              {v.properties?.name || v.properties?.label}
                            </Tag>
                          ))}
                        </div>
                      </Col>
                      <Col span={12}>
                        <strong>关系边:</strong>
                        <div style={{ marginTop: 8 }}>
                          {edges.map((e, i) => (
                            <Tag key={i} color="orange" style={{ margin: '2px' }}>
                              {e.label}
                            </Tag>
                          ))}
                        </div>
                      </Col>
                    </Row>
                  </div>
                );
              },
            }}
          />
        )}
      </Card>

      {/* 攻击路径详情弹窗 */}
      <Modal
        title="攻击路径详情"
        visible={pathModalVisible}
        onCancel={() => setPathModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedPath && (
          <div>
            <Alert
              message="攻击路径时序图"
              description="以下显示攻击者从起始节点到目标节点的完整路径"
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Timeline>
              {selectedPath.map((step, index) => formatPathStep(step, index))}
            </Timeline>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttackAnalysis;