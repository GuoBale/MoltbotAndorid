# 修复 openclaw libsignal 错误

## 问题描述

在 Termux 中运行 `openclaw` 时，遇到错误：

```
Error: Cannot find package '/data/data/com.termux/files/home/.npm-global/lib/node_modules/openclaw/node_modules/libsignal/index.js'
```

## 根本原因

1. **libsignal 是原生模块**  
   `libsignal` 是 Baileys（WhatsApp 库）的依赖，需要编译原生代码。

2. **--ignore-scripts 的影响**  
   使用 `--ignore-scripts` 安装 openclaw 时，npm 不会执行 postinstall 脚本，导致原生模块没有正确构建。

3. **Android 架构支持**  
   libsignal 可能不完全支持 Android/ARM 架构，或者需要特定的构建工具。

## 解决方案

### 方案 1：重新安装依赖（可能失败）

```bash
# 进入 openclaw 目录
cd ~/.npm-global/lib/node_modules/openclaw

# 尝试重新安装 libsignal
node /data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js install libsignal

# 或重新安装所有依赖（不使用 --ignore-scripts）
node /data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js install
```

**注意：** 这可能会失败，因为某些依赖不支持 Android。

### 方案 2：使用修复脚本

```bash
./scripts/fix-openclaw-libsignal.sh
```

### 方案 3：在 PC 上运行 openclaw（推荐）

根据官方文档，**Android 应该作为客户端连接 Gateway**，而不是在 Android 上运行 openclaw。

**推荐架构：**
- **PC/Mac/Linux**: 运行 openclaw（包含所有功能）
- **Android**: 只运行 Gateway（使用 openclaw）+ Bridge Service

**在手机上只运行 Gateway：**

```bash
# 安装 openclaw（用于 Gateway）
npm install -g openclaw@latest --ignore-scripts

# 启动 Gateway
openclaw gateway --port 18789
```

**在 PC 上运行 openclaw：**

```bash
# PC 上正常安装（不需要 --ignore-scripts）
npm install -g openclaw@latest

# 连接手机的 Gateway
# 在 openclaw 配置中设置 Gateway 地址为手机 IP:18789
```

### 方案 4：检查 libsignal 支持

libsignal 可能需要特定的构建工具或环境：

```bash
# 检查是否有构建工具
pkg install build-essential

# 检查 Python（某些原生模块需要）
pkg install python

# 尝试手动构建
cd ~/.npm-global/lib/node_modules/openclaw/node_modules/libsignal
npm run build
```

## 临时解决方案

如果必须使用 openclaw 的某些功能，可以：

1. **禁用 Baileys/WhatsApp 功能**  
   如果不需要 WhatsApp，可以避免加载 libsignal。

2. **使用其他渠道**  
   使用不依赖 libsignal 的渠道（Telegram、Discord 等）。

3. **检查 openclaw 配置**  
   查看是否可以禁用某些功能或模块。

## 相关文档

- [ignore-scripts 功能清单](ignore-scripts-feature-checklist.md)
- [平台部署对比](platform-deployment-comparison.md)
- [README - 故障排除](../README.md)

## 总结

**最佳实践：**
- 在 PC/Mac/Linux 上运行完整的 openclaw
- 在 Android 上只运行 Gateway（openclaw）+ Bridge Service
- 通过 WebSocket 连接两者

这样可以避免 Android 上的原生模块构建问题，同时充分利用各平台的优势。
