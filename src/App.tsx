import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategorySection } from './components/CategorySection';
import { SidebarWidgets } from './components/SidebarWidgets';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { NotificationModal } from './components/NotificationModal';
import { SupportModal } from './components/SupportModal';
import { AppLaunchModal } from './components/AppLaunchModal';
import { GuideModal } from './components/GuideModal';
import { EditAppModal } from './components/EditAppModal';
import { RoleManagementView } from './components/RoleManagementView';
import { Footer } from './components/Footer';
import { WebAppItem, NotificationItem, QuickToolItem, GoogleSheetsConfig, AdminAccount, SupportTicket } from './types';
import { DEFAULT_APPS, DEFAULT_NOTIFICATIONS, DEFAULT_QUICK_TOOLS } from './data/defaultData';
import {
  getStoredConfig,
  saveStoredConfig,
  fetchAppsFromCsv,
  fetchNotificationsFromCsv,
  fetchPermissionsFromCsv,
  fetchCloudData,
  saveCloudData,
  DEFAULT_SHEET_CONFIG,
  getStoredTickets,
  saveSupportTicket,
  updateTicketStatus,
  pushToGasWebhook
} from './services/sheetsService';
import { SearchX, Filter, Plus, ShieldCheck, X, Check, Edit3, ShieldAlert, LogOut, FileSpreadsheet, Inbox } from 'lucide-react';

