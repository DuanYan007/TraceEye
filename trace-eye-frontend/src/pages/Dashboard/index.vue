<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">1,247</div>
            <div class="stat-label">APT组织总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">89</div>
            <div class="stat-label">今日告警</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">23</div>
            <div class="stat-label">高危威胁</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">系统可用性</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-2">
      <el-col :span="12">
        <el-card header="威胁趋势">
          <div class="chart-placeholder">
            <el-empty description="图表开发中..." />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="最近活动">
          <div class="activity-list">
            <div v-for="i in 5" :key="i" class="activity-item">
              <el-tag size="small" type="danger">高危</el-tag>
              <span class="activity-text">检测到APT28攻击活动</span>
              <span class="activity-time">2小时前</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
// Dashboard逻辑将在第二阶段实现
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.dashboard {
  .stat-card {
    .stat-item {
      text-align: center;

      .stat-number {
        font-size: 32px;
        font-weight: bold;
        color: $primary-color;
        margin-bottom: 8px;
      }

      .stat-label {
        color: $text-secondary;
        font-size: 14px;
      }
    }
  }

  .chart-placeholder {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .activity-list {
    .activity-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid $border-color;

      &:last-child {
        border-bottom: none;
      }

      .activity-text {
        flex: 1;
        margin: 0 12px;
        color: $text-regular;
      }

      .activity-time {
        color: $text-secondary;
        font-size: 12px;
      }
    }
  }
}
</style>