#!/bin/bash
#
# Termux 环境配置脚本
# 用于在 Android Termux 中配置 openclaw Gateway 运行环境
#

set -e

echo "========================================"
echo "  Moltbot Gateway Termux 环境配置"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在 Termux 中运行
if [ -z "$TERMUX_VERSION" ]; then
    echo -e "${YELLOW}警告: 可能不在 Termux 环境中运行${NC}"
    echo "此脚本设计用于 Termux，在其他环境中可能无法正常工作"
    echo ""
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "步骤 1: 更新包管理器..."
pkg update -y
pkg upgrade -y

echo ""
echo "步骤 2: 安装 Node.js..."
pkg install -y nodejs-lts

# 验证 Node.js 版本
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${YELLOW}警告: Node.js 版本 $(node -v) 可能过低${NC}"
    echo "openclaw 需要 Node.js >= 22.12.0"
fi

echo ""
echo "步骤 3: 安装开发工具..."
pkg install -y git curl wget

echo ""
echo "步骤 4: 配置 npm..."
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global

# 添加到 PATH
if ! grep -q "npm-global" ~/.bashrc 2>/dev/null; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
fi

# 导出到当前 session
export PATH=~/.npm-global/bin:$PATH

echo ""
echo "步骤 5: 安装 pnpm (可选)..."
npm install -g pnpm

echo ""
echo "步骤 6: 创建工作目录..."
mkdir -p ~/.openclaw
mkdir -p ~/gateway-extension

echo ""
echo "========================================"
echo -e "${GREEN}环境配置完成!${NC}"
echo "========================================"
echo ""
echo "已安装版本:"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  pnpm: $(pnpm -v 2>/dev/null || echo '未安装')"
echo ""
echo "下一步:"
echo "  1. 运行 'source ~/.bashrc' 刷新 PATH"
echo "  2. 运行 './scripts/install-gateway.sh' 安装 openclaw Gateway"
echo "  3. 在 Android 上安装 Bridge Service APK"
echo "  4. 运行 './start-gateway.sh' 启动 Gateway"
echo ""
