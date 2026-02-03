#!/bin/bash
#
# 修复 openclaw libsignal 依赖问题
# 解决 "Cannot find package 'libsignal/index.js'" 错误
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  修复 openclaw libsignal 依赖"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    exit 1
fi

echo "Node.js 版本: $(node -v)"
echo ""

# 查找 openclaw 安装位置
OPENCLAW_PATH=""
POSSIBLE_PATHS=(
    "$HOME/.npm-global/lib/node_modules/openclaw"
    "$(npm config get prefix)/lib/node_modules/openclaw"
    "/data/data/com.termux/files/home/.npm-global/lib/node_modules/openclaw"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        OPENCLAW_PATH="$path"
        echo "找到 openclaw: $OPENCLAW_PATH"
        break
    fi
done

if [ -z "$OPENCLAW_PATH" ]; then
    echo -e "${RED}错误: 找不到 openclaw 安装目录${NC}"
    echo ""
    echo "请先安装 openclaw:"
    echo "  npm install -g openclaw@latest --ignore-scripts"
    exit 1
fi

echo ""
echo "步骤 1: 检查 libsignal 依赖..."
echo ""

# 检查 libsignal 是否存在
LIBSIGNAL_PATH="$OPENCLAW_PATH/node_modules/libsignal"
if [ -d "$LIBSIGNAL_PATH" ]; then
    echo "找到 libsignal 目录: $LIBSIGNAL_PATH"
    
    # 检查 index.js
    if [ -f "$LIBSIGNAL_PATH/index.js" ]; then
        echo -e "${GREEN}✓ libsignal/index.js 存在${NC}"
    else
        echo -e "${YELLOW}⚠ libsignal/index.js 不存在${NC}"
        echo "  需要重新安装 libsignal"
    fi
else
    echo -e "${RED}✗ libsignal 目录不存在${NC}"
    echo "  需要安装 libsignal"
fi

echo ""
echo "步骤 2: 尝试修复 libsignal..."
echo ""

# 进入 openclaw 目录
cd "$OPENCLAW_PATH"

# 检查 package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 找不到 package.json${NC}"
    exit 1
fi

# 检查是否有 libsignal 依赖
if grep -q "libsignal" package.json; then
    echo "检测到 libsignal 依赖"
else
    echo -e "${YELLOW}警告: package.json 中未找到 libsignal 依赖${NC}"
    echo "可能是间接依赖（通过 @whiskeysockets/baileys）"
fi

echo ""
echo "步骤 3: 重新安装依赖..."
echo ""

# 使用 node 直接执行 npm-cli.js
NPM_CLI_JS="/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"

# 尝试安装 libsignal
echo "尝试安装 libsignal..."
if node "$NPM_CLI_JS" install libsignal 2>&1; then
    echo -e "${GREEN}✓ libsignal 安装成功${NC}"
else
    echo -e "${YELLOW}⚠ libsignal 单独安装失败，尝试重新安装所有依赖${NC}"
    echo ""
    
    # 重新安装所有依赖（不忽略脚本，可能会失败）
    read -p "是否尝试重新安装所有依赖（不使用 --ignore-scripts）? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "重新安装依赖（这可能会失败，因为某些依赖不支持 Android）..."
        if node "$NPM_CLI_JS" install 2>&1; then
            echo -e "${GREEN}✓ 依赖重新安装成功${NC}"
        else
            echo -e "${YELLOW}⚠ 依赖重新安装失败（某些原生模块可能不支持 Android）${NC}"
            echo ""
            echo "建议："
            echo "  1. 在 PC 上运行 openclaw，手机只运行 Gateway"
            echo "  2. 或者使用其他不依赖 libsignal 的功能"
        fi
    fi
fi

echo ""
echo "步骤 4: 检查修复结果..."
echo ""

# 再次检查 libsignal
if [ -f "$LIBSIGNAL_PATH/index.js" ]; then
    echo -e "${GREEN}✓ libsignal/index.js 现在存在${NC}"
    echo ""
    echo "尝试测试 openclaw..."
    if openclaw --version &> /dev/null; then
        echo -e "${GREEN}✓ openclaw 可以运行${NC}"
        openclaw --version
    else
        echo -e "${YELLOW}⚠ openclaw 可能仍有问题${NC}"
        echo "错误信息:"
        openclaw --version 2>&1 || true
    fi
else
    echo -e "${RED}✗ libsignal/index.js 仍然不存在${NC}"
    echo ""
    echo "可能的解决方案："
    echo "  1. 在 PC 上运行 openclaw，手机只运行 Gateway（推荐）"
    echo "  2. 检查 libsignal 是否支持 Android/ARM 架构"
    echo "  3. 查看 libsignal 的构建要求"
fi

echo ""
echo "========================================"
echo "  修复完成"
echo "========================================"
echo ""
echo "注意："
echo "  - libsignal 是原生模块，在 Android 上可能无法正常构建"
echo "  - 如果问题持续，建议在 PC 上运行 openclaw"
echo "  - 手机可以只运行 Gateway（使用 moltbot/clawdbot）"
echo ""
