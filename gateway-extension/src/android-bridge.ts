/**
 * Moltbot Android Bridge Extension
 *
 * 为 clawdbot Gateway 提供 Android API 访问能力
 */

import { AndroidBridgeClient, BridgeConfig } from './android-bridge-client.js';

export { AndroidBridgeClient, BridgeConfig };

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
  // 调试：检查 api 对象
  console.log('[Android Bridge] API object keys:', Object.keys(api || {}).join(', '));
  console.log('[Android Bridge] api.registerTool type:', typeof api?.registerTool);
  
  if (typeof api?.registerTool !== 'function') {
    console.error('[Android Bridge] ERROR: api.registerTool is not a function!');
    console.log('[Android Bridge] API object:', JSON.stringify(api, null, 2).substring(0, 500));
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
      console.log('[Android Bridge] android_device_info called');
      try {
        const result = await bridge.getDeviceInfo();
        console.log('[Android Bridge] android_device_info success');
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        console.error('[Android Bridge] android_device_info error:', error.message);
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
      console.log('[Android Bridge] android_contacts_list called with params:', JSON.stringify(params));
      try {
        const result = await bridge.getContacts({
          q: params.query,
          limit: params.limit,
          offset: params.offset,
        });
        console.log('[Android Bridge] android_contacts_list success, contacts count:', result?.contacts?.length);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error: any) {
        console.error('[Android Bridge] android_contacts_list error:', error.message);
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

  console.log('[Android Bridge] Registered Android tools');
}
