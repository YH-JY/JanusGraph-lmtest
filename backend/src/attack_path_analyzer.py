from janusgraph_connector import JanusGraphConnector
import logging
import json
from collections import defaultdict

class AttackPathAnalyzer:
    def __init__(self, janusgraph_connector):
        self.jc = janusgraph_connector
    
    def find_attack_paths(self, source_type=None, target_type=None, max_depth=5):
        """查找攻击路径"""
        try:
            # 构建Gremlin查询
            query = self.jc.g.V()
            
            if source_type:
                query = query.hasLabel(source_type)
            
            # 查找可能的攻击路径
            paths = []
            vertices = query.toList()
            
            for source_vertex in vertices[:10]:  # 限制处理数量
                path_results = self.jc.g.V(source_vertex) \
                    .repeat(__.out().simplePath()) \
                    .until(__.hasLabel(target_type) if target_type else __.loops().is_(max_depth)) \
                    .path().by(__.valueMap()).by(__.label()).limit(20).toList()
                
                for path in path_results:
                    paths.append(self._format_path(path))
            
            return paths
            
        except Exception as e:
            logging.error(f"查找攻击路径失败: {e}")
            return []
    
    def get_all_vertices(self, vertex_type=None, namespace=None):
        """获取所有顶点"""
        try:
            query = self.jc.g.V()
            
            if vertex_type:
                query = query.hasLabel(vertex_type)
            
            if namespace:
                query = query.has('namespace', namespace)
            
            vertices = query.by(__.valueMap()).toList()
            
            formatted_vertices = []
            for vertex in vertices:
                formatted_vertices.append(self._format_vertex(vertex))
            
            return formatted_vertices
            
        except Exception as e:
            logging.error(f"获取顶点失败: {e}")
            return []
    
    def get_vertex_edges(self, vertex_id):
        """获取顶点的所有边"""
        try:
            edges = self.jc.g.V(vertex_id).bothE().by(__.valueMap()).by(__.inV().valueMap()).toList()
            
            formatted_edges = []
            for edge in edges:
                formatted_edges.append(self._format_edge(edge))
            
            return formatted_edges
            
        except Exception as e:
            logging.error(f"获取边失败: {e}")
            return []
    
    def get_risk_assessment(self):
        """获取风险评估"""
        try:
            # 查找高风险节点
            high_risk_vertices = self.jc.g.V().has('risk_level', 'high').by(__.valueMap()).toList()
            
            # 查找特权容器
            privileged_pods = self.jc.g.V().hasLabel('Pod').has('security_context', __.contains('privileged')).by(__.valueMap()).toList()
            
            # 查找暴露的服务
            exposed_services = self.jc.g.V().hasLabel('Service').has('type', 'LoadBalancer').by(__.valueMap()).toList()
            
            assessment = {
                'high_risk_count': len(high_risk_vertices),
                'privileged_pod_count': len(privileged_pods),
                'exposed_service_count': len(exposed_services),
                'total_vertices': len(self.jc.g.V().toList()),
                'risk_factors': self._analyze_risk_factors()
            }
            
            return assessment
            
        except Exception as e:
            logging.error(f"风险评估失败: {e}")
            return {}
    
    def get_graph_data_for_visualization(self, namespace=None):
        """获取可视化图数据"""
        try:
            # 获取顶点
            vertices_query = self.jc.g.V()
            if namespace:
                vertices_query = vertices_query.has('namespace', namespace)
            
            vertices = vertices_query.by(__.valueMap()).by(__.label()).limit(200).toList()
            
            nodes = []
            edges = []
            vertex_ids = {}
            
            # 处理顶点
            for vertex_data in vertices:
                vertex_properties = vertex_data[0]
                vertex_label = vertex_data[1]
                vertex_id = vertex_properties.get('id', [None])[0]
                
                if not vertex_id:
                    continue
                
                vertex_ids[vertex_id] = len(nodes)
                
                node = {
                    'id': vertex_id,
                    'label': vertex_properties.get('name', ['Unknown'])[0],
                    'type': vertex_label,
                    'namespace': vertex_properties.get('namespace', [''])[0],
                    'properties': {k: v[0] if v else '' for k, v in vertex_properties.items() if k != 'id'},
                    'risk_level': vertex_properties.get('risk_level', ['medium'])[0]
                }
                nodes.append(node)
            
            # 处理边
            for vertex_data in vertices:
                vertex_properties = vertex_data[0]
                vertex_id = vertex_properties.get('id', [None])[0]
                
                if not vertex_id or vertex_id not in vertex_ids:
                    continue
                
                try:
                    vertex_edges = self.jc.g.V(vertex_id).bothE().by(__.valueMap()).by(__.otherV().valueMap()).limit(50).toList()
                    
                    for edge_data in vertex_edges:
                        edge_properties = edge_data[0]
                        target_vertex = edge_data[1]
                        
                        if not target_vertex or 'id' not in target_vertex:
                            continue
                            
                        target_id = target_vertex['id'][0]
                        
                        if target_id in vertex_ids:
                            edge = {
                                'source': vertex_id,
                                'target': target_id,
                                'label': edge_properties.get('relationship', ['connected'])[0],
                                'properties': {k: v[0] if v else '' for k, v in edge_properties.items() if k != 'id'}
                            }
                            edges.append(edge)
                except:
                    continue
            
            return {
                'nodes': nodes,
                'edges': edges,
                'statistics': self.get_graph_statistics()
            }
            
        except Exception as e:
            logging.error(f"获取可视化数据失败: {e}")
            return {'nodes': [], 'edges': []}
    
    def get_graph_statistics(self):
        """获取图统计信息"""
        try:
            stats = {
                'total_vertices': len(self.jc.g.V().toList()),
                'total_edges': len(self.jc.g.E().toList()),
                'vertex_types': defaultdict(int),
                'edge_types': defaultdict(int)
            }
            
            # 统计顶点类型
            vertices = self.jc.g.V().by(__.label()).toList()
            for label in vertices:
                stats['vertex_types'][label] += 1
            
            # 统计边类型
            edges = self.jc.g.E().by(__.label()).toList()
            for label in edges:
                stats['edge_types'][label] += 1
            
            return dict(stats)
            
        except Exception as e:
            logging.error(f"获取统计信息失败: {e}")
            return {}
    
    def _format_path(self, path):
        """格式化路径数据"""
        formatted_path = []
        for step in path:
            if isinstance(step, dict):
                formatted_path.append({
                    'properties': step,
                    'type': 'vertex'
                })
            else:
                formatted_path.append({
                    'label': step,
                    'type': 'edge'
                })
        return formatted_path
    
    def _format_vertex(self, vertex_data):
        """格式化顶点数据"""
        return {
            'id': vertex_data.get('id', [''])[0],
            'label': vertex_data.get('label', ''),
            'properties': {k: v[0] if v else '' for k, v in vertex_data.items() if k != 'id'}
        }
    
    def _format_edge(self, edge_data):
        """格式化边数据"""
        return {
            'id': edge_data[0].get('id', [''])[0],
            'label': edge_data[0].get('label', ''),
            'properties': {k: v[0] if v else '' for k, v in edge_data[0].items() if k != 'id'},
            'target_vertex': edge_data[1] if len(edge_data) > 1 else None
        }
    
    def _analyze_risk_factors(self):
        """分析风险因素"""
        risk_factors = []
        
        try:
            # 检查特权容器
            privileged_count = len(self.jc.g.V().hasLabel('Pod').has('security_context', __.contains('privileged')).toList())
            if privileged_count > 0:
                risk_factors.append({
                    'factor': 'privileged_containers',
                    'count': privileged_count,
                    'severity': 'high',
                    'description': f'发现{privileged_count}个特权容器，可能存在权限提升风险'
                })
            
            # 检查暴露的服务
            exposed_count = len(self.jc.g.V().hasLabel('Service').has('type', 'LoadBalancer').toList())
            if exposed_count > 0:
                risk_factors.append({
                    'factor': 'exposed_services',
                    'count': exposed_count,
                    'severity': 'medium',
                    'description': f'发现{exposed_count}个暴露的服务，可能被外部访问'
                })
            
            # 检查高危角色权限
            high_privilege_roles = len(self.jc.g.V().hasLabel('ClusterRole').has('rules', __.contains('*')).toList())
            if high_privilege_roles > 0:
                risk_factors.append({
                    'factor': 'high_privilege_roles',
                    'count': high_privilege_roles,
                    'severity': 'high',
                    'description': f'发现{high_privilege_roles}个高权限角色，可能存在过度授权'
                })
                
        except Exception as e:
            logging.warning(f"风险因素分析失败: {e}")
        
        return risk_factors