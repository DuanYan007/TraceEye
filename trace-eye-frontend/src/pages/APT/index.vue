<template>
  <div class="apt-page">
    <!-- 页面头部 -->
    <el-card class="page-header">
      <template #header>
        <div class="flex-between">
          <div class="header-left">
            <h2>SLOT APT检测系统</h2>
            <el-tag type="info" size="small">Provenance-Driven APT Detection</el-tag>
          </div>
          <div class="header-actions">
            <el-button
              type="primary"
              :icon="Upload"
              @click="showUploadDialog = true"
              :loading="processing"
            >
              上传日志文件
            </el-button>
            <el-button
              type="success"
              :icon="VideoPlay"
              @click="startFullAnalysis"
              :disabled="!currentJob || processing"
            >
              启动完整分析
            </el-button>
          </div>
        </div>
      </template>

      <!-- 系统状态概览 -->
      <div class="system-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="overview-item">
              <el-icon class="icon" :color="systemStatus.color"><Monitor /></el-icon>
              <div class="content">
                <div class="label">系统状态</div>
                <div class="value">{{ systemStatus.text }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <el-icon class="icon" color="#67c23a"><DataAnalysis /></el-icon>
              <div class="content">
                <div class="label">活跃任务</div>
                <div class="value">{{ systemStatus.activeJobs }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <el-icon class="icon" color="#409eff"><Files /></el-icon>
              <div class="content">
                <div class="label">已处理文件</div>
                <div class="value">{{ systemStatus.processedFiles }}</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <el-icon class="icon" color="#e6a23c"><Warning /></el-icon>
              <div class="content">
                <div class="label">检测威胁</div>
                <div class="value">{{ systemStatus.threatsDetected }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- SLOT处理流程 -->
    <el-card class="process-flow">
      <template #header>
        <h3>SLOT处理流程</h3>
      </template>

      <!-- 流程步骤 -->
      <div class="flow-steps">
        <el-steps :active="currentStep" finish-status="success" align-center>
          <el-step
            v-for="(step, index) in processSteps"
            :key="index"
            :title="step.title"
            :description="step.description"
            :icon="step.icon"
            :status="step.status"
          />
        </el-steps>
      </div>

      <!-- 步骤详情 -->
      <div class="step-details" v-if="currentStep >= 0">
        <component
          :is="currentStepComponent"
          :job-data="currentJob"
          :step-data="stepData"
          @next="nextStep"
          @analyze="analyzeStep"
        />
      </div>
    </el-card>

    <!-- 实时监控面板 -->
    <el-row :gutter="20" class="monitoring-section">
      <!-- 图构建监控 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex-between">
              <span>图构建监控</span>
              <el-tag type="primary" v-if="graphStatus.status">运行中</el-tag>
            </div>
          </template>
          <GraphConstructionMonitor
            :status="graphStatus"
            :job-id="currentJob?.jobId"
          />
        </el-card>
      </el-col>

      <!-- 挖掘进度监控 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="flex-between">
              <span>行为挖掘监控</span>
              <el-tag type="warning" v-if="miningStatus.status">运行中</el-tag>
            </div>
          </template>
          <BehaviorMiningMonitor
            :status="miningStatus"
            :job-id="currentJob?.miningJobId"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 可视化结果区域 -->
    <el-card class="visualization-section" v-if="analysisResults.graphData">
      <template #header>
        <div class="flex-between">
          <h3>可视化分析结果</h3>
          <div class="visualization-controls">
            <el-select v-model="selectedVisualization" @change="switchVisualization">
              <el-option label="溯源图谱" value="graph" />
              <el-option label="攻击链" value="attack-chain" />
              <el-option label="威胁分布" value="threat-distribution" />
              <el-option label="时序分析" value="timeline" />
            </el-select>
            <el-button :icon="Download" @click="exportResults">导出结果</el-button>
          </div>
        </div>
      </template>

      <!-- 可视化组件 -->
      <div class="visualization-container">
        <component
          :is="currentVisualizationComponent"
          :data="visualizationData"
          :loading="visualizationLoading"
        />
      </div>
    </el-card>

    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传日志文件"
      width="600px"
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        drag
        multiple
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将日志文件拖拽到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .log, .json, .txt 格式文件，单文件不超过 100MB
          </div>
        </template>
      </el-upload>

      <el-form :model="uploadForm" label-width="100px" class="upload-form">
        <el-form-item label="数据集名称">
          <el-input v-model="uploadForm.datasetName" placeholder="如：DARPA-E3" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            placeholder="请输入数据集描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="uploadFiles"
          :loading="uploading"
          :disabled="fileList.length === 0"
        >
          上传并开始处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  VideoPlay,
  Monitor,
  DataAnalysis,
  Files,
  Warning,
  UploadFilled,
  Download
} from '@element-plus/icons-vue'
import { slotApi } from '@/api/slot'
import { useWebSocket } from '@/composables/useWebSocket'

// 导入步骤组件
import GraphConstructionStep from './components/GraphConstructionStep.vue'
import BehaviorMiningStep from './components/BehaviorMiningStep.vue'
import EmbeddingStep from './components/EmbeddingStep.vue'
import ThreatDetectionStep from './components/ThreatDetectionStep.vue'
import AttackReconstructionStep from './components/AttackReconstructionStep.vue'

// 导入监控组件
import GraphConstructionMonitor from './components/GraphConstructionMonitor.vue'
import BehaviorMiningMonitor from './components/BehaviorMiningMonitor.vue'

// 导入可视化组件
import ProvenanceGraphVisualization from './components/ProvenanceGraphVisualization.vue'
import AttackChainVisualization from './components/AttackChainVisualization.vue'
import ThreatDistributionVisualization from './components/ThreatDistributionVisualization.vue'
import TimelineVisualization from './components/TimelineVisualization.vue'

// 响应式数据
const showUploadDialog = ref(false)
const processing = ref(false)
const uploading = ref(false)
const fileList = ref([])
const uploadRef = ref()

// 当前任务和步骤
const currentJob = ref(null)
const currentStep = ref(-1)
const stepData = ref({})

// 系统状态
const systemStatus = reactive({
  color: '#67c23a',
  text: '系统正常',
  activeJobs: 0,
  processedFiles: 0,
  threatsDetected: 0
})

// 各模块状态
const graphStatus = reactive({
  status: '',
  progress: 0,
  nodes: 0,
  edges: 0
})

const miningStatus = reactive({
  status: '',
  progress: 0,
  discoveredPaths: 0,
  relationships: 0
})

// 处理步骤定义
const processSteps = [
  {
    title: '图构建',
    description: '从日志构建溯源图',
    icon: 'Files',
    status: 'wait'
  },
  {
    title: '行为挖掘',
    description: '潜在因果关系挖掘',
    icon: 'Search',
    status: 'wait'
  },
  {
    title: '图嵌入',
    description: '强化学习图嵌入',
    icon: 'Connection',
    status: 'wait'
  },
  {
    title: '威胁检测',
    description: '异常行为检测',
    icon: 'Warning',
    status: 'wait'
  },
  {
    title: '攻击链重建',
    description: 'APT攻击链重建',
    icon: 'Share',
    status: 'wait'
  }
]

// 上传表单
const uploadForm = reactive({
  datasetName: '',
  description: ''
})

// 分析结果
const analysisResults = reactive({
  graphData: null,
  miningData: null,
  embeddingData: null,
  detectionData: null,
  reconstructionData: null
})

// 可视化相关
const selectedVisualization = ref('graph')
const visualizationLoading = ref(false)

// WebSocket连接
const { connect, disconnect, onMessage } = useWebSocket()

// 计算属性
const currentStepComponent = computed(() => {
  const components = [
    GraphConstructionStep,
    BehaviorMiningStep,
    EmbeddingStep,
    ThreatDetectionStep,
    AttackReconstructionStep
  ]
  return components[currentStep.value] || null
})

const currentVisualizationComponent = computed(() => {
  const components = {
    'graph': ProvenanceGraphVisualization,
    'attack-chain': AttackChainVisualization,
    'threat-distribution': ThreatDistributionVisualization,
    'timeline': TimelineVisualization
  }
  return components[selectedVisualization.value] || ProvenanceGraphVisualization
})

const visualizationData = computed(() => {
  switch (selectedVisualization.value) {
    case 'graph':
      return analysisResults.graphData
    case 'attack-chain':
      return analysisResults.reconstructionData
    case 'threat-distribution':
      return analysisResults.detectionData
    case 'timeline':
      return analysisResults.miningData
    default:
      return null
  }
})

// 生命周期
onMounted(() => {
  initializeSystem()
  setupWebSocket()
})

onUnmounted(() => {
  disconnect()
})

// 方法
const initializeSystem = async () => {
  try {
    const response = await slotApi.getSystemStatus()
    Object.assign(systemStatus, response.data)
  } catch (error) {
    console.error('获取系统状态失败:', error)
  }
}

const setupWebSocket = () => {
  connect('/api/v1/slot/realtime')

  onMessage((data) => {
    switch (data.type) {
      case 'graph_update':
        Object.assign(graphStatus, data.data)
        break
      case 'mining_update':
        Object.assign(miningStatus, data.data)
        break
      case 'job_completed':
        handleJobCompleted(data.data)
        break
      case 'error':
        ElMessage.error(data.message)
        break
    }
  })
}

const handleFileChange = (file, files) => {
  fileList.value = files
}

const handleFileRemove = (file, files) => {
  fileList.value = files
}

const uploadFiles = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    fileList.value.forEach(file => {
      formData.append('logs', file.raw)
    })
    formData.append('dataset_name', uploadForm.datasetName)
    formData.append('description', uploadForm.description)

    const response = await slotApi.uploadLogs(formData)
    currentJob.value = response.data
    currentStep.value = 0

    ElMessage.success('文件上传成功，开始处理')
    showUploadDialog.value = false

    // 开始监控图构建状态
    monitorGraphStatus(response.data.job_id)

  } catch (error) {
    ElMessage.error('文件上传失败')
    console.error(error)
  } finally {
    uploading.value = false
  }
}

