# Moltbot Gateway Android 部署架构设计

## 1. 概述

本文档描述了在 Android 设备上部署 openclaw Gateway 的架构设计。该方案使 Gateway 能够直接调用 Android 系统 API 和应用，实现 AI Agent 对 Android 设备的深度控制。

### 1.1 设计目标

- 在 Android 设备上运行完整的 openclaw Gateway
- Gateway 能够调用 Android 系统 API（联系人、应用、媒体等）
- openclaw 作为第三方库保持不修改
- 增量代码与 openclaw 代码分离

### 1.2 技术约束

| 约束 | 说明 |
|------|------|
| Node.js 版本 | openclaw Gateway 需要 Node.js >= 22.12.0 |
| Android 版本 | 最低 Android 7.0 (API 24) |
| 网络要求 | 需要本地网络通信能力 |

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Android 设备                             │
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │       Termux 环境        │    │    Bridge Service App      │ │
│  │                         │    │                             │ │
│  │  ┌───────────────────┐  │    │  ┌───────────────────────┐  │ │
│  │  │    Node.js 22+    │  │    │  │    BridgeServer       │  │ │
│  │  └───────────────────┘  │    │  │    HTTP :18800        │  │ │
│  │           │             │    │  └───────────────────────┘  │ │
│  │           ▼             │    │             │               │ │
│  │  ┌───────────────────┐  │    │             ▼               │ │
│  │  │  openclaw Gateway  │  │    │  ┌───────────────────────┐  │ │
│  │  │    WebSocket      │  │    │  │    Android APIs       │  │ │
│  │  │    :18789         │◄─┼────┼──│  - ContactsApi        │  │ │
│  │  └───────────────────┘  │    │  │  - AppsApi            │  │ │
│  │           │             │    │  │  - MediaApi           │  │ │
│  │           ▼             │    │  │  - SystemApi          │  │ │
│  │  ┌───────────────────┐  │    │  │  - CalendarApi        │  │ │
│  │  │  Gateway Extension│  │    │  │  - TtsApi / SttApi    │  │ │
│  │  │  (Bridge Client)  │──┼────┼──│  - IntentApi          │  │ │
│  │  └───────────────────┘  │    │  │  - AccessibilityApi   │  │ │
│  │                         │    │  └───────────────────────┘  │ │
│  └─────────────────────────┘    └─────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                    │
                    │ WebSocket :18789
                    ▼
          ┌─────────────────────┐
          │    外部客户端        │
          │  - Operator App     │
          │  - Web UI           │
          │  - AI Agent         │
          └─────────────────────┘
```

### 2.2 组件说明

#### 2.2.1 Termux 环境

Termux 是 Android 上的 Linux 终端模拟器，提供完整的 Linux 环境：

- **Node.js 运行时**：运行 Node.js 22+，满足 openclaw 版本要求
- **openclaw Gateway**：完整的 Gateway 服务端，处理 WebSocket 连接
- **Gateway Extension**：TypeScript 扩展模块，包含 Android Bridge Client

#### 2.2.2 Bridge Service App

独立的 Android 原生应用，提供 Android API 访问：

- **BridgeServer**：HTTP 服务器，监听 localhost:18800
- **API Modules**：封装各类 Android 系统 API
- **Permission Manager**：统一管理 Android 权限请求

#### 2.2.3 通信流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ AI Agent │───▶│ Gateway  │───▶│ Bridge   │───▶│ Android  │
│          │    │          │    │ Client   │    │ APIs     │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     │  WebSocket    │    HTTP       │   Native      │
     │  :18789       │  localhost    │   Android     │
     │               │   :18800      │   SDK         │
     ▼               ▼               ▼               ▼
  请求执行      路由到工具      调用 Bridge    执行系统 API
  android_      android_*       REST API      返回结果
  contacts_list
```

## 3. 模块设计

### 3.1 Bridge Service 模块

```
android/
├── app/src/main/java/com/openclaw/bridge/
│   ├── BridgeApplication.kt      # Application 入口
│   ├── MainActivity.kt           # 主界面，权限管理
│   │
│   ├── service/
│   │   ├── BridgeService.kt      # 前台服务，保持运行
│   │   ├── BridgeServer.kt       # HTTP 服务器实现
│   │   └── NotificationListener.kt
│   │
│   ├── api/                      # Android API 封装
│   │   ├── BaseApi.kt            # API 基类
│   │   ├── ContactsApi.kt        # 联系人
│   │   ├── AppsApi.kt            # 应用管理
│   │   ├── MediaApi.kt           # 媒体文件
│   │   ├── SystemApi.kt          # 系统信息
│   │   ├── CalendarApi.kt        # 日历
│   │   ├── ClipboardApi.kt       # 剪贴板
│   │   ├── TtsApi.kt             # 文本转语音
│   │   ├── SttApi.kt             # 语音识别
│   │   ├── IntentApi.kt          # Intent 发送
│   │   └── AccessibilityApi.kt   # 无障碍服务
│   │
│   ├── protocol/
│   │   ├── ApiResponse.kt        # 统一响应格式
│   │   └── BridgeCommands.kt     # 命令定义
│   │
│   └── util/
│       ├── PermissionManager.kt  # 权限管理
│       └── JsonHelper.kt         # JSON 工具
```

