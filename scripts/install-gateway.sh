#!/bin/bash
#
# openclaw Gateway 安装脚本
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
echo "  安装 openclaw Gateway"
echo "========================================"
echo ""

# 若在项目仓库内且存在 gateway-extension，则同步到 ~/gateway-extension 以便安装
if [ -d "$PROJECT_DIR/gateway-extension" ] && [ -f "$PROJECT_DIR/gateway-extension/package.json" ]; then
    echo "检测到项目内 gateway-extension，同步到 ~/gateway-extension ..."
    # 先清理目标目录的 dist 和 node_modules，避免旧文件残留
    [ -d ~/gateway-extension/dist ] && rm -rf ~/gateway-extension/dist
    [ -d ~/gateway-extension/node_modules ] && rm -rf ~/gateway-extension/node_modules
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

# 安装方式选择（Android/Termux 上从源码安装会因 @matrix-org/matrix-sdk-crypto-nodejs 不支持而失败）
if [ "$(uname -o 2>/dev/null)" = "Android" ] || [ -n "$TERMUX_VERSION" ]; then
    echo -e "${YELLOW}检测到 Android/Termux：建议选择 1（从 npm 安装），从源码安装可能因依赖不支持 Android 而失败。${NC}"
    echo ""
fi
echo "请选择安装方式:"
echo "  1) 从 npm 安装 (推荐)"
echo "  2) 从源码安装"
echo ""
read -p "选择 [1/2]: " -n 1 -r
echo ""

if [[ $REPLY == "2" ]]; then
    echo "从源码安装..."
    
    OPENCLAW_REPO="${OPENCLAW_REPO:-https://github.com/openclaw/openclaw.git}"
    NEED_CLONE=""
    if [ -d ~/openclaw/.git ]; then
        if (cd ~/openclaw && git rev-parse --is-inside-work-tree &>/dev/null); then
            echo "openclaw 目录已是 git 仓库，更新..."
            if ! (cd ~/openclaw && git pull); then
                echo -e "${YELLOW}git pull 失败（可能是网络问题），将重新克隆...${NC}"
                NEED_CLONE=1
            fi
        else
            echo "openclaw 目录存在但不是有效 git 仓库，将重新克隆..."
            NEED_CLONE=1
        fi
    else
        [ -d ~/openclaw ] && echo "openclaw 目录存在但不是 git 仓库，将重新克隆..."
        NEED_CLONE=1
    fi
    
    if [ -n "$NEED_CLONE" ]; then
        [ -d ~/openclaw ] && rm -rf ~/openclaw
        echo "克隆 openclaw 仓库..."
        if ! git clone "$OPENCLAW_REPO" ~/openclaw; then
            echo -e "${RED}克隆失败。请检查:${NC}"
            echo "  1. 网络是否可访问 github.com（若不可用可尝试代理或 VPN）"
            echo "  2. 终端中执行: git config --global http.proxy http://你的代理地址:端口"
            exit 1
        fi
    fi
    cd ~/openclaw
    
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
    if command -v openclaw &>/dev/null || npm list -g openclaw --depth=0 &>/dev/null; then
        echo -e "${GREEN}openclaw 已安装，跳过 npm 安装${NC}"
    else
        npm install -g openclaw
        # Termux 等环境下 PATH 可能未包含 npm 全局 bin，start-gateway.sh 会自动查找
    fi
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
mkdir -p ~/.openclaw

# 创建/更新配置文件（openclaw 使用 ~/.openclaw/openclaw.json；扩展通过 plugins.load.paths 加载，Bridge 地址通过环境变量 ANDROID_BRIDGE_HOST / ANDROID_BRIDGE_PORT 配置）
# 使用绝对路径避免 JSON 中 ~ 不被解析导致插件加载失败
GATEWAY_EXT_PATH="${HOME}/gateway-extension/dist/android-bridge.js"
if [ ! -f ~/.openclaw/openclaw.json ]; then
    cat > ~/.openclaw/openclaw.json << EOF
{
  "plugins": {
    "load": {
      "paths": [
        "$GATEWAY_EXT_PATH"
      ]
    }
  },
  "gateway": {
    "port": 18789
  }
}
EOF
    echo "已创建配置文件: ~/.openclaw/openclaw.json（含 plugins.load.paths 扩展路径，使用绝对路径）"
else
    echo "配置文件 ~/.openclaw/openclaw.json 已存在"
    if ! grep -q 'gateway-extension/dist/android-bridge.js' ~/.openclaw/openclaw.json 2>/dev/null; then
        echo -e "${YELLOW}请在 plugins.load.paths 中添加扩展入口的绝对路径，例如: \"$GATEWAY_EXT_PATH\"，否则 android 工具不会注册。${NC}"
        echo -e "${YELLOW}注意：JSON 中不要用 ~，请写 \$HOME 的实际路径（如 /data/data/com.termux/files/home/...）。${NC}"
    fi
fi

echo ""
echo "========================================"
echo -e "${GREEN}安装完成!${NC}"
echo "========================================"
echo ""
echo "openclaw 版本: $(openclaw --version 2>/dev/null || echo '未知')"
echo ""
echo "下一步:"
echo "  1. 确保 Bridge Service 已在 Android 上运行"
echo "  2. 运行 './scripts/start-gateway.sh' 启动 Gateway"
echo ""
