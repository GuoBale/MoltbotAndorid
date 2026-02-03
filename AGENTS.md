# Android Bridge Gateway - Agent 配置

本文件说明本项目中的工具与场景能力。**这些 Skill 仅在手机上使用**（通过连接手机 Gateway 的 Operator/飞书等客户端），**不在 Cursor 中加载或使用**。

## 项目概述

OpenClaw Android Gateway 项目，使 AI Agent 能够通过 Gateway 调用 Android 设备的系统 API 和应用。场景（每日播报、快捷操作、联系人分析等）内置在 **gateway-extension** 插件中，随 Gateway 在手机上启动时加载；用户在 Operator/飞书中对话即可触发。

详见：[手机上如何使用这些 Skill](docs/skills-usage-on-phone.md)、[Skill 加载说明](docs/skills-loading.md)。

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

### 邮件
- `android_email_accounts` - 邮件账户列表
- `android_email_compose` - 打开写邮件界面
- `android_email_open_inbox` - 打开收件箱

### 应用
- `android_apps_list` - 应用列表
- `android_app_info` - 应用详情
- `android_app_launch` - 启动应用
- `android_app_shortcut_open` - 打开快捷方式（微信扫一扫等）

### 日历
- `android_calendar_list` - 日历列表
- `android_calendar_events` - 日历事件
- `android_calendar_create_event` - 创建事件
- `android_calendar_delete_event` - 删除事件

### 剪贴板 / TTS
- `android_clipboard_get` - 读取剪贴板
- `android_clipboard_set` - 设置剪贴板
- `android_tts_speak` - 语音播报
- `android_share` - 分享内容
- `android_open_url` - 打开 URL

### 浏览器
- `android_browser_list` - 列出可用的浏览器
- `android_browser_open` - 打开 URL（可指定浏览器包名）
- `android_browser_launch` - 打开默认浏览器
- `android_browser_incognito` - 无痕模式打开 URL（需 Chrome）

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
