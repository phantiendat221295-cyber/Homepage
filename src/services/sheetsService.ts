import Papa from 'papaparse';
import { WebAppItem, NotificationItem, GoogleSheetsConfig, AdminAccount, SupportTicket } from '../types';
import { DEFAULT_APPS, DEFAULT_NOTIFICATIONS, DEFAULT_ADMINS } from '../data/defaultData';

const STORAGE_KEYS = {
  CONFIG: 'fpt_portal_sheet_config',
  CACHED_APPS: 'fpt_portal_cached_apps',
  CACHED_NOTIS: 'fpt_portal_cached_notis',
  CACHED_ADMINS: 'fpt_portal_cached_admins',
  CACHED_TICKETS: 'fpt_portal_cached_tickets',
  LAST_SYNC: 'fpt_portal_last_sync'
};

// Cloud Shared API endpoint (đồng bộ giữa các thiết bị và máy tính truy cập Vercel)
const CLOUD_CONFIG_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a11a16e7991d14';

// 3 đường link Google Sheets chính thức của FPT Poly School Đào Tạo
export const DEFAULT_SHEET_CONFIG: GoogleSheetsConfig = {
  appsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9wRadk5MTgUYCiN2NhZbaJiE7U_b8H07p8_8ZVBaBdbuha0QyLXaQ590-dQedY_yEBfolHA2IxW4g/pub?gid=0&single=true&output=csv',
  notificationsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBqtfVE6cJfGPnvdIK-cDjQ94h_EHCaCOQfeI0TmIGI0NZ-lviOC6Do27GuZskKEbtVKtWDnqqWKNa/pub?gid=0&single=true&output=csv',
  permissionsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRSCveJeiShAO-1DAeOusENgYe_8dAqx0P6yZvzZZoOX5ZmoSpGaLah-Y_ldUa-_jNMksVh-ig7Vyxe/pub?gid=0&single=true&output=csv',
  gasWebhookUrl: '',
  lastSynced: undefined,
  autoSync: true
};

export const normalizeGoogleSheetUrl = (rawUrl: string): string => {
  if (!rawUrl || !rawUrl.trim()) return '';
  let url = rawUrl.trim();

  // Handle normal edit link: /edit?gid=...
  const editMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/edit(?:.*[?&]gid=([0-9]+))?/);
  if (editMatch) {
    const sheetId = editMatch[1];
    const gid = editMatch[2] || '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  // Handle /pubhtml -> /pub?output=csv
  if (url.includes('/pubhtml')) {
    url = url.replace('/pubhtml', '/pub');
  }

  // Ensure output=csv
  if (url.includes('/pub') && !url.includes('output=csv')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}output=csv`;
  }

  return url;
};

// URL kèm cache busting để triệt tiêu bộ nhớ đệm 5 phút của Google CDN
export const getCacheBustedUrl = (rawUrl: string): string => {
  const norm = normalizeGoogleSheetUrl(rawUrl);
  if (!norm) return '';
  const sep = norm.includes('?') ? '&' : '?';
  return `${norm}${sep}_t=${Date.now()}`;
};

// Lấy cấu hình từ LocalStorage hoặc Default
export const getStoredConfig = (): GoogleSheetsConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.appsCsvUrl || parsed.notificationsCsvUrl)) {
        return {
          ...DEFAULT_SHEET_CONFIG,
          ...parsed
        };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SHEET_CONFIG;
};

// Đồng bộ Cloud Config và danh sách Apps sửa trên Web
export const saveCloudData = async (data: {
  config?: GoogleSheetsConfig;
  customApps?: WebAppItem[];
  deletedAppIds?: string[];
  tickets?: SupportTicket[];
}): Promise<void> => {
  try {
    let currentData: any = {};
    try {
      const r = await fetch(CLOUD_CONFIG_URL);
      if (r.ok) {
        const j = await r.json();
        currentData = j.data || {};
      }
    } catch {
      // ignore
    }

    const mergedData = {
      ...currentData,
      ...(data.config
        ? {
            appsCsvUrl: data.config.appsCsvUrl,
            notificationsCsvUrl: data.config.notificationsCsvUrl,
            permissionsCsvUrl: data.config.permissionsCsvUrl,
            gasWebhookUrl: data.config.gasWebhookUrl,
            googleClientId: data.config.googleClientId
          }
        : {}),
      ...(data.customApps ? { customApps: data.customApps } : {}),
      ...(data.deletedAppIds ? { deletedAppIds: data.deletedAppIds } : {}),
      ...(data.tickets ? { tickets: data.tickets } : {}),
      updatedAt: new Date().toISOString()
    };

    await fetch(CLOUD_CONFIG_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'fpt_portal_sheet_config',
        data: mergedData
      })
    });
  } catch (err) {
    console.warn('Lỗi khi lưu Cloud Data:', err);
  }
};

// Tải toàn bộ Cloud Data (config + customApps + deletedAppIds + tickets)
export const fetchCloudData = async (): Promise<{
  config?: GoogleSheetsConfig;
  customApps?: WebAppItem[];
  deletedAppIds?: string[];
  tickets?: SupportTicket[];
} | null> => {
  try {
    const res = await fetch(`${CLOUD_CONFIG_URL}?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !json.data) return null;

    const d = json.data;
    const config: GoogleSheetsConfig = {
      appsCsvUrl: d.appsCsvUrl || DEFAULT_SHEET_CONFIG.appsCsvUrl,
      notificationsCsvUrl: d.notificationsCsvUrl || DEFAULT_SHEET_CONFIG.notificationsCsvUrl,
      permissionsCsvUrl: d.permissionsCsvUrl || DEFAULT_SHEET_CONFIG.permissionsCsvUrl,
      gasWebhookUrl: d.gasWebhookUrl || '',
      googleClientId: d.googleClientId || '',
      autoSync: true
    };

    return {
      config,
      customApps: Array.isArray(d.customApps) ? d.customApps : undefined,
      deletedAppIds: Array.isArray(d.deletedAppIds) ? d.deletedAppIds : undefined,
      tickets: Array.isArray(d.tickets) ? d.tickets : undefined
    };
  } catch (err) {
    console.warn('Lỗi fetch Cloud Data:', err);
    return null;
  }
};

