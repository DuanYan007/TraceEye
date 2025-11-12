<template>
  <div class="attack-chain-visualization">
    <div class="viz-header">
      <div class="viz-controls">
        <el-select v-model="selectedChain" size="small" @change="renderChain" style="width: 200px">
          <el-option
            v-for="chain in chains"
            :key="chain.chainId"
            :label="`攻击链 ${chain.chainId}`"
            :value="chain.chainId"
          />
        </el-select>
        <el-button size="small" @click="exportImage">导出图片</el-button>
      </div>
    </div>

    <div class="viz-container" ref="vizContainer">
      <div class="viz-placeholder" v-if="!hasData">
        <el-icon size="64" color="#ddd"><Share /></el-icon>
        <p>暂无攻击链数据</p>
      </div>
      <div ref="chainElement" class="chain-element" v-else>
        <!-- 攻击链时间线将在这里渲染 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Share } from '@element-plus/icons-vue'

interface Props {
  data?: any
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// 响应式数据
const vizContainer = ref()
const chainElement = ref()
const selectedChain = ref('')

// 计算属性
const hasData = computed(() => {
  return props.data?.attack_chains?.length > 0
})

const chains = computed(() => {
  return props.data?.attack_chains || []
})

// 监听数据变化
watch(() => props.data, (newData) => {
  if (newData && chains.value.length > 0) {
    selectedChain.value = chains.value[0].chainId
    renderChain()
  }
}, { immediate: true, deep: true })

// 方法
const renderChain = () => {
  if (!chainElement.value || !selectedChain.value) return

  const chain = chains.value.find(c => c.chainId === selectedChain.value)
  if (!chain) return

  // 这里将实现攻击链时间线可视化
  console.log('渲染攻击链:', chain)
}

const exportImage = () => {
  // 导出攻击链图片
  console.log('导出攻击链图片')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.attack-chain-visualization {
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

    .chain-element {
      width: 100%;
      height: 100%;
      padding: 20px;
    }
  }
}
</style>