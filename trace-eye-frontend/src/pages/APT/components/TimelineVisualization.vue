<template>
  <div class="timeline-visualization">
    <div class="viz-header">
      <div class="viz-controls">
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
          @change="updateTimeline"
        />
        <el-button size="small" @click="exportImage">导出图片</el-button>
      </div>
    </div>

    <div class="viz-container" ref="vizContainer">
      <div class="viz-placeholder" v-if="!hasData">
        <el-icon size="64" color="#ddd"><Clock /></el-icon>
        <p>暂无时序数据</p>
      </div>
      <div ref="timelineElement" class="timeline-element" v-else>
        <!-- 时序图将在这里渲染 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Clock } from '@element-plus/icons-vue'

interface Props {
  data?: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// 响应式数据
const vizContainer = ref()
const timelineElement = ref()
const timeRange = ref<[Date, Date] | null>(null)

// 计算属性
const hasData = computed(() => {
  return props.data?.latent_paths?.length > 0
})

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    updateTimeline()
  }
}, { immediate: true, deep: true })

// 方法
const updateTimeline = () => {
  if (!timelineElement.value || !hasData.value) return

  // 这里将实现时序可视化
  console.log('更新时序图:', props.data)
}

const exportImage = () => {
  // 导出时序图图片
  console.log('导出时序图图片')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.timeline-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;

  .viz-header {
    padding: 12px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;

    .viz-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .viz-container {
    flex: 1;
    position: relative;
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

    .timeline-element {
      width: 100%;
      height: 100%;
      padding: 20px;
    }
  }
}
</style>