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

# Termux/Android：确保 PATH 含 npm/node（常见为 ~/.npm-global/bin 或系统 bin）
if [ -d "/data/data/com.termux/files/usr" ] || [ -n "$TERMUX_VERSION" ]; then
    export PATH="$HOME/.npm-global/bin:$HOME/.local/bin:/data/data/com.termux/files/usr/bin:$PATH"
fi

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

# 检测是否在 Android/Termux（端口与锁清理、启动方式会用到）
ON_ANDROID="${ON_ANDROID:-}"
[ "$(uname -o 2>/dev/null)" = "Android" ] || [ -n "$TERMUX_VERSION" ] || [ -d "/data/data/com.termux/files/usr" ] && ON_ANDROID=1

# 检查 Gateway 端口是否被占用，占用则结束该进程（lsof → fuser → ss → Android 下 /proc 回退）
PORT_PID=""
if command -v lsof &>/dev/null; then
    PORT_PID=$(lsof -t -i ":${GATEWAY_PORT}" 2>/dev/null)
fi
if [ -z "$PORT_PID" ] && command -v fuser &>/dev/null; then
    PORT_PID=$(fuser "${GATEWAY_PORT}/tcp" 2>&1 | sed 's/.*: *//' | tr -d ' ')
fi
if [ -z "$PORT_PID" ] && command -v ss &>/dev/null; then
    PORT_PID=$(ss -tlnp 2>/dev/null | grep ":${GATEWAY_PORT}" | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' | head -1)
fi
# Android/Termux 上 lsof 常不可用、ss -p 可能 Permission denied，用 /proc/net/tcp 回退取占用端口的 PID
if [ -z "$PORT_PID" ] && [ -n "$ON_ANDROID" ] && [ -r /proc/net/tcp ]; then
    PORT_HEX=$(printf '%04X' "${GATEWAY_PORT}")
    for f in /proc/net/tcp /proc/net/tcp6; do
        [ ! -r "$f" ] && continue
        INODE=$(awk -v port="${PORT_HEX}" 'NR>1 && tolower($2) ~ ":" tolower(port) {print $12; exit}' "$f" 2>/dev/null)
        [ -z "$INODE" ] && continue
        for p in /proc/[0-9]*; do
            [ -d "$p/fd" ] || continue
            pid="${p#/proc/}"
            case "$pid" in [0-9]*) ;; *) continue ;; esac
            for fd in "$p"/fd/*; do
                [ -L "$fd" ] || continue
                link=$(readlink "$fd" 2>/dev/null)
                [ -z "$link" ] && continue
                if [ "$link" = "socket:[$INODE]" ]; then
                    PORT_PID="$pid"
                    break 3
                fi
            done
        done
    done
fi
# 仅当 pid 为纯数字时才结束进程
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
    if [ -z "$PORT_PID" ] && [ -n "$ON_ANDROID" ] && [ -r /proc/net/tcp ]; then
        PORT_HEX=$(printf '%04X' "${GATEWAY_PORT}")
        for f in /proc/net/tcp /proc/net/tcp6; do
            [ ! -r "$f" ] && continue
            INODE=$(awk -v port="${PORT_HEX}" 'NR>1 && tolower($2) ~ ":" tolower(port) {print $12; exit}' "$f" 2>/dev/null)
            [ -z "$INODE" ] && continue
            for p in /proc/[0-9]*; do [ -d "$p/fd" ] || continue; pid="${p#/proc/}"
                case "$pid" in [0-9]*) ;; *) continue ;; esac
                for fd in "$p"/fd/*; do [ -L "$fd" ] || continue; link=$(readlink "$fd" 2>/dev/null); [ "$link" = "socket:[$INODE]" ] && PORT_PID="$pid" && break 3; done
            done
        done
    fi
    case "$PORT_PID" in ''|*[!0-9]*) PORT_PID="" ;; esac
    [ -n "$PORT_PID" ] && kill -9 $PORT_PID 2>/dev/null || true
    sleep 1
fi
# 清除 clawdbot gateway 锁/pid 文件，避免 "gateway already running (pid ...); lock timeout"
CLAWDBOT_DIR="${CLAWDBOT_CONFIG_DIR:-$HOME/.clawdbot}"
for lock in "$CLAWDBOT_DIR"/gateway.pid "$CLAWDBOT_DIR"/gateway.lock "$CLAWDBOT_DIR"/.gateway.lock "$CLAWDBOT_DIR"/run/gateway.pid; do
    [ -e "$lock" ] && rm -f "$lock" && echo -e "${YELLOW}已移除陈旧锁文件: $lock${NC}"
done
[ -d "$CLAWDBOT_DIR/run" ] && rmdir "$CLAWDBOT_DIR/run" 2>/dev/null || true

echo "启动 Gateway (端口: ${GATEWAY_PORT})..."
echo ""
echo "按 Ctrl+C 停止"
echo "========================================"
echo ""

# 启动 Gateway：查找 clawdbot
CLAWDBOT_CMD=""
ON_ANDROID="${ON_ANDROID:-}"
[ "$(uname -o 2>/dev/null)" = "Android" ] || [ -n "$TERMUX_VERSION" ] && ON_ANDROID=1

# 优先检测 clawdbot 命令是否可用（包括 Android）
# 设置 CLAWDBOT_DISABLE_ROUTE_FIRST=1 后，clawdbot 命令在 Android 上也能正常使用 gateway run
if command -v clawdbot &> /dev/null; then
    CLAWDBOT_CMD="clawdbot"
fi

# 如果 clawdbot 命令不可用，尝试从 npm 全局目录查找
if [ -z "$CLAWDBOT_CMD" ]; then
    NPM_PREFIX="$(npm config get prefix 2>/dev/null)"
    if [ -n "$NPM_PREFIX" ] && [ -x "$NPM_PREFIX/bin/clawdbot" ]; then
        CLAWDBOT_CMD="$NPM_PREFIX/bin/clawdbot"
    fi
fi

# Termux 自定义全局目录
if [ -z "$CLAWDBOT_CMD" ] && [ -x "$HOME/.npm-global/bin/clawdbot" ]; then
    CLAWDBOT_CMD="$HOME/.npm-global/bin/clawdbot"
fi

# Termux 默认全局目录
if [ -z "$CLAWDBOT_CMD" ]; then
    TERMUX_PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
    if [ -x "$TERMUX_PREFIX/bin/clawdbot" ]; then
        CLAWDBOT_CMD="$TERMUX_PREFIX/bin/clawdbot"
    fi
fi

# 从源码运行
if [ -z "$CLAWDBOT_CMD" ] && [ -d "$HOME/clawdbot" ]; then
    if [ -x "$HOME/clawdbot/node_modules/.bin/clawdbot" ]; then
        CLAWDBOT_CMD="$HOME/clawdbot/node_modules/.bin/clawdbot"
    fi
fi

# 最后尝试 npx（仅非 Android）
if [ -z "$CLAWDBOT_CMD" ] && [ -z "$ON_ANDROID" ] && npm list -g clawdbot --depth=0 &>/dev/null; then
    CLAWDBOT_CMD="npx clawdbot"
fi

if [ -n "$CLAWDBOT_CMD" ]; then
    # Android 上禁用「路由优先」，避免 gateway 被 route 到 service/install 逻辑
    [ -n "$ON_ANDROID" ] && export CLAWDBOT_DISABLE_ROUTE_FIRST=1
    echo -e "${YELLOW}执行: $CLAWDBOT_CMD gateway run --port ${GATEWAY_PORT} --verbose${NC}"
    exec $CLAWDBOT_CMD gateway run --port "${GATEWAY_PORT}" --verbose
else
    echo -e "${RED}错误: clawdbot 未安装或无法解析入口${NC}"
    echo ""
    echo "当前未检测到 clawdbot 全局包（需存在 dist/cli/run-main.js 或 dist/cli.js）。"
    echo "请先安装："
    echo "  ./scripts/install-gateway.sh   # 推荐，会安装 clawdbot 并配置扩展"
    echo "或："
    echo "  npm install -g clawdbot"
    echo ""
    if [ -n "$ON_ANDROID" ]; then
        NPM_ROOT="$(npm root -g 2>/dev/null | tr -d '\n\r')"
        echo "当前 npm 全局目录: ${NPM_ROOT:-（无法获取）}"
        if [ -n "$NPM_ROOT" ] && [ -d "$NPM_ROOT/clawdbot" ]; then
            echo -e "${YELLOW}若已安装于此目录，可尝试: node $NPM_ROOT/clawdbot/dist/cli/run-main.js gateway run --port ${GATEWAY_PORT} --verbose${NC}"
        else
            echo "安装后可用以下命令确认路径: npm root -g && ls \$(npm root -g)/clawdbot/dist/cli/"
        fi
    else
        echo -e "${YELLOW}若已安装但找不到命令，可尝试: node \$(npm list -g clawdbot --parseable | tail -1)/dist/cli.js gateway run --port ${GATEWAY_PORT} --verbose${NC}"
    fi
    exit 1
fi
