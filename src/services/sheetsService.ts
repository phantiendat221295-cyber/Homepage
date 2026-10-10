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

// Cloud Shared API endpoint (đồng bộ siêu tốc giữa các thiết bị và máy tính truy cập Vercel)
const CLOUD_CONFIG_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a11aaf889b1edf';

// Cấu hình mặc định hệ thống FPT Poly School Đào Tạo
export const DEFAULT_SHEET_CONFIG: GoogleSheetsConfig = {
  appsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9wRadk5MTgUYCiN2NhZbaJiE7U_b8H07p8_8ZVBaBdbuha0QyLXaQ590-dQedY_yEBfolHA2IxW4g/pub?gid=0&single=true&output=csv',
  notificationsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRBqtfVE6cJfGPnvdIK-cDjQ94h_EHCaCOQfeI0TmIGI0NZ-lviOC6Do27GuZskKEbtVKtWDnqqWKNa/pub?gid=0&single=true&output=csv',
  permissionsCsvUrl:
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRSCveJeiShAO-1DAeOusENgYe_8dAqx0P6yZvzZZoOX5ZmoSpGaLah-Y_ldUa-_jNMksVh-ig7Vyxe/pub?gid=0&single=true&output=csv',
  gasWebhookUrl: '',
  googleClientId: '917238298316-4lcifta46nberb44oebk8c5q4qfdigbh.apps.googleusercontent.com',
  customLogoUrl: '',
  campusName: 'ĐỒNG NAI',
  enableGoogleSheetsSync: false, // Mặc định tắt để ưu tiên 100% Cloud Firestore mượt mà, không dính lỗi CORS
  lastSynced: undefined,
  autoSync: false
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
          ...parsed,
          googleClientId: parsed.googleClientId || DEFAULT_SHEET_CONFIG.googleClientId
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
    // 1. Lưu local cache ngay lập tức để phản hồi nhanh
    if (data.customApps) {
      try {
        localStorage.setItem('fpt_portal_cloud_custom_apps', JSON.stringify(data.customApps));
      } catch {}
    }
    if (data.deletedAppIds) {
      try {
        localStorage.setItem('fpt_portal_deleted_app_ids', JSON.stringify(data.deletedAppIds));
      } catch {}
    }

    let currentData: any = {};
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const r = await fetch(CLOUD_CONFIG_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (r.ok) {
        const j = await r.json();
        currentData = j.data || {};
      }
    } catch {
      // ignore timeout
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
      customApps: data.customApps !== undefined ? data.customApps : (currentData.customApps || []),
      deletedAppIds: data.deletedAppIds !== undefined ? data.deletedAppIds : (currentData.deletedAppIds || []),
      tickets: data.tickets !== undefined ? data.tickets : (currentData.tickets || []),
      updatedAt: new Date().toISOString()
    };

    const putController = new AbortController();
    const putTimeoutId = setTimeout(() => putController.abort(), 4000);
    await fetch(CLOUD_CONFIG_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'fpt_portal_sheet_config',
        data: mergedData
      }),
      signal: putController.signal
    });
    clearTimeout(putTimeoutId);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${CLOUD_CONFIG_URL}?_t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return getLocalFallbackCloudData();
    }
    const json = await res.json();
    if (!json || !json.data) return getLocalFallbackCloudData();

    const d = json.data;
    const config: GoogleSheetsConfig = {
      appsCsvUrl: d.appsCsvUrl || DEFAULT_SHEET_CONFIG.appsCsvUrl,
      notificationsCsvUrl: d.notificationsCsvUrl || DEFAULT_SHEET_CONFIG.notificationsCsvUrl,
      permissionsCsvUrl: d.permissionsCsvUrl || DEFAULT_SHEET_CONFIG.permissionsCsvUrl,
      gasWebhookUrl: d.gasWebhookUrl || '',
      googleClientId: d.googleClientId || '',
      autoSync: true
    };

    const customApps = Array.isArray(d.customApps) ? d.customApps : undefined;
    const deletedAppIds = Array.isArray(d.deletedAppIds) ? d.deletedAppIds : undefined;

    if (customApps) {
      try {
        localStorage.setItem('fpt_portal_cloud_custom_apps', JSON.stringify(customApps));
      } catch {}
    }
    if (deletedAppIds) {
      try {
        localStorage.setItem('fpt_portal_deleted_app_ids', JSON.stringify(deletedAppIds));
      } catch {}
    }

    return {
      config,
      customApps,
      deletedAppIds,
      tickets: Array.isArray(d.tickets) ? d.tickets : undefined
    };
  } catch (err) {
    console.warn('Lỗi fetch Cloud Data, dùng fallback local:', err);
    return getLocalFallbackCloudData();
  }
};

