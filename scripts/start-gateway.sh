#!/bin/bash
#
# 启动 clawdbot Gateway
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
echo "  启动 clawdbot Gateway"
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

# 检查 Gateway 端口是否被占用，占用则结束该进程（lsof 优先，无则试 fuser，再试 ss）
PORT_PID=""
if command -v lsof &>/dev/null; then
    PORT_PID=$(lsof -t -i ":${GATEWAY_PORT}" 2>/dev/null)
fi
if [ -z "$PORT_PID" ] && command -v fuser &>/dev/null; then
    PORT_PID=$(fuser "${GATEWAY_PORT}/tcp" 2>&1 | sed 's/.*: *//' | tr -d ' ')
fi
if [ -z "$PORT_PID" ] && command -v ss &>/dev/null; then
    # ss -tlnp 输出中匹配 :PORT，取 pid= 后的数字（Termux 常带 ss）；仅保留数字避免 ss 的 Permission denied 被当 pid
    PORT_PID=$(ss -tlnp 2>/dev/null | grep ":${GATEWAY_PORT}" | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -1)
fi
# 仅当 pid 为纯数字时才结束进程，避免 "Permission denied" 等被误当 pid
case "$PORT_PID" in
    ''|*[!0-9]*) PORT_PID="" ;;
esac
if [ -n "$PORT_PID" ]; then
    echo -e "${YELLOW}端口 ${GATEWAY_PORT} 已被占用 (pid: ${PORT_PID})，正在结束该进程...${NC}"
    kill $PORT_PID 2>/dev/null || true
    sleep 2
    # 若仍占用则强制结束
    PORT_PID=""
    if command -v lsof &>/dev/null; then
        PORT_PID=$(lsof -t -i ":${GATEWAY_PORT}" 2>/dev/null)
    fi
    [ -z "$PORT_PID" ] && command -v fuser &>/dev/null && PORT_PID=$(fuser "${GATEWAY_PORT}/tcp" 2>&1 | sed 's/.*: *//' | tr -d ' ')
    [ -z "$PORT_PID" ] && command -v ss &>/dev/null && PORT_PID=$(ss -tlnp 2>/dev/null | grep ":${GATEWAY_PORT}" | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -1)
    case "$PORT_PID" in ''|*[!0-9]*) PORT_PID="" ;; esac
    [ -n "$PORT_PID" ] && kill -9 $PORT_PID 2>/dev/null || true
    sleep 1
fi

echo "启动 Gateway (端口: ${GATEWAY_PORT})..."
echo ""
echo "按 Ctrl+C 停止"
echo "========================================"
echo ""

# 启动 Gateway：查找 clawdbot。Android/Termux 上优先用 node 直连 cli.js，避免 clawdbot 包装落入 Node REPL
CLAWDBOT_CMD=""
ON_ANDROID="${ON_ANDROID:-}"
[ "$(uname -o 2>/dev/null)" = "Android" ] || [ -n "$TERMUX_VERSION" ] && ON_ANDROID=1

if [ -n "$ON_ANDROID" ] && npm list -g clawdbot --depth=0 &>/dev/null; then
    # Android/Termux：优先用 node 直接运行全局包 cli，避免 "clawdbot" 命令触发 "Gateway service install not supported on android"
    CLAWDBOT_PKG="$(npm list -g clawdbot --parseable 2>/dev/null | tail -1 | tr -d '\n\r')"
    if [ -z "$CLAWDBOT_PKG" ] && command -v npm &>/dev/null; then
        NPM_ROOT="$(npm root -g 2>/dev/null | tr -d '\n\r')"
        [ -n "$NPM_ROOT" ] && [ -d "$NPM_ROOT/clawdbot" ] && CLAWDBOT_PKG="$NPM_ROOT/clawdbot"
    fi
    if [ -n "$CLAWDBOT_PKG" ]; then
        if [ -f "$CLAWDBOT_PKG/dist/cli.js" ]; then
            CLAWDBOT_CMD="node $CLAWDBOT_PKG/dist/cli.js"
        elif [ -f "$CLAWDBOT_PKG/dist/cli/run-main.js" ]; then
            # clawdbot 包入口可能为 dist/cli/run-main.js（见 stack trace）
            CLAWDBOT_CMD="node $CLAWDBOT_PKG/dist/cli/run-main.js"
        elif [ -f "$CLAWDBOT_PKG/bin/cli.js" ]; then
            CLAWDBOT_CMD="node $CLAWDBOT_PKG/bin/cli.js"
        fi
    fi