export default function App() {
  // Admin Session State
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminAccount | null>(() => {
    try {
      const saved = sessionStorage.getItem('fpt_portal_admin_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  // Current Role
  const currentRole: 'user' | 'admin' = currentAdminUser ? 'admin' : 'user';

  // Data state
  const [apps, setApps] = useState<WebAppItem[]>(() => {
    try {
      const cached = localStorage.getItem('fpt_portal_cached_apps');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_APPS;
  });

  // Notifications (Purge any old garbage cache containing function n(a))
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const cached = localStorage.getItem('fpt_portal_cached_notis');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isGarbage = parsed.some((n: any) => n.title?.includes('function ') || n.title?.includes('typeof '));
          if (!isGarbage) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'noti-real-1',
        title: 'Sơ kết đào tạo',
        date: '19/10/2026',
        color: 'blue',
        content: 'Sơ kết đào tạo FPS miền nam'
      }
    ];
  });

  const [quickTools] = useState<QuickToolItem[]>(DEFAULT_QUICK_TOOLS);
  const [tickets, setTickets] = useState<SupportTicket[]>(getStoredTickets);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'home' | 'roles' | 'tailieu' | 'support'>('home');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Sheet config & Sync state
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig>(getStoredConfig);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | undefined>(sheetConfig.lastSynced);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<WebAppItem | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Admin App Editing Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<WebAppItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Google Sheets Sync
  const syncDataFromSheets = async (configToUse = sheetConfig) => {
    setIsSyncing(true);
    setSyncError(null);
    let hasError = false;

    try {
      const appsUrl = configToUse.appsCsvUrl || DEFAULT_SHEET_CONFIG.appsCsvUrl;
      const notisUrl = configToUse.notificationsCsvUrl || DEFAULT_SHEET_CONFIG.notificationsCsvUrl;

      // 1. Fetch Apps
      if (appsUrl) {
        try {
          const fetchedApps = await fetchAppsFromCsv(appsUrl);
          if (fetchedApps && fetchedApps.length > 0) {
            setApps((prevApps) => {
              // Google Sheets là nguồn dữ liệu chuẩn cao nhất
              const sheetUrls = new Set(fetchedApps.map((a) => a.url.toLowerCase().trim()));
              const sheetTitles = new Set(fetchedApps.map((a) => a.title.toLowerCase().trim()));

              // Giữ lại các tiện ích admin thêm trên web (nếu chưa có trong sheet)
              const webCustomApps = prevApps.filter(
                (a) =>
                  !a.id.startsWith('app-') &&
                  !sheetUrls.has(a.url.toLowerCase().trim()) &&
                  !sheetTitles.has(a.title.toLowerCase().trim())
              );

              const merged = [...fetchedApps, ...webCustomApps];
              localStorage.setItem('fpt_portal_cached_apps', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (err: any) {
          hasError = true;
          const msg = err.message?.includes('LINK_REQUIRES_LOGIN')
            ? 'File Google Sheets đang bị khóa quyền riêng tư. Vui lòng kiểm tra quyền chia sẻ công khai ("Bất kỳ ai có liên kết").'
            : err.message || 'Lỗi tải Webapps từ Google Sheets.';
          setSyncError(msg);
        }
      }

      // 2. Fetch Notifications (Sơ kết đào tạo)
      if (notisUrl) {
        try {
          const fetchedNotis = await fetchNotificationsFromCsv(notisUrl);
          if (fetchedNotis && fetchedNotis.length > 0) {
            setNotifications(fetchedNotis);
            localStorage.setItem('fpt_portal_cached_notis', JSON.stringify(fetchedNotis));
          }
        } catch (err: any) {
          console.warn('Lỗi fetch Thông báo:', err);
        }
      }

      if (!hasError) {
        const timeStr =
          new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
          ' ' +
          new Date().toLocaleDateString('vi-VN');
        setLastSyncedTime(timeStr);
        const updatedConfig = { ...configToUse, lastSynced: timeStr, syncError: undefined };
        setSheetConfig(updatedConfig);
        saveStoredConfig(updatedConfig);
        showToast('Đồng bộ dữ liệu từ Google Sheets thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ Google Sheets:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on initial mount
  useEffect(() => {
    const initSync = async () => {
      let configToSync = sheetConfig.appsCsvUrl ? sheetConfig : DEFAULT_SHEET_CONFIG;

      // 1. Tải Cloud Data chung
      try {
        const cloudData = await fetchCloudData();
        if (cloudData) {
          if (cloudData.config && (cloudData.config.appsCsvUrl || cloudData.config.notificationsCsvUrl)) {
            setSheetConfig(cloudData.config);
            configToSync = cloudData.config;
          }
          if (cloudData.customApps && cloudData.customApps.length > 0) {
            setApps(cloudData.customApps);
          }
          if (cloudData.tickets && cloudData.tickets.length > 0) {
            setTickets(cloudData.tickets);
          }
        }
      } catch {
        // ignore
      }

      // 2. Đồng bộ trực tiếp từ Google Sheets với cache-busting
      await syncDataFromSheets(configToSync);
    };

    initSync();
  }, []);

  const handleSaveSheetConfig = async (newConfig: GoogleSheetsConfig) => {
    setSheetConfig(newConfig);
    saveStoredConfig(newConfig);
    await syncDataFromSheets(newConfig);
    setIsSheetModalOpen(false);
  };

  const handleResetToDefault = () => {
    setApps(DEFAULT_APPS);
    setNotifications(DEFAULT_NOTIFICATIONS);
    setSheetConfig(DEFAULT_SHEET_CONFIG);
    saveStoredConfig(DEFAULT_SHEET_CONFIG);
    setLastSyncedTime(undefined);
    setSyncError(null);
    try {
      localStorage.removeItem('fpt_portal_cached_apps');
      localStorage.removeItem('fpt_portal_cached_notis');
    } catch {
      // ignore
    }
    showToast('Đã khôi phục dữ liệu ban đầu!');
    setIsSheetModalOpen(false);
  };

  // CHỨC NĂNG: ĐĂNG NHẬP ADMIN (Kiểm tra trực tiếp từ Google Sheets, không hardcode mật khẩu)
  const handleLoginAdmin = async (email: string, pin: string): Promise<boolean> => {
    const permissionsUrl = sheetConfig.permissionsCsvUrl || DEFAULT_SHEET_CONFIG.permissionsCsvUrl;
    let accounts: AdminAccount[] = [];

    if (permissionsUrl) {
      try {
        accounts = await fetchPermissionsFromCsv(permissionsUrl);
      } catch (err) {
        console.warn('Lỗi kiểm tra quyền admin:', err);
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPin = pin.trim();

    if (accounts.length > 0) {
      const matched = accounts.find(
        (acc) =>
          acc.email.toLowerCase().trim() === cleanEmail &&
          acc.passwordOrPin.trim() === cleanPin &&
          acc.role === 'admin'
      );

      if (matched) {
        setCurrentAdminUser(matched);
        sessionStorage.setItem('fpt_portal_admin_user', JSON.stringify(matched));
        showToast(`Xin chào ${matched.name}! Đã đăng nhập quyền Quản trị viên.`);
        return true;
      }
      return false;
    }

    return false;
  };

  // CHỨC NĂNG: ĐĂNG NHẬP ADMIN BẰNG TÀI KHOẢN GOOGLE
  const handleLoginWithGoogle = async (googleEmail: string): Promise<boolean> => {
    const permissionsUrl = sheetConfig.permissionsCsvUrl || DEFAULT_SHEET_CONFIG.permissionsCsvUrl;
    let accounts: AdminAccount[] = [];

    if (permissionsUrl) {
      try {
        accounts = await fetchPermissionsFromCsv(permissionsUrl);
      } catch {
        // ignore
      }
    }

    const cleanInput = googleEmail.toLowerCase().trim();

    // Khớp tài khoản trong tab PhanQuyen của Google Sheet
    const matchedFromSheet = accounts.find(
      (acc) => acc.email.toLowerCase().trim() === cleanInput && acc.role === 'admin'
    );

    // Hoặc email quản trị viên của chủ sở hữu hệ thống
    const isOwner = cleanInput === 'datpt60@fpt.edu.vn' || cleanInput === 'phantiendat221295@gmail.com';

    if (matchedFromSheet || isOwner) {
      const adminAcc: AdminAccount = matchedFromSheet || {
        email: googleEmail,
        passwordOrPin: '',
        name: 'Quản trị viên Đào tạo (Google)',
        role: 'admin'
      };

      setCurrentAdminUser(adminAcc);
      sessionStorage.setItem('fpt_portal_admin_user', JSON.stringify(adminAcc));
      showToast(`Đăng nhập Google thành công! Xin chào ${adminAcc.name}.`);
      return true;
    }

    return false;
  };

  // ADMIN LOGOUT
  const handleLogoutAdmin = () => {
    setCurrentAdminUser(null);
    try {
      sessionStorage.removeItem('fpt_portal_admin_user');
    } catch {
      // ignore
    }
    showToast('Đã đăng xuất quyền Admin, trở về quyền Người dùng.');
  };

  // THÊM/SỬA TIỆN ÍCH TRÊN WEB (Tự động lưu vĩnh viễn và đẩy sang GAS Webhook nếu có)
  const handleSaveApp = (updatedApp: WebAppItem) => {
    setApps((prevApps) => {
      const exists = prevApps.some((a) => a.id === updatedApp.id);
      let newApps: WebAppItem[];
      if (exists) {
        newApps = prevApps.map((a) => (a.id === updatedApp.id ? updatedApp : a));
        showToast(`Đã lưu tiện ích "${updatedApp.title}" thành công!`);
      } else {
        newApps = [...prevApps, updatedApp];
        showToast(`Đã thêm mới tiện ích "${updatedApp.title}" thành công!`);
      }

      // 1. Lưu Local
      try {
        localStorage.setItem('fpt_portal_cached_apps', JSON.stringify(newApps));
      } catch {
        // ignore
      }

      // 2. Lưu lên Cloud Database
      saveCloudData({ customApps: newApps });

      return newApps;
    });

    // 3. Nếu cấu hình Webhook Google Apps Script, ghi trực tiếp vào Google Sheets
    if (sheetConfig.gasWebhookUrl) {
      pushToGasWebhook(sheetConfig.gasWebhookUrl, { action: 'saveApp', app: updatedApp });
    }
  };

  const handleDeleteApp = (appId: string) => {
    setApps((prevApps) => {
      const target = prevApps.find((a) => a.id === appId);
      const newApps = prevApps.filter((a) => a.id !== appId);
      try {
        localStorage.setItem('fpt_portal_cached_apps', JSON.stringify(newApps));
      } catch {
        // ignore
      }
      saveCloudData({ customApps: newApps });
      showToast(`Đã xóa tiện ích "${target?.title || appId}" thành công!`);
      return newApps;
    });

    if (sheetConfig.gasWebhookUrl) {
      pushToGasWebhook(sheetConfig.gasWebhookUrl, { action: 'deleteApp', appId });
    }
  };

  // CHỨC NĂNG 4: XỬ LÝ GỬI YÊU CẦU HỖ TRỢ VÀ LƯU HỘP THƯ
  const handleSubmitTicket = async (ticket: SupportTicket) => {
    const updated = await saveSupportTicket(ticket);
    setTickets(updated);
    showToast(`Đã tiếp nhận yêu cầu hỗ trợ từ "${ticket.name}"!`);
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: 'new' | 'resolved') => {
    const updated = await updateTicketStatus(ticketId, status);
    setTickets(updated);
    showToast('Đã cập nhật trạng thái yêu cầu hỗ trợ.');
  };

  // Categories list
  const existingCategories = useMemo(() => {
    const defaultList = ['Quản lý đào tạo', 'Hỗ trợ giảng dạy', 'Tiện ích chung'];
    const customList = Array.from(new Set(apps.map((a) => a.category)));
    return Array.from(new Set([...defaultList, ...customList]));
  }, [apps]);

  // Tab navigation
  const handleTabChange = (tab: 'home' | 'roles' | 'tailieu' | 'support') => {
    if (tab === 'tailieu') {
      setIsGuideModalOpen(true);
      return;
    }
    if (tab === 'support') {
      setIsSupportModalOpen(true);
      return;
    }
    setActiveTab(tab);
    if (tab === 'home') {
      setSelectedCategoryFilter(null);
    }
  };

  // Quick tool actions
  const handleOpenQuickTool = (tool: QuickToolItem) => {
    if (tool.id === 'qt-4' || tool.url === '#support') {
      setIsSupportModalOpen(true);
    } else if (tool.url && tool.url !== '#') {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = app.title.toLowerCase().includes(query);
        const matchDesc = app.description.toLowerCase().includes(query);
        const matchCategory = app.category.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCategory) {
          return false;
        }
      }

      if (activeTag !== 'all') {
        if (app.tag?.toLowerCase() !== activeTag.toLowerCase()) {
          return false;
        }
      }

      if (selectedCategoryFilter) {
        if (app.category !== selectedCategoryFilter) {
          return false;
        }
      }

      return true;
    });
  }, [apps, searchQuery, activeTag, selectedCategoryFilter]);

  // Categories map grouped
  const categoriesMap = useMemo(() => {
    const groups: Record<string, WebAppItem[]> = {};
    const preferredOrder = ['Quản lý đào tạo', 'Hỗ trợ giảng dạy', 'Tiện ích chung'];

    preferredOrder.forEach((cat) => {
      groups[cat] = [];
    });

    filteredApps.forEach((app) => {
      if (!groups[app.category]) {
        groups[app.category] = [];
      }
      groups[app.category].push(app);
    });

    const result: { category: string; items: WebAppItem[] }[] = [];
    Object.keys(groups).forEach((category) => {
      if (groups[category].length > 0 || currentRole === 'admin') {
        result.push({ category, items: groups[category] });
      }
    });

    return result;
  }, [filteredApps, currentRole]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <Check size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        headerSearch={searchQuery}
        onHeaderSearchChange={setSearchQuery}
        onOpenSheetConfig={() => setIsSheetModalOpen(true)}
        onRefreshData={() => syncDataFromSheets(sheetConfig)}
        isSyncing={isSyncing}
        currentRole={currentRole}
        onToggleRole={() => setActiveTab('roles')}
      />

      {/* MAIN VIEW SWITCHER */}
      {activeTab === 'roles' ? (
        /* TAB PHÂN QUYỀN & HỘP THƯ YÊU CẦU */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
          <RoleManagementView
            currentRole={currentRole}
            currentAdminUser={currentAdminUser}
            onLoginAdmin={handleLoginAdmin}
            onLoginWithGoogle={handleLoginWithGoogle}
            onLogoutAdmin={handleLogoutAdmin}
            apps={apps}
            onAddApp={() => {
              setEditingApp(null);
              setIsEditModalOpen(true);
            }}
            onEditApp={(app) => {
              setEditingApp(app);
              setIsEditModalOpen(true);
            }}
            onDeleteApp={handleDeleteApp}
            onResetToDefault={handleResetToDefault}
            onGoToHome={() => setActiveTab('home')}
            hasPermissionsSheet={Boolean(sheetConfig.permissionsCsvUrl)}
            onOpenSheetConfig={() => setIsSheetModalOpen(true)}
            tickets={tickets}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onSyncNow={() => syncDataFromSheets(sheetConfig)}
            isSyncing={isSyncing}
          />
        </main>
      ) : (
        /* TAB TRANG CHỦ */
        <>
          {/* Sync Error Notice Banner */}
          {syncError && (
            <div className="bg-amber-500 text-white px-4 py-3 shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-[13px]">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldAlert size={18} className="text-amber-100 shrink-0" />
                  <span>
                    <strong>Thông báo Google Sheets:</strong> {syncError}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsSheetModalOpen(true)}
                    className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Xem hướng dẫn
                  </button>
                  <button
                    onClick={() => setSyncError(null)}
                    className="text-amber-100 hover:text-white p-1 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Mode Top Banner */}
          {currentRole === 'admin' && (
            <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-[13px]">
                <div className="flex items-center gap-2 font-medium text-center sm:text-left">
                  <ShieldCheck size={17} className="text-emerald-200 shrink-0" />
                  <span>
                    <strong>Quản trị viên ({currentAdminUser?.name || 'Admin'}):</strong> Mọi thay đổi bạn sửa tại đây được tự động lưu lên đám mây, các máy khác đều thấy ngay!
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingApp(null);
                      setIsEditModalOpen(true);
                    }}
                    className="bg-white text-emerald-800 hover:bg-emerald-100 font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Plus size={13} />
                    <span>+ Thêm tiện ích</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('roles')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Inbox size={13} />
                    <span>Hộp thư ({tickets.filter((t) => t.status === 'new').length})</span>
                  </button>
                  <button
                    onClick={handleLogoutAdmin}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <LogOut size={13} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Banner */}
          <Hero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            totalAppsCount={filteredApps.length}
          />

          {/* Main Content Area (70% Left - 30% Right) */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
            {/* Filter tags notice */}
            {(selectedCategoryFilter || searchQuery || activeTag !== 'all') && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-900 font-medium">
                  <Filter size={16} className="text-blue-600" />
                  <span>Đang lọc: {filteredApps.length} kết quả phù hợp</span>
                  {selectedCategoryFilter && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-200/80 text-blue-800 font-semibold text-xs">
                      Danh mục: {selectedCategoryFilter}
                    </span>
                  )}
                  {activeTag !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-200/80 text-blue-800 font-semibold text-xs">
                      Thẻ: {activeTag.toUpperCase()}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-200/80 text-blue-800 font-semibold text-xs">
                      Từ khóa: "{searchQuery}"
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveTag('all');
                    setSelectedCategoryFilter(null);
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs"
                >
                  <X size={13} />
                  <span>Đặt lại bộ lọc</span>
                </button>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
              {/* CỘT TRÁI (70%): Danh mục Webapp */}
              <div className="w-full lg:w-[69%] xl:w-[70%]">
                {categoriesMap.length > 0 ? (
                  categoriesMap.map(({ category, items }) => (
                    <CategorySection
                      key={category}
                      title={category}
                      apps={items}
                      onAppClick={(app) => setSelectedApp(app)}
                      onViewAll={(cat) =>
                        setSelectedCategoryFilter(cat === selectedCategoryFilter ? null : cat)
                      }
                      isAdmin={currentRole === 'admin'}
                      onEditApp={(app) => {
                        setEditingApp(app);
                        setIsEditModalOpen(true);
                      }}
                      onDeleteApp={handleDeleteApp}
                      onAddAppToCategory={(cat) => {
                        setEditingApp({
                          id: `app-${Date.now()}`,
                          title: '',
                          description: '',
                          url: 'https://',
                          category: cat,
                          icon: 'Sparkles',
                          tag: 'webapp',
                          colorTheme: 'blue'
                        });
                        setIsEditModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs space-y-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <SearchX size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg">Không tìm thấy ứng dụng phù hợp</h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                      Hãy thử tìm kiếm với từ khóa khác hoặc xóa bớt các bộ lọc đang chọn.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setActiveTag('all');
                        setSelectedCategoryFilter(null);
                      }}
                      className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Hiển thị tất cả ứng dụng
                    </button>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI (30%): Sidebar Widgets */}
              <div className="w-full lg:w-[31%] xl:w-[30%] shrink-0">
                <SidebarWidgets
                  notifications={notifications}
                  quickTools={quickTools}
                  onNotificationClick={(item) => setSelectedNotification(item)}
                  onViewAllNotifications={() => {
                    if (notifications.length > 0) {
                      setSelectedNotification(notifications[0]);
                    }
                  }}
                  onOpenQuickTool={handleOpenQuickTool}
                  onRequestSupport={() => setIsSupportModalOpen(true)}
                />
              </div>
            </div>
          </main>
        </>
      )}

      {/* Footer */}
      <Footer
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* Modals & Dialogs */}
      <GoogleSheetsModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        config={sheetConfig}
        onSaveConfig={handleSaveSheetConfig}
        onResetToDefault={handleResetToDefault}
        isSyncing={isSyncing}
        lastSynced={lastSyncedTime}
        totalApps={apps.length}
        totalNotis={notifications.length}
        syncError={syncError || undefined}
      />

      <NotificationModal
        item={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />

      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        onSubmitTicket={handleSubmitTicket}
        adminContactEmail={currentAdminUser?.email || 'Datpt60@fpt.edu.vn'}
      />

      <AppLaunchModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
      />

      <GuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Admin App Editing & Creation Modal */}
      <EditAppModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingApp(null);
        }}
        app={editingApp}
        onSave={handleSaveApp}
        onDelete={handleDeleteApp}
        categories={existingCategories}
      />
    </div>
  );
}
