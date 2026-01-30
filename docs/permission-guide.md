# Android 权限说明

本文档详细说明 Bridge Service 需要的 Android 权限及其用途。

## 权限概览

| 权限 | 用途 | 必需 | 敏感级别 |
|------|------|------|----------|
| INTERNET | 本地 HTTP 服务 | 是 | 低 |
| FOREGROUND_SERVICE | 后台运行 | 是 | 低 |
| POST_NOTIFICATIONS | 显示服务通知 | 是 (Android 13+) | 低 |
| READ_CONTACTS | 读取联系人 | 否 | 高 |
| READ_CALL_LOG | 读取通话记录 | 否 | 高 |
| READ_SMS | 读取短信 | 否 | 高 |
| READ_CALENDAR | 读取日历 | 否 | 中 |
| WRITE_CALENDAR | 写入日历 | 否 | 中 |
| READ_MEDIA_* | 读取媒体文件 | 否 | 中 |
| RECORD_AUDIO | 语音识别 | 否 | 高 |
| QUERY_ALL_PACKAGES | 查询应用列表 | 否 | 中 |

## 详细说明

### 基础权限（必需）

#### INTERNET

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**用途**: Bridge Service 需要创建本地 HTTP 服务器（监听 localhost:18800），供 Gateway 调用。

**说明**: 仅用于本地通信，不涉及外部网络访问。

#### FOREGROUND_SERVICE

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
```

**用途**: 允许 Bridge Service 作为前台服务持续运行，不被系统杀死。

**说明**: 运行时会在通知栏显示服务状态。

#### POST_NOTIFICATIONS (Android 13+)

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**用途**: 在 Android 13 及以上版本显示前台服务通知。

**说明**: 如果拒绝，服务仍可运行，但无法显示状态通知。

---

### 联系人权限

#### READ_CONTACTS

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

**用途**: 读取设备联系人列表和详情。

**相关 API**:
- `GET /api/v1/contacts` - 获取联系人列表
- `GET /api/v1/contacts/:id` - 获取联系人详情

**授权后可访问**:
- 联系人姓名
- 电话号码
- 邮箱地址
- 公司/职位
- 地址
- 备注

#### WRITE_CONTACTS

```xml
<uses-permission android:name="android.permission.WRITE_CONTACTS" />
```

**用途**: 创建、修改或删除联系人。

**相关 API**:
- `POST /api/v1/contacts` - 创建联系人
- `DELETE /api/v1/contacts/:id` - 删除联系人

---

### 通话和短信权限

#### READ_CALL_LOG

```xml
<uses-permission android:name="android.permission.READ_CALL_LOG" />
```

**用途**: 读取通话历史记录。

**相关 API**:
- `GET /api/v1/calllog` - 获取通话记录

**授权后可访问**:
- 通话号码
- 通话类型（来电/去电/未接）
- 通话时间
- 通话时长

**注意**: 这是敏感权限，需要用户明确授权。

#### READ_SMS

```xml
<uses-permission android:name="android.permission.READ_SMS" />
```

**用途**: 读取短信记录。

**相关 API**:
- `GET /api/v1/sms` - 获取短信列表

**授权后可访问**:
- 短信发送方/接收方
- 短信内容
- 发送/接收时间

**注意**: 这是敏感权限，部分应用市场可能限制。

#### CALL_PHONE

```xml
<uses-permission android:name="android.permission.CALL_PHONE" />
```

**用途**: 直接拨打电话（不经过拨号界面）。

**相关 API**:
- 当前实现仅使用 `ACTION_DIAL`（打开拨号界面），不需要此权限

---

### 日历权限

#### READ_CALENDAR

```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
```

**用途**: 读取日历事件。

**相关 API**:
- `GET /api/v1/calendar/events` - 获取日历事件
- `GET /api/v1/calendar/calendars` - 获取日历列表

**授权后可访问**:
- 事件标题、描述、地点
- 开始/结束时间
- 参与者
- 提醒设置

#### WRITE_CALENDAR

```xml
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

**用途**: 创建或修改日历事件。

**相关 API**:
- `POST /api/v1/calendar/events` - 创建日历事件

---

### 媒体权限

#### Android 13+ (API 33+)

