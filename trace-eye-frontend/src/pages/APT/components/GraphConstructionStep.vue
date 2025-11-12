<template>
  <div class="graph-construction-step">
    <el-row :gutter="20">
      <!-- 左侧配置面板 -->
      <el-col :span="8">
        <el-card class="config-panel">
          <template #header>
            <h4>图构建配置</h4>
          </template>

          <el-form :model="config" label-width="120px" size="small">
            <el-form-item label="数据集">
              <el-input v-model="config.datasetName" readonly />
            </el-form-item>

            <el-form-item label="最大节点数">
              <el-input-number
                v-model="config.maxNodes"
                :min="1000"
                :max="50000"
                :step="1000"
              />
            </el-form-item>

            <el-form-item label="关系类型">
              <el-checkbox-group v-model="config.relationshipTypes">
                <el-checkbox
                  v-for="type in availableRelationshipTypes"
                  :key="type.value"
                  :label="type.value"
                >
                  {{ type.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="时间窗口">
              <el-date-picker
                v-model="config.timeWindow"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>

            <el-form-item label="实体过滤">
              <el-select
                v-model="config.entityFilters"
                multiple
                placeholder="选择实体类型"
                style="width: 100%"
              >
                <el-option
                  v-for="type in entityTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-form>

          <div class="action-buttons">
            <el-button
              type="primary"
              @click="startGraphConstruction"
              :loading="processing"
              :disabled="!canStart"
            >
              开始构建
            </el-button>
            <el-button @click="resetConfig">重置配置</el-button>
          </div>
        </el-card>

        <!-- 构建日志 -->
        <el-card class="log-panel" v-if="buildLogs.length > 0">
          <template #header>
            <div class="flex-between">
              <span>构建日志</span>
              <el-button size="small" @click="clearLogs">清空</el-button>
            </div>
          </template>

          <div class="log-container">
            <div
              v-for="(log, index) in buildLogs"
              :key="index"
              :class="['log-item', log.level]"
            >
              <span class="timestamp">{{ log.timestamp }}</span>
              <span class="message">{{ log.message }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧状态和预览 -->
      <el-col :span="16">
        <el-card class="status-panel">
          <template #header>
            <h4>构建状态</h4>
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
                  <div class="label">节点数</div>
                  <div class="value">{{ status.nodes || 0 }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="status-item">
                  <div class="label">边数</div>
                  <div class="value">{{ status.edges || 0 }}</div>
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

          <!-- 图统计信息 -->
          <div class="graph-stats" v-if="status.graphInfo">
            <h5>图统计信息</h5>
            <el-row :gutter="12">
              <el-col :span="8" v-for="stat in graphStats" :key="stat.key">
                <div class="stat-item">
                  <div class="stat-label">{{ stat.label }}</div>
                  <div class="stat-value">{{ stat.value }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 图预览 -->
        <el-card class="preview-panel" v-if="graphPreview.nodes">
          <template #header>
            <div class="flex-between">
              <h4>图预览</h4>
              <div class="preview-controls">
                <el-button-group size="small">
                  <el-button @click="zoomIn">放大</el-button>
                  <el-button @click="zoomOut">缩小</el-button>
                  <el-button @click="resetZoom">重置</el-button>
                </el-button-group>
              </div>
            </div>
          </template>

          <div class="graph-preview-container" ref="graphContainer">
            <div class="graph-placeholder" v-if="!graphPreview.nodes.length">
              <el-icon size="48" color="#ddd"><Share /></el-icon>
              <p>暂无图数据</p>
            </div>
            <div v-else class="graph-visualization">
              <!-- 这里将集成D3.js或ECharts进行图可视化 -->
              <div ref="graphViz" class="graph-viz"></div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <el-button @click="$emit('prev')" v-if="showPrev">上一步</el-button>
      <el-button
        type="primary"
        @click="handleNext"
        :disabled="!canProceed"
      >
        下一步
      </el-button>
      <el-button
        type="success"
        @click="$emit('analyze', 0)"
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
import { Share } from '@element-plus/icons-vue'
import { slotApi } from '@/api/slot'

interface Props {
  jobData?: any
  stepData?: any
  showPrev?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPrev: false
})

const emit = defineEmits<{
  next: []
  prev: []
  analyze: [stepIndex: number]
}>()

// 响应式数据
const processing = ref(false)
const buildLogs = ref<Array<{
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}>>([])

const graphContainer = ref()
const graphViz = ref()

// 配置
const config = reactive({
  datasetName: '',
  maxNodes: 10000,
  relationshipTypes: ['execute', 'write', 'read', 'connect'],
  timeWindow: [] as string[],
  entityFilters: ['process', 'file', 'netflow']
})

// 状态
const status = reactive({
  status: '',
  progress: 0,
  nodes: 0,
  edges: 0,
  graphInfo: null as any
})

const graphPreview = reactive({
  nodes: [] as any[],
  edges: [] as any[]
})

// 可选项
const availableRelationshipTypes = [
  { label: '执行', value: 'execute' },
  { label: '写入', value: 'write' },
  { label: '读取', value: 'read' },
  { label: '连接', value: 'connect' },
  { label: '发送', value: 'send' },
  { label: '接收', value: 'recv' }
]

const entityTypes = [
  { label: '进程', value: 'process' },
  { label: '文件', value: 'file' },
  { label: '网络流', value: 'netflow' },
  { label: '内存', value: 'memory' },
  { label: '用户', value: 'user' }
]

// 计算属性
const canStart = computed(() => {
  return config.datasetName && config.relationshipTypes.length > 0
})

const canProceed = computed(() => {
  return status.status === 'completed' && graphPreview.nodes.length > 0
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
    case 'completed': return '构建完成'
    case 'processing': return '构建中'
    case 'failed': return '构建失败'
    default: return '未开始'
  }
})

const graphStats = computed(() => {
  if (!status.graphInfo) return []

  return [
    { key: 'entityTypes', label: '实体类型', value: status.graphInfo.entity_types?.length || 0 },
    { key: 'avgDegree', label: '平均度', value: (status.edges / status.nodes).toFixed(2) || '0' },
    { key: 'density', label: '图密度', value: '0.15' }, // 示例数据
    { key: 'components', label: '连通分量', value: '1' }, // 示例数据
    { key: 'diameter', label: '图直径', value: '8' }, // 示例数据
    { key: 'avgPathLength', label: '平均路径长度', value: '3.2' } // 示例数据
  ]
})

// 监听props变化
watch(() => props.jobData, (newData) => {
  if (newData) {
    config.datasetName = newData.datasetName || ''
    // 根据任务数据更新配置
  }
}, { immediate: true })

watch(() => props.stepData, (newData) => {
  if (newData) {
    Object.assign(status, newData.status || {})
    Object.assign(graphPreview, newData.graphPreview || {})
  }
}, { immediate: true })

// 方法
const addLog = (level: 'info' | 'warning' | 'error' | 'success', message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  buildLogs.value.push({ timestamp, level, message })

  // 限制日志数量
  if (buildLogs.value.length > 100) {
    buildLogs.value.shift()
  }
}

const startGraphConstruction = async () => {
  if (!canStart.value) {
    ElMessage.warning('请完善配置信息')
    return
  }

  processing.value = true
  addLog('info', '开始构建溯源图...')

  try {
    // 如果已有任务，重新开始图构建
    if (props.jobData?.jobId) {
      await monitorGraphConstruction(props.jobData.jobId)
    } else {
      ElMessage.error('缺少任务信息')
    }
  } catch (error) {
    addLog('error', '图构建失败')
    ElMessage.error('图构建失败')
    console.error(error)
  } finally {
    processing.value = false
  }
}

const monitorGraphConstruction = async (jobId: string) => {
  addLog('info', `监控任务 ${jobId} 的构建状态...`)

  const pollStatus = async () => {
    try {
      const response = await slotApi.getGraphStatus(jobId)
      Object.assign(status, response.data)

      addLog('info', `构建进度: ${response.data.progress}%`)

      if (response.data.status === 'completed') {
        addLog('success', '图构建完成')

        // 获取图数据
        const graphResponse = await slotApi.getInitialGraph(jobId)
        Object.assign(graphPreview, graphResponse.data)

        addLog('info', `加载图数据: ${graphPreview.nodes.length} 节点, ${graphPreview.edges.length} 边`)

        // 初始化图可视化
        await nextTick()
        initializeGraphVisualization()
        return
      } else if (response.data.status === 'failed') {
        addLog('error', '图构建失败')
        return
      }

      // 继续轮询
      setTimeout(pollStatus, 2000)
    } catch (error) {
      addLog('error', '获取构建状态失败')
      console.error(error)
    }
  }

  pollStatus()
}

const initializeGraphVisualization = () => {
  // 这里将实现D3.js或ECharts图可视化
  // 暂时显示占位内容
  addLog('info', '初始化图可视化组件')
}

const resetConfig = () => {
  Object.assign(config, {
    maxNodes: 10000,
    relationshipTypes: ['execute', 'write', 'read', 'connect'],
    timeWindow: [],
    entityFilters: ['process', 'file', 'netflow']
  })
  addLog('info', '配置已重置')
}

const clearLogs = () => {
  buildLogs.value = []
}

const handleNext = () => {
  if (canProceed.value) {
    emit('next')
  } else {
    ElMessage.warning('请先完成图构建')
  }
}

// 缩放控制
const zoomIn = () => {
  // 实现图放大
  addLog('info', '放大图视图')
}

const zoomOut = () => {
  // 实现图缩小
  addLog('info', '缩小图视图')
}

const resetZoom = () => {
  // 重置图缩放
  addLog('info', '重置图视图')
}

// 生命周期
onMounted(() => {
  if (props.jobData?.datasetName) {
    config.datasetName = props.jobData.datasetName
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.graph-construction-step {
  .config-panel,
  .log-panel {
    margin-bottom: 20px;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }

  .log-container {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    padding: 8px;

    .log-item {
      display: flex;
      gap: 12px;
      margin-bottom: 4px;
      font-size: 12px;
      line-height: 1.4;

      .timestamp {
        color: $text-regular;
        flex-shrink: 0;
      }

      .message {
        flex: 1;
      }

      &.info {
        .message { color: $text-primary; }
      }

      &.success {
        .message { color: $success-color; }
      }

      &.warning {
        .message { color: $warning-color; }
      }

      &.error {
        .message { color: $danger-color; }
      }
    }
  }

  .status-panel {
    margin-bottom: 20px;

    .status-overview {
      margin-bottom: 20px;

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
        margin-top: 16px;
      }
    }

    .graph-stats {
      border-top: 1px solid #e4e7ed;
      padding-top: 16px;

      h5 {
        margin: 0 0 12px 0;
        color: $text-primary;
      }

      .stat-item {
        text-align: center;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;

        .stat-label {
          font-size: 12px;
          color: $text-regular;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: bold;
          color: $primary-color;
        }
      }
    }
  }

  .preview-panel {
    .graph-preview-container {
      height: 400px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      overflow: hidden;

      .graph-placeholder {
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

      .graph-viz {
        height: 100%;
        width: 100%;
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