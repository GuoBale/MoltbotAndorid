# Android Bridge Skills

本目录存放 Gateway 扩展的「场景/Skill」定义，每个 `.md` 文件对应一个可被 `android_scenario_guide` 加载的场景，便于组合与扩展。

## 文件格式

每个 skill 使用 **YAML frontmatter + Markdown 正文**：

```markdown
---
id: my-skill
name: 显示名称
description: 简短描述，用于列表和系统提示
triggers: 触发词1,触发词2,触发词3
tools: android_xxx,android_yyy
---

## 工作流标题
正文为 Markdown，描述操作步骤、工具用法、输出模板等。
```

- **id**：唯一标识，英文，与文件名建议一致（如 `daily-briefing`）。
- **name**：中文名称，展示给用户。
- **description**：一句话说明场景用途。
- **triggers**：逗号分隔的触发词，用户说到这些词时会匹配该场景。
- **tools**：逗号分隔的 `android_*` 工具名，便于检索和提示。
- 正文：任意 Markdown，作为「工作流/指南」内容返回给模型。

## 添加新 Skill

1. 在本目录新建 `your-skill-id.md`。
2. 按上面格式填写 frontmatter 和正文。
3. 无需改 TypeScript 代码，插件启动时会自动扫描 `skills/*.md` 并注册。

## 内置场景

| id | name |
|----|------|
| daily-briefing | 每日播报 |
| quick-actions | 快捷操作 |
| contact-intelligence | 联系人智能分析 |
| automation-workflows | 自动化工作流 |
| photo-assistant | 相册助手 |
| location-navigator | 位置导航 |
| security-privacy | 安全隐私检查 |
