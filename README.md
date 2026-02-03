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
| **短信** | 收件箱/已发送列表（需 Bridge 授予读取短信权限） |
| 剪贴板 | 读取、设置 |
| TTS | 文本转语音 |
| Intent | 分享、拨号、打开 URL |

## 如何通过桥接让 clawdbot 读取手机通讯录（无需改 clawdbot 源码）

**不需要修改 clawdbot 的代码。** 流程是：本项目的 **Gateway 扩展**（gateway-extension）在 Gateway 启动时被加载，向 clawdbot 注册「通讯录」「短信」等工具；Operator 连上 Gateway 后就能看到并调用这些工具，扩展再通过 HTTP 访问手机上的 Bridge 应用拿到数据。

**数据流：**

```
你 / AI 对话 → clawdbot Operator → WebSocket → Gateway（clawdbot gateway）
                                                    ↓ 加载扩展
                                              gateway-extension
                                                    ↓ 注册工具
                                              android_contacts_list / android_contacts_get 等
                                                    ↓ HTTP
                                              Bridge Service（手机 App :18800）
                                                    ↓ Android API
                                              手机通讯录 / 短信 等
```

**你需要做的：**

1. **安装并配置好扩展**  
   运行 `./scripts/install-gateway.sh`（会同步 gateway-extension 到 `~/gateway-extension` 并构建）。  
   配置文件 **`~/.clawdbot/clawdbot.json`**（clawdbot 使用此路径）里需包含 **`plugins.load.paths`**，指向扩展入口，例如：
   ```json
   {
     "plugins": {
       "load": {
         "paths": ["~/gateway-extension/dist/android-bridge.js"]
       }
     },
     "gateway": { "port": 18789 }
   }
   ```
   首次安装时脚本会写入上述内容。Bridge 地址通过环境变量 `ANDROID_BRIDGE_HOST`（默认 127.0.0.1）、`ANDROID_BRIDGE_PORT`（默认 18800）配置；若你之前已创建过配置且含有不支持的 `gateway.extensions` 或 `android` 键，可运行 `clawdbot doctor --fix` 移除，或改为上述结构。

2. **手机端**  
   - 打开 **Bridge Service** 应用并启动服务，授予**通讯录**（及短信等）权限。  
   - 在 Termux 执行 `./scripts/start-gateway.sh` 启动 Gateway（会加载上述扩展）。

3. **连接 Operator**  
   从运行 clawdbot Operator 的客户端连接到手机的 Gateway：`ws://<手机 IP>:18789`。连接成功后，Operator 会看到扩展注册的工具（如 `android_contacts_list`、`android_contacts_get`），即可在对话中「查通讯录」「读取联系人」等。

4. **若读不到通讯录**  
   - 确认 Bridge 应用已授予通讯录权限。  
   - 确认 `~/.clawdbot/clawdbot.json` 中有 `plugins.load.paths` 且包含 `~/gateway-extension/dist/android-bridge.js`（该文件存在）。  
   - 确认 Gateway 启动日志中有类似 `[Android Bridge] Extension activated`，表示扩展已加载。

5. **飞书 / 对话 bot 回复「无法访问通讯录」**  
   若飞书或其它对接的 bot 说「我无法直接访问你手机的通讯录」「运行在 Termux 沙箱、没有通讯录权限」等，多半是 **bot 不知道已通过桥接具备工具**，按“我没有权限”来回答了。  
   - **确认**：Operator 已连接到本机 Gateway（`ws://<手机 IP>:18789`），且 Gateway 已加载扩展（日志有 `[Android Bridge] Extension activated`）。  
   - **给 bot 加一段说明**，让它在用户问通讯录、联系人时去**调用工具**而不是直接拒绝。可在飞书/Operator 的「系统提示词」或「角色说明」里加入类似内容：  
     ```text
     你已通过 Gateway 连接用户手机，具备以下能力（请优先使用工具，不要回答“无法访问”）：
     - 读取通讯录：使用 android_contacts_list（可选参数 query、limit、offset）、android_contacts_get（参数 id）获取联系人。
     - 读取短信：使用 android_sms_list（可选 type=inbox/sent/all、limit、address）。
     - 其它：设备信息、电池、应用列表、日历、剪贴板、TTS 等见已注册的 android_* 工具。
     当用户询问“通讯录”“联系人”“短信”时，请直接调用对应工具并基于返回结果回答。
     ```  
   这样 bot 会知道「可以通过工具访问通讯录」，不再误报“无法访问”。

