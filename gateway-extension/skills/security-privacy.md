---
id: security-privacy
name: 安全隐私检查
description: 检查应用权限、未知应用、存储安全、系统状态
triggers: 检查手机安全,有没有可疑应用,隐私检查,手机健康
tools: android_device_info,android_root_status,android_apps_list,android_app_info,android_storage_info,android_battery_status,android_network_status
---

## 安全检查

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
⚠️ 风险提示（如有）
