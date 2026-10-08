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
import { WebAppItem, NotificationItem, QuickToolItem, GoogleSheetsConfig, AdminAccount } from './types';
import { DEFAULT_APPS, DEFAULT_NOTIFICATIONS, DEFAULT_QUICK_TOOLS, DEFAULT_ADMINS } from './data/defaultData';
import {
  getStoredConfig,
  saveStoredConfig,
  fetchAppsFromCsv,
  fetchNotificationsFromCsv,
  fetchPermissionsFromCsv
} from './services/sheetsService';
import { SearchX, Filter, Plus, ShieldCheck, X, Check, Edit3, ShieldAlert, LogOut, FileSpreadsheet } from 'lucide-react';

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

  // Current Role: 'admin' nếu đã đăng nhập, ngược lại là 'user'
  const currentRole: 'user' | 'admin' = currentAdminUser ? 'admin' : 'user';

  // Data state
  const [apps, setApps] = useState<WebAppItem[]>(() => {
    try {
      const cached = localStorage.getItem('fpt_portal_cached_apps');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_APPS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const cached = localStorage.getItem('fpt_portal_cached_notis');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const [quickTools] = useState<QuickToolItem[]>(DEFAULT_QUICK_TOOLS);

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
    if (!configToUse.appsCsvUrl && !configToUse.notificationsCsvUrl) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    let hasError = false;

    try {
      if (configToUse.appsCsvUrl) {
        try {
          const fetchedApps = await fetchAppsFromCsv(configToUse.appsCsvUrl);
          if (fetchedApps && fetchedApps.length > 0) {
            setApps(fetchedApps);
          }
        } catch (err: any) {
          hasError = true;
          const msg =
            err.message?.includes('LINK_REQUIRES_LOGIN')
              ? 'File Google Sheets đang bị khóa quyền riêng tư hoặc chưa chọn định dạng CSV khi xuất bản. Vui lòng mở quyền Chia sẻ "Bất kỳ ai có liên kết" và chọn định dạng CSV.'
              : err.message || 'Không thể đọc dữ liệu Webapps từ Google Sheets.';
          setSyncError(msg);
        }
      }

      if (configToUse.notificationsCsvUrl) {
        try {
          const fetchedNotis = await fetchNotificationsFromCsv(configToUse.notificationsCsvUrl);
          if (fetchedNotis && fetchedNotis.length > 0) {
            setNotifications(fetchedNotis);
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
      } else {
        showToast('Đồng bộ thất bại: Vui lòng kiểm tra quyền chia sẻ Google Sheets.');
      }
    } catch (err) {
      console.error('Lỗi khi đồng bộ Google Sheets:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync on initial mount if URL exists
  useEffect(() => {
    if (sheetConfig.appsCsvUrl || sheetConfig.notificationsCsvUrl) {
      syncDataFromSheets(sheetConfig);
    }
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
    const clearedConfig = { appsCsvUrl: '', notificationsCsvUrl: '', permissionsCsvUrl: '', autoSync: true };
    setSheetConfig(clearedConfig);
    saveStoredConfig(clearedConfig);
    setLastSyncedTime(undefined);
    setSyncError(null);
    try {
      localStorage.setItem('fpt_portal_cached_apps', JSON.stringify(DEFAULT_APPS));
      localStorage.setItem('fpt_portal_cached_notis', JSON.stringify(DEFAULT_NOTIFICATIONS));
    } catch {
      // ignore
    }
    showToast('Đã khôi phục dữ liệu ban đầu!');
    setIsSheetModalOpen(false);
  };

  // ADMIN LOGIN VIA GOOGLE SHEETS
  const handleLoginAdmin = async (email: string, pin: string): Promise<boolean> => {
    let accounts: AdminAccount[] = DEFAULT_ADMINS;

    if (sheetConfig.permissionsCsvUrl) {
      try {
        const remoteAccounts = await fetchPermissionsFromCsv(sheetConfig.permissionsCsvUrl);
        if (remoteAccounts && remoteAccounts.length > 0) {
          accounts = [...remoteAccounts, ...DEFAULT_ADMINS];
        }
      } catch {
        // fallback to default
      }
    }

    const matched = accounts.find(
      (acc) =>
        acc.email.toLowerCase().trim() === email.toLowerCase().trim() &&
        acc.passwordOrPin.trim() === pin.trim() &&
        acc.role === 'admin'
    );

    if (matched) {
      setCurrentAdminUser(matched);
      try {
        sessionStorage.setItem('fpt_portal_admin_user', JSON.stringify(matched));
      } catch {
        // ignore
      }
      showToast(`Xin chào ${matched.name}! Đã đăng nhập quyền Quản trị viên.`);
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

  // Admin: Save App
  const handleSaveApp = (updatedApp: WebAppItem) => {
    setApps((prevApps) => {
      const exists = prevApps.some((a) => a.id === updatedApp.id);
      let newApps: WebAppItem[];
      if (exists) {
        newApps = prevApps.map((a) => (a.id === updatedApp.id ? updatedApp : a));
        showToast(`Đã lưu thay đổi tiện ích "${updatedApp.title}"!`);
      } else {
        newApps = [...prevApps, updatedApp];
        showToast(`Đã thêm mới tiện ích "${updatedApp.title}"!`);
      }
      try {
        localStorage.setItem('fpt_portal_cached_apps', JSON.stringify(newApps));
      } catch {
        // ignore
      }
      return newApps;
    });
  };

  // Admin: Delete App
  const handleDeleteApp = (appId: string) => {
    setApps((prevApps) => {
      const target = prevApps.find((a) => a.id === appId);
      const newApps = prevApps.filter((a) => a.id !== appId);
      try {
        localStorage.setItem('fpt_portal_cached_apps', JSON.stringify(newApps));
      } catch {
        // ignore
      }
      showToast(`Đã xóa tiện ích "${target?.title || appId}"!`);
      return newApps;
    });
  };

  // Categories list
  const existingCategories = useMemo(() => {
    const defaultList = ['Quản lý đào tạo', 'Hỗ trợ giảng dạy', 'Tiện ích chung'];
    const customList = Array.from(new Set(apps.map((a) => a.category)));
    return Array.from(new Set([...defaultList, ...customList]));
  }, [apps]);

  // Handle Tab navigation
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

      {/* Sticky Top Header with Official Logo, Roles Tab, and Actions */}
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
        /* TAB PHÂN QUYỀN */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
          <RoleManagementView
            currentRole={currentRole}
            currentAdminUser={currentAdminUser}
            onLoginAdmin={handleLoginAdmin}
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
                    <strong>Cảnh báo kết nối Google Sheets:</strong> {syncError}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsSheetModalOpen(true)}
                    className="bg-white text-amber-900 hover:bg-amber-50 font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    Xem hướng dẫn sửa
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

          {/* Admin Mode Banner Notification (chỉ hiện khi đang ở quyền Admin) */}
          {currentRole === 'admin' && (
            <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-xs">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-[13px]">
                <div className="flex items-center gap-2 font-medium text-center sm:text-left">
                  <ShieldCheck size={17} className="text-emerald-200 shrink-0" />
                  <span>
                    <strong>Đang ở quyền Quản trị viên ({currentAdminUser?.name || 'Admin'}):</strong> Bạn có thể sửa tên và link trực tiếp bằng nút <Edit3 size={13} className="inline mx-1 text-emerald-200" /> trên từng thẻ tiện ích.
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
                    onClick={handleLogoutAdmin}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <LogOut size={13} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Banner with Campus Theme & Floating Search */}
          <Hero
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeTag={activeTag}
            onTagChange={setActiveTag}
            totalAppsCount={filteredApps.length}
          />

          {/* Main Content Area: 2 Columns (70% Left - 30% Right) */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
            {/* Active filter notices */}
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
