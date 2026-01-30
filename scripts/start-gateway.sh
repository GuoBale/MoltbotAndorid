#!/bin/bash
#
# 启动 moltbot Gateway
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
echo "  启动 moltbot Gateway"
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

# 启动 Gateway（优先用 PATH 中的 moltbot，否则用 npx 调用全局安装的包，适配 Termux 等 PATH 未包含 npm 全局 bin 的环境）
if command -v moltbot &> /dev/null; then
    exec moltbot gateway --port "${GATEWAY_PORT}"
elif npm list -g moltbot --depth=0 2>/dev/null | grep -q moltbot; then
    exec npx moltbot gateway --port "${GATEWAY_PORT}"
else
    echo -e "${RED}错误: moltbot 未安装${NC}"
    echo "请先运行 ./scripts/install-gateway.sh"
    exit 1
fi
