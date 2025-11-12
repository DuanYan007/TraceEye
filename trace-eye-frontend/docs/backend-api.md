# TraceEye Backend API 文档

## 概述
本文档定义了TraceEye前端与Flask后端的API接口规范，重点包含SLOT APT检测系统的五个核心模块接口。

## 基础配置
- **Base URL**: `http://localhost:5000/api/v1`
- **认证方式**: Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 通用响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 1. 认证相关接口

### 1.1 用户登录
```
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "email": "admin@traceye.com",
      "role": "administrator",
      "permissions": ["slot:read", "slot:write", "apt:monitor"]
    },
    "expires_in": 86400
  }
}
```

## 2. SLOT模块接口

### 2.1 图构建模块 (Graph Construction)

#### 2.1.1 上传日志文件
```
POST /slot/graph/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
- logs: File
- dataset_name: String (可选，如 "DARPA-E3")
- description: String (可选)

Response:
{
  "code": 200,
  "message": "日志上传成功",
  "data": {
    "job_id": "job_123456",
    "file_info": {
      "original_filename": "audit.log",
      "size": 1024000,
      "lines_count": 50000,
      "upload_time": "2024-01-01T10:00:00Z"
    },
    "parsing_status": "processing"
  }
}
```

#### 2.1.2 获取图构建状态
```
GET /slot/graph/status/{job_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "获取状态成功",
  "data": {
    "job_id": "job_123456",
    "status": "completed", // processing, completed, failed
    "progress": 100,
    "graph_info": {
      "nodes_count": 1250,
      "edges_count": 4500,
      "entity_types": ["process", "file", "netflow", "memory"],
      "construction_time": "2024-01-01T10:05:00Z"
    }
  }
}
```

#### 2.1.3 获取初始溯源图数据
```
GET /slot/graph/initial/{job_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "获取图数据成功",
  "data": {
    "graph_id": "graph_789",
    "nodes": [
      {
        "id": "node_1",
        "type": "process",
        "attributes": {
          "name": "firefox",
          "pid": 1234,
          "command_line": "/usr/bin/firefox",
          "user": "admin",
          "timestamp": "2024-01-01T10:00:00Z"
        },
        "position": {
          "x": 100,
          "y": 200
        }
      }
    ],
    "edges": [
      {
        "id": "edge_1",
        "source": "node_1",
        "target": "node_2",
        "type": "execute",
        "attributes": {
          "timestamp": "2024-01-01T10:00:01Z"
        }
      }
    ]
  }
}
```

### 2.2 潜在行为挖掘模块 (Latent Behavior Mining)

#### 2.2.1 启动潜在行为挖掘
```
POST /slot/mining/start
Content-Type: application/json
Authorization: Bearer {token}

{
  "graph_id": "graph_789",
  "config": {
    "max_path_length": 5,
    "attention_heads": 4,
    "hidden_dimensions": 64
  }
}

Response:
{
  "code": 200,
  "message": "开始潜在行为挖掘",
  "data": {
    "mining_job_id": "mining_456",
    "estimated_time": "2-3分钟"
  }
}
```

#### 2.2.2 获取挖掘状态和结果
```
GET /slot/mining/status/{mining_job_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "挖掘完成",
  "data": {
    "mining_job_id": "mining_456",
    "status": "completed",
    "progress": 100,
    "discovered_relationships": 156,
    "latent_paths": [
      {
        "path_id": "path_1",
        "nodes": ["node_1", "node_3", "node_7", "node_12"],
        "relationships": ["execute", "write", "read"],
        "confidence_score": 0.87,
        "relationship_type": "causal"
      }
    ],
    "enhanced_graph": {
      "additional_edges": 156,
      "updated_nodes": 45
    }
  }
}
```

### 2.3 图强化学习嵌入模块 (Embedding with Graph Reinforcement Learning)

#### 2.3.1 启动嵌入处理
```
POST /slot/embedding/start
Content-Type: application/json
Authorization: Bearer {token}

{
  "mining_job_id": "mining_456",
  "config": {
    "embedding_dimension": 64,
    "rl_config": {
      "action_step_size": 0.02,
      "convergence_threshold": 10,
      "max_episodes": 100
    },
    "similarity_config": {
      "semantic_weight": 0.6,
      "topological_weight": 0.4
    }
  }
}

Response:
{
  "code": 200,
  "message": "开始嵌入处理",
  "data": {
    "embedding_job_id": "embedding_789",
    "estimated_time": "5-8分钟"
  }
}
```

