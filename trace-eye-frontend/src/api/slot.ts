import request from '@/utils/request'
import type { ApiResponse, PaginationResponse } from '@/types'

// SLOT图构建相关接口
export const slotGraphApi = {
  // 上传日志文件
  uploadLogs: (formData: FormData): Promise<any> => {
    return request.post('/slot/graph/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取图构建状态
  getGraphStatus: (jobId: string): Promise<any> => {
    return request.get(`/slot/graph/status/${jobId}`)
  },

  // 获取初始溯源图数据
  getInitialGraph: (jobId: string): Promise<any> => {
    return request.get(`/slot/graph/initial/${jobId}`)
  }
}

// SLOT潜在行为挖掘相关接口
export const slotMiningApi = {
  // 启动潜在行为挖掘
  startMining: (graphId: string, config?: any): Promise<any> => {
    return request.post('/slot/mining/start', { graph_id: graphId, config })
  },

  // 获取挖掘状态和结果
  getMiningStatus: (miningJobId: string): Promise<any> => {
    return request.get(`/slot/mining/status/${miningJobId}`)
  }
}

// SLOT图强化学习嵌入相关接口
export const slotEmbeddingApi = {
  // 启动嵌入处理
  startEmbedding: (miningJobId: string, config?: any): Promise<any> => {
    return request.post('/slot/embedding/start', { mining_job_id: miningJobId, config })
  },

  // 获取嵌入状态和相似度结果
  getEmbeddingStatus: (embeddingJobId: string): Promise<any> => {
    return request.get(`/slot/embedding/status/${embeddingJobId}`)
  }
}

// SLOT威胁检测相关接口
export const slotDetectionApi = {
  // 启动威胁检测
  startDetection: (embeddingJobId: string, config?: any): Promise<any> => {
    return request.post('/slot/detection/start', { embedding_job_id: embeddingJobId, config })
  },

  // 获取检测结果
  getDetectionResults: (detectionJobId: string): Promise<any> => {
    return request.get(`/slot/detection/results/${detectionJobId}`)
  }
}

// SLOT攻击链重建相关接口
export const slotReconstructionApi = {
  // 启动攻击链重建
  startReconstruction: (detectionJobId: string, config?: any): Promise<any> => {
    return request.post('/slot/reconstruction/start', { detection_job_id: detectionJobId, config })
  },

  // 获取攻击链结果
  getReconstructionResults: (reconstructionJobId: string): Promise<any> => {
    return request.get(`/slot/reconstruction/results/${reconstructionJobId}`)
  }
}

// SLOT系统状态和配置相关接口
export const slotSystemApi = {
  // 获取系统状态
  getSystemStatus: (): Promise<any> => {
    return request.get('/slot/system/status')
  },

  // 获取SLOT模型配置
  getConfig: (): Promise<any> => {
    return request.get('/slot/config')
  },

  // 更新SLOT配置
  updateConfig: (config: any): Promise<any> => {
    return request.put('/slot/config', config)
  },

  // 生成完整分析报告
  generateReport: (jobId: string, reportType?: string, format?: string): Promise<any> => {
    return request.post('/slot/reports/generate', { job_id: jobId, report_type: reportType, format })
  },

  // 下载报告
  downloadReport: (reportId: string): Promise<Blob> => {
    return request.get(`/slot/reports/download/${reportId}`, {
      responseType: 'blob'
    })
  }
}

// 统一的SLOT任务管理接口
export const slotTaskApi = {
  // 获取所有任务列表
  getTasks: (params?: any): Promise<PaginationResponse<any>> => {
    return request.get('/slot/tasks', { params })
  },

  // 获取任务详情
  getTaskDetail: (taskId: string): Promise<any> => {
    return request.get(`/slot/tasks/${taskId}`)
  },

  // 取消任务
  cancelTask: (taskId: string): Promise<any> => {
    return request.post(`/slot/tasks/${taskId}/cancel`)
  }
}

export const slotApi = {
  ...slotGraphApi,
  ...slotMiningApi,
  ...slotEmbeddingApi,
  ...slotDetectionApi,
  ...slotReconstructionApi,
  ...slotSystemApi,
  ...slotTaskApi
}