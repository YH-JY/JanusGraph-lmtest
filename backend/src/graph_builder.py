from janusgraph_connector import JanusGraphConnector
from k8s_collector import K8sCollector
import logging
import json

class K8sGraphBuilder:
    def __init__(self, janusgraph_connector):
        self.jc = janusgraph_connector
        self.vertex_cache = {}  # 缓存顶点ID，避免重复创建
        
    def build_graph_from_k8s_data(self, k8s_data):
        """从K8s数据构建图"""
        try:
            # 清空现有图数据
            self.jc.clear_graph()
            
            # 创建命名空间顶点
            namespace_vertices = {}
            for ns in k8s_data.get('namespaces', []):
                vertex_id = self._create_namespace_vertex(ns)
                namespace_vertices[ns['name']] = vertex_id
            
            # 创建Pod顶点和关系
            pod_vertices = []
            for pod in k8s_data.get('pods', []):
                pod_vertex = self._create_pod_vertex(pod)
                pod_vertices.append(pod_vertex)
                
                # 连接到命名空间
                ns_vertex = namespace_vertices.get(pod['namespace'])
                if ns_vertex and pod_vertex:
                    self._create_edge(ns_vertex, pod_vertex, 'contains', {
                        'relationship': 'namespace_contains_pod',
                        'created': pod['created']
                    })
            
            # 创建Service顶点和关系
            service_vertices = []
            for svc in k8s_data.get('services', []):
                svc_vertex = self._create_service_vertex(svc)
                service_vertices.append(svc_vertex)
                
                # 连接到命名空间
                ns_vertex = namespace_vertices.get(svc['namespace'])
                if ns_vertex and svc_vertex:
                    self._create_edge(ns_vertex, svc_vertex, 'contains', {
                        'relationship': 'namespace_contains_service',
                        'created': svc['created']
                    })
                
                # 连接到Pod（通过标签选择器）
                self._connect_service_to_pods(svc, pod_vertices, svc_vertex)
            
            # 创建Deployment顶点和关系
            deploy_vertices = []
            for deploy in k8s_data.get('deployments', []):
                deploy_vertex = self._create_deployment_vertex(deploy)
                deploy_vertices.append(deploy_vertex)
                
                # 连接到命名空间
                ns_vertex = namespace_vertices.get(deploy['namespace'])
                if ns_vertex and deploy_vertex:
                    self._create_edge(ns_vertex, deploy_vertex, 'contains', {
                        'relationship': 'namespace_contains_deployment',
                        'created': deploy['created']
                    })
                
                # 连接到Pod（通过选择器）
                self._connect_deployment_to_pods(deploy, pod_vertices, deploy_vertex)
            
            # 创建ClusterRole顶点和关系
            cluster_role_vertices = []
            for role in k8s_data.get('cluster_roles', []):
                role_vertex = self._create_cluster_role_vertex(role)
                cluster_role_vertices.append(role_vertex)
            
            # 创建攻击路径关系
            self._create_attack_path_relationships(pod_vertices, service_vertices, cluster_role_vertices)
            
            logging.info("成功构建K8s资产图")
            return True
            
        except Exception as e:
            logging.error(f"构建图失败: {e}")
            return False
    
    def _create_namespace_vertex(self, ns):
        """创建命名空间顶点"""
        key = f"namespace:{ns['name']}"
        if key in self.vertex_cache:
            return self.vertex_cache[key]
            
        properties = {
            'name': ns['name'],
            'uid': ns['uid'],
            'created': ns['created'],
            'labels': json.dumps(ns['labels']),
            'status': ns['status'],
            'type': 'namespace'
        }
        vertex = self.jc.add_vertex('Namespace', properties)
        self.vertex_cache[key] = vertex
        return vertex
    
    def _create_pod_vertex(self, pod):
        """创建Pod顶点"""
        key = f"pod:{pod['namespace']}:{pod['name']}"
        if key in self.vertex_cache:
            return self.vertex_cache[key]
            
        properties = {
            'name': pod['name'],
            'namespace': pod['namespace'],
            'uid': pod['uid'],
            'created': pod['created'],
            'labels': json.dumps(pod['labels']),
            'status': pod['status'],
            'node_name': pod['node_name'],
            'service_account': pod['service_account'],
            'containers': json.dumps(pod['containers']),
            'security_context': json.dumps(pod.get('security_context', {})),
            'type': 'pod'
        }
        vertex = self.jc.add_vertex('Pod', properties)
        self.vertex_cache[key] = vertex
        return vertex
    
    def _create_service_vertex(self, svc):
        """创建Service顶点"""
        key = f"service:{svc['namespace']}:{svc['name']}"
        if key in self.vertex_cache:
            return self.vertex_cache[key]
            
        properties = {
            'name': svc['name'],
            'namespace': svc['namespace'],
            'uid': svc['uid'],
            'created': svc['created'],
            'labels': json.dumps(svc['labels']),
            'type': svc['type'],
            'cluster_ip': svc['cluster_ip'],
            'external_ips': json.dumps(svc['external_ips']),
            'ports': json.dumps(svc['ports']),
            'service_type': 'service'
        }
        vertex = self.jc.add_vertex('Service', properties)
        self.vertex_cache[key] = vertex
        return vertex
    
    def _create_deployment_vertex(self, deploy):
        """创建Deployment顶点"""
        key = f"deployment:{deploy['namespace']}:{deploy['name']}"
        if key in self.vertex_cache:
            return self.vertex_cache[key]
            
        properties = {
            'name': deploy['name'],
            'namespace': deploy['namespace'],
            'uid': deploy['uid'],
            'created': deploy['created'],
            'labels': json.dumps(deploy['labels']),
            'replicas': deploy['replicas'],
            'selector': json.dumps(deploy['selector']),
            'template_labels': json.dumps(deploy['template_labels']),
            'service_account': deploy['service_account'],
            'deployment_type': 'deployment'
        }
        vertex = self.jc.add_vertex('Deployment', properties)
        self.vertex_cache[key] = vertex
        return vertex
    
    def _create_cluster_role_vertex(self, role):
        """创建ClusterRole顶点"""
        key = f"cluster_role:{role['name']}"
        if key in self.vertex_cache:
            return self.vertex_cache[key]
            
        properties = {
            'name': role['name'],
            'uid': role['uid'],
            'created': role['created'],
            'rules': json.dumps(role['rules']),
            'role_type': 'cluster_role'
        }
        vertex = self.jc.add_vertex('ClusterRole', properties)
        self.vertex_cache[key] = vertex
        return vertex
    
    def _create_edge(self, from_vertex, to_vertex, edge_label, properties=None):
        """创建边"""
        if from_vertex and to_vertex:
            self.jc.add_edge(from_vertex, to_vertex, edge_label, properties)
    
    def _connect_service_to_pods(self, service, pod_vertices, service_vertex):
        """连接Service到Pod"""
        service_labels = service.get('labels', {})
        
        for pod_vertex in pod_vertices:
            if self._pod_matches_selector(pod_vertex, service_labels):
                self._create_edge(service_vertex, pod_vertex, 'exposes', {
                    'relationship': 'service_exposes_pod',
                    'expose_type': 'network'
                })
    
    def _connect_deployment_to_pods(self, deployment, pod_vertices, deploy_vertex):
        """连接Deployment到Pod"""
        selector = deployment.get('selector', {})
        
        for pod_vertex in pod_vertices:
            if self._pod_matches_selector(pod_vertex, selector):
                self._create_edge(deploy_vertex, pod_vertex, 'manages', {
                    'relationship': 'deployment_manages_pod',
                    'manage_type': 'orchestration'
                })
    
    def _pod_matches_selector(self, pod_vertex, selector):
        """检查Pod是否匹配选择器"""
        try:
            pod_labels = json.loads(pod_vertex.property('labels').value or '{}')
            for key, value in selector.items():
                if pod_labels.get(key) != value:
                    return False
            return True
        except:
            return False
    
    def _create_attack_path_relationships(self, pod_vertices, service_vertices, cluster_role_vertices):
        """创建攻击路径关系"""
        for pod_vertex in pod_vertices:
            try:
                # 检查特权容器
                containers = json.loads(pod_vertex.property('containers').value or '[]')
                security_context = json.loads(pod_vertex.property('security_context').value or '{}')
                
                is_privileged = False
                for container in containers:
                    # 这里可以添加更多安全检查逻辑
                    if 'privileged' in container and container['privileged']:
                        is_privileged = True
                        break
                
                if security_context.get('privileged') or is_privileged:
                    # 标记为高风险节点
                    pod_vertex.property('risk_level', 'high').iterate()
                
                # 检查serviceAccount权限
                service_account = pod_vertex.property('service_account').value
                if service_account:
                    for role_vertex in cluster_role_vertices:
                        # 创建潜在权限提升关系
                        self._create_edge(pod_vertex, role_vertex, 'potential_escalation', {
                            'relationship': 'service_account_to_cluster_role',
                            'attack_vector': 'privilege_escalation',
                            'confidence': 0.7
                        })
                        
            except Exception as e:
                logging.warning(f"创建攻击路径关系失败: {e}")