#!/bin/bash
#
# 修复 Termux 镜像源问题
# 解决 "File has unexpected size" 和镜像同步问题
#

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "  修复 Termux 镜像源问题"
echo "========================================"
echo ""

# 检查是否在 Termux 中
if [ -z "$TERMUX_VERSION" ] && [ "$(uname -o 2>/dev/null)" != "Android" ]; then
    echo -e "${YELLOW}警告: 此脚本设计用于 Termux/Android 环境${NC}"
    echo ""
fi

echo "步骤 1: 检查当前镜像源配置..."
echo ""

# 检查 sources.list 文件
SOURCES_FILE="$PREFIX/etc/apt/sources.list"
if [ -f "$SOURCES_FILE" ]; then
    echo "当前镜像源配置:"
    cat "$SOURCES_FILE"
    echo ""
else
    echo -e "${YELLOW}未找到 sources.list 文件${NC}"
fi

echo ""
echo "步骤 2: 更换镜像源..."
echo ""

# 方法 1: 使用交互式工具
echo -e "${BLUE}方法 1: 使用交互式镜像选择器（推荐）${NC}"
echo "将启动交互式工具，请按提示选择镜像源"
echo ""
read -p "是否使用交互式工具更换镜像源? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v termux-change-repo &> /dev/null; then
        termux-change-repo
        echo -e "${GREEN}镜像源已更换${NC}"
    else
        echo -e "${RED}错误: termux-change-repo 命令不可用${NC}"
        echo "请手动编辑镜像源配置"
    fi
fi

echo ""
echo "步骤 3: 手动配置镜像源（如果交互式工具不可用）..."
echo ""

# 提供手动配置选项
read -p "是否手动配置镜像源? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "可用的镜像源选项:"
    echo "  1) 官方源 (termux.org) - 默认，可能较慢"
    echo "  2) 中国镜像 (清华大学) - 推荐中国用户"
    echo "  3) 其他镜像"
    echo ""
    read -p "请选择 [1/2/3]: " -n 1 -r
    echo ""
    
    case $REPLY in
        1)
            # 官方源
            MIRROR_URL="https://termux.org/packages"
            echo "使用官方源: $MIRROR_URL"
            ;;
        2)
            # 清华大学镜像
            MIRROR_URL="https://mirrors.tuna.tsinghua.edu.cn/termux"
            echo "使用清华大学镜像: $MIRROR_URL"
            ;;
        3)
            read -p "请输入镜像源 URL: " MIRROR_URL
            ;;
        *)
            echo -e "${YELLOW}未选择，跳过手动配置${NC}"
            MIRROR_URL=""
            ;;
    esac
    
    if [ -n "$MIRROR_URL" ]; then
        # 备份原配置
        if [ -f "$SOURCES_FILE" ]; then
            cp "$SOURCES_FILE" "${SOURCES_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            echo "已备份原配置"
        fi
        
        # 创建新配置
        cat > "$SOURCES_FILE" << EOF
# The termux repository mirror
# You can replace this mirror with other mirrors listed at:
# https://github.com/termux/termux-packages/wiki/Mirrors
# The main termux repository:
deb [arch=all,arm,aarch64,x86_64] $MIRROR_URL stable main
EOF
        echo -e "${GREEN}镜像源配置已更新${NC}"
        echo "新配置:"
        cat "$SOURCES_FILE"
    fi
fi

echo ""
echo "步骤 4: 清理并更新包列表..."
echo ""

# 清理缓存
echo "清理 APT 缓存..."
pkg clean 2>/dev/null || true

# 更新包列表
echo "更新包列表..."
if pkg update; then
    echo -e "${GREEN}包列表更新成功${NC}"
else
    echo -e "${YELLOW}包列表更新失败，可能需要更换其他镜像源${NC}"
    echo ""
    echo "建议尝试："
    echo "  1. 运行 termux-change-repo 选择其他镜像"
    echo "  2. 等待几分钟后重试（镜像可能正在同步）"
    echo "  3. 检查网络连接"
fi

echo ""
echo "步骤 5: 验证镜像源..."
echo ""

# 尝试安装一个小包来验证
echo "测试镜像源可用性..."
if pkg search nodejs-lts &> /dev/null; then
    echo -e "${GREEN}✓ 镜像源工作正常${NC}"
else
    echo -e "${YELLOW}⚠ 镜像源可能仍有问题${NC}"
    echo "建议："
    echo "  1. 检查网络连接"
    echo "  2. 尝试其他镜像源"
    echo "  3. 等待几分钟后重试"
fi

echo ""
echo "========================================"
echo -e "${GREEN}修复完成!${NC}"
echo "========================================"
echo ""
echo "下一步:"
echo "  1. 如果镜像源已修复，可以继续安装 Node.js:"
echo "     pkg install nodejs-lts"
echo ""
echo "  2. 如果问题仍然存在，可以："
echo "     - 运行 termux-change-repo 选择其他镜像"
echo "     - 等待几分钟后重试（镜像可能正在同步）"
echo "     - 检查网络连接和代理设置"
echo ""
