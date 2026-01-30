# Bridge 通信协议说明

本文档详细说明 Gateway Extension 与 Bridge Service 之间的通信协议。

## 1. 协议概述

### 1.1 通信模型

```
┌─────────────────┐         HTTP/1.1          ┌─────────────────┐
│    Gateway      │ ◄─────────────────────────► │   Bridge        │
│    Extension    │      localhost:18800       │   Service       │
│                 │                            │                 │
│  (TypeScript)   │         JSON               │  (Kotlin)       │
└─────────────────┘                            └─────────────────┘
```

### 1.2 协议特点

| 特性 | 说明 |
|------|------|
| 传输协议 | HTTP/1.1 |
| 数据格式 | JSON (UTF-8) |
| 连接模式 | 短连接 / Keep-Alive |
| 认证方式 | Token (可选) |
| 仅本地 | 仅监听 127.0.0.1 |

## 2. HTTP API 规范

### 2.1 请求格式

**请求头**:
```
Content-Type: application/json
Accept: application/json
X-Bridge-Token: <token>        # 可选
X-Request-Id: <uuid>           # 可选，用于追踪
```

**请求体** (POST/PUT/PATCH):
```json
{
  "field1": "value1",
  "field2": 123
}
```

### 2.2 响应格式

所有响应使用统一的 JSON 结构：

**成功响应**:
```json
{
  "ok": true,
  "data": {
    // 具体数据
  },
  "meta": {
    "timestamp": 1706500000000,
    "duration_ms": 42,
    "request_id": "uuid"
  }
}
```

**错误响应**:
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误描述",
    "details": {
      // 额外错误信息
    }
  },
  "meta": {
    "timestamp": 1706500000000,
    "request_id": "uuid"
  }
}
```

### 2.3 HTTP 状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 参数无效 |
| 401 | Unauthorized | 未认证 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 500 | Internal Error | 服务器内部错误 |
| 503 | Unavailable | 服务不可用 |

## 3. 错误码定义

### 3.1 通用错误码

| 错误码 | HTTP | 描述 |
|--------|------|------|
| `INVALID_REQUEST` | 400 | 请求格式无效 |
| `INVALID_PARAMS` | 400 | 参数验证失败 |
| `UNAUTHORIZED` | 401 | 需要认证 |
| `PERMISSION_DENIED` | 403 | 缺少 Android 权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `METHOD_NOT_ALLOWED` | 405 | HTTP 方法不支持 |
| `INTERNAL_ERROR` | 500 | 内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂时不可用 |

### 3.2 业务错误码

| 错误码 | 描述 |
|--------|------|
| `CONTACT_NOT_FOUND` | 联系人不存在 |
| `APP_NOT_FOUND` | 应用不存在 |
| `APP_LAUNCH_FAILED` | 应用启动失败 |
| `TTS_NOT_AVAILABLE` | TTS 服务不可用 |
| `STT_RECOGNITION_FAILED` | 语音识别失败 |
| `CALENDAR_SYNC_FAILED` | 日历同步失败 |

### 3.3 权限错误详情

当返回 `PERMISSION_DENIED` 时，`details` 包含：

```json
{
  "code": "PERMISSION_DENIED",
  "message": "需要 READ_CONTACTS 权限",
  "details": {
    "permission": "android.permission.READ_CONTACTS",
    "granted": false,
    "canRequest": true
  }
}
```

## 4. 数据类型定义

### 4.1 基础类型

| 类型 | 格式 | 示例 |
|------|------|------|
| string | UTF-8 字符串 | `"hello"` |
| number | 64位数字 | `123`, `1.5` |
| boolean | 布尔值 | `true`, `false` |
| null | 空值 | `null` |
| timestamp | Unix 毫秒时间戳 | `1706500000000` |
| uri | Android Content URI | `"content://..."` |

### 4.2 联系人对象

```typescript
interface Contact {
  id: string;
  displayName: string;
  phoneNumbers: PhoneNumber[];
  emails: Email[];
  addresses?: Address[];
  organization?: Organization;
  birthday?: string;  // ISO 8601 日期
  note?: string;
  photoUri?: string;
}

interface PhoneNumber {
  number: string;
  type: 'mobile' | 'home' | 'work' | 'other';
  label?: string;
}

interface Email {
  address: string;
  type: 'home' | 'work' | 'other';
  label?: string;
}
```

### 4.3 应用对象

```typescript
interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  isSystemApp: boolean;
  targetSdkVersion: number;
  minSdkVersion: number;
  permissions: string[];
  installedAt: number;   // timestamp
  updatedAt: number;     // timestamp
}
```

### 4.4 日历事件对象

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startTime: number;     // timestamp
  endTime: number;       // timestamp
  allDay: boolean;
  timezone: string;
  calendarId: string;
  calendarName: string;
  attendees?: Attendee[];
  reminders?: Reminder[];
}

interface Attendee {
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'invited';
}

interface Reminder {
  minutes: number;
  method: 'alert' | 'email' | 'sms';
}
```

