<template>
  <div class="default-layout">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <el-icon size="28" color="#069AFE"><Monitor /></el-icon>
        <span v-if="!sidebarCollapsed">TraceEye</span>
      </div>

      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        :collapse="sidebarCollapsed"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-menu-item index="/apt">
          <el-icon><Monitor /></el-icon>
          <template #title>APT监测</template>
        </el-menu-item>

        <el-menu-item index="/alerts">
          <el-icon><Bell /></el-icon>
          <template #title>报警管理</template>
        </el-menu-item>

        <el-menu-item index="/logs">
          <el-icon><Document /></el-icon>
          <template #title>日志管理</template>
        </el-menu-item>

        <el-menu-item index="/graph">
          <el-icon><Share /></el-icon>
          <template #title>攻击关系图</template>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航 -->
      <div class="header">
        <div class="header-left">
          <el-button
            type="text"
            @click="toggleSidebar"
            class="sidebar-toggle"
          >
            <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>

          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.meta.title">
              {{ $route.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 消息通知 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
            <el-button type="text" @click="showNotifications">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>

          <!-- 用户菜单 -->
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userAvatar" />
              <span class="username">{{ userStore.user?.username || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAlertStore } from '@/stores/alert'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const alertStore = useAlertStore()

const sidebarCollapsed = ref(false)
const userAvatar = ref('')

const unreadCount = computed(() => alertStore.unreadCount)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const showNotifications = () => {
  // TODO: 实现消息通知弹窗
  console.log('Show notifications')
}

const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        userStore.logout()
        router.push('/login')
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.default-layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: $sidebar-width;
  background-color: #304156;
  transition: width 0.3s ease;

  &.collapsed {
    width: $sidebar-collapsed-width;
  }

  .logo {
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid #434a50;

    span {
      margin-left: 12px;
    }
  }

  .sidebar-menu {
    border: none;
    background-color: #304156;

    :deep(.el-menu-item) {
      color: #bfcbd9;

      &:hover {
        background-color: #263445 !important;
        color: #fff !important;
      }

      &.is-active {
        background-color: $primary-color !important;
        color: #fff !important;
      }
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.header {
  height: $header-height;
  background-color: #fff;
  border-bottom: 1px solid $border-color;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .sidebar-toggle {
      font-size: 18px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;

    .notification-badge {
      margin-right: 10px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .username {
        font-size: 14px;
        color: $text-primary;
      }
    }
  }
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: $background-color;
}
</style>