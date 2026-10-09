import React, { useState, useEffect } from 'react';
import { WebAppItem, AdminAccount, SupportTicket } from '../types';
import {
  ShieldCheck,
  User,
  Edit3,
  Trash2,
  Plus,
  ExternalLink,
  Search,
  Lock,
  LogOut,
  LogIn,
  AlertCircle,
  FileSpreadsheet,
  Mail,
  Inbox,
  Check,
  Clock,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserX,
  ShieldAlert,
  RotateCcw,
  X,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { FptPolySchoolLogo } from './FptPolySchoolLogo';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../services/googleAuthService';

interface RoleManagementViewProps {
  currentRole: 'user' | 'admin';
  currentAdminUser: AdminAccount | null;
  onLoginAdmin: (email: string, pin: string) => boolean | Promise<boolean>;
  onLoginWithGoogleOAuth: () => Promise<boolean>;
  onLoginWithGoogleEmail: (email: string) => Promise<boolean>;
  onLogoutAdmin: () => void;
  apps: WebAppItem[];
  onAddApp: () => void;
  onEditApp: (app: WebAppItem) => void;
  onDeleteApp: (appId: string) => void;
  onResetToDefault: () => void;
  onGoToHome: () => void;
  hasPermissionsSheet: boolean;
  onOpenSheetConfig: () => void;
  tickets: SupportTicket[];
  onUpdateTicketStatus: (ticketId: string, status: 'new' | 'resolved') => void;
  onDeleteTicket?: (ticketId: string) => void;
  adminUsers?: AdminAccount[];
  onAddAdminUser?: (email: string, name?: string) => Promise<void>;
  onRemoveAdminUser?: (email: string) => Promise<void>;
  onResetDefaultAdmins?: () => Promise<void>;
  onSyncNow?: () => Promise<void> | void;
  isSyncing?: boolean;
  googleClientId?: string;
  onSaveGoogleClientId?: (clientId: string) => void;
  customLogoUrl?: string;
  campusName?: string;
  onSaveLogoAndCampus?: (logoUrl: string, campus: string) => Promise<void> | void;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  currentRole,
  currentAdminUser,
  onLoginAdmin,
  onLoginWithGoogleOAuth,
  onLoginWithGoogleEmail,
  onLogoutAdmin,
  apps,
  onAddApp,
  onEditApp,
  onDeleteApp,
  onResetToDefault,
  onGoToHome,
  hasPermissionsSheet,
  onOpenSheetConfig,
  tickets,
  onUpdateTicketStatus,
  onDeleteTicket,
  adminUsers = [],
  onAddAdminUser,
  onRemoveAdminUser,
  onResetDefaultAdmins,
  onSyncNow,
  isSyncing = false,
  googleClientId,
  onSaveGoogleClientId,
  customLogoUrl = '',
  campusName = 'ĐỒNG NAI',
  onSaveLogoAndCampus
}) => {
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Google OAuth setup prompt state
  const [showGoogleConfig, setShowGoogleConfig] = useState(false);
  const [googleClientIdInput, setGoogleClientIdInput] = useState(googleClientId || DEFAULT_GOOGLE_CLIENT_ID);
  const [showAlternateEmailInput, setShowAlternateEmailInput] = useState(false);
  const [alternateEmail, setAlternateEmail] = useState('');

  // Admin view tab: 'admins' (Mặc định mở tab Phân Quyền) | 'apps' | 'tickets' | 'logo'
  const [adminTab, setAdminTab] = useState<'admins' | 'apps' | 'tickets' | 'logo'>('admins');

  // Custom Logo and Campus state
  const [logoInput, setLogoInput] = useState(customLogoUrl || '');
  const [campusInput, setCampusInput] = useState(campusName || 'ĐỒNG NAI');
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (customLogoUrl) setLogoInput(customLogoUrl);
  }, [customLogoUrl]);

  useEffect(() => {
    if (campusName) setCampusInput(campusName);
  }, [campusName]);

  // Admin Management Form State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);

  // Search in table
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = Array.from(new Set(apps.map((a) => a.category)));

  const filteredApps = apps.filter((app) => {
    const matchSearch =
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'all' || app.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const success = await onLoginAdmin(loginEmail.trim(), loginPass.trim());
      if (!success) {
        setLoginError(
          'Email hoặc mật khẩu không chính xác! Hệ thống kiểm tra trực tiếp với dữ liệu trong tab PhanQuyen trên Google Sheets.'
        );
      } else {
        setLoginEmail('');
        setLoginPass('');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Đăng nhập không thành công.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTriggerGoogleOAuth = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await onLoginWithGoogleOAuth();
    } catch (err: any) {
      if (err.message?.includes('CLIENT_ID_MISSING')) {
        setShowGoogleConfig(true);
      } else {
        setLoginError(err.message || 'Lỗi đăng nhập với tài khoản Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!onResetDefaultAdmins) return;
    if (
      window.confirm(
        'Khôi phục 2 Quản trị viên ban đầu (datpt60@fpt.edu.vn và phantiendat221295@gmail.com) lên Firestore?'
      )
    ) {
      setAdminActionError(null);
      setAdminActionSuccess(null);
      try {
        await onResetDefaultAdmins();
        setAdminActionSuccess('Đã khôi phục 2 Quản trị viên mặc định lên Firestore Cloud!');
      } catch (err: any) {
        setAdminActionError(err.message || 'Lỗi khôi phục Admin');
      }
    }
  };

  const handleSaveClientIdAndLogin = async () => {
    if (!googleClientIdInput.trim()) {
      setLoginError('Vui lòng nhập Google Client ID.');
      return;
    }
    if (onSaveGoogleClientId) {
      onSaveGoogleClientId(googleClientIdInput.trim());
    }
    setIsLoggingIn(true);
    try {
      await onLoginWithGoogleOAuth();
      setShowGoogleConfig(false);
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi đăng nhập Google với Client ID.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAlternateGoogleLogin = async () => {
    if (!alternateEmail.trim()) {
      setLoginError('Vui lòng nhập email Google của Quản trị viên.');
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const ok = await onLoginWithGoogleEmail(alternateEmail.trim());
      if (!ok) {
        setLoginError(`Tài khoản Google "${alternateEmail}" không có quyền Admin trong Google Sheets!`);
      } else {
        setShowGoogleConfig(false);
        setAlternateEmail('');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi xác thực email Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !onAddAdminUser) return;
    setIsAddingAdmin(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    try {
      await onAddAdminUser(newAdminEmail.trim(), newAdminName.trim());
      setAdminActionSuccess(`Đã cấp quyền Quản trị viên cho "${newAdminEmail.trim()}" thành công!`);
      setNewAdminEmail('');
      setNewAdminName('');
    } catch (err: any) {
      setAdminActionError(err.message || 'Lỗi khi cấp quyền Admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdminClick = async (email: string) => {
    if (!onRemoveAdminUser) return;
    if (
      window.confirm(
        `Bạn có chắc chắn muốn thu hồi quyền Admin của "${email}"? Tài khoản này sẽ bị hủy quyền ngay sau 30 giây hoặc khi họ tải lại trang.`
      )
    ) {
      setAdminActionError(null);
      setAdminActionSuccess(null);
      try {
        await onRemoveAdminUser(email);
        setAdminActionSuccess(`Đã thu hồi quyền Quản trị viên của "${email}" thành công!`);
      } catch (err: any) {
        setAdminActionError(err.message || 'Lỗi khi thu hồi quyền Admin');
      }
    }
  };

  const handleSaveLogo = async () => {
    if (!onSaveLogoAndCampus) return;
    setIsSavingLogo(true);
    setLogoSaveSuccess(null);
    try {
      await onSaveLogoAndCampus(logoInput.trim(), campusInput.trim());
      setLogoSaveSuccess('Đã cập nhật Logo và Tên phân hiệu thành công!');
      setTimeout(() => setLogoSaveSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi lưu Logo');
    } finally {
      setIsSavingLogo(false);
    }
  };

  const handleResetLogo = async () => {
    if (!onSaveLogoAndCampus) return;
    if (window.confirm('Khôi phục về Logo mặc định FPT PolySchool?')) {
      setLogoInput('');
      setCampusInput('ĐỒNG NAI');
      await onSaveLogoAndCampus('', 'ĐỒNG NAI');
      setLogoSaveSuccess('Đã khôi phục Logo chuẩn FPT PolySchool!');
      setTimeout(() => setLogoSaveSuccess(null), 3000);
    }
  };

  const newTicketsCount = tickets.filter((t) => t.status === 'new').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Trung Tâm Phân Quyền & Quản Trị Hệ Thống
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quyền Người dùng (xem và truy cập) & Quyền Quản trị viên (thêm, sửa, xóa tiện ích và tiếp nhận yêu cầu)
          </p>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {currentRole === 'admin' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Đang ở quyền: QUẢN TRỊ VIÊN (ADMIN)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
              <User size={16} className="text-blue-600" />
              <span>Đang ở quyền: NGƯỜI DÙNG (CHỈ XEM)</span>
            </div>
          )}
        </div>
      </div>

      {/* VIEW DÀNH CHO ADMIN ĐÃ ĐĂNG NHẬP */}
      {currentRole === 'admin' ? (
        <div className="space-y-6">
          {/* Admin Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {currentAdminUser?.avatar ? (
                <img
                  src={currentAdminUser.avatar}
                  alt={currentAdminUser.name}
                  className="w-14 h-14 rounded-2xl border-2 border-white/50 object-cover shadow-sm shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 text-white font-black text-xl">
                  <ShieldCheck size={32} />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-lg sm:text-xl">
                    Xin chào, {currentAdminUser?.name || 'Quản trị viên'}!
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-[11px] font-bold uppercase tracking-wider">
                    Full Admin Access
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                  Tài khoản: <span className="font-semibold underline">{currentAdminUser?.email}</span> • Dữ liệu tự động đồng bộ trên mọi thiết bị
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-white/20"
              >
                <LogOut size={16} />
                <span>Đăng xuất Admin</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 border-b border-slate-200 pb-2 overflow-x-auto">
            {/* TAB 1: PHÂN QUYỀN ADMIN - ĐẶT ĐẦU TIÊN VÀ NỔI BẬT */}
            <button
              onClick={() => setAdminTab('admins')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                adminTab === 'admins'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Phân Quyền Admin ({adminUsers.length})</span>
            </button>

            {/* TAB 2: QUẢN LÝ TIỆN ÍCH */}
            <button
              onClick={() => setAdminTab('apps')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                adminTab === 'apps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Quản lý Tiện ích Webapps ({apps.length})</span>
            </button>

            {/* TAB 3: HỘP THƯ */}
            <button
              onClick={() => setAdminTab('tickets')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 relative shrink-0 ${
                adminTab === 'tickets'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Inbox size={16} />
              <span>Hộp thư Yêu cầu Hỗ trợ ({tickets.length})</span>
              {newTicketsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full animate-pulse">
                  {newTicketsCount} mới
                </span>
              )}
            </button>

            {/* TAB 4: TÙY CHỈNH LOGO & PHÂN HIỆU */}
            <button
              onClick={() => setAdminTab('logo')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                adminTab === 'logo'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Palette size={16} />
              <span>Tùy chỉnh Logo & Phân hiệu</span>
            </button>
          </div>

          {/* TAB 1: QUẢN LÝ TIỆN ÍCH */}
          {adminTab === 'apps' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-slate-800 text-lg">
                      Danh Sách Tiện Ích ({apps.length} ứng dụng)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hệ thống tự động lưu trên đám mây và đồng bộ với Google Sheets. Mọi thiết bị khác truy cập đều nhìn thấy tức thì.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onAddApp}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>+ Thêm tiện ích mới</span>
                  </button>

                  {onSyncNow && (
                    <button
                      type="button"
                      onClick={() => onSyncNow()}
                      disabled={isSyncing}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                      <span>Đồng bộ Google Sheets</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenSheetConfig}
                    className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-600" />
                    <span>Cấu hình Google Sheets</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm tiện ích theo tên hoặc link..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none w-full sm:w-auto"
                >
                  <option value="all">Tất cả nhóm danh mục</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3 px-4">Tiện ích</th>
                      <th className="py-3 px-4">Đường dẫn link (URL)</th>
                      <th className="py-3 px-4">Nhóm danh mục</th>
                      <th className="py-3 px-4">Nguồn dữ liệu</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                              <DynamicIcon name={app.icon} size={16} />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{app.title}</span>
                              <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                                {app.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-blue-600">
                            <span className="truncate max-w-[220px]">{app.url}</span>
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-blue-800"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                            {app.category}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Firestore Cloud
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditApp(app)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Chỉnh sửa tên và link"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn xóa tiện ích "${app.title}" không?`)) {
                                  onDeleteApp(app.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa tiện ích"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: HỘP THƯ YÊU CẦU HỖ TRỢ */}
          {adminTab === 'tickets' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Inbox size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Hộp Thư Yêu Cầu Hỗ Trợ Đào Tạo</h3>
                    <p className="text-xs text-slate-500">Danh sách các yêu cầu được gửi từ biểu mẫu hỗ trợ của người dùng</p>
                  </div>
                </div>
              </div>

              {tickets.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Inbox size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Hiện chưa có yêu cầu hỗ trợ nào được gửi đến.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        t.status === 'new'
                          ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{t.name}</span>
                          <span className="text-xs text-slate-500 font-mono">({t.emailOrCode})</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold">
                            {t.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                          <Clock size={13} />
                          <span>{t.createdAt}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 mb-3 whitespace-pre-wrap leading-relaxed">
                        {t.content}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span
                          className={`text-xs font-bold ${
                            t.status === 'new' ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {t.status === 'new' ? '• Chờ xử lý' : '✓ Đã xử lý'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateTicketStatus(t.id, t.status === 'new' ? 'resolved' : 'new')
                            }
                            className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            {t.status === 'new' ? 'Đánh dấu đã giải quyết' : 'Đánh dấu chờ xử lý'}
                          </button>
                          {onDeleteTicket && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Bạn có chắc muốn xóa yêu cầu hỗ trợ này khỏi Firestore?')) {
                                  onDeleteTicket(t.id);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa yêu cầu khỏi Firestore"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHÂN QUYỀN & QUẢN LÝ TÀI KHOẢN ADMIN */}
          {adminTab === 'admins' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      Quản Lý Phân Quyền Quản Trị Viên (Firestore Cloud)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cấp hoặc thu hồi quyền Admin trực tiếp trên hệ thống đám mây mà không cần sửa code hay Google Sheets
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đồng bộ thời gian thực & Kiểm tra 30s
                  </span>
                </div>
              </div>

              {/* Thông báo kết quả thao tác */}
              {adminActionSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600 shrink-0" />
                    <span>{adminActionSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminActionSuccess(null)}
                    className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {adminActionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>{adminActionError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminActionError(null)}
                    className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Form Cấp Quyền Admin Mới */}
              <div className="p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-blue-900">
                  <UserCheck size={16} className="text-blue-600" />
                  <span>Cấp quyền Quản trị viên mới</span>
                </div>
                <p className="text-xs text-slate-600">
                  Nhập email Google hoặc email FPT của cán bộ/giảng viên để cấp toàn quyền quản trị (Thêm, sửa, xóa webapp, tiếp nhận yêu cầu hỗ trợ).
                </p>

                <form onSubmit={handleAddAdminSubmit} className="flex flex-col sm:flex-row gap-3 pt-1">
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Nhập email: vidu@fpt.edu.vn hoặc gmail..."
                    className="flex-1 bg-white border border-blue-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Họ tên hiển thị (tùy chọn)"
                    className="sm:w-56 bg-white border border-blue-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={isAddingAdmin}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
                  >
                    <Plus size={16} />
                    <span>{isAddingAdmin ? 'Đang thêm...' : '+ Cấp quyền Admin'}</span>
                  </button>
                </form>
              </div>

              {/* Danh Sách Quản Trị Viên Hiện Tại */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Danh sách Quản trị viên hiện hành ({adminUsers.length} tài khoản)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Lưu và đồng bộ tự động theo thời gian thực trên Cloud Firestore
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onResetDefaultAdmins && (
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                        title="Khôi phục lại datpt60@fpt.edu.vn và phantiendat221295@gmail.com"
                      >
                        <RotateCcw size={13} />
                        <span>Khôi phục 2 Admin ban đầu</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Add Chips for missing initial admins */}
                {(!adminUsers.some((a) => a.email.toLowerCase().trim() === 'datpt60@fpt.edu.vn') ||
                  !adminUsers.some((a) => a.email.toLowerCase().trim() === 'phantiendat221295@gmail.com')) && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                    <span className="text-amber-900 font-medium">Gợi ý khôi phục tài khoản quản trị viên:</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!adminUsers.some((a) => a.email.toLowerCase().trim() === 'datpt60@fpt.edu.vn') && (
                        <button
                          type="button"
                          onClick={() => onAddAdminUser?.('datpt60@fpt.edu.vn', 'Phan Tiến Đạt (Đào tạo)')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100 transition-colors cursor-pointer text-xs"
                        >
                          + Thêm lại datpt60@fpt.edu.vn
                        </button>
                      )}
                      {!adminUsers.some((a) => a.email.toLowerCase().trim() === 'phantiendat221295@gmail.com') && (
                        <button
                          type="button"
                          onClick={() => onAddAdminUser?.('phantiendat221295@gmail.com', 'Phan Tiến Đạt')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold hover:bg-amber-100 transition-colors cursor-pointer text-xs"
                        >
                          + Thêm lại phantiendat221295@gmail.com
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3 px-4">Tài khoản Quản trị</th>
                        <th className="py-3 px-4">Cấp bậc / Quyền hạn</th>
                        <th className="py-3 px-4">Thời gian cấp</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {adminUsers.map((admin) => {
                        const isSuper =
                          admin.isSuperAdmin ||
                          ['datpt60@fpt.edu.vn', 'phantiendat221295@gmail.com'].includes(
                            admin.email.toLowerCase().trim()
                          );

                        return (
                          <tr key={admin.email} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                    isSuper
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span>{admin.name || admin.email}</span>
                                    {isSuper && (
                                      <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-md">
                                        ADMIN
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-slate-500 font-mono">
                                    {admin.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Quản trị viên (Admin)
                              </span>
                            </td>

                            <td className="py-3 px-4 text-xs text-slate-500">
                              {admin.addedAt
                                ? new Date(admin.addedAt).toLocaleDateString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                  })
                                : 'Mặc định ban đầu'}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveAdminClick(admin.email)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer"
                                title="Thu hồi quyền quản trị của tài khoản này"
                              >
                                <UserX size={13} />
                                <span>Thu hồi quyền</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hộp Giải Thích An Toàn / Security Notice */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-600" />
                  <span>Cơ chế bảo vệ & Thu hồi quyền tự động</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong>Khi bạn bấm "Thu hồi quyền":</strong> Email sẽ bị xóa ngay khỏi Firestore. Nếu người đó đang mở tab trình duyệt, hệ thống sẽ tự động tước quyền Admin trong vòng <strong>tối đa 30 giây</strong> (hoặc ngay khi họ reload lại trang).
                  </li>
                  <li>
                    <strong>Cấp quyền tiện lợi:</strong> Bạn có thể phân quyền cho bất kỳ ai trực tiếp trên màn hình này mà không cần sửa code <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">App.tsx</code> hay Google Sheets.
                  </li>
                  <li>
                    <strong>Phục hồi nhanh:</strong> Bạn luôn có thể bấm nút <em>"Khôi phục 2 Admin ban đầu"</em> hoặc dùng gợi ý phía trên để thêm lại <code>datpt60@fpt.edu.vn</code> và <code>phantiendat221295@gmail.com</code> bất cứ khi nào.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: TÙY CHỈNH LOGO & PHÂN HIỆU */}
          {adminTab === 'logo' && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F26F21] flex items-center justify-center shrink-0">
                    <Palette size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      Tùy Chỉnh Logo & Thông Tin Thương Hiệu
                    </h3>
                    <p className="text-xs text-slate-500">
                      Thay đổi ảnh Logo hoặc tên phân hiệu cơ sở. Cập nhật tức thì trên toàn bộ trang web và lưu vào Cloud Firestore!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Khôi phục Logo FPT PolySchool</span>
                  </button>
                </div>
              </div>

              {logoSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check size={16} className="text-emerald-600 shrink-0" />
                  <span>{logoSaveSuccess}</span>
                </div>
              )}

              {/* Form cài đặt Logo & Tên cơ sở */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đường dẫn ảnh Logo tùy chỉnh (URL ảnh PNG, JPG, SVG hoặc WebP):
                    </label>
                    <input
                      type="url"
                      value={logoInput}
                      onChange={(e) => setLogoInput(e.target.value)}
                      placeholder="Dán link ảnh logo vào đây (để trống nếu dùng logo chuẩn)..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Bạn có thể dán link ảnh logo từ Google Drive (link trực tiếp), Imgur, Facebook hoặc máy chủ nội bộ.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên cơ sở / Phân hiệu đào tạo (hiển thị dưới Logo):
                    </label>
                    <input
                      type="text"
                      value={campusInput}
                      onChange={(e) => setCampusInput(e.target.value)}
                      placeholder="Ví dụ: ĐỒNG NAI, HỒ CHÍ MINH, HÀ NỘI..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isSavingLogo}
                      onClick={handleSaveLogo}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles size={15} />
                      <span>{isSavingLogo ? 'Đang lưu...' : 'Lưu Thay Đổi Logo & Cơ Sở'}</span>
                    </button>

                    {logoInput && (
                      <button
                        type="button"
                        onClick={() => setLogoInput('')}
                        className="px-3 py-2 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Xóa link ảnh (dùng lại Logo FPT gốc)
                      </button>
                    )}
                  </div>
                </div>

                {/* Preview Box */}
                <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-blue-600" />
                    <span>Xem trước hiển thị Logo trên thanh Header:</span>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center min-h-[90px]">
                    <FptPolySchoolLogo customLogoUrl={logoInput} subText={campusInput || 'ĐỒNG NAI'} />
                  </div>
                  <p className="text-[11px] text-slate-500 text-center">
                    {logoInput
                      ? 'Đang xem trước ảnh tùy chỉnh từ link bạn vừa nhập'
                      : 'Đang xem trước Logo Vector chuẩn FPT Polytechnic'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* GIAO DIỆN PHÂN QUYỀN & ĐĂNG NHẬP DÀNH CHO NGƯỜI DÙNG THƯỜNG */
        <div className="space-y-6">
          {/* Thông báo hướng dẫn rõ ràng */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white rounded-3xl p-6 sm:p-7 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-extrabold uppercase tracking-wider">
                    Phân Quyền Trực Tiếp Trên Web
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-bold">
                    Cloud Firestore 100%
                  </span>
                </div>
                <h3 className="font-extrabold text-xl sm:text-2xl mt-2 tracking-tight">
                  Quản Lý Phân Quyền Quản Trị Viên (Admin)
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
                  Để Thêm quyền hoặc Xóa quyền Admin của bất kỳ ai, vui lòng bấm vào nút <strong>"Đăng nhập Quản trị viên"</strong> bên dưới. Mọi thay đổi đều có hiệu lực ngay lập tức và tự động thu hồi sau 30 giây!
                </p>
              </div>

              <button
                type="button"
                onClick={onGoToHome}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shrink-0 border border-white/20"
              >
                Về Trang chủ
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* CỘT TRÁI: BẢNG DANH SÁCH QUẢN TRỊ VIÊN HIỆN CÓ QUYỀN TRÊN CLOUD FIRESTORE */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base sm:text-lg">
                      Danh Sách Admin Đang Hoạt Động
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Có {adminUsers.length} tài khoản có toàn quyền quản trị
                    </span>
                  </div>
                </div>

                <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                  Thời gian thực
                </span>
              </div>

              <p className="text-xs text-slate-600">
                Bấm trực tiếp vào tài khoản Quản trị viên của bạn dưới đây để mở giao diện thêm/xóa quyền:
              </p>

              {/* Danh sách các card admin */}
              <div className="space-y-3 pt-1">
                {adminUsers.map((admin) => {
                  const isDatFpt = admin.email.toLowerCase().trim() === 'datpt60@fpt.edu.vn';
                  const isDatGmail = admin.email.toLowerCase().trim() === 'phantiendat221295@gmail.com';

                  return (
                    <div
                      key={admin.email}
                      className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/70 hover:bg-blue-50/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-black text-sm">
                          {admin.avatar ? (
                            <img src={admin.avatar} alt={admin.name} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            admin.name.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                              {admin.name || 'Quản trị viên'}
                            </span>
                            {(isDatFpt || isDatGmail) && (
                              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-md">
                                Quản trị chính
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono block truncate">
                            {admin.email}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onLoginWithGoogleEmail(admin.email)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                      >
                        <ShieldCheck size={14} />
                        <span>Vào Admin ngay</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Hộp bảo mật */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-blue-600" />
                  <span>Quy trình thu hồi quyền tự động 30 giây:</span>
                </span>
                <p className="text-[11.5px] text-blue-800 leading-relaxed">
                  Khi bạn đăng nhập và xóa bất kỳ ai khỏi danh sách, người đó sẽ bị thu hồi quyền ngay lập tức trong vòng tối đa 30 giây mà không cần can thiệp thêm!
                </p>
              </div>
            </div>

            {/* CỘT PHẢI: XÁC THỰC GOOGLE OAUTH HOẶC NHẬP EMAIL ADMIN */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-base sm:text-lg">
                      Xác Thực Đăng Nhập Quản Trị Viên
                    </h4>
                    <p className="text-xs text-slate-500">
                      Đăng nhập để vào giao diện thêm/xóa quyền và quản lý webapp
                    </p>
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* CÁCH 1: ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE CHÍNH CHỦ */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={handleTriggerGoogleOAuth}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {isLoggingIn ? 'Đang mở xác thực Google...' : 'Đăng nhập với tài khoản Google'}
                  </span>
                </button>

                {/* CÁCH 2: NHẬP EMAIL QUẢN TRỊ VIÊN BẤT KỲ */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} className="text-blue-600" />
                      <span>Hoặc nhập Email Quản trị viên để xác thực:</span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={alternateEmail}
                      onChange={(e) => setAlternateEmail(e.target.value)}
                      placeholder="Nhập email: ví dụ datpt60@fpt.edu.vn..."
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={isLoggingIn || !alternateEmail.trim()}
                      onClick={handleAlternateGoogleLogin}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      Vào Admin
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold uppercase">Hoặc đăng nhập mật khẩu</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* CÁCH 3: FORM ĐĂNG NHẬP MẬT KHẨU */}
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Admin <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Nhập email quản trị viên..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <LogIn size={16} />
                  <span>{isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập quyền Admin'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
