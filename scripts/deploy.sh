#!/bin/bash
#
# 一键部署脚本
# 用于在开发机上构建并部署到 Android 设备
#

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  OpenClaw Android 一键部署"
echo "========================================"
echo ""

# 检查 adb
if ! command -v adb &> /dev/null; then
    echo -e "${RED}错误: adb 未安装${NC}"
    echo "请安装 Android SDK Platform Tools"
    exit 1
fi

# 检查设备连接
echo "检查 Android 设备连接..."
DEVICE_COUNT=$(adb devices | grep -v "List" | grep -v "^$" | wc -l)

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${RED}错误: 未检测到 Android 设备${NC}"
    echo "请连接设备并启用 USB 调试"
    exit 1
elif [ "$DEVICE_COUNT" -gt 1 ]; then
    echo -e "${YELLOW}检测到多个设备，使用第一个${NC}"
fi

DEVICE=$(adb devices | grep -v "List" | grep -v "^$" | head -n 1 | awk '{print $1}')
echo -e "${GREEN}设备: $DEVICE${NC}"
echo ""

# 步骤 1: 构建 APK
echo -e "${BLUE}步骤 1: 构建 Bridge Service APK${NC}"
"${SCRIPT_DIR}/build-bridge-apk.sh"

# 步骤 2: 安装 APK
echo ""
echo -e "${BLUE}步骤 2: 安装 APK 到设备${NC}"
APK_PATH="${PROJECT_DIR}/android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}错误: APK 文件不存在${NC}"
    exit 1
fi

adb -s "$DEVICE" install -r "$APK_PATH"
echo -e "${GREEN}APK 安装成功${NC}"

# 步骤 3: 复制 Gateway Extension 到设备
echo ""
echo -e "${BLUE}步骤 3: 构建 Gateway Extension${NC}"
cd "${PROJECT_DIR}/gateway-extension"
npm install
npm run build
echo -e "${GREEN}Gateway Extension 构建成功${NC}"

# 步骤 4: 创建 Termux 启动脚本
echo ""
echo -e "${BLUE}步骤 4: 生成设备端脚本${NC}"

# 创建临时目录存放要推送的文件
TEMP_DIR=$(mktemp -d)
mkdir -p "${TEMP_DIR}/gateway-extension"

# 复制 Gateway Extension
cp -r "${PROJECT_DIR}/gateway-extension/dist" "${TEMP_DIR}/gateway-extension/"
cp "${PROJECT_DIR}/gateway-extension/package.json" "${TEMP_DIR}/gateway-extension/"

# 复制启动脚本
cp "${SCRIPT_DIR}/setup-termux.sh" "${TEMP_DIR}/"
cp "${SCRIPT_DIR}/install-gateway.sh" "${TEMP_DIR}/"
cp "${SCRIPT_DIR}/start-gateway.sh" "${TEMP_DIR}/"

echo ""
echo "========================================"
echo -e "${GREEN}部署完成!${NC}"
echo "========================================"
echo ""
echo "后续步骤 (在 Android 设备上):"
echo ""
echo "1. 打开 Bridge Service 应用"
echo "   - 授予所需权限"
echo "   - 点击 '启动服务'"
echo ""
echo "2. 打开 Termux"
echo "   - 运行: ${SCRIPT_DIR}/setup-termux.sh"
echo "   - 运行: ${SCRIPT_DIR}/install-gateway.sh"
echo "   - 运行: ${SCRIPT_DIR}/start-gateway.sh"
echo ""
echo "3. 从其他设备连接 Gateway"
echo "   - WebSocket: ws://<device-ip>:18789"
echo ""

# 清理
rm -rf "${TEMP_DIR}"