#### 2.3.2 获取嵌入状态和相似度结果
```
GET /slot/embedding/status/{embedding_job_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "嵌入处理完成",
  "data": {
    "embedding_job_id": "embedding_789",
    "status": "completed",
    "progress": 100,
    "epoch": 15,
    "converged": true,
    "node_embeddings": [
      {
        "node_id": "node_1",
        "embedding_vector": [0.12, 0.45, -0.23, ...],
        "similarity_scores": {
          "node_2": 0.15,
          "node_3": 0.78,
          "node_4": 0.92
        },
        "filtered_neighbors": ["node_3", "node_4"]
      }
    ],
    "rl_metrics": {
      "average_reward": 0.85,
      "convergence_epoch": 12,
      "optimal_thresholds": {
        "execute": 0.65,
        "write": 0.72,
        "read": 0.58
      }
    }
  }
}
```

### 2.4 威胁检测模块 (Threat Detection)

#### 2.4.1 启动威胁检测
```
POST /slot/detection/start
Content-Type: application/json
Authorization: Bearer {token}

{
  "embedding_job_id": "embedding_789",
  "config": {
    "detection_threshold": 0.5,
    "anomaly_threshold": 0.8,
    "use_isolation_forest": true,
    "model_type": "mlp"
  }
}

Response:
{
  "code": 200,
  "message": "开始威胁检测",
  "data": {
    "detection_job_id": "detection_012",
    "estimated_time": "1-2分钟"
  }
}
```

#### 2.2.2 获取检测结果
```
GET /slot/detection/results/{detection_job_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "检测完成",
  "data": {
    "detection_job_id": "detection_012",
    "status": "completed",
    "detection_results": {
      "total_nodes": 1250,
      "malicious_nodes": 23,
      "anomalous_nodes": 15,
      "benign_nodes": 1212,
      "accuracy": 0.99,
      "precision": 0.96,
      "recall": 0.99,
      "f1_score": 0.97
    },
    "threat_entities": [
      {
        "node_id": "node_45",
        "node_type": "process",
        "threat_type": "malicious",
        "confidence": 0.94,
        "attributes": {
          "name": "Dragon",
          "pid": 5678,
          "command_line": "/home/admin/profile"
        },
        "detection_method": "supervised",
        "mlp_score": 0.94,
        "isolation_score": 0.12
      }
    ],
    "anomalous_entities": [
      {
        "node_id": "node_78",
        "node_type": "netflow",
        "threat_type": "anomalous",
        "confidence": 0.82,
        "attributes": {
          "ip": "146.153.68.151",
          "port": 443
        },
        "detection_method": "isolation_forest",
        "anomaly_score": 0.82
      }
    ]
  }
}
```

### 2.5 攻击链重建模块 (Attack Chain Reconstruction)

#### 2.5.1 启动攻击链重建
```
POST /slot/reconstruction/start
Content-Type: application/json
Authorization: Bearer {token}

{
  "detection_job_id": "detection_012",
  "config": {
    "use_attack_framework": true,
    "framework_type": "ATT&CK",
    "clustering_algorithm": "lpa",
    "min_chain_length": 3
  }
}

Response:
{
  "code": 200,
  "message": "开始攻击链重建",
  "data": {
    "reconstruction_job_id": "reconstruction_345",
    "estimated_time": "30-60秒"
  }
}
```

#### 2.5.2 获取攻击链结果
```
GET /slot/reconstruction/results/{reconstruction_job_id}
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "攻击链重建完成",
  "data": {
    "reconstruction_job_id": "reconstruction_345",
    "status": "completed",
    "attack_chains": [
      {
        "chain_id": "chain_1",
        "attack_stages": [
          {
            "stage": "initial_access",
            "ttp_code": "T1190",
            "description": "Exploit Public-Facing Application",
            "nodes": ["node_1", "node_2"],
            "timestamp": "2024-01-01T10:00:00Z",
            "confidence": 0.95
          },
          {
            "stage": "execution",
            "ttp_code": "T1059",
            "description": "Command and Scripting Interpreter",
            "nodes": ["node_3", "node_4"],
            "timestamp": "2024-01-01T10:02:00Z",
            "confidence": 0.92
          },
          {
            "stage": "exfiltration",
            "ttp_code": "T1041",
            "description": "Exfiltration Over C2 Channel",
            "nodes": ["node_5"],
            "timestamp": "2024-01-01T10:05:00Z",
            "confidence": 0.98
          }
        ],
        "chain_metrics": {
          "length": 3,
          "confidence": 0.95,
          "false_positive_rate": 0.02,
          "attack_duration": "5分钟"
        }
      }
    ],
    "reconstruction_summary": {
      "total_chains": 1,
      "total_stages": 3,
      "reduction_ratio": 0.95, // 相比原始节点数量减少95%
      "verification_time_saved": "45分钟"
    }
  }
}
```

