<template>
  <div class="threat-distribution-visualization">
    <div class="viz-header">
      <div class="viz-controls">
        <el-radio-group v-model="chartType" size="small" @change="updateChart">
          <el-radio-button label="pie">饼图</el-radio-button>
          <el-radio-button label="bar">柱状图</el-radio-button>
          <el-radio-button label="radar">雷达图</el-radio-button>
        </el-radio-group>
        <el-button size="small" @click="exportImage">导出图片</el-button>
      </div>
    </div>

    <div class="viz-container" ref="vizContainer">
      <div class="viz-placeholder" v-if="!hasData">
        <el-icon size="64" color="#ddd"><DataAnalysis /></el-icon>
        <p>暂无威胁分布数据</p>
      </div>
      <div ref="chartElement" class="chart-element" v-else>
        <!-- ECharts图表将在这里渲染 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { DataAnalysis } from '@element-plus/icons-vue'

interface Props {
  data?: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// 响应式数据
const vizContainer = ref()
const chartElement = ref()
const chartType = ref('pie')

// 计算属性
const hasData = computed(() => {
  return props.data?.detection_results
})

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    updateChart()
  }
}, { immediate: true, deep: true })

// 方法
const updateChart = () => {
  if (!chartElement.value || !hasData.value) return

  // 这里将使用ECharts渲染威胁分布图表
  console.log('更新威胁分布图表:', props.data)
}

const exportImage = () => {
  // 导出图表图片
  console.log('导出威胁分布图表')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.threat-distribution-visualization {
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

    .chart-element {
      width: 100%;
      height: 100%;
    }
  }
}
</style>