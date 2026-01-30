#!/bin/bash
#
# 构建 Bridge Service APK
#

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ANDROID_DIR="${PROJECT_DIR}/android"

echo "========================================"
echo "  构建 Bridge Service APK"
echo "========================================"
echo ""

# 检查 Android 目录
if [ ! -d "$ANDROID_DIR" ]; then
    echo "错误: Android 项目目录不存在: $ANDROID_DIR"
    exit 1
fi

cd "$ANDROID_DIR"

# 检查 Gradle
if [ ! -f "gradlew" ]; then
    echo "错误: gradlew 不存在"
    echo "请确保 Android 项目已正确设置"
    exit 1
fi

# 确保 gradlew 可执行
chmod +x gradlew

echo "清理旧构建..."
./gradlew clean

echo ""
echo "构建 Debug APK..."
./gradlew :app:assembleDebug

echo ""
echo "构建 Release APK..."
./gradlew :app:assembleRelease

echo ""
echo "========================================"
echo "构建完成!"
echo "========================================"
echo ""
echo "APK 位置:"
echo "  Debug:   ${ANDROID_DIR}/app/build/outputs/apk/debug/app-debug.apk"
echo "  Release: ${ANDROID_DIR}/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "安装 Debug APK:"
echo "  adb install ${ANDROID_DIR}/app/build/outputs/apk/debug/app-debug.apk"
echo ""
