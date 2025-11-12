<template>
  <div class="provenance-graph-visualization">
    <div class="viz-header">
      <div class="viz-controls">
        <el-button-group size="small">
          <el-button @click="zoomIn">放大</el-button>
          <el-button @click="zoomOut">缩小</el-button>
          <el-button @click="resetZoom">重置</el-button>
        </el-button-group>
        <el-select v-model="layoutType" size="small" @change="changeLayout" style="width: 120px">
          <el-option label="力导向" value="force" />
          <el-option label="层次" value="hierarchical" />
          <el-option label="环形" value="circular" />
          <el-option label="网格" value="grid" />
        </el-select>
        <el-button size="small" @click="exportImage">导出图片</el-button>
      </div>
      <div class="viz-stats">
        <span class="stat-item">节点: {{ nodeCount }}</span>
        <span class="stat-item">边: {{ edgeCount }}</span>
      </div>
    </div>

    <div class="viz-container" ref="vizContainer">
      <div class="viz-placeholder" v-if="!hasData">
        <el-icon size="64" color="#ddd"><Share /></el-icon>
        <p>暂无图数据</p>
      </div>
      <div ref="graphElement" class="graph-element" v-else>
        <!-- D3.js 图将在这里渲染 -->
      </div>
    </div>

    <!-- 图例 -->
    <div class="viz-legend" v-if="hasData">
      <div class="legend-title">节点类型</div>
      <div class="legend-items">
        <div
          v-for="type in nodeTypes"
          :key="type.value"
          class="legend-item"
        >
          <div class="legend-color" :style="{ backgroundColor: type.color }"></div>
          <span class="legend-label">{{ type.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Share } from '@element-plus/icons-vue'
import * as d3 from 'd3'

interface Props {
  data?: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// 响应式数据
const vizContainer = ref()
const graphElement = ref()
const layoutType = ref('force')

// D3相关变量
let svg: any = null
let simulation: any = null
let zoom: any = null

// 图数据
const nodes = ref<any[]>([])
const links = ref<any[]>([])

// 计算属性
const hasData = computed(() => {
  return props.data?.nodes?.length > 0 && props.data?.edges?.length > 0
})

const nodeCount = computed(() => nodes.value.length)
const edgeCount = computed(() => links.value.length)

const nodeTypes = computed(() => [
  { value: 'process', label: '进程', color: '#409eff' },
  { value: 'file', label: '文件', color: '#67c23a' },
  { value: 'netflow', label: '网络流', color: '#e6a23c' },
  { value: 'memory', label: '内存', color: '#f56c6c' },
  { value: 'user', label: '用户', color: '#909399' }
])

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData) {
    updateGraphData(newData)
  }
}, { immediate: true, deep: true })

// 方法
const updateGraphData = (data: any) => {
  nodes.value = data.nodes || []
  links.value = data.edges || []

  nextTick(() => {
    if (hasData.value) {
      renderGraph()
    }
  })
}

