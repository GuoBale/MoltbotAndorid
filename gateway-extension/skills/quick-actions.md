---
id: quick-actions
name: 快捷操作
description: 一句话完成常用操作：扫码、付款、手电筒、音量、闹钟等
triggers: 扫一扫,付款码,打开手电筒,调音量,设闹钟,静音
tools: android_app_shortcut_open,android_flashlight,android_volume_set,android_ringer_mode,android_alarm_set
---

## 快捷操作速查

| 用户说 | 执行 |
|--------|------|
| 微信扫一扫 | android_app_shortcut_open { app: "wechat", action: "scan" } |
| 支付宝付款码 | android_app_shortcut_open { app: "alipay", action: "paycode" } |
| 打开手电筒 | android_flashlight { action: "on" } |
| 关闭手电筒 | android_flashlight { action: "off" } |
| 调高音量 | android_volume_adjust { stream: "music", direction: "up" } |
| 静音 | android_ringer_mode { mode: "silent" } |
| 振动模式 | android_ringer_mode { mode: "vibrate" } |
| 设置闹钟 7 点 | android_alarm_set { hour: 7, minute: 0 } |
| 勿扰模式 | android_dnd { action: "enable" } |