6. **已加上述提示词仍报错（Gateway service install / 无法重启 / android 工具未注册）**  
   提示词**没有错**，报错来自**环境**：Gateway 未正确跑在手机上，或 Operator 未连上带扩展的 Gateway。  
   - **手机端**：Bridge Service 已启动；在 Termux 执行 **`./scripts/start-gateway.sh`** 且**不要关**，日志里应有 **`[Android Bridge] Extension activated`**；若没有，检查 `~/.clawdbot/clawdbot.json` 的 **`plugins.load.paths`** 是否包含 `~/gateway-extension/dist/android-bridge.js`，且 `~/gateway-extension/dist/` 已存在（没有则先运行 `./scripts/install-gateway.sh`）。  
   - **连接**：Operator/飞书 的 Gateway 地址为 **`ws://<手机 IP>:18789`**，手机与运行 Operator 的机器网络互通。  
   - **不要**在 Operator 里点「重启 Gateway」——在 Android 上不支持远程重启，需在手机 Termux 里手动重新运行 `./scripts/start-gateway.sh`。  
   满足以上后，再发「查通讯录」等，bot 会按提示词调用 `android_contacts_list` 等工具并正常返回。

## 如何通过 clawdbot 访问手机短信

1. **确保 Gateway 已启动**  
   手机 Termux 里已运行 `./scripts/start-gateway.sh`，且 Bridge Service 应用已启动并授予**读取短信**权限。

2. **连接 Gateway**  
   从你的 Operator / AI Agent 或支持 clawdbot Gateway 的客户端，连接到手机上的 Gateway：
   - WebSocket：`ws://<手机 IP>:18789`  
   - 手机 IP 可在手机「设置 → WLAN → 当前网络」查看，或 Termux 里执行 `ifconfig` / `ip addr`。

3. **调用短信工具**  
   连接后，clawdbot 会使用 Gateway 注册的 **`android_sms_list`** 工具访问短信。你可以：
   - 在对话里直接说「读取短信」「查一下收件箱」「最近和 10086 的短信」等，由 AI 调用该工具；
   - 或在你自己的 Agent 代码里显式调用工具 `android_sms_list`，参数可选：
     - `type`：`inbox`（收件箱）/ `sent`（已发送）/ `all`（全部），默认收件箱；
     - `limit`：返回条数，默认 50；
     - `address`：按号码筛选，只返回与该号码的往来短信。

4. **权限**  
   Bridge 应用需在系统设置中开启「读取短信」权限；若未授权，调用会返回权限错误。

5. **更新扩展**  
   若你之前安装的 gateway-extension 没有短信工具，在项目目录执行 `./scripts/install-gateway.sh` 会同步并重新构建扩展，之后重启 `./scripts/start-gateway.sh` 即可使用 `android_sms_list`。

## 文档

- [架构设计](docs/architecture.md)
- [部署指南](docs/deployment-guide.md)
- [API 参考](docs/api-reference.md)
- [协议说明](docs/bridge-protocol.md)
- [Termux 配置](docs/termux-setup.md)
- [相册/DCIM 访问权限](docs/storage-dcim-access.md)（读图 EACCES 时参考）
- [Android Bridge 模型提示词](docs/android-bridge-prompt.md)（给飞书/Operator 的系统提示词）
- [手机上如何使用这些 Skill](docs/skills-usage-on-phone.md)（在手机端使用每日播报、快捷操作等场景）
- [Skill 加载说明](docs/skills-loading.md)（Cursor Skills 与 Clawdbot 插件场景如何加载）

## 目录说明

### android/

Bridge Service Android 应用，提供 HTTP REST API 供 Gateway 调用。

### gateway-extension/

moltbot Gateway TypeScript 扩展，将 Android API 注册为 AI Agent 可用的工具。

**包含 50+ 工具和 7 个内置场景：**