const monitorGraphStatus = async (jobId) => {
  const pollStatus = async () => {
    try {
      const response = await slotApi.getGraphStatus(jobId)
      Object.assign(graphStatus, response.data)

      if (response.data.status === 'completed') {
        // 图构建完成，获取图数据
        const graphResponse = await slotApi.getInitialGraph(jobId)
        analysisResults.graphData = graphResponse.data
        processSteps[0].status = 'finish'

        ElMessage.success('图构建完成')
        return
      } else if (response.data.status === 'failed') {
        processSteps[0].status = 'error'
        ElMessage.error('图构建失败')
        return
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    } catch (error) {
      console.error('获取图状态失败:', error)
    }
  }

  pollStatus()
}

const startFullAnalysis = async () => {
  if (!currentJob.value) {
    ElMessage.warning('请先上传日志文件')
    return
  }

  processing.value = true
  try {
    // 依次执行各个步骤
    await executeStep(0) // 图构建
    await executeStep(1) // 行为挖掘
    await executeStep(2) // 图嵌入
    await executeStep(3) // 威胁检测
    await executeStep(4) // 攻击链重建

    ElMessage.success('完整分析完成！')
  } catch (error) {
    ElMessage.error('分析过程中出现错误')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const executeStep = async (stepIndex) => {
  currentStep.value = stepIndex
  processSteps[stepIndex].status = 'process'

  switch (stepIndex) {
    case 0:
      // 图构建已在上传时完成
      break
    case 1:
      await startBehaviorMining()
      break
    case 2:
      await startEmbedding()
      break
    case 3:
      await startThreatDetection()
      break
    case 4:
      await startAttackReconstruction()
      break
  }

  processSteps[stepIndex].status = 'finish'
}

const startBehaviorMining = async () => {
  const response = await slotApi.startMining(currentJob.value.graphId)
  currentJob.value.miningJobId = response.data.mining_job_id

  // 监控挖掘状态
  // ... 实现状态监控逻辑
}

const startEmbedding = async () => {
  const response = await slotApi.startEmbedding(currentJob.value.miningJobId)
  currentJob.value.embeddingJobId = response.data.embedding_job_id
  // ... 实现状态监控逻辑
}

const startThreatDetection = async () => {
  const response = await slotApi.startDetection(currentJob.value.embeddingJobId)
  currentJob.value.detectionJobId = response.data.detection_job_id
  // ... 实现状态监控逻辑
}

const startAttackReconstruction = async () => {
  const response = await slotApi.startReconstruction(currentJob.value.detectionJobId)
  currentJob.value.reconstructionJobId = response.data.reconstruction_job_id
  // ... 实现状态监控逻辑
}

const nextStep = () => {
  if (currentStep.value < processSteps.length - 1) {
    currentStep.value++
  }
}

const analyzeStep = async (stepIndex) => {
  await executeStep(stepIndex)
}

const switchVisualization = (type) => {
  selectedVisualization.value = type
  visualizationLoading.value = true

  // 模拟加载延迟
  setTimeout(() => {
    visualizationLoading.value = false
  }, 500)
}

const exportResults = async () => {
  try {
    const response = await slotApi.generateReport(
      currentJob.value.reconstructionJobId,
      'comprehensive',
      'pdf'
    )

    // 下载报告
    const blob = await slotApi.downloadReport(response.data.report_id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slot-analysis-report-${Date.now()}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('报告导出成功')
  } catch (error) {
    ElMessage.error('报告导出失败')
    console.error(error)
  }
}

const handleJobCompleted = (data) => {
  // 处理WebSocket任务完成通知
  ElMessage.success(`${data.jobType} 完成`)

  // 更新系统状态
  initializeSystem()
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.apt-page {
  .page-header {
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      h2 {
        margin: 0;
        color: $text-primary;
      }
    }

    .system-overview {
      margin-top: 20px;

      .overview-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .icon {
          font-size: 32px;
        }

        .content {
          .label {
            font-size: 14px;
            color: $text-regular;
            margin-bottom: 4px;
          }

          .value {
            font-size: 24px;
            font-weight: bold;
            color: $text-primary;
          }
        }
      }
    }
  }

  .process-flow {
    margin-bottom: 20px;

    .flow-steps {
      margin-bottom: 30px;
    }

    .step-details {
      min-height: 300px;
    }
  }

  .monitoring-section {
    margin-bottom: 20px;
  }

  .visualization-section {
    .visualization-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .visualization-container {
      min-height: 500px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .upload-form {
    margin-top: 20px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .apt-page {
    .system-overview {
      .el-col {
        margin-bottom: 12px;
      }
    }

    .monitoring-section {
      .el-col {
        margin-bottom: 16px;
      }
    }

    .visualization-controls {
      flex-direction: column;
      align-items: stretch;
    }
  }
}
</style>