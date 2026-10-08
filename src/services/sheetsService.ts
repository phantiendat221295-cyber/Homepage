import Papa from 'papaparse';
import { WebAppItem, NotificationItem, GoogleSheetsConfig, AdminAccount } from '../types';
import { DEFAULT_APPS, DEFAULT_NOTIFICATIONS, DEFAULT_ADMINS } from '../data/defaultData';

const STORAGE_KEYS = {
  CONFIG: 'fpt_portal_sheet_config',
  CACHED_APPS: 'fpt_portal_cached_apps',
  CACHED_NOTIS: 'fpt_portal_cached_notis',
  CACHED_ADMINS: 'fpt_portal_cached_admins',
  LAST_SYNC: 'fpt_portal_last_sync'
};

export const normalizeGoogleSheetUrl = (rawUrl: string): string => {
  if (!rawUrl || !rawUrl.trim()) return '';
  let url = rawUrl.trim();

  // If user pasted normal edit URL: https://docs.google.com/spreadsheets/d/{ID}/edit?gid={GID}#gid={GID}
  const editMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit(?:.*[?&]gid=([0-9]+))?/);
  if (editMatch) {
    const sheetId = editMatch[1];
    const gid = editMatch[2] || '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  // If user pasted /pubhtml -> change to /pub?output=csv
  if (url.includes('/pubhtml')) {
    url = url.replace('/pubhtml', '/pub');
  }

  // If it's a /pub link, ensure it has output=csv
  if (url.includes('/pub') && !url.includes('output=csv')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}output=csv`;
  }

  return url;
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
    permissionsCsvUrl: '',
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
  return key
    .toLowerCase()
    .trim()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
};

// Validate that text is actual CSV and not HTML / JavaScript / Google Login
const validateCsvContent = (text: string) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Dữ liệu trả về trống.');
  }

  const lower = text.toLowerCase();
  const isHtml =
    lower.includes('<!doctype') ||
    lower.includes('<html') ||
    lower.includes('<script') ||
    lower.includes('document-root') ||
    lower.includes('sign in to your google account') ||
    lower.includes('accounts.google.com') ||
    lower.includes('cannot find global object') ||
    lower.includes('function g(') ||
    lower.includes('function n(') ||
    lower.includes('typeof globalthis');

  if (isHtml) {
    throw new Error(
      'LINK_REQUIRES_LOGIN: Google Sheets đang yêu cầu đăng nhập hoặc chưa mở quyền công khai ("Bất kỳ ai có liên kết"). Vui lòng kiểm tra quyền chia sẻ!'
    );
  }
};

export const fetchAppsFromCsv = async (rawUrl: string): Promise<WebAppItem[]> => {
  const csvUrl = normalizeGoogleSheetUrl(rawUrl);
  if (!csvUrl) return DEFAULT_APPS;

  try {
    const res = await fetch(csvUrl, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const csvText = await res.text();
    validateCsvContent(csvText);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) {
      return DEFAULT_APPS;
    }

    // Verify header sanity: at least one recognized column
    const sampleRow = parsed.data[0] || {};
    const headers = Object.keys(sampleRow).map(cleanKey);
    const hasValidCol = headers.some(
      (h) =>
        h.includes('ten') ||
        h.includes('title') ||
        h.includes('name') ||
        h.includes('link') ||
        h.includes('url') ||
        h.includes('nhom') ||
        h.includes('category')
    );

    if (!hasValidCol) {
      throw new Error('Cột tiêu đề trong Google Sheets không hợp lệ (cần có cột Tên, Link, Nhóm).');
    }

    const items: WebAppItem[] = [];
    parsed.data.forEach((row, index) => {
      const keys = Object.keys(row);
      const findVal = (expectedKeys: string[]): string => {
        for (const k of keys) {
          const norm = cleanKey(k);
          if (expectedKeys.some((ek) => norm.includes(ek))) {
            return (row[k] || '').trim();
          }
        }
        return '';
      };

      const title = findVal(['ten', 'title', 'name', 'tieude']);
      if (!title) return; // skip empty rows

      const description = findVal(['mota', 'description', 'desc', 'noidung']) || 'Không có mô tả';
      const url = findVal(['link', 'url', 'duongdan', 'href']) || '#';
      const category = findVal(['nhom', 'category', 'chuyenmuc', 'phanloai']) || 'Quản lý đào tạo';
      const icon = findVal(['icon', 'bieutuong', 'lucide']) || 'Sparkles';
      const tag = (findVal(['tag', 'the', 'loai']) || 'webapp').toLowerCase();
      const colorRaw = findVal(['color', 'mau', 'maucard', 'theme']).toLowerCase();

      const validColors: NonNullable<WebAppItem['colorTheme']>[] = [
        'blue', 'green', 'orange', 'purple', 'pink', 'yellow', 'mint', 'cyan', 'indigo', 'slate'
      ];
      const colorTheme = (validColors.find((c) => colorRaw.includes(c)) || 'blue') as WebAppItem['colorTheme'];

      items.push({
        id: `app-csv-${index}-${Date.now()}`,
        title,
        description,
        url,
        category,
        icon,
        tag,
        colorTheme
      });
    });

    if (items.length === 0) {
      return DEFAULT_APPS;
    }

    // Cache valid items
    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_APPS, JSON.stringify(items));
    } catch {
      // ignore
    }

    return items;
  } catch (error) {
    console.warn('Lỗi khi fetch Apps CSV:', error);
    throw error;
  }
};

export const fetchNotificationsFromCsv = async (rawUrl: string): Promise<NotificationItem[]> => {
  const csvUrl = normalizeGoogleSheetUrl(rawUrl);
  if (!csvUrl) return DEFAULT_NOTIFICATIONS;

  try {
    const res = await fetch(csvUrl, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const csvText = await res.text();
    validateCsvContent(csvText);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) {
      return DEFAULT_NOTIFICATIONS;
    }

    const items: NotificationItem[] = [];
    parsed.data.forEach((row, index) => {
      const keys = Object.keys(row);
      const findVal = (expectedKeys: string[]): string => {
        for (const k of keys) {
          const norm = cleanKey(k);
          if (expectedKeys.some((ek) => norm.includes(ek))) {
            return (row[k] || '').trim();
          }
        }
        return '';
      };

      const title = findVal(['tieude', 'title', 'thongbao', 'name']);
      if (!title) return;

      const date = findVal(['ngay', 'date', 'thoigian', 'time']) || new Date().toLocaleDateString('vi-VN');
      const content = findVal(['noidung', 'content', 'mota', 'chitiet']) || title;
      const url = findVal(['link', 'url', 'chitiet']) || '#';
      const colorRaw = findVal(['mau', 'color', 'loai']).toLowerCase();

      const validColors: NonNullable<NotificationItem['color']>[] = ['red', 'blue', 'purple', 'orange', 'green'];
      const color = (validColors.find((c) => colorRaw.includes(c)) ||
        ['red', 'blue', 'purple', 'orange', 'green'][index % 5]) as NotificationItem['color'];

      items.push({
        id: `noti-csv-${index}-${Date.now()}`,
        title,
        date,
        content,
        url,
        color
      });
    });

    if (items.length === 0) return DEFAULT_NOTIFICATIONS;

    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_NOTIS, JSON.stringify(items));
    } catch {
      // ignore
    }

    return items;
  } catch (error) {
    console.warn('Lỗi khi fetch Notifications CSV:', error);
    throw error;
  }
};

// Fetch tab 'PhanQuyen' from Google Sheets
export const fetchPermissionsFromCsv = async (rawUrl: string): Promise<AdminAccount[]> => {
  const csvUrl = normalizeGoogleSheetUrl(rawUrl);
  if (!csvUrl) return DEFAULT_ADMINS;

  try {
    const res = await fetch(csvUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const csvText = await res.text();
    validateCsvContent(csvText);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) return DEFAULT_ADMINS;

    const accounts: AdminAccount[] = parsed.data
      .map((row) => {
        const keys = Object.keys(row);
        const findVal = (expectedKeys: string[]): string => {
          for (const k of keys) {
            const norm = cleanKey(k);
            if (expectedKeys.some((ek) => norm.includes(ek))) {
              return (row[k] || '').trim();
            }
          }
          return '';
        };

        const email = findVal(['email', 'taikhoan', 'username', 'user', 'ma']);
        const passwordOrPin = findVal(['matkhau', 'password', 'pass', 'pin', 'mapin']);
        const name = findVal(['ten', 'hoten', 'name']) || email;
        const roleRaw = findVal(['quyen', 'role', 'vaitro']).toLowerCase();
        const role: 'admin' | 'user' = roleRaw.includes('admin') || roleRaw.includes('quantri') ? 'admin' : 'user';

        if (!email || !passwordOrPin) return null;

        return {
          email,
          passwordOrPin,
          name,
          role
        };
      })
      .filter((acc): acc is AdminAccount => acc !== null);

    if (accounts.length === 0) return DEFAULT_ADMINS;

    try {
      localStorage.setItem(STORAGE_KEYS.CACHED_ADMINS, JSON.stringify(accounts));
    } catch {
      // ignore
    }

    return accounts;
  } catch (error) {
    console.warn('Lỗi khi fetch PhanQuyen CSV:', error);
    return DEFAULT_ADMINS;
  }
};