| 场景 | 触发词示例 | 说明 |
|------|-----------|------|
| 每日播报 | "早安"、"今天有什么事" | 汇总日程、短信、来电、电池状态 |
| 快捷操作 | "微信扫一扫"、"手电筒" | 一句话完成常用操作 |
| 联系人分析 | "谁联系最多" | 分析通讯频率、重要联系人 |
| 自动化工作流 | "睡觉模式"、"会议模式" | 组合多个操作完成复杂任务 |
| 相册助手 | "看看相册"、"帮我拍照" | 浏览、拍摄、分析图片 |
| 位置导航 | "我在哪"、"导航到" | 位置查询、地址转换、导航 |
| 安全隐私 | "检查手机安全" | 应用权限、存储、系统检查 |

**场景工具：**
- `android_scenario_list` - 列出所有可用场景
- `android_scenario_guide` - 获取场景详细操作指南
- `android_system_prompt` - 获取系统提示词模板

### scripts/

- `setup-termux.sh` - Termux 环境配置
- `install-gateway.sh` - Gateway 安装
- `start-gateway.sh` - 启动 Gateway
- `build-bridge-apk.sh` - 构建 APK
- `deploy.sh` - 一键部署

## 已知限制与故障排除

### 「看起来手机还没有连接到 Gateway」/ 飞书提示需先配对手机

当飞书或其它 Operator 提示 **「看起来手机还没有连接到 Gateway」** 或 **「需要先配对手机，确保安装了 Clawdbot 或相关应用」** 时，表示 **Operator 没有成功连上你手机上的 Gateway**，或未发现可用工具。

**按下面顺序检查：**

1. **手机端（Termux）**  
   - **Bridge Service** 应用已打开并点击「启动服务」。  
   - 在 Termux 中执行过 `./scripts/start-gateway.sh`，且**没有退出**（Gateway 在前台运行）。  
   - 若刚启动，看日志里是否有 `[Android Bridge] Extension activated`。

2. **手机 IP 与端口**  
   - Gateway 监听端口为 **18789**。  
   - 在手机「设置 → WLAN → 当前网络」查看 IP，或 Termux 执行 `ifconfig` / `ip addr` 查看。  
   - 运行 Operator 的机器（或服务器）必须能访问 **`ws://<手机 IP>:18789`**（例如手机和该机器在同一 WiFi，或已做端口转发）。

3. **Operator 连接配置**  
   - 将 Operator（clawdbot/飞书集成等）的 Gateway 地址配置为 **`ws://<手机 IP>:18789`**（把 `<手机 IP>` 换成上一步得到的 IP）。  
   - 若 Operator 在公网服务器上，手机在家庭 WiFi 内，需在路由器做端口转发或使用内网穿透，使服务器能连到手机的 18789 端口。

4. **「在手机上安装 Clawdbot 或相关应用」的含义**  
   - 手机**不需要**单独安装名为「Clawdbot」的 App。  
   - 需要的是：**Bridge Service 应用**（本项目 android 目录构建的 APK）+ 在 **Termux** 里运行 **`./scripts/start-gateway.sh`**（即运行 clawdbot gateway）。  
   - 配对/连接是指：Operator 成功连上 `ws://<手机 IP>:18789` 并看到扩展注册的 `android_*` 工具。

5. **提示「在手机终端运行: clawdbot node run」时**  
   - 本方案**不用**在手机执行 `clawdbot node run`。  
   - 请在手机 **Termux** 里执行：**`./scripts/start-gateway.sh`**（会启动 Gateway，监听 18789）。  
   - 若提示「或者在电脑运行: clawdbot devices pair」，可按 clawdbot 官方流程在电脑上配对；配对完成后确保 Operator 连接的 Gateway 地址为 **`ws://<手机 IP>:18789`**（手机与电脑需网络互通）。

**关于 `[tools] exec failed: unknown command 'tool'`**  
   - 该错误一般来自其它环境（如 shell 或其它 CLI），与 Gateway 扩展无关。若只在飞书/Operator 日志里出现，可忽略或检查 Operator 侧是否有误触发的 `tool` 命令。

### Android 上「Gateway service install not supported on android」

在 Termux（Android）上，Clawdbot 会报 **Gateway service install not supported on android**，表示其「安装为系统服务」能力不支持 Android。

**正确做法：**

- **只通过本项目的脚本启动 Gateway**，不要用 `clawdbot gateway install`、`clawdbot onboard --install-daemon` 等「安装服务」类命令：
  ```bash
  ./scripts/start-gateway.sh
  ```
  该脚本会以前台方式运行 `clawdbot gateway --port 18789`，不依赖系统服务，在 Android 上可用。

