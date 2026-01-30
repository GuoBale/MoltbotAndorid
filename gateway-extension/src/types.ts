/**
 * Android Bridge 类型定义
 */

// API 响应类型
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: number;
    durationMs: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// 联系人类型
export interface Contact {
  id: string;
  displayName: string;
  phoneNumbers: PhoneNumber[];
  emails: Email[];
  addresses?: Address[];
  organization?: Organization;
  birthday?: string;
  note?: string;
  photoUri?: string;
}

export interface PhoneNumber {
  number: string;
  type: 'mobile' | 'home' | 'work' | 'other';
}

export interface Email {
  address: string;
  type: 'home' | 'work' | 'other';
}

export interface Address {
  formatted: string;
  type: 'home' | 'work' | 'other';
}

export interface Organization {
  company: string;
  title: string;
}

export interface ContactListResult {
  contacts: Contact[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// 应用类型
export interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  isSystemApp: boolean;
  targetSdkVersion?: number;
  minSdkVersion?: number;
  permissions?: string[];
  installedAt: number;
  updatedAt: number;
  dataDir?: string;
  apkPath?: string;
}

export interface AppListResult {
  apps: AppInfo[];
  total: number;
}

// 系统信息类型
export interface DeviceInfo {
  manufacturer: string;
  model: string;
  device: string;
  brand: string;
  androidVersion: string;
  sdkVersion: number;
  buildId: string;
  fingerprint: string;
  hardware: string;
  displayMetrics: {
    widthPixels: number;
    heightPixels: number;
    density: number;
    densityDpi: number;
  };
}

export interface BatteryStatus {
  level: number;
  status: 'charging' | 'discharging' | 'full' | 'not_charging' | 'unknown';
  plugged: 'ac' | 'usb' | 'wireless' | 'none';
  health: 'good' | 'overheat' | 'dead' | 'over_voltage' | 'cold' | 'unknown';
  temperature: number;
  voltage: number;
}

export interface NetworkStatus {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'ethernet' | 'none';
  wifiInfo?: {
    ssid: string;
    bssid: string;
    rssi: number;
    linkSpeed: number;
    frequency: number;
    ipAddress: string;
  };
}

// 媒体类型
export interface MediaImage {
  id: string;
  uri: string;
  displayName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  dateTaken: number;
  relativePath: string;
}

export interface MediaAudio {
  id: string;
  uri: string;
  displayName: string;
  mimeType: string;
  size: number;
  duration: number;
  artist: string;
  album: string;
  title: string;
}

export interface MediaVideo {
  id: string;
  uri: string;
  displayName: string;
  mimeType: string;
  size: number;
  duration: number;
  width: number;
  height: number;
}

// 日历类型
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  timezone: string;
  calendarId: string;
  calendarName: string;
}

export interface Calendar {
  id: string;
  displayName: string;
  accountName: string;
  accountType: string;
  color: number;
  visible: boolean;
}

// 健康检查
export interface HealthStatus {
  status: 'running' | 'stopped';
  uptime: number;
  version: string;
}
