---
id: contact-intelligence
name: 联系人智能分析
description: 分析通讯频率、识别重要联系人、失联提醒
triggers: 谁联系最多,重要联系人,失联提醒,分析通讯录
tools: android_contacts_list,android_contacts_get,android_calllog_list,android_calllog_stats,android_sms_list
---

## 联系人分析工作流

### 重要联系人识别
1. android_calllog_stats - 获取通话统计
2. android_sms_list { limit: 200 } - 获取短信，按发送者聚合
3. 计算综合得分 = 通话次数 × 2 + 短信数量
4. 排序得出 Top 10

### 失联提醒
1. android_contacts_list - 获取全部联系人
2. android_calllog_list - 获取通话记录
3. android_sms_list - 获取短信记录
4. 找出超过 30/60/90 天未联系的联系人

### 快速拨号
1. android_contacts_list { query: "姓名" }
2. 确认号码后 android_dial { number: "xxx" }
