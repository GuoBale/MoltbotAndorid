# OpenClaw (clawdbot/Moltbot) 平台部署功能对比

本文档从**多个维度**对比在 **Mac OS**、**Linux**、**Android (Termux)** 上部署 OpenClaw（clawdbot/Moltbot）的差异，便于按场景选择部署方式。依据项目文档与脚本充分调研整理。

---

## 1. 环境与依赖

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **运行环境** | 原生 macOS | 原生 Linux | Termux（需从 F-Droid 安装，不可用 Google Play 版） |
| **Node.js 要求** | ≥ 22.12.0 | ≥ 22.12.0 | ≥ 22.x（Termux 内 `pkg install nodejs-lts`） |
| **安装方式** | `npm install -g moltbot` 或从源码 `pnpm install && pnpm build && pnpm link --global` | 同 Mac OS | 必须 `npm install -g moltbot@latest --ignore-scripts` 或脚本选「从 npm 安装」；**从源码安装会失败** |
| **是否必须 --ignore-scripts** | 否 | 否 | **是**（否则 postinstall 报 `Unsupported OS: android`） |
| **额外组件** | 无；若用 Android Bridge 需另有一台手机装 Bridge App | 同 Mac OS | Termux App + **Bridge Service APK**（本机必装） |
| **包管理器** | npm / pnpm 均可 | 同 Mac OS | 推荐 npm；pnpm 可用于其他目录，安装 moltbot 时脚本多用 npm |
| **PATH / 全局 bin** | 一般无需特别配置 | 同 Mac OS | 常需把 `~/.npm-global/bin` 或 `$(npm config get prefix)/bin` 加入 PATH；否则 `moltbot` 需用 `node .../moltbot.mjs` 或 `npx moltbot` |

---

## 2. 硬件与系统约束

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **文档给出的最低/推荐配置** | 无单独说明（按通用桌面） | 无单独说明 | Android 7.0 (API 24) 起；推荐 12.0+ (API 31)；RAM 最低 4GB、推荐 8GB+；存储最低 2GB、推荐 5GB+；CPU ARM64 |
| **架构** | x64 / ARM64（Apple Silicon） | x64 / ARM64 等 | ARM64（Termux 常见） |
| **Termux 来源** | 不涉及 | 不涉及 | **必须从 F-Droid 安装**，Play Store 版已过时且不可用 |

---

## 3. 安装限制与失败原因

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **从源码安装** | ✅ 支持 | ✅ 支持 | ❌ **会失败**（依赖 `@matrix-org/matrix-sdk-crypto-nodejs` 等 postinstall 检测到 Android 即报错） |
| **从 npm 直接安装（无参数）** | ✅ 可用 | ✅ 可用 | ❌ **会失败**（同上） |
| **从 npm 安装且加 --ignore-scripts** | 不需要 | 不需要 | ✅ **推荐**，可成功安装；代价见「功能可用性」 |
| **依赖补丁（pnpm.patchedDependencies）** | 正常应用 | 正常应用 | ⚠️ 跳过 postinstall 后**不应用**，部分依赖行为可能不一致 |
| **CLI 可执行位（chmod +x）** | postinstall 会设置 | 同左 | ⚠️ 可能未设置，需手动 `chmod +x` 或用 `node .../moltbot.mjs` / 脚本启动 |

---

## 4. 网络与端口

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **Gateway 端口** | 默认 18789（可配置） | 同左 | 同左；环境变量 `GATEWAY_PORT` |
| **Bridge HTTP 端口** | 仅当连接手机时：默认 18800 | 同左 | 本机 Bridge 默认 18800；环境变量 `ANDROID_BRIDGE_PORT` |
| **Bridge 连接地址** | 使用 Android Bridge 时：`ANDROID_BRIDGE_HOST=<手机IP>`，同网段 | 同左 | 本机：默认 `127.0.0.1`（`ANDROID_BRIDGE_HOST`） |
| **客户端连接方式** | 连本机：`ws://<本机IP>:18789`；混合部署时连 PC | 同左 | 连手机：`ws://<手机IP>:18789` |
| **网络要求** | 本机/局域网可达即可 | 同左 | 本地 localhost；远程需设备 IP 可达（同一 WiFi/内网穿透等） |
| **其他端口（文档提及）** | 18793 Gateway Canvas（可选）；18801 Bridge WebSocket（可选） | 同左 | 同左 |

---

## 5. 功能可用性（核心差别）