## 5. 分页规范

### 5.1 请求参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| limit | number | 100 | 每页数量，最大 1000 |
| offset | number | 0 | 偏移量 |

### 5.2 响应格式

```json
{
  "ok": true,
  "data": {
    "items": [...],
    "total": 500,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

### 5.3 使用示例

```
# 第一页
GET /api/v1/contacts?limit=50&offset=0

# 第二页
GET /api/v1/contacts?limit=50&offset=50

# 第三页
GET /api/v1/contacts?limit=50&offset=100
```

## 6. 实时事件 (WebSocket)

### 6.1 连接

```
ws://localhost:18801/events
```

### 6.2 消息格式

**服务器推送事件**:
```json
{
  "type": "event",
  "event": "notification.received",
  "payload": {
    "packageName": "com.example.app",
    "title": "新消息",
    "text": "您收到一条新消息"
  },
  "timestamp": 1706500000000
}
```

**客户端订阅**:
```json
{
  "type": "subscribe",
  "events": ["notification.received", "battery.changed"]
}
```

### 6.3 事件类型

| 事件 | 描述 | 权限 |
|------|------|------|
| `notification.received` | 收到新通知 | NotificationListener |
| `notification.removed` | 通知被移除 | NotificationListener |
| `battery.changed` | 电池状态变化 | - |
| `network.changed` | 网络状态变化 | ACCESS_NETWORK_STATE |
| `call.incoming` | 来电 | READ_PHONE_STATE |
| `sms.received` | 收到短信 | RECEIVE_SMS |

## 7. 安全规范

### 7.1 本地限制

Bridge Service 仅接受来自 `127.0.0.1` 的连接：

```kotlin
// BridgeServer.kt
server.bind(InetAddress.getByName("127.0.0.1"), 18800)
```

### 7.2 Token 认证 (可选)

启用 Token 认证时：

```kotlin
// 配置文件
{
  "security": {
    "enabled": true,
    "token": "your-secret-token"
  }
}

// 请求头
X-Bridge-Token: your-secret-token
```

### 7.3 请求限制

| 限制 | 值 |
|------|------|
| 最大请求体 | 10MB |
| 请求超时 | 30秒 |
| 并发连接 | 100 |

## 8. 客户端实现指南

### 8.1 TypeScript 客户端

```typescript
class AndroidBridgeClient {
  private baseUrl = 'http://127.0.0.1:18800';
  private token?: string;

  async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['X-Bridge-Token'] = this.token;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();
    
    if (!result.ok) {
      throw new BridgeError(result.error);
    }
    
    return result.data;
  }

  // 联系人
  async getContacts(params?: { q?: string; limit?: number }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request('GET', `/api/v1/contacts?${query}`);
  }

  // 应用
  async launchApp(packageName: string) {
    return this.request('POST', '/api/v1/apps/launch', {
      package: packageName,
    });
  }
}
```

### 8.2 错误处理

```typescript
class BridgeError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(error: { code: string; message: string; details?: unknown }) {
    super(error.message);
    this.code = error.code;
    this.details = error.details as Record<string, unknown>;
  }
}

// 使用
try {
  await bridge.getContacts();
} catch (error) {
  if (error instanceof BridgeError) {
    if (error.code === 'PERMISSION_DENIED') {
      console.log('需要授予联系人权限');
    }
  }
}
```

### 8.3 连接检查

```typescript
async function checkBridgeConnection(): Promise<boolean> {
  try {
    const response = await fetch('http://127.0.0.1:18800/api/v1/health');
    const result = await response.json();
    return result.ok && result.data.status === 'running';
  } catch {
    return false;
  }
}

// 等待 Bridge 就绪
async function waitForBridge(maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    if (await checkBridgeConnection()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Bridge Service 未响应');
}
```

## 9. 版本兼容

### 9.1 API 版本

当前版本: `v1`

API 路径包含版本号: `/api/v1/...`

### 9.2 版本协商

通过 `Accept` 头指定版本：

```
Accept: application/json; version=1
```

### 9.3 弃用策略

- 旧版本至少保留 2 个主版本周期
- 弃用 API 返回 `Deprecation` 头
- 新版本在 `Link` 头提供迁移链接

```
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: </api/v2/contacts>; rel="successor-version"
```