**若出现「gateway already running (pid …); lock timeout」或「Port 18789 is already in use」：**

- 说明端口已被占用或存在陈旧锁文件。**直接再次运行** `./scripts/start-gateway.sh` 即可：脚本会自动结束占用端口的进程、清除 `~/.clawdbot` 下的 gateway 锁/pid 文件后重新启动。
- 若仍失败，可手动结束进程（将 PID 换成实际值）：`kill -9 <PID>`，再运行 `./scripts/start-gateway.sh`。

**若日志出现 `[tools] exec failed: Gateway service install not supported on android`：**

- 表示某处（如飞书/Operator）在尝试在手机上执行「安装 Gateway 服务」类命令，而 clawdbot 在 Android 上不支持该操作。
- **不要在手机 Termux 里执行** `clawdbot gateway install`、`clawdbot node run` 等会触发「安装服务」的命令；**只运行** `./scripts/start-gateway.sh` 启动 Gateway 即可。

**若提示「在 Termux 上无法重启 Gateway 服务」或 `Gateway restart is disabled. Set commands.restart=true`：**

- 表示从飞书/Operator 侧**远程重启** Gateway 在 Android 上不可用或未开启（`commands.restart` 未设为 true）。
- **在手机上手动重启即可**：在 Termux 里先结束占用端口的进程（若有，例如 `kill <pid>`），再执行 **`./scripts/start-gateway.sh`**。无需在 Operator 里点「重启」。
- 提示里的「确认 Clawdbot App 正在运行」在本方案中对应：**Bridge Service 应用已启动** + **Termux 里已运行** `./scripts/start-gateway.sh`（无单独「Clawdbot App」）。

### clawdbot 报错 Invalid config / Unrecognized key: `extensions`、`android`

若启动时提示 **`Invalid config at .../clawdbot.json`** 且列出 **Unrecognized key: "extensions"**（在 `gateway` 下）或 **Unrecognized key: "android"**（根级），说明当前 clawdbot 版本不再支持旧配置键。

**处理方式：**

1. **自动修复**：在 Termux 执行 **`clawdbot doctor --fix`**，会移除不认识的键（如 `gateway.extensions`、`android`）。
2. **手动改为新结构**：扩展改为通过 **`plugins.load.paths`** 配置，Bridge 地址通过环境变量配置（见上文「用最小配置覆盖」示例）。保存后重新运行 `./scripts/start-gateway.sh`。

### clawdbot 报错 plugin manifest not found: .../gateway-extension/dist/clawdbot.plugin.json

若启动时提示 **`Invalid config ... plugin manifest not found: .../gateway-extension/dist/clawdbot.plugin.json`**，说明当前 clawdbot 版本要求每个插件提供清单文件 **`clawdbot.plugin.json`**，而你的 `~/gateway-extension/dist/` 下还没有该文件。

**处理方式：**

1. **重新安装/构建扩展**（推荐）：在项目目录执行 **`./scripts/install-gateway.sh`**，会同步最新的 gateway-extension（含 `clawdbot.plugin.json`）到 `~/gateway-extension` 并执行 `npm run build`，构建会把清单复制到 `dist/`。
2. **仅本地已更新代码时**：在 `gateway-extension` 目录执行 **`npm run build`**（会生成 `dist/clawdbot.plugin.json`），再把整个 `gateway-extension` 拷到手机 `~/gateway-extension` 后重启 Gateway。

若曾出现 **「plugin id mismatch (manifest uses android-bridge, entry hints index)」**，请将配置中的扩展路径改为 **`~/gateway-extension/dist/android-bridge.js`**（与 manifest 的 id 一致），并重新运行 `./scripts/install-gateway.sh` 或本地 `npm run build` 后同步到手机。

### Gateway 启动后立即退出（无报错、退出码 0）/ plugins.load.paths 需用绝对路径

若运行 `./scripts/start-gateway.sh` 或 `node ... run-main.js gateway --port 18789` 后**没有任何输出、进程立即退出且退出码为 0**，多半是 **`plugins.load.paths` 配置有问题**：

