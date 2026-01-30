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

      if (!result.ok) {
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
