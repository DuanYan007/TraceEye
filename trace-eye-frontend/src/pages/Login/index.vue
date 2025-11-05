<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <el-icon size="64" color="#069AFE"><Monitor /></el-icon>
        </div>
        <h1>APT攻击溯源与防御系统</h1>
        <p>TraceEye Security Platform</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="loginForm.remember">
            记住我
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="userStore.loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>© 2024 TraceEye Security Platform. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { LoginCredentials } from '@/types/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loginForm = reactive<LoginCredentials & { remember: boolean }>({
  username: 'admin',
  password: 'admin123',
  remember: false
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    await loginFormRef.value.validate()

    // 模拟登录，实际项目中调用API
    if (loginForm.username === 'admin' && loginForm.password === 'admin123') {
      // 模拟登录成功
      const mockResponse = {
        user: {
          id: '1',
          username: 'admin',
          email: 'admin@traceye.com',
          role: 'admin',
          permissions: ['dashboard', 'apt', 'alerts', 'logs', 'graph'],
          createdAt: new Date().toISOString()
        },
        token: 'mock-jwt-token',
        expiresIn: 86400
      }

      userStore.user = mockResponse.user
      userStore.token = mockResponse.token
      userStore.permissions = mockResponse.user.permissions

      localStorage.setItem('token', mockResponse.token)
      localStorage.setItem('user', JSON.stringify(mockResponse.user))

      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch (error) {
    console.error('Login error:', error)
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: $box-shadow-dark;
  width: 100%;
  max-width: 420px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    margin-bottom: 20px;
  }

  h1 {
    font-size: 24px;
    color: $text-primary;
    margin-bottom: 8px;
  }

  p {
    color: $text-secondary;
    font-size: 14px;
  }
}

.login-form {
  .el-form-item {
    margin-bottom: 24px;
  }

  .login-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
  }
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  color: $text-secondary;
  font-size: 12px;

  p {
    margin: 0;
  }
}
</style>