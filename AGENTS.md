# Android Bridge Gateway - Agent 配置

本文件配置 AI Agent 在此项目中的行为和可用技能。

## 项目概述

Moltbot Android Gateway 项目，使 AI Agent 能够通过 Gateway 调用 Android 设备的系统 API 和应用。

## 可用 Skills

以下 skill 提供手机操作的专业能力，当用户请求相关任务时自动触发。

<skills_system priority="1">

### 使用方式

当用户请求与手机操作相关的任务时，读取对应的 skill 文件获取详细指导：

```bash
# 读取 skill
Read(".cursor/skills/<skill-name>/SKILL.md")
```

### 可用 Skills 列表

<available_skills>

<skill>
<name>android-smart-assistant</name>
<description>综合性 Android 手机智能助手，通过 Gateway 远程控制手机完成各类任务。包含日程管理、通讯录查询、快捷操作、文件管理、手机状态监控等场景。当用户需要操作手机、查询手机信息、设置提醒、管理联系人时使用。</description>
<location>.cursor/skills/android-smart-assistant/SKILL.md</location>
</skill>

<skill>
<name>android-daily-briefing</name>
<description>每日手机信息播报，汇总今日日程、未读短信、未接来电、电池状态等关键信息。当用户说"今天有什么事"、"早安"、"每日播报"、"手机状态汇总"时触发。</description>
<location>.cursor/skills/android-daily-briefing/SKILL.md</location>
</skill>

<skill>
<name>android-contact-intelligence</name>
<description>智能联系人分析与管理，分析通讯频率、识别重要联系人、整理重复联系人、生成联系人报告。当用户需要"分析联系人"、"谁联系最多"、"整理通讯录"、"重要联系人"时使用。</description>
<location>.cursor/skills/android-contact-intelligence/SKILL.md</location>
</skill>

<skill>
<name>android-quick-actions</name>
<description>手机快捷操作集合，一句话完成常用操作如打开微信扫一扫、支付宝付款、调节音量、开关手电筒、设置闹钟等。当用户说"扫一扫"、"付款码"、"打开手电筒"、"调音量"、"设闹钟"时使用。</description>
<location>.cursor/skills/android-quick-actions/SKILL.md</location>
</skill>

<skill>
<name>android-photo-assistant</name>
<description>手机相册助手，浏览查看手机照片、拍摄新照片、分析图片内容。当用户说"看看相册"、"最近的照片"、"帮我拍张照"、"这张图是什么"时使用。</description>
<location>.cursor/skills/android-photo-assistant/SKILL.md</location>
</skill>

<skill>
<name>android-location-navigator</name>
<description>手机位置与导航服务，获取当前位置、地址查询、地理编码、导航到目的地。当用户说"我在哪"、"当前位置"、"导航到"、"这个地址在哪"时使用。</description>
<location>.cursor/skills/android-location-navigator/SKILL.md</location>
</skill>

<skill>
<name>android-automation-workflows</name>
<description>手机自动化工作流，组合多个操作完成复杂任务如睡前模式、起床流程、外出准备等。当用户说"睡觉模式"、"起床流程"、"外出准备"、"回家模式"时使用。</description>
<location>.cursor/skills/android-automation-workflows/SKILL.md</location>
</skill>

<skill>
<name>android-security-privacy</name>
<description>手机安全与隐私检查，检查应用权限、未知应用、存储安全、系统状态等。当用户说"检查手机安全"、"有没有可疑应用"、"隐私检查"、"手机健康"时使用。</description>
<location>.cursor/skills/android-security-privacy/SKILL.md</location>
</skill>

</available_skills>

</skills_system>

## Android Bridge 工具

当 Gateway 扩展加载后，以下工具可用于操作手机：

### 系统
- `android_device_info` - 获取设备信息
- `android_battery_status` - 电池状态
- `android_network_status` - 网络状态
- `android_storage_info` - 存储信息
- `android_root_status` - Root 状态

### 通讯
- `android_contacts_list` - 联系人列表
- `android_contacts_get` - 联系人详情
- `android_sms_list` - 短信列表
- `android_sms_send` - 发送短信
- `android_calllog_list` - 通话记录
- `android_dial` - 拨打电话

### 应用
- `android_apps_list` - 应用列表
- `android_app_info` - 应用详情
- `android_app_launch` - 启动应用
- `android_app_shortcut_open` - 打开快捷方式（微信扫一扫等）

### 日历
- `android_calendar_list` - 日历列表
- `android_calendar_events` - 日历事件
- `android_calendar_create_event` - 创建事件

### 剪贴板 / TTS
- `android_clipboard_get` - 读取剪贴板
- `android_clipboard_set` - 设置剪贴板
- `android_tts_speak` - 语音播报
- `android_share` - 分享内容
- `android_open_url` - 打开 URL

### 位置
- `android_location_current` - 当前位置
- `android_location_last` - 最后位置
- `android_geocode` - 地址转坐标
- `android_reverse_geocode` - 坐标转地址

### 音量 / 闹钟
- `android_volume_get` / `android_volume_set` - 音量控制
- `android_ringer_mode` - 铃声模式
- `android_alarm_set` - 设置闹钟
- `android_timer_set` - 设置定时器
- `android_dnd` - 勿扰模式

### 通知
- `android_notification_list` - 通知列表
- `android_notification_send` - 发送通知
- `android_notification_cancel` - 取消通知

### 硬件
- `android_flashlight` - 手电筒
- `android_vibrate` - 振动
- `android_brightness_set` - 屏幕亮度
- `android_wifi_status` - WiFi 状态
- `android_bluetooth_status` - 蓝牙状态

### 文件
- `android_file_list` - 列出目录
- `android_file_read` - 读取文件
- `android_image_read` - 读取图片
- `android_file_write` - 写入文件
- `android_download_start` - 开始下载

### 相机 / 录音
- `android_camera_photo` - 拍照
- `android_camera_video` - 录像
- `android_recorder_start` / `android_recorder_stop` - 录音

## 重要规则

### 文件路径规则

⚠️ 手机文件路径（如 `/storage/emulated/0/DCIM/`）必须使用 Android 工具读取：

```
✅ android_file_read / android_image_read
❌ 本机 Read 工具（会报 EACCES）
```

### 权限错误处理

若工具返回 `PERMISSION_DENIED`，提示用户：
1. 打开手机设置
2. 找到 Bridge Service 应用
3. 授予对应权限

### 连接检查

若工具调用失败，确认：
1. Bridge Service 应用已启动
2. Termux 中 Gateway 正在运行
3. Operator 已连接到正确的 Gateway 地址

## 相关文档

- [API 参考](docs/api-reference.md)
- [提示词模板](docs/android-bridge-prompt.md)
- [权限指南](docs/permission-guide.md)
- [架构设计](docs/architecture.md)
