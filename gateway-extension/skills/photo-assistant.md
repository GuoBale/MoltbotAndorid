---
id: photo-assistant
name: 相册助手
description: 浏览相册、拍照、分析图片内容
triggers: 看看相册,最近的照片,帮我拍照,这张图是什么
tools: android_file_list,android_image_read,android_camera_photo,android_camera_video
---

## 相册操作

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
- /storage/emulated/0/Pictures/WeiXin - 微信图片
