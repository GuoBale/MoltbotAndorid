# 为 Bridge 应用授予 Root 权限

本文说明如何让当前桥接（Bridge）应用在已 Root 的设备上获得 root 权限，以及使用方式与注意事项。

---

## 一、前提条件

1. **设备已 Root**  
   使用 Magisk 或 SuperSU 等方案完成 Root，且能正常弹出「授权/拒绝」提示。

2. **Bridge 应用已安装**  
   即已安装 Moltbot Bridge（本项目的 Android App）。

---

## 二、如何「给 Bridge 开 root 权限」

Root 权限是**按应用授权**的：当应用**第一次执行需要 root 的命令**时，Magisk/SuperSU 会弹出提示，用户选择「允许」后，该应用之后即可使用 root。

### 方式一：通过 Bridge 自带的 root 检测触发授权（推荐）

1. 确保设备已 Root（Magisk 等已安装且运行）。
2. 启动 Bridge 服务（前台服务正常运行）。
3. 在 Termux 或电脑上请求 Bridge 的 root 状态接口，**触发一次 root 检测**：
   ```bash
   curl -s http://127.0.0.1:18800/api/v1/root/status
   ```
   或在 Gateway 扩展中调用 `android_root_status` 工具。
4. 此时手机会弹出 **Magisk/SuperSU 的授权窗口**：「Moltbot Bridge 请求 root 权限」。
5. 选择 **「允许」**（可勾选「始终允许」），Bridge 即获得 root 权限。
6. 再次请求 `/api/v1/root/status`，若返回 `"available": true`，说明已授权成功。

之后 Bridge 在需要 root 的接口中会使用已授权的 root 权限。

### 方式二：在 Magisk 中预先授权

1. 打开 **Magisk Manager**（或 Magisk 应用）。
2. 进入 **「Superuser」/「超级用户」** 或 **「授权管理」**。
3. 在应用列表中找到 **Moltbot Bridge**（或你安装的 Bridge 包名）。
4. 若列表中没有，先按「方式一」触发一次 root 请求，再回到此处。
5. 将该应用的权限设为 **「允许」**（可勾选「永久授权」）。

效果与方式一相同，只是提前在 Magisk 里放行。

---

## 三、当前 Bridge 对 root 的使用

- **root 状态接口**：`GET /api/v1/root/status` 会检测设备是否可用 root，并返回 `available`、`uid` 等。  
  调用该接口时会执行一次 `su`，从而触发 Magisk 授权。
- **其他接口**：当前默认逻辑**不依赖 root**；后续若增加「仅 root 可用」的能力（如读部分系统文件、执行系统命令等），会在接口说明中注明。

因此：**给 Bridge「开 root 权限」= 在 Magisk 里对 Bridge 应用选择「允许」**，而触发方式就是调用一次 `/api/v1/root/status` 或使用 `android_root_status` 工具。

---

## 四、撤销 root 权限

- 在 Magisk Manager → Superuser/超级用户 中找到 **Moltbot Bridge**，改为「拒绝」或删除授权。  
- 之后 Bridge 再执行需要 root 的操作时会失败，直至重新授权。

---

## 五、安全与风险提示

- Root 会降低系统安全边界，仅建议在**自用、测试或开发环境**使用。
- 授权给 Bridge 即允许该应用以 root 执行你实现的命令，请确保只安装可信的 Bridge 版本。
- 若 Bridge 后续增加「执行任意 shell」等能力，务必限制调用来源（如仅本机、仅局域网），并自行承担风险。

---

## 六、常见问题

**Q：请求 `/api/v1/root/status` 后没有弹出授权窗口？**  
- 确认设备已 Root，且 Magisk/SuperSU 服务正常。  
- 部分 ROM 会屏蔽 su 请求，需在 Magisk 设置中检查「超级用户」是否开启。  
- 确认请求的是本机 Bridge（如 `127.0.0.1:18800`），避免请求到未安装 Bridge 的设备。

**Q：已授权但仍返回 `available: false`？**  
- 在 Magisk 的 Superuser 列表中确认 Bridge 为「允许」状态。  
- 重启 Bridge 服务或重启手机后再试一次。

**Q：不想给 root，Bridge 还能用吗？**  
- 可以。当前 Bridge 的通讯录、短信、通知、应用打开等能力均不依赖 root；只有标注「需要 root」的接口才需要授权。
