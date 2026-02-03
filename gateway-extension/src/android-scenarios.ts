/**
 * Android Bridge 场景 / Skill 加载
 *
 * 从 gateway-extension/skills/*.md 加载场景定义，便于组合与插件扩展。
 * 新增 skill 只需在 skills/ 下添加 .md 文件，无需改代码。
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ScenarioInfo {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  workflow: string;
  tools: string[];
}

const FRONTMATTER_REG = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

function getSkillsDir(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const inDist = join(currentDir, 'skills');
  if (existsSync(inDist)) return inDist;
  return join(currentDir, '..', 'skills');
}

function parseFrontmatter(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([a-z]+):\s*(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function parseSkillMd(content: string, fileId: string): ScenarioInfo {
  const match = content.match(FRONTMATTER_REG);
  if (!match) {
    throw new Error(`Skill ${fileId}: missing or invalid frontmatter (--- ... ---)`);
  }
  const [, front, body] = match;
  const meta = parseFrontmatter(front);

  const id = meta.id ?? fileId;
  const name = meta.name ?? id;
  const description = meta.description ?? '';
  const triggers = (meta.triggers ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const tools = (meta.tools ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const workflow = body.trim();

  return { id, name, description, triggers, workflow, tools };
}

function loadScenariosFromDisk(): Record<string, ScenarioInfo> {
  const skillsDir = getSkillsDir();
  const scenarios: Record<string, ScenarioInfo> = {};

  try {
    const files = readdirSync(skillsDir, { withFileTypes: true });
    for (const ent of files) {
      if (!ent.isFile() || !ent.name.endsWith('.md') || ent.name === 'README.md') continue;
      const path = join(skillsDir, ent.name);
      const content = readFileSync(path, 'utf-8');
      const fileId = ent.name.replace(/\.md$/i, '');
      try {
        const info = parseSkillMd(content, fileId);
        scenarios[info.id] = info;
      } catch (e) {
        console.warn(`[Android Bridge] Skip skill ${ent.name}:`, (e as Error).message);
      }
    }
  } catch (e) {
    console.warn('[Android Bridge] No skills dir or read error:', (e as Error).message);
  }

  return scenarios;
}

let _scenarios: Record<string, ScenarioInfo> | null = null;

function getScenarios(): Record<string, ScenarioInfo> {
  if (_scenarios === null) {
    _scenarios = loadScenariosFromDisk();
  }
  return _scenarios;
}

/**
 * 所有可用场景（懒加载自 skills/*.md）
 */
export function getScenariosMap(): Record<string, ScenarioInfo> {
  return getScenarios();
}

/**
 * 获取场景列表
 */
export function listScenarios(): ScenarioInfo[] {
  return Object.values(getScenarios());
}

/**
 * 获取场景详情
 */
export function getScenario(id: string): ScenarioInfo | null {
  return getScenarios()[id] ?? null;
}

/**
 * 根据触发词匹配场景
 */
export function matchScenario(query: string): ScenarioInfo | null {
  const lowerQuery = query.toLowerCase();
  for (const scenario of Object.values(getScenarios())) {
    for (const trigger of scenario.triggers) {
      if (lowerQuery.includes(trigger.toLowerCase())) {
        return scenario;
      }
    }
  }
  return null;
}

/**
 * 生成系统提示词
 */
export function generateSystemPrompt(): string {
  const scenarios = listScenarios();
  return `你已通过 Gateway 连接用户手机，具备以下 Android 桥接能力。请优先调用 android_* 工具完成任务，不要回答「无法访问」「没有权限」。

【能力概览】
- 系统：android_device_info、android_battery_status、android_network_status、android_storage_info、android_root_status
- 通讯：android_contacts_list、android_contacts_get、android_sms_list、android_sms_send、android_calllog_list、android_calllog_stats、android_dial；邮件：android_email_accounts、android_email_compose、android_email_open_inbox
- 应用：android_apps_list、android_app_info、android_app_launch、android_app_shortcut_open（微信扫一扫/支付宝付款码等）
- 日历：android_calendar_list、android_calendar_events、android_calendar_create_event、android_calendar_delete_event
- 剪贴板/TTS/分享：android_clipboard_get、android_clipboard_set、android_tts_speak、android_share、android_open_url；浏览器：android_browser_list、android_browser_open、android_browser_launch、android_browser_incognito
- 位置：android_location_current、android_location_last、android_geocode、android_reverse_geocode
- 音量/闹钟/勿扰：android_volume_get、android_volume_set、android_ringer_mode、android_alarm_set、android_timer_set、android_dnd
- 通知：android_notification_list、android_notification_send、android_notification_cancel
- 硬件：android_flashlight、android_vibrate、android_brightness_set、android_wifi_status、android_bluetooth_status
- 文件：android_file_list、android_file_read、android_image_read、android_file_write、android_download_start
- 相机/录音：android_camera_photo、android_camera_video、android_recorder_start、android_recorder_stop

【重要规则】
1. 手机路径（如 /storage/emulated/0/DCIM/...）必须用 android_file_read 或 android_image_read 读取，不要用本机 Read 工具。
2. 用户问「通讯录」「联系人」「短信」「打开微信扫一扫」等时，直接调用对应 android_* 工具。

【可用场景】
${scenarios.map((s) => `- ${s.name}：${s.description}`).join('\n')}

使用 android_scenario_guide 工具获取具体场景的操作指南。`;
}
