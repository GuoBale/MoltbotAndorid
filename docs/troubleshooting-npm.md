# npm 安装问题故障排除

## 错误：Termux 镜像源同步问题

### 问题描述

在安装包时，可能遇到以下错误：

```
File has unexpected size (522321 != 523280). Mirror sync in progress?
E: Failed to fetch ... File has unexpected size
```

### 解决方案

**快速修复：**

```bash
# 使用修复脚本
./scripts/fix-termux-repo.sh

# 或使用交互式工具
termux-change-repo
```

**手动修复：**

```bash
# 使用清华大学镜像（中国用户推荐）
cat > $PREFIX/etc/apt/sources.list << 'EOF'
deb [arch=all,arm,aarch64,x86_64] https://mirrors.tuna.tsinghua.edu.cn/termux stable main
EOF

# 更新包列表
pkg update
```

详见：[Termux 镜像源修复脚本](../scripts/fix-termux-repo.sh)

---

## 错误：Cannot find module '/bin/npm'

### 问题描述

在 Termux 环境中安装插件（如飞书插件）时，可能遇到以下错误：

```
Downloading @m1heng-clawd/feishu…
npm pack failed: node:internal/modules/cjs/loader:1424
  throw err;
  ^

Error: Cannot find module '/bin/npm'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1421:15)
    ...
```

### 原因

这个错误通常是因为：
1. npm 的 shebang 行指向了错误的路径（`/bin/npm` 在 Android 上不存在）
2. npm 安装不完整或损坏
3. Node.js 和 npm 版本不匹配

在 Termux 环境中，npm 应该安装在 `/data/data/com.termux/files/usr/bin/npm`，而不是 `/bin/npm`。

### 解决方案

#### 方法 1：使用修复脚本（推荐）

运行项目提供的修复脚本：

```bash
cd ~/MoltbotAndorid
./scripts/fix-npm.sh
```

脚本会自动：
- 检测 npm 安装状态
- 重新安装 Node.js（包含 npm）
- 修复 npm 链接
- 配置 npm 全局目录和 PATH

#### 方法 2：重新安装 Node.js

```bash
# 重新安装 Node.js（包含 npm）
pkg reinstall nodejs-lts

# 验证修复
npm --version
which npm
```

#### 方法 3：完全重新安装

如果方法 1 和方法 2 都不行，尝试完全重新安装：

```bash
# 移除 Node.js
pkg remove nodejs-lts

# 清理缓存
pkg clean

# 重新安装
pkg install nodejs-lts

# 验证安装
node -v
npm -v
which npm
```

#### 方法 4：手动修复 npm 链接

如果 npm 存在但路径有问题：

```bash
# 查找 npm 的实际位置
find $PREFIX -name npm -type f

# 检查 npm 的 shebang
head -n 1 $(which npm)

# 如果 shebang 指向 /bin/npm，需要修复
# 通常重新安装 Node.js 即可解决
```

### 验证修复

修复后，执行以下命令验证：

```bash
# 检查 npm 版本
npm --version

# 检查 npm 路径
which npm

# 测试 npm 命令
npm config get prefix

# 测试安装包（可选）
npm install -g cowsay
cowsay "npm is working!"
```

### 配置 npm（修复后）

修复 npm 后，建议配置：

```bash
# 创建全局安装目录
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global

# 添加到 PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 配置镜像（中国用户）
npm config set registry https://registry.npmmirror.com
```

### 预防措施

1. **使用官方 Termux 源**  
   确保从 F-Droid 或 GitHub Releases 安装 Termux，不要使用 Google Play 版本。

2. **定期更新**  
   ```bash
   pkg update
   pkg upgrade
   ```

3. **避免手动修改 npm**  
   不要手动编辑 npm 脚本或修改 shebang 行。

### 相关文档

- [Termux 环境配置指南](termux-setup.md)
- [README - 故障排除](../README.md)
- [npm 官方文档](https://docs.npmjs.com/)

### 仍然无法解决？

如果以上方法都无法解决问题：

1. **检查 Termux 版本**  
   确保使用最新版本的 Termux（从 F-Droid 或 GitHub 下载）

2. **检查系统权限**  
   确保 Termux 有足够的存储权限：
   ```bash
   termux-setup-storage
   ```

3. **查看详细错误信息**  
   ```bash
   npm --version 2>&1
   node -v
   which node
   which npm
   ```

4. **重新安装 Termux**  
   如果问题持续存在，可能需要重新安装 Termux（注意备份数据）

5. **寻求帮助**  
   在项目 Issues 中提供以下信息：
   - Termux 版本
   - Node.js 版本（`node -v`）
   - npm 版本（`npm -v`）
   - 完整的错误信息
   - 已尝试的修复方法