1. **不要放目录**：`paths` 里只能是**插件入口文件**（如 `.../gateway-extension/dist/android-bridge.js`），不能是用户主目录等目录路径（如 `/data/.../home`），否则会导致加载异常并静默退出。
2. **用绝对路径、不要用 ~**：在 JSON 里 **`~` 通常不会被解析为 $HOME**，clawdbot 会按字面路径查找，导致找不到插件。在 Termux 上请写成绝对路径，例如：
   ```json
   "paths": ["/data/data/com.termux/files/home/gateway-extension/dist/android-bridge.js"]
   ```
   （把 `.../home` 换成你实际的 $HOME，在 Termux 里执行 `echo $HOME` 可查看。）

修改后保存，再运行 `./scripts/start-gateway.sh`。

若 Gateway **仍无任何输出、退出码 0 即退出**，请确认使用 **`gateway run`** 在前台运行（不要只写 `gateway`）。clawdbot 文档要求用 `gateway run` 或 `gateway` 的前台别名；脚本已改为执行 **`gateway run --port 18789 --verbose`**。  
若仍静默退出，多半是 CLI 的「路由优先」把 `gateway` 转到了 service/install 逻辑（在 Android 上会静默退出）。在 Termux 上启动前设置 **`CLAWDBOT_DISABLE_ROUTE_FIRST=1`** 可禁用该路由，让主程序处理 `gateway run`。脚本在 Android 下已自动设置该变量；手动启动可试：`CLAWDBOT_DISABLE_ROUTE_FIRST=1 node .../run-main.js gateway run --port 18789 --verbose`。

### clawdbot 报错 `JSON5: invalid character` / Failed to read config

若启动时出现 **`Failed to read config at .../clawdbot.json SyntaxError: JSON5: invalid character '\"' at 98:5`**（行号/列号可能不同），说明 **`~/.clawdbot/clawdbot.json` 有语法错误**，多为多写/少写引号、逗号或某行有非法字符。

**处理方式：**

1. **打开** `~/.clawdbot/clawdbot.json`，根据报错里的**行号、列号**（如 98:5）找到对应位置，检查：
   - 是否多了一个 `"` 或少了一个 `"`；
   - 字符串里的 `"` 是否误写成 `\"` 或未转义；
   - 是否有多余逗号（如 `},}`）或缺少逗号。
2. **用最小配置覆盖**（先备份原文件）：若文件较复杂，可先备份后改为下面内容，再按需加其它项：
   ```json
   {
     "plugins": {
       "load": {
         "paths": ["~/gateway-extension/dist/android-bridge.js"]
       }
     },
     "gateway": { "port": 18789 }
   }
   ```
   Bridge 地址用环境变量 `ANDROID_BRIDGE_HOST`、`ANDROID_BRIDGE_PORT` 配置。保存后重新运行 `./scripts/start-gateway.sh`。

### 「当前节点已连接，但 android 工具还没有注册」/ nodes failed: system.run

当飞书或 Operator 提示 **「当前节点已连接，但 android 工具(android_contacts_list、android_sms_list 等)还没有注册」** 或 **`[tools] nodes failed: system.run requires a companion app or node host`** 时，表示**当前连上的节点/网关没有加载本项目的 Gateway 扩展**，所以看不到 `android_*` 工具。

**可能原因与处理：**

1. **配对的是「node」而不是带扩展的 Gateway**  
   若通过「设备配对」连上的是 clawdbot 的 **node**（例如手机执行了 `clawdbot node run`），该 node 可能不运行我们的扩展；**android 工具是在「Gateway」上注册的**，需要 Operator 连到**运行了 `./scripts/start-gateway.sh` 的那台 Gateway**（监听 18789）。  
   - 在手机 Termux 里**只运行** `./scripts/start-gateway.sh`（不要用 `clawdbot node run`）。  
   - 在 Operator/飞书侧把 **Gateway 连接地址** 配置为 **`ws://<手机 IP>:18789`**，确保连的是这台 Gateway，而不是别的 node。

2. **Gateway 未加载扩展**  
   - 确认 `~/.clawdbot/clawdbot.json` 中有 **`plugins.load.paths`**，且包含 `~/gateway-extension/dist/android-bridge.js`（或实际扩展路径）。  
   - **若 `gateway-extension` 目录下没有 `dist` 目录**：扩展尚未构建，Gateway 无法加载。在 `gateway-extension` 目录执行 `npm install && npm run build` 生成 `dist/`；在手机上则执行 `./scripts/install-gateway.sh`（会同步并构建扩展）。  
   - 启动 Gateway 后，终端日志里应有 **`[Android Bridge] Extension activated`**；若无，说明扩展未加载，检查配置与 `~/gateway-extension/dist/android-bridge.js` 是否存在。

