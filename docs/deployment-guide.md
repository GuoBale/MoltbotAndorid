# Moltbot Gateway Android 部署指南

本指南详细说明如何在 Android 设备上部署 moltbot Gateway，使其能够调用 Android 系统 API。

## 目录

1. [环境要求](#1-环境要求)
2. [安装 Termux](#2-安装-termux)
3. [配置 Node.js 环境](#3-配置-nodejs-环境)
4. [安装 moltbot Gateway](#4-安装-moltbot-gateway)
5. [安装 Bridge Service](#5-安装-bridge-service)
6. [配置和启动](#6-配置和启动)
7. [验证部署](#7-验证部署)
8. [故障排除](#8-故障排除)

## 1. 环境要求

### 1.1 硬件要求

| 要求 | 最低配置 | 推荐配置 |
|------|----------|----------|
| Android 版本 | 7.0 (API 24) | 12.0+ (API 31) |
| RAM | 4GB | 8GB+ |
| 存储空间 | 2GB 可用 | 5GB+ 可用 |
| CPU | ARM64 | ARM64 |

### 1.2 网络要求

- 本地网络访问（localhost 通信）
- 如需远程访问，需要设备 IP 可达

### 1.3 所需应用

| 应用 | 来源 | 用途 |
|------|------|------|
| Termux | F-Droid | Linux 终端环境 |
| Bridge Service | 本项目 | Android API 桥接 |

## 2. 安装 Termux

### 2.1 从 F-Droid 安装

> **重要**: 请勿从 Google Play Store 安装 Termux，该版本已过时且无法正常工作。

1. 访问 [F-Droid 官网](https://f-droid.org/) 下载 F-Droid 客户端
2. 安装 F-Droid APK
3. 打开 F-Droid，搜索 "Termux"
4. 安装 Termux 应用

### 2.2 初始配置

打开 Termux，执行以下命令：

```bash
# 更新包管理器
pkg update && pkg upgrade -y

# 授予存储权限（可选，用于访问共享存储）
termux-setup-storage
```

### 2.3 配置 Termux 保持运行

为防止 Android 系统杀死 Termux 进程：

1. 进入 **设置 > 应用 > Termux**
2. 关闭 **电池优化**
3. 允许 **后台运行**

## 3. 配置 Node.js 环境

### 3.1 安装 Node.js

```bash
# 安装 Node.js LTS 版本
pkg install nodejs-lts

# 验证安装
node -v    # 应显示 v22.x.x 或更高
npm -v     # 应显示 10.x.x 或更高
```

### 3.2 安装常用工具

```bash
# 安装 git
pkg install git

# 安装 pnpm（可选，但推荐）
npm install -g pnpm
```

### 3.3 配置 npm

```bash
# 设置 npm 镜像（中国用户推荐）
npm config set registry https://registry.npmmirror.com

# 创建全局包目录
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global

# 添加到 PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 4. 安装 moltbot Gateway

### 4.1 方式一：从 npm 安装

```bash
# 全局安装 moltbot
npm install -g moltbot

# 验证安装
moltbot --version
```

### 4.2 方式二：从源码安装

```bash
# 克隆仓库
git clone https://github.com/moltbot/moltbot.git
cd moltbot

# 安装依赖
pnpm install

# 构建
pnpm build

# 链接到全局
pnpm link --global
```

### 4.3 初始化 Gateway

```bash
# 初始化配置
moltbot gateway init

# 配置文件位置: ~/.clawdbot/moltbot.json
```

### 4.4 安装 Gateway 扩展

```bash
# 进入扩展目录
cd ~/gateway-extension

# 安装依赖
npm install

# 构建扩展
npm run build
```

## 5. 安装 Bridge Service

### 5.1 方式一：安装预构建 APK

```bash
# 从发布页面下载 APK
# https://github.com/your-repo/releases

# 使用 adb 安装（需要电脑）
adb install bridge-service.apk

# 或直接在设备上通过文件管理器安装
```

### 5.2 方式二：从源码构建

在开发机上：

```bash
# 进入 android 目录
cd android

# 构建 Release APK
./gradlew :app:assembleRelease

# APK 位置
# android/app/build/outputs/apk/release/app-release.apk
```

### 5.3 授予权限

安装后打开 Bridge Service 应用：

1. 点击 **授予权限** 按钮
2. 根据需要授予以下权限：

| 权限 | 功能 | 必需 |
|------|------|------|
| 联系人 | 读取/写入联系人 | 可选 |
| 通话记录 | 读取通话记录 | 可选 |
| 短信 | 读取短信 | 可选 |
| 存储/媒体 | 访问媒体文件 | 可选 |
| 日历 | 读取/写入日历 | 可选 |
| 麦克风 | 语音识别 | 可选 |
| 位置 | 获取位置 | 可选 |

### 5.4 启动 Bridge Service

1. 打开 Bridge Service 应用
2. 点击 **启动服务** 按钮
3. 确认通知栏显示 "Bridge Service 运行中"

## 6. 配置和启动

### 6.1 配置 Gateway 扩展

编辑 `~/.clawdbot/moltbot.json`：

```json
{
  "gateway": {
    "port": 18789,
    "extensions": [
      "~/gateway-extension/dist/index.js"
    ]
  },
  "android": {
    "bridge": {
      "host": "127.0.0.1",
      "port": 18800
    }
  }
}
```

### 6.2 启动 Gateway

在 Termux 中：

```bash
# 前台运行（调试用）
moltbot gateway

# 或后台运行
moltbot gateway &

# 使用 nohup 保持运行
nohup moltbot gateway > gateway.log 2>&1 &
```

### 6.3 创建启动脚本

创建 `~/start-gateway.sh`：

```bash
#!/bin/bash

# 检查 Bridge Service 是否运行
check_bridge() {
    curl -s http://localhost:18800/api/v1/health > /dev/null 2>&1
    return $?
}

# 等待 Bridge Service
echo "等待 Bridge Service..."
for i in {1..30}; do
    if check_bridge; then
        echo "Bridge Service 已就绪"
        break
    fi
    sleep 1
done

if ! check_bridge; then
    echo "错误: Bridge Service 未运行，请先启动 Bridge Service 应用"
    exit 1
fi

# 启动 Gateway
echo "启动 Gateway..."
exec moltbot gateway --port 18789
```

```bash
chmod +x ~/start-gateway.sh
```

### 6.4 配置开机自启（可选）

在 Termux 中安装 Termux:Boot：

```bash
# 从 F-Droid 安装 Termux:Boot

# 创建启动脚本
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/start-gateway.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
sleep 10  # 等待系统完全启动
~/start-gateway.sh
EOF

chmod +x ~/.termux/boot/start-gateway.sh
```

## 7. 验证部署

### 7.1 检查 Bridge Service

```bash
# 健康检查
curl http://localhost:18800/api/v1/health

# 预期响应
# {"ok":true,"data":{"status":"running","uptime":123}}
```

### 7.2 检查 Gateway

```bash
# 健康检查
curl http://localhost:18789/health

# 检查 Android 工具是否加载
moltbot gateway tools
# 应显示 android_* 开头的工具
```

### 7.3 测试 Android API 调用

```bash
# 测试获取设备信息
curl http://localhost:18800/api/v1/system/info

# 测试获取联系人（需要权限）
curl http://localhost:18800/api/v1/contacts?limit=5
```

### 7.4 从外部设备连接

1. 获取 Android 设备 IP：
```bash
# 在 Termux 中
ip addr show wlan0 | grep inet
```

2. 在外部设备上连接：
```bash
# WebSocket 连接
wscat -c ws://<device-ip>:18789
```

## 8. 故障排除

### 8.1 常见问题

#### Q: Termux 包更新失败
```bash
# 更换镜像源
termux-change-repo
# 选择一个可用的镜像
```

#### Q: Node.js 版本过低
```bash
# 检查当前版本
node -v

# 如果低于 22，尝试：
pkg upgrade nodejs-lts
```

#### Q: Bridge Service 连接失败
1. 确认 Bridge Service 应用已启动
2. 检查通知栏是否显示服务运行中
3. 尝试重启 Bridge Service

```bash
# 测试连接
curl -v http://localhost:18800/api/v1/health
```

#### Q: 权限被拒绝
1. 打开 Bridge Service 应用
2. 点击 **权限设置**
3. 授予所需权限
4. 重试 API 调用

#### Q: Gateway 工具未加载
```bash
# 检查扩展配置
cat ~/.clawdbot/moltbot.json

# 检查扩展文件是否存在
ls -la ~/gateway-extension/dist/

# 重新构建扩展
cd ~/gateway-extension && npm run build
```

### 8.2 日志查看

```bash
# Gateway 日志
tail -f gateway.log

# 系统日志（需要 root）
logcat | grep -E "(moltbot|bridge)"
```

### 8.3 重置配置

```bash
# 备份当前配置
cp ~/.clawdbot/moltbot.json ~/.clawdbot/moltbot.json.bak

# 重新初始化
moltbot gateway init --force
```

### 8.4 获取帮助

- 查看文档: `docs/` 目录
- 提交 Issue: GitHub Issues
- 查看日志: 检查 `gateway.log` 和 `logcat`

## 附录

### A. 端口说明

| 端口 | 服务 | 用途 |
|------|------|------|
| 18789 | Gateway WebSocket | 外部客户端连接 |
| 18793 | Gateway Canvas | Canvas UI（可选） |
| 18800 | Bridge HTTP | Android API 调用 |
| 18801 | Bridge WebSocket | 实时事件（可选） |

### B. 文件位置

| 文件 | 路径 | 说明 |
|------|------|------|
| Gateway 配置 | `~/.clawdbot/moltbot.json` | 主配置文件 |
| Gateway 扩展 | `~/gateway-extension/` | 扩展代码 |
| 启动脚本 | `~/start-gateway.sh` | 启动脚本 |
| 日志文件 | `~/gateway.log` | 运行日志 |
