from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

from janusgraph_connector import JanusGraphConnector
from k8s_collector import K8sCollector
from graph_builder import K8sGraphBuilder
from attack_path_analyzer import AttackPathAnalyzer

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 加载环境变量
load_dotenv()

app = Flask(__name__)
CORS(app)

# 全局变量
janusgraph_connector = None
k8s_collector = None
graph_builder = None
attack_analyzer = None

def initialize_connections():
    """初始化连接"""
    global janusgraph_connector, k8s_collector, graph_builder, attack_analyzer
    
    try:
        # 初始化JanusGraph连接
        janusgraph_host = os.getenv('JANUSGRAPH_HOST', '192.168.40.129')
        janusgraph_port = int(os.getenv('JANUSGRAPH_PORT', '8182'))
        
        janusgraph_connector = JanusGraphConnector(janusgraph_host, janusgraph_port)
        if not janusgraph_connector.connect():
            logger.error("无法连接到JanusGraph")
            return False
        
        # 初始化K8s连接
        k8s_config_path = os.getenv('K8S_CONFIG_PATH', None)
        k8s_collector = K8sCollector(k8s_config_path)
        if not k8s_collector.connect():
            logger.error("无法连接到K8s集群")
            return False
        
        # 初始化图构建器
        graph_builder = K8sGraphBuilder(janusgraph_connector)
        
        # 初始化攻击路径分析器
        attack_analyzer = AttackPathAnalyzer(janusgraph_connector)
        
        logger.info("所有连接初始化成功")
        return True
        
    except Exception as e:
        logger.error(f"初始化连接失败: {e}")
        return False

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'janusgraph_connected': janusgraph_connector is not None,
        'k8s_connected': k8s_collector is not None
    })

@app.route('/api/k8s/collect', methods=['POST'])
def collect_k8s_data():
    """收集K8s数据"""
    try:
        data = request.get_json() or {}
        namespace = data.get('namespace', None)
        
        logger.info(f"开始收集K8s数据，命名空间: {namespace}")
        
        # 收集各种K8s资源
        k8s_data = {
            'namespaces': k8s_collector.collect_namespaces(),
            'pods': k8s_collector.collect_pods(namespace),
            'services': k8s_collector.collect_services(namespace),
            'deployments': k8s_collector.collect_deployments(namespace),
            'cluster_roles': k8s_collector.collect_cluster_roles()
        }
        
        logger.info(f"数据收集完成: {len(k8s_data['pods'])} Pods, {len(k8s_data['services'])} Services")
        
        return jsonify({
            'success': True,
            'data': k8s_data,
            'statistics': {
                'namespaces': len(k8s_data['namespaces']),
                'pods': len(k8s_data['pods']),
                'services': len(k8s_data['services']),
                'deployments': len(k8s_data['deployments']),
                'cluster_roles': len(k8s_data['cluster_roles'])
            }
        })
        
    except Exception as e:
        logger.error(f"收集K8s数据失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/graph/build', methods=['POST'])
def build_graph():
    """构建图数据库"""
    try:
        data = request.get_json()
        k8s_data = data.get('k8s_data')
        
        if not k8s_data:
            return jsonify({'success': False, 'error': '缺少K8s数据'}), 400
        
        logger.info("开始构建图数据库")
        
        success = graph_builder.build_graph_from_k8s_data(k8s_data)
        
        if success:
            logger.info("图数据库构建成功")
            return jsonify({'success': True, 'message': '图数据库构建成功'})
        else:
            return jsonify({'success': False, 'error': '图数据库构建失败'}), 500
            
    except Exception as e:
        logger.error(f"构建图数据库失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/graph/vertices', methods=['GET'])
def get_vertices():
    """获取顶点"""
    try:
        vertex_type = request.args.get('type')
        namespace = request.args.get('namespace')
        
        vertices = attack_analyzer.get_all_vertices(vertex_type, namespace)
        
        return jsonify({
            'success': True,
            'data': vertices,
            'count': len(vertices)
        })
        
    except Exception as e:
        logger.error(f"获取顶点失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/graph/visualization', methods=['GET'])
def get_visualization_data():
    """获取可视化数据"""
    try:
        namespace = request.args.get('namespace')
        
        data = attack_analyzer.get_graph_data_for_visualization(namespace)
        
        return jsonify({
            'success': True,
            'data': data
        })
        
    except Exception as e:
        logger.error(f"获取可视化数据失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/attack/paths', methods=['GET'])
def find_attack_paths():
    """查找攻击路径"""
    try:
        source_type = request.args.get('source_type')
        target_type = request.args.get('target_type')
        max_depth = int(request.args.get('max_depth', 5))
        
        paths = attack_analyzer.find_attack_paths(source_type, target_type, max_depth)
        
        return jsonify({
            'success': True,
            'data': paths,
            'count': len(paths)
        })
        
    except Exception as e:
        logger.error(f"查找攻击路径失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/attack/risk', methods=['GET'])
def get_risk_assessment():
    """获取风险评估"""
    try:
        assessment = attack_analyzer.get_risk_assessment()
        
        return jsonify({
            'success': True,
            'data': assessment
        })
        
    except Exception as e:
        logger.error(f"风险评估失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/graph/statistics', methods=['GET'])
def get_statistics():
    """获取图统计信息"""
    try:
        stats = attack_analyzer.get_graph_statistics()
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"获取统计信息失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/full-process', methods=['POST'])
def full_process():
    """完整流程：收集数据 -> 构建图 -> 返回可视化数据"""
    try:
        data = request.get_json() or {}
        namespace = data.get('namespace', None)
        
        logger.info("开始完整流程")
        
        # 1. 收集K8s数据
        k8s_data = {
            'namespaces': k8s_collector.collect_namespaces(),
            'pods': k8s_collector.collect_pods(namespace),
            'services': k8s_collector.collect_services(namespace),
            'deployments': k8s_collector.collect_deployments(namespace),
            'cluster_roles': k8s_collector.collect_cluster_roles()
        }
        
        # 2. 构建图数据库
        success = graph_builder.build_graph_from_k8s_data(k8s_data)
        if not success:
            return jsonify({'success': False, 'error': '图数据库构建失败'}), 500
        
        # 3. 获取可视化数据
        viz_data = attack_analyzer.get_graph_data_for_visualization(namespace)
        
        # 4. 获取风险评估
        risk_assessment = attack_analyzer.get_risk_assessment()
        
        result = {
            'success': True,
            'data': {
                'k8s_statistics': {
                    'namespaces': len(k8s_data['namespaces']),
                    'pods': len(k8s_data['pods']),
                    'services': len(k8s_data['services']),
                    'deployments': len(k8s_data['deployments']),
                    'cluster_roles': len(k8s_data['cluster_roles'])
                },
                'graph_visualization': viz_data,
                'risk_assessment': risk_assessment
            }
        }
        
        logger.info("完整流程执行成功")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"完整流程失败: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'API端点未找到'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': '内部服务器错误'}), 500

if __name__ == '__main__':
    if initialize_connections():
        port = int(os.getenv('FLASK_PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=True)
    else:
        logger.error("应用启动失败：无法初始化连接")
        exit(1)