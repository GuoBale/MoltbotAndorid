/**
 * Android Bridge 场景指南
 * 
 * 提供各种手机操作场景的指导和工作流
 */

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  workflow: string;
  tools: string[];
}

/**
 * 所有可用场景
 */
export const scenarios: Record<string, ScenarioInfo> = {
  'daily-briefing': {
    id: 'daily-briefing',
    name: '每日播报',
    description: '汇总今日日程、未读短信、未接来电、电池状态等关键信息',
    triggers: ['早安', '今天有什么事', '每日播报', '手机状态汇总'],
    tools: ['android_calendar_events', 'android_sms_list', 'android_calllog_list', 'android_battery_status', 'android_notification_list'],
    workflow: `## 每日播报工作流

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
🔋 系统状态（电池/存储/网络）`
  },

  'quick-actions': {
    id: 'quick-actions',
    name: '快捷操作',
    description: '一句话完成常用操作：扫码、付款、手电筒、音量、闹钟等',
    triggers: ['扫一扫', '付款码', '打开手电筒', '调音量', '设闹钟', '静音'],
    tools: ['android_app_shortcut_open', 'android_flashlight', 'android_volume_set', 'android_ringer_mode', 'android_alarm_set'],
    workflow: `## 快捷操作速查

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
| 勿扰模式 | android_dnd { action: "enable" } |`
  },

  'contact-intelligence': {
    id: 'contact-intelligence',
    name: '联系人智能分析',
    description: '分析通讯频率、识别重要联系人、失联提醒',
    triggers: ['谁联系最多', '重要联系人', '失联提醒', '分析通讯录'],
    tools: ['android_contacts_list', 'android_contacts_get', 'android_calllog_list', 'android_calllog_stats', 'android_sms_list'],
    workflow: `## 联系人分析工作流

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
2. 确认号码后 android_dial { number: "xxx" }`
  },

  'automation-workflows': {
    id: 'automation-workflows',
    name: '自动化工作流',
    description: '组合多个操作完成复杂任务：睡前模式、起床模式、会议模式',
    triggers: ['睡觉模式', '晚安', '早安', '起床模式', '会议模式', '外出模式'],
    tools: ['android_dnd', 'android_brightness_set', 'android_alarm_set', 'android_volume_set', 'android_ringer_mode', 'android_calendar_events', 'android_tts_speak'],
    workflow: `## 场景自动化

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
3. android_notification_send { title: "会议中", content: "手机已静音" }`
  },

  'photo-assistant': {
    id: 'photo-assistant',
    name: '相册助手',
    description: '浏览相册、拍照、分析图片内容',
    triggers: ['看看相册', '最近的照片', '帮我拍照', '这张图是什么'],
    tools: ['android_file_list', 'android_image_read', 'android_camera_photo', 'android_camera_video'],
    workflow: `## 相册操作

### 浏览相册
1. android_file_list { path: "/storage/emulated/0/DCIM/Camera" }
2. 选择要查看的图片
3. android_image_read { path: "图片路径" }

### 拍照
android_camera_photo { facing: "back" }

### 重要规则
⚠️ 手机路径必须用 android_file_read / android_image_read 读取
❌ 不要用本机 Read 工具读手机路径，会报 EACCES

### 常用路径
- /storage/emulated/0/DCIM/Camera - 相机照片
- /storage/emulated/0/Pictures/Screenshots - 截图
- /storage/emulated/0/Pictures/WeiXin - 微信图片`
  },

  'location-navigator': {
    id: 'location-navigator',
    name: '位置导航',
    description: '获取当前位置、地址查询、导航到目的地',
    triggers: ['我在哪', '当前位置', '导航到', '这个地址在哪'],
    tools: ['android_location_current', 'android_location_last', 'android_geocode', 'android_reverse_geocode', 'android_open_url'],
    workflow: `## 位置服务

### 获取当前位置
1. android_location_current - 获取经纬度
2. android_reverse_geocode { latitude, longitude } - 转为地址

### 地址转坐标
android_geocode { address: "北京故宫" }

### 导航到目的地
1. android_geocode { address: "目的地" } - 获取坐标
2. android_open_url { url: "导航URL" }

导航 URL 格式：
- 高德：androidamap://navi?lat=纬度&lon=经度
- 百度：baidumap://map/direction?destination=纬度,经度`
  },

  'security-privacy': {
    id: 'security-privacy',
    name: '安全隐私检查',
    description: '检查应用权限、未知应用、存储安全、系统状态',
    triggers: ['检查手机安全', '有没有可疑应用', '隐私检查', '手机健康'],
    tools: ['android_device_info', 'android_root_status', 'android_apps_list', 'android_app_info', 'android_storage_info', 'android_battery_status', 'android_network_status'],
    workflow: `## 安全检查

### 全面安全扫描
1. android_device_info - 系统版本
2. android_root_status - Root 状态
3. android_apps_list { type: "user" } - 用户应用
4. android_storage_info - 存储状态
5. android_network_status - 网络安全

### 应用权限审计
1. android_apps_list { type: "user" }
2. 对每个应用调用 android_app_info
3. 分析敏感权限（相机、麦克风、位置、短信等）

### 输出模板
🔒 系统状态（Android 版本、Root 状态）
📱 应用检查（总数、非商店安装数）
💾 存储安全（使用率、可用空间）
⚠️ 风险提示（如有）`
  }
};

