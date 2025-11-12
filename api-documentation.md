# TraceEye 后端接口文档

## 接口概述

### 基础配置
- **Base URL**: `/api/v1`
- **认证方式**: Bearer Token
- **超时设置**: 10秒
- **内容类型**: application/json

### 请求头
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {token}"
}
```

### 响应格式
```typescript
interface ApiResponse<T = any> {
  code: number        // 状态码，200表示成功
  data: T           // 响应数据
  message: string   // 响应消息
  total?: number    // 分页总数（仅分页接口）
}
```

### 错误处理
| 状态码 | 说明 |
|--------|------|
| 401 | 登录已过期，请重新登录 |
| 403 | 没有权限访问该资源 |
| 404 | 请求的资源不存在 |
| 500 | 服务器内部错误 |

---

## 1. 认证模块 (Auth)

### 1.1 用户登录
- **接口**: `POST /auth/login`
- **描述**: 用户登录获取访问令牌

**请求参数**:
```typescript
interface LoginCredentials {
  username: string  // 用户名
  password: string  // 密码
}
```

**响应数据**:
```typescript
interface LoginResponse {
  user: {
    id: string
    username: string
    email: string
    role: string
    permissions: string[]
    createdAt: string
  }
  token: string       // JWT访问令牌
  expiresIn: number   // 令牌过期时间
}
```

**前端调用示例**:
```typescript
authApi.login({
  username: "admin",
  password: "password123"
})
```

### 1.2 用户登出
- **接口**: `POST /auth/logout`
- **描述**: 用户登出，使令牌失效

**请求参数**: 无

**响应数据**: `void`

**前端调用示例**:
```typescript
authApi.logout()
```

### 1.3 获取用户信息
- **接口**: `GET /auth/profile`
- **描述**: 获取当前登录用户的详细信息

**请求参数**: 无

**响应数据**:
```typescript
interface User {
  id: string
  username: string
  email: string
  role: string
  permissions: string[]
  createdAt: string
}
```

**前端调用示例**:
```typescript
authApi.getProfile()
```

---

## 2. APT组织模块 (APT)

### 2.1 获取APT组织列表
- **接口**: `GET /apt/organizations`
- **描述**: 获取APT组织列表，支持筛选和分页

**请求参数**:
```typescript
interface APTSearchFilters {
  name?: string        // 组织名称筛选
  country?: string     // 国家筛选
  threatLevel?: string // 威胁等级筛选: low|medium|high|critical
  page?: number        // 页码，默认1
  pageSize?: number    // 每页数量，默认10
}
```

**响应数据**:
```typescript
interface PaginationResponse<APTOrganization> {
  data: APTOrganization[]
  total: number
  page: number
  pageSize: number
}

interface APTOrganization {
  id: string
  name: string
  aliases: string[]
  country: string
  description: string
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  lastSeen: string
  attackPatterns: string[]
  malwares: string[]
  indicators: ThreatIndicator[]
}

interface ThreatIndicator {
  id: string
  type: 'ip' | 'domain' | 'hash' | 'url'
  value: string
  confidence: number
  description: string
}
```

**前端调用示例**:
```typescript
aptApi.getOrganizations({
  country: "China",
  threatLevel: "high",
  page: 1,
  pageSize: 20
})
```

### 2.2 获取单个APT组织详情
- **接口**: `GET /apt/organizations/{id}`
- **描述**: 根据ID获取指定APT组织的详细信息

**请求参数**:
- `id` (path): APT组织ID

**响应数据**: `APTOrganization` 对象

**前端调用示例**:
```typescript
aptApi.getOrganizationById("apt-001")
```

### 2.3 搜索APT组织
- **接口**: `GET /apt/organizations/search`
- **描述**: 根据关键词搜索APT组织

**请求参数**:
- `keyword` (query): 搜索关键词

**响应数据**: `APTOrganization[]` 数组

**前端调用示例**:
```typescript
aptApi.searchOrganizations("Lazarus")
```

---

## 3. 安全告警模块 (Alerts)

### 3.1 获取告警列表
- **接口**: `GET /alerts`
- **描述**: 获取安全告警列表，支持筛选和分页

**请求参数**: 任意筛选参数（具体参数根据后端实现确定）

**响应数据**:
```typescript
interface PaginationResponse<SecurityAlert> {
  data: SecurityAlert[]
  total: number
  page: number
  pageSize: number
}

interface SecurityAlert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  status: 'new' | 'investigating' | 'resolved'
  aptOrganization?: string
  createdAt: string
  updatedAt: string
}
```

**前端调用示例**:
```typescript
alertApi.getAlerts({
  severity: "critical",
  status: "new"
})
```

### 3.2 获取告警统计信息
- **接口**: `GET /alerts/statistics`
- **描述**: 获取告警统计信息

**请求参数**: 无

**响应数据**:
```typescript
interface AlertStatistics {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  new: number
  investigating: number
  resolved: number
}
```

**前端调用示例**:
```typescript
alertApi.getStatistics()
```

### 3.3 更新告警状态
- **接口**: `PUT /alerts/{id}`
- **描述**: 更新指定告警的状态

**请求参数**:
- `id` (path): 告警ID
- `status` (body): 新的状态值

**响应数据**: `void`

**前端调用示例**:
```typescript
alertApi.updateAlertStatus("alert-001", "investigating")
```

---

## 前端状态管理

### 用户状态管理 (useUserStore)
- **登录流程**: 调用`authApi.login()`，存储token和用户信息到localStorage
- **权限验证**: 基于`permissions`数组进行权限控制
- **自动登出**: 401错误时自动清除本地存储并跳转登录页

### APT组织状态管理 (useAPTStore)
- **数据缓存**: 缓存APT组织列表，避免重复请求
- **筛选功能**: 支持名称、国家、威胁等级等多维度筛选
- **威胁等级**: 提供高威胁组织快速筛选功能

### 告警状态管理 (useAlertStore)
- **实时统计**: 统计各等级告警数量和未读数量
- **状态更新**: 支持标记告警为已读/处理中状态
- **数据同步**: 告警状态变更后自动更新本地数据

---

## 开发注意事项

1. **认证拦截**: 所有请求自动添加Bearer Token认证头
2. **错误处理**: 统一的错误处理机制，支持不同状态码的友好提示
3. **数据缓存**: 用户信息和APT组织数据在本地进行缓存
4. **状态同步**: 重要操作后及时更新本地状态，保持数据一致性
5. **权限控制**: 基于用户权限数组进行前端路由和功能权限控制