#!/bin/bash
#
# 完整修复 npm 问题
# 解决 "Cannot find module '/bin/npm'" 错误
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  完整修复 npm 问题"
echo "========================================"
echo ""

# 检查是否在 Termux 中
if [ -z "$TERMUX_VERSION" ] && [ "$(uname -o 2>/dev/null)" != "Android" ]; then
    echo -e "${YELLOW}警告: 此脚本设计用于 Termux/Android 环境${NC}"
    echo ""
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    exit 1
fi

echo "Node.js 版本: $(node -v)"
echo ""

# 查找 npm
NPM_PATH=""
if command -v npm &> /dev/null; then
    NPM_PATH=$(which npm)
    echo "找到 npm: $NPM_PATH"
else
    echo -e "${RED}错误: npm 未找到${NC}"
    exit 1
fi

# 查找 npm-cli.js
NPM_CLI_JS="/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"
if [ ! -f "$NPM_CLI_JS" ]; then
    # 尝试其他位置
    POSSIBLE_CLI_PATHS=(
        "$PREFIX/lib/node_modules/npm/bin/npm-cli.js"
        "/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"
    )
    
    for path in "${POSSIBLE_CLI_PATHS[@]}"; do
        if [ -f "$path" ]; then
            NPM_CLI_JS="$path"
            break
        fi
    done
fi

if [ ! -f "$NPM_CLI_JS" ]; then
    echo -e "${RED}错误: 找不到 npm-cli.js${NC}"
    exit 1
fi

echo "找到 npm-cli.js: $NPM_CLI_JS"
echo ""

# 检查当前 npm 内容
echo "步骤 1: 检查当前 npm 内容..."
CURRENT_SHEBANG=$(head -n 1 "$NPM_PATH" 2>/dev/null || echo "")
echo "当前 shebang: $CURRENT_SHEBANG"
echo ""

# 测试直接使用 node 执行 npm-cli.js
echo "步骤 2: 测试直接执行 npm-cli.js..."
if node "$NPM_CLI_JS" --version &> /dev/null; then
    NPM_VERSION=$(node "$NPM_CLI_JS" --version)
    echo -e "${GREEN}✓ npm-cli.js 可以直接执行${NC}"
    echo "  npm 版本: $NPM_VERSION"
else
    echo -e "${RED}✗ npm-cli.js 无法直接执行${NC}"
    node "$NPM_CLI_JS" --version 2>&1 || true
    exit 1
fi
echo ""

# 备份原文件
echo "步骤 3: 备份原 npm 文件..."
BACKUP_PATH="${NPM_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NPM_PATH" "$BACKUP_PATH"
echo "已备份到: $BACKUP_PATH"
echo ""

# 获取 node 路径
NODE_PATH=$(which node)
echo "Node 路径: $NODE_PATH"
echo ""

# 创建新的 npm 脚本
echo "步骤 4: 创建新的 npm 脚本..."
cat > "$NPM_PATH" << 'NPM_SCRIPT'
#!/data/data/com.termux/files/usr/bin/sh
# npm wrapper script for Termux
# Fixed version to avoid "/bin/npm" error

NODE_BIN="/data/data/com.termux/files/usr/bin/node"
NPM_CLI="/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"

# Fallback to PATH if absolute path doesn't work
if [ ! -x "$NODE_BIN" ]; then
    NODE_BIN=$(command -v node)
    if [ -z "$NODE_BIN" ]; then
        echo "Error: node not found" >&2
        exit 1
    fi
fi

# Fallback for npm-cli.js
if [ ! -f "$NPM_CLI" ]; then
    # Try to find it
    for path in \
        "/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js" \
        "$(dirname "$(dirname "$(command -v node)" 2>/dev/null)")/lib/node_modules/npm/bin/npm-cli.js"; do
        if [ -f "$path" ]; then
            NPM_CLI="$path"
            break
        fi
    done
fi

if [ ! -f "$NPM_CLI" ]; then
    echo "Error: npm-cli.js not found" >&2
    exit 1
fi

# Execute npm
exec "$NODE_BIN" "$NPM_CLI" "$@"
NPM_SCRIPT

# 设置执行权限
chmod +x "$NPM_PATH"

echo -e "${GREEN}npm 脚本已创建${NC}"
echo ""

# 验证
echo "步骤 5: 验证修复..."
echo ""

if npm --version &> /dev/null; then
    NPM_VER=$(npm --version)
    echo -e "${GREEN}✓ npm 工作正常${NC}"
    echo "  npm 版本: $NPM_VER"
    echo "  npm 路径: $(which npm)"
else
    echo -e "${RED}✗ npm 仍有问题${NC}"
    echo ""
    echo "恢复备份..."
    if [ -f "$BACKUP_PATH" ]; then
        cp "$BACKUP_PATH" "$NPM_PATH"
        chmod +x "$NPM_PATH"
        echo "已恢复备份"
    fi
    
    echo ""
    echo "尝试诊断..."
    echo "执行: node $NPM_CLI_JS --version"
    node "$NPM_CLI_JS" --version 2>&1 || true
    
    exit 1
fi

echo ""
echo "步骤 6: 测试 npm 命令..."
echo ""

# 测试几个基本命令
TESTS=(
    "npm --version"
    "npm config get prefix"
)

ALL_PASSED=true
for test_cmd in "${TESTS[@]}"; do
    if eval "$test_cmd" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $test_cmd"
    else
        echo -e "  ${RED}✗${NC} $test_cmd"
        ALL_PASSED=false
    fi
done

echo ""
echo "========================================"
if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}修复完成!${NC}"
    echo "========================================"
    echo ""
    echo "现在可以尝试安装飞书插件："
    echo "  openclaw plugins install @m1heng-clawd/feishu"
    echo ""
else
    echo -e "${YELLOW}部分测试失败，但基本功能可能可用${NC}"
    echo "========================================"
    echo ""
    echo "建议："
    echo "  1. 尝试直接使用: node $NPM_CLI_JS <command>"
    echo "  2. 检查 openclaw 的 npm 调用方式"
    echo ""
fi
