<template>
  <div class="embedding-step">
    <el-row :gutter="20">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <el-card class="config-panel">
          <template #header>
            <h4>嵌入配置</h4>
          </template>

          <el-form :model="config" label-width="120px" size="small">
            <el-form-item label="挖掘任务ID">
              <el-input v-model="config.miningJobId" readonly />
            </el-form-item>

            <el-form-item label="嵌入维度">
              <el-input-number
                v-model="config.embeddingDimension"
                :min="32"
                :max="256"
                :step="32"
              />
              <div class="form-tip">节点嵌入向量的维度</div>
            </el-form-item>

            <el-divider>强化学习配置</el-divider>

            <el-form-item label="动作步长">
              <el-input-number
                v-model="config.rlConfig.actionStepSize"
                :min="0.001"
                :max="0.1"
                :step="0.001"
                :precision="3"
              />
              <div class="form-tip">强化学习代理的动作更新步长</div>
            </el-form-item>

            <el-form-item label="收敛阈值">
              <el-input-number
                v-model="config.rlConfig.convergenceThreshold"
                :min="1"
                :max="50"
                :step="1"
              />
              <div class="form-tip">连续多少轮无改进则认为收敛</div>
            </el-form-item>

            <el-form-item label="最大轮次">
              <el-input-number
                v-model="config.rlConfig.maxEpisodes"
                :min="10"
                :max="500"
                :step="10"
              />
              <div class="form-tip">强化学习最大训练轮次</div>
            </el-form-item>

            <el-form-item label="学习率">
              <el-input-number
                v-model="config.rlConfig.learningRate"
                :min="0.0001"
                :max="0.1"
                :step="0.0001"
                :precision="4"
              />
            </el-form-item>

            <el-divider>相似度配置</el-divider>

            <el-form-item label="语义权重">
              <el-slider
                v-model="config.similarityConfig.semanticWeight"
                :min="0"
                :max="1"
                :step="0.1"
                show-input
                :format-tooltip="(val) => `${val}`"
              />
              <div class="form-tip">语义相似度在总相似度中的权重</div>
            </el-form-item>

            <el-form-item label="拓扑权重">
              <el-slider
                v-model="config.similarityConfig.topologicalWeight"
                :min="0"
                :max="1"
                :step="0.1"
                show-input
                :format-tooltip="(val) => `${val}`"
              />
              <div class="form-tip">拓扑相似度在总相似度中的权重</div>
            </el-form-item>

            <el-form-item label="邻居数量">
              <el-input-number
                v-model="config.similarityConfig.kNeighbors"
                :min="5"
                :max="50"
                :step="5"
              />
              <div class="form-tip">为每个节点保留的相似邻居数量</div>
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="startEmbedding"
              :loading="processing"
              :disabled="!canStart"
            >
              开始嵌入
            </el-button>
            <el-button @click="resetConfig">重置配置</el-button>
          </div>
        </el-card>

        <!-- 嵌入结果统计 -->
        <el-card class="stats-panel" v-if="embeddingResults">
          <template #header>
            <h4>嵌入结果统计</h4>
          </template>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ embeddingResults.totalNodes || 0 }}</div>
              <div class="stat-label">嵌入节点</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ embeddingResults.finalEpoch || 0 }}</div>
              <div class="stat-label">最终轮次</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">
                {{ embeddingResults.converged ? '是' : '否' }}
              </div>
              <div class="stat-label">是否收敛</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ embeddingResults.avgReward?.toFixed(3) || '0.000' }}</div>
              <div class="stat-label">平均奖励</div>
            </div>
          </div>

          <div class="thresholds-info" v-if="embeddingResults.optimalThresholds">
            <h5>最优阈值</h5>
            <div class="thresholds-list">
              <div
                v-for="(value, type) in embeddingResults.optimalThresholds"
                :key="type"
                class="threshold-item"
              >
                <span class="threshold-type">{{ type }}</span>
                <span class="threshold-value">{{ value.toFixed(3) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧状态和结果展示 -->
      <el-col :span="16">
        <el-card class="status-panel">
          <template #header>
            <h4>嵌入状态</h4>
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
                  <div class="label">当前轮次</div>
                  <div class="value">{{ status.epoch || 0 }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">收敛状态</div>
                  <div class="value">
                    <el-tag v-if="status.converged" type="success" size="small">已收敛</el-tag>
                    <el-tag v-else type="warning" size="small">训练中</el-tag>
                  </div>
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

          <!-- 强化学习训练曲线 -->
          <div class="rl-training-curves" v-if="rlHistory.length > 0">
            <h5>强化学习训练曲线</h5>
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="chart-container">
                  <div ref="rewardChart" class="chart"></div>
                  <div class="chart-title">奖励曲线</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="chart-container">
                  <div ref="convergenceChart" class="chart"></div>
                  <div class="chart-title">收敛曲线</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 嵌入向量可视化 -->
        <el-card class="embedding-viz-panel" v-if="embeddingData.length > 0">
          <template #header>
            <div class="flex-between">
              <h4>嵌入向量可视化</h4>
              <div class="viz-controls">
                <el-select v-model="selectedVisualizationType" size="small" @change="updateVisualization">
                  <el-option label="2D投影" value="2d" />
                  <el-option label="3D投影" value="3d" />
                  <el-option label="相似度热图" value="heatmap" />
                  <el-option label="聚类分析" value="clustering" />
                </el-select>
                <el-button size="small" @click="exportEmbeddings">导出</el-button>
              </div>
            </div>
          </template>

          <div class="embedding-visualization">
            <div ref="embeddingViz" class="viz-container">
              <!-- 这里将集成D3.js或ECharts进行嵌入可视化 -->
              <div class="viz-placeholder" v-if="!visualizationReady">
                <el-icon size="48" color="#ddd"><DataAnalysis /></el-icon>
                <p>正在准备可视化...</p>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 相似度分析 -->
        <el-card class="similarity-panel" v-if="selectedNodeEmbedding">
          <template #header>
            <h4>节点相似度分析</h4>
          </template>

          <div class="similarity-content">
            <div class="node-selector">
              <el-select
                v-model="selectedNodeId"
                filterable
                placeholder="选择节点进行相似度分析"
                @change="selectNode"
                style="width: 300px"
              >
                <el-option
                  v-for="node in availableNodes"
                  :key="node.id"
                  :label="node.label"
                  :value="node.id"
                />
              </el-select>
            </div>

            <div class="similarity-results" v-if="selectedNodeEmbedding">
              <h5>相似节点 (Top {{ similarNodes.length }})</h5>
              <div class="similar-nodes-list">
                <div
                  v-for="node in similarNodes"
                  :key="node.nodeId"
                  class="similar-node-item"
                  :style="{ opacity: node.similarityScore }"
                >
                  <div class="node-info">
                    <span class="node-id">{{ node.nodeId }}</span>
                    <el-tag size="small" :type="getNodeTypeColor(node.nodeId)">
                      {{ getNodeType(node.nodeId) }}
                    </el-tag>
                  </div>
                  <div class="similarity-score">
                    <el-progress
                      :percentage="node.similarityScore * 100"
                      :stroke-width="6"
                      :show-text="false"
                    />
                    <span class="score-text">{{ (node.similarityScore * 100).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
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
        @click="$emit('analyze', 2)"
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
import { DataAnalysis } from '@element-plus/icons-vue'
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
const visualizationReady = ref(false)

// 图表引用
const rewardChart = ref()
const convergenceChart = ref()
const embeddingViz = ref()

// 配置
const config = reactive({
  miningJobId: '',
  embeddingDimension: 64,
  rlConfig: {
    actionStepSize: 0.02,
    convergenceThreshold: 10,
    maxEpisodes: 100,
    learningRate: 0.001
  },
  similarityConfig: {
    semanticWeight: 0.6,
    topologicalWeight: 0.4,
    kNeighbors: 10
  }
})

// 状态
const status = reactive({
  status: '',
  progress: 0,
  epoch: 0,
  converged: false
})

const embeddingResults = ref(null)
const embeddingData = ref([])
const rlHistory = ref([])
const selectedVisualizationType = ref('2d')

// 相似度分析
const selectedNodeId = ref('')
const selectedNodeEmbedding = ref(null)
const similarNodes = ref([])
const availableNodes = ref([])

// 计算属性
const canStart = computed(() => {
  return config.miningJobId && config.embeddingDimension > 0
})

const canProceed = computed(() => {
  return status.status === 'completed' && embeddingData.value.length > 0
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
    case 'completed': return '嵌入完成'
    case 'processing': return '嵌入中'
    case 'failed': return '嵌入失败'
    default: return '未开始'
  }
})

// 监听props变化
watch(() => props.jobData, (newData) => {
  if (newData?.miningJobId) {
    config.miningJobId = newData.miningJobId
  }
}, { immediate: true })

// 方法
const startEmbedding = async () => {
  if (!canStart.value) {
    ElMessage.warning('请完善配置信息')
    return
  }

  processing.value = true

  try {
    const embeddingConfig = {
      embedding_dimension: config.embeddingDimension,
      rl_config: config.rlConfig,
      similarity_config: config.similarityConfig
    }

    const response = await slotApi.startEmbedding(config.miningJobId, embeddingConfig)

    // 开始监控嵌入状态
    monitorEmbeddingStatus(response.data.embedding_job_id)

    ElMessage.success('图嵌入已启动')
  } catch (error) {
    ElMessage.error('启动图嵌入失败')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const monitorEmbeddingStatus = async (embeddingJobId: string) => {
  const pollStatus = async () => {
    try {
      const response = await slotApi.getEmbeddingStatus(embeddingJobId)
      Object.assign(status, response.data)

      // 更新强化学习历史
      if (response.data.epoch && response.data.averageReward) {
        rlHistory.value.push({
          epoch: response.data.epoch,
          reward: response.data.averageReward,
          convergence: response.data.convergenceScore || 0
        })

        // 更新图表
        updateRLCharts()
      }

      if (response.data.status === 'completed') {
        // 嵌入完成，获取结果
        embeddingResults.value = response.data
        embeddingData.value = response.data.nodeEmbeddings || []

        // 准备相似度分析数据
        prepareSimilarityAnalysis()

        ElMessage.success('图嵌入完成')
        return
      } else if (response.data.status === 'failed') {
        ElMessage.error('图嵌入失败')
        return
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    } catch (error) {
      console.error('获取嵌入状态失败:', error)
    }
  }

  pollStatus()
}

const prepareSimilarityAnalysis = () => {
  if (!embeddingData.value.length) return

  // 准备可用节点列表
  availableNodes.value = embeddingData.value.map(node => ({
    id: node.nodeId,
    label: node.nodeId,
    type: getNodeType(node.nodeId)
  }))

  // 默认选择第一个节点
  if (availableNodes.value.length > 0) {
    selectedNodeId.value = availableNodes.value[0].id
    selectNode()
  }
}

const selectNode = () => {
  const nodeEmbedding = embeddingData.value.find(node => node.nodeId === selectedNodeId.value)
  if (nodeEmbedding) {
    selectedNodeEmbedding.value = nodeEmbedding
    similarNodes.value = nodeEmbedding.filteredNeighbors || []
  }
}

const updateRLCharts = () => {
  // 这里将实现ECharts图表更新
  nextTick(() => {
    if (rewardChart.value) {
      // 绘制奖励曲线
    }
    if (convergenceChart.value) {
      // 绘制收敛曲线
    }
  })
}

const updateVisualization = () => {
  visualizationReady.value = false

  nextTick(() => {
    // 根据选择的类型更新可视化
    switch (selectedVisualizationType.value) {
      case '2d':
        render2DProjection()
        break
      case '3d':
        render3DProjection()
        break
      case 'heatmap':
        renderSimilarityHeatmap()
        break
      case 'clustering':
        renderClusteringAnalysis()
        break
    }
    visualizationReady.value = true
  })
}

const render2DProjection = () => {
  // 实现2D投影可视化
  if (embeddingViz.value) {
    // 使用PCA或t-SNE进行降维并绘制
  }
}

const render3DProjection = () => {
  // 实现3D投影可视化
}

const renderSimilarityHeatmap = () => {
  // 实现相似度热图
}

const renderClusteringAnalysis = () => {
  // 实现聚类分析可视化
}

const resetConfig = () => {
  Object.assign(config, {
    embeddingDimension: 64,
    rlConfig: {
      actionStepSize: 0.02,
      convergenceThreshold: 10,
      maxEpisodes: 100,
      learningRate: 0.001
    },
    similarityConfig: {
      semanticWeight: 0.6,
      topologicalWeight: 0.4,
      kNeighbors: 10
    }
  })
}

const exportEmbeddings = () => {
  const data = {
    config: config,
    results: embeddingResults.value,
    embeddings: embeddingData.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `node-embeddings-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('嵌入数据已导出')
}

const getNodeType = (nodeId: string): string => {
  if (nodeId.includes('process')) return '进程'
  if (nodeId.includes('file')) return '文件'
  if (nodeId.includes('netflow')) return '网络流'
  if (nodeId.includes('memory')) return '内存'
  return '其他'
}

const getNodeTypeColor = (nodeId: string): string => {
  if (nodeId.includes('process')) return 'primary'
  if (nodeId.includes('file')) return 'success'
  if (nodeId.includes('netflow')) return 'warning'
  return 'info'
}

const handleNext = () => {
  if (canProceed.value) {
    emit('next')
  } else {
    ElMessage.warning('请先完成图嵌入')
  }
}

// 生命周期
onMounted(() => {
  if (props.jobData?.miningJobId) {
    config.miningJobId = props.jobData.miningJobId
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.embedding-step {
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

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .stat-item {
      text-align: center;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;

      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: $primary-color;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: $text-regular;
      }
    }
  }

  .thresholds-info {
    margin-top: 16px;

    h5 {
      margin: 0 0 12px 0;
      color: $text-primary;
    }

    .thresholds-list {
      .threshold-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 12px;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 6px;

        .threshold-type {
          font-size: 12px;
          color: $text-regular;
        }

        .threshold-value {
          font-weight: bold;
          color: $primary-color;
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

      .rl-training-curves {
        margin-top: 20px;

        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
        }

        .chart-container {
          .chart {
            height: 200px;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
          }

          .chart-title {
            text-align: center;
            font-size: 12px;
            color: $text-regular;
            margin-top: 8px;
          }
        }
      }
    }
  }

  .embedding-viz-panel {
    margin-bottom: 20px;

    .viz-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .embedding-visualization {
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

  .similarity-panel {
    .similarity-content {
      .node-selector {
        margin-bottom: 20px;
      }

      .similarity-results {
        h5 {
          margin: 0 0 16px 0;
          color: $text-primary;
        }

        .similar-nodes-list {
          max-height: 300px;
          overflow-y: auto;

          .similar-node-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            border: 1px solid #e4e7ed;
            border-radius: 6px;
            margin-bottom: 8px;
            transition: all 0.3s ease;

            &:hover {
              background: #f8f9fa;
            }

            .node-info {
              display: flex;
              align-items: center;
              gap: 8px;

              .node-id {
                font-family: monospace;
                font-size: 13px;
                color: $text-primary;
              }
            }

            .similarity-score {
              display: flex;
              align-items: center;
              gap: 8px;
              min-width: 120px;

              .score-text {
                font-size: 12px;
                color: $text-regular;
              }
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