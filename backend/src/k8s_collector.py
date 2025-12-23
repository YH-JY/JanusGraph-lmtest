from kubernetes import client, config
import logging
from kubernetes.client.rest import ApiException

class K8sCollector:
    def __init__(self, config_path=None):
        self.config_path = config_path
        self.v1 = None
        self.apps_v1 = None
        self.networking_v1 = None
        self.rbac_v1 = None
        
    def connect(self):
        """连接到K8s集群"""
        try:
            if self.config_path:
                config.load_kube_config(config_file=self.config_path)
            else:
                config.load_incluster_config()  # 在集群内运行时使用
            
            self.v1 = client.CoreV1Api()
            self.apps_v1 = client.AppsV1Api()
            self.networking_v1 = client.NetworkingV1Api()
            self.rbac_v1 = client.RbacAuthorizationV1Api()
            
            # 测试连接
            self.v1.get_api_resources()
            logging.info("成功连接到K8s集群")
            return True
        except Exception as e:
            logging.error(f"连接K8s集群失败: {e}")
            return False
    
    def collect_namespaces(self):
        """收集命名空间信息"""
        try:
            namespaces = self.v1.list_namespace()
            return [{
                'name': ns.metadata.name,
                'uid': ns.metadata.uid,
                'created': ns.metadata.creation_timestamp.isoformat(),
                'labels': ns.metadata.labels or {},
                'status': ns.status.phase
            } for ns in namespaces.items]
        except ApiException as e:
            logging.error(f"获取命名空间失败: {e}")
            return []
    
    def collect_pods(self, namespace=None):
        """收集Pod信息"""
        try:
            if namespace:
                pods = self.v1.list_namespaced_pod(namespace)
            else:
                pods = self.v1.list_pod_for_all_namespaces()
            
            pod_data = []
            for pod in pods.items:
                pod_info = {
                    'name': pod.metadata.name,
                    'namespace': pod.metadata.namespace,
                    'uid': pod.metadata.uid,
                    'created': pod.metadata.creation_timestamp.isoformat(),
                    'labels': pod.metadata.labels or {},
                    'status': pod.status.phase,
                    'node_name': pod.spec.node_name,
                    'service_account': pod.spec.service_account_name,
                    'containers': []
                }
                
                # 收集容器信息
                for container in pod.spec.containers:
                    pod_info['containers'].append({
                        'name': container.name,
                        'image': container.image,
                        'ports': [{'containerPort': port.container_port, 'protocol': port.protocol} 
                                 for port in (container.ports or [])],
                        'env_vars': [{'name': env.name, 'value': env.value} 
                                    for env in (container.env or []) if env.value]
                    })
                
                # 收集安全上下文
                if pod.spec.security_context:
                    pod_info['security_context'] = {
                        'privileged': pod.spec.security_context.privileged,
                        'run_as_root': pod.spec.security_context.run_as_user == 0
                    }
                
                pod_data.append(pod_info)
            
            return pod_data
        except ApiException as e:
            logging.error(f"获取Pod失败: {e}")
            return []
    
    def collect_services(self, namespace=None):
        """收集Service信息"""
        try:
            if namespace:
                services = self.v1.list_namespaced_service(namespace)
            else:
                services = self.v1.list_service_for_all_namespaces()
            
            service_data = []
            for svc in services.items:
                service_info = {
                    'name': svc.metadata.name,
                    'namespace': svc.metadata.namespace,
                    'uid': svc.metadata.uid,
                    'created': svc.metadata.creation_timestamp.isoformat(),
                    'labels': svc.metadata.labels or {},
                    'type': svc.spec.type,
                    'cluster_ip': svc.spec.cluster_ip,
                    'external_ips': svc.spec.external_i_ps or [],
                    'ports': [{'port': port.port, 'target_port': port.target_port, 
                              'protocol': port.protocol} for port in (svc.spec.ports or [])]
                }
                service_data.append(service_info)
            
            return service_data
        except ApiException as e:
            logging.error(f"获取Service失败: {e}")
            return []
    
    def collect_deployments(self, namespace=None):
        """收集Deployment信息"""
        try:
            if namespace:
                deployments = self.apps_v1.list_namespaced_deployment(namespace)
            else:
                deployments = self.apps_v1.list_deployment_for_all_namespaces()
            
            deployment_data = []
            for deploy in deployments.items:
                deploy_info = {
                    'name': deploy.metadata.name,
                    'namespace': deploy.metadata.namespace,
                    'uid': deploy.metadata.uid,
                    'created': deploy.metadata.creation_timestamp.isoformat(),
                    'labels': deploy.metadata.labels or {},
                    'replicas': deploy.spec.replicas,
                    'selector': deploy.spec.selector.match_labels if deploy.spec.selector else {},
                    'template_labels': deploy.spec.template.metadata.labels if deploy.spec.template else {},
                    'service_account': deploy.spec.template.spec.service_account_name if deploy.spec.template else None
                }
                deployment_data.append(deploy_info)
            
            return deployment_data
        except ApiException as e:
            logging.error(f"获取Deployment失败: {e}")
            return []
    
    def collect_cluster_roles(self):
        """收集ClusterRole信息"""
        try:
            cluster_roles = self.rbac_v1.list_cluster_role()
            role_data = []
            for role in cluster_roles.items:
                role_info = {
                    'name': role.metadata.name,
                    'uid': role.metadata.uid,
                    'created': role.metadata.creation_timestamp.isoformat(),
                    'rules': []
                }
                
                for rule in role.rules or []:
                    rule_info = {
                        'verbs': rule.verbs or [],
                        'api_groups': rule.api_groups or [],
                        'resources': rule.resources or [],
                        'resources': rule.resources or [],
                        'non_resource_urls': rule.non_resource_urls or []
                    }
                    role_info['rules'].append(rule_info)
                
                role_data.append(role_info)
            
            return role_data
        except ApiException as e:
            logging.error(f"获取ClusterRole失败: {e}")
            return []