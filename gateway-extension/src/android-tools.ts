/**
 * Gateway 工具注册
 *
 * 将 Android Bridge 功能注册为 moltbot Gateway 工具
 */

import { AndroidBridgeClient, BridgeError } from './android-bridge-client.js';

/**
 * 注册所有 Android 工具
 */
export function registerAndroidTools(gateway: any, bridge: AndroidBridgeClient): void {
  // ========== 系统信息工具 ==========

  registerTool(gateway, {
    name: 'android_device_info',
    description: '获取 Android 设备信息，包括型号、系统版本、屏幕尺寸等',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return await bridge.getDeviceInfo();
    },
  });

  registerTool(gateway, {
    name: 'android_battery_status',
    description: '获取 Android 设备电池状态，包括电量、充电状态、温度等',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return await bridge.getBatteryStatus();
    },
  });

  registerTool(gateway, {
    name: 'android_network_status',
    description: '获取 Android 设备网络状态，包括连接类型、WiFi 信息等',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return await bridge.getNetworkStatus();
    },
  });

  // ========== 联系人工具 ==========

  registerTool(gateway, {
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
    },
    handler: async (params: { query?: string; limit?: number; offset?: number }) => {
      return await bridge.getContacts({
        q: params.query,
        limit: params.limit,
        offset: params.offset,
      });
    },
  });

  registerTool(gateway, {
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
    handler: async (params: { id: string }) => {
      return await bridge.getContact(params.id);
    },
  });

  // ========== 应用管理工具 ==========

  registerTool(gateway, {
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
    },
    handler: async (params: { type?: 'user' | 'system' | 'all'; query?: string }) => {
      return await bridge.getApps({
        type: params.type,
        q: params.query,
      });
    },
  });

  registerTool(gateway, {
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
    handler: async (params: { package: string }) => {
      return await bridge.launchApp(params.package);
    },
  });

  registerTool(gateway, {
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
    handler: async (params: { package: string }) => {
      return await bridge.getAppInfo(params.package);
    },
  });

  // ========== 媒体工具 ==========

  registerTool(gateway, {
    name: 'android_media_images',
    description: '获取 Android 设备上的图片列表',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回数量限制，默认 100',
        },
        offset: {
          type: 'number',
          description: '偏移量，用于分页',
        },
        sortBy: {
          type: 'string',
          enum: ['date', 'size', 'name'],
          description: '排序方式',
        },
        order: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: '排序顺序',
        },
      },
    },
    handler: async (params: {
      limit?: number;
      offset?: number;
      sortBy?: 'date' | 'size' | 'name';
      order?: 'asc' | 'desc';
    }) => {
      return await bridge.getImages(params);
    },
  });

  registerTool(gateway, {
    name: 'android_media_audio',
    description: '获取 Android 设备上的音频文件列表',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '返回数量限制' },
        offset: { type: 'number', description: '偏移量' },
      },
    },
    handler: async (params: { limit?: number; offset?: number }) => {
      return await bridge.getAudioFiles(params);
    },
  });

  registerTool(gateway, {
    name: 'android_media_videos',
    description: '获取 Android 设备上的视频文件列表',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '返回数量限制' },
        offset: { type: 'number', description: '偏移量' },
      },
    },
    handler: async (params: { limit?: number; offset?: number }) => {
      return await bridge.getVideos(params);
    },
  });

  // ========== 日历工具 ==========

  registerTool(gateway, {
    name: 'android_calendar_events',
    description: '获取 Android 日历事件',
    parameters: {
      type: 'object',
      properties: {
        startTime: {
          type: 'number',
          description: '开始时间戳(毫秒)，默认为昨天',
        },
        endTime: {
          type: 'number',
          description: '结束时间戳(毫秒)，默认为30天后',
        },
        limit: {
          type: 'number',
          description: '返回数量限制',
        },
      },
    },
    handler: async (params: { startTime?: number; endTime?: number; limit?: number }) => {
      return await bridge.getCalendarEvents(params);
    },
  });

  registerTool(gateway, {
    name: 'android_calendar_create',
    description: '创建 Android 日历事件',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '事件标题' },
        startTime: { type: 'number', description: '开始时间戳(毫秒)' },
        endTime: { type: 'number', description: '结束时间戳(毫秒)' },
        description: { type: 'string', description: '事件描述' },
        location: { type: 'string', description: '地点' },
        allDay: { type: 'boolean', description: '是否全天事件' },
      },
      required: ['title', 'startTime', 'endTime'],
    },
    handler: async (params: {
      title: string;
      startTime: number;
      endTime: number;
      description?: string;
      location?: string;
      allDay?: boolean;
    }) => {
      return await bridge.createCalendarEvent(params);
    },
  });

  // ========== 短信工具 ==========

  registerTool(gateway, {
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
    },
    handler: async (params: {
      type?: 'inbox' | 'sent' | 'all';
      limit?: number;
      address?: string;
    }) => {
      return await bridge.getSms(params);
    },
  });

  // ========== 剪贴板工具 ==========

  registerTool(gateway, {
    name: 'android_clipboard_get',
    description: '获取 Android 剪贴板内容',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return await bridge.getClipboard();
    },
  });

  registerTool(gateway, {
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
    handler: async (params: { text: string; label?: string }) => {
      return await bridge.setClipboard(params.text, params.label);
    },
  });

  // ========== TTS 工具 ==========

  registerTool(gateway, {
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
    handler: async (params: {
      text: string;
      language?: string;
      pitch?: number;
      rate?: number;
    }) => {
      return await bridge.speak(params.text, {
        language: params.language,
        pitch: params.pitch,
        rate: params.rate,
      });
    },
  });

  registerTool(gateway, {
    name: 'android_tts_stop',
    description: '停止 Android TTS 朗读',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      return await bridge.stopSpeaking();
    },
  });

  // ========== Intent 工具 ==========

  registerTool(gateway, {
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
    handler: async (params: { text: string; title?: string }) => {
      return await bridge.share(params.text, params.title);
    },
  });

  registerTool(gateway, {
    name: 'android_dial',
    description: '打开 Android 拨号界面',
    parameters: {
      type: 'object',
      properties: {
        number: { type: 'string', description: '电话号码' },
      },
      required: ['number'],
    },
    handler: async (params: { number: string }) => {
      return await bridge.dial(params.number);
    },
  });

  registerTool(gateway, {
    name: 'android_open_url',
    description: '在 Android 浏览器中打开 URL',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL 地址' },
      },
      required: ['url'],
    },
    handler: async (params: { url: string }) => {
      return await bridge.openUrl(params.url);
    },
  });

  console.log('[Android Bridge] Registered Android tools');
}

/**
 * 工具注册辅助函数
 */
interface ToolDefinition {
  name: string;
  description: string;
  parameters: object;
  handler: (params: any) => Promise<unknown>;
}

function registerTool(gateway: any, tool: ToolDefinition): void {
  // 包装 handler 以处理错误
  const wrappedHandler = async (params: any) => {
    try {
      return await tool.handler(params);
    } catch (error) {
      if (error instanceof BridgeError) {
        return {
          error: true,
          code: error.code,
          message: error.message,
          details: error.details,
        };
      }
      throw error;
    }
  };

  // 根据 Gateway 的 API 注册工具
  if (typeof gateway.registerTool === 'function') {
    gateway.registerTool({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      handler: wrappedHandler,
    });
  } else if (typeof gateway.tools?.register === 'function') {
    gateway.tools.register({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      handler: wrappedHandler,
    });
  } else {
    console.warn(`[Android Bridge] Unable to register tool: ${tool.name}`);
  }
}