```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

**用途**: 分别授权读取图片、音频、视频文件。

#### Android 12 及以下

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
```

**用途**: 读取外部存储中的媒体文件。

**相关 API**:
- `GET /api/v1/media/images` - 获取图片列表
- `GET /api/v1/media/audio` - 获取音频列表
- `GET /api/v1/media/video` - 获取视频列表

---

### 录音权限

#### RECORD_AUDIO

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

**用途**: 语音识别功能需要访问麦克风。

**相关 API**:
- `POST /api/v1/stt/recognize` - 语音识别

**注意**: 仅在使用语音识别功能时需要。

---

### 应用查询权限

#### QUERY_ALL_PACKAGES

```xml
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES"
    tools:ignore="QueryAllPackagesPermission" />
```

**用途**: 查询设备上所有已安装应用的信息。

**相关 API**:
- `GET /api/v1/apps` - 获取应用列表
- `GET /api/v1/apps/:package` - 获取应用详情

**说明**: Android 11+ 要求声明此权限才能获取完整应用列表。

---

### 位置权限

#### ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**用途**: 获取设备位置信息。

**说明**: 当前版本未实现位置 API，保留供将来扩展。

---

## 权限请求流程

### 运行时权限

以下权限需要在运行时请求：

1. **联系人**: READ_CONTACTS, WRITE_CONTACTS
2. **通话记录**: READ_CALL_LOG
3. **短信**: READ_SMS
4. **日历**: READ_CALENDAR, WRITE_CALENDAR
5. **媒体**: READ_MEDIA_*
6. **录音**: RECORD_AUDIO
7. **位置**: ACCESS_*_LOCATION
8. **通知** (Android 13+): POST_NOTIFICATIONS

### 请求时机

Bridge Service 采用 **按需请求** 策略：

1. 应用启动时请求基础权限（通知）
2. 调用特定 API 时，如果缺少权限，返回 `PERMISSION_DENIED` 错误
3. 用户可在应用设置中手动授予权限

### 权限被拒绝

如果 API 调用时权限未授予，将返回：

```json
{
  "ok": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "需要 READ_CONTACTS 权限",
    "details": {
      "permission": "android.permission.READ_CONTACTS",
      "granted": false,
      "canRequest": true
    }
  }
}
```

---

## 权限分组

Android 将权限分组，同一组内的权限授权后自动获得：

| 权限组 | 包含权限 |
|--------|----------|
| 联系人 | READ_CONTACTS, WRITE_CONTACTS |
| 电话 | READ_CALL_LOG, READ_PHONE_STATE, CALL_PHONE |
| 短信 | READ_SMS, SEND_SMS, RECEIVE_SMS |
| 日历 | READ_CALENDAR, WRITE_CALENDAR |
| 存储 | READ_MEDIA_*, READ_EXTERNAL_STORAGE |
| 麦克风 | RECORD_AUDIO |
| 位置 | ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION |

---

## 最小权限配置

如果只需要部分功能，可以修改 `AndroidManifest.xml` 移除不需要的权限：

### 仅系统信息和应用管理

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />
```

### 添加联系人支持

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

### 添加日历支持

```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

---

## 隐私保护建议

1. **最小权限原则**: 仅授予必要的权限
2. **定期审查**: 定期检查授予的权限
3. **敏感数据**: 联系人、短信、通话记录等敏感数据通过本地接口访问，不上传到外部服务器
4. **服务安全**: Bridge Service 仅监听 localhost，外部无法直接访问
5. **日志脱敏**: 日志中自动脱敏敏感信息

---

## 常见问题

### Q: 为什么需要这么多权限？

Bridge Service 旨在让 AI Agent 能够操作 Android 设备，因此需要相应的系统权限。您可以根据实际需求只授予部分权限。

### Q: 权限被拒绝后如何重新授权？

1. 打开 **设置 > 应用 > Moltbot Bridge**
2. 点击 **权限**
3. 开启所需权限

### Q: 可以只授予部分权限吗？

可以。Bridge Service 支持按需授权，未授权的功能会返回权限错误，不影响其他功能使用。

### Q: 数据会上传到服务器吗？

不会。所有数据仅通过本地 HTTP 接口（localhost）传输，不涉及外部网络。