3. **工具正在后台注册**  
   若刚连上或刚启动 Gateway，可等待几秒再试；若仍无 `android_*` 工具，按上面 1、2 检查连接对象与扩展配置。

### 日志里出现 `[tools] read failed: ENOENT ... MEMORY.md` / `memory/2025-xx-xx.md`

说明 clawdbot/小虾 的「读记忆」工具在访问 **`~/clawd/`** 下的文件时，文件或目录不存在。路径一般是 Termux 的 `$HOME/clawd`（即 `/data/data/com.termux/files/home/clawd/`）。

**处理方式（在 Termux 里执行）：**

1. **创建目录和占位文件，避免 ENOENT：**
   ```bash
   mkdir -p ~/clawd/memory
   touch ~/clawd/MEMORY.md
   # 若需要按日期记忆，可创建对应日期文件，例如：
   touch ~/clawd/memory/2025-01-16.md
   touch ~/clawd/memory/2025-01-17.md
   ```
2. **（可选）** 在 `~/clawd/MEMORY.md` 里写几行说明或留给 AI 自己写；`memory/` 下可按 `YYYY-MM-DD.md` 放当日记忆。  
3. 若你希望记忆目录在别处，需在 **clawdbot/Operator 的配置**里修改「数据目录」为实际路径（本项目不包含该配置，请在 clawdbot 文档或飞书集成侧查找）。

创建上述文件后，再触发一次需要读记忆的对话，红色 ENOENT 会消失；飞书收发不受影响，只是之前读不到记忆内容。

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

**若 npx 报错 "could not determine executable to run"**  
在 Termux 上常见。脚本已增加：当检测到全局已安装 moltbot 时，用 `node <全局包路径>/dist/cli.js` 直接启动，不依赖 npx。请先 `git pull` 更新脚本后再运行 `./scripts/start-gateway.sh`。

### 手机 Termux 上「Cannot find module '/bin/npm'」错误

在安装插件（如飞书插件 `@m1heng-clawd/feishu`）时，如果遇到以下错误：

```
Error: Cannot find module '/bin/npm'
```

这通常是因为 npm 的 shebang 行指向了错误的路径（`/bin/npm` 在 Android 上不存在）。

**快速修复：**

1. **先运行诊断脚本（了解问题）：**
   ```bash
   ./scripts/diagnose-npm.sh
   ```
   这会显示 npm 的详细信息和可能的问题。

2. **运行 shebang 修复脚本（推荐，最快）：**
   ```bash
   ./scripts/fix-npm-shebang.sh
   ```
   脚本会直接修复 npm 的 shebang 行，使用绝对路径避免路径解析问题。

2. **运行完整修复脚本：**
   ```bash
   ./scripts/fix-npm.sh
   ```
   脚本会自动检测并修复 npm 安装问题。

3. **手动修复：**
   ```bash
   # 重新安装 Node.js（包含 npm）
   pkg reinstall nodejs-lts
   
   # 验证修复
   npm --version
   which npm
   ```

