<template>
  <div class="threat-detection-step">
    <el-row :gutter="20">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <el-card class="config-panel">
          <template #header>
            <h4>威胁检测配置</h4>
          </template>

          <el-form :model="config" label-width="120px" size="small">
            <el-form-item label="嵌入任务ID">
              <el-input v-model="config.embeddingJobId" readonly />
            </el-form-item>

            <el-divider>检测阈值</el-divider>

            <el-form-item label="恶意阈值">
              <el-slider
                v-model="config.detectionThreshold"
                :min="0.1"
                :max="1.0"
                :step="0.05"
                show-input
                :format-tooltip="(val) => `${(val * 100).toFixed(0)}%`"
              />
              <div class="form-tip">分类为恶意行为的最小置信度</div>
            </el-form-item>

            <el-form-item label="异常阈值">
              <el-slider
                v-model="config.anomalyThreshold"
                :min="0.1"
                :max="1.0"
                :step="0.05"
                show-input
                :format-tooltip="(val) => `${(val * 100).toFixed(0)}%`"
              />
              <div class="form-tip">分类为异常行为的最小异常分数</div>
            </el-form-item>

            <el-divider>模型配置</el-divider>

            <el-form-item label="检测模型">
              <el-select v-model="config.modelType" style="width: 100%">
                <el-option label="多层感知机 (MLP)" value="mlp" />
                <el-option label="图神经网络 (GNN)" value="gnn" />
                <el-option label="随机森林" value="random_forest" />
                <el-option label="支持向量机" value="svm" />
              </el-select>
            </el-form-item>

            <el-form-item label="异常检测">
              <el-switch
                v-model="config.useIsolationForest"
                active-text="启用隔离森林"
                inactive-text="禁用"
              />
            </el-form-item>

            <el-form-item label="集成学习" v-if="config.modelType !== 'random_forest'">
              <el-switch
                v-model="config.useEnsemble"
                active-text="启用集成"
                inactive-text="禁用"
              />
            </el-form-item>

            <el-divider>高级选项</el-divider>

            <el-form-item label="交叉验证">
              <el-input-number
                v-model="config.cvFolds"
                :min="3"
                :max="10"
                :step="1"
              />
              <div class="form-tip">交叉验证折数</div>
            </el-form-item>

            <el-form-item label="特征选择">
              <el-checkbox-group v-model="config.featureOptions">
                <el-checkbox label="useEmbedding">嵌入特征</el-checkbox>
                <el-checkbox label="useStructural">结构特征</el-checkbox>
                <el-checkbox label="useTemporal">时序特征</el-checkbox>
                <el-checkbox label="useSemantic">语义特征</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="类别权重">
              <el-radio-group v-model="config.classWeight">
                <el-radio label="balanced">自动平衡</el-radio>
                <el-radio label="custom">自定义</el-radio>
                <el-radio label="none">无权重</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="startDetection"
              :loading="processing"
              :disabled="!canStart"
            >
              开始检测
            </el-button>
            <el-button @click="resetConfig">重置配置</el-button>
          </div>
        </el-card>

        <!-- 检测结果统计 -->
        <el-card class="stats-panel" v-if="detectionResults">
          <template #header>
            <h4>检测结果统计</h4>
          </template>

          <div class="detection-summary">
            <div class="pie-chart-container">
              <div ref="pieChart" class="pie-chart"></div>
            </div>
            <div class="stats-details">
              <div class="stat-row">
                <span class="label">总节点数:</span>
                <span class="value">{{ detectionResults.totalNodes }}</span>
              </div>
              <div class="stat-row malicious">
                <span class="label">恶意节点:</span>
                <span class="value">{{ detectionResults.maliciousNodes }}</span>
              </div>
              <div class="stat-row anomalous">
                <span class="label">异常节点:</span>
                <span class="value">{{ detectionResults.anomalousNodes }}</span>
              </div>
              <div class="stat-row benign">
                <span class="label">正常节点:</span>
                <span class="value">{{ detectionResults.benignNodes }}</span>
              </div>
            </div>
          </div>

          <div class="performance-metrics" v-if="detectionResults.accuracy">
            <h5>模型性能指标</h5>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-value">{{ (detectionResults.accuracy * 100).toFixed(1) }}%</div>
                <div class="metric-label">准确率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ (detectionResults.precision * 100).toFixed(1) }}%</div>
                <div class="metric-label">精确率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ (detectionResults.recall * 100).toFixed(1) }}%</div>
                <div class="metric-label">召回率</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ (detectionResults.f1_score * 100).toFixed(1) }}%</div>
                <div class="metric-label">F1分数</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧状态和结果展示 -->
      <el-col :span="16">
        <el-card class="status-panel">
          <template #header>
            <h4>检测状态</h4>
          </template>

          <div class="status-overview">
            <el-row :gutter="16">
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">状态</div>
                  <div class="value">
                    <el-tag :type="statusTagType">{{ statusText }}</el-tag>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">进度</div>
                  <div class="value">{{ status.progress }}%</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">已检测节点</div>
                  <div class="value">{{ status.processedNodes || 0 }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">威胁发现</div>
                  <div class="value threat-count">{{ status.threatsFound || 0 }}</div>
                </div>
              </el-col>
            </el-row>

            <!-- 进度条 -->
            <el-progress
              :percentage="status.progress"
              :status="status.progress === 100 ? 'success' : ''"
              :stroke-width="8"
              class="progress-bar"
            />
          </div>
        </el-card>

        <!-- 威胁实体列表 -->
        <el-card class="threats-panel" v-if="threatEntities.length > 0">
          <template #header>
            <div class="flex-between">
              <h4>检测到的威胁实体</h4>
              <div class="threat-controls">
                <el-select v-model="selectedThreatType" size="small" @change="filterThreats">
                  <el-option label="全部威胁" value="all" />
                  <el-option label="恶意行为" value="malicious" />
                  <el-option label="异常行为" value="anomalous" />
                  <el-option label="高风险" value="high-risk" />
                </el-select>
                <el-button size="small" @click="exportThreats">导出威胁</el-button>
              </div>
            </div>
          </template>

          <div class="threats-container">
            <el-table
              :data="filteredThreats"
              stripe
              style="width: 100%"
              @row-click="selectThreat"
            >
              <el-table-column prop="nodeId" label="节点ID" width="150">
                <template #default="{ row }">
                  <code class="node-id">{{ row.nodeId }}</code>
                </template>
              </el-table-column>
              <el-table-column prop="nodeType" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="getNodeTypeColor(row.nodeType)">
                    {{ getNodeTypeLabel(row.nodeType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="threatType" label="威胁类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getThreatTypeColor(row.threatType)" size="small">
                    {{ getThreatTypeLabel(row.threatType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="confidence" label="置信度" width="120">
                <template #default="{ row }">
                  <div class="confidence-cell">
                    <el-progress
                      :percentage="row.confidence * 100"
                      :stroke-width="6"
                      :show-text="false"
                    />
                    <span class="confidence-text">{{ (row.confidence * 100).toFixed(1) }}%</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="attributes" label="属性信息" min-width="200">
                <template #default="{ row }">
                  <div class="attributes-cell">
                    <div v-if="row.attributes.name" class="attribute-item">
                      <strong>名称:</strong> {{ row.attributes.name }}
                    </div>
                    <div v-if="row.attributes.command_line" class="attribute-item">
                      <strong>命令:</strong>
                      <code class="command-line">{{ row.attributes.command_line }}</code>
                    </div>
                    <div v-if="row.attributes.ip" class="attribute-item">
                      <strong>IP:</strong> {{ row.attributes.ip }}:{{ row.attributes.port }}
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="detectionMethod" label="检测方法" width="120">
                <template #default="{ row }">
                  <el-tag type="info" size="small">{{ row.detectionMethod }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button size="small" @click.stop="investigateThreat(row)">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <!-- 威胁详情面板 -->
        <el-card class="threat-detail-panel" v-if="selectedThreat">
          <template #header>
            <div class="flex-between">
              <h4>威胁详情 - {{ selectedThreat.nodeId }}</h4>
              <el-button size="small" @click="selectedThreat = null">关闭</el-button>
            </div>
          </template>

          <div class="threat-detail-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-section">
                  <h5>基本信息</h5>
                  <el-descriptions :column="1" border size="small">
                    <el-descriptions-item label="节点ID">
                      <code>{{ selectedThreat.nodeId }}</code>
                    </el-descriptions-item>
                    <el-descriptions-item label="节点类型">
                      <el-tag :type="getNodeTypeColor(selectedThreat.nodeType)">
                        {{ getNodeTypeLabel(selectedThreat.nodeType) }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="威胁类型">
                      <el-tag :type="getThreatTypeColor(selectedThreat.threatType)">
                        {{ getThreatTypeLabel(selectedThreat.threatType) }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="置信度">
                      {{ (selectedThreat.confidence * 100).toFixed(2) }}%
                    </el-descriptions-item>
                    <el-descriptions-item label="检测方法">
                      {{ selectedThreat.detectionMethod }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>

                <div class="detail-section">
                  <h5>检测分数</h5>
                  <div class="detection-scores">
                    <div class="score-item" v-if="selectedThreat.mlpScore">
                      <span class="score-label">MLP分数:</span>
                      <el-progress
                        :percentage="selectedThreat.mlpScore * 100"
                        :stroke-width="8"
                        :show-text="true"
                      />
                    </div>
                    <div class="score-item" v-if="selectedThreat.isolationScore">
                      <span class="score-label">异常分数:</span>
                      <el-progress
                        :percentage="selectedThreat.isolationScore * 100"
                        :stroke-width="8"
                        :show-text="true"
                        status="warning"
                      />
                    </div>
                  </div>
                </div>
              </el-col>

              <el-col :span="12">
                <div class="detail-section">
                  <h5>详细属性</h5>
                  <div class="attributes-list">
                    <div
                      v-for="(value, key) in selectedThreat.attributes"
                      :key="key"
                      class="attribute-row"
                    >
                      <span class="attr-key">{{ formatAttributeName(key) }}:</span>
                      <span class="attr-value" v-if="key === 'command_line'">
                        <code>{{ value }}</code>
                      </span>
                      <span class="attr-value" v-else>{{ value }}</span>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h5>风险评估</h5>
                  <div class="risk-assessment">
                    <div class="risk-level">
                      <span class="risk-label">风险等级:</span>
                      <el-tag :type="getRiskLevelType(selectedThreat.confidence)" size="large">
                        {{ getRiskLevel(selectedThreat.confidence) }}
                      </el-tag>
                    </div>
                    <div class="risk-description">
                      {{ getRiskDescription(selectedThreat) }}
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <el-button @click="$emit('prev')">上一步</el-button>
      <el-button
        type="primary"
        @click="handleNext"
        :disabled="!canProceed"
      >
        下一步
      </el-button>
      <el-button
        type="success"
        @click="$emit('analyze', 3)"
        :loading="processing"
      >
        开始分析
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { slotApi } from '@/api/slot'

interface Props {
  jobData?: any
  stepData?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  next: []
  prev: []
  analyze: [stepIndex: number]
}>()

// 响应式数据
const processing = ref(false)
const pieChart = ref()

// 配置
const config = reactive({
  embeddingJobId: '',
  detectionThreshold: 0.5,
  anomalyThreshold: 0.8,
  modelType: 'mlp',
  useIsolationForest: true,
  useEnsemble: false,
  cvFolds: 5,
  featureOptions: ['useEmbedding', 'useStructural', 'useTemporal'],
  classWeight: 'balanced'
})

// 状态
const status = reactive({
  status: '',
  progress: 0,
  processedNodes: 0,
  threatsFound: 0
})

const detectionResults = ref(null)
const threatEntities = ref([])
const anomalousEntities = ref([])
const selectedThreatType = ref('all')
const selectedThreat = ref(null)

// 计算属性
const canStart = computed(() => {
  return config.embeddingJobId && config.detectionThreshold > 0
})

const canProceed = computed(() => {
  return status.status === 'completed' && threatEntities.value.length > 0
})

const statusTagType = computed(() => {
  switch (status.status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'failed': return 'danger'
    default: return 'info'
  }
})

const statusText = computed(() => {
  switch (status.status) {
    case 'completed': return '检测完成'
    case 'processing': return '检测中'
    case 'failed': return '检测失败'
    default: return '未开始'
  }
})

const filteredThreats = computed(() => {
  let threats = [...threatEntities.value, ...anomalousEntities.value]

  if (selectedThreatType.value === 'all') {
    return threats
  }

  return threats.filter(threat => {
    switch (selectedThreatType.value) {
      case 'malicious':
        return threat.threatType === 'malicious'
      case 'anomalous':
        return threat.threatType === 'anomalous'
      case 'high-risk':
        return threat.confidence >= 0.8
      default:
        return true
    }
  })
})

// 监听props变化
watch(() => props.jobData, (newData) => {
  if (newData?.embeddingJobId) {
    config.embeddingJobId = newData.embeddingJobId
  }
}, { immediate: true })

// 方法
const startDetection = async () => {
  if (!canStart.value) {
    ElMessage.warning('请完善配置信息')
    return
  }

  processing.value = true

  try {
    const detectionConfig = {
      detection_threshold: config.detectionThreshold,
      anomaly_threshold: config.anomalyThreshold,
      use_isolation_forest: config.useIsolationForest,
      model_type: config.modelType,
      use_ensemble: config.useEnsemble,
      cv_folds: config.cvFolds,
      feature_options: config.featureOptions,
      class_weight: config.classWeight
    }

    const response = await slotApi.startDetection(config.embeddingJobId, detectionConfig)

    // 开始监控检测状态
    monitorDetectionStatus(response.data.detection_job_id)

    ElMessage.success('威胁检测已启动')
  } catch (error) {
    ElMessage.error('启动威胁检测失败')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const monitorDetectionStatus = async (detectionJobId: string) => {
  const pollStatus = async () => {
    try {
      const response = await slotApi.getDetectionResults(detectionJobId)
      Object.assign(status, {
        status: response.data.status === 'completed' ? 'completed' : 'processing',
        progress: response.data.detection_results ? 100 : 50,
        processedNodes: response.data.detection_results?.total_nodes || 0,
        threatsFound: (response.data.detection_results?.malicious_nodes || 0) +
                      (response.data.detection_results?.anomalous_nodes || 0)
      })

      if (response.data.status === 'completed') {
        // 检测完成，获取结果
        detectionResults.value = response.data.detection_results
        threatEntities.value = response.data.threat_entities || []
        anomalousEntities.value = response.data.anomalous_entities || []

        // 绘制饼图
        await nextTick()
        renderPieChart()

        ElMessage.success(`检测完成，发现 ${status.threatsFound} 个威胁实体`)
        return
      } else if (response.data.status === 'failed') {
        ElMessage.error('威胁检测失败')
        return
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    } catch (error) {
      console.error('获取检测状态失败:', error)
    }
  }

  pollStatus()
}

const renderPieChart = () => {
  if (!pieChart.value || !detectionResults.value) return

  // 这里将使用ECharts绘制饼图
  // 暂时显示占位内容
}

const filterThreats = () => {
  // 过滤逻辑已在计算属性中实现
}

const selectThreat = (threat: any) => {
  selectedThreat.value = threat
}

const investigateThreat = (threat: any) => {
  selectedThreat.value = threat
  // 可以添加更多调查逻辑
}

const exportThreats = () => {
  const data = {
    detection_config: config,
    detection_results: detectionResults.value,
    threat_entities: threatEntities.value,
    anomalous_entities: anomalousEntities.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `threat-detection-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('威胁检测结果已导出')
}

const resetConfig = () => {
  Object.assign(config, {
    detectionThreshold: 0.5,
    anomalyThreshold: 0.8,
    modelType: 'mlp',
    useIsolationForest: true,
    useEnsemble: false,
    cvFolds: 5,
    featureOptions: ['useEmbedding', 'useStructural', 'useTemporal'],
    classWeight: 'balanced'
  })
}

// 辅助方法
const getNodeTypeLabel = (type: string): string => {
  const labels = {
    process: '进程',
    file: '文件',
    netflow: '网络流',
    memory: '内存',
    user: '用户'
  }
  return labels[type] || type
}

const getNodeTypeColor = (type: string): string => {
  const colors = {
    process: 'primary',
    file: 'success',
    netflow: 'warning',
    memory: 'info',
    user: 'danger'
  }
  return colors[type] || 'info'
}

const getThreatTypeLabel = (type: string): string => {
  const labels = {
    malicious: '恶意',
    anomalous: '异常',
    benign: '正常'
  }
  return labels[type] || type
}

const getThreatTypeColor = (type: string): string => {
  const colors = {
    malicious: 'danger',
    anomalous: 'warning',
    benign: 'success'
  }
  return colors[type] || 'info'
}

const formatAttributeName = (key: string): string => {
  const labels = {
    name: '名称',
    pid: '进程ID',
    command_line: '命令行',
    user: '用户',
    ip: 'IP地址',
    port: '端口',
    path: '路径',
    size: '大小',
    timestamp: '时间戳'
  }
  return labels[key] || key
}

const getRiskLevel = (confidence: number): string => {
  if (confidence >= 0.9) return '极高风险'
  if (confidence >= 0.8) return '高风险'
  if (confidence >= 0.6) return '中风险'
  return '低风险'
}

const getRiskLevelType = (confidence: number): string => {
  if (confidence >= 0.9) return 'danger'
  if (confidence >= 0.8) return 'warning'
  if (confidence >= 0.6) return 'primary'
  return 'info'
}

const getRiskDescription = (threat: any): string => {
  const confidence = threat.confidence
  const type = threat.threatType

  if (type === 'malicious') {
    if (confidence >= 0.9) {
      return '该实体具有极高的恶意可能性，建议立即隔离和深入调查。'
    } else if (confidence >= 0.8) {
      return '该实体很可能存在恶意行为，建议优先处理。'
    } else {
      return '该实体存在潜在的恶意行为，需要进一步监控。'
    }
  } else {
    if (confidence >= 0.8) {
      return '该实体表现出异常行为模式，可能存在未知威胁。'
    } else {
      return '该实体行为偏离正常模式，建议关注。'
    }
  }
}

const handleNext = () => {
  if (canProceed.value) {
    emit('next')
  } else {
    ElMessage.warning('请先完成威胁检测')
  }
}

// 生命周期
onMounted(() => {
  if (props.jobData?.embeddingJobId) {
    config.embeddingJobId = props.jobData.embeddingJobId
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.threat-detection-step {
  .config-panel,
  .stats-panel {
    margin-bottom: 20px;
  }

  .form-tip {
    font-size: 12px;
    color: $text-regular;
    margin-top: 4px;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .detection-summary {
    display: flex;
    gap: 20px;
    align-items: center;

    .pie-chart-container {
      width: 120px;
      height: 120px;

      .pie-chart {
        width: 100%;
        height: 100%;
        border: 1px solid #e4e7ed;
        border-radius: 50%;
      }
    }

    .stats-details {
      flex: 1;

      .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: $text-regular;
        }

        .value {
          font-weight: bold;
        }

        &.malicious .value {
          color: $danger-color;
        }

        &.anomalous .value {
          color: $warning-color;
        }

        &.benign .value {
          color: $success-color;
        }
      }
    }
  }

  .performance-metrics {
    margin-top: 20px;

    h5 {
      margin: 0 0 12px 0;
      color: $text-primary;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .metric-item {
        text-align: center;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;

        .metric-value {
          font-size: 18px;
          font-weight: bold;
          color: $primary-color;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: $text-regular;
        }
      }
    }
  }

  .status-panel {
    margin-bottom: 20px;

    .status-overview {
      .status-item {
        text-align: center;

        .label {
          font-size: 14px;
          color: $text-regular;
          margin-bottom: 8px;
        }

        .value {
          font-size: 18px;
          font-weight: bold;
          color: $text-primary;

          &.threat-count {
            color: $danger-color;
          }
        }
      }

      .progress-bar {
        margin: 16px 0;
      }
    }
  }

  .threats-panel {
    margin-bottom: 20px;

    .threat-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .threats-container {
      .node-id {
        font-family: monospace;
        font-size: 12px;
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
      }

      .confidence-cell {
        display: flex;
        align-items: center;
        gap: 8px;

        .confidence-text {
          font-size: 12px;
          color: $text-regular;
          min-width: 40px;
        }
      }

      .attributes-cell {
        .attribute-item {
          margin-bottom: 4px;
          font-size: 12px;

          strong {
            color: $text-regular;
          }

          .command-line {
            background: #f5f5f5;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 11px;
          }
        }
      }
    }
  }

  .threat-detail-panel {
    .threat-detail-content {
      .detail-section {
        margin-bottom: 24px;

        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
          font-size: 14px;
          font-weight: bold;
        }

        .detection-scores {
          .score-item {
            margin-bottom: 12px;

            .score-label {
              display: inline-block;
              width: 80px;
              font-size: 12px;
              color: $text-regular;
            }
          }
        }

        .attributes-list {
          .attribute-row {
            padding: 6px 0;
            border-bottom: 1px solid #f0f0f0;

            .attr-key {
              display: inline-block;
              width: 100px;
              color: $text-regular;
              font-size: 12px;
            }

            .attr-value {
              color: $text-primary;
              font-size: 12px;

              code {
                background: #f5f5f5;
                padding: 1px 4px;
                border-radius: 2px;
                font-size: 11px;
              }
            }
          }
        }

        .risk-assessment {
          .risk-level {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;

            .risk-label {
              font-size: 14px;
              color: $text-regular;
            }
          }

          .risk-description {
            font-size: 13px;
            line-height: 1.5;
            color: $text-primary;
            padding: 12px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 4px solid $warning-color;
          }
        }
      }
    }
  }

  .step-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>