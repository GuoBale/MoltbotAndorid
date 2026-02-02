# OpenClaw (clawdbot/Moltbot) 平台部署功能对比

本文档从**多个维度**对比在 **Mac OS**、**Linux**、**Windows (WSL2)**、**Android (Termux)** 上部署 OpenClaw（clawdbot/Moltbot）的差异，便于按场景选择部署方式。依据项目文档、脚本及**网络调研**（官方文档、npm/依赖说明、社区问题）整理。

---

## 0. 官方要求与来源（外部调研）

| 来源 | Node.js | 操作系统 | 说明 |
|------|---------|----------|------|
| **OpenClaw 官方安装页**（[docs.clawd.bot/install](https://docs.clawd.bot/install)） | **Node ≥ 22** | macOS、Linux、**Windows 仅通过 WSL2** | 推荐安装器 `curl -fsSL https://openclaw.ai/install.sh \| bash`；全局安装 `npm install -g openclaw@latest`；从源码需 pnpm；sharp 冲突时可设 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` |
| **OpenClaw Wiki**（[moltbotwiki.com](https://moltbotwiki.com/installation.html)） | Node 18+ | Windows 10+、macOS 12+、现代 Linux | 安装命令示例为 `npm install -g clawdbot`；配置路径示例 `~/.config/openclaw/config.json`（与本项目 `~/.clawdbot/clawdbot.json` 可能不同） |
| **OpenClaw 官方 Android 页**（[docs.clawd.bot/platforms/android](https://docs.clawd.bot/platforms/android)） | — | **Android 为 Node 客户端** | **Android 不 host Gateway**；需在 macOS/Linux/WSL2 上运行 Gateway；Android 通过 WebSocket 连接 Gateway（`ws://<host>:18789`），配对后使用 Chat/Canvas/Camera 等 |
| **本项目（Moltbot Android Gateway）** | Node ≥ 22.12.0（架构文档） | **Android 上在 Termux 内跑 Gateway** | 与官方「Android 仅 Node 客户端」不同：本方案在手机 Termux 跑 Gateway + 本机 Bridge，需 `--ignore-scripts` 安装 |

---

## 1. 环境与依赖

| 维度 | Mac OS | Linux | Windows (WSL2) | Android (Termux) |
|------|--------|--------|-----------------|-------------------|
| **运行环境** | 原生 macOS | 原生 Linux | **仅 WSL2 内**（官方推荐 Ubuntu）；原生 Windows 未正式支持 | Termux（需从 F-Droid 安装，不可用 Google Play 版） |
| **Node.js 要求** | ≥ 22.12.0 | ≥ 22.12.0 | ≥ 22（在 WSL2 内） | ≥ 22.x（Termux 内 `pkg install nodejs-lts`） |
| **安装方式** | `npm install -g moltbot` 或从源码 | 同 Mac OS | 在 WSL2 内同 Linux；需先启用 systemd（`[boot] systemd=true`）以便 Gateway 服务安装 | 必须 `npm install -g moltbot@latest --ignore-scripts` 或脚本选「从 npm 安装」；**从源码安装会失败** |
| **是否必须 --ignore-scripts** | 否 | 否 | 否 | **是**（否则 postinstall 报 `Unsupported OS: android`） |
| **额外组件** | 无；若用 Android Bridge 需另有一台手机装 Bridge App | 同 Mac OS | WSL2 + 可选 portproxy 暴露 Gateway 到局域网 | Termux App + **Bridge Service APK**（本机必装） |
| **包管理器** | npm / pnpm 均可 | 同 Mac OS | 同 Linux（WSL 内） | 推荐 npm；pnpm 可用于其他目录 |
| **PATH / 全局 bin** | 一般无需特别配置 | 同 Mac OS | WSL 内同 Linux；Windows 侧无 CLI | 常需把 `~/.npm-global/bin` 或 `$(npm config get prefix)/bin` 加入 PATH |

---

## 2. 硬件与系统约束

| 维度 | Mac OS | Linux | Windows (WSL2) | Android (Termux) |
|------|--------|--------|-----------------|-------------------|
| **文档给出的最低/推荐配置** | 无单独说明（按通用桌面） | 无单独说明 | WSL2 + Ubuntu；需启用 systemd | Android 7.0 (API 24) 起；推荐 12.0+ (API 31)；RAM 最低 4GB、推荐 8GB+；存储最低 2GB、推荐 5GB+；CPU ARM64 |
| **架构** | x64 / ARM64（Apple Silicon） | x64 / ARM64 等 | WSL2 内多为 x64 | ARM64（Termux 常见） |
| **Termux 来源** | 不涉及 | 不涉及 | 不涉及 | **必须从 F-Droid 安装**，Play Store 版已过时且不可用 |

---

## 3. 安装限制与失败原因

| 维度 | Mac OS | Linux | Windows (WSL2) | Android (Termux) |
|------|--------|--------|-----------------|-------------------|
| **从源码安装** | ✅ 支持 | ✅ 支持 | ✅ 在 WSL2 内同 Linux | ❌ **会失败**（依赖见下） |
| **从 npm 直接安装（无参数）** | ✅ 可用 | ✅ 可用 | ✅ 在 WSL2 内可用 | ❌ **会失败**（见下） |
| **从 npm 安装且加 --ignore-scripts** | 不需要 | 不需要 | 不需要 | ✅ **推荐**，可成功安装；代价见「功能可用性」 |
| **依赖补丁（pnpm.patchedDependencies）** | 正常应用 | 正常应用 | 同 Linux | ⚠️ 跳过 postinstall 后**不应用** |
| **CLI 可执行位（chmod +x）** | postinstall 会设置 | 同左 | 同左 | ⚠️ 可能未设置，需 `chmod +x` 或 `node .../moltbot.mjs` / 脚本启动 |

**Android 失败原因（外部调研）**：moltbot 依赖 **`@matrix-org/matrix-sdk-crypto-nodejs`** 等，该包预编译二进制仅支持 Linux（aarch64/arm/x86_64 等）、macOS（aarch64/x86_64）、Windows（aarch64/x86_64/i686），**明确不支持 Android**（[npm](https://www.npmjs.com/package/@matrix-org/matrix-sdk-crypto-nodejs)、[GitHub](https://github.com/matrix-org/matrix-rust-sdk-crypto-nodejs)）；postinstall 检测到 Android 即报 `Unsupported OS: android`。

---

## 4. 网络与端口

| 维度 | Mac OS | Linux | Windows (WSL2) | Android (Termux) |
|------|--------|--------|-----------------|-------------------|
| **Gateway 端口** | 默认 18789 | 同左 | 同左（WSL 内）；暴露到 Windows 局域网需 portproxy | 同左；环境变量 `GATEWAY_PORT` |
| **Bridge HTTP 端口** | 仅当连接手机时：默认 18800 | 同左 | 同左 | 本机 Bridge 默认 18800 |
| **Bridge 连接地址** | 使用 Android Bridge 时：`ANDROID_BRIDGE_HOST=<手机IP>` | 同左 | 同左 | 本机：默认 `127.0.0.1` |
| **客户端连接方式** | `ws://<本机IP>:18789`；混合部署时连 PC | 同左 | 局域网需 portproxy 转发 WSL 内端口 | 连手机：`ws://<手机IP>:18789` |
| **网络要求** | 本机/局域网可达即可 | 同左 | WSL 有独立虚拟网；外网访问需 portproxy + 防火墙 | 本地 localhost；远程需设备 IP 可达 |
| **其他端口（文档提及）** | 18793 Gateway Canvas；18801 Bridge WebSocket（可选） | 同左 | 同左 | 同左 |

---

## 5. 功能可用性（核心差别）

因 Android 上必须使用 `--ignore-scripts` 安装，凡依赖 **postinstall / 原生模块** 的功能在 Android 上不可用或受限。

| 功能类别 | Mac OS | Linux | Windows (WSL2) | Android (Termux) |
|----------|--------|--------|-----------------|-------------------|
| **Gateway 服务（WebSocket、工具注册）** | ✅ | ✅ | ✅（WSL2 内） | ✅ |
| **Gateway 扩展加载（如 Android Bridge）** | ✅ | ✅ | ✅ | ✅ |
| **Gateway 配置 `~/.clawdbot/clawdbot.json`** | ✅ | ✅ | ✅ | ✅ |
| **Android Bridge 工具（android_*）** | ✅（需手机 Bridge + `ANDROID_BRIDGE_HOST`） | ✅ 同左 | ✅ 同左 | ✅（本机 Bridge，localhost:18800） |
| **Matrix 渠道** | ✅ | ✅ | ✅ | ❌（@matrix-org/matrix-sdk-crypto-nodejs 无 Android 预编译） |
| **WhatsApp / Telegram / Discord / Slack / Line / Signal / iMessage** | ✅ | ✅ | ✅ | ✅（纯 JS） |
| **图片处理 / sharp / 缩略图 / 图片理解** | ✅ | ✅ | ✅（WSL2 内同 Linux） | ❌（sharp 无 android-arm64 预编译，[lovell/sharp#3850](https://github.com/lovell/sharp/issues/3850)；可选 @img/sharp-wasm 需另行配置） |
| **Canvas 绘图 / Gateway Canvas UI** | ✅ | ✅ | ✅ | ❌ 或 ⚠️（依赖 @napi-rs/canvas 或 sharp） |
| **PDF 解析（pdfjs-dist）** | ✅ | ✅ | ✅ | ✅（纯 JS） |
| **Playwright 浏览器自动化** | ✅ | ✅ | ✅ | ⚠️（postinstall 可能未下载浏览器；[microsoft/playwright#6105](https://github.com/microsoft/playwright/issues/6105)；社区有 playwright-termux 等） |
| **本地 LLM（node-llama-cpp）** | ✅ | ✅ | ✅ | ❌（可选依赖、原生） |
| **TTS（node-edge-tts）** | ✅ | ✅ | ✅ | ✅（纯 JS/HTTP） |
| **Daemon / Onboard / 插件系统 / Cron / Hooks / Agent RPC** | ✅ | ✅ | ✅ | ✅ |
| **TUI 终端界面** | ✅ | ✅ | ✅ | ⚠️（若依赖 node-pty 等原生模块可能受影响） |

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

| 场景 | Mac OS | Linux | Windows (WSL2) | Android (Termux) |
|------|--------|--------|-----------------|-------------------|
| **需要 Matrix、sharp、Canvas、本地 LLM、完整 Playwright** | ✅ 推荐 | ✅ 推荐 | ✅ 在 WSL2 内同 Linux | ❌ 不推荐（功能不可用或受限） |
| **仅 Gateway + Android Bridge，控制一台手机** | ✅ 可本机 Gateway + 手机 Bridge（混合部署） | ✅ 同左 | ✅ 在 WSL2 内跑 Gateway，手机 Bridge | ✅ 推荐（Gateway + Bridge 同机，配置简单） |
| **多渠道 + Android Bridge，不依赖 Matrix/图片/LLM** | ✅ 全功能 | ✅ 全功能 | ✅ 全功能 | ✅ 可行（用 --ignore-scripts 安装） |
| **纯桌面端、不接手机** | ✅ 无需 Bridge | ✅ 同左 | ✅ 在 WSL2 内同 Linux | 不适用 |
| **混合部署（PC 全功能 + 手机仅 Bridge）** | ✅ PC 跑 Gateway，手机只装 Bridge，`ANDROID_BRIDGE_HOST=<手机IP>` | ✅ 同左 | ✅ WSL2 内跑 Gateway，portproxy 暴露端口 | 手机端仅安装并运行 Bridge，不在此机跑 Gateway |

---

## 11. 总结一览（按平台）

| 平台 | 一句话概括 |
|------|-------------|
| **Mac OS** | 无安装限制，全功能可用；可作 Gateway 主机并通过 `ANDROID_BRIDGE_HOST` 连接手机 Bridge。 |
| **Linux** | 与 Mac OS 一致，全功能可用；同样适合混合部署中的 Gateway 端。 |
| **Windows (WSL2)** | 官方仅支持通过 WSL2（推荐 Ubuntu）；在 WSL 内安装与 Linux 一致，需启用 systemd；暴露到局域网需 portproxy；无原生 Windows 伴侣应用。 |
| **Android (Termux)** | 必须 `--ignore-scripts` 安装，从源码/正常 npm 会失败；Gateway + Android Bridge + 纯 JS 渠道可用，Matrix、sharp、Canvas、本地 LLM 等不可用；需 Termux + Bridge App 双组件，并注意 PATH、配置绝对路径与后台保活。 |

---

## 12. 外部调研与参考（网络来源）

以下为补充对比所依据的**外部来源**摘要，便于查证与延伸阅读。

| 主题 | 来源与结论 |
|------|------------|
| **OpenClaw 官方安装** | [docs.clawd.bot/install](https://docs.clawd.bot/install)：Node ≥ 22；macOS、Linux、**Windows 仅 WSL2**；安装器 `openclaw.ai/install.sh`；sharp 冲突可设 `SHARP_IGNORE_GLOBAL_LIBVIPS=1`。 |
| **OpenClaw Android 官方定位** | [docs.clawd.bot/platforms/android](https://docs.clawd.bot/platforms/android)：Android 为 **Node 客户端**，不 host Gateway；Gateway 须在 macOS/Linux/WSL2 上运行；Android 通过 `ws://<host>:18789` 连接并配对。 |
| **Windows 部署** | [docs.clawd.bot/platforms/windows](https://docs.clawd.bot/platforms/windows)：推荐 WSL2 + Ubuntu；需 `[boot] systemd=true` 以便 Gateway 服务安装；暴露 WSL 服务到局域网需 portproxy + 防火墙。 |
| **Matrix 原生模块** | [@matrix-org/matrix-sdk-crypto-nodejs](https://www.npmjs.com/package/@matrix-org/matrix-sdk-crypto-nodejs)：预编译平台为 Linux/macOS/Windows，**无 Android**；Android 上安装会报 Unsupported OS。 |
| **sharp 在 Android/Termux** | [lovell/sharp#3850](https://github.com/lovell/sharp/issues/3850)：**无 android-arm64 预编译**，安装报 "Prebuilt libvips ... not yet available for android-arm64v8"；可选方案 [@img/sharp-wasm](https://www.npmjs.com/package/@img/sharp-wasm) 需另行配置。 |
| **Termux 上 Node.js** | [Stack Overflow](https://stackoverflow.com/questions/72243779)、[termux/termux-app#2096](https://github.com/termux/termux-app/issues/2096)：仓库/依赖问题可能导致 `pkg install nodejs` 失败；nvm 与 Termux PREFIX 冲突，无法在 Termux 内用 nvm 多版本；部分环境缺 `libicui18n.so.70` 等导致 node 无法运行。 |
| **Playwright 与 Android** | [microsoft/playwright#6105](https://github.com/microsoft/playwright/issues/6105)：在 Termux 安装曾报 "Unsupported platform: android"；官方 Android 支持为通过 ADB 控制设备浏览器，非在 Android 上运行 Playwright 服务端；社区有 [playwright-termux](https://github.com/Jobians/playwright-termux) 等方案。 |

---

## 参考文档（本项目）

- [ignore-scripts 功能清单](ignore-scripts-feature-checklist.md) — Android 上使用 `--ignore-scripts` 时各功能受影响说明  
- [部署指南](deployment-guide.md) — Android 端环境、Node、Gateway、Bridge 详细步骤  
- [架构设计](architecture.md) — Gateway + Bridge 整体架构与端口  
- [权限指南](permission-guide.md) — Bridge Service 所需 Android 权限  
- [README 故障排除](../README.md#故障排除) — 常见问题与混合部署说明  