4. **如果问题仍然存在：**
   ```bash
   # 完全重新安装
   pkg remove nodejs-lts
   pkg install nodejs-lts
   
   # 重新配置 npm
   mkdir -p ~/.npm-global
   npm config set prefix ~/.npm-global
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

**原因说明：**  
在 Termux 环境中，npm 应该安装在 `/data/data/com.termux/files/usr/bin/npm`，但某些情况下 npm 脚本的 shebang 可能错误地指向 `/bin/npm`。重新安装 Node.js 可以修复这个问题。

**如果修复脚本仍然失败：**  
错误 "Cannot find module '/bin/npm'" 可能表明 openclaw 在内部尝试 require('/bin/npm')，而不是执行 npm 脚本。这种情况下：

1. **尝试完整修复脚本：**
   ```bash
   ./scripts/fix-npm-complete.sh
   ```

2. **使用手动安装脚本（推荐，绕过 openclaw）：**
   ```bash
   ./scripts/install-plugin-manual.sh @m1heng-clawd/feishu
   ```
   这个脚本会：
   - 使用 node 直接执行 npm-cli.js（绕过 npm 脚本问题）
   - 下载插件包
   - 解压并复制到插件目录
   - 安装依赖
   
   或者手动安装：
   ```bash
   # 下载并手动安装
   cd /tmp
   node /data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js pack @m1heng-clawd/feishu
   tar -xzf m1heng-clawd-feishu-*.tgz
   mkdir -p ~/.clawdbot/plugins
   cp -r package/* ~/.clawdbot/plugins/feishu/
   cd ~/.clawdbot/plugins/feishu
   node /data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js install
   ```

3. **查看详细文档：** [修复 openclaw npm 错误](docs/fix-openclaw-npm-error.md)

### openclaw libsignal 依赖错误

如果遇到 `Cannot find package 'libsignal/index.js'` 错误：

**原因：**  
openclaw 依赖 `libsignal`（Baileys/WhatsApp 的原生模块），使用 `--ignore-scripts` 安装时未正确构建。

**解决方案：**

1. **使用修复脚本：**
   ```bash
   ./scripts/fix-openclaw-libsignal.sh
   ```

2. **在 PC 上运行 openclaw（推荐）：**  
   根据官方文档，Android 应该作为客户端连接 Gateway，而不是在 Android 上运行 openclaw。
   - **PC/Mac/Linux**: 运行完整的 openclaw
   - **Android**: 只运行 Gateway（moltbot/clawdbot）+ Bridge Service
   - 通过 WebSocket 连接两者

3. **查看详细文档：** [修复 openclaw libsignal 错误](docs/openclaw-libsignal-error.md)

### 手机 Termux 上「File has unexpected size」镜像源错误

在安装包时，如果遇到以下错误：

```
File has unexpected size (522321 != 523280). Mirror sync in progress?
E: Failed to fetch ... File has unexpected size
```

这通常是因为 Termux 镜像源正在同步中，或当前镜像源不可用。

**快速修复：**

1. **使用修复脚本（推荐）：**
   ```bash
   ./scripts/fix-termux-repo.sh
   ```
   脚本会引导你更换可用的镜像源。

2. **使用交互式工具：**
   ```bash
   termux-change-repo
   ```
   然后选择 "Mirrors hosted in China" 或其他可用镜像。

3. **手动更换镜像源：**
   ```bash
   # 编辑镜像源配置
   nano $PREFIX/etc/apt/sources.list
   
   # 或使用清华大学镜像（中国用户推荐）
   cat > $PREFIX/etc/apt/sources.list << 'EOF'
   deb [arch=all,arm,aarch64,x86_64] https://mirrors.tuna.tsinghua.edu.cn/termux stable main
   EOF
   
   # 更新包列表
   pkg update
   ```

4. **等待后重试：**
   如果镜像正在同步，等待几分钟后重试：
   ```bash
   pkg update
   pkg install nodejs-lts
   ```

**常见可用镜像源：**
- 官方源：`https://termux.org/packages`
- 清华大学：`https://mirrors.tuna.tsinghua.edu.cn/termux`（中国用户推荐）
- 其他镜像：运行 `termux-change-repo` 查看完整列表

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

## 手机端 Skill（仅手机上使用）

本项目提供一系列场景能力（每日播报、快捷操作、联系人分析等），**仅在手机上使用**：在连接该手机 Gateway 的客户端（Operator/飞书等）里用自然语言对话即可，**不需要在 Cursor 中加载或使用**。

### 可用场景与触发词

| 场景 | 触发词示例 |
|------|------------|
| 每日播报 | "早安"、"今天有什么事" |
| 快捷操作 | "微信扫一扫"、"打开手电筒"、"设闹钟" |
| 联系人分析 | "谁联系最多"、"失联提醒" |
| 自动化工作流 | "睡觉模式"、"会议模式" |
| 相册助手 | "看看相册"、"帮我拍照" |
| 位置导航 | "我在哪"、"导航到xxx" |
| 安全隐私 | "检查手机安全" |

### 使用方式

1. **手机端**：运行 Bridge 应用 + 在 Termux 里执行 `./scripts/start-gateway.sh`（场景已内置在插件中，随 Gateway 加载）。
2. **客户端**：Operator/飞书等连接 `ws://<手机 IP>:18789`，在对话里直接说「早安」「打开微信扫一扫」等即可。

详见 [手机上如何使用这些 Skill](docs/skills-usage-on-phone.md)、[Skill 加载说明](docs/skills-loading.md)。

## 许可证

MIT License
