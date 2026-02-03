#!/bin/bash
#
# 直接修复 npm shebang 问题
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
echo "  修复 npm shebang 问题"
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
    # 尝试在常见位置查找
    POSSIBLE_PATHS=(
        "$PREFIX/bin/npm"
        "$PREFIX/../usr/bin/npm"
        "/data/data/com.termux/files/usr/bin/npm"
    )
    
    for path in "${POSSIBLE_PATHS[@]}"; do
        if [ -f "$path" ]; then
            NPM_PATH="$path"
            echo "找到 npm: $NPM_PATH"
            break
        fi
    done
fi

if [ -z "$NPM_PATH" ] || [ ! -f "$NPM_PATH" ]; then
    echo -e "${RED}错误: 找不到 npm${NC}"
    echo "请先安装 Node.js: pkg install nodejs-lts"
    exit 1
fi

echo ""
echo "步骤 1: 检查 npm shebang..."
echo ""

# 检查 shebang
FIRST_LINE=$(head -n 1 "$NPM_PATH" 2>/dev/null || echo "")
echo "当前 shebang: $FIRST_LINE"

# 检查是否有问题
HAS_ISSUE=false
if echo "$FIRST_LINE" | grep -q "/bin/npm"; then
    echo -e "${YELLOW}检测到错误的 shebang: 指向 /bin/npm${NC}"
    HAS_ISSUE=true
elif [ -z "$FIRST_LINE" ] || [ "${FIRST_LINE:0:2}" != "#!" ]; then
    echo -e "${YELLOW}npm 文件格式异常${NC}"
    HAS_ISSUE=true
fi

echo ""
echo "步骤 2: 查找 npm-cli.js..."
echo ""

# 查找 npm-cli.js
NPM_CLI_JS=""
POSSIBLE_CLI_PATHS=(
    "$PREFIX/lib/node_modules/npm/bin/npm-cli.js"
    "$PREFIX/../usr/lib/node_modules/npm/bin/npm-cli.js"
    "/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"
    "$(dirname "$(dirname "$NPM_PATH")")/lib/node_modules/npm/bin/npm-cli.js"
)

for path in "${POSSIBLE_CLI_PATHS[@]}"; do
    if [ -f "$path" ]; then
        NPM_CLI_JS="$path"
        echo "找到 npm-cli.js: $NPM_CLI_JS"
        break
    fi
done

if [ -z "$NPM_CLI_JS" ]; then
    echo -e "${YELLOW}警告: 找不到 npm-cli.js，尝试重新安装 Node.js${NC}"
    echo ""
    read -p "是否重新安装 Node.js? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pkg reinstall nodejs-lts
        echo -e "${GREEN}Node.js 已重新安装，请重新运行此脚本验证${NC}"
        exit 0
    else
        echo -e "${RED}无法继续，需要 npm-cli.js 文件${NC}"
        exit 1
    fi
fi

echo ""
echo "步骤 3: 修复 npm shebang..."
echo ""

# 备份原文件
BACKUP_PATH="${NPM_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NPM_PATH" "$BACKUP_PATH"
echo "已备份原文件到: $BACKUP_PATH"

# 获取 node 路径
NODE_PATH=$(which node)
echo "Node 路径: $NODE_PATH"

# 创建新的 npm 脚本
cat > "$NPM_PATH" << EOF
#!/bin/sh
# npm wrapper script - fixed shebang
basedir=\$(dirname "\$(readlink -f "\$0" 2>/dev/null || echo "\$0")")
case "\$basedir" in
    *[\\/]*)
        basedir=\$(cd "\$basedir" && pwd)
        ;;
esac

# Try to find node
if [ -x "\$basedir/node" ]; then
    "\$basedir/node" "$NPM_CLI_JS" "\$@"
elif [ -x "$NODE_PATH" ]; then
    "$NODE_PATH" "$NPM_CLI_JS" "\$@"
elif command -v node >/dev/null 2>&1; then
    node "$NPM_CLI_JS" "\$@"
else
    echo "Error: node not found" >&2
    exit 1
fi
EOF

# 设置执行权限
chmod +x "$NPM_PATH"

echo -e "${GREEN}npm shebang 已修复${NC}"
echo ""

echo "步骤 4: 验证修复..."
echo ""

# 验证 npm
if npm --version &> /dev/null; then
    echo -e "${GREEN}✓ npm 工作正常${NC}"
    echo "  npm 版本: $(npm --version)"
    echo "  npm 路径: $(which npm)"
else
    echo -e "${RED}✗ npm 仍有问题${NC}"
    echo ""
    echo "尝试恢复备份..."
    if [ -f "$BACKUP_PATH" ]; then
        cp "$BACKUP_PATH" "$NPM_PATH"
        chmod +x "$NPM_PATH"
        echo "已恢复备份"
    fi
    exit 1
fi

echo ""
echo "步骤 5: 测试 npm 命令..."
echo ""

# 测试 npm 命令
if npm config get prefix &> /dev/null; then
    echo -e "${GREEN}✓ npm 命令测试通过${NC}"
else
    echo -e "${YELLOW}⚠ npm 命令可能仍有问题，但基本功能可用${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}修复完成!${NC}"
echo "========================================"
echo ""
echo "现在可以尝试安装飞书插件："
echo "  openclaw plugins install @m1heng-clawd/feishu"
echo ""
echo "如果问题仍然存在，请："
echo "  1. 检查 Node.js 版本: node -v"
echo "  2. 检查 npm 版本: npm -v"
echo "  3. 查看详细错误: npm --version 2>&1"
echo ""