### 3.2 Gateway Extension 模块

```
gateway-extension/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                  # 扩展入口
    ├── android-bridge-client.ts  # HTTP 客户端
    ├── android-tools.ts          # 工具注册
    └── tools/                    # 具体工具
        ├── contacts.ts
        ├── apps.ts
        ├── media.ts
        ├── system.ts
        ├── calendar.ts
        └── tts.ts
```

### 3.3 类图

```
┌─────────────────────────────────────────────────────────────┐
│                    Gateway Extension                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐     │
│  │ AndroidBridge   │    │ AndroidToolsRegistry        │     │
│  │ Client          │    │                             │     │
│  ├─────────────────┤    ├─────────────────────────────┤     │
│  │ - baseUrl       │    │ + registerTools(gateway)    │     │
│  │ - timeout       │    │ - contactsTools             │     │
│  ├─────────────────┤    │ - appsTools                 │     │
│  │ + callApi()     │◄───│ - mediaTools                │     │
│  │ + getContacts() │    │ - systemTools               │     │
│  │ + launchApp()   │    │ - calendarTools             │     │
│  │ + getDeviceInfo │    │ - ttsTools                  │     │
│  └─────────────────┘    └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP localhost:18800
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Bridge Service App                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐     │
│  │ BridgeServer    │    │ BaseApi                     │     │
│  ├─────────────────┤    ├─────────────────────────────┤     │
│  │ - port: 18800   │    │ # context: Context          │     │
│  │ - apis: Map     │    │ + handleRequest()           │     │
│  ├─────────────────┤    └──────────┬──────────────────┘     │
│  │ + start()       │               │                        │
│  │ + stop()        │    ┌──────────┴──────────┐             │
│  │ + route()       │    │                     │             │
│  └─────────────────┘    ▼                     ▼             │
│                   ┌───────────┐         ┌───────────┐       │
│                   │ContactsApi│         │ AppsApi   │       │
│                   ├───────────┤         ├───────────┤       │
│                   │+list()    │         │+list()    │       │
│                   │+get()     │         │+launch()  │       │
│                   │+create()  │         │+info()    │       │
│                   └───────────┘         └───────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 4. 通信协议

### 4.1 Bridge HTTP API

Bridge Service 提供 RESTful HTTP API：

**基础 URL**: `http://localhost:18800/api/v1`

**请求头**:
```
Content-Type: application/json
X-Bridge-Token: <optional-auth-token>
```

**响应格式**:
```json
{
  "ok": true,
  "data": { ... },
  "meta": {
    "timestamp": 1706500000000,
    "duration_ms": 42
  }
}
```

**错误响应**:
```json
{
  "ok": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "需要 READ_CONTACTS 权限",
    "details": {}
  }
}
```

### 4.2 Gateway 工具调用

Gateway 通过标准工具接口调用 Android 功能：

```typescript
// 工具定义
{
  name: 'android_contacts_list',
  description: '获取 Android 设备上的联系人列表',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: '搜索关键词' },
      limit: { type: 'number', description: '返回数量限制' }
    }
  }
}

// AI Agent 调用
await gateway.invokeTool('android_contacts_list', { query: '张三', limit: 10 });
```

## 5. 安全设计

### 5.1 网络安全

| 层级 | 措施 |
|------|------|
| Bridge API | 仅监听 localhost，外部无法直接访问 |
| Gateway | 支持 TLS 加密，Token 认证 |
| 通信 | 所有敏感数据通过加密通道传输 |

### 5.2 权限控制

```
┌─────────────────────────────────────────────────────────┐
│                    权限控制流程                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│   │ Gateway  │────▶│ Bridge   │────▶│Permission│       │
│   │ Tool     │     │ API      │     │ Manager  │       │
│   └──────────┘     └──────────┘     └──────────┘       │
│        │                │                 │             │
│        │                │                 ▼             │
│        │                │          ┌──────────┐        │
│        │                │          │ 权限检查  │        │
│        │                │          └──────────┘        │
│        │                │                 │             │
│        │                │        ┌────────┴────────┐   │
│        │                │        ▼                 ▼   │
│        │                │   ┌─────────┐      ┌─────────┐│
│        │                │   │ 已授权   │      │ 未授权  ││
│        │                │   └─────────┘      └─────────┘│
│        │                │        │                 │    │
│        │                ▼        ▼                 ▼    │
│        │           执行 API    返回数据      返回错误   │
│        │                                               │
└─────────────────────────────────────────────────────────┘
```

