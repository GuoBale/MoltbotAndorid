# 手机上如何使用这些 Skill

本文说明在手机端环境下，如何让 AI 使用「每日播报」「快捷操作」「联系人分析」等场景能力。

---

## 一、核心结论

- **手机本身不需要安装 .cursor/skills 目录**。场景内容已内置在 **gateway-extension** 插件里，Gateway 在手机上启动时会自动加载。
- **使用方式**：在**连接该手机 Gateway 的客户端**（Operator、飞书等）里**用自然语言对话**，例如说「早安」「查通讯录」「打开微信扫一扫」，AI 会调用对应的 `android_*` 工具和场景指南完成任务。

---

## 二、手机端需要做什么

### 1. 安装并启动 Bridge Service

- 安装本项目构建的 APK（Bridge Service 应用）。
- 打开应用，授予所需权限（通讯录、短信、存储、位置等），点击「启动服务」。

### 2. 在 Termux 里启动 Gateway

```bash
cd ~/MoltbotAndorid   # 或你克隆/放置项目的目录
./scripts/start-gateway.sh
```

保持该终端在前台运行，不要关闭。看到日志里出现 **`[Android Bridge] Extension activated`** 或 **`[Android Bridge] Registered Android tools`** 即表示扩展已加载，所有工具（含场景工具）已注册。

### 3. 确保 Gateway 已加载扩展

- 若首次使用或刚更新过项目，先在项目目录执行一次：  
  `./scripts/install-gateway.sh`  
  再执行上面的 `./scripts/start-gateway.sh`。
- 配置文件 `~/.clawdbot/clawdbot.json` 中需包含 `plugins.load.paths`，并指向扩展入口（如 `~/gateway-extension/dist/android-bridge.js`），详见 [README - 如何通过桥接让 clawdbot 读取手机通讯录](../README.md)。

**总结**：手机端只要「Bridge 应用已启动 + Termux 里 Gateway 在跑」，无需在手机上单独配置或复制任何 Skill 文件。

---

## 三、在哪里「使用」这些 Skill

Skill 的「使用」发生在**连接手机 Gateway 的客户端**里，而不是在手机本地界面里点某个 Skill 按钮。

### 1. 连接方式

- 在运行 **Clawdbot Operator**（或飞书等对接了 clawdbot 的客户端）的电脑/服务器上，将 **Gateway 地址** 设置为：  
  **`ws://<手机 IP>:18789`**
- 手机 IP：在手机「设置 → WLAN → 当前网络」查看，或在 Termux 里执行 `ifconfig` / `ip addr` 查看。
- 确保该电脑/服务器能访问手机的 18789 端口（同一 WiFi 或已做端口转发/内网穿透）。

### 2. 用自然语言触发场景

连接成功后，在 Operator / 飞书的**对话里**直接说人话即可，例如：

| 你说的话（示例） | AI 会用的能力 |
|------------------|----------------|
| 早安 / 今天有什么事 / 每日播报 | 每日播报场景（日程 + 短信 + 来电 + 电池等） |
| 打开微信扫一扫 / 支付宝付款码 | 快捷操作（android_app_shortcut_open） |
| 谁联系我最多 / 重要联系人 | 联系人分析场景 |
| 睡觉模式 / 会议模式 / 勿扰 | 自动化工作流（闹钟、勿扰、音量等） |
| 看看相册 / 最近的照片 / 帮我拍张照 | 相册助手场景 |
| 我在哪 / 导航到 xxx | 位置导航场景 |
| 检查手机安全 / 隐私检查 | 安全隐私场景 |
| 查一下张三电话 / 给 138xxx 发短信 | 通讯录 / 短信工具 |

AI 会根据你的话调用相应的 **android_*** 工具；遇到复杂场景时，也可能先调用 **android_scenario_guide** 取回该场景的操作步骤，再按步骤调用具体工具。

### 3. 场景工具（可选了解）

插件在 Gateway 里注册了三个与「场景」相关的工具，AI 在需要时会自动用，用户一般无需手动选：

- **android_scenario_list**：列出所有可用场景（每日播报、快捷操作、联系人分析等）。
- **android_scenario_guide**：根据场景 ID 或用户请求，返回该场景的详细操作指南（用哪些工具、按什么顺序）。
- **android_system_prompt**：返回一段「系统提示词」文本，可用于配置 Operator/飞书的系统提示，让 AI 知道优先用 android_* 工具。

用户只要在对话里说「早安」「扫一扫」等即可，不必记住这些工具名。

---

## 四、让 AI 更稳定地使用手机能力（推荐）

若 AI 有时回复「无法访问手机」或不去调用工具，多半是**不知道**已通过 Gateway 连上手机。建议在 **Operator / 飞书的「系统提示词」或「角色说明」** 里加入一段说明。

### 1. 使用现成提示词文档

项目里已有写好的提示词，可直接复制到你的 bot 配置里：

- 完整版、简短版及使用说明见：[Android Bridge 模型提示词](android-bridge-prompt.md)。

把其中「提示词正文」或「简短版」整段粘贴到飞书/Operator 的系统提示中即可。

### 2. 通过工具获取最新提示词

若 Gateway 已连接且扩展已加载，可以在对话里让 AI 执行一次 **android_system_prompt**，把返回内容复制出来，贴到 Operator/飞书的系统提示里。这样会包含当前插件支持的所有工具与规则说明。

---

## 五、整体数据流（帮助理解）

```
你在 Operator/飞书 里说：「早安」
        ↓
Operator/飞书 把消息发给 连接到的 Gateway（ws://手机IP:18789）
        ↓
Gateway（在手机 Termux 里运行）收到请求，调用已加载的 gateway-extension
        ↓
扩展里有 android_* 工具 + 场景指南（android_scenario_*）
        ↓
AI 决定调用 android_scenario_guide("早安") 或直接调用 android_calendar_events、android_sms_list、android_battery_status 等
        ↓
扩展通过 HTTP 请求 本机 Bridge 应用（localhost:18800）
        ↓
Bridge 应用调用 Android 系统 API（日历、短信、电池等）
        ↓
结果经 Gateway 返回给 Operator/飞书，AI 整理成「今日日程、未读短信、电池…」回复给你
```

所以：**Skill 的执行是在「连接手机 Gateway 的客户端 + 手机上的 Gateway + Bridge」这条链路上完成的**，手机本地不需要再装一份 Skill 文件。

---

## 六、常见问题

**Q：手机上的 Termux 里要不要放 .cursor/skills 目录？**  
A：不需要。.cursor/skills 是给 **Cursor IDE** 在电脑上用的；手机端只要用本项目提供的 gateway-extension，场景已内置在插件里。

**Q：如何确认 AI 已经在用这些场景？**  
A：在 Operator/飞书里说「早安」或「今天有什么事」，若 AI 回复里包含今日日程、未读短信、电池状态等，说明已在用每日播报等能力；或者说「打开微信扫一扫」，看手机是否弹出微信扫一扫界面。

**Q：可以说「用一下每日播报」吗？**  
A：可以。也可以说「早安」「今天有什么事」「手机状态汇总」等，AI 会匹配到每日播报场景并执行相应工具。

**Q：飞书/Operator 里要填的 Gateway 地址是什么？**  
A：填 **`ws://<手机 IP>:18789`**，其中「手机 IP」是手机在当前 WiFi 下的 IP，端口固定为 18789。

---

## 七、相关文档

- [README - 快速开始、如何连接](../README.md)
- [Android Bridge 模型提示词](android-bridge-prompt.md)（系统提示词模板）
- [API 参考](api-reference.md)（各 android_* 工具说明）
