# Moltbot Android Gateway 部署方案

在 Android 设备上部署 moltbot Gateway，使 AI Agent 能够调用 Android 系统 API 和应用。

## 项目结构

```
MoltbotAndorid/
├── moltbot/                # moltbot 第三方库（不修改）
├── android/                # Bridge Service Android 应用
├── gateway-extension/      # Gateway TypeScript 扩展
├── docs/                   # 文档
└── scripts/                # 部署脚本
```

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    Android 设备                          │
│  ┌─────────────────────┐   ┌─────────────────────────┐  │
│  │     Termux          │   │   Bridge Service App   │  │
│  │  ┌───────────────┐  │   │  ┌───────────────────┐  │  │
│  │  │ Node.js 22+   │  │   │  │   HTTP Server     │  │  │
│  │  │ moltbot       │◄─┼───┼──│   localhost:18800 │  │  │
│  │  │ Gateway       │  │   │  │                   │  │  │
│  │  │ :18789        │  │   │  │   Android APIs    │  │  │
│  │  └───────────────┘  │   │  └───────────────────┘  │  │
│  └─────────────────────┘   └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
              │
              ▼
       外部客户端 (Operator/AI Agent)
```

## 快速开始

### 1. 安装 Bridge Service

```bash
# 构建 APK
./scripts/build-bridge-apk.sh

# 安装到设备
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 2. 配置 Termux

**方式 A：通过 Git 安装（推荐）**

在 Termux 中克隆仓库后直接运行脚本，无需手动复制 `gateway-extension`：

```bash
# 克隆项目（将 <你的仓库地址> 替换为实际 URL）
git clone https://github.com/<你的用户名>/MoltbotAndorid.git
cd MoltbotAndorid

# 配置环境并安装 Gateway（会使用仓库内的 gateway-extension）
./scripts/setup-termux.sh
./scripts/install-gateway.sh
```

**方式 B：本地或上传后安装**

若已在 Termux 中通过其他方式拿到项目（如 `adb push`、文件管理器复制到 `~/storage/downloads` 等），进入项目目录后同样执行：

```bash
cd /path/to/MoltbotAndorid   # 或 cd ~/storage/downloads/MoltbotAndorid
./scripts/setup-termux.sh
./scripts/install-gateway.sh
```

**在 Termux 中更新推送的代码**

远程仓库有新提交时，在 Termux 里拉取并（如有需要）重新安装扩展：

```bash
cd ~/MoltbotAndorid   # 或你克隆到的目录
git pull

# 若 gateway-extension 或脚本有改动，建议重新安装扩展
./scripts/install-gateway.sh
```

若只更新了文档或 Android 应用代码，拉取后无需再运行 `install-gateway.sh`；若改动了 `gateway-extension/` 或依赖，再执行一次 `install-gateway.sh` 即可。

### 3. 启动服务

1. 打开 Bridge Service 应用，授予权限，点击"启动服务"
2. 在 Termux 中运行：
   ```bash
   ./scripts/start-gateway.sh
   ```

### 4. 连接 Gateway

```
WebSocket: ws://<device-ip>:18789
```

## 支持的 Android API

| 模块 | 功能 |
|------|------|
| 系统 | 设备信息、电池状态、网络状态 |
| 联系人 | 列表、详情、创建 |
| 应用 | 列表、详情、启动 |
| 媒体 | 图片、音频、视频列表 |
| 日历 | 事件列表、创建事件 |
| 剪贴板 | 读取、设置 |
| TTS | 文本转语音 |
| Intent | 分享、拨号、打开 URL |

## 文档

- [架构设计](docs/architecture.md)
- [部署指南](docs/deployment-guide.md)
- [API 参考](docs/api-reference.md)
- [协议说明](docs/bridge-protocol.md)
- [Termux 配置](docs/termux-setup.md)

## 目录说明

### android/

Bridge Service Android 应用，提供 HTTP REST API 供 Gateway 调用。

### gateway-extension/

moltbot Gateway TypeScript 扩展，将 Android API 注册为 AI Agent 可用的工具。

### scripts/

- `setup-termux.sh` - Termux 环境配置
- `install-gateway.sh` - Gateway 安装
- `start-gateway.sh` - 启动 Gateway
- `build-bridge-apk.sh` - 构建 APK
- `deploy.sh` - 一键部署

## 权限要求

Bridge Service 需要以下 Android 权限：

- 联系人读写
- 通话记录读取
- 短信读取
- 日历读写
- 媒体文件访问
- 录音
- 位置

## 许可证

MIT License
