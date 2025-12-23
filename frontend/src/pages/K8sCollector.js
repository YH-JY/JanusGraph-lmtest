import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Space, 
  Select, 
  message, 
  Steps, 
  Row, 
  Col, 
  Statistic,
  Tag,
  Alert,
  Spin,
  Modal
} from 'antd';
import { 
  CloudOutlined, 
  DatabaseOutlined, 
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const K8sCollector = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [collectedData, setCollectedData] = useState(null);
  const [buildResult, setBuildResult] = useState(null);
  const [dataModalVisible, setDataModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    fetchNamespaces();
  }, []);

  const fetchNamespaces = async () => {
    try {
      const response = await axios.get('/api/k8s/collect');
      if (response.data.success) {
        const nsList = response.data.data.namespaces.map(ns => ns.name);
        setNamespaces(nsList);
      }
    } catch (error) {
      console.error('获取命名空间失败:', error);
    }
  };

  const handleCollectData = async () => {
    try {
      setLoading(true);
      message.loading('正在收集K8s数据...', 0);
      
      const response = await axios.post('/api/k8s/collect', {
        namespace: selectedNamespace || undefined
      });
      
      message.destroy();
      
      if (response.data.success) {
        setCollectedData(response.data.data);
        setCurrentStep(1);
        message.success('数据收集成功！');
      } else {
        message.error(`数据收集失败: ${response.data.error}`);
      }
    } catch (error) {
      message.destroy();
      message.error('数据收集过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleBuildGraph = async () => {
    if (!collectedData) {
      message.error('请先收集K8s数据');
      return;
    }

    try {
      setLoading(true);
      message.loading('正在构建图数据库...', 0);
      
      const response = await axios.post('/api/graph/build', {
        k8s_data: collectedData
      });
      
      message.destroy();
      
      if (response.data.success) {
        setBuildResult(response.data);
        setCurrentStep(2);
        message.success('图数据库构建成功！');
      } else {
        message.error(`图数据库构建失败: ${response.data.error}`);
      }
    } catch (error) {
      message.destroy();
      message.error('图数据库构建过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  const showDataModal = (type, data) => {
    setModalData({ type, data });
    setDataModalVisible(true);
  };

  const podColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      key: 'namespace',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Running' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: '节点',
      dataIndex: 'node_name',
      key: 'node_name',
    },
    {
      title: '服务账户',
      dataIndex: 'service_account',
      key: 'service_account',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDataModal('Pod', record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const serviceColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      key: 'namespace',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Cluster IP',
      dataIndex: 'cluster_ip',
      key: 'cluster_ip',
    },
    {
      title: '端口',
      dataIndex: 'ports',
      key: 'ports',
      render: (ports) => (
        <div>
          {ports.map((port, index) => (
            <Tag key={index}>
              {port.port}:{port.target_port}/{port.protocol}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDataModal('Service', record)}
        >
          详情
        </Button>
      ),
    },
  ];

  const deploymentColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      key: 'namespace',
    },
    {
      title: '副本数',
      dataIndex: 'replicas',
      key: 'replicas',
    },
    {
      title: '服务账户',
      dataIndex: 'service_account',
      key: 'service_account',
      render: (account) => account || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDataModal('Deployment', record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>K8s数据收集与图数据库构建</h2>
      
      {/* 步骤指示器 */}
      <Card style={{ marginBottom: 24 }}>
        <Steps current={currentStep}>
          <Step title="数据收集" icon={<CloudOutlined />} />
          <Step title="图构建" icon={<DatabaseOutlined />} />
          <Step title="完成" icon={<CheckCircleOutlined />} />
        </Steps>
      </Card>

      {/* 数据收集阶段 */}
      <Card title="步骤1: 收集K8s数据" style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ marginRight: 8 }}>选择命名空间:</label>
            <Select
              style={{ width: 200 }}
              placeholder="全部命名空间"
              allowClear
              value={selectedNamespace}
              onChange={setSelectedNamespace}
            >
              {namespaces.map(ns => (
                <Option key={ns} value={ns}>{ns}</Option>
              ))}
            </Select>
          </div>
          
          <Button
            type="primary"
            icon={<CloudOutlined />}
            onClick={handleCollectData}
            loading={loading}
            disabled={currentStep > 0}
          >
            开始收集数据
          </Button>
        </Space>

        {collectedData && (
          <div style={{ marginTop: 24 }}>
            <Alert
              message="数据收集完成"
              description={`成功收集 ${collectedData.namespaces.length} 个命名空间, ${collectedData.pods.length} 个Pod, ${collectedData.services.length} 个服务`}
              type="success"
              showIcon
            />
          </div>
        )}
      </Card>

      {/* 图构建阶段 */}
      <Card title="步骤2: 构建图数据库" style={{ marginBottom: 24 }}>
        <Button
          type="primary"
          icon={<DatabaseOutlined />}
          onClick={handleBuildGraph}
          loading={loading}
          disabled={!collectedData || currentStep > 1}
        >
          构建图数据库
        </Button>

        {buildResult && (
          <Alert
            message="图数据库构建完成"
            description="K8s资产数据已成功导入JanusGraph图数据库"
            type="success"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 数据展示 */}
      {collectedData && (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="收集的数据统计">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="命名空间"
                    value={collectedData.namespaces.length}
                    prefix={<CloudOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Pod"
                    value={collectedData.pods.length}
                    prefix={<CloudOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="服务"
                    value={collectedData.services.length}
                    prefix={<CloudOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="部署"
                    value={collectedData.deployments.length}
                    prefix={<CloudOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="Pod列表" size="small">
              <Table
                dataSource={collectedData.pods}
                columns={podColumns}
                rowKey="uid"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="服务列表" size="small">
              <Table
                dataSource={collectedData.services}
                columns={serviceColumns}
                rowKey="uid"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="部署列表" size="small">
              <Table
                dataSource={collectedData.deployments}
                columns={deploymentColumns}
                rowKey="uid"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 数据详情弹窗 */}
      <Modal
        title={`${modalData?.type} 详情`}
        visible={dataModalVisible}
        onCancel={() => setDataModalVisible(false)}
        footer={null}
        width={800}
      >
        {modalData && (
          <TextArea
            value={JSON.stringify(modalData.data, null, 2)}
            rows={20}
            readOnly
          />
        )}
      </Modal>
    </div>
  );
};

export default K8sCollector;