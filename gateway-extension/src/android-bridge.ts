/**
 * Moltbot Android Bridge Extension
 *
 * 为 moltbot Gateway 提供 Android API 访问能力
 */

import { AndroidBridgeClient, BridgeConfig } from './android-bridge-client.js';
import { registerAndroidTools } from './android-tools.js';

export { AndroidBridgeClient, BridgeConfig };

/**
 * 扩展激活函数
 * 由 clawdbot Gateway 在加载扩展时调用。
 * Bridge 地址仅通过环境变量 ANDROID_BRIDGE_HOST / ANDROID_BRIDGE_PORT 配置（clawdbot 不再支持根级 android 配置键）。
 */
export function activate(gateway: any, _config?: BridgeConfig): void {
  console.log('[Android Bridge] Activating extension...');

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
  registerAndroidTools(gateway, bridge);

  console.log('[Android Bridge] Extension activated');
}

/**
 * 扩展停用函数
 */
export function deactivate(): void {
  console.log('[Android Bridge] Extension deactivated');
}

// 导出类型
export * from './types.js';
