---
id: daily-briefing
name: 每日播报
description: 汇总今日日程、未读短信、未接来电、电池状态等关键信息
triggers: 早安,今天有什么事,每日播报,手机状态汇总
tools: android_calendar_events,android_sms_list,android_calllog_list,android_battery_status,android_notification_list
---

## 每日播报工作流

1. **获取今日日程**
   调用 android_calendar_events，筛选今天的事件

2. **获取未读短信**
   调用 android_sms_list { type: "inbox" }，筛选 read=false

3. **获取未接来电**
   调用 android_calllog_list { type: "missed" }，筛选今天的

4. **获取系统状态**
   并行调用：
   - android_battery_status
   - android_storage_info
   - android_network_status

5. **汇总输出**
   格式化展示所有信息，可选语音播报

## 输出模板
📅 今日日程（X项）
📩 未读短信（X条）
📞 未接来电（X通）
🔋 系统状态（电池/存储/网络）
