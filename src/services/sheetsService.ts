import Papa from 'papaparse';
import { WebAppItem, NotificationItem, GoogleSheetsConfig } from '../types';
import { DEFAULT_APPS, DEFAULT_NOTIFICATIONS } from '../data/defaultData';

const STORAGE_KEYS = {
  CONFIG: 'fpt_portal_sheet_config',
  CACHED_APPS: 'fpt_portal_cached_apps',
  CACHED_NOTIS: 'fpt_portal_cached_notis',
  LAST_SYNC: 'fpt_portal_last_sync'
};

export const getStoredConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {
    appsCsvUrl: '',
    notificationsCsvUrl: '',
    lastSynced: undefined,
    autoSync: true
  };
};

export const saveStoredConfig = (config: GoogleSheetsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save sheet config', err);
  }
};

// Helper to sanitize & normalize keys
const cleanKey = (key: string) => {
  return key.toLowerCase().trim()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
};

export const fetchAppsFromCsv = async (csvUrl: string): Promise<WebAppItem[]> => {
  if (!csvUrl || !csvUrl.trim()) {
    return DEFAULT_APPS;
  }

  try {
    const res = await fetch(csvUrl, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const csvText = await res.text();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) {
      return DEFAULT_APPS;
    }

    const items: WebAppItem[] = parsed.data.map((row, index) => {
      // Find matching keys dynamically
      const keys = Object.keys(row);
      const findVal = (expectedKeys: string[]): string => {
        for (const k of keys) {
          const norm = cleanKey(k);
          if (expectedKeys.some(ek => norm.includes(ek))) {
            return (row[k] || '').trim();
          }
        }
        return '';
      };

      const title = findVal(['ten', 'title', 'name', 'tieude']) || `Ứng dụng ${index + 1}`;
      const description = findVal(['mota', 'description', 'desc', 'noidung']) || 'Không có mô tả';
      const url = findVal(['link', 'url', 'duongdan', 'href']) || '#';
      const category = findVal(['nhom', 'category', 'chuyenmuc', 'phanloai']) || 'Quản lý đào tạo';
      const icon = findVal(['icon', 'bieutuong', 'lucide']) || 'Sparkles';
      const tag = (findVal(['tag', 'the', 'loai']) || 'webapp').toLowerCase();
      const colorRaw = findVal(['color', 'mau', 'maucard', 'theme']).toLowerCase();

      // Normalize color theme
      const validColors: NonNullable<WebAppItem['colorTheme']>[] = [
        'blue', 'green', 'orange', 'purple', 'pink', 'yellow', 'mint', 'cyan', 'indigo', 'slate'
      ];
      const colorTheme = (validColors.find(c => colorRaw.includes(c)) || 'blue') as WebAppItem['colorTheme'];

      return {
        id: `app-csv-${index}-${Date.now()}`,
        title,
        description,
        url,
        category,
        icon,
        tag,
        colorTheme
      };
    });

    // Cache to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_APPS, JSON.stringify(items));
    } catch {
      // storage full or disabled
    }

    return items;
  } catch (error) {
    console.warn('Could not fetch from CSV, attempting cached fallback:', error);
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_APPS);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return DEFAULT_APPS;
  }
};

export const fetchNotificationsFromCsv = async (csvUrl: string): Promise<NotificationItem[]> => {
  if (!csvUrl || !csvUrl.trim()) {
    return DEFAULT_NOTIFICATIONS;
  }

  try {
    const res = await fetch(csvUrl, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const csvText = await res.text();

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) {
      return DEFAULT_NOTIFICATIONS;
    }

    const items: NotificationItem[] = parsed.data.map((row, index) => {
      const keys = Object.keys(row);
      const findVal = (expectedKeys: string[]): string => {
        for (const k of keys) {
          const norm = cleanKey(k);
          if (expectedKeys.some(ek => norm.includes(ek))) {
            return (row[k] || '').trim();
          }
        }
        return '';
      };

      const title = findVal(['tieude', 'title', 'thongbao', 'name']) || `Thông báo số ${index + 1}`;
      const date = findVal(['ngay', 'date', 'thoigian', 'time']) || new Date().toLocaleDateString('vi-VN');
      const content = findVal(['noidung', 'content', 'mota', 'chitiet']) || title;
      const url = findVal(['link', 'url', 'chitiet']) || '#';
      const colorRaw = findVal(['mau', 'color', 'loai']).toLowerCase();

      const validColors: NonNullable<NotificationItem['color']>[] = ['red', 'blue', 'purple', 'orange', 'green'];
      const color = (validColors.find(c => colorRaw.includes(c)) ||
        (['red', 'blue', 'purple', 'orange', 'green'][index % 5])) as NotificationItem['color'];

      return {
        id: `noti-csv-${index}-${Date.now()}`,
        title,
        date,
        content,
        url,
        color
      };
    });

    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_NOTIS, JSON.stringify(items));
    } catch {
      // ignore
    }

    return items;
  } catch (error) {
    console.warn('Could not fetch notifications from CSV, attempting cached fallback:', error);
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CACHED_NOTIS);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return DEFAULT_NOTIFICATIONS;
  }
};
