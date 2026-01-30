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

## 已知限制与故障排除

### Android/Termux 上「从源码安装」失败

在 Termux（Android）上选择 **「从源码安装」** 时，moltbot 的依赖 `@matrix-org/matrix-sdk-crypto-nodejs` 会在 postinstall 中报错 **Unsupported OS: android**，该原生模块不支持 Android。

**建议做法：**

1. **优先使用「从 npm 安装」**  
   运行 `./scripts/install-gateway.sh` 时选择 **1) 从 npm 安装**。若安装后 `./scripts/start-gateway.sh` 仍提示「moltbot 未安装」，多半是 PATH 未包含 npm 全局 bin，可尝试：
   - 执行 `source ~/.bashrc` 后再运行 `./scripts/start-gateway.sh`，或
   - 将脚本更新到最新（`git pull`），脚本会尝试从 `~/.npm-global/bin` 等路径查找 moltbot。

2. **在 PC 上运行 Gateway，Android 只跑 Bridge**  
   在 Linux/macOS/Windows 上从源码或 npm 安装并启动 moltbot Gateway，Android 设备只安装并运行 Bridge Service；在 PC 上把 Gateway 的桥接地址配置为 Android 设备的 IP（需保证网络互通）。

### 使用官方 moltbot，不要使用 moltbot-cn

本项目仅使用 **官方 npm 包 `moltbot`** 作为 Gateway，不使用 `moltbot-cn`。若全局 bin 里只有 `moltbot-cn` 没有 `moltbot`，需要单独安装官方包：

```bash
npm install -g moltbot@latest --ignore-scripts
export PATH="$(npm config get prefix)/bin:$PATH"
```

之后用 `moltbot` 命令（不是 `moltbot-cn`）或 `./scripts/start-gateway.sh` 启动 Gateway。

### 手机 Termux 上「moltbot: command not found」

用 `npm install -g moltbot` 安装成功后，在终端直接输入 `moltbot` 仍提示 **command not found**，多半是 npm 全局 bin 目录不在 PATH 里，或当前环境的 npm 前缀不是 `~/.npm-global`。

**第一步：确认安装位置**

在项目目录执行：

```bash
npm config get prefix
ls "$(npm config get prefix)/bin"
```

- 若输出里有 `moltbot`，记下第一行的路径（即 npm 前缀），下面用「做法二」把该路径的 `bin` 加入 PATH。  
- 若没有 `moltbot`，说明全局安装未生成可执行文件（部分环境或 npm 包行为导致），可改用：  
  `npx moltbot onboard --install-daemon` 和 `npx moltbot gateway --port 18789`（或直接使用 `./scripts/start-gateway.sh`，脚本会尝试多种方式查找 moltbot）。

**做法一：当前会话临时生效（用实际前缀）**

```bash
export PATH="$(npm config get prefix)/bin:$PATH"
moltbot onboard --install-daemon   # 注意是 daemon 不是 deamon
```

**做法二：长期生效（推荐）**

把 **当前环境** npm 前缀的 bin 加入 PATH（避免写死 `~/.npm-global`）：

```bash
NPM_BIN="$(npm config get prefix)/bin"
echo "export PATH=\"$NPM_BIN:\$PATH\"" >> ~/.bashrc
source ~/.bashrc
```

之后新开终端或执行 `source ~/.bashrc` 后即可直接使用 `moltbot`。

**启动 Gateway**  
配置好 PATH 后可直接运行 `moltbot gateway --port 18789`；或使用 `./scripts/start-gateway.sh`（脚本会从 npm 前缀、npx 等自动查找 moltbot）。

**若 PATH 已包含 npm 的 bin 仍提示 command not found**  
部分环境下 `npm install -g moltbot` 不会在 prefix/bin 里创建 `moltbot` 可执行文件。可改用 **npx** 或 **node + 全局包路径**：
- 安装/配置：`npx moltbot onboard --install-daemon`
- 启动 Gateway：`npx moltbot gateway --port 18789`  
或直接运行 `./scripts/start-gateway.sh`，脚本会依次尝试：PATH → prefix/bin → ~/moltbot 源码 → **node 运行全局包内 dist/cli.js**（Termux 上 npx 常报 “could not determine executable” 时用此方式）→ npx。

**若 npx 报错 “could not determine executable to run”**  
在 Termux 上常见。脚本已增加：当检测到全局已安装 moltbot 时，用 `node <全局包路径>/dist/cli.js` 直接启动，不依赖 npx。请先 `git pull` 更新脚本后再运行 `./scripts/start-gateway.sh`。

### 其他

- 若 `git pull` 或 `git clone` 无法访问 GitHub，可配置代理或使用能访问 GitHub 的网络后再试。

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