fi
if [ -z "$CLAWDBOT_CMD" ] && command -v clawdbot &> /dev/null; then
    CLAWDBOT_CMD="clawdbot"
elif [ -z "$CLAWDBOT_CMD" ] && npm list -g clawdbot --depth=0 &>/dev/null; then
    NPM_PREFIX="$(npm config get prefix 2>/dev/null)"
    if [ -n "$NPM_PREFIX" ] && [ -x "$NPM_PREFIX/bin/clawdbot" ]; then
        CLAWDBOT_CMD="$NPM_PREFIX/bin/clawdbot"
    fi
fi
# 从源码运行
if [ -z "$CLAWDBOT_CMD" ] && [ -d "$HOME/clawdbot" ]; then
    if [ -x "$HOME/clawdbot/node_modules/.bin/clawdbot" ]; then
        CLAWDBOT_CMD="$HOME/clawdbot/node_modules/.bin/clawdbot"
    elif [ -f "$HOME/clawdbot/dist/cli.js" ]; then
        CLAWDBOT_CMD="node $HOME/clawdbot/dist/cli.js"
    fi
fi
# 已全局安装但尚未选定：用 node 直接运行全局包内的 CLI 入口
if [ -z "$CLAWDBOT_CMD" ] && npm list -g clawdbot --depth=0 &>/dev/null; then
    CLAWDBOT_PKG="$(npm list -g clawdbot --parseable 2>/dev/null | tail -1 | tr -d '\n\r')"
    [ -z "$CLAWDBOT_PKG" ] && command -v npm &>/dev/null && NPM_ROOT="$(npm root -g 2>/dev/null | tr -d '\n\r')" && [ -d "$NPM_ROOT/clawdbot" ] && CLAWDBOT_PKG="$NPM_ROOT/clawdbot"
    if [ -n "$CLAWDBOT_PKG" ]; then
        if [ -f "$CLAWDBOT_PKG/dist/cli.js" ]; then
            CLAWDBOT_CMD="node $CLAWDBOT_PKG/dist/cli.js"
        elif [ -f "$CLAWDBOT_PKG/dist/cli/run-main.js" ]; then
            CLAWDBOT_CMD="node $CLAWDBOT_PKG/dist/cli/run-main.js"
        elif [ -f "$CLAWDBOT_PKG/bin/cli.js" ]; then
            CLAWDBOT_CMD="node $CLAWDBOT_PKG/bin/cli.js"
        fi
    fi
fi
# 最后尝试 npx
if [ -z "$CLAWDBOT_CMD" ] && npm list -g clawdbot --depth=0 &>/dev/null; then
    CLAWDBOT_CMD="npx clawdbot"
fi
if [ -n "$CLAWDBOT_CMD" ]; then
    # 确保 gateway --port 正确传入：多词命令用 eval 避免路径含空格/换行导致落入 Node REPL
    echo -e "${YELLOW}执行: $CLAWDBOT_CMD gateway --port ${GATEWAY_PORT}${NC}"
    case "$CLAWDBOT_CMD" in
        "node "*)
            CLAWDBOT_NODE_PATH="${CLAWDBOT_CMD#node }"
            exec node "$CLAWDBOT_NODE_PATH" gateway --port "${GATEWAY_PORT}"
            ;;
        *)
            exec $CLAWDBOT_CMD gateway --port "${GATEWAY_PORT}"
            ;;
    esac
else
    echo -e "${RED}错误: clawdbot 未安装${NC}"
    echo "请先安装 clawdbot（npm install -g clawdbot）或运行 ./scripts/install-gateway.sh"
    echo -e "${YELLOW}若已安装但找不到命令，可尝试: node \$(npm list -g clawdbot --parseable | tail -1)/dist/cli.js gateway --port ${GATEWAY_PORT}${NC}"
    exit 1
fi