const getLocalFallbackCloudData = () => {
  try {
    const localAppsRaw = localStorage.getItem('fpt_portal_cloud_custom_apps');
    const localDeletedRaw = localStorage.getItem('fpt_portal_deleted_app_ids');
    return {
      config: DEFAULT_SHEET_CONFIG,
      customApps: localAppsRaw ? JSON.parse(localAppsRaw) : undefined,
      deletedAppIds: localDeletedRaw ? JSON.parse(localDeletedRaw) : undefined
    };
  } catch {
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
export type GasWebhookPayload =
  | { action: 'saveApp'; app: WebAppItem }
  | { action: 'deleteApp'; appId: string }
  | { action: 'saveNotification'; notification: NotificationItem }
  | { action: 'deleteNotification'; notificationId: string }
  | { action: 'updateChecklist'; notificationId: string; checklist: any[] }
  | { action: 'updateUserChecklist'; notificationId: string; userEmail: string; completed: boolean; completedBy?: string }
  | { action: 'assignNotification'; notificationId: string; assignedTo: string[] }
  | { action: 'testConnection' };

export const pushToGasWebhook = async (
  webhookUrl: string,
  payload: GasWebhookPayload | { action: string; [key: string]: any }
): Promise<boolean> => {
  if (!webhookUrl || !webhookUrl.trim()) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return true;
  } catch (err) {
    console.warn('Lỗi gọi GAS webhook:', err);
    return false;
  }
};

/**
 * Tính toán chênh lệch (Diff Preview) giữa Google Sheets và Web/Firestore
 * Cho phép người quản trị xem trước chính xác trước khi quyết định ghi vào Firestore
 */
export const calculateSyncDiff = (
  existingApps: WebAppItem[],
  sheetApps: WebAppItem[],
  existingNotis: NotificationItem[],
  sheetNotis: NotificationItem[],
  deletedAppIds: string[] = [],
  deletedNotiIds: string[] = []
) => {
  const deletedAppsSet = new Set(deletedAppIds.map((id) => id.trim().toLowerCase()));
  const deletedNotisSet = new Set(deletedNotiIds.map((id) => id.trim().toLowerCase()));

  // 1. Phân loại Apps
  const existingAppsMap = new Map<string, WebAppItem>();
  existingApps.forEach((a) => {
    existingAppsMap.set(a.id, a);
    if (a.url && a.url !== '#') {
      existingAppsMap.set(a.url.trim().toLowerCase(), a);
    }
  });

  const newApps: WebAppItem[] = [];
  const identicalApps: WebAppItem[] = [];
  const webOnlyApps: WebAppItem[] = existingApps.filter((a) => a.isCustom);

  sheetApps.forEach((sheetApp) => {
    const isDeleted =
      deletedAppsSet.has(sheetApp.id.toLowerCase()) ||
      deletedAppsSet.has(cleanKey(sheetApp.title)) ||
      (sheetApp.url && deletedAppsSet.has(sheetApp.url.toLowerCase()));

    if (isDeleted) {
      // Đã từng bị xóa trên web -> bỏ qua, không tự tạo lại
      return;
    }

    const matchById = existingAppsMap.get(sheetApp.id);
    const matchByUrl = sheetApp.url && sheetApp.url !== '#' ? existingAppsMap.get(sheetApp.url.trim().toLowerCase()) : null;
    const matchByTitle = existingApps.find(
      (a) => a.title.trim().toLowerCase() === sheetApp.title.trim().toLowerCase()
    );

    if (matchById || matchByUrl || matchByTitle) {
      identicalApps.push(sheetApp);
    } else {
      newApps.push(sheetApp);
    }
  });

  // 2. Phân loại Notifications
  const existingNotisMap = new Map<string, NotificationItem>();
  existingNotis.forEach((n) => {
    existingNotisMap.set(n.id, n);
  });

  const newNotis: NotificationItem[] = [];
  const identicalNotis: NotificationItem[] = [];
  const webOnlyNotis: NotificationItem[] = existingNotis.filter((n) => n.isCustom);

  sheetNotis.forEach((sheetNoti) => {
    const isDeleted =
      deletedNotisSet.has(sheetNoti.id.toLowerCase()) ||
      deletedNotisSet.has(cleanKey(sheetNoti.title));

    if (isDeleted) {
      // Bỏ qua bản ghi đã bị xóa trên web
      return;
    }

    const matchById = existingNotisMap.get(sheetNoti.id);
    const matchByTitleAndDate = existingNotis.find(
      (n) =>
        n.title.trim().toLowerCase() === sheetNoti.title.trim().toLowerCase() &&
        n.date.trim() === sheetNoti.date.trim()
    );

    if (matchById || matchByTitleAndDate) {
      identicalNotis.push(sheetNoti);
    } else {
      newNotis.push(sheetNoti);
    }
  });

  return {
    newApps,
    identicalApps,
    webOnlyApps,
    newNotis,
    identicalNotis,
    webOnlyNotis,
    conflictNotis: []
  };
};

/**
 * Merge tiện ích thông minh từ Google Sheets về Web:
 * - KHÔNG ghi đè hoặc xóa các tiện ích được tạo trên web (isCustom === true)
 * - KHÔNG tái tạo tiện ích đã từng bị xóa trên web (deletedAppIds)
 * - Giữ nguyên toàn bộ tiện ích hiện có, chỉ nạp thêm tiện ích mới từ Sheet nếu chưa có
 */
export const mergeAppsSafely = (
  existingApps: WebAppItem[],
  sheetApps: WebAppItem[],
  deletedAppIds: string[] = []
): { merged: WebAppItem[]; addedCount: number; keptCount: number } => {
  const mergedMap = new Map<string, WebAppItem>();
  const deletedSet = new Set(deletedAppIds.map((id) => id.trim().toLowerCase()));

  // 1. Nạp toàn bộ tiện ích hiện tại của Web/Firestore vào Map (nguồn chính)
  existingApps.forEach((app) => {
    mergedMap.set(app.id, app);
  });

  let addedCount = 0;
  const keptCount = existingApps.length;

  // 2. Duyệt qua tiện ích từ Sheet
  sheetApps.forEach((sheetItem) => {
    // Nếu tiện ích đã bị xóa trên web, tuyệt đối không tạo lại
    if (deletedSet.has(sheetItem.id.toLowerCase()) || deletedSet.has(cleanKey(sheetItem.title))) {
      return;
    }

    const existingById = mergedMap.get(sheetItem.id);
    const existingByContent = Array.from(mergedMap.values()).find(
      (a) =>
        a.title.trim().toLowerCase() === sheetItem.title.trim().toLowerCase() ||
        (a.url.trim() === sheetItem.url.trim() && a.url !== '#' && a.url !== '')
    );

    if (existingById) {
      // Nếu item đã có trên Web và là item custom, GIỮ NGUYÊN bản Web
      if (existingById.isCustom) {
        // Giữ nguyên web
      } else {
        // Cập nhật nhẹ thông tin từ Sheet nhưng giữ nguyên thuộc tính Web
        mergedMap.set(sheetItem.id, {
          ...sheetItem,
          id: existingById.id,
          updatedAt: new Date().toISOString()
        });
      }
    } else if (existingByContent) {
      // Đã có tiện ích tương tự trên Web -> giữ nguyên tiện ích web
    } else {
      // Tiện ích mới hoàn toàn từ Sheet -> Thêm vào danh sách
      mergedMap.set(sheetItem.id, {
        ...sheetItem,
        updatedAt: new Date().toISOString()
      });
      addedCount++;
    }
  });

  return {
    merged: Array.from(mergedMap.values()),
    addedCount,
    keptCount
  };
};

/**
 * Merge thông báo thông minh từ Google Sheets về Web:
 * - TUYỆT ĐỐI KHÔNG làm mất thông báo đã tạo trên Web/Firestore
 * - TUYỆT ĐỐI KHÔNG ghi đè danh sách người được phân công (assignedTo), trạng thái checklist độc lập (userChecklists) và auditLogs đã tạo
 * - KHÔNG tái tạo các thông báo đã bị xóa trên web (deletedNotiIds)
 * - Chỉ nạp thêm thông báo mới từ Sheet
 */
export const mergeNotificationsSafely = (
  existingNotis: NotificationItem[],
  sheetNotis: NotificationItem[],
  deletedNotiIds: string[] = []
): { merged: NotificationItem[]; addedCount: number; keptCount: number } => {
  const map = new Map<string, NotificationItem>();
  const deletedSet = new Set(deletedNotiIds.map((id) => id.trim().toLowerCase()));

  // 1. Nạp toàn bộ thông báo hiện có trên Web/Firestore (Ưu tiên giữ checklist, assignedTo, userChecklists)
  existingNotis.forEach((n) => {
    map.set(n.id, n);
  });

  let addedCount = 0;
  const keptCount = existingNotis.length;

  // 2. Duyệt qua thông báo từ Sheet
  sheetNotis.forEach((sheetItem) => {
    // Nếu thông báo đã từng bị xóa trên web, tuyệt đối không tạo lại
    if (deletedSet.has(sheetItem.id.toLowerCase()) || deletedSet.has(cleanKey(sheetItem.title))) {
      return;
    }

    const existingById = map.get(sheetItem.id);
    const existingByTitleAndDate = Array.from(map.values()).find(
      (n) =>
        n.title.trim().toLowerCase() === sheetItem.title.trim().toLowerCase() &&
        n.date.trim() === sheetItem.date.trim()
    );

    if (existingById) {
      // Nếu đã có, giữ nguyên assignedTo, userChecklists, auditLogs và checklist của Web
      map.set(sheetItem.id, {
        ...sheetItem,
        assignedTo: existingById.assignedTo || sheetItem.assignedTo,
        assignedNames: existingById.assignedNames || sheetItem.assignedNames,
        assignedUsers: existingById.assignedUsers || sheetItem.assignedUsers,
        userChecklists: existingById.userChecklists || sheetItem.userChecklists,
        checklist: existingById.checklist || sheetItem.checklist,
        auditLogs: existingById.auditLogs || sheetItem.auditLogs,
        isCustom: existingById.isCustom,
        updatedAt: new Date().toISOString()
      });
    } else if (existingByTitleAndDate) {
      // Đã có thông báo trùng tiêu đề và ngày -> giữ nguyên bản web đã phân công
    } else {
      // Thông báo mới từ Sheet -> Nạp thêm
      map.set(sheetItem.id, {
        ...sheetItem,
        updatedAt: new Date().toISOString()
      });
      addedCount++;
    }
  });

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  return {
    merged,
    addedCount,
    keptCount
  };
};

/**
 * Mã nguồn Google Apps Script hoàn chỉnh, có xử lý Lock, phân chia 2 sheet 'Apps' và 'ThongBao',
 * hỗ trợ đồng bộ Tiện ích, Thông báo, Phân công và Checklist 2 chiều.
 */
export const COMPLETE_GAS_SCRIPT = `/**
 * GOOGLE APPS SCRIPT WEBHOOK CHO FPT POLY SCHOOL PORTAL
 * Triển khai: Mở file Google Sheets > Extensions > Apps Script > Dán mã này > Deploy as Web App.
 * Execute as: Me (tài khoản Google của bạn)
 * Who has access: Anyone (Bất kỳ ai)
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ status: 'error', message: 'No payload received' });
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Sheet Apps
    var appsSheet = ss.getSheetByName('Apps') || ss.getSheets()[0];

    // 2. Sheet ThongBao
    var notiSheet = ss.getSheetByName('ThongBao');
    if (!notiSheet) {
      notiSheet = ss.insertSheet('ThongBao');
      notiSheet.appendRow(['ID', 'Tiêu đề', 'Ngày', 'Nội dung', 'Link', 'Màu', 'Người phụ trách', 'Checklist']);
      notiSheet.setFrozenRows(1);
    }

    // Action 1: Lưu tiện ích (Apps)
    if (action === 'saveApp') {
      var app = data.app;
      var dataRange = appsSheet.getDataRange();
      var values = dataRange.getValues();
      var foundIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === app.id || (app.url && values[i][2] === app.url)) {
          foundIndex = i + 1;
          break;
        }
      }
      var rowData = [
        app.title || '',
        app.description || '',
        app.url || '',
        app.category || 'Quản lý đào tạo',
        app.icon || 'Sparkles',
        app.tag || 'webapp',
        app.colorTheme || 'blue'
      ];
      if (foundIndex > 0) {
        appsSheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        appsSheet.appendRow(rowData);
      }
      return createJsonResponse({ status: 'success', action: 'saveApp' });
    }

    // Action 2: Xóa tiện ích (Apps)
    if (action === 'deleteApp') {
      var appId = data.appId;
      var dataRange = appsSheet.getDataRange();
      var values = dataRange.getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === appId || values[i][2] === appId) {
          appsSheet.deleteRow(i + 1);
          break;
        }
      }
      return createJsonResponse({ status: 'success', action: 'deleteApp' });
    }

    // Action 3: Lưu thông báo (ThongBao)
    if (action === 'saveNotification') {
      var noti = data.notification;
      var dataRange = notiSheet.getDataRange();
      var values = dataRange.getValues();
      var foundIndex = -1;
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === noti.id || values[i][1] === noti.title) {
          foundIndex = i + 1;
          break;
        }
      }
      var assignedStr = Array.isArray(noti.assignedTo) ? noti.assignedTo.join(', ') : '';
      var clSummary = '';
      if (noti.userChecklists && typeof noti.userChecklists === 'object') {
        var uKeys = Object.keys(noti.userChecklists);
        var doneCount = uKeys.filter(function(k){ return noti.userChecklists[k].completed; }).length;
        clSummary = doneCount + '/' + uKeys.length + ' người hoàn thành';
      } else if (Array.isArray(noti.checklist)) {
        var doneCl = noti.checklist.filter(function(c){ return c.completed; }).length;
        clSummary = doneCl + '/' + noti.checklist.length + ' đầu việc';
      }

      var rowData = [
        noti.id || '',
        noti.title || '',
        noti.date || '',
        noti.content || '',
        noti.url || '',
        noti.color || 'blue',
        assignedStr,
        clSummary
      ];
      if (foundIndex > 0) {
        notiSheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        notiSheet.appendRow(rowData);
      }
      return createJsonResponse({ status: 'success', action: 'saveNotification' });
    }

    // Action 4: Xóa thông báo (ThongBao)
    if (action === 'deleteNotification') {
      var notiId = data.notificationId;
      var dataRange = notiSheet.getDataRange();
      var values = dataRange.getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === notiId || values[i][1] === notiId) {
          notiSheet.deleteRow(i + 1);
          break;
        }
      }
      return createJsonResponse({ status: 'success', action: 'deleteNotification' });
    }

    // Action 5: Cập nhật checklist
    if (action === 'updateChecklist' || action === 'updateUserChecklist') {
      var notiId = data.notificationId;
      var dataRange = notiSheet.getDataRange();
      var values = dataRange.getValues();
      for (var i = 1; i < values.length; i++) {
        if (values[i][0] === notiId || values[i][1] === notiId) {
          if (data.userEmail) {
            notiSheet.getRange(i + 1, 8).setValue(
              (data.completed ? '✓ ' : '⏳ ') + data.userEmail + ' (' + (new Date().toLocaleTimeString('vi-VN')) + ')'
            );
          }
          break;
        }
      }
      return createJsonResponse({ status: 'success', action: action });
    }

    // Action 6: Kiểm tra kết nối Webhook
    if (action === 'testConnection') {
      return createJsonResponse({ status: 'success', message: 'Kết nối Google Apps Script thành công!' });
    }

    return createJsonResponse({ status: 'unknown_action', action: action });
  } catch (err) {
    return createJsonResponse({ status: 'error', error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'active', message: 'Webhook GAS đang hoạt động bình thường' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}`;

// ==========================================
// NHẬT KÝ ĐỒNG BỘ (SYNC LOGS)
// ==========================================
const SYNC_LOGS_KEY = 'fpt_portal_sync_logs';

export const getStoredSyncLogs = (): any[] => {
  try {
    const raw = localStorage.getItem(SYNC_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
};

export const addSyncLog = (log: {
  action: 'auto_push_app' | 'auto_push_noti' | 'manual_pull' | 'manual_merge' | 'gas_webhook';
  status: 'success' | 'failed' | 'skipped';
  message: string;
  details?: string;
}) => {
  try {
    const current = getStoredSyncLogs();
    const newEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      ...log
    };
    const updated = [newEntry, ...current].slice(0, 50); // Giữ tối đa 50 log mới nhất
    localStorage.setItem(SYNC_LOGS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

export const clearStoredSyncLogs = () => {
  try {
    localStorage.removeItem(SYNC_LOGS_KEY);
  } catch {}
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
