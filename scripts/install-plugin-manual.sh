#!/bin/bash
#
# 手动安装 openclaw 插件
# 绕过 openclaw 的 npm 调用问题
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  手动安装 openclaw 插件"
echo "========================================"
echo ""

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 <plugin-name>"
    echo "示例: $0 @m1heng-clawd/feishu"
    exit 1
fi

PLUGIN_NAME="$1"
echo "插件名称: $PLUGIN_NAME"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    exit 1
fi

# 检查 npm-cli.js
NPM_CLI_JS="/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"
if [ ! -f "$NPM_CLI_JS" ]; then
    echo -e "${RED}错误: 找不到 npm-cli.js${NC}"
    exit 1
fi

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo "临时目录: $TEMP_DIR"
echo ""

# 创建插件目录
PLUGIN_DIR="$HOME/.clawdbot/plugins/$(basename "$PLUGIN_NAME" | sed 's/@//' | sed 's/\//-/')"
echo "插件目录: $PLUGIN_DIR"
echo ""

# 步骤 1: 下载插件包
echo "步骤 1: 下载插件包..."
cd "$TEMP_DIR"

# 使用 node 直接执行 npm pack
if node "$NPM_CLI_JS" pack "$PLUGIN_NAME" 2>&1; then
    echo -e "${GREEN}✓ 插件包下载成功${NC}"
else
    echo -e "${RED}✗ 插件包下载失败${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 查找下载的包文件
PACK_FILE=$(ls -t *.tgz 2>/dev/null | head -n 1)
if [ -z "$PACK_FILE" ]; then
    echo -e "${RED}错误: 找不到下载的包文件${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "  包文件: $PACK_FILE"
echo ""

# 步骤 2: 解压包
echo "步骤 2: 解压插件包..."
if tar -xzf "$PACK_FILE"; then
    echo -e "${GREEN}✓ 解压成功${NC}"
else
    echo -e "${RED}✗ 解压失败${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 查找 package 目录
PACKAGE_DIR=""
if [ -d "package" ]; then
    PACKAGE_DIR="package"
elif [ -d "$(basename "$PLUGIN_NAME" | sed 's/@//' | sed 's/\//-/')" ]; then
    PACKAGE_DIR="$(basename "$PLUGIN_NAME" | sed 's/@//' | sed 's/\//-/')"
else
    # 查找第一个目录
    PACKAGE_DIR=$(find . -maxdepth 1 -type d ! -name '.' | head -n 1)
fi

if [ -z "$PACKAGE_DIR" ] || [ ! -d "$PACKAGE_DIR" ]; then
    echo -e "${RED}错误: 找不到 package 目录${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo "  package 目录: $PACKAGE_DIR"
echo ""

# 步骤 3: 复制到插件目录
echo "步骤 3: 复制到插件目录..."
mkdir -p "$PLUGIN_DIR"

if cp -r "$PACKAGE_DIR"/* "$PLUGIN_DIR/"; then
    echo -e "${GREEN}✓ 复制成功${NC}"
else
    echo -e "${RED}✗ 复制失败${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo ""

# 步骤 4: 安装依赖
echo "步骤 4: 安装插件依赖..."
cd "$PLUGIN_DIR"

if [ -f "package.json" ]; then
    echo "  检测到 package.json，安装依赖..."
    if node "$NPM_CLI_JS" install 2>&1; then
        echo -e "${GREEN}✓ 依赖安装成功${NC}"
    else
        echo -e "${YELLOW}⚠ 依赖安装可能失败，但插件文件已复制${NC}"
    fi
else
    echo "  未找到 package.json，跳过依赖安装"
fi

echo ""

# 清理临时文件
echo "清理临时文件..."
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✓ 清理完成${NC}"
echo ""

# 完成
echo "========================================"
echo -e "${GREEN}插件安装完成!${NC}"
echo "========================================"
echo ""
echo "插件已安装到: $PLUGIN_DIR"
echo ""
echo "下一步:"
echo "  1. 重启 openclaw Gateway"
echo "  2. 检查插件是否已加载"
echo ""