### 5.3 数据安全

- 敏感数据（联系人、短信等）不持久化缓存
- 日志自动脱敏处理
- 支持配置 API 访问白名单

## 6. 部署架构

### 6.1 部署组件

| 组件 | 位置 | 说明 |
|------|------|------|
| Termux | Android 应用 | 从 F-Droid 安装 |
| Node.js | Termux 内 | pkg install nodejs-lts |
| openclaw | Termux 内 | npm install -g openclaw |
| Gateway Extension | Termux 内 | 加载扩展模块 |
| Bridge Service | Android 应用 | 独立 APK 安装 |

### 6.2 启动顺序

```
1. 启动 Bridge Service App
   └── 自动启动 BridgeService (前台服务)
       └── 启动 BridgeServer (HTTP :18800)

2. 在 Termux 中启动 Gateway
   └── openclaw gateway --port 18789
       └── 加载 Gateway Extension
           └── 初始化 AndroidBridgeClient
               └── 连接 http://localhost:18800

3. 外部客户端连接
   └── WebSocket ws://<device-ip>:18789
```

### 6.3 进程管理

```
┌─────────────────────────────────────────────────────────┐
│                    Android 系统                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐       ┌─────────────────────────┐  │
│  │ Termux App      │       │ Bridge Service App      │  │
│  │ (用户进程)       │       │ (前台服务)               │  │
│  │                 │       │                         │  │
│  │  ┌───────────┐  │       │  ┌───────────────────┐  │  │
│  │  │ bash      │  │       │  │ BridgeService     │  │  │
│  │  │  └─node   │  │       │  │ FOREGROUND_SERVICE│  │  │
│  │  │    └─gate │  │       │  │                   │  │  │
│  │  │      way  │  │       │  │ ┌───────────────┐ │  │  │
│  │  └───────────┘  │       │  │ │ HTTP Server   │ │  │  │
│  │                 │       │  │ │ :18800        │ │  │  │
│  └─────────────────┘       │  │ └───────────────┘ │  │  │
│                            │  └───────────────────┘  │  │
│                            └─────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 7. 扩展性设计

### 7.1 添加新的 Android API

1. 在 `android/app/.../api/` 创建新的 API 类
2. 在 `BridgeServer` 中注册路由
3. 在 `gateway-extension/src/tools/` 创建对应工具
4. 在 `android-tools.ts` 中注册工具

### 7.2 API 模块接口

```kotlin
// Android 端 API 基类
abstract class BaseApi(protected val context: Context) {
    abstract suspend fun handleRequest(
        method: String,
        path: String,
        params: Map<String, String>,
        body: JsonObject?
    ): ApiResponse
}

// 实现示例
class ContactsApi(context: Context) : BaseApi(context) {
    override suspend fun handleRequest(...): ApiResponse {
        return when (path) {
            "/contacts" -> listContacts(params)
            "/contacts/{id}" -> getContact(params["id"])
            else -> ApiResponse.notFound()
        }
    }
}
```

### 7.3 Gateway 工具接口

```typescript
// TypeScript 工具注册
interface AndroidTool {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

function registerTool(gateway: Gateway, tool: AndroidTool) {
  gateway.registerTool({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    handler: tool.handler,
  });
}
```

## 8. 性能考虑

### 8.1 延迟优化

| 优化点 | 措施 |
|--------|------|
| HTTP 连接 | 使用 HTTP Keep-Alive |
| JSON 解析 | 使用高效 JSON 库 (kotlinx.serialization) |
| 大数据传输 | 支持分页和流式传输 |

### 8.2 资源使用

| 资源 | 预期使用 |
|------|----------|
| 内存 | Bridge Service ~50MB, Gateway ~200MB |
| CPU | 空闲时 <1%, 活跃时 <10% |
| 电池 | 前台服务持续运行，建议连接电源 |

## 9. 故障处理

### 9.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Bridge 连接失败 | Service 未启动 | 检查 Bridge App 是否运行 |
| 权限拒绝 | 未授予权限 | 在 Bridge App 中授权 |
| Gateway 启动失败 | Node.js 版本不对 | 更新到 22+ |

### 9.2 健康检查

```bash
# 检查 Bridge Service
curl http://localhost:18800/api/v1/health

# 检查 Gateway
curl http://localhost:18789/health
```

## 10. 未来演进

### 10.1 短期计划

- 支持更多 Android API
- 添加 WebSocket 实时事件推送
- 优化权限请求 UX

### 10.2 长期计划

- 支持 nodejs-mobile 嵌入式部署
- 支持多设备集群管理
- 添加 Web 管理界面
