<template>
  <div class="attack-reconstruction-step">
    <el-row :gutter="20">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <el-card class="config-panel">
          <template #header>
            <h4>攻击链重建配置</h4>
          </template>

          <el-form :model="config" label-width="120px" size="small">
            <el-form-item label="检测任务ID">
              <el-input v-model="config.detectionJobId" readonly />
            </el-form-item>

            <el-divider>重建配置</el-divider>

            <el-form-item label="攻击框架">
              <el-select v-model="config.frameworkType" style="width: 100%">
                <el-option label="MITRE ATT&CK" value="ATT&CK" />
                <el-option label="Cyber Kill Chain" value="CKC" />
                <el-option label="无框架" value="none" />
              </el-select>
            </el-form-item>

            <el-form-item label="聚类算法">
              <el-select v-model="config.clusteringAlgorithm" style="width: 100%">
                <el-option label="标签传播算法 (LPA)" value="lpa" />
                <el-option label="层次聚类" value="hierarchical" />
                <el-option label="DBSCAN" value="dbscan" />
                <el-option label="K-means" value="kmeans" />
              </el-select>
            </el-form-item>

            <el-form-item label="最小链长度">
              <el-input-number
                v-model="config.minChainLength"
                :min="2"
                :max="10"
                :step="1"
              />
              <div class="form-tip">攻击链最小包含的攻击阶段数</div>
            </el-form-item>

            <el-form-item label="时间窗口">
              <el-input-number
                v-model="config.timeWindow"
                :min="1"
                :max="1440"
                :step="1"
              />
              <div class="form-tip">攻击链最大时间跨度（分钟）</div>
            </el-form-item>

            <el-divider>高级选项</el-divider>

            <el-form-item label="置信度阈值">
              <el-slider
                v-model="config.confidenceThreshold"
                :min="0.1"
                :max="1.0"
                :step="0.05"
                show-input
                :format-tooltip="(val) => `${(val * 100).toFixed(0)}%`"
              />
              <div class="form-tip">包含在攻击链中的最小置信度</div>
            </el-form-item>

            <el-form-item label="假阳性率">
              <el-slider
                v-model="config.maxFalsePositiveRate"
                :min="0.01"
                :max="0.5"
                :step="0.01"
                show-input
                :format-tooltip="(val) => `${(val * 100).toFixed(1)}%`"
              />
              <div class="form-tip">攻击链最大允许假阳性率</div>
            </el-form-item>

            <el-form-item label="并行攻击链">
              <el-switch
                v-model="config.allowParallelChains"
                active-text="允许"
                inactive-text="禁用"
              />
              <div class="form-tip">是否允许并行的攻击链路径</div>
            </el-form-item>

            <el-form-item label="跨时间窗口">
              <el-switch
                v-model="config.crossTimeWindows"
                active-text="允许"
                inactive-text="禁用"
              />
              <div class="form-tip">是否允许攻击链跨越时间窗口</div>
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="startReconstruction"
              :loading="processing"
              :disabled="!canStart"
            >
              开始重建
            </el-button>
            <el-button @click="resetConfig">重置配置</el-button>
          </div>
        </el-card>

        <!-- 重建结果统计 -->
        <el-card class="stats-panel" v-if="reconstructionResults">
          <template #header>
            <h4>重建结果统计</h4>
          </template>

          <div class="reconstruction-summary">
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-value">{{ reconstructionResults.totalChains }}</div>
                <div class="summary-label">攻击链数量</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">{{ reconstructionResults.totalStages }}</div>
                <div class="summary-label">攻击阶段数</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">{{ (reconstructionResults.reductionRatio * 100).toFixed(1) }}%</div>
                <div class="summary-label">压缩比</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">{{ reconstructionResults.avgConfidence?.toFixed(2) || '0.00' }}</div>
                <div class="summary-label">平均置信度</div>
              </div>
            </div>
          </div>

          <div class="framework-distribution" v-if="frameworkDistribution.length > 0">
            <h5>攻击阶段分布</h5>
            <div class="stage-bars">
              <div
                v-for="stage in frameworkDistribution"
                :key="stage.stage"
                class="stage-bar"
              >
                <div class="stage-info">
                  <span class="stage-name">{{ stage.name }}</span>
                  <span class="stage-count">{{ stage.count }}次</span>
                </div>
                <div class="stage-progress">
                  <el-progress
                    :percentage="(stage.count / Math.max(...frameworkDistribution.map(s => s.count))) * 100"
                    :stroke-width="6"
                    :show-text="false"
                  />
                </div>
                <div class="stage-code">{{ stage.ttpCode }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧状态和结果展示 -->
      <el-col :span="16">
        <el-card class="status-panel">
          <template #header>
            <h4>重建状态</h4>
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
                  <div class="label">已处理威胁</div>
                  <div class="value">{{ status.processedThreats || 0 }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">重建链数</div>
                  <div class="value">{{ status.chainsFound || 0 }}</div>
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

        <!-- 攻击链列表 -->
        <el-card class="chains-panel" v-if="attackChains.length > 0">
          <template #header>
            <div class="flex-between">
              <h4>重建的攻击链</h4>
              <div class="chain-controls">
                <el-select v-model="selectedChainSort" size="small" @change="sortChains">
                  <el-option label="按置信度排序" value="confidence" />
                  <el-option label="按长度排序" value="length" />
                  <el-option label="按时间排序" value="time" />
                </el-select>
                <el-button size="small" @click="exportChains">导出</el-button>
              </div>
            </div>
          </template>

          <div class="chains-container">
            <div
              v-for="chain in sortedChains"
              :key="chain.chainId"
              class="chain-item"
              @click="selectChain(chain)"
              :class="{ active: selectedChain?.chainId === chain.chainId }"
            >
              <div class="chain-header">
                <div class="chain-title">
                  <span class="chain-id">攻击链 #{{ chain.chainId }}</span>
                  <el-tag :type="getConfidenceColor(chain.chainMetrics.confidence)" size="small">
                    {{ (chain.chainMetrics.confidence * 100).toFixed(1) }}%
                  </el-tag>
                </div>
                <div class="chain-meta">
                  <span class="chain-length">{{ chain.chainMetrics.length }} 阶段</span>
                  <span class="chain-duration">{{ chain.chainMetrics.attackDuration }}</span>
                  <el-tag size="small" type="warning">
                    FPR: {{ (chain.chainMetrics.falsePositiveRate * 100).toFixed(1) }}%
                  </el-tag>
                </div>
              </div>

              <div class="chain-stages">
                <div class="stages-timeline">
                  <div
                    v-for="(stage, index) in chain.attackStages"
                    :key="index"
                    class="stage-node"
                    :class="{ completed: stage.confidence >= 0.8 }"
                  >
                    <div class="stage-dot"></div>
                    <div class="stage-info">
                      <div class="stage-name">{{ stage.description }}</div>
                      <div class="stage-ttp">{{ stage.ttpCode }}</div>
                      <div class="stage-confidence">{{ (stage.confidence * 100).toFixed(1) }}%</div>
                    </div>
                    <div class="stage-connector" v-if="index < chain.attackStages.length - 1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 攻击链详情 -->
        <el-card class="chain-detail-panel" v-if="selectedChain">
          <template #header>
            <div class="flex-between">
              <h4>攻击链详情 - {{ selectedChain.chainId }}</h4>
              <el-button size="small" @click="selectedChain = null">关闭</el-button>
            </div>
          </template>

          <div class="chain-detail-content">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="概览" name="overview">
                <div class="chain-overview">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <div class="overview-section">
                        <h5>基本信息</h5>
                        <el-descriptions :column="1" border size="small">
                          <el-descriptions-item label="攻击链ID">
                            {{ selectedChain.chainId }}
                          </el-descriptions-item>
                          <el-descriptions-item label="置信度">
                            {{ (selectedChain.chainMetrics.confidence * 100).toFixed(2) }}%
                          </el-descriptions-item>
                          <el-descriptions-item label="攻击阶段数">
                            {{ selectedChain.chainMetrics.length }}
                          </el-descriptions-item>
                          <el-descriptions-item label="攻击时长">
                            {{ selectedChain.chainMetrics.attackDuration }}
                          </el-descriptions-item>
                          <el-descriptions-item label="假阳性率">
                            {{ (selectedChain.chainMetrics.falsePositiveRate * 100).toFixed(2) }}%
                          </el-descriptions-item>
                        </el-descriptions>
                      </div>
                    </el-col>
                    <el-col :span="12">
                      <div class="overview-section">
                        <h5>攻击阶段详情</h5>
                        <div class="stages-detail-list">
                          <div
                            v-for="(stage, index) in selectedChain.attackStages"
                            :key="index"
                            class="stage-detail-item"
                          >
                            <div class="stage-detail-header">
                              <span class="stage-number">{{ index + 1 }}</span>
                              <span class="stage-title">{{ stage.description }}</span>
                              <el-tag size="small" :type="getConfidenceColor(stage.confidence)">
                                {{ (stage.confidence * 100).toFixed(1) }}%
                              </el-tag>
                            </div>
                            <div class="stage-detail-content">
                              <div class="stage-ttp">
                                <strong>TTP:</strong> {{ stage.ttpCode }}
                              </div>
                              <div class="stage-time">
                                <strong>时间:</strong> {{ formatTime(stage.timestamp) }}
                              </div>
                              <div class="stage-nodes">
                                <strong>涉及节点:</strong> {{ stage.nodes?.join(', ') || 'N/A' }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </el-col>
                  </el-row>
                </div>
              </el-tab-pane>

              <el-tab-pane label="节点分析" name="nodes">
                <div class="nodes-analysis">
                  <el-table
                    :data="getChainNodes(selectedChain)"
                    stripe
                    style="width: 100%"
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
                        {{ (row.confidence * 100).toFixed(1) }}%
                      </template>
                    </el-table-column>
                    <el-table-column prop="stages" label="参与阶段" min-width="200">
                      <template #default="{ row }">
                        <el-tag
                          v-for="stage in row.stages"
                          :key="stage"
                          size="small"
                          class="stage-tag"
                        >
                          {{ stage }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-tab-pane>

              <el-tab-pane label="可视化" name="visualization">
                <div class="chain-visualization">
                  <div class="viz-controls">
                    <el-radio-group v-model="visualizationType" size="small">
                      <el-radio-button label="timeline">时间线</el-radio-button>
                      <el-radio-button label="graph">攻击图</el-radio-button>
                      <el-radio-button label="matrix">阶段矩阵</el-radio-button>
                    </el-radio-group>
                  </div>

                  <div class="viz-container" ref="chainVizContainer">
                    <!-- 这里将集成可视化组件 -->
                    <div class="viz-placeholder">
                      <el-icon size="48" color="#ddd"><Share /></el-icon>
                      <p>攻击链可视化开发中...</p>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
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
        完成分析
      </el-button>
      <el-button
        type="success"
        @click="generateReport"
        :loading="processing"
        v-if="reconstructionResults"
      >
        生成报告
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Share } from '@element-plus/icons-vue'
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
const chainVizContainer = ref()
const activeTab = ref('overview')
const visualizationType = ref('timeline')

// 配置
const config = reactive({
  detectionJobId: '',
  frameworkType: 'ATT&CK',
  clusteringAlgorithm: 'lpa',
  minChainLength: 3,
  timeWindow: 60,
  confidenceThreshold: 0.7,
  maxFalsePositiveRate: 0.1,
  allowParallelChains: false,
  crossTimeWindows: true
})

// 状态
const status = reactive({
  status: '',
  progress: 0,
  processedThreats: 0,
  chainsFound: 0
})

const reconstructionResults = ref(null)
const attackChains = ref([])
const selectedChain = ref(null)
const selectedChainSort = ref('confidence')

// 计算属性
const canStart = computed(() => {
  return config.detectionJobId && config.minChainLength > 0
})

const canProceed = computed(() => {
  return status.status === 'completed' && attackChains.value.length > 0
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
    case 'completed': return '重建完成'
    case 'processing': return '重建中'
    case 'failed': return '重建失败'
    default: return '未开始'
  }
})

const frameworkDistribution = computed(() => {
  if (!attackChains.value.length) return []

  const stageMap = new Map()
  attackChains.value.forEach(chain => {
    chain.attackStages?.forEach(stage => {
      const key = stage.stage
      if (!stageMap.has(key)) {
        stageMap.set(key, {
          stage: key,
          name: stage.description,
          ttpCode: stage.ttpCode,
          count: 0
        })
      }
      stageMap.get(key).count++
    })
  })

  return Array.from(stageMap.values())
})

const sortedChains = computed(() => {
  const chains = [...attackChains.value]

  switch (selectedChainSort.value) {
    case 'confidence':
      return chains.sort((a, b) => b.chainMetrics.confidence - a.chainMetrics.confidence)
    case 'length':
      return chains.sort((a, b) => b.chainMetrics.length - a.chainMetrics.length)
    case 'time':
      return chains.sort((a, b) => {
        const timeA = new Date(a.attackStages?.[0]?.timestamp || 0).getTime()
        const timeB = new Date(b.attackStages?.[0]?.timestamp || 0).getTime()
        return timeB - timeA
      })
    default:
      return chains
  }
})

// 监听props变化
watch(() => props.jobData, (newData) => {
  if (newData?.detectionJobId) {
    config.detectionJobId = newData.detectionJobId
  }
}, { immediate: true })

// 方法
const startReconstruction = async () => {
  if (!canStart.value) {
    ElMessage.warning('请完善配置信息')
    return
  }

  processing.value = true

  try {
    const reconstructionConfig = {
      use_attack_framework: config.frameworkType !== 'none',
      framework_type: config.frameworkType,
      clustering_algorithm: config.clusteringAlgorithm,
      min_chain_length: config.minChainLength,
      time_window: config.timeWindow,
      confidence_threshold: config.confidenceThreshold,
      max_false_positive_rate: config.maxFalsePositiveRate,
      allow_parallel_chains: config.allowParallelChains,
      cross_time_windows: config.crossTimeWindows
    }

    const response = await slotApi.startReconstruction(config.detectionJobId, reconstructionConfig)

    // 开始监控重建状态
    monitorReconstructionStatus(response.data.reconstruction_job_id)

    ElMessage.success('攻击链重建已启动')
  } catch (error) {
    ElMessage.error('启动攻击链重建失败')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const monitorReconstructionStatus = async (reconstructionJobId: string) => {
  const pollStatus = async () => {
    try {
      const response = await slotApi.getReconstructionResults(reconstructionJobId)

      Object.assign(status, {
        status: response.data.status === 'completed' ? 'completed' : 'processing',
        progress: response.data.status === 'completed' ? 100 : 50,
        processedThreats: response.data.reconstruction_summary?.total_stages || 0,
        chainsFound: response.data.reconstruction_summary?.total_chains || 0
      })

      if (response.data.status === 'completed') {
        // 重建完成，获取结果
        reconstructionResults.value = response.data
        attackChains.value = response.data.attack_chains || []

        ElMessage.success(`攻击链重建完成，发现 ${attackChains.value.length} 条攻击链`)
        return
      } else if (response.data.status === 'failed') {
        ElMessage.error('攻击链重建失败')
        return
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    } catch (error) {
      console.error('获取重建状态失败:', error)
    }
  }

  pollStatus()
}

const selectChain = (chain: any) => {
  selectedChain.value = chain
  activeTab.value = 'overview'
}

const sortChains = () => {
  // 排序逻辑已在计算属性中实现
}

const exportChains = () => {
  const data = {
    reconstruction_config: config,
    reconstruction_results: reconstructionResults.value,
    attack_chains: attackChains.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attack-chains-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('攻击链数据已导出')
}

const generateReport = async () => {
  if (!props.jobData?.reconstructionJobId) {
    ElMessage.warning('缺少重建任务ID')
    return
  }

  processing.value = true

  try {
    const response = await slotApi.generateReport(
      props.jobData.reconstructionJobId,
      'comprehensive',
      'pdf'
    )

    // 下载报告
    const blob = await slotApi.downloadReport(response.data.report_id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slot-attack-analysis-${Date.now()}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)

    ElMessage.success('分析报告生成成功')
  } catch (error) {
    ElMessage.error('生成报告失败')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const resetConfig = () => {
  Object.assign(config, {
    frameworkType: 'ATT&CK',
    clusteringAlgorithm: 'lpa',
    minChainLength: 3,
    timeWindow: 60,
    confidenceThreshold: 0.7,
    maxFalsePositiveRate: 0.1,
    allowParallelChains: false,
    crossTimeWindows: true
  })
}

// 辅助方法
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'danger'
  if (confidence >= 0.8) return 'warning'
  if (confidence >= 0.6) return 'primary'
  return 'info'
}

const getChainNodes = (chain: any) => {
  const nodeMap = new Map()

  chain.attackStages?.forEach((stage: any) => {
    stage.nodes?.forEach((nodeId: string) => {
      if (!nodeMap.has(nodeId)) {
        nodeMap.set(nodeId, {
          nodeId,
          nodeType: getNodeTypeFromId(nodeId),
          threatType: 'malicious',
          confidence: stage.confidence,
          stages: []
        })
      }
      nodeMap.get(nodeId).stages.push(stage.description)
    })
  })

  return Array.from(nodeMap.values())
}

const getNodeTypeFromId = (nodeId: string): string => {
  if (nodeId.includes('process')) return 'process'
  if (nodeId.includes('file')) return 'file'
  if (nodeId.includes('netflow')) return 'netflow'
  if (nodeId.includes('memory')) return 'memory'
  return 'unknown'
}

const getNodeTypeLabel = (type: string): string => {
  const labels = {
    process: '进程',
    file: '文件',
    netflow: '网络流',
    memory: '内存',
    unknown: '未知'
  }
  return labels[type] || type
}

const getNodeTypeColor = (type: string): string => {
  const colors = {
    process: 'primary',
    file: 'success',
    netflow: 'warning',
    memory: 'info',
    unknown: 'danger'
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

const formatTime = (timestamp: string): string => {
  try {
    return new Date(timestamp).toLocaleString()
  } catch {
    return timestamp
  }
}

const handleNext = () => {
  if (canProceed.value) {
    emit('next')
  } else {
    ElMessage.warning('请先完成攻击链重建')
  }
}

// 生命周期
onMounted(() => {
  if (props.jobData?.detectionJobId) {
    config.detectionJobId = props.jobData.detectionJobId
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.attack-reconstruction-step {
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

  .reconstruction-summary {
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;

      .summary-item {
        text-align: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 4px;

        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: $primary-color;
          margin-bottom: 4px;
        }

        .summary-label {
          font-size: 12px;
          color: $text-regular;
        }
      }
    }
  }

  .framework-distribution {
    margin-top: 20px;

    h5 {
      margin: 0 0 12px 0;
      color: $text-primary;
    }

    .stage-bars {
      .stage-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;

        .stage-info {
          min-width: 120px;
          text-align: right;

          .stage-name {
            display: block;
            font-size: 12px;
            color: $text-primary;
            font-weight: bold;
          }

          .stage-count {
            font-size: 11px;
            color: $text-regular;
          }
        }

        .stage-progress {
          flex: 1;
        }

        .stage-code {
          min-width: 60px;
          font-family: monospace;
          font-size: 11px;
          color: $primary-color;
          text-align: center;
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
        }
      }

      .progress-bar {
        margin: 16px 0;
      }
    }
  }

  .chains-panel {
    margin-bottom: 20px;

    .chain-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .chains-container {
      max-height: 500px;
      overflow-y: auto;

      .chain-item {
        padding: 20px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        margin-bottom: 16px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: $primary-color;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
        }

        &.active {
          border-color: $primary-color;
          background: #f0f9ff;
        }

        .chain-header {
          margin-bottom: 16px;

          .chain-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .chain-id {
              font-weight: bold;
              color: $text-primary;
            }
          }

          .chain-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: $text-regular;

            .chain-length {
              color: $primary-color;
            }

            .chain-duration {
              color: $success-color;
            }
          }
        }

        .chain-stages {
          .stages-timeline {
            position: relative;

            .stage-node {
              display: flex;
              align-items: center;
              position: relative;
              margin-bottom: 16px;

              .stage-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #ddd;
                margin-right: 12px;
                position: relative;
                z-index: 2;

                &::before {
                  content: '';
                  position: absolute;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: rgba(64, 158, 255, 0.1);
                  top: -4px;
                  left: -4px;
                  z-index: 1;
                }
              }

              &.completed .stage-dot {
                background: $primary-color;

                &::before {
                  background: rgba(64, 158, 255, 0.2);
                }
              }

              .stage-info {
                flex: 1;
                background: #f8f9fa;
                padding: 8px 12px;
                border-radius: 4px;
                border-left: 3px solid #ddd;

                .stage-name {
                  font-size: 13px;
                  font-weight: bold;
                  color: $text-primary;
                  margin-bottom: 2px;
                }

                .stage-ttp {
                  font-size: 11px;
                  color: $primary-color;
                  font-family: monospace;
                  margin-bottom: 2px;
                }

                .stage-confidence {
                  font-size: 11px;
                  color: $text-regular;
                }
              }

              &.completed .stage-info {
                border-left-color: $primary-color;
              }

              .stage-connector {
                position: absolute;
                left: 6px;
                top: 12px;
                width: 2px;
                height: 28px;
                background: #ddd;
                z-index: 0;
              }

              &.completed .stage-connector {
                background: $primary-color;
              }
            }
          }
        }
      }
    }
  }

  .chain-detail-panel {
    .chain-detail-content {
      .overview-section {
        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
          font-size: 14px;
          font-weight: bold;
        }

        .stages-detail-list {
          .stage-detail-item {
            padding: 12px;
            background: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 8px;

            .stage-detail-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;

              .stage-number {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                background: $primary-color;
                color: white;
                border-radius: 50%;
                font-size: 12px;
                font-weight: bold;
              }

              .stage-title {
                flex: 1;
                font-weight: bold;
                color: $text-primary;
              }
            }

            .stage-detail-content {
              font-size: 12px;
              color: $text-regular;
              line-height: 1.4;

              > div {
                margin-bottom: 2px;
              }
            }
          }
        }
      }

      .nodes-analysis {
        .node-id {
          font-family: monospace;
          font-size: 12px;
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .stage-tag {
          margin-right: 4px;
          margin-bottom: 4px;
        }
      }

      .chain-visualization {
        .viz-controls {
          margin-bottom: 16px;
        }

        .viz-container {
          height: 400px;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
          overflow: hidden;

          .viz-placeholder {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: $text-placeholder;

            p {
              margin-top: 12px;
            }
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