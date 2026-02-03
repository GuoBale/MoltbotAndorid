/**
 * Android Bridge HTTP 客户端
 */

import {
  ApiResponse,
  AppInfo,
  AppListResult,
  BatteryStatus,
  Calendar,
  CalendarEvent,
  Contact,
  ContactListResult,
  DeviceInfo,
  HealthStatus,
  MediaAudio,
  MediaImage,
  MediaVideo,
  NetworkStatus,
  SmsListResult,
} from './types.js';

export interface BridgeConfig {
  host?: string;
  port?: number;
  timeout?: number;
}

export class AndroidBridgeClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: BridgeConfig = {}) {
    const host = config.host ?? '127.0.0.1';
    const port = config.port ?? 18800;
    this.baseUrl = `http://${host}:${port}/api/v1`;
    this.timeout = config.timeout ?? 30000;
  }

  /**
   * 发送 HTTP 请求到 Bridge Service
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const result = (await response.json()) as ApiResponse<T>;

      // Bridge API 使用 kotlinx.serialization 的 sealed class
      // 成功响应: { type: "Success", ok: true, data: {...}, meta: {...} }
      // 失败响应: { type: "Error", ok: false, error: {...}, meta: {...} }
      // 
      // 判断成功: 优先检查 ok 字段，其次检查 type 字段
      const isSuccess = result.ok === true || 
                        result.type === 'Success' || 
                        result.type?.includes('Success') === true;
      
      if (!isSuccess) {
        const error = result.error;
        throw new BridgeError(
          error?.code ?? 'UNKNOWN_ERROR',
          error?.message ?? 'Unknown error',
          error?.details
        );
      }

      return result.data as T;
    } catch (error) {
      if (error instanceof BridgeError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new BridgeError('TIMEOUT', 'Request timed out');
        }
        throw new BridgeError('NETWORK_ERROR', error.message);
      }
      throw new BridgeError('UNKNOWN_ERROR', 'Unknown error occurred');
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ========== Health API ==========

  async health(): Promise<HealthStatus> {
    return this.request('GET', '/health');
  }

  // ========== System API ==========

  async getDeviceInfo(): Promise<DeviceInfo> {
    return this.request('GET', '/system/info');
  }

  async getBatteryStatus(): Promise<BatteryStatus> {
    return this.request('GET', '/system/battery');
  }

  async getNetworkStatus(): Promise<NetworkStatus> {
    return this.request('GET', '/system/network');
  }

  // ========== Contacts API ==========

  async getContacts(params?: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<ContactListResult> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.request('GET', `/contacts${queryString ? `?${queryString}` : ''}`);
  }

  async getContact(id: string): Promise<Contact> {
    return this.request('GET', `/contacts/${id}`);
  }

  // ========== Apps API ==========

  async getApps(params?: { type?: 'user' | 'system' | 'all'; q?: string }): Promise<AppListResult> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.q) query.set('q', params.q);

    const queryString = query.toString();
    return this.request('GET', `/apps${queryString ? `?${queryString}` : ''}`);
  }

  async getAppInfo(packageName: string): Promise<AppInfo> {
    return this.request('GET', `/apps/${packageName}`);
  }

  async launchApp(packageName: string): Promise<{ launched: boolean; package: string }> {
    return this.request('POST', '/apps/launch', { package: packageName });
  }

  // ========== Media API ==========

  async getImages(params?: {
    limit?: number;
    offset?: number;
    sortBy?: 'date' | 'size' | 'name';
    order?: 'asc' | 'desc';
  }): Promise<{ images: MediaImage[]; total: number; hasMore: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.order) query.set('order', params.order);

    const queryString = query.toString();
    return this.request('GET', `/media/images${queryString ? `?${queryString}` : ''}`);
  }

  async getAudioFiles(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ audio: MediaAudio[]; total: number; hasMore: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.request('GET', `/media/audio${queryString ? `?${queryString}` : ''}`);
  }

  async getVideos(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ videos: MediaVideo[]; total: number; hasMore: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));

    const queryString = query.toString();
    return this.request('GET', `/media/video${queryString ? `?${queryString}` : ''}`);
  }

  // ========== Calendar API ==========

  async getCalendars(): Promise<{ calendars: Calendar[] }> {
    return this.request('GET', '/calendar/calendars');
  }

  async getCalendarEvents(params?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<{ events: CalendarEvent[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.startTime) query.set('startTime', String(params.startTime));
    if (params?.endTime) query.set('endTime', String(params.endTime));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.request('GET', `/calendar/events${queryString ? `?${queryString}` : ''}`);
  }

  async createCalendarEvent(event: {
    title: string;
    startTime: number;
    endTime: number;
    description?: string;
    location?: string;
    calendarId?: string;
    allDay?: boolean;
  }): Promise<{ id: string; title: string; created: boolean }> {
    return this.request('POST', '/calendar/events', event);
  }

  async deleteCalendarEvent(eventId: string): Promise<{ deleted: boolean; id: string; rowsAffected?: number }> {
    return this.request('DELETE', `/calendar/events/${encodeURIComponent(eventId)}`);
  }

  // ========== SMS API ==========

  async getSms(params?: {
    type?: 'inbox' | 'sent' | 'all';
    limit?: number;
    address?: string;
  }): Promise<SmsListResult> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.address) query.set('address', params.address);

    const queryString = query.toString();
    return this.request('GET', `/sms${queryString ? `?${queryString}` : ''}`);
  }

  async sendSms(params: { to: string; text: string }): Promise<{ sent: boolean; to: string; parts: number }> {
    return this.request('POST', '/sms/send', params);
  }

  // ========== Email API ==========

  async getEmailAccounts(): Promise<{
    accounts: Array<{ name: string; type: string; typeLabel: string }>;
    total: number;
    note?: string;
  }> {
    return this.request('GET', '/email/accounts');
  }

  async composeEmail(params: {
    to?: string;
    subject?: string;
    body?: string;
    text?: string;
    cc?: string;
  }): Promise<{ opened: boolean; to?: string; subject?: string }> {
    return this.request('POST', '/email/compose', params);
  }

  async openEmailInbox(): Promise<{ opened: boolean; note?: string }> {
    return this.request('POST', '/email/open_inbox', {});
  }

  // ========== Clipboard API ==========

  async getClipboard(): Promise<{
    hasContent: boolean;
    text?: string;
    htmlText?: string;
    uri?: string;
  }> {
    return this.request('GET', '/clipboard');
  }

  async setClipboard(text: string, label?: string): Promise<{ copied: boolean }> {
    return this.request('POST', '/clipboard', { text, label });
  }

  // ========== TTS API ==========

  async speak(
    text: string,
    options?: {
      language?: string;
      pitch?: number;
      rate?: number;
      queueMode?: 'flush' | 'add';
    }
  ): Promise<{ started: boolean; utteranceId: string }> {
    return this.request('POST', '/tts/speak', { text, ...options });
  }

  async stopSpeaking(): Promise<{ stopped: boolean }> {
    return this.request('POST', '/tts/stop', {});
  }

  // ========== Intent API ==========

  async sendIntent(intent: {
    action?: string;
    data?: string;
    type?: string;
    package?: string;
    extras?: Record<string, unknown>;
  }): Promise<{ sent: boolean }> {
    return this.request('POST', '/intent/send', intent);
  }

  async share(text: string, title?: string): Promise<{ shared: boolean }> {
    return this.request('POST', '/intent/share', { text, title });
  }

  async dial(number: string): Promise<{ dialed: boolean; number: string }> {
    return this.request('POST', '/intent/dial', { number });
  }

  async openUrl(url: string): Promise<{ opened: boolean; url: string }> {
    return this.request('POST', '/intent/open', { url });
  }

  // ========== Browser API ==========

  async getBrowsers(): Promise<{
    browsers: Array<{ packageName: string; name: string; isChrome: boolean }>;
    total: number;
  }> {
    return this.request('GET', '/browser/apps');
  }

  async browserOpen(params: { url: string; package?: string }): Promise<{ opened: boolean; url: string; package?: string }> {
    return this.request('POST', '/browser/open', params);
  }

  async browserLaunch(): Promise<{ opened: boolean; package?: string; note?: string }> {
    return this.request('POST', '/browser/launch', {});
  }

  async browserIncognito(params?: { url?: string }): Promise<{ opened: boolean; url: string; incognito: boolean }> {
    return this.request('POST', '/browser/incognito', params ?? {});
  }

  // ========== Call Log API ==========

  async getCallLogs(params?: {
    type?: 'incoming' | 'outgoing' | 'missed' | 'rejected';
    limit?: number;
    offset?: number;
    number?: string;
    startDate?: number;
    endDate?: number;
  }): Promise<CallLogListResult> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.number) query.set('number', params.number);
    if (params?.startDate) query.set('startDate', String(params.startDate));
    if (params?.endDate) query.set('endDate', String(params.endDate));

    const queryString = query.toString();
    return this.request('GET', `/calllog${queryString ? `?${queryString}` : ''}`);
  }

  async getCallLogStats(params?: {
    startDate?: number;
    endDate?: number;
  }): Promise<CallLogStats> {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', String(params.startDate));
    if (params?.endDate) query.set('endDate', String(params.endDate));

    const queryString = query.toString();
    return this.request('GET', `/calllog/stats${queryString ? `?${queryString}` : ''}`);
  }

  // ========== Location API ==========

  async getCurrentLocation(params?: {
    provider?: string;
    timeout?: number;
  }): Promise<LocationResult> {
    const query = new URLSearchParams();
    if (params?.provider) query.set('provider', params.provider);
    if (params?.timeout) query.set('timeout', String(params.timeout));

    const queryString = query.toString();
    return this.request('GET', `/location/current${queryString ? `?${queryString}` : ''}`);
  }

  async getLastKnownLocation(params?: {
    provider?: string;
  }): Promise<LocationResult> {
    const query = new URLSearchParams();
    if (params?.provider) query.set('provider', params.provider);

    const queryString = query.toString();
    return this.request('GET', `/location/last${queryString ? `?${queryString}` : ''}`);
  }

  async getLocationProviders(): Promise<LocationProvidersResult> {
    return this.request('GET', '/location/providers');
  }

  async geocode(address: string, maxResults?: number): Promise<GeocodeResult> {
    const query = new URLSearchParams();
    query.set('address', address);
    if (maxResults) query.set('maxResults', String(maxResults));

    return this.request('GET', `/location/geocode?${query.toString()}`);
  }

  async reverseGeocode(latitude: number, longitude: number, maxResults?: number): Promise<GeocodeResult> {
    const query = new URLSearchParams();
    query.set('latitude', String(latitude));
    query.set('longitude', String(longitude));
    if (maxResults) query.set('maxResults', String(maxResults));

    return this.request('GET', `/location/reverse?${query.toString()}`);
  }

  // ========== Volume API ==========

  async getVolumes(): Promise<VolumeResult> {
    return this.request('GET', '/volume');
  }

  async getVolume(stream: string): Promise<VolumeStreamResult> {
    return this.request('GET', `/volume/${stream}`);
  }

  async setVolume(stream: string, value?: number, percentage?: number, showUI?: boolean): Promise<VolumeStreamResult> {
    return this.request('POST', '/volume/set', { stream, value, percentage, showUI });
  }

  async adjustVolume(stream: string, direction: 'up' | 'down', showUI?: boolean): Promise<VolumeStreamResult> {
    return this.request('POST', '/volume/adjust', { stream, direction, showUI });
  }

  async setMute(stream: string, mute: boolean): Promise<{ stream: string; muted: boolean }> {
    return this.request('POST', '/volume/mute', { stream, mute });
  }

  async getRingerMode(): Promise<{ mode: string; modeValue: number }> {
    return this.request('GET', '/volume/ringer');
  }

  async setRingerMode(mode: 'normal' | 'silent' | 'vibrate'): Promise<{ mode: string }> {
    return this.request('POST', '/volume/ringer', { mode });
  }

  // ========== Alarm API ==========

  async setAlarm(params: {
    hour: number;
    minute: number;
    message?: string;
    days?: number[];
    skipUI?: boolean;
    vibrate?: boolean;
  }): Promise<AlarmResult> {
    return this.request('POST', '/alarm/alarm', params);
  }

  async setTimer(params: {
    duration?: number;
    seconds?: number;
    minutes?: number;
    hours?: number;
    message?: string;
    skipUI?: boolean;
  }): Promise<TimerResult> {
    return this.request('POST', '/alarm/timer', params);
  }

  async dismissAlarm(): Promise<{ dismissed: boolean }> {
    return this.request('POST', '/alarm/dismiss', {});
  }

  async snoozeAlarm(): Promise<{ snoozed: boolean }> {
    return this.request('POST', '/alarm/snooze', {});
  }

  async showAlarms(): Promise<{ opened: boolean }> {
    return this.request('POST', '/alarm/show', {});
  }

  async showTimers(): Promise<{ opened: boolean }> {
    return this.request('POST', '/alarm/show_timers', {});
  }

  // ========== Notification API ==========

  async getNotifications(params?: {
    package?: string;
    limit?: number;
  }): Promise<NotificationListResult> {
    const query = new URLSearchParams();
    if (params?.package) query.set('package', params.package);
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return this.request('GET', `/notification${queryString ? `?${queryString}` : ''}`);
  }

  async getActiveNotifications(): Promise<NotificationListResult> {
    return this.request('GET', '/notification/active');
  }

  async getNotificationChannels(): Promise<NotificationChannelsResult> {
    return this.request('GET', '/notification/channels');
  }

  async checkNotificationAccess(): Promise<{
    enabled: boolean;
    serviceName: string;
    appName?: string;
    reason?: string;
    solution?: string;
  }> {
    return this.request('GET', '/notification/access');
  }

  async sendNotification(params: {
    title: string;
    content: string;
    id?: number;
    channelId?: string;
    priority?: number;
    ongoing?: boolean;
    autoCancel?: boolean;
    silent?: boolean;
    bigText?: string;
    subText?: string;
  }): Promise<{ sent: boolean; id: number; title: string }> {
    return this.request('POST', '/notification/send', params);
  }

  async cancelNotification(id: number, tag?: string): Promise<{ cancelled: boolean; id: number }> {
    return this.request('POST', '/notification/cancel', { id, tag });
  }

  async cancelAllNotifications(): Promise<{ cancelled: boolean }> {
    return this.request('POST', '/notification/cancel_all', {});
  }

  async openNotificationSettings(): Promise<{ opened: boolean }> {
    return this.request('POST', '/notification/open_settings', {});
  }

  // ========== Screen API ==========

  async getScreenInfo(): Promise<any> {
    return this.request('GET', '/screen');
  }

  async getBrightness(): Promise<any> {
    return this.request('GET', '/screen/brightness');
  }

  async setBrightness(params: { value?: number; percentage?: number; auto?: boolean }): Promise<any> {
    return this.request('POST', '/screen/brightness', params);
  }

  async getScreenTimeout(): Promise<any> {
    return this.request('GET', '/screen/timeout');
  }

  async setScreenTimeout(params: { milliseconds?: number; seconds?: number; minutes?: number }): Promise<any> {
    return this.request('POST', '/screen/timeout', params);
  }

  // ========== WiFi API ==========

  async getWifiStatus(): Promise<any> {
    return this.request('GET', '/wifi');
  }

  async scanWifi(): Promise<any> {
    return this.request('GET', '/wifi/scan');
  }

  async getSavedWifiNetworks(): Promise<any> {
    return this.request('GET', '/wifi/networks');
  }

  async openWifiSettings(): Promise<any> {
    return this.request('POST', '/wifi/settings', {});
  }

  // ========== Bluetooth API ==========

  async getBluetoothStatus(): Promise<any> {
    return this.request('GET', '/bluetooth');
  }

  async getPairedDevices(): Promise<any> {
    return this.request('GET', '/bluetooth/devices');
  }

  async openBluetoothSettings(): Promise<any> {
    return this.request('POST', '/bluetooth/settings', {});
  }

  // ========== Flashlight API ==========

  async getFlashlightStatus(): Promise<any> {
    return this.request('GET', '/flashlight');
  }

  async setFlashlight(enabled: boolean): Promise<any> {
    return this.request('POST', enabled ? '/flashlight/on' : '/flashlight/off', {});
  }

  async toggleFlashlight(): Promise<any> {
    return this.request('POST', '/flashlight/toggle', {});
  }

  // ========== Vibration API ==========

  async getVibrationStatus(): Promise<any> {
    return this.request('GET', '/vibration');
  }

  async vibrate(params: { duration?: number; amplitude?: number }): Promise<any> {
    return this.request('POST', '/vibration/vibrate', params);
  }

  async vibratePattern(params: { pattern: number[]; repeat?: number }): Promise<any> {
    return this.request('POST', '/vibration/pattern', params);
  }

  async cancelVibration(): Promise<any> {
    return this.request('POST', '/vibration/cancel', {});
  }

  async vibrateClick(): Promise<any> {
    return this.request('POST', '/vibration/click', {});
  }

  // ========== DND API ==========

  async getDndStatus(): Promise<any> {
    return this.request('GET', '/dnd');
  }

  async setDnd(enabled: boolean, filter?: string): Promise<any> {
    return this.request('POST', enabled ? '/dnd/enable' : '/dnd/disable', { filter });
  }

  async toggleDnd(): Promise<any> {
    return this.request('POST', '/dnd/toggle', {});
  }

  async openDndSettings(): Promise<any> {
    return this.request('POST', '/dnd/settings', {});
  }

  // ========== Storage API ==========

  async getStorageInfo(): Promise<any> {
    return this.request('GET', '/storage');
  }

  async getInternalStorage(): Promise<any> {
    return this.request('GET', '/storage/internal');
  }

  async getExternalStorage(): Promise<any> {
    return this.request('GET', '/storage/external');
  }

  async getAppStorageUsage(): Promise<any> {
    return this.request('GET', '/storage/app');
  }

  // ========== Sensor API ==========

  async listSensors(): Promise<any> {
    return this.request('GET', '/sensor');
  }

  async readSensor(sensorType: string): Promise<any> {
    return this.request('GET', `/sensor/${sensorType}`);
  }

  // ========== File API ==========

  async listFiles(params: { path: string; recursive?: boolean; showHidden?: boolean; limit?: number }): Promise<any> {
    const query = new URLSearchParams();
    query.set('path', params.path);
    if (params.recursive) query.set('recursive', 'true');
    if (params.showHidden) query.set('showHidden', 'true');
    if (params.limit) query.set('limit', String(params.limit));
    return this.request('GET', `/file/list?${query.toString()}`);
  }

  async readFile(params: { path: string; maxSize?: number }): Promise<any> {
    const query = new URLSearchParams();
    query.set('path', params.path);
    if (params.maxSize) query.set('maxSize', String(params.maxSize));
    return this.request('GET', `/file/read?${query.toString()}`);
  }

  async getFileInfo(path: string): Promise<any> {
    return this.request('GET', `/file/info?path=${encodeURIComponent(path)}`);
  }

  async fileExists(path: string): Promise<any> {
    return this.request('GET', `/file/exists?path=${encodeURIComponent(path)}`);
  }

  async getCommonDirectories(): Promise<any> {
    return this.request('GET', '/file/directories');
  }

  async writeFile(params: { path: string; content: string; append?: boolean }): Promise<any> {
    return this.request('POST', '/file/write', params);
  }

  async createDirectory(path: string): Promise<any> {
    return this.request('POST', '/file/mkdir', { path });
  }

  async deleteFile(params: { path: string; recursive?: boolean }): Promise<any> {
    return this.request('POST', '/file/delete', params);
  }

  async copyFile(params: { source: string; destination: string; overwrite?: boolean }): Promise<any> {
    return this.request('POST', '/file/copy', params);
  }

  async moveFile(params: { source: string; destination: string; overwrite?: boolean }): Promise<any> {
    return this.request('POST', '/file/move', params);
  }

  // ========== Download API ==========

  async listDownloads(params?: { status?: string; limit?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    const queryString = query.toString();
    return this.request('GET', `/download${queryString ? `?${queryString}` : ''}`);
  }

  async getDownloadStatus(downloadId: number): Promise<any> {
    return this.request('GET', `/download/${downloadId}`);
  }

  async startDownload(params: {
    url: string;
    title?: string;
    description?: string;
    fileName?: string;
    directory?: string;
    showNotification?: boolean;
  }): Promise<any> {
    return this.request('POST', '/download/start', params);
  }

  async cancelDownload(downloadId: number): Promise<any> {
    return this.request('POST', '/download/cancel', { downloadId });
  }

  async openDownloadedFile(downloadId: number): Promise<any> {
    return this.request('POST', '/download/open', { downloadId });
  }

  // ========== Camera API ==========

  async getCameraInfo(): Promise<any> {
    return this.request('GET', '/camera');
  }

  async listCameras(): Promise<any> {
    return this.request('GET', '/camera/list');
  }

  async takePhoto(params?: { facing?: string; quality?: number }): Promise<any> {
    return this.request('POST', '/camera/photo', params || {});
  }

  async recordVideo(params?: { facing?: string; quality?: string; maxDuration?: number }): Promise<any> {
    return this.request('POST', '/camera/video', params || {});
  }

  async openCamera(mode?: string): Promise<any> {
    return this.request('POST', '/camera/open', { mode: mode || 'photo' });
  }

  // ========== Recorder API ==========

  async getRecorderStatus(): Promise<any> {
    return this.request('GET', '/recorder');
  }

  async startRecording(params?: { format?: string; quality?: string; source?: string }): Promise<any> {
    return this.request('POST', '/recorder/start', params || {});
  }

  async stopRecording(): Promise<any> {
    return this.request('POST', '/recorder/stop', {});
  }

  async pauseRecording(): Promise<any> {
    return this.request('POST', '/recorder/pause', {});
  }

  async resumeRecording(): Promise<any> {
    return this.request('POST', '/recorder/resume', {});
  }

  // ========== 常用 App 快捷打开 (AppShortcuts API) ==========

  async listAppShortcuts(): Promise<any> {
    return this.request('GET', '/appshortcuts');
  }

  async getInstalledAppShortcuts(): Promise<any> {
    return this.request('GET', '/appshortcuts/installed');
  }

  async openAppShortcut(params: {
    app: string;
    action?: string;
    url?: string;
    query?: string;
  }): Promise<any> {
    return this.request('POST', '/appshortcuts/open', params);
  }

  // ========== Root API ==========

  async getRootStatus(): Promise<{ available: boolean; exitCode: number; idOutput?: string; error?: string; note?: string }> {
    return this.request('GET', '/root/status');
  }
}

// ========== 新增类型定义 ==========

export interface CallLogEntry {
  id: number;
  number: string;
  name?: string;
  type: string;
  date: number;
  dateFormatted: string;
  duration: number;
  durationFormatted: string;
  isNew: boolean;
  photoUri?: string;
}

export interface CallLogListResult {
  calls: CallLogEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CallLogStats {
  totalCalls: number;
  incoming: number;
  outgoing: number;
  missed: number;
  rejected: number;
  totalDuration: number;
  totalDurationFormatted: string;
  averageDuration: number;
  startDate: number;
  endDate: number;
}

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  bearing: number;
  time: number;
  provider: string;
  isLastKnown: boolean;
}

export interface LocationProvider {
  name: string;
  enabled: boolean;
  accuracy?: number;
  powerRequirement?: number;
}

export interface LocationProvidersResult {
  providers: LocationProvider[];
  gpsEnabled: boolean;
  networkEnabled: boolean;
}

export interface GeocodedAddress {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  featureName?: string;
  locality?: string;
  adminArea?: string;
  countryName?: string;
  countryCode?: string;
  postalCode?: string;
}

export interface GeocodeResult {
  results: GeocodedAddress[];
  query?: string;
  latitude?: number;
  longitude?: number;
}

export interface VolumeStream {
  current: number;
  max: number;
  min: number;
  percentage: number;
}

export interface VolumeResult {
  volumes: Record<string, VolumeStream>;
  ringerMode: string;
  isMusicActive: boolean;
  isSpeakerphoneOn: boolean;
  isBluetoothA2dpOn: boolean;
  isWiredHeadsetOn: boolean;
}

export interface VolumeStreamResult {
  stream: string;
  volume?: number;
  current?: number;
  max: number;
  percentage: number;
}

export interface AlarmResult {
  created: boolean;
  hour: number;
  minute: number;
  time: string;
  message?: string;
  days?: number[];
}

export interface TimerResult {
  created: boolean;
  seconds: number;
  formatted: string;
  message?: string;
}

export interface NotificationEntry {
  id: number;
  key: string;
  packageName: string;
  postTime: number;
  postTimeFormatted: string;
  isClearable: boolean;
  isOngoing: boolean;
  title?: string;
  text?: string;
  bigText?: string;
  channelId?: string;
  category?: string;
}

export interface NotificationListResult {
  notifications: NotificationEntry[];
  total: number;
}

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: number;
  importanceName: string;
  sound?: string;
  vibration: boolean;
  lights: boolean;
}

export interface NotificationChannelsResult {
  channels: NotificationChannel[];
}

/**
 * Bridge 错误类
 */
export class BridgeError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
    this.details = details;
  }
}
