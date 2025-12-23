import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Row, Col, Select, Button, Space, Tag, Spin, Alert, Tooltip } from 'antd';
import { ReloadOutlined, FullscreenOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import * as d3 from 'd3';

const { Option } = Select;

const GraphVisualization = () => {
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    fetchGraphData();
  }, [selectedNamespace]);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = selectedNamespace ? { namespace: selectedNamespace } : {};
      const response = await fetch(`/api/graph/visualization?${new URLSearchParams(params)}`);
      const result = await response.json();
      
      if (result.success) {
        setGraphData(result.data);
      } else {
        setError('获取图数据失败');
      }
    } catch (err) {
      console.error('获取图数据失败:', err);
      setError('无法连接到服务器');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (type, riskLevel) => {
    const baseColors = {
      'Namespace': '#1890ff',
      'Pod': '#52c41a',
      'Service': '#faad14',
      'Deployment': '#722ed1',
      'ClusterRole': '#ff4d4f'
    };
    
    const color = baseColors[type] || '#666';
    
    // 根据风险级别调整颜色透明度
    if (riskLevel === 'high') {
      return d3.color(color).darker(0.5);
    } else if (riskLevel === 'medium') {
      return d3.color(color).darker(0.2);
    }
    
    return color;
  };

  const drawGraph = useCallback(() => {
    if (!svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = 600;

    const g = svg.append('g');

    // 添加缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);

    // 创建力导向图模拟
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.edges)
        .id(d => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    // 创建边
    const link = g.append('g')
      .selectAll('line')
      .data(graphData.edges)
      .enter().append('line')
      .attr('class', 'link')
      .style('stroke', '#999')
      .style('stroke-opacity', 0.6)
      .style('stroke-width', 2);

    // 创建节点组
    const node = g.append('g')
      .selectAll('g')
      .data(graphData.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(drag(simulation));

    // 添加节点圆圈
    node.append('circle')
      .attr('r', d => {
        const baseRadius = 20;
        if (d.type === 'Namespace') return baseRadius * 1.2;
        if (d.type === 'ClusterRole') return baseRadius * 0.8;
        return baseRadius;
      })
      .style('fill', d => getNodeColor(d.type, d.risk_level))
      .style('stroke', '#fff')
      .style('stroke-width', 2)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => {
            const baseRadius = 20;
            if (d.type === 'Namespace') return baseRadius * 1.4;
            if (d.type === 'ClusterRole') return baseRadius * 1;
            return baseRadius * 1.2;
          });
        
        // 显示节点信息
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);
        
        tooltip.transition()
          .duration(200)
          .style('opacity', .9);
        
        tooltip.html(`
          <strong>${d.label}</strong><br/>
          类型: ${d.type}<br/>
          命名空间: ${d.namespace || 'N/A'}<br/>
          风险级别: ${d.risk_level || 'unknown'}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => {
            const baseRadius = 20;
            if (d.type === 'Namespace') return baseRadius * 1.2;
            if (d.type === 'ClusterRole') return baseRadius * 0.8;
            return baseRadius;
          });
        
        d3.selectAll('.tooltip').remove();
      })
      .on('click', (event, d) => {
        setSelectedNode(d);
      });

    // 添加节点标签
    node.append('text')
      .text(d => {
        // 限制标签长度
        const maxLength = 12;
        return d.label.length > maxLength ? d.label.substring(0, maxLength) + '...' : d.label;
      })
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', -25)
      .style('font-size', '12px')
      .style('fill', '#333');

    // 添加类型标签
    node.append('text')
      .text(d => d.type)
      .attr('text-anchor', 'middle')
      .attr('dy', 35)
      .style('font-size', '10px')
      .style('fill', '#666');

    // 更新力的位置
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // 拖拽功能
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

  }, [graphData]);

  useEffect(() => {
    drawGraph();
  }, [graphData, drawGraph]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(currentTransform.k * 1.2)
      );
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const currentTransform = d3.zoomTransform(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom().transform,
        d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(currentTransform.k * 0.8)
      );
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        d3.zoom().transform,
        d3.zoomIdentity
      );
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={18}>
          <h2>图谱可视化</h2>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Space>
            <Button 
              icon={<ZoomOutOutlined />} 
              onClick={handleZoomOut}
              size="small"
            />
            <Button 
              icon={<ZoomInOutlined />} 
              onClick={handleZoomIn}
              size="small"
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
              size="small"
            >
              重置视图
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={18}>
          <Card
            title="云原生资产图谱"
            extra={
              <Space>
                <Select
                  style={{ width: 200 }}
                  placeholder="选择命名空间"
                  allowClear
                  value={selectedNamespace}
                  onChange={setSelectedNamespace}
                >
                  {/* 从图数据中提取命名空间列表 */}
                  {Array.from(new Set(graphData.nodes.map(n => n.namespace))).filter(Boolean).map(ns => (
                    <Option key={ns} value={ns}>{ns}</Option>
                  ))}
                </Select>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={fetchGraphData}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            {loading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : error ? (
              <Alert
                message="错误"
                description={error}
                type="error"
                showIcon
              />
            ) : (
              <div className="graph-container">
                <svg
                  ref={svgRef}
                  width="100%"
                  height="600"
                  style={{ border: '1px solid #d9d9d9', borderRadius: '6px' }}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col span={6}>
          {/* 节点类型图例 */}
          <Card title="节点类型" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {['Namespace', 'Pod', 'Service', 'Deployment', 'ClusterRole'].map(type => (
                <div key={type} style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: getNodeColor(type, 'low'),
                      marginRight: 8
                    }}
                  />
                  <span>{type}</span>
                </div>
              ))}
            </Space>
          </Card>

          {/* 统计信息 */}
          <Card title="统计信息" size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>节点总数: {graphData.nodes.length}</div>
              <div>边总数: {graphData.edges.length}</div>
              <div>缩放级别: {(zoomLevel * 100).toFixed(0)}%</div>
            </Space>
          </Card>

          {/* 选中节点详情 */}
          {selectedNode && (
            <Card title="节点详情" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>名称:</strong> {selectedNode.label}</div>
                <div><strong>类型:</strong> <Tag>{selectedNode.type}</Tag></div>
                <div><strong>命名空间:</strong> {selectedNode.namespace || 'N/A'}</div>
                <div><strong>风险级别:</strong> 
                  <Tag color={selectedNode.risk_level === 'high' ? 'red' : 
                               selectedNode.risk_level === 'medium' ? 'orange' : 'green'}>
                    {selectedNode.risk_level || 'unknown'}
                  </Tag>
                </div>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default GraphVisualization;