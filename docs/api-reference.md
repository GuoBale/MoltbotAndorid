# Bridge Service API 参考文档

本文档描述 Bridge Service 提供的 REST API 接口。

## 概述

### 基础信息

| 项目 | 值 |
|------|------|
| 基础 URL | `http://localhost:18800/api/v1` |
| 协议 | HTTP/1.1 |
| 内容类型 | application/json |
| 字符编码 | UTF-8 |

### 认证

Bridge Service 仅监听 localhost，默认不需要认证。如需启用认证：

```
X-Bridge-Token: <your-token>
```

### 响应格式

**成功响应**:
```json
{
  "ok": true,
  "data": { ... },
  "meta": {
    "timestamp": 1706500000000,
    "duration_ms": 42
  }
}
```

**错误响应**:
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

### 错误码

| 错误码 | HTTP 状态 | 描述 |
|--------|----------|------|
| `PERMISSION_DENIED` | 403 | 缺少所需权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `INVALID_PARAMS` | 400 | 参数无效 |
| `INTERNAL_ERROR` | 500 | 内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

---

## 系统 API

### 健康检查

```
GET /api/v1/health
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "status": "running",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

### 获取设备信息

```
GET /api/v1/system/info
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "manufacturer": "Samsung",
    "model": "Galaxy S21",
    "device": "o1s",
    "brand": "samsung",
    "androidVersion": "13",
    "sdkVersion": 33,
    "buildId": "TP1A.220624.014",
    "fingerprint": "samsung/o1sxxx/...",
    "hardware": "exynos2100",
    "displayMetrics": {
      "widthPixels": 1080,
      "heightPixels": 2400,
      "density": 2.75
    }
  }
}
```

### 获取电池状态

```
GET /api/v1/system/battery
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "level": 85,
    "status": "charging",
    "plugged": "ac",
    "health": "good",
    "temperature": 28.5,
    "voltage": 4200
  }
}
```

**status 值**:
- `charging` - 充电中
- `discharging` - 放电中
- `full` - 已充满
- `not_charging` - 未充电
- `unknown` - 未知

### 获取网络状态

```
GET /api/v1/system/network
```

**权限**: `ACCESS_NETWORK_STATE`

**响应**:
```json
{
  "ok": true,
  "data": {
    "isConnected": true,
    "type": "wifi",
    "wifiInfo": {
      "ssid": "MyNetwork",
      "bssid": "00:11:22:33:44:55",
      "rssi": -45,
      "linkSpeed": 866,
      "frequency": 5180,
      "ipAddress": "192.168.1.100"
    }
  }
}
```

---

## 联系人 API

### 获取联系人列表

```
GET /api/v1/contacts
```

**权限**: `READ_CONTACTS`

**参数**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| q | string | 否 | 搜索关键词 |
| limit | number | 否 | 返回数量限制，默认 100 |
| offset | number | 否 | 偏移量，用于分页 |

**示例**:
```
GET /api/v1/contacts?q=张&limit=10
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "contacts": [
      {
        "id": "123",
        "displayName": "张三",
        "phoneNumbers": [
          {
            "number": "+8613800138000",
            "type": "mobile"
          }
        ],
        "emails": [
          {
            "address": "zhangsan@example.com",
            "type": "work"
          }
        ],
        "photoUri": "content://contacts/123/photo"
      }
    ],
    "total": 150,
    "hasMore": true
  }
}
```

### 获取联系人详情

```
GET /api/v1/contacts/:id
```

**权限**: `READ_CONTACTS`

**响应**:
```json
{
  "ok": true,
  "data": {
    "id": "123",
    "displayName": "张三",
    "phoneNumbers": [...],
    "emails": [...],
    "addresses": [
      {
        "formatted": "北京市朝阳区xxx",
        "type": "home"
      }
    ],
    "organization": {
      "company": "某公司",
      "title": "工程师"
    },
    "birthday": "1990-01-01",
    "note": "备注信息"
  }
}
```

### 创建联系人

```
POST /api/v1/contacts
```

**权限**: `WRITE_CONTACTS`

**请求体**:
```json
{
  "displayName": "李四",
  "phoneNumbers": [
    {
      "number": "+8613900139000",
      "type": "mobile"
    }
  ],
  "emails": [
    {
      "address": "lisi@example.com",
      "type": "work"
    }
  ]
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "id": "456",
    "displayName": "李四"
  }
}
```

### 删除联系人

```
DELETE /api/v1/contacts/:id
```

**权限**: `WRITE_CONTACTS`

---

## 应用 API

### 获取应用列表

```
GET /api/v1/apps
```

**权限**: `QUERY_ALL_PACKAGES`

**参数**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| type | string | 否 | `user`/`system`/`all`，默认 `user` |
| q | string | 否 | 搜索应用名称 |

**响应**:
```json
{
  "ok": true,
  "data": {
    "apps": [
      {
        "packageName": "com.example.app",
        "appName": "示例应用",
        "versionName": "1.2.3",
        "versionCode": 123,
        "isSystemApp": false,
        "installedAt": 1706400000000,
        "updatedAt": 1706450000000
      }
    ],
    "total": 85
  }
}
```

### 获取应用详情

```
GET /api/v1/apps/:packageName
```

**权限**: `QUERY_ALL_PACKAGES`

**响应**:
```json
{
  "ok": true,
  "data": {
    "packageName": "com.example.app",
    "appName": "示例应用",
    "versionName": "1.2.3",
    "versionCode": 123,
    "isSystemApp": false,
    "targetSdkVersion": 33,
    "minSdkVersion": 24,
    "permissions": [
      "android.permission.INTERNET",
      "android.permission.CAMERA"
    ],
    "activities": [
      {
        "name": "com.example.app.MainActivity",
        "exported": true
      }
    ],
    "installedAt": 1706400000000,
    "updatedAt": 1706450000000,
    "dataDir": "/data/data/com.example.app",
    "apkPath": "/data/app/com.example.app-xxx/base.apk"
  }
}
```

### 启动应用

```
POST /api/v1/apps/launch
```

**请求体**:
```json
{
  "package": "com.example.app",
  "activity": "MainActivity",
  "extras": {
    "key": "value"
  }
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "launched": true,
    "timestamp": 1706500000000
  }
}
```

---

## 媒体 API

### 获取图片列表

```
GET /api/v1/media/images
```

**权限**: `READ_MEDIA_IMAGES`

**参数**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| limit | number | 否 | 返回数量限制 |
| offset | number | 否 | 偏移量 |
| sortBy | string | 否 | `date`/`size`/`name` |
| order | string | 否 | `asc`/`desc` |

**响应**:
```json
{
  "ok": true,
  "data": {
    "images": [
      {
        "id": "123",
        "uri": "content://media/external/images/media/123",
        "displayName": "IMG_20240129.jpg",
        "mimeType": "image/jpeg",
        "size": 2048576,
        "width": 1920,
        "height": 1080,
        "dateTaken": 1706500000000,
        "relativePath": "DCIM/Camera"
      }
    ],
    "total": 1500,
    "hasMore": true
  }
}
```

### 获取音频列表

```
GET /api/v1/media/audio
```

**权限**: `READ_MEDIA_AUDIO`

**响应**:
```json
{
  "ok": true,
  "data": {
    "audio": [
      {
        "id": "456",
        "uri": "content://media/external/audio/media/456",
        "displayName": "song.mp3",
        "mimeType": "audio/mpeg",
        "size": 5242880,
        "duration": 180000,
        "artist": "艺术家",
        "album": "专辑名",
        "title": "歌曲名"
      }
    ]
  }
}
```

### 获取视频列表

```
GET /api/v1/media/video
```

**权限**: `READ_MEDIA_VIDEO`

**响应**:
```json
{
  "ok": true,
  "data": {
    "videos": [
      {
        "id": "789",
        "uri": "content://media/external/video/media/789",
        "displayName": "video.mp4",
        "mimeType": "video/mp4",
        "size": 104857600,
        "duration": 60000,
        "width": 1920,
        "height": 1080
      }
    ]
  }
}
```

---

## 日历 API

### 获取日历事件

```
GET /api/v1/calendar/events
```

**权限**: `READ_CALENDAR`

**参数**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| startTime | number | 否 | 开始时间戳 |
| endTime | number | 否 | 结束时间戳 |
| limit | number | 否 | 返回数量限制 |

**响应**:
```json
{
  "ok": true,
  "data": {
    "events": [
      {
        "id": "123",
        "title": "团队会议",
        "description": "讨论项目进度",
        "location": "会议室A",
        "startTime": 1706500000000,
        "endTime": 1706503600000,
        "allDay": false,
        "timezone": "Asia/Shanghai",
        "calendarId": "1",
        "calendarName": "我的日历",
        "attendees": [
          {
            "email": "user@example.com",
            "name": "用户",
            "status": "accepted"
          }
        ],
        "reminders": [
          {
            "minutes": 15,
            "method": "alert"
          }
        ]
      }
    ]
  }
}
```

### 创建日历事件

```
POST /api/v1/calendar/events
```

**权限**: `WRITE_CALENDAR`

**请求体**:
```json
{
  "title": "新会议",
  "description": "会议描述",
  "location": "线上",
  "startTime": 1706600000000,
  "endTime": 1706603600000,
  "allDay": false,
  "calendarId": "1",
  "reminders": [
    { "minutes": 30, "method": "alert" }
  ]
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "id": "456",
    "title": "新会议"
  }
}
```

---

## 语音 API

### 文本转语音 (TTS)

```
POST /api/v1/tts/speak
```

**请求体**:
```json
{
  "text": "你好，世界",
  "language": "zh-CN",
  "pitch": 1.0,
  "rate": 1.0,
  "queueMode": "flush"
}
```

**参数说明**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| text | string | 是 | 要朗读的文本 |
| language | string | 否 | 语言代码，默认 `zh-CN` |
| pitch | number | 否 | 音调，0.5-2.0，默认 1.0 |
| rate | number | 否 | 语速，0.5-2.0，默认 1.0 |
| queueMode | string | 否 | `flush`/`add`，默认 `flush` |

**响应**:
```json
{
  "ok": true,
  "data": {
    "started": true,
    "utteranceId": "tts_123"
  }
}
```

### 停止语音

```
POST /api/v1/tts/stop
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "stopped": true
  }
}
```

### 语音识别 (STT)

```
POST /api/v1/stt/recognize
```

**权限**: `RECORD_AUDIO`

**请求体**:
```json
{
  "language": "zh-CN",
  "maxDuration": 10000,
  "partialResults": false
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "text": "识别出的文本",
    "confidence": 0.95,
    "alternatives": [
      {
        "text": "备选文本",
        "confidence": 0.8
      }
    ]
  }
}
```

---

## 剪贴板 API

### 获取剪贴板内容

```
GET /api/v1/clipboard
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "hasContent": true,
    "text": "剪贴板文本内容",
    "htmlText": null,
    "uri": null
  }
}
```

### 设置剪贴板内容

```
POST /api/v1/clipboard
```

**请求体**:
```json
{
  "text": "要复制的内容",
  "label": "复制标签"
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "copied": true
  }
}
```

---

## Intent API

### 发送 Intent

```
POST /api/v1/intent/send
```

**请求体**:
```json
{
  "action": "android.intent.action.VIEW",
  "data": "https://www.example.com",
  "type": null,
  "category": ["android.intent.category.DEFAULT"],
  "extras": {
    "key": "value"
  },
  "package": null,
  "component": null,
  "flags": ["FLAG_ACTIVITY_NEW_TASK"]
}
```

**常用 Action**:
- `android.intent.action.VIEW` - 查看
- `android.intent.action.SEND` - 分享
- `android.intent.action.DIAL` - 拨号
- `android.intent.action.SENDTO` - 发送到

**响应**:
```json
{
  "ok": true,
  "data": {
    "sent": true
  }
}
```

### 分享内容

```
POST /api/v1/intent/share
```

**请求体**:
```json
{
  "text": "分享的文本",
  "title": "选择分享方式",
  "type": "text/plain"
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "shared": true
  }
}
```

---

## 通知 API

### 发送通知

```
POST /api/v1/notification/send
```

**权限**: `POST_NOTIFICATIONS`

**请求体**:
```json
{
  "title": "通知标题",
  "content": "通知内容",
  "channelId": "default",
  "priority": "high",
  "autoCancel": true,
  "actions": [
    {
      "title": "查看",
      "action": "VIEW"
    }
  ]
}
```

**响应**:
```json
{
  "ok": true,
  "data": {
    "notificationId": 12345
  }
}
```

### 获取通知列表

```
GET /api/v1/notification/list
```

**权限**: 需要启用 `NotificationListenerService`

**响应**:
```json
{
  "ok": true,
  "data": {
    "notifications": [
      {
        "id": "notification_123",
        "packageName": "com.example.app",
        "title": "新消息",
        "text": "您收到一条新消息",
        "postTime": 1706500000000,
        "isClearable": true
      }
    ]
  }
}
```

---

## 通话记录 API

### 获取通话记录

```
GET /api/v1/calllog
```

**权限**: `READ_CALL_LOG`

**参数**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| type | string | 否 | `incoming`/`outgoing`/`missed`/`all` |
| limit | number | 否 | 返回数量限制 |
| startTime | number | 否 | 开始时间戳 |

**响应**:
```json
{
  "ok": true,
  "data": {
    "calls": [
      {
        "id": "123",
        "number": "+8613800138000",
        "name": "张三",
        "type": "incoming",
        "date": 1706500000000,
        "duration": 120,
        "isNew": false
      }
    ]
  }
}
```

---

## 短信 API

### 获取短信列表

```
GET /api/v1/sms
```

**权限**: `READ_SMS`

**参数**:

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| type | string | 否 | `inbox`/`sent`/`all` |
| limit | number | 否 | 返回数量限制 |
| address | string | 否 | 筛选特定号码 |

**响应**:
```json
{
  "ok": true,
  "data": {
    "messages": [
      {
        "id": "123",
        "address": "+8613800138000",
        "body": "短信内容",
        "date": 1706500000000,
        "type": "inbox",
        "read": true
      }
    ]
  }
}
```

---

## 闹钟 API

### 设置闹钟

```
POST /api/v1/alarm/set
```

**权限**: `SET_ALARM`

**请求体**:
```json
{
  "hour": 7,
  "minute": 30,
  "message": "起床",
  "days": [1, 2, 3, 4, 5],
  "vibrate": true,
  "skipUi": false
}
```

**days 说明**: 1=周一, 2=周二, ..., 7=周日

**响应**:
```json
{
  "ok": true,
  "data": {
    "set": true
  }
}
```
