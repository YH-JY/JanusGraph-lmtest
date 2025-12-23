from gremlin_python import statics
from gremlin_python.structure.graph import Graph
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.strategies import *
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
import logging

class JanusGraphConnector:
    def __init__(self, host='192.168.40.129', port=8182):
        self.host = host
        self.port = port
        self.graph = None
        self.g = None
        self.connection = None
        
    def connect(self):
        try:
            # 建立到JanusGraph的连接
            self.connection = DriverRemoteConnection(
                f'ws://{self.host}:{self.port}/gremlin', 'g'
            )
            self.graph = Graph()
            self.g = self.graph.traversal().withRemote(self.connection)
            logging.info(f"成功连接到JanusGraph: {self.host}:{self.port}")
            return True
        except Exception as e:
            logging.error(f"连接JanusGraph失败: {e}")
            return False
    
    def disconnect(self):
        if self.connection:
            self.connection.close()
            logging.info("已断开JanusGraph连接")
    
    def execute_query(self, query):
        """执行Gremlin查询"""
        try:
            result = self.g.V().toList()
            return result
        except Exception as e:
            logging.error(f"查询执行失败: {e}")
            return None
    
    def add_vertex(self, label, properties=None):
        """添加顶点"""
        try:
            if properties is None:
                properties = {}
            vertex = self.g.addV(label).toList()[0]
            # 添加属性
            for key, value in properties.items():
                self.g.V(vertex.id).property(key, value).iterate()
            return vertex
        except Exception as e:
            logging.error(f"添加顶点失败: {e}")
            return None
    
    def add_edge(self, from_vertex, to_vertex, edge_label, properties=None):
        """添加边"""
        try:
            if properties is None:
                properties = {}
            edge = self.g.V(from_vertex).addE(edge_label).to(__.V(to_vertex)).toList()[0]
            # 添加属性
            for key, value in properties.items():
                self.g.E(edge.id).property(key, value).iterate()
            return edge
        except Exception as e:
            logging.error(f"添加边失败: {e}")
            return None
    
    def clear_graph(self):
        """清空图数据"""
        try:
            self.g.V().drop().iterate()
            logging.info("图数据已清空")
        except Exception as e:
            logging.error(f"清空图数据失败: {e}")