export const saveStoredConfig = (config: GoogleSheetsConfig) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save sheet config', err);
  }
  saveCloudData({ config });
};

// Helper normalize key
export const cleanKey = (key: string) => {
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
      'LINK_REQUIRES_LOGIN: Google Sheets đang yêu cầu đăng nhập. Vui lòng kiểm tra quyền chia sẻ công khai và chọn định dạng CSV!'
    );
  }
};

// 1. FETCH APPS TRỰC TIẾP TỪ GOOGLE SHEETS (Luôn cập nhật bản mới nhất)
export const fetchAppsFromCsv = async (rawUrl: string): Promise<WebAppItem[]> => {
  const targetUrl = getCacheBustedUrl(rawUrl || DEFAULT_SHEET_CONFIG.appsCsvUrl);
  if (!targetUrl) return DEFAULT_APPS;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const csvText = await res.text();
    validateCsvContent(csvText);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) return DEFAULT_APPS;

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
      throw new Error('Cột tiêu đề không hợp lệ.');
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
      if (!title || title.includes('function ') || title.includes('typeof ')) return;

      const description = findVal(['mota', 'description', 'desc', 'noidung']) || 'Không có mô tả';
      const url = findVal(['link', 'url', 'duongdan', 'href']) || '#';
      const category = findVal(['nhom', 'category', 'chuyenmuc', 'phanloai']) || 'Quản lý đào tạo';
      const icon = findVal(['icon', 'bieutuong', 'lucide']) || 'Sparkles';
      const tag = (findVal(['tag', 'the', 'loai']) || 'webapp').toLowerCase();
      const colorRaw = findVal(['color', 'mau', 'mausac', 'maucard', 'theme']).toLowerCase();

      const validColors: NonNullable<WebAppItem['colorTheme']>[] = [
        'blue', 'green', 'orange', 'purple', 'pink', 'yellow', 'mint', 'cyan', 'indigo', 'slate'
      ];
      const colorTheme = (validColors.find((c) => colorRaw.includes(c)) || 'blue') as WebAppItem['colorTheme'];

      // Tạo id ổn định theo tiêu đề để tránh nhảy render
      const slug = cleanKey(title) || `app-${index}`;
      items.push({
        id: `sheet-${slug}`,
        title,
        description,
        url,
        category,
        icon,
        tag,
        colorTheme
      });
    });

    if (items.length === 0) return DEFAULT_APPS;

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

