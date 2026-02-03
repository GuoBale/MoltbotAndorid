---
id: location-navigator
name: 位置导航
description: 获取当前位置、地址查询、导航到目的地
triggers: 我在哪,当前位置,导航到,这个地址在哪
tools: android_location_current,android_location_last,android_geocode,android_reverse_geocode,android_open_url
---

## 位置服务

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
- 百度：baidumap://map/direction?destination=纬度,经度
