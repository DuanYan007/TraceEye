<template>
  <div class="behavior-mining-step">
    <el-row :gutter="20">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <el-card class="config-panel">
          <template #header>
            <h4>行为挖掘配置</h4>
          </template>

          <el-form :model="config" label-width="120px" size="small">
            <el-form-item label="图ID">
              <el-input v-model="config.graphId" readonly />
            </el-form-item>

            <el-form-item label="最大路径长度">
              <el-input-number
                v-model="config.maxPathLength"
                :min="3"
                :max="10"
                :step="1"
              />
              <div class="form-tip">控制潜在因果关系挖掘的路径长度</div>
            </el-form-item>

            <el-form-item label="注意力头数">
              <el-input-number
                v-model="config.attentionHeads"
                :min="1"
                :max="8"
                :step="1"
              />
              <div class="form-tip">多头注意力机制的注意力头数量</div>
            </el-form-item>

            <el-form-item label="隐藏维度">
              <el-input-number
                v-model="config.hiddenDimensions"
                :min="32"
                :max="256"
                :step="32"
              />
              <div class="form-tip">图神经网络隐藏层维度</div>
            </el-form-item>

            <el-form-item label="最小支持度">
              <el-input-number
                v-model="config.minSupport"
                :min="0.1"
                :max="1.0"
                :step="0.1"
                :precision="1"
              />
              <div class="form-tip">关系模式的最小支持度阈值</div>
            </el-form-item>

            <el-form-item label="置信度阈值">
              <el-input-number
                v-model="config.confidenceThreshold"
                :min="0.1"
                :max="1.0"
                :step="0.1"
                :precision="1"
              />
              <div class="form-tip">因果关系的最小置信度阈值</div>
            </el-form-item>

            <el-divider />

            <el-form-item label="高级选项">
              <el-checkbox-group v-model="config.advancedOptions">
                <el-checkbox label="useTemporal">
                  启用时序分析
                </el-checkbox>
                <el-checkbox label="useSemantic">
                  启用语义分析
                </el-checkbox>
                <el-checkbox label="useFrequency">
                  启用频率分析
                </el-checkbox>
                <el-checkbox label="useAnomaly">
                  启用异常检测
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="startMining"
              :loading="processing"
              :disabled="!canStart"
            >
              开始挖掘
            </el-button>
            <el-button @click="resetConfig">重置配置</el-button>
          </div>
        </el-card>

        <!-- 挖掘结果统计 -->
        <el-card class="stats-panel" v-if="miningResults">
          <template #header>
            <h4>挖掘结果统计</h4>
          </template>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ miningResults.discoveredRelationships || 0 }}</div>
              <div class="stat-label">发现关系</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ miningResults.latentPaths?.length || 0 }}</div>
              <div class="stat-label">潜在路径</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ miningResults.confidenceAvg?.toFixed(2) || '0.00' }}</div>
              <div class="stat-label">平均置信度</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ miningResults.processingTime || '0s' }}</div>
              <div class="stat-label">处理时间</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧状态和结果展示 -->
      <el-col :span="16">
        <el-card class="status-panel">
          <template #header>
            <h4>挖掘状态</h4>
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
                  <div class="value">{{ status.currentEpoch || 0 }}</div>
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

            <!-- 训练曲线 -->
            <div class="training-curves" v-if="trainingHistory.length > 0">
              <h5>训练曲线</h5>
              <div ref="trainingChart" class="training-chart"></div>
            </div>
          </div>
        </el-card>

        <!-- 发现的关系路径 -->
        <el-card class="paths-panel" v-if="discoveredPaths.length > 0">
          <template #header>
            <div class="flex-between">
              <h4>发现的潜在路径</h4>
              <div class="path-controls">
                <el-select v-model="selectedPathType" size="small" @change="filterPaths">
                  <el-option label="全部" value="all" />
                  <el-option label="因果关系" value="causal" />
                  <el-option label="时序关系" value="temporal" />
                  <el-option label="语义关系" value="semantic" />
                </el-select>
                <el-button size="small" @click="exportPaths">导出</el-button>
              </div>
            </div>
          </template>

          <div class="paths-container">
            <div
              v-for="(path, index) in filteredPaths"
              :key="path.pathId"
              class="path-item"
              @click="selectPath(path)"
              :class="{ active: selectedPath?.pathId === path.pathId }"
            >
              <div class="path-header">
                <div class="path-id">路径 #{{ index + 1 }}</div>
                <div class="path-confidence">
                  <el-progress
                    :percentage="path.confidenceScore * 100"
                    :stroke-width="6"
                    :show-text="false"
                  />
                  <span class="confidence-text">{{ (path.confidenceScore * 100).toFixed(1) }}%</span>
                </div>
              </div>

              <div class="path-content">
                <div class="path-nodes">
                  <el-tag
                    v-for="(nodeId, nodeIndex) in path.nodes"
                    :key="nodeId"
                    size="small"
                    :type="getNodeTypeColor(nodeId, path)"
                    class="node-tag"
                  >
                    {{ getNodeLabel(nodeId) }}
                  </el-tag>
                </div>
                <div class="path-relationships">
                  <span v-for="(rel, relIndex) in path.relationships" :key="relIndex" class="relationship">
                    {{ rel }}
                  </span>
                </div>
              </div>

              <div class="path-meta">
                <el-tag :type="getRelationshipTypeColor(path.relationshipType)" size="small">
                  {{ path.relationshipType }}
                </el-tag>
                <span class="path-length">长度: {{ path.nodes.length }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 路径详情 -->
        <el-card class="path-detail-panel" v-if="selectedPath">
          <template #header>
            <h4>路径详情</h4>
          </template>

          <div class="path-detail-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="路径ID">
                {{ selectedPath.pathId }}
              </el-descriptions-item>
              <el-descriptions-item label="关系类型">
                <el-tag :type="getRelationshipTypeColor(selectedPath.relationshipType)">
                  {{ selectedPath.relationshipType }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="置信度">
                {{ (selectedPath.confidenceScore * 100).toFixed(2) }}%
              </el-descriptions-item>
              <el-descriptions-item label="支持度">
                {{ selectedPath.support?.toFixed(2) || 'N/A' }}
              </el-descriptions-item>
              <el-descriptions-item label="路径长度" :span="2">
                {{ selectedPath.nodes.length }} 个节点
              </el-descriptions-item>
            </el-descriptions>

            <div class="path-visualization">
              <h5>路径可视化</h5>
              <div class="mini-graph" ref="miniGraph">
                <!-- 这里将绘制小型路径图 -->
                <div class="path-nodes-viz">
                  <div
                    v-for="(nodeId, index) in selectedPath.nodes"
                    :key="nodeId"
                    class="path-node-viz"
                    :class="{ highlighted: true }"
                  >
                    {{ getNodeLabel(nodeId) }}
                  </div>
                  <div
                    v-for="(rel, index) in selectedPath.relationships"
                    :key="index"
                    class="path-edge-viz"
                  >
                    {{ rel }}
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
        @click="$emit('analyze', 1)"
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
const trainingChart = ref()
const miniGraph = ref()

// 配置
const config = reactive({
  graphId: '',
  maxPathLength: 5,
  attentionHeads: 4,
  hiddenDimensions: 64,
  minSupport: 0.3,
  confidenceThreshold: 0.7,
  advancedOptions: ['useTemporal', 'useSemantic']
})

// 状态
const status = reactive({
  status: '',
  progress: 0,
  currentEpoch: 0,
  converged: false
})

const miningResults = ref(null)
const discoveredPaths = ref([])
const selectedPath = ref(null)
const selectedPathType = ref('all')
const trainingHistory = ref([])

// 计算属性
const canStart = computed(() => {
  return config.graphId && config.maxPathLength > 0
})

const canProceed = computed(() => {
  return status.status === 'completed' && discoveredPaths.value.length > 0
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
    case 'completed': return '挖掘完成'
    case 'processing': return '挖掘中'
    case 'failed': return '挖掘失败'
    default: return '未开始'
  }
})

const filteredPaths = computed(() => {
  if (selectedPathType.value === 'all') {
    return discoveredPaths.value
  }
  return discoveredPaths.value.filter(path =>
    path.relationshipType === selectedPathType.value
  )
})

// 监听props变化
watch(() => props.jobData, (newData) => {
  if (newData?.graphId) {
    config.graphId = newData.graphId
  }
}, { immediate: true })

// 方法
const startMining = async () => {
  if (!canStart.value) {
    ElMessage.warning('请完善配置信息')
    return
  }

  processing.value = true

  try {
    const miningConfig = {
      max_path_length: config.maxPathLength,
      attention_heads: config.attentionHeads,
      hidden_dimensions: config.hiddenDimensions,
      min_support: config.minSupport,
      confidence_threshold: config.confidenceThreshold,
      use_temporal: config.advancedOptions.includes('useTemporal'),
      use_semantic: config.advancedOptions.includes('useSemantic'),
      use_frequency: config.advancedOptions.includes('useFrequency'),
      use_anomaly: config.advancedOptions.includes('useAnomaly')
    }

    const response = await slotApi.startMining(config.graphId, miningConfig)

    // 开始监控挖掘状态
    monitorMiningStatus(response.data.mining_job_id)

    ElMessage.success('行为挖掘已启动')
  } catch (error) {
    ElMessage.error('启动行为挖掘失败')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const monitorMiningStatus = async (miningJobId: string) => {
  const pollStatus = async () => {
    try {
      const response = await slotApi.getMiningStatus(miningJobId)
      Object.assign(status, response.data)

      // 更新训练历史
      if (response.data.currentEpoch) {
        trainingHistory.value.push({
          epoch: response.data.currentEpoch,
          loss: response.data.loss || 0,
          accuracy: response.data.accuracy || 0
        })
      }

      if (response.data.status === 'completed') {
        // 挖掘完成，获取结果
        miningResults.value = response.data
        discoveredPaths.value = response.data.latentPaths || []

        ElMessage.success('行为挖掘完成')
        return
      } else if (response.data.status === 'failed') {
        ElMessage.error('行为挖掘失败')
        return
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    } catch (error) {
      console.error('获取挖掘状态失败:', error)
    }
  }

  pollStatus()
}

const resetConfig = () => {
  Object.assign(config, {
    maxPathLength: 5,
    attentionHeads: 4,
    hiddenDimensions: 64,
    minSupport: 0.3,
    confidenceThreshold: 0.7,
    advancedOptions: ['useTemporal', 'useSemantic']
  })
}

const selectPath = (path: any) => {
  selectedPath.value = path
}

const filterPaths = () => {
  // 过滤逻辑已在计算属性中实现
}

const exportPaths = () => {
  const data = filteredPaths.value
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `latent-paths-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  ElMessage.success('路径数据已导出')
}

const getNodeLabel = (nodeId: string): string => {
  // 简化版节点标签生成
  return nodeId.split('_').pop() || nodeId
}

const getNodeTypeColor = (nodeId: string, path: any): string => {
  // 根据节点类型返回标签颜色
  if (nodeId.includes('process')) return 'primary'
  if (nodeId.includes('file')) return 'success'
  if (nodeId.includes('netflow')) return 'warning'
  return 'info'
}

const getRelationshipTypeColor = (type: string): string => {
  switch (type) {
    case 'causal': return 'danger'
    case 'temporal': return 'primary'
    case 'semantic': return 'success'
    default: return 'info'
  }
}

const handleNext = () => {
  if (canProceed.value) {
    emit('next')
  } else {
    ElMessage.warning('请先完成行为挖掘')
  }
}

// 生命周期
onMounted(() => {
  if (props.jobData?.graphId) {
    config.graphId = props.jobData.graphId
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.behavior-mining-step {
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

      .training-curves {
        margin-top: 20px;

        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
        }

        .training-chart {
          height: 200px;
          border: 1px solid #e4e7ed;
          border-radius: 4px;
        }
      }
    }
  }

  .paths-panel {
    margin-bottom: 20px;

    .path-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .paths-container {
      max-height: 400px;
      overflow-y: auto;

      .path-item {
        padding: 16px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: $primary-color;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        &.active {
          border-color: $primary-color;
          background: #f0f9ff;
        }

        .path-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;

          .path-id {
            font-weight: bold;
            color: $text-primary;
          }

          .path-confidence {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 120px;

            .confidence-text {
              font-size: 12px;
              color: $text-regular;
            }
          }
        }

        .path-content {
          margin-bottom: 12px;

          .path-nodes {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 8px;

            .node-tag {
              font-size: 12px;
            }
          }

          .path-relationships {
            .relationship {
              display: inline-block;
              margin-right: 8px;
              font-size: 12px;
              color: $text-regular;

              &:not(:last-child)::after {
                content: '→';
                margin-left: 8px;
                color: $primary-color;
              }
            }
          }
        }

        .path-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .path-length {
            font-size: 12px;
            color: $text-regular;
          }
        }
      }
    }
  }

  .path-detail-panel {
    .path-detail-content {
      .path-visualization {
        margin-top: 20px;

        h5 {
          margin: 0 0 12px 0;
          color: $text-primary;
        }

        .mini-graph {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e4e7ed;

          .path-nodes-viz {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;

            .path-node-viz {
              padding: 8px 16px;
              background: $primary-color;
              color: white;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;

              &.highlighted {
                box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
              }
            }

            .path-edge-viz {
              color: $text-regular;
              font-size: 12px;
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