// 2. FETCH NOTIFICATIONS (Loại bỏ triệt để cache và mã JavaScript rác)
export const fetchNotificationsFromCsv = async (rawUrl: string): Promise<NotificationItem[]> => {
  const targetUrl = getCacheBustedUrl(rawUrl || DEFAULT_SHEET_CONFIG.notificationsCsvUrl);
  if (!targetUrl) return DEFAULT_NOTIFICATIONS;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const csvText = await res.text();
    validateCsvContent(csvText);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) return DEFAULT_NOTIFICATIONS;

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
      if (!title || title.includes('function ') || title.includes('typeof ') || title.includes('Object.')) {
        return;
      }

      const date = findVal(['ngay', 'date', 'thoigian', 'time']) || new Date().toLocaleDateString('vi-VN');
      const content = findVal(['noidung', 'content', 'mota', 'chitiet']) || title;
      const url = findVal(['link', 'url', 'chitiet']) || '#';
      const colorRaw = findVal(['mau', 'color', 'loai']).toLowerCase();

      const validColors: NonNullable<NotificationItem['color']>[] = ['red', 'blue', 'purple', 'orange', 'green'];
      const color = (validColors.find((c) => colorRaw.includes(c)) ||
        ['blue', 'red', 'purple', 'orange', 'green'][index % 5]) as NotificationItem['color'];

      const slug = cleanKey(title) || `noti-${index}`;
      items.push({
        id: `noti-${slug}`,
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

// 3. FETCH PERMISSIONS (Chỉ dùng tài khoản trong Google Sheets, không dùng mật khẩu mặc định)
export const fetchPermissionsFromCsv = async (rawUrl?: string): Promise<AdminAccount[]> => {
  const targetUrl = getCacheBustedUrl(rawUrl || DEFAULT_SHEET_CONFIG.permissionsCsvUrl || '');
  if (!targetUrl) return [];

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const csvText = await res.text();
    validateCsvContent(csvText);

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });

    if (!parsed.data || parsed.data.length === 0) return [];

    const accounts: AdminAccount[] = [];
    parsed.data.forEach((row) => {
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
      const role: 'admin' | 'user' =
        roleRaw.includes('admin') || roleRaw.includes('quantri') || roleRaw === '' ? 'admin' : 'user';

      if (!email || !passwordOrPin) return;

      accounts.push({
        email,
        passwordOrPin,
        name,
        role
      });
    });

    if (accounts.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.CACHED_ADMINS, JSON.stringify(accounts));
      } catch {
        // ignore
      }
      return accounts;
    }

    return [];
  } catch (error) {
    console.warn('Lỗi khi fetch PhanQuyen CSV:', error);
    // Trả về mảng rỗng để không cho phép đăng nhập nếu thông tin sai
    return [];
  }
};

// 4. GOOGLE APPS SCRIPT WEBHOOK (Ghi dữ liệu 2 chiều trực tiếp vào Google Sheets nếu có)
export const pushToGasWebhook = async (
  webhookUrl: string,
  payload: { action: 'saveApp' | 'deleteApp'; app?: WebAppItem; appId?: string }
): Promise<boolean> => {
  if (!webhookUrl || !webhookUrl.trim()) return false;
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Lỗi gọi GAS webhook:', err);
    return false;
  }
};

// 5. SUPPORT TICKETS MANAGEMENT
export const getStoredTickets = (): SupportTicket[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_TICKETS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
};

export const saveSupportTicket = async (ticket: SupportTicket): Promise<SupportTicket[]> => {
  const current = getStoredTickets();
  const updated = [ticket, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.CACHED_TICKETS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  saveCloudData({ tickets: updated });
  return updated;
};

export const updateTicketStatus = async (ticketId: string, status: 'new' | 'resolved'): Promise<SupportTicket[]> => {
  const current = getStoredTickets();
  const updated = current.map((t) => (t.id === ticketId ? { ...t, status } : t));
  try {
    localStorage.setItem(STORAGE_KEYS.CACHED_TICKETS, JSON.stringify(updated));
  } catch {
    // ignore
  }
  saveCloudData({ tickets: updated });
  return updated;
};