/**
 * 获取场景列表
 */
export function listScenarios(): ScenarioInfo[] {
  return Object.values(scenarios);
}

/**
 * 获取场景详情
 */
export function getScenario(id: string): ScenarioInfo | null {
  return scenarios[id] || null;
}

/**
 * 根据触发词匹配场景
 */
export function matchScenario(query: string): ScenarioInfo | null {
  const lowerQuery = query.toLowerCase();
  for (const scenario of Object.values(scenarios)) {
    for (const trigger of scenario.triggers) {
      if (lowerQuery.includes(trigger.toLowerCase())) {
        return scenario;
      }
    }
  }
  return null;
}

/**
 * 生成系统提示词
 */
export function generateSystemPrompt(): string {
  return `你已通过 Gateway 连接用户手机，具备以下 Android 桥接能力。请优先调用 android_* 工具完成任务，不要回答「无法访问」「没有权限」。

【能力概览】
- 系统：android_device_info、android_battery_status、android_network_status、android_storage_info、android_root_status
- 通讯：android_contacts_list、android_contacts_get、android_sms_list、android_sms_send、android_calllog_list、android_calllog_stats、android_dial
- 应用：android_apps_list、android_app_info、android_app_launch、android_app_shortcut_open（微信扫一扫/支付宝付款码等）
- 日历：android_calendar_list、android_calendar_events、android_calendar_create_event
- 剪贴板/TTS/分享：android_clipboard_get、android_clipboard_set、android_tts_speak、android_share、android_open_url
- 位置：android_location_current、android_location_last、android_geocode、android_reverse_geocode
- 音量/闹钟/勿扰：android_volume_get、android_volume_set、android_ringer_mode、android_alarm_set、android_timer_set、android_dnd
- 通知：android_notification_list、android_notification_send、android_notification_cancel
- 硬件：android_flashlight、android_vibrate、android_brightness_set、android_wifi_status、android_bluetooth_status
- 文件：android_file_list、android_file_read、android_image_read、android_file_write、android_download_start
- 相机/录音：android_camera_photo、android_camera_video、android_recorder_start、android_recorder_stop

【重要规则】
1. 手机路径（如 /storage/emulated/0/DCIM/...）必须用 android_file_read 或 android_image_read 读取，不要用本机 Read 工具。
2. 用户问「通讯录」「联系人」「短信」「打开微信扫一扫」等时，直接调用对应 android_* 工具。

【可用场景】
${Object.values(scenarios).map(s => `- ${s.name}：${s.description}`).join('\n')}

使用 android_scenario_guide 工具获取具体场景的操作指南。`;
}
