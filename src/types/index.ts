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

export interface NotificationItem {
  id: string;
  title: string;
  date: string;
  url?: string;
  color?: 'red' | 'blue' | 'purple' | 'orange' | 'green';
  content?: string;
  isImportant?: boolean;
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
  passwordOrPin: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
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
  lastSynced?: string;
  autoSync: boolean;
  syncError?: string;
}
