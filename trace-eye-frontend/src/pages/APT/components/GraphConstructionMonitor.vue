<template>
  <div class="graph-construction-monitor">
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
          <div class="metric-label">节点数</div>
          <div class="metric-value">{{ status.nodes || 0 }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">边数</div>
          <div class="metric-value">{{ status.edges || 0 }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">耗时</div>
          <div class="metric-value">{{ elapsedTime }}</div>
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
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

const startTime = ref(Date.now())
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

const elapsedTime = computed(() => {
  const elapsed = Date.now() - startTime.value
  const seconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${seconds}s`
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

  addLog('info', `开始监控任务 ${props.jobId}`)

  pollInterval.value = setInterval(async () => {
    try {
      const response = await slotApi.getGraphStatus(props.jobId)

      if (response.data.progress !== props.status?.progress) {
        addLog('info', `构建进度: ${response.data.progress}%`)
      }

      if (response.data.status === 'completed') {
        addLog('success', '图构建完成')
        stopMonitoring()
      } else if (response.data.status === 'failed') {
        addLog('error', '图构建失败')
        stopMonitoring()
      }
    } catch (error) {
      addLog('error', '获取状态失败')
      console.error(error)
    }
  }, 2000)
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

.graph-construction-monitor {
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