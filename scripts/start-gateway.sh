#!/bin/bash
#
# 启动 Gateway（调用已安装的 clawd）
#

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BRIDGE_HOST="${ANDROID_BRIDGE_HOST:-127.0.0.1}"
BRIDGE_PORT="${ANDROID_BRIDGE_PORT:-18800}"
GATEWAY_PORT="${GATEWAY_PORT:-18789}"

echo "========================================"
echo "  启动 Gateway (clawd)"
echo "========================================"
echo ""

# 检查 Bridge Service
check_bridge() {
    curl -s "http://${BRIDGE_HOST}:${BRIDGE_PORT}/api/v1/health" > /dev/null 2>&1
    return $?
}

echo "检查 Bridge Service (${BRIDGE_HOST}:${BRIDGE_PORT})..."

# 等待 Bridge Service
MAX_RETRIES=30
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if check_bridge; then
        echo -e "${GREEN}Bridge Service 已就绪${NC}"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "等待 Bridge Service... ($RETRY/$MAX_RETRIES)"
    sleep 1
done

if ! check_bridge; then
    echo -e "${YELLOW}警告: Bridge Service 未响应${NC}"
    echo "请确保已在 Android 上启动 Bridge Service 应用"
    echo ""
    read -p "是否继续启动 Gateway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 获取 Bridge 信息
if check_bridge; then
    HEALTH=$(curl -s "http://${BRIDGE_HOST}:${BRIDGE_PORT}/api/v1/health")
    echo "Bridge 状态: $HEALTH"
    echo ""
fi

# 设置环境变量
export ANDROID_BRIDGE_HOST="${BRIDGE_HOST}"
export ANDROID_BRIDGE_PORT="${BRIDGE_PORT}"

echo "启动 Gateway (端口: ${GATEWAY_PORT})..."
echo ""
echo "按 Ctrl+C 停止"
echo "========================================"
echo ""

# 启动 Gateway：调用已安装的 clawd。按 PATH → npm 全局 prefix/bin 查找
CLAWD_CMD=""
if command -v clawd &> /dev/null; then
    CLAWD_CMD="clawd"
elif [ -n "$(npm config get prefix 2>/dev/null)" ]; then
    NPM_PREFIX="$(npm config get prefix 2>/dev/null)"
    if [ -x "$NPM_PREFIX/bin/clawd" ]; then
        CLAWD_CMD="$NPM_PREFIX/bin/clawd"
    fi
fi
if [ -n "$CLAWD_CMD" ]; then
    exec $CLAWD_CMD gateway --port "${GATEWAY_PORT}"
else
    echo -e "${RED}错误: clawd 未找到${NC}"
    echo "请确保已安装 clawd（如: npm install -g clawd），并将 npm 全局 bin 加入 PATH"
    echo "或执行: export PATH=\"\$(npm config get prefix)/bin:\$PATH\""
    exit 1
fi
