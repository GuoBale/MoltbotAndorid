# 相册/DCIM 文件访问权限说明

当 AI 或工具尝试「读取照片」「按路径打开 DCIM 里的图片」时，若出现：

```text
EACCES: permission denied, access '/storage/emulated/0/DCIM/Camera/xxx.jpg'
```

可能有两种原因，**即使已开启「允许管理所有文件」也可能出现第二种**。

## 原因一：Bridge 应用没有存储权限

Bridge 应用当前没有被允许通过文件路径直接访问相册/外部存储。

- Android 10+ 使用**分区存储**：应用默认不能通过绝对路径随意访问 `/storage/emulated/0/` 下的照片、下载等目录。
- 仅授予「照片和视频」「媒体」等权限时，通常只能通过 **MediaStore** 按内容访问，不能直接用路径 `File(path)` 打开。
- 若 Bridge 或上游工具是通过「文件路径」读图（例如 `android_file_read` 传入 DCIM 路径），就需要**更宽泛的存储权限**或 Bridge 改用 MediaStore 按 URI 读。

## 原因二：用了「本机读文件」工具去读手机路径（常见）

路径 `/storage/emulated/0/DCIM/...` 是**手机存储**上的路径。Gateway 运行在 **Termux（或本机）** 上，若 AI 调用的是**本机**的「读文件」或「看图/识图」工具（例如 `read`、`image`），这些工具会在 **Gateway 所在环境** 里按路径打开文件。

- 在 Termux 里，该路径往往不可访问或权限不足 → **EACCES**。
- 因此：**不要用本机的 read/image 工具去读手机路径**，而要用 **`android_file_read`**，由 Bridge 在手机上读文件并返回内容。

**正确做法**：对 `/storage/emulated/0/...` 这类手机路径，一律使用 **`android_file_read`**（传入 path），由 Bridge 应用在手机上读取；若需「识图」，应基于 `android_file_read` 返回的内容（如 base64）再交给识图能力，而不是把手机路径交给本机的 image 工具。

## 解决步骤

### 若是原因二（用了本机 read/image 读手机路径）

- **无需改手机权限**。请让 AI 对手机上的文件路径使用 **`android_file_read`**，不要使用本机的「读文件」或「看图」工具。
- 若需识图：用 `android_file_read` 拿到文件内容（如 base64）后，再交给支持「图片内容」的识图接口；或由支持「从 Android 路径读图」的流程统一走 Bridge。

### 若是原因一（Bridge 没有存储权限）

1. 在手机上打开 **设置**。
2. 进入 **应用** → 找到 **Moltbot Bridge**（或你安装的 Bridge 应用名）。
3. 进入 **权限**（或「权限管理」）。
4. 找到与**存储/文件/媒体**相关的权限，例如：
   - **「文件和媒体」** → 选择 **允许** 或 **允许访问所有文件**；
   - 或 **「存储」** → **允许**；
   - 或 **「所有文件」** / **「管理所有文件」** → **允许**（名称因厂商/系统版本而异）。
5. 保存后**重新执行**读图/读文件操作（如让 AI 再次尝试查看该照片）。

若系统没有「所有文件」选项，则当前版本可能只支持通过 MediaStore 访问媒体；此时需要 Bridge 应用在实现「按路径读文件」时，对媒体路径改为通过 MediaStore 解析为 content URI 再读取（见 [permission-guide.md](permission-guide.md) 中「按路径读取文件」一节）。

## 给 AI / 飞书回复的简短说明

遇到 EACCES 时，可以这样区分并回复用户：

- **若用户已开启「允许管理所有文件」**：多半是 AI 用了**本机**的 read/image 工具去读手机路径。应改用 **`android_file_read`** 或 **`android_image_read`**（由 Bridge 在手机上读），不要用本机的「读文件」「看图」工具读 `/storage/emulated/0/...`。
- **若用户未开「所有文件」**：请用户在手机上打开 **设置 → 应用 → Moltbot Bridge → 权限**，为 **「文件和媒体」** 或 **「所有文件」** 选择 **允许**，然后对手机路径使用 **`android_file_read`** / **`android_image_read`** 再试。
- **替代**：若用户不想给「所有文件」权限，可改为让用户手动上传该照片到对话中，或使用系统相册分享到其他支持「仅选图」的应用再处理。

## 相关文档

- [permission-guide.md](permission-guide.md) — 权限说明与「按路径读取文件」实现建议
- [README.md](../README.md) — 部署与权限总览
