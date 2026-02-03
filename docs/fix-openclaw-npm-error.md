# 修复 openclaw npm 错误

## 问题描述

在 Termux 中运行 `openclaw plugins install @m1heng-clawd/feishu` 时，遇到错误：

```
Error: Cannot find module '/bin/npm'
```

这个错误表明 openclaw 在尝试 require('/bin/npm')，而不是执行 npm 脚本。

## 根本原因

在 Termux 环境中，npm 位于 `/data/data/com.termux/files/usr/bin/npm`，而不是 `/bin/npm`。openclaw 可能在某个地方硬编码了 `/bin/npm` 路径。

## 解决方案

### 方案 1：创建符号链接（推荐）

在 Termux 中创建 `/bin` 目录的符号链接（如果可能）：

```bash
# 注意：这需要 root 权限，在 Termux 中通常不可行
# 但可以尝试在用户空间创建
```

### 方案 2：修复 npm 脚本（已尝试）

运行修复脚本：

```bash
./scripts/fix-npm-complete.sh
```

### 方案 3：使用 node 直接执行 npm（临时方案）

如果 openclaw 允许配置 npm 路径，可以创建一个包装脚本：

```bash
# 创建 npm 包装脚本
cat > ~/bin/npm-wrapper << 'EOF'
#!/data/data/com.termux/files/usr/bin/sh
exec /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js "$@"
EOF

chmod +x ~/bin/npm-wrapper

# 如果 openclaw 支持环境变量指定 npm 路径
export NPM_BIN=~/bin/npm-wrapper
```

### 方案 4：检查 openclaw 配置

查看 openclaw 的配置，看是否可以指定 npm 路径：

```bash
# 查看 openclaw 配置
openclaw config

# 或查看配置文件
cat ~/.clawdbot/clawdbot.json
```

### 方案 5：手动安装插件（绕过 openclaw）

如果 openclaw 的插件安装功能有问题，可以手动安装：

```bash
# 1. 下载插件包
cd /tmp
npm pack @m1heng-clawd/feishu

# 2. 解压
tar -xzf m1heng-clawd-feishu-*.tgz

# 3. 复制到插件目录
mkdir -p ~/.clawdbot/plugins
cp -r package/* ~/.clawdbot/plugins/feishu/

# 4. 安装依赖
cd ~/.clawdbot/plugins/feishu
npm install
```

### 方案 6：使用 npx（如果可用）

尝试使用 npx 来执行 npm：

```bash
# 检查 npx 是否可用
which npx

# 如果可用，可以尝试设置别名
alias npm='npx npm'
```

## 诊断步骤

1. **检查 npm 是否正常工作：**
   ```bash
   npm --version
   which npm
   ```

2. **测试直接执行 npm-cli.js：**
   ```bash
   node /data/data/com.termux/files/usr/lib/node_modules/npm/bin/npm-cli.js --version
   ```

3. **检查 openclaw 如何调用 npm：**
   ```bash
   # 使用 strace（如果可用）查看系统调用
   strace -e trace=execve openclaw plugins install @m1heng-clawd/feishu 2>&1 | grep npm
   ```

4. **查看详细错误：**
   ```bash
   # 启用详细输出
   DEBUG=* openclaw plugins install @m1heng-clawd/feishu
   ```

## 临时解决方案

如果所有方法都失败，可以：

1. **在 PC 上安装插件，然后复制到手机：**
   ```bash
   # 在 PC 上
   openclaw plugins install @m1heng-clawd/feishu
   
   # 复制插件目录到手机
   adb push ~/.clawdbot/plugins/feishu /data/data/com.termux/files/home/.clawdbot/plugins/
   ```

2. **使用 git clone（如果插件有源码仓库）：**
   ```bash
   cd ~/.clawdbot/plugins
   git clone <plugin-repo-url> feishu
   cd feishu
   npm install
   ```

## 相关文件

- `scripts/fix-npm-complete.sh` - 完整修复脚本
- `scripts/diagnose-npm.sh` - 诊断脚本
- `scripts/fix-npm-shebang.sh` - shebang 修复脚本
