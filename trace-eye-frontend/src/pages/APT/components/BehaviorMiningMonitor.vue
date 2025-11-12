<template>
  <div class="behavior-mining-monitor">
    <div class="monitor-header">
      <div class="job-info">
        <span class="job-id">任务ID: {{ jobId }}</span>
        <el-tag :type="statusType" size="small">{{ statusText }}</el-tag>
      </div>
    </div>

    <div class="monitor-content">
      <!-- 实时指标 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">进度</div>
          <div class="metric-value">{{ status.progress || 0 }}%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">发现路径</div>
          <div class="metric-value">{{ status.discoveredPaths || 0 }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">关系数量</div>
          <div class="metric-value">{{ status.relationships || 0 }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">当前轮次</div>
          <div class="metric-value">{{ status.currentEpoch || 0 }}</div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="progress-section">
        <el-progress
          :percentage="status.progress || 0"
          :status="progressStatus"
          :stroke-width="8"
        />
      </div>

      <!-- 训练指标 -->
      <div class="training-metrics" v-if="status.currentEpoch > 0">
        <div class="metrics-row">
          <div class="training-metric">
            <span class="metric-name">损失值:</span>
            <span class="metric-value">{{ (status.loss || 0).toFixed(4) }}</span>
          </div>
          <div class="training-metric">
            <span class="metric-name">准确率:</span>
            <span class="metric-value">{{ ((status.accuracy || 0) * 100).toFixed(1) }}%</span>
          </div>
          <div class="training-metric">
            <span class="metric-name">收敛状态:</span>
            <el-tag :type="status.converged ? 'success' : 'warning'" size="small">
              {{ status.converged ? '已收敛' : '训练中' }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 实时日志 -->
      <div class="logs-section" v-if="logs.length > 0">
        <div class="logs-header">
          <span>实时日志</span>
          <el-button size="small" @click="clearLogs">清空</el-button>
        </div>
        <div class="logs-container">
          <div
            v-for="(log, index) in logs"
            :key="index"
            :class="['log-item', log.level]"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { slotApi } from '@/api/slot'

interface Props {
  status: any
  jobId: string
}

const props = defineProps<Props>()

// 响应式数据
const logs = ref<Array<{
  time: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}>>([])

const pollInterval = ref<NodeJS.Timeout>()

// 计算属性
const statusType = computed(() => {
  switch (props.status?.status) {
    case 'completed': return 'success'
    case 'processing': return 'primary'
    case 'failed': return 'danger'
    default: return 'info'
  }
})

const statusText = computed(() => {
  switch (props.status?.status) {
    case 'completed': return '已完成'
    case 'processing': return '处理中'
    case 'failed': return '失败'
    default: return '未开始'
  }
})

const progressStatus = computed(() => {
  const progress = props.status?.progress || 0
  if (progress === 100) return 'success'
  if (props.status?.status === 'failed') return 'exception'
  return undefined
})

// 方法
const addLog = (level: 'info' | 'warning' | 'error' | 'success', message: string) => {
  const time = new Date().toLocaleTimeString()
  logs.value.push({ time, level, message })

  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value.shift()
  }
}

const clearLogs = () => {
  logs.value = []
}

const startMonitoring = () => {
  if (!props.jobId) return

  addLog('info', `开始监控挖掘任务 ${props.jobId}`)

  pollInterval.value = setInterval(async () => {
    try {
      const response = await slotApi.getMiningStatus(props.jobId)

      if (response.data.progress !== props.status?.progress) {
        addLog('info', `挖掘进度: ${response.data.progress}%`)
      }

      if (response.data.currentEpoch && response.data.currentEpoch !== (props.status?.currentEpoch || 0)) {
        addLog('info', `第 ${response.data.currentEpoch} 轮训练完成`)
      }

      if (response.data.status === 'completed') {
        addLog('success', `行为挖掘完成，发现 ${response.data.discoveredRelationships} 个新关系`)
        stopMonitoring()
      } else if (response.data.status === 'failed') {
        addLog('error', '行为挖掘失败')
        stopMonitoring()
      }
    } catch (error) {
      addLog('error', '获取挖掘状态失败')
      console.error(error)
    }
  }, 3000)
}

const stopMonitoring = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = undefined
  }
}

// 生命周期
onMounted(() => {
  startMonitoring()
})

onUnmounted(() => {
  stopMonitoring()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.behavior-mining-monitor {
  .monitor-header {
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 16px;

    .job-info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .job-id {
        font-size: 12px;
        color: $text-regular;
        font-family: monospace;
      }
    }
  }

  .monitor-content {
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;

      .metric-item {
        text-align: center;
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;

        .metric-label {
          font-size: 12px;
          color: $text-regular;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 16px;
          font-weight: bold;
          color: $primary-color;
        }
      }
    }

    .progress-section {
      margin-bottom: 16px;
    }

    .training-metrics {
      margin-bottom: 16px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 4px;

      .metrics-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .training-metric {
          display: flex;
          align-items: center;
          gap: 4px;

          .metric-name {
            font-size: 12px;
            color: $text-regular;
          }

          .metric-value {
            font-size: 12px;
            font-weight: bold;
            color: $primary-color;
          }
        }
      }
    }

    .logs-section {
      .logs-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 12px;
        color: $text-regular;
      }

      .logs-container {
        max-height: 150px;
        overflow-y: auto;
        border: 1px solid #e4e7ed;
        border-radius: 4px;
        padding: 8px;

        .log-item {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
          font-size: 11px;
          line-height: 1.3;

          .log-time {
            color: $text-regular;
            flex-shrink: 0;
          }

          .log-message {
            flex: 1;
          }

          &.info {
            .log-message { color: $text-primary; }
          }

          &.success {
            .log-message { color: $success-color; }
          }

          &.warning {
            .log-message { color: $warning-color; }
          }

          &.error {
            .log-message { color: $danger-color; }
          }
        }
      }
    }
  }
}
</style>