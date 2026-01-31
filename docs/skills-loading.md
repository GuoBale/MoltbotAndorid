# Skill 加载说明

本项目的 Skill（每日播报、快捷操作、联系人分析等）**仅在手机上使用**，通过 **Clawdbot Gateway 插件** 加载；**不需要在 Cursor 中使用或加载**。

---

## 一、Skill 在哪里、谁用

| 内容位置 | 谁用 | 加载方式 |
|----------|------|----------|
| **gateway-extension**（`android-scenarios.ts` 等） | 连接手机 Gateway 的客户端（Operator/飞书） | Gateway 启动时通过插件加载 |

场景定义已编译进插件；手机只需运行 Bridge + Gateway，用户在 Operator/飞书中对话即可触发。

---

## 二、插件场景怎么加载

### 是什么

- 场景定义在 **gateway-extension** 里：`gateway-extension/src/android-scenarios.ts`（每日播报、快捷操作、联系人分析等）。
- 插件在注册工具时会把 **android_scenario_list**、**android_scenario_guide**、**android_system_prompt** 等一起注册；场景内容随插件编译进 `dist/android-bridge.js`。

### 加载过程

1. **安装 Gateway 与扩展（一次性或更新后）**  
   在项目目录执行：
   ```bash
   ./scripts/install-gateway.sh
   ```
   - 会把 `gateway-extension/` 同步到 **`~/gateway-extension`** 并执行 `npm run build`，得到 `~/gateway-extension/dist/android-bridge.js`。
   - 脚本会配置 **`~/.clawdbot/clawdbot.json`**，在 `plugins.load.paths` 里加入该入口，例如：
     ```json
     "plugins": {
       "load": {
         "paths": ["/data/data/com.termux/files/home/gateway-extension/dist/android-bridge.js"]
       }
     }
     ```
     （路径以你本机为准，Termux 下常用 `$HOME/gateway-extension/dist/android-bridge.js` 的绝对路径。）

2. **启动 Gateway（每次要用手机能力时）**  
   在手机 Termux 里执行：
   ```bash
   cd ~/MoltbotAndorid
   ./scripts/start-gateway.sh
   ```
   - 会启动 clawdbot Gateway（例如 `gateway run --port 18789`）。
   - Gateway 启动时根据 **clawdbot.json** 的 `plugins.load.paths` 加载 **android-bridge.js**。
   - 插件执行后注册所有 **android_*** 工具（含 **android_scenario_list**、**android_scenario_guide**、**android_system_prompt**），场景内容随之可用。

3. **客户端连接**  
   Operator/飞书等连接 **`ws://<手机 IP>:18789`** 后，会看到这些已注册的工具；用户说「早安」「扫一扫」等时，AI 会调用相应工具和场景。

### 小结

| 步骤 | 命令/配置 | 作用 |
|------|------------|------|
| 1. 安装/更新扩展 | `./scripts/install-gateway.sh` | 构建插件并写入 `plugins.load.paths` |
| 2. 启动 Gateway | `./scripts/start-gateway.sh` | 启动时按 paths 加载插件，注册所有 android_* 与场景工具 |
| 3. 连接 | 客户端连 `ws://手机IP:18789` | 使用已注册的工具和场景 |

「加载」= 执行 **install-gateway.sh**（或手动保证 `plugins.load.paths` 指向正确且已 build） + 执行 **start-gateway.sh**。不需要在 Cursor 中做任何加载。

---

## 三、相关文档

- [手机上如何使用这些 Skill](skills-usage-on-phone.md)（在 Operator/飞书中用场景）
- [README - 快速开始、install/start 脚本](../README.md)
- [Android Bridge 模型提示词](android-bridge-prompt.md)

---

## 附：.cursor/skills/ 目录说明

仓库中的 `.cursor/skills/` 目录仅作为**场景设计的参考文档**，与插件内的场景定义（`gateway-extension/src/android-scenarios.ts`）对应；**不在 Cursor 中加载**，也不需要在手机上复制。实际在手机上生效的是插件编译后的场景与工具。
