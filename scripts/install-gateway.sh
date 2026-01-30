#!/bin/bash
#
# moltbot Gateway 安装脚本
# 可从项目根目录或任意目录运行；若在克隆的仓库内运行，会自动使用本项目的 gateway-extension
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================"
echo "  安装 moltbot Gateway"
echo "========================================"
echo ""

# 若在项目仓库内且存在 gateway-extension，则同步到 ~/gateway-extension 以便安装
if [ -d "$PROJECT_DIR/gateway-extension" ] && [ -f "$PROJECT_DIR/gateway-extension/package.json" ]; then
    echo "检测到项目内 gateway-extension，同步到 ~/gateway-extension ..."
    mkdir -p ~/gateway-extension
    cp -r "$PROJECT_DIR"/gateway-extension/* ~/gateway-extension/
    echo ""
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    echo "请先运行 ./setup-termux.sh"
    exit 1
fi

echo "检测到 Node.js $(node -v)"
echo ""

# 安装方式选择
echo "请选择安装方式:"
echo "  1) 从 npm 安装 (推荐)"
echo "  2) 从源码安装"
echo ""
read -p "选择 [1/2]: " -n 1 -r
echo ""

if [[ $REPLY == "2" ]]; then
    echo "从源码安装..."
    
    MOLTBOT_REPO="https://github.com/moltbot/moltbot.git"
    # 仅当 ~/moltbot 已是 git 仓库时才 pull，否则克隆（覆盖空目录或非 git 目录）
    if [ -d ~/moltbot/.git ]; then
        echo "moltbot 目录已是 git 仓库，更新..."
        cd ~/moltbot
        git pull
    else
        if [ -d ~/moltbot ]; then
            echo "moltbot 目录存在但不是 git 仓库，将重新克隆..."
            rm -rf ~/moltbot
        fi
        echo "克隆 moltbot 仓库..."
        git clone "$MOLTBOT_REPO" ~/moltbot
        cd ~/moltbot
    fi
    
    # 安装依赖
    echo "安装依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
        pnpm build
        pnpm link --global
    else
        npm install
        npm run build
        npm link
    fi
else
    echo "从 npm 安装..."
    npm install -g moltbot
fi

echo ""
echo "安装 Gateway Extension..."
cd ~/gateway-extension

# 检查扩展文件是否存在
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}Gateway Extension 源文件不存在${NC}"
    echo "请从项目复制 gateway-extension 目录到 ~/gateway-extension"
else
    npm install
    npm run build
fi

echo ""
echo "初始化 Gateway 配置..."
mkdir -p ~/.clawdbot

# 创建配置文件
if [ ! -f ~/.clawdbot/moltbot.json ]; then
    cat > ~/.clawdbot/moltbot.json << 'EOF'
{
  "gateway": {
    "port": 18789
  }
}
EOF
    echo "已创建配置文件: ~/.clawdbot/moltbot.json"
else
    echo "配置文件已存在"
fi

echo ""
echo "========================================"
echo -e "${GREEN}安装完成!${NC}"
echo "========================================"
echo ""
echo "moltbot 版本: $(moltbot --version 2>/dev/null || echo '未知')"
echo ""
echo "下一步:"
echo "  1. 确保 Bridge Service 已在 Android 上运行"
echo "  2. 运行 './start-gateway.sh' 启动 Gateway"
echo ""
