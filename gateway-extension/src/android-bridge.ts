/**
 * Moltbot Android Bridge Extension
 *
 * 为 clawdbot Gateway 提供 Android API 访问能力
 */

import { AndroidBridgeClient, BridgeConfig } from './android-bridge-client.js';
import { listScenarios, getScenario, matchScenario, generateSystemPrompt, ScenarioInfo } from './android-scenarios.js';

export { AndroidBridgeClient, BridgeConfig };
export { listScenarios, getScenario, matchScenario, generateSystemPrompt };

// 导出类型
export * from './types.js';

/**
 * 插件注册函数
 * clawdbot 插件格式: export default function(api) { ... }
 */
export default function register(api: any): void {
  console.log('[Android Bridge] Registering plugin...');

  const bridgeConfig: BridgeConfig = {
    host: process.env.ANDROID_BRIDGE_HOST ?? '127.0.0.1',
    port: parseInt(process.env.ANDROID_BRIDGE_PORT ?? '18800', 10),
    timeout: 30000,
  };

  const bridge = new AndroidBridgeClient(bridgeConfig);

  // 检查 Bridge 连接
  bridge.health().then(
    (health) => {
      console.log(`[Android Bridge] Connected to Bridge Service (uptime: ${health.uptime}s)`);
    },
    (error) => {
      console.warn(`[Android Bridge] Bridge Service not available: ${error.message}`);
      console.warn('[Android Bridge] Make sure Bridge Service is running on Android device');
    }
  );

  // 注册 Android 工具
  registerAndroidTools(api, bridge);

  console.log('[Android Bridge] Plugin registered');
}

/**
 * 兼容旧版 activate 函数
 */
export function activate(gateway: any, _config?: BridgeConfig): void {
  console.log('[Android Bridge] activate() called, delegating to default export...');
  register(gateway);
}

/**
 * 扩展停用函数
 */
export function deactivate(): void {
  console.log('[Android Bridge] Extension deactivated');
}

/**
 * 注册所有 Android 工具
 */