因 Android 上必须使用 `--ignore-scripts` 安装，凡依赖 **postinstall / 原生模块** 的功能在 Android 上不可用或受限。

| 功能类别 | Mac OS | Linux | Android (Termux) |
|----------|--------|--------|-------------------|
| **Gateway 服务（WebSocket、工具注册）** | ✅ | ✅ | ✅ |
| **Gateway 扩展加载（如 Android Bridge）** | ✅ | ✅ | ✅ |
| **Gateway 配置 `~/.clawdbot/clawdbot.json`** | ✅ | ✅ | ✅ |
| **Android Bridge 工具（android_*）** | ✅（需手机跑 Bridge + 本机配置 `ANDROID_BRIDGE_HOST`） | ✅ 同左 | ✅（本机 Bridge，默认 localhost:18800） |
| **Matrix 渠道** | ✅ | ✅ | ❌（原生模块不支持 Android；即使用 --ignore-scripts 装上，加密/登录也可能不可用） |
| **WhatsApp / Telegram / Discord / Slack / Line / Signal / iMessage** | ✅ | ✅ | ✅（纯 JS，不依赖 postinstall 原生模块） |
| **图片处理 / sharp / 缩略图 / 图片理解** | ✅ | ✅ | ❌（依赖 sharp，postinstall/原生） |
| **Canvas 绘图 / Gateway Canvas UI** | ✅ | ✅ | ❌ 或 ⚠️（依赖 @napi-rs/canvas 或 sharp） |
| **PDF 解析（pdfjs-dist）** | ✅ | ✅ | ✅（纯 JS） |
| **Playwright 浏览器自动化** | ✅ | ✅ | ⚠️（postinstall 下载浏览器可能未执行，可能需手动处理） |
| **本地 LLM（node-llama-cpp）** | ✅ | ✅ | ❌（可选依赖、原生） |
| **TTS（node-edge-tts）** | ✅ | ✅ | ✅（纯 JS/HTTP） |
| **Daemon / Onboard / 插件系统 / Cron / Hooks / Agent RPC** | ✅ | ✅ | ✅ |
| **TUI 终端界面** | ✅ | ✅ | ⚠️（若依赖 node-pty 等原生模块可能受影响） |

---

## 6. 配置与存储

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **Gateway 配置路径** | `~/.clawdbot/clawdbot.json` | 同左 | 同左（Termux 下 `$HOME` 即 Termux 私有目录） |
| **扩展入口配置** | `plugins.load.paths` 指向 android-bridge.js | 同左 | 同左；**需用绝对路径**，不可用 `~`（否则插件可能加载失败） |
| **扩展目录（项目脚本）** | 可同步到 `~/gateway-extension` | 同左 | 同左；安装脚本会把项目内 `gateway-extension` 同步到 `~/gateway-extension` |
| **数据目录 / 记忆（clawd）** | 可选 `~/clawd`、`~/clawd/memory` 等，由 Operator/飞书侧配置 | 同左 | 同左；未创建时易出现 ENOENT（MEMORY.md / memory/YYYY-MM-DD.md） |
| **环境变量** | `ANDROID_BRIDGE_HOST`、`ANDROID_BRIDGE_PORT`、`GATEWAY_PORT` | 同左 | 同左；start-gateway.sh 会设置并 export |

---

## 7. 权限与安全（Android 专属）

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **系统级权限** | 无特殊要求 | 无特殊要求 | **仅 Android**：Bridge Service 需声明并可选申请联系人、通话记录、短信、日历、存储/媒体、麦克风、位置、POST_NOTIFICATIONS 等；INTERNET、FOREGROUND_SERVICE 为运行必需 |
| **存储访问** | 常规文件系统 | 同左 | Termux 需 `termux-setup-storage` 才能访问共享存储；Bridge 读手机文件（如 DCIM）依赖 Android 权限与 MediaStore/SAF，不可用本机 Read 工具读手机路径 |
| **本地 HTTP 服务** | 无特殊限制 | 同左 | Bridge 监听 localhost:18800，仅本机访问 |

---

