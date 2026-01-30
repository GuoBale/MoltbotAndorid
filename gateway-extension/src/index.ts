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
 * 由 moltbot Gateway 在加载扩展时调用
 */
export function activate(gateway: any, config?: BridgeConfig): void {
  console.log('[Android Bridge] Activating extension...');

  const bridgeConfig: BridgeConfig = {
    host: config?.host ?? process.env.ANDROID_BRIDGE_HOST ?? '127.0.0.1',
    port: config?.port ?? parseInt(process.env.ANDROID_BRIDGE_PORT ?? '18800', 10),
    timeout: config?.timeout ?? 30000,
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
