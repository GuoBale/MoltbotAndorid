#!/bin/bash
#
# 诊断 npm 问题
# 检查 npm 的实际内容和配置
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  npm 诊断工具"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    exit 1
fi

echo "Node.js 信息:"
echo "  版本: $(node -v)"
echo "  路径: $(which node)"
echo ""

# 查找 npm
NPM_PATH=""
if command -v npm &> /dev/null; then
    NPM_PATH=$(which npm)
    echo -e "${GREEN}找到 npm: $NPM_PATH${NC}"
else
    echo -e "${RED}错误: npm 未找到${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "  npm 文件分析"
echo "========================================"
echo ""

# 检查 npm 文件类型
echo "1. 文件类型:"
file "$NPM_PATH"
echo ""

# 检查文件大小
echo "2. 文件大小:"
ls -lh "$NPM_PATH"
echo ""

# 显示前 20 行
echo "3. 文件内容（前 20 行）:"
head -n 20 "$NPM_PATH"
echo ""

# 检查 shebang
FIRST_LINE=$(head -n 1 "$NPM_PATH" 2>/dev/null || echo "")
echo "4. Shebang 行:"
echo "   $FIRST_LINE"
echo ""

# 检查是否是符号链接
if [ -L "$NPM_PATH" ]; then
    REAL_PATH=$(readlink -f "$NPM_PATH" 2>/dev/null || readlink "$NPM_PATH")
    echo "5. 符号链接:"
    echo "   指向: $REAL_PATH"
    echo ""
fi

# 检查 npm-cli.js
echo "6. 查找 npm-cli.js:"
NPM_CLI_JS=""
POSSIBLE_CLI_PATHS=(
    "$PREFIX/lib/node_modules/npm/bin/npm-cli.js"
    "/data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js"
    "$(dirname "$(dirname "$NPM_PATH")")/lib/node_modules/npm/bin/npm-cli.js"
)

for path in "${POSSIBLE_CLI_PATHS[@]}"; do
    if [ -f "$path" ]; then
        NPM_CLI_JS="$path"
        echo -e "   ${GREEN}找到: $NPM_CLI_JS${NC}"
        break
    fi
done

if [ -z "$NPM_CLI_JS" ]; then
    echo -e "   ${RED}未找到 npm-cli.js${NC}"
else
    echo "   文件存在: $(test -f "$NPM_CLI_JS" && echo '是' || echo '否')"
    echo "   文件大小: $(ls -lh "$NPM_CLI_JS" | awk '{print $5}')"
fi
echo ""

# 测试 npm 命令
echo "7. 测试 npm 命令:"
echo "   执行: npm --version"
if npm --version 2>&1; then
    echo -e "   ${GREEN}✓ npm 命令执行成功${NC}"
else
    echo -e "   ${RED}✗ npm 命令执行失败${NC}"
    echo "   错误输出:"
    npm --version 2>&1 || true
fi
echo ""

# 检查 npm 环境变量
echo "8. npm 相关环境变量:"
env | grep -i npm || echo "   无 npm 相关环境变量"
echo ""

# 检查 PATH
echo "9. PATH 中的 npm 相关路径:"
echo "$PATH" | tr ':' '\n' | grep -E "(npm|node|termux)" || echo "   无相关路径"
echo ""

echo "========================================"
echo "  诊断完成"
echo "========================================"
echo ""
