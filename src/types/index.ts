export interface WebAppItem {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  tag?: string; // 'webapp' | 'tailieu' | 'huongdan'
  colorTheme?: 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'yellow' | 'mint' | 'cyan' | 'indigo' | 'slate';
  badge?: string;
  isExternal?: boolean;
  isCustom?: boolean; // Được tạo hoặc chỉnh sửa trên Web
  updatedAt?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  date: string;
  url?: string;
  color?: 'red' | 'blue' | 'purple' | 'orange' | 'green';
  content?: string;
  isImportant?: boolean;
  isCustom?: boolean; // Được tạo hoặc chỉnh sửa trên Web/Firestore
  updatedAt?: string;
  assignedTo?: string[]; // Danh sách email người dùng được phân công
  assignedNames?: string[]; // Tên người dùng được phân công
  checklist?: ChecklistItem[]; // Các đầu việc cần kiểm tra/hoàn thành
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: 'auto_push_app' | 'auto_push_noti' | 'manual_pull' | 'manual_merge' | 'gas_webhook';
  status: 'success' | 'failed' | 'skipped';
  message: string;
  details?: string;
}

export interface QuickToolItem {
  id: string;
  title: string;
  url: string;
  icon: string;
  badge?: string;
}

export interface AdminAccount {
  email: string;
  uid?: string;
  passwordOrPin?: string;
  name: string;
  role: 'admin' | 'user';
  status?: 'active' | 'revoked';
  avatar?: string;
  isSuperAdmin?: boolean;
  addedAt?: string;
  addedBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  lastLogin?: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  emailOrCode: string;
  category: string;
  content: string;
  createdAt: string;
  status: 'new' | 'resolved';
}

export interface GoogleSheetsConfig {
  appsCsvUrl: string;
  notificationsCsvUrl: string;
  permissionsCsvUrl?: string; // Link CSV tab 'PhanQuyen'
  gasWebhookUrl?: string;     // URL Google Apps Script Web App (Tùy chọn: Đồng bộ 2 chiều trực tiếp vào Sheet)
  googleClientId?: string;    // Client ID Google Cloud OAuth (Xác thực Google chính chủ có popup)
  customLogoUrl?: string;     // URL ảnh logo tùy chỉnh
  campusName?: string;        // Tên phân hiệu cơ sở (mặc định: ĐỒNG NAI)
  enableGoogleSheetsSync?: boolean; // Tùy chọn Bật/Tắt đồng bộ Google Sheets (Mặc định: tắt để dùng 100% Firestore siêu tốc)
  lastSynced?: string;
  autoSync: boolean;
  syncError?: string;
}