## 8. 运维与稳定性

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **后台保活** | 常规进程/daemon 即可 | 同左 | **Termux**：需在系统设置中关闭电池优化、允许后台运行；**Bridge**：前台服务 + 通知栏常驻 |
| **资源占用（文档预期）** | 无单独数据 | 同左 | Bridge ~50MB，Gateway ~200MB；CPU 空闲 <1%、活跃 <10%；**建议连接电源** |
| **启动顺序** | 无强制顺序 | 同左 | 先启动 Bridge Service App，再在 Termux 中运行 `./scripts/start-gateway.sh`；脚本会轮询等待 Bridge 健康检查通过 |
| **常见故障** | Node 版本、端口占用等 | 同左 | **moltbot: command not found**（PATH 未含 npm bin）；**ENOENT MEMORY.md**（未建 ~/clawd）；**从源码/npm 安装失败**（需 --ignore-scripts）；**扩展未加载**（路径用 ~ 或未写 plugins.load.paths） |
| **健康检查** | `curl http://localhost:18789/health`；Bridge：`curl http://<bridge_host>:18800/api/v1/health` | 同左 | 同左；本机 Bridge 即 `localhost:18800` |

---

## 9. 脚本与工具支持

| 维度 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **setup-termux.sh** | 不适用 | 不适用 | ✅ 用于 Termux 环境与 Node 等基础配置 |
| **install-gateway.sh** | 可用（选从 npm 或源码）；不检测 Android | 同左 | ✅ 可用；**检测 Android/Termux 会提示建议选「从 npm 安装」** |
| **start-gateway.sh** | 可用；检查 Bridge 可达性、端口占用 | 同左 | ✅ 可用；**会补 PATH（如 ~/.npm-global/bin）、检测 ON_ANDROID，并支持用 node 直接运行全局包内 cli.js 以规避 npx 在 Termux 上的问题** |
| **build-bridge-apk.sh** | 可在本机为 Android 构建 APK（需 Android 构建环境） | 同左 | 通常在 PC 上构建，APK 装到手机 |
| **deploy.sh** | 视脚本内容而定 | 同左 | 视脚本内容而定 |
| **npx moltbot / 可执行文件** | 一般可用 | 同左 | ⚠️ npx 可能报 "could not determine executable"；脚本已支持用 `node <全局包路径>/dist/cli.js` 启动 |

---

## 10. 适用场景与推荐部署

| 场景 | Mac OS | Linux | Android (Termux) |
|------|--------|--------|-------------------|
| **需要 Matrix、sharp、Canvas、本地 LLM、完整 Playwright** | ✅ 推荐 | ✅ 推荐 | ❌ 不推荐（功能不可用或受限） |
| **仅 Gateway + Android Bridge，控制一台手机** | ✅ 可本机 Gateway + 手机 Bridge（混合部署） | ✅ 同左 | ✅ 推荐（Gateway + Bridge 同机，配置简单） |
| **多渠道 + Android Bridge，不依赖 Matrix/图片/LLM** | ✅ 全功能 | ✅ 全功能 | ✅ 可行（用 --ignore-scripts 安装） |
| **纯桌面端、不接手机** | ✅ 无需 Bridge | ✅ 同左 | 不适用 |
| **混合部署（PC 全功能 + 手机仅 Bridge）** | ✅ 推荐：PC 跑 Gateway，手机只装 Bridge，`ANDROID_BRIDGE_HOST=<手机IP>` | ✅ 同左 | 手机端仅安装并运行 Bridge，不在此机跑 Gateway |

---

## 11. 总结一览（按平台）

| 平台 | 一句话概括 |
|------|-------------|
| **Mac OS** | 无安装限制，全功能可用；可作 Gateway 主机并通过 `ANDROID_BRIDGE_HOST` 连接手机 Bridge。 |
| **Linux** | 与 Mac OS 一致，全功能可用；同样适合混合部署中的 Gateway 端。 |
| **Android (Termux)** | 必须 `--ignore-scripts` 安装，从源码/正常 npm 会失败；Gateway + Android Bridge + 纯 JS 渠道可用，Matrix、sharp、Canvas、本地 LLM 等不可用；需 Termux + Bridge App 双组件，并注意 PATH、配置绝对路径与后台保活。 |

---

## 参考文档

- [ignore-scripts 功能清单](ignore-scripts-feature-checklist.md) — Android 上使用 `--ignore-scripts` 时各功能受影响说明  
- [部署指南](deployment-guide.md) — Android 端环境、Node、Gateway、Bridge 详细步骤  
- [架构设计](architecture.md) — Gateway + Bridge 整体架构与端口  
- [权限指南](permission-guide.md) — Bridge Service 所需 Android 权限  
- [README 故障排除](../README.md#故障排除) — 常见问题与混合部署说明  
