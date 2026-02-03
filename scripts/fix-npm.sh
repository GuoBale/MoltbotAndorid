#!/bin/bash
#
# 修复 npm 安装问题
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
echo "  修复 npm 安装问题"
echo "========================================"
echo ""

# 检查是否在 Termux 中
if [ -z "$TERMUX_VERSION" ] && [ "$(uname -o 2>/dev/null)" != "Android" ]; then
    echo -e "${YELLOW}警告: 此脚本设计用于 Termux/Android 环境${NC}"
    echo ""
fi

echo "步骤 0: 检查 Termux 镜像源..."
echo ""

# 检查镜像源是否有问题
if pkg update 2>&1 | grep -q "File has unexpected size\|Mirror sync in progress"; then
    echo -e "${YELLOW}检测到镜像源同步问题${NC}"
    echo "建议先运行: ./scripts/fix-termux-repo.sh"
    echo ""
    read -p "是否现在修复镜像源? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "$(dirname "$0")/fix-termux-repo.sh" ]; then
            bash "$(dirname "$0")/fix-termux-repo.sh"
        else
            echo "请手动运行: termux-change-repo"
        fi
    fi
    echo ""
fi

echo "步骤 1: 检查当前 npm 状态..."
echo ""

# 检查 node 和 npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先运行: pkg install nodejs-lts"
    echo ""
    echo "如果安装失败，可能是镜像源问题，请先运行:"
    echo "  ./scripts/fix-termux-repo.sh"
    exit 1
fi

echo "Node.js 版本: $(node -v)"
echo ""

# 检查 npm
if command -v npm &> /dev/null; then
    NPM_PATH=$(which npm)
    echo "npm 路径: $NPM_PATH"
    echo "npm 版本: $(npm -v)"
    echo ""
    
    # 检查 npm 的 shebang
    if [ -f "$NPM_PATH" ]; then
        FIRST_LINE=$(head -n 1 "$NPM_PATH")
        echo "npm shebang: $FIRST_LINE"
        echo ""
        
        if echo "$FIRST_LINE" | grep -q "/bin/npm"; then
            echo -e "${YELLOW}检测到错误的 shebang 行${NC}"
            echo "需要修复 npm 安装"
        fi
    fi
else
    echo -e "${RED}错误: npm 未找到${NC}"
    echo "需要重新安装 npm"
fi

echo ""
echo "步骤 2: 修复 npm 安装..."
echo ""

# 方法 1: 重新安装 nodejs（包含 npm）
echo -e "${BLUE}方法 1: 重新安装 Node.js（推荐）${NC}"
read -p "是否重新安装 Node.js? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在重新安装 Node.js..."
    pkg reinstall nodejs-lts -y
    echo -e "${GREEN}Node.js 重新安装完成${NC}"
    echo ""
fi

# 方法 2: 修复 npm 链接
echo -e "${BLUE}方法 2: 修复 npm 链接${NC}"
if command -v npm &> /dev/null; then
    NPM_PATH=$(which npm)
    NPM_DIR=$(dirname "$NPM_PATH")
    
    # 检查 npm 是否是指向 node_modules 的符号链接
    if [ -L "$NPM_PATH" ]; then
        REAL_PATH=$(readlink -f "$NPM_PATH")
        echo "npm 符号链接指向: $REAL_PATH"
        
        # 如果指向 node_modules，尝试修复
        if echo "$REAL_PATH" | grep -q "node_modules"; then
            echo "检测到 npm 指向 node_modules，尝试修复..."
            
            # 查找正确的 npm 位置
            if [ -f "$PREFIX/lib/node_modules/npm/bin/npm-cli.js" ]; then
                echo "找到 npm-cli.js，创建新的符号链接..."
                rm -f "$NPM_PATH"
                ln -s "$PREFIX/lib/node_modules/npm/bin/npm-cli.js" "$NPM_PATH"
                echo -e "${GREEN}npm 链接已修复${NC}"
            fi
        fi
    fi
fi

echo ""
echo "步骤 3: 验证修复..."
echo ""

# 重新加载 PATH
export PATH="$PREFIX/bin:$PATH"
if [ -f ~/.bashrc ]; then
    source ~/.bashrc 2>/dev/null || true
fi

# 验证 npm
if command -v npm &> /dev/null; then
    echo -e "${GREEN}✓ npm 可用${NC}"
    echo "  路径: $(which npm)"
    echo "  版本: $(npm -v)"
    echo ""
    
    # 测试 npm 命令
    echo "测试 npm 命令..."
    if npm --version &> /dev/null; then
        echo -e "${GREEN}✓ npm 命令正常工作${NC}"
    else
        echo -e "${RED}✗ npm 命令仍有问题${NC}"
        echo ""
        echo "尝试手动修复..."
        
        # 创建 npm 包装脚本
        NPM_BIN="$PREFIX/bin/npm"
        if [ ! -f "$NPM_BIN" ] || [ ! -x "$NPM_BIN" ]; then
            echo "创建 npm 包装脚本..."
            cat > "$NPM_BIN" << 'EOF'
#!/data/data/com.termux/files/usr/bin/sh
basedir=$(dirname "$(readlink -f "$0")")
case "$basedir" in
    *[\\/]*)
        basedir=$(cd "$basedir" && pwd)
        ;;
esac
if [ -x "$basedir/node" ]; then
    "$basedir/node" "$basedir/../lib/node_modules/npm/bin/npm-cli.js" "$@"
else
    node "$basedir/../lib/node_modules/npm/bin/npm-cli.js" "$@"
fi
EOF
            chmod +x "$NPM_BIN"
            echo -e "${GREEN}npm 包装脚本已创建${NC}"
        fi
    fi
else
    echo -e "${RED}✗ npm 仍不可用${NC}"
    echo ""
    echo "请尝试以下步骤："
    echo "  1. 重新安装 Node.js: pkg reinstall nodejs-lts"
    echo "  2. 检查 PATH: echo \$PATH"
    echo "  3. 检查 npm 位置: find \$PREFIX -name npm"
fi

echo ""
echo "步骤 4: 配置 npm（如果需要）..."
echo ""

if command -v npm &> /dev/null; then
    # 配置 npm 全局目录
    if [ ! -d ~/.npm-global ]; then
        mkdir -p ~/.npm-global
        npm config set prefix ~/.npm-global
        echo -e "${GREEN}已配置 npm 全局目录${NC}"
    fi
    
    # 配置镜像（中国用户）
    read -p "是否配置 npm 镜像为 npmmirror.com? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm config set registry https://registry.npmmirror.com
        echo -e "${GREEN}已配置 npm 镜像${NC}"
    fi
    
    # 添加到 PATH
    if ! echo "$PATH" | grep -q "\.npm-global"; then
        echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
        export PATH=~/.npm-global/bin:$PATH
        echo -e "${GREEN}已将 npm 全局 bin 添加到 PATH${NC}"
    fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}修复完成!${NC}"
echo "========================================"
echo ""
echo "请执行以下命令验证："
echo "  npm --version"
echo "  which npm"
echo ""
echo "如果问题仍然存在，请尝试："
echo "  1. 完全重新安装: pkg remove nodejs-lts && pkg install nodejs-lts"
echo "  2. 检查 Termux 版本: 确保使用最新版本"
echo "  3. 查看详细错误: npm --version 2>&1"
echo ""
