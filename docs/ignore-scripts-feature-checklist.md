# moltbot 使用 `--ignore-scripts` 安装时的功能清单

在 Android/Termux 等环境使用  
`npm install -g moltbot@latest --ignore-scripts`  
时，以下清单标出**可能受影响**的功能。  
✅ = 一般不受影响 | ⚠️ = 可能受影响 | ❌ = 易受影响（依赖安装时脚本或原生模块）

---

## 1. 核心与入口

| 功能 | 状态 | 说明 |
|-----|------|------|
| CLI 入口 `moltbot` / `clawdbot` | ⚠️ | postinstall 会为 `dist/entry.js` 设可执行位；跳过时可能需用 `node .../moltbot.mjs` 或手动 `chmod +x` |
| 依赖补丁（pnpm.patchedDependencies） | ⚠️ | postinstall 负责打补丁；跳过则补丁不生效，部分依赖行为可能与预期不一致 |

---

## 2. Gateway 与桥接（本项目主要使用）

| 功能 | 状态 | 说明 |
|-----|------|------|
| Gateway 服务（WebSocket、工具注册） | ✅ | 不依赖安装时脚本 |
| Gateway 扩展加载（如 Android Bridge） | ✅ | 不依赖安装时脚本 |
| Gateway 配置 `~/.clawdbot/moltbot.json` | ✅ | 不依赖安装时脚本 |
| Gateway Canvas / Control UI | ⚠️ | 若依赖 **@napi-rs/canvas** 或 **sharp** 做渲染/图片处理，会受影响 |

---

## 3. 渠道（Channels）

| 功能 | 状态 | 说明 |
|-----|------|------|
| WhatsApp (Baileys) | ✅ | 纯 JS，不依赖 postinstall 原生模块 |
| Telegram (Grammy) | ✅ | 纯 JS |
| Discord | ✅ | 纯 JS |
| Slack | ✅ | 纯 JS |
| Line | ✅ | 纯 JS |
| Signal | ✅ | 纯 JS（signal-utils 等） |
| iMessage | ✅ | 不依赖需 postinstall 的原生模块 |
| Matrix | ❌ | 依赖 `@matrix-org/matrix-sdk-crypto-nodejs` 等；在 Android 上 postinstall 会报错，用 `--ignore-scripts` 可装上但**加密/登录可能不可用** |

---

## 4. 媒体与图像

| 功能 | 状态 | 说明 |
|-----|------|------|
| 图片处理 / 缩略图 / 图片理解 | ❌ | 依赖 **sharp**（原生，postinstall 常下载二进制）；跳过脚本后可能不可用或报错 |
| Canvas 绘图 / 画布 UI | ❌ | 依赖 **@napi-rs/canvas**（可选依赖、原生）；未正确安装则不可用 |
| PDF 解析（pdfjs-dist） | ✅ | 纯 JS |
| 媒体理解（非 sharp 路径） | ⚠️ | 若实现里用到 sharp，则同「图片处理」 |

---

## 5. 浏览器与自动化

| 功能 | 状态 | 说明 |
|-----|------|------|
| 浏览器自动化（Playwright） | ⚠️ | **playwright-core** 常在 postinstall 下载浏览器；跳过则首次使用可能需手动安装浏览器 |

---

## 6. 本地模型与 TTS

| 功能 | 状态 | 说明 |
|-----|------|------|
| 本地 LLM（node-llama-cpp） | ❌ | **node-llama-cpp** 为可选依赖、原生；postinstall 未跑则可能未正确安装 |
| TTS（node-edge-tts） | ✅ | 纯 JS/HTTP，不依赖安装时脚本 |

---

## 7. 其他

| 功能 | 状态 | 说明 |
|-----|------|------|
| TUI 终端界面 | ⚠️ | 若依赖 **node-pty** 等带原生模块的包，可能受影响（多数 TUI 功能仍可用） |
| Daemon / 后台进程 | ✅ | 不依赖安装时脚本 |
| Onboard 引导 | ✅ | 不依赖安装时脚本 |
| 插件系统（plugin-sdk） | ✅ | 不依赖安装时脚本 |
| Cron / 定时任务 | ✅ | 不依赖安装时脚本 |
| Hooks / 技能 | ✅ | 不依赖安装时脚本 |
| Agent / RPC 模式 | ✅ | 不依赖安装时脚本 |

---

## 8. 依赖补丁相关（整体）

| 项目 | 状态 | 说明 |
|-----|------|------|
| 对 typebox / hono / tar 等依赖的补丁 | ⚠️ | 若发布包内带 `pnpm.patchedDependencies`，跳过 postinstall 则**所有补丁都不会应用**，仅影响依赖这些补丁的行为 |

---

## 总结（按使用场景）

- **仅用 Gateway + Android Bridge、不接 Matrix、不用图片/Canvas/本地 LLM**  
  → 使用 `npm install -g moltbot@latest --ignore-scripts` **通常可行**；注意 CLI 入口可能需用 `node` 或 chmod。

- **需要 Matrix、图片处理、Canvas、Playwright 浏览器、本地 Llama**  
  → 建议在**支持这些原生模块的环境**下正常安装（不加 `--ignore-scripts`），或在当前环境单独处理对应依赖。

- **在 Android/Termux 上**  
  → 使用 `--ignore-scripts` 可避免 `@matrix-org/matrix-sdk-crypto-nodejs` 等 postinstall 报错，但 Matrix 与上述原生能力可能不可用。