const renderGraph = () => {
  if (!graphElement.value) return

  // 清除现有图形
  d3.select(graphElement.value).selectAll('*').remove()

  const container = vizContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 创建SVG
  svg = d3.select(graphElement.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // 创建缩放行为
  zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on('zoom', (event) => {
      svg.select('g').attr('transform', event.transform)
    })

  svg.call(zoom)

  const g = svg.append('g')

  // 创建力导向布局
  simulation = d3.forceSimulation(nodes.value)
    .force('link', d3.forceLink(links.value).id((d: any) => d.id).distance(50))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(30))

  // 创建边
  const link = g.append('g')
    .selectAll('line')
    .data(links.value)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', (d: any) => Math.sqrt(d.value || 1))

  // 创建节点组
  const node = g.append('g')
    .selectAll('g')
    .data(nodes.value)
    .enter()
    .append('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
    )

  // 添加节点圆圈
  node.append('circle')
    .attr('r', 15)
    .attr('fill', (d: any) => getNodeColor(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // 添加节点标签
  node.append('text')
    .text((d: any) => getNodeLabel(d))
    .attr('text-anchor', 'middle')
    .attr('dy', -20)
    .style('font-size', '10px')
    .style('fill', '#333')

  // 添加提示框
  node.append('title')
    .text((d: any) => `${d.id}\n类型: ${d.type}\n${getNodeDetails(d)}`)

  // 更新位置
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

const changeLayout = () => {
  if (!simulation || !hasData.value) return

  const container = vizContainer.value
  const width = container.clientWidth
  const height = container.clientHeight

  switch (layoutType.value) {
    case 'force':
      simulation
        .force('link', d3.forceLink(links.value).id((d: any) => d.id).distance(50))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
      break

    case 'hierarchical':
      // 简化的层次布局
      const levels = d3.group(nodes.value, (d: any) => d.level || 0)
      const levelHeight = height / (levels.size + 1)
      let levelIndex = 0

      levels.forEach((nodesInLevel) => {
        const levelWidth = width / (nodesInLevel.length + 1)
        nodesInLevel.forEach((node, index) => {
          node.fx = levelWidth * (index + 1)
          node.fy = levelHeight * (levelIndex + 1)
        })
        levelIndex++
      })
      simulation.alpha(0.3).restart()
      break

    case 'circular':
      const radius = Math.min(width, height) / 3
      nodes.value.forEach((node: any, index) => {
        const angle = (index / nodes.value.length) * 2 * Math.PI
        node.fx = width / 2 + radius * Math.cos(angle)
        node.fy = height / 2 + radius * Math.sin(angle)
      })
      simulation.alpha(0.3).restart()
      break

    case 'grid':
      const cols = Math.ceil(Math.sqrt(nodes.value.length))
      const cellWidth = width / (cols + 1)
      const cellHeight = height / (Math.ceil(nodes.value.length / cols) + 1)

      nodes.value.forEach((node: any, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        node.fx = cellWidth * (col + 1)
        node.fy = cellHeight * (row + 1)
      })
      simulation.alpha(0.3).restart()
      break
  }
}

const getNodeColor = (type: string): string => {
  const typeConfig = nodeTypes.value.find(t => t.value === type)
  return typeConfig?.color || '#999'
}

const getNodeLabel = (node: any): string => {
  if (node.attributes?.name) {
    return node.attributes.name.length > 10
      ? node.attributes.name.substring(0, 10) + '...'
      : node.attributes.name
  }
  return node.id?.split('_').pop() || node.id || 'Unknown'
}

const getNodeDetails = (node: any): string => {
  const details = []
  if (node.attributes?.pid) details.push(`PID: ${node.attributes.pid}`)
  if (node.attributes?.command_line) {
    const cmd = node.attributes.command_line
    details.push(`命令: ${cmd.length > 30 ? cmd.substring(0, 30) + '...' : cmd}`)
  }
  if (node.attributes?.path) details.push(`路径: ${node.attributes.path}`)
  if (node.attributes?.ip) details.push(`IP: ${node.attributes.ip}`)
  return details.join('\n')
}

// 拖拽事件处理
const dragstarted = (event: any, d: any) => {
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

const dragged = (event: any, d: any) => {
  d.fx = event.x
  d.fy = event.y
}

const dragended = (event: any, d: any) => {
  if (!event.active) simulation.alphaTarget(0)
  if (!d.fixed) {
    d.fx = null
    d.fy = null
  }
}

// 控制方法
const zoomIn = () => {
  if (svg) {
    svg.transition().duration(300).call(
      zoom.scaleBy, 1.3
    )
  }
}

const zoomOut = () => {
  if (svg) {
    svg.transition().duration(300).call(
      zoom.scaleBy, 0.7
    )
  }
}

const resetZoom = () => {
  if (svg) {
    svg.transition().duration(300).call(
      zoom.transform,
      d3.zoomIdentity
    )
  }
}

const exportImage = () => {
  if (!svg) return

  const svgData = new XMLSerializer().serializeToString(svg.node())
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  canvas.width = svg.node().getBoundingClientRect().width
  canvas.height = svg.node().getBoundingClientRect().height

  img.onload = () => {
    ctx?.drawImage(img, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `provenance-graph-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    })
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
}

// 生命周期
onMounted(() => {
  if (hasData.value) {
    nextTick(() => {
      renderGraph()
    })
  }
})

onUnmounted(() => {
  if (simulation) {
    simulation.stop()
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.provenance-graph-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;

  .viz-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e4e7ed;
    background: #f8f9fa;

    .viz-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .viz-stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: $text-regular;

      .stat-item {
        font-weight: bold;
      }
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

    .graph-element {
      width: 100%;
      height: 100%;

      :deep(circle) {
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          stroke-width: 3px;
          filter: brightness(1.1);
        }
      }

      :deep(text) {
        pointer-events: none;
        user-select: none;
      }

      :deep(line) {
        pointer-events: none;
      }
    }
  }

  .viz-legend {
    padding: 12px;
    border-top: 1px solid #e4e7ed;
    background: #f8f9fa;

    .legend-title {
      font-size: 12px;
      font-weight: bold;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .legend-items {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid #fff;
          box-shadow: 0 0 0 1px #ddd;
        }

        .legend-label {
          font-size: 11px;
          color: $text-regular;
        }
      }
    }
  }
}
</style>