function registerAndroidTools(api: any, bridge: AndroidBridgeClient): void {
  if (typeof api?.registerTool !== 'function') {
    console.error('[Android Bridge] ERROR: api.registerTool is not a function!');
    return;
  }

  // ========== 系统信息工具 ==========

  api.registerTool({
    name: 'android_device_info',
    description: '获取 Android 设备信息，包括型号、系统版本、屏幕尺寸等',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getDeviceInfo();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_battery_status',
    description: '获取 Android 设备电池状态，包括电量、充电状态、温度等',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getBatteryStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_network_status',
    description: '获取 Android 设备网络状态，包括连接类型、WiFi 信息等',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getNetworkStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 联系人工具 ==========

  api.registerTool({
    name: 'android_contacts_list',
    description: '获取 Android 设备上的联系人列表',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词，用于筛选联系人姓名',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认 100',
        },
        offset: {
          type: 'number',
          description: '偏移量，用于分页',
        },
      },
      required: [],
    },
    async execute(_id: string, params: { query?: string; limit?: number; offset?: number }) {
      try {
        const result = await bridge.getContacts({
          q: params.query,
          limit: params.limit,
          offset: params.offset,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_contacts_get',
    description: '获取指定联系人的详细信息',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '联系人 ID',
        },
      },
      required: ['id'],
    },
    async execute(_id: string, params: { id: string }) {
      try {
        const result = await bridge.getContact(params.id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 应用管理工具 ==========

  api.registerTool({
    name: 'android_apps_list',
    description: '获取 Android 设备上已安装的应用列表',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['user', 'system', 'all'],
          description: '应用类型: user(用户应用), system(系统应用), all(全部)',
        },
        query: {
          type: 'string',
          description: '搜索关键词，用于筛选应用名称',
        },
      },
      required: [],
    },
    async execute(_id: string, params: { type?: 'user' | 'system' | 'all'; query?: string }) {
      try {
        const result = await bridge.getApps({
          type: params.type,
          q: params.query,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_app_launch',
    description: '启动 Android 应用',
    parameters: {
      type: 'object',
      properties: {
        package: {
          type: 'string',
          description: '应用包名，如 com.android.chrome',
        },
      },
      required: ['package'],
    },
    async execute(_id: string, params: { package: string }) {
      try {
        const result = await bridge.launchApp(params.package);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_app_info',
    description: '获取指定应用的详细信息',
    parameters: {
      type: 'object',
      properties: {
        package: {
          type: 'string',
          description: '应用包名',
        },
      },
      required: ['package'],
    },
    async execute(_id: string, params: { package: string }) {
      try {
        const result = await bridge.getAppInfo(params.package);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 短信工具 ==========

  api.registerTool({
    name: 'android_sms_list',
    description: '获取 Android 设备上的短信列表（收件箱/已发送/全部）。需要 Bridge 应用已授予读取短信权限。',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['inbox', 'sent', 'all'],
          description: '短信类型: inbox(收件箱), sent(已发送), all(全部)，默认 inbox',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认 50',
        },
        address: {
          type: 'string',
          description: '按号码筛选，只返回与该号码的往来短信',
        },
      },
      required: [],
    },
    async execute(_id: string, params: { type?: 'inbox' | 'sent' | 'all'; limit?: number; address?: string }) {
      try {
        const result = await bridge.getSms(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_sms_send',
    description: '发送短信。需要 Bridge 应用已授予发送短信权限。',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: '收件人号码（如 13800138000 或 +8613800138000）',
        },
        text: {
          type: 'string',
          description: '短信正文内容',
        },
      },
      required: ['to', 'text'],
    },
    async execute(_id: string, params: { to: string; text: string }) {
      try {
        const result = await bridge.sendSms(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 日历工具 ==========

  api.registerTool({
    name: 'android_calendar_list',
    description: '获取 Android 设备上的日历列表',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getCalendars();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_calendar_events',
    description: '获取日历事件列表，可按时间范围筛选',
    parameters: {
      type: 'object',
      properties: {
        startTime: { type: 'number', description: '开始时间（毫秒时间戳），默认昨天' },
        endTime: { type: 'number', description: '结束时间（毫秒时间戳），默认 30 天后' },
        limit: { type: 'number', description: '返回数量限制，默认 100' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.getCalendarEvents(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_calendar_create_event',
    description: '在日历中创建事件',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '事件标题' },
        startTime: { type: 'number', description: '开始时间（毫秒时间戳）' },
        endTime: { type: 'number', description: '结束时间（毫秒时间戳）' },
        description: { type: 'string', description: '事件描述' },
        location: { type: 'string', description: '事件地点' },
        calendarId: { type: 'string', description: '日历 ID，不传则使用默认日历' },
        allDay: { type: 'boolean', description: '是否全天事件' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.createCalendarEvent(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 剪贴板工具 ==========

  api.registerTool({
    name: 'android_clipboard_get',
    description: '获取 Android 剪贴板内容',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getClipboard();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_clipboard_set',
    description: '设置 Android 剪贴板内容',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '要复制的文本' },
        label: { type: 'string', description: '剪贴板标签' },
      },
      required: ['text'],
    },
    async execute(_id: string, params: { text: string; label?: string }) {
      try {
        const result = await bridge.setClipboard(params.text, params.label);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== TTS 工具 ==========

  api.registerTool({
    name: 'android_tts_speak',
    description: '使用 Android TTS 朗读文本',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '要朗读的文本' },
        language: { type: 'string', description: '语言代码，如 zh-CN, en-US' },
        pitch: { type: 'number', description: '音调，0.5-2.0' },
        rate: { type: 'number', description: '语速，0.5-2.0' },
      },
      required: ['text'],
    },
    async execute(_id: string, params: { text: string; language?: string; pitch?: number; rate?: number }) {
      try {
        const result = await bridge.speak(params.text, {
          language: params.language,
          pitch: params.pitch,
          rate: params.rate,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_tts_stop',
    description: '停止 Android TTS 朗读',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.stopSpeaking();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== Intent 工具 ==========

  api.registerTool({
    name: 'android_share',
    description: '通过 Android 分享功能分享文本',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '要分享的文本' },
        title: { type: 'string', description: '分享对话框标题' },
      },
      required: ['text'],
    },
    async execute(_id: string, params: { text: string; title?: string }) {
      try {
        const result = await bridge.share(params.text, params.title);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_dial',
    description: '打开 Android 拨号界面',
    parameters: {
      type: 'object',
      properties: {
        number: { type: 'string', description: '电话号码' },
      },
      required: ['number'],
    },
    async execute(_id: string, params: { number: string }) {
      try {
        const result = await bridge.dial(params.number);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_open_url',
    description: '在 Android 浏览器中打开 URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL 地址' },
      },
      required: ['url'],
    },
    async execute(_id: string, params: { url: string }) {
      try {
        const result = await bridge.openUrl(params.url);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 通话记录工具 ==========

  api.registerTool({
    name: 'android_calllog_list',
    description: '获取 Android 设备的通话记录',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['incoming', 'outgoing', 'missed', 'rejected'],
          description: '通话类型: incoming(来电), outgoing(去电), missed(未接), rejected(拒接)',
        },
        limit: { type: 'number', description: '返回数量限制，默认 50' },
        offset: { type: 'number', description: '偏移量，用于分页' },
        number: { type: 'string', description: '按号码筛选' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.getCallLogs(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_calllog_stats',
    description: '获取通话记录统计信息（总通话数、总时长、各类型统计）',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'number', description: '开始时间（毫秒时间戳），默认30天前' },
        endDate: { type: 'number', description: '结束时间（毫秒时间戳），默认现在' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.getCallLogStats(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 位置工具 ==========

  api.registerTool({
    name: 'android_location_current',
    description: '获取 Android 设备当前位置（需要位置权限）',
    parameters: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: '位置提供者: gps, network' },
        timeout: { type: 'number', description: '超时时间（毫秒），默认10000' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.getCurrentLocation(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_location_last',
    description: '获取 Android 设备最后已知位置（比实时获取更快）',
    parameters: {
      type: 'object',
      properties: {
        provider: { type: 'string', description: '位置提供者: gps, network' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.getLastKnownLocation(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_geocode',
    description: '将地址转换为经纬度坐标（地理编码）',
    parameters: {
      type: 'object',
      properties: {
        address: { type: 'string', description: '要查询的地址' },
        maxResults: { type: 'number', description: '最大结果数，默认5' },
      },
      required: ['address'],
    },
    async execute(_id: string, params: { address: string; maxResults?: number }) {
      try {
        const result = await bridge.geocode(params.address, params.maxResults);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_reverse_geocode',
    description: '将经纬度坐标转换为地址（逆地理编码）',
    parameters: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: '纬度' },
        longitude: { type: 'number', description: '经度' },
        maxResults: { type: 'number', description: '最大结果数，默认5' },
      },
      required: ['latitude', 'longitude'],
    },
    async execute(_id: string, params: { latitude: number; longitude: number; maxResults?: number }) {
      try {
        const result = await bridge.reverseGeocode(params.latitude, params.longitude, params.maxResults);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 音量工具 ==========

  api.registerTool({
    name: 'android_volume_get',
    description: '获取 Android 设备所有音量状态（媒体、铃声、闹钟等）',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getVolumes();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_volume_set',
    description: '设置 Android 设备音量',
    parameters: {
      type: 'object',
      properties: {
        stream: {
          type: 'string',
          enum: ['music', 'ring', 'alarm', 'notification', 'voice_call', 'system'],
          description: '音量类型',
        },
        value: { type: 'number', description: '音量值（绝对值）' },
        percentage: { type: 'number', description: '音量百分比 0-100' },
        showUI: { type: 'boolean', description: '是否显示音量 UI' },
      },
      required: ['stream'],
    },
    async execute(_id: string, params: { stream: string; value?: number; percentage?: number; showUI?: boolean }) {
      try {
        const result = await bridge.setVolume(params.stream, params.value, params.percentage, params.showUI);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_volume_adjust',
    description: '调整 Android 设备音量（增大/减小）',
    parameters: {
      type: 'object',
      properties: {
        stream: {
          type: 'string',
          enum: ['music', 'ring', 'alarm', 'notification', 'voice_call', 'system'],
          description: '音量类型',
        },
        direction: {
          type: 'string',
          enum: ['up', 'down'],
          description: '调整方向: up(增大), down(减小)',
        },
        showUI: { type: 'boolean', description: '是否显示音量 UI' },
      },
      required: ['stream', 'direction'],
    },
    async execute(_id: string, params: { stream: string; direction: 'up' | 'down'; showUI?: boolean }) {
      try {
        const result = await bridge.adjustVolume(params.stream, params.direction, params.showUI);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_ringer_mode',
    description: '获取或设置 Android 铃声模式',
    parameters: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['normal', 'silent', 'vibrate'],
          description: '铃声模式: normal(正常), silent(静音), vibrate(振动)。不提供则获取当前模式',
        },
      },
      required: [],
    },
    async execute(_id: string, params: { mode?: 'normal' | 'silent' | 'vibrate' }) {
      try {
        if (params.mode) {
          const result = await bridge.setRingerMode(params.mode);
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } else {
          const result = await bridge.getRingerMode();
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 闹钟工具 ==========

  api.registerTool({
    name: 'android_alarm_set',
    description: '设置 Android 闹钟',
    parameters: {
      type: 'object',
      properties: {
        hour: { type: 'number', description: '小时 (0-23)' },
        minute: { type: 'number', description: '分钟 (0-59)' },
        message: { type: 'string', description: '闹钟标签/消息' },
        days: {
          type: 'array',
          items: { type: 'number' },
          description: '重复的星期 (1=周日, 2=周一, ..., 7=周六)',
        },
        skipUI: { type: 'boolean', description: '跳过闹钟 UI 确认' },
        vibrate: { type: 'boolean', description: '是否振动，默认 true' },
      },
      required: ['hour', 'minute'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.setAlarm(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_timer_set',
    description: '设置 Android 倒计时器',
    parameters: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: '总秒数' },
        minutes: { type: 'number', description: '分钟数' },
        seconds: { type: 'number', description: '秒数' },
        hours: { type: 'number', description: '小时数' },
        message: { type: 'string', description: '计时器标签' },
        skipUI: { type: 'boolean', description: '跳过计时器 UI' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.setTimer(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_alarm_dismiss',
    description: '关闭正在响的闹钟',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.dismissAlarm();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_alarm_snooze',
    description: '延迟正在响的闹钟（稍后提醒）',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.snoozeAlarm();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_alarm_show',
    description: '打开系统闹钟应用',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.showAlarms();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 通知工具 ==========

  api.registerTool({
    name: 'android_notification_list',
    description: '获取 Android 设备当前的通知列表（需要通知访问权限）',
    parameters: {
      type: 'object',
      properties: {
        package: { type: 'string', description: '按应用包名筛选' },
        limit: { type: 'number', description: '返回数量限制，默认 50' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.getNotifications(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_notification_send',
    description: '发送一条本地通知',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '通知标题' },
        content: { type: 'string', description: '通知内容' },
        id: { type: 'number', description: '通知 ID，用于更新或取消' },
        priority: { type: 'number', description: '优先级 -2 到 2' },
        ongoing: { type: 'boolean', description: '是否为持续通知' },
        silent: { type: 'boolean', description: '是否静默（无声音/振动）' },
        bigText: { type: 'string', description: '展开后显示的长文本' },
      },
      required: ['title', 'content'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.sendNotification(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_notification_cancel',
    description: '取消指定的通知',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '要取消的通知 ID' },
      },
      required: ['id'],
    },
    async execute(_id: string, params: { id: number }) {
      try {
        const result = await bridge.cancelNotification(params.id);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_notification_cancel_all',
    description: '取消所有通知',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.cancelAllNotifications();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_notification_access',
    description: '检查通知访问权限状态，如果没有权限可以打开设置',
    parameters: {
      type: 'object',
      properties: {
        openSettings: { type: 'boolean', description: '是否打开通知设置页面' },
      },
      required: [],
    },
    async execute(_id: string, params: { openSettings?: boolean }) {
      try {
        if (params.openSettings) {
          const result = await bridge.openNotificationSettings();
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        } else {
          const result = await bridge.checkNotificationAccess();
          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 屏幕工具 ==========

  api.registerTool({
    name: 'android_screen_info',
    description: '获取屏幕状态信息（亮度、超时时间、显示参数）',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getScreenInfo();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_brightness_set',
    description: '设置屏幕亮度',
    parameters: {
      type: 'object',
      properties: {
        value: { type: 'number', description: '亮度值 0-255' },
        percentage: { type: 'number', description: '亮度百分比 0-100' },
        auto: { type: 'boolean', description: '是否启用自动亮度' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.setBrightness(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== WiFi 工具 ==========

  api.registerTool({
    name: 'android_wifi_status',
    description: '获取 WiFi 状态和连接信息',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getWifiStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_wifi_scan',
    description: '扫描附近的 WiFi 网络',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.scanWifi();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_wifi_settings',
    description: '打开 WiFi 设置页面',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.openWifiSettings();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 蓝牙工具 ==========

  api.registerTool({
    name: 'android_bluetooth_status',
    description: '获取蓝牙状态',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getBluetoothStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_bluetooth_devices',
    description: '获取已配对的蓝牙设备列表',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getPairedDevices();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_bluetooth_settings',
    description: '打开蓝牙设置页面',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.openBluetoothSettings();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 手电筒工具 ==========

  api.registerTool({
    name: 'android_flashlight',
    description: '控制手电筒（开/关/切换）',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['on', 'off', 'toggle', 'status'], description: '操作类型' },
      },
      required: [],
    },
    async execute(_id: string, params: { action?: string }) {
      try {
        let result;
        switch (params.action) {
          case 'on': result = await bridge.setFlashlight(true); break;
          case 'off': result = await bridge.setFlashlight(false); break;
          case 'toggle': result = await bridge.toggleFlashlight(); break;
          default: result = await bridge.getFlashlightStatus();
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 振动工具 ==========

  api.registerTool({
    name: 'android_vibrate',
    description: '控制设备振动',
    parameters: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: '振动时长（毫秒），默认 200' },
        amplitude: { type: 'number', description: '振动强度 1-255' },
        pattern: { type: 'array', items: { type: 'number' }, description: '振动模式（毫秒数组）' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        let result;
        if (params.pattern) {
          result = await bridge.vibratePattern({ pattern: params.pattern, repeat: params.repeat });
        } else {
          result = await bridge.vibrate({ duration: params.duration, amplitude: params.amplitude });
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 勿扰模式工具 ==========

  api.registerTool({
    name: 'android_dnd',
    description: '获取或设置勿扰模式',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'enable', 'disable', 'toggle', 'settings'], description: '操作类型' },
        filter: { type: 'string', enum: ['priority', 'alarms', 'none'], description: '勿扰过滤级别' },
      },
      required: [],
    },
    async execute(_id: string, params: { action?: string; filter?: string }) {
      try {
        let result;
        switch (params.action) {
          case 'enable': result = await bridge.setDnd(true, params.filter); break;
          case 'disable': result = await bridge.setDnd(false); break;
          case 'toggle': result = await bridge.toggleDnd(); break;
          case 'settings': result = await bridge.openDndSettings(); break;
          default: result = await bridge.getDndStatus();
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 存储工具 ==========

  api.registerTool({
    name: 'android_storage_info',
    description: '获取设备存储空间信息',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getStorageInfo();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 传感器工具 ==========

  api.registerTool({
    name: 'android_sensor_list',
    description: '获取设备可用的传感器列表',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.listSensors();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_sensor_read',
    description: '读取指定传感器的数据',
    parameters: {
      type: 'object',
      properties: {
        sensor: { type: 'string', enum: ['accelerometer', 'gyroscope', 'magnetic', 'light', 'pressure', 'proximity', 'gravity', 'rotation', 'step_counter', 'humidity', 'temperature'], description: '传感器类型' },
      },
      required: ['sensor'],
    },
    async execute(_id: string, params: { sensor: string }) {
      try {
        const result = await bridge.readSensor(params.sensor);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 文件工具 ==========

  api.registerTool({
    name: 'android_file_list',
    description: '列出目录中的文件',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' },
        recursive: { type: 'boolean', description: '是否递归列出' },
        showHidden: { type: 'boolean', description: '是否显示隐藏文件' },
        limit: { type: 'number', description: '最大返回数量' },
      },
      required: ['path'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.listFiles(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_file_read',
    description: '读取手机上的文件内容。路径必须是手机存储路径（如 /storage/emulated/0/DCIM/Camera/xxx.jpg）。不要用本机的 read 工具读手机路径，会 EACCES。',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '手机上的文件路径' },
        maxSize: { type: 'number', description: '最大读取字节数' },
      },
      required: ['path'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.readFile(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_image_read',
    description: '从手机存储路径读取图片文件内容，用于识图/看图。仅用于手机路径（如 /storage/emulated/0/DCIM/Camera/xxx.jpg），不要用本机 image 工具读该路径。返回内容含 base64 等时可交给识图能力分析。默认最大读取 1GB。',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '手机上的图片文件路径' },
        maxSize: { type: 'number', description: '最大读取字节数，默认 1GB (1073741824)' },
      },
      required: ['path'],
    },
    async execute(_id: string, params: any) {
      try {
        // 默认最大读取 1GB
        const maxSize = params.maxSize ?? 1073741824;
        const result = await bridge.readFile({ path: params.path, maxSize });
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_file_write',
    description: '写入文件内容',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        content: { type: 'string', description: '要写入的内容' },
        append: { type: 'boolean', description: '是否追加模式' },
      },
      required: ['path', 'content'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.writeFile(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_file_directories',
    description: '获取常用目录路径',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getCommonDirectories();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 下载工具 ==========

  api.registerTool({
    name: 'android_download_list',
    description: '获取下载列表',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['running', 'pending', 'paused', 'successful', 'failed'], description: '按状态筛选' },
        limit: { type: 'number', description: '最大返回数量' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.listDownloads(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_download_start',
    description: '开始下载文件',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '下载 URL' },
        title: { type: 'string', description: '下载标题' },
        fileName: { type: 'string', description: '保存的文件名' },
        showNotification: { type: 'boolean', description: '是否显示下载通知' },
      },
      required: ['url'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.startDownload(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_download_status',
    description: '获取下载状态',
    parameters: {
      type: 'object',
      properties: {
        downloadId: { type: 'number', description: '下载 ID' },
      },
      required: ['downloadId'],
    },
    async execute(_id: string, params: { downloadId: number }) {
      try {
        const result = await bridge.getDownloadStatus(params.downloadId);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 相机工具 ==========

  api.registerTool({
    name: 'android_camera_info',
    description: '获取相机信息',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getCameraInfo();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_camera_photo',
    description: '打开相机拍照',
    parameters: {
      type: 'object',
      properties: {
        facing: { type: 'string', enum: ['front', 'back'], description: '使用前置或后置摄像头' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.takePhoto(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_camera_video',
    description: '打开相机录像',
    parameters: {
      type: 'object',
      properties: {
        facing: { type: 'string', enum: ['front', 'back'], description: '使用前置或后置摄像头' },
        quality: { type: 'string', enum: ['low', 'high'], description: '视频质量' },
        maxDuration: { type: 'number', description: '最大录制时长（秒）' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.recordVideo(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 录音工具 ==========

  api.registerTool({
    name: 'android_recorder_status',
    description: '获取录音状态',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getRecorderStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_recorder_start',
    description: '开始录音',
    parameters: {
      type: 'object',
      properties: {
        format: { type: 'string', enum: ['m4a', '3gp', 'amr', 'aac'], description: '输出格式' },
        quality: { type: 'string', enum: ['low', 'medium', 'high'], description: '录音质量' },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.startRecording(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_recorder_stop',
    description: '停止录音',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.stopRecording();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 常用 App 快捷打开（深链接，非官方 API） ==========

  api.registerTool({
    name: 'android_app_shortcuts_list',
    description: '列出支持的常用 App 及可执行动作（微信/支付宝/淘宝/京东/美团/抖音/小红书/B站/百度地图/高德地图等）',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.listAppShortcuts();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_app_shortcuts_installed',
    description: '查询手机已安装的、支持快捷打开的常用 App',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getInstalledAppShortcuts();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_root_status',
    description: '检测设备是否已 Root 且 Bridge 是否已获得 root 权限。在已 Root 设备上首次调用会触发 Magisk 授权弹窗，用户允许后 Bridge 即拥有 root 权限。',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      try {
        const result = await bridge.getRootStatus();
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  api.registerTool({
    name: 'android_app_shortcut_open',
    description: '通过深链接打开常用 App 或指定页面。app: wechat/alipay/taobao/jd/meituan/douyin/xiaohongshu/bilibili/baidu_map/amap 等。action: launch/scan/paycode/moments/search 等，视 app 而定。query 用于淘宝等搜索。',
    parameters: {
      type: 'object',
      properties: {
        app: {
          type: 'string',
          description: 'App 标识: wechat, qq, alipay, taobao, tmall, jd, meituan, douyin, xiaohongshu, bilibili, baidu_map, amap',
        },
        action: {
          type: 'string',
          description: '动作: launch(打开), scan(扫一扫), paycode(付款码), moments(朋友圈), search(搜索), transfer(转账) 等',
        },
        query: { type: 'string', description: '搜索关键词，用于 taobao search 等' },
        url: { type: 'string', description: '自定义 URL，action=open_url 时使用' },
      },
      required: ['app'],
    },
    async execute(_id: string, params: any) {
      try {
        const result = await bridge.openAppShortcut(params);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }] };
      }
    },
  });

  // ========== 场景指南工具 ==========

  api.registerTool({
    name: 'android_scenario_list',
    description: '列出所有可用的 Android 操作场景（每日播报、快捷操作、联系人分析、自动化工作流等）',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      const scenarios = listScenarios();
      const result = scenarios.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        triggers: s.triggers,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: 'android_scenario_guide',
    description: '获取指定场景的详细操作指南和工作流。场景 ID：daily-briefing(每日播报)、quick-actions(快捷操作)、contact-intelligence(联系人分析)、automation-workflows(自动化工作流)、photo-assistant(相册助手)、location-navigator(位置导航)、security-privacy(安全隐私)。',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '场景 ID：daily-briefing, quick-actions, contact-intelligence, automation-workflows, photo-assistant, location-navigator, security-privacy',
        },
        query: {
          type: 'string',
          description: '或者提供用户请求，自动匹配合适的场景',
        },
      },
      required: [],
    },
    async execute(_id: string, params: { id?: string; query?: string }) {
      let scenario = null;
      
      if (params.id) {
        scenario = getScenario(params.id);
      } else if (params.query) {
        scenario = matchScenario(params.query);
      }
      
      if (!scenario) {
        const available = listScenarios().map(s => `${s.id}: ${s.name}`).join('\n');
        return { 
          content: [{ 
            type: 'text', 
            text: `未找到匹配的场景。可用场景：\n${available}` 
          }] 
        };
      }
      
      const result = {
        id: scenario.id,
        name: scenario.name,
        description: scenario.description,
        triggers: scenario.triggers,
        tools: scenario.tools,
        workflow: scenario.workflow,
      };
      
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  });

  api.registerTool({
    name: 'android_system_prompt',
    description: '获取 Android Bridge 的系统提示词，包含所有工具能力和使用规则。用于配置飞书/Operator 的系统提示。',
    parameters: { type: 'object', properties: {}, required: [] },
    async execute(_id: string, _params: any) {
      const prompt = generateSystemPrompt();
      return { content: [{ type: 'text', text: prompt }] };
    },
  });

  console.log('[Android Bridge] Registered Android tools');
}
