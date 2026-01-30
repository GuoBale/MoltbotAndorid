# Termux 环境配置指南

本指南详细说明如何在 Android 设备上配置 Termux 环境以运行 moltbot Gateway。

## 1. 安装 Termux

### 1.1 下载 Termux

> **重要警告**: 请勿从 Google Play Store 安装 Termux！Play Store 版本已停止维护，存在兼容性问题。

**推荐下载源**:
1. [F-Droid](https://f-droid.org/packages/com.termux/) (推荐)
2. [GitHub Releases](https://github.com/termux/termux-app/releases)

### 1.2 安装步骤

1. 下载 Termux APK
2. 在设备上启用 "允许安装未知来源应用"
3. 安装 APK
4. 首次打开 Termux，等待初始化完成

### 1.3 验证安装

打开 Termux 后应看到命令行界面：

```
$ _
```

## 2. 基础配置

### 2.1 更新包管理器

```bash
# 更新包列表
pkg update

# 升级已安装的包
pkg upgrade -y
```

### 2.2 更换镜像源 (中国用户)

如果下载速度慢，可更换镜像：

```bash
# 使用交互式镜像选择器
termux-change-repo

# 选择 "Mirrors hosted in China" 或其他可用镜像
```

### 2.3 授予存储权限

```bash
# 执行此命令后会弹出权限请求
termux-setup-storage
```

授权后，可在 `~/storage/` 访问设备存储：
- `~/storage/shared/` - 共享存储
- `~/storage/downloads/` - 下载目录
- `~/storage/dcim/` - 相机照片

### 2.4 配置快捷键

创建 `~/.termux/termux.properties`:

```bash
mkdir -p ~/.termux
cat > ~/.termux/termux.properties << 'EOF'
# 使用额外按键行
extra-keys = [['ESC','/','-','HOME','UP','END','PGUP'],['TAB','CTRL','ALT','LEFT','DOWN','RIGHT','PGDN']]

# 字体大小
# 在 Termux 中用两指缩放调整

# 禁用震动
bell-character = ignore
EOF

# 重新加载配置
termux-reload-settings
```

## 3. 安装 Node.js

### 3.1 安装 Node.js LTS

```bash
# 安装 Node.js LTS 版本
pkg install nodejs-lts

# 验证版本
node -v
# 应显示 v22.x.x 或更高

npm -v
# 应显示 10.x.x 或更高
```

### 3.2 配置 npm

```bash
# 创建全局安装目录
mkdir -p ~/.npm-global

# 配置 npm 使用该目录
npm config set prefix ~/.npm-global

# 添加到 PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### 3.3 配置 npm 镜像 (中国用户)

```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
```

### 3.4 安装 pnpm (可选)

```bash
npm install -g pnpm

# 验证
pnpm -v
```

## 4. 安装开发工具

### 4.1 基础工具

```bash
# Git - 版本控制
pkg install git

# Vim/Nano - 文本编辑器
pkg install vim nano

# curl/wget - HTTP 客户端
pkg install curl wget

# jq - JSON 处理
pkg install jq

# htop - 进程监控
pkg install htop
```

### 4.2 配置 Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 5. 安装 moltbot

### 5.1 从 npm 安装

```bash
# 全局安装
npm install -g moltbot

# 验证安装
moltbot --version
```

### 5.2 从源码安装

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

# 验证
moltbot --version
```

### 5.3 初始化 Gateway

```bash
# 创建配置目录
mkdir -p ~/.clawdbot

# 初始化配置
moltbot gateway init

# 编辑配置 (可选)
nano ~/.clawdbot/moltbot.json
```

## 6. 配置 Gateway 扩展

### 6.1 获取扩展代码

```bash
# 创建扩展目录
mkdir -p ~/gateway-extension
cd ~/gateway-extension

# 初始化项目
npm init -y

# 安装依赖
npm install typescript @types/node
```

### 6.2 创建扩展文件

```bash
# 创建 tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "strict": true
  },
  "include": ["src"]
}
EOF

# 创建源文件目录
mkdir -p src

# 创建入口文件
cat > src/index.ts << 'EOF'
import { AndroidBridgeClient } from './android-bridge-client';

export function activate(gateway: any) {
  const bridge = new AndroidBridgeClient();
  // 注册工具...
  console.log('Android Bridge Extension activated');
}
EOF
```

### 6.3 构建扩展

```bash
# 编译 TypeScript
npx tsc

# 验证输出
ls dist/
```

## 7. 系统优化

### 7.1 防止 Termux 被杀死

Android 系统可能会杀死后台应用。配置电池优化：

1. 打开 **设置 > 应用 > Termux**
2. 点击 **电池**
3. 选择 **不优化** 或 **无限制**

### 7.2 使用 Wake Lock

```bash
# 获取 wake lock，防止 CPU 休眠
termux-wake-lock

# 释放 wake lock
termux-wake-unlock
```

### 7.3 使用 Termux:Boot 自启动

1. 从 F-Droid 安装 **Termux:Boot**
2. 打开 Termux:Boot 一次以注册
3. 创建启动脚本：

```bash
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/start-gateway.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

# 获取 wake lock
termux-wake-lock

# 等待网络就绪
sleep 10

# 启动 Gateway
cd ~
./start-gateway.sh >> ~/gateway.log 2>&1 &
EOF

chmod +x ~/.termux/boot/start-gateway.sh
```

## 8. 网络配置

### 8.1 查看 IP 地址

```bash
# 查看所有网络接口
ip addr

# 查看 WiFi IP
ip addr show wlan0 | grep inet
```

### 8.2 配置防火墙 (可选)

如果需要从其他设备连接：

```bash
# 安装 iptables (需要 root)
# 大多数情况下不需要，Android 默认允许本地连接
```

### 8.3 使用 SSH 远程连接 (可选)

```bash
# 安装 OpenSSH
pkg install openssh

# 设置密码
passwd

# 启动 SSH 服务
sshd

# SSH 端口默认 8022
# 从其他设备连接：ssh user@<device-ip> -p 8022
```

## 9. 常见问题

### Q: pkg update 失败

```bash
# 尝试更换镜像
termux-change-repo

# 或手动编辑 sources.list
nano $PREFIX/etc/apt/sources.list
```

### Q: 存储权限被拒绝

```bash
# 重新请求权限
termux-setup-storage

# 如果仍然失败，在系统设置中手动授权
```

### Q: Node.js 版本太低

```bash
# 查看可用版本
pkg search nodejs

# 升级包管理器和 Node.js
pkg update
pkg upgrade nodejs-lts
```

### Q: npm 安装失败

```bash
# 清除缓存
npm cache clean --force

# 增加超时时间
npm config set fetch-timeout 60000

# 使用镜像
npm config set registry https://registry.npmmirror.com
```

### Q: Termux 被系统杀死

1. 关闭电池优化
2. 使用 `termux-wake-lock`
3. 安装 Termux:Boot 自动重启
4. 考虑使用前台通知 (需要 Termux:API)

### Q: 存储空间不足

```bash
# 查看存储使用
df -h

# 清理 npm 缓存
npm cache clean --force

# 清理 pnpm 缓存
pnpm store prune

# 清理 Termux 包缓存
pkg clean
```

## 10. 有用的命令速查

```bash
# 系统信息
uname -a

# Node.js 版本
node -v && npm -v

# 网络连接测试
curl -v http://localhost:18800/api/v1/health

# 进程管理
ps aux | grep node
kill <pid>

# 后台运行
nohup moltbot gateway > gateway.log 2>&1 &

# 查看日志
tail -f gateway.log

# 内存使用
free -h

# 磁盘使用
df -h
```