## 3. 实时监控接口

### 3.1 获取系统状态
```
GET /slot/system/status
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "获取系统状态成功",
  "data": {
    "system_health": "healthy",
    "active_jobs": {
      "graph_construction": 0,
      "behavior_mining": 1,
      "embedding": 0,
      "detection": 0,
      "reconstruction": 0
    },
    "model_status": {
      "slot_model_loaded": true,
      "last_trained": "2024-01-01T09:00:00Z",
      "model_version": "v1.0.0"
    },
    "resource_usage": {
      "cpu_usage": "45%",
      "memory_usage": "2.3GB",
      "gpu_usage": "12%"
    }
  }
}
```

### 3.2 WebSocket实时推送
```
WebSocket: ws://localhost:5000/api/v1/slot/realtime
Authorization: Bearer {token}

推送消息格式:
{
  "type": "job_update",
  "job_id": "mining_456",
  "status": "completed",
  "progress": 100,
  "timestamp": "2024-01-01T10:15:00Z",
  "data": {
    // 具体更新数据
  }
}
```

## 4. 配置管理接口

### 4.1 获取SLOT模型配置
```
GET /slot/config
Authorization: Bearer {token}

Response:
{
  "code": 200,
  "message": "获取配置成功",
  "data": {
    "graph_config": {
      "max_nodes_per_batch": 5000,
      "relationship_types": ["execute", "write", "read", "connect", "send"]
    },
    "mining_config": {
      "max_path_length": 5,
      "attention_heads": 4,
      "hidden_dimensions": 64
    },
    "embedding_config": {
      "embedding_dimension": 64,
      "rl_step_size": 0.02,
      "similarity_weights": {
        "semantic": 0.6,
        "topological": 0.4
      }
    },
    "detection_config": {
      "malicious_threshold": 0.5,
      "anomaly_threshold": 0.8,
      "isolation_forest_contamination": 0.1
    }
  }
}
```

### 4.2 更新SLOT配置
```
PUT /slot/config
Content-Type: application/json
Authorization: Bearer {token}

{
  "embedding_config": {
    "embedding_dimension": 128,
    "rl_step_size": 0.01
  }
}

Response:
{
  "code": 200,
  "message": "配置更新成功",
  "data": {
    "updated_fields": ["embedding_dimension", "rl_step_size"],
    "requires_retraining": true
  }
}
```

## 5. 报告导出接口

### 5.1 生成完整分析报告
```
POST /slot/reports/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "job_id": "reconstruction_345",
  "report_type": "comprehensive",
  "format": "pdf"
}

Response:
{
  "code": 200,
  "message": "报告生成成功",
  "data": {
    "report_id": "report_999",
    "download_url": "/api/v1/slot/reports/download/report_999",
    "file_size": "2.5MB",
    "generated_at": "2024-01-01T10:30:00Z"
  }
}
```

### 5.2 下载报告
```
GET /slot/reports/download/{report_id}
Authorization: Bearer {token}

Response: 文件下载流
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 503 | 服务暂不可用 |

## 数据类型定义

### Node类型
- `process`: 进程节点
- `file`: 文件节点
- `netflow`: 网络流节点
- `memory`: 内存节点

### 关系类型
- `execute`: 执行关系
- `write`: 写入关系
- `read`: 读取关系
- `connect`: 连接关系
- `send`: 发送数据
- `recv`: 接收数据

### 威胁类型
- `malicious`: 恶意行为
- `anomalous`: 异常行为
- `benign`: 正常行为

### ATT&CK阶段
- `initial_access`: 初始访问
- `execution`: 执行
- `persistence`: 持久化
- `privilege_escalation`: 权限提升
- `defense_evasion`: 防御规避
- `credential_access`: 凭证访问
- `discovery`: 发现
- `lateral_movement`: 横向移动
- `collection`: 收集
- `command_and_control`: 命令与控制
- `exfiltration`: 数据渗出
- `impact`: 影响