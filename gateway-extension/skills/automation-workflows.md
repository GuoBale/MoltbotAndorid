---
id: automation-workflows
name: 自动化工作流
description: 组合多个操作完成复杂任务：睡前模式、起床模式、会议模式
triggers: 睡觉模式,晚安,早安,起床模式,会议模式,外出模式
tools: android_dnd,android_brightness_set,android_alarm_set,android_volume_set,android_ringer_mode,android_calendar_events,android_tts_speak
---

## 场景自动化

### 睡前模式
1. android_dnd { action: "enable" } - 开启勿扰
2. android_brightness_set { percentage: 20 } - 调暗屏幕
3. android_alarm_set { hour: 7, minute: 0 } - 设置闹钟
4. android_volume_set { stream: "music", percentage: 20 } - 调低音量
5. android_calendar_events - 查看明日日程
6. android_tts_speak { text: "晚安，已开启勿扰模式" }

### 起床模式
1. android_dnd { action: "disable" } - 关闭勿扰
2. android_brightness_set { percentage: 80 } - 恢复亮度
3. android_ringer_mode { mode: "normal" } - 恢复铃声
4. android_calendar_events - 查看今日日程
5. android_sms_list / android_notification_list - 查看未读信息
6. android_tts_speak { text: "早上好，今天有 X 项日程" }

### 会议模式
1. android_ringer_mode { mode: "vibrate" } - 振动模式
2. android_dnd { action: "enable" } - 开启勿扰
3. android_notification_send { title: "会议中", content: "手机已静音" }
