import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle,
  FileSpreadsheet,
  Inbox,
  Check,
  Clock,
  RefreshCw,
  Sparkles,
  UserX,
  ShieldAlert,
  RotateCcw,
  X,
  Image as ImageIcon,
  Palette,
  Settings,
  HelpCircle
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { FptPolySchoolLogo } from './FptPolySchoolLogo';
import {
  DEFAULT_GOOGLE_CLIENT_ID,
  renderGoogleSignInButton,
  GoogleUserProfile
} from '../services/googleAuthService';
import {
  DEFAULT_ADMIN_USERS,
  SYSTEM_SUPER_ADMINS
} from '../services/firestoreService';

interface RoleManagementViewProps {
  currentRole: 'user' | 'admin';
  currentAdminUser: AdminAccount | null;
  onLoginWithGoogleOAuth: () => Promise<boolean>;
  onLoginWithGoogleProfile?: (profile: GoogleUserProfile) => Promise<boolean>;
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
  onUpdateAdminRole?: (email: string, newRole: 'admin' | 'user') => Promise<void>;
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
  onLoginWithGoogleOAuth,
  onLoginWithGoogleProfile,
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
  onUpdateAdminRole,
  onResetDefaultAdmins,
  onSyncNow,
  isSyncing = false,
  googleClientId,
  onSaveGoogleClientId,
  customLogoUrl = '',
  campusName = 'ĐỒNG NAI',
  onSaveLogoAndCampus
}) => {
  // Login state
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPopupHelp, setShowPopupHelp] = useState(false);

  // Google OAuth setup prompt state
  const [showGoogleConfig, setShowGoogleConfig] = useState(false);
  const [googleClientIdInput, setGoogleClientIdInput] = useState(
    googleClientId || DEFAULT_GOOGLE_CLIENT_ID
  );

  // Google Sign-In container ref
  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  // Xác định Super Admin (Chỉ duy nhất 2 email này có quyền xem, thêm hoặc xóa admin)
  const isSuperAdmin =
    Boolean(currentAdminUser?.isSuperAdmin) ||
    SYSTEM_SUPER_ADMINS.includes((currentAdminUser?.email || '').toLowerCase().trim());

  // Admin view tab: Super Admin mặc định mở 'admins', Admin thường mở 'apps'
  const [adminTab, setAdminTab] = useState<'admins' | 'apps' | 'tickets' | 'logo'>(() => {
    return isSuperAdmin ? 'admins' : 'apps';
  });

  useEffect(() => {
    if (!isSuperAdmin && adminTab === 'admins') {
      setAdminTab('apps');
    }
  }, [isSuperAdmin, adminTab]);

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

  // Admin Management Form State (trong màn hình đã xác thực)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [adminActionError, setAdminActionError] = useState<string | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null);
  const [loadingEmails, setLoadingEmails] = useState<Record<string, boolean>>({});

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetAcknowledged, setResetAcknowledged] = useState(false);

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

  // Tự động kết xuất nút Google Sign-In chính thức (GIS renderButton)
  useEffect(() => {
    if (currentRole === 'admin') return;

    const effectiveId = googleClientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (googleBtnContainerRef.current) {
      const cleanup = renderGoogleSignInButton(
        googleBtnContainerRef.current,
        effectiveId,
        async (profile) => {
          setLoginError(null);
          setIsLoggingIn(true);
          try {
            if (onLoginWithGoogleProfile) {
              await onLoginWithGoogleProfile(profile);
            }
          } catch (err: any) {
            setLoginError(err.message || 'Lỗi kiểm tra quyền Quản trị viên.');
          } finally {
            setIsLoggingIn(false);
          }
        },
        (err) => {
          setLoginError(err.message || 'Lỗi khởi chạy Google Sign-In.');
        }
      );

      return () => {
        cleanup?.();
      };
    }
  }, [currentRole, googleClientId, onLoginWithGoogleProfile]);

  const handleTriggerGoogleOAuth = async () => {
    setLoginError(null);
    setShowPopupHelp(false);
    setIsLoggingIn(true);
    try {
      await onLoginWithGoogleOAuth();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('POPUP_BLOCKED') || msg.includes('popup') || msg.includes('Popup')) {
        setShowPopupHelp(true);
        setLoginError(
          'Trình duyệt đang chặn cửa sổ đăng nhập Google. Vui lòng làm theo hướng dẫn mở popup bên dưới hoặc sử dụng nút Đăng nhập chính thức từ Google.'
        );
      } else {
        setLoginError(msg || 'Lỗi đăng nhập với tài khoản Google.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleConfirmResetDefaults = async () => {
    if (!onResetDefaultAdmins) return;
    setIsResetting(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    try {
      await onResetDefaultAdmins();
      setAdminActionSuccess('Đã khôi phục danh sách 8 Quản trị viên ban đầu lên Cloud Firestore thành công!');
      setShowResetModal(false);
      setResetAcknowledged(false);
    } catch (err: any) {
      setAdminActionError(err.message || 'Lỗi khôi phục Admin trên Cloud Firestore');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveClientId = () => {
    if (!googleClientIdInput.trim()) {
      setLoginError('Vui lòng nhập Google Client ID.');
      return;
    }
    if (onSaveGoogleClientId) {
      onSaveGoogleClientId(googleClientIdInput.trim());
    }
    setShowGoogleConfig(false);
    setLoginError(null);
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !onAddAdminUser) return;
    setIsAddingAdmin(true);
    setAdminActionError(null);
    setAdminActionSuccess(null);
    try {
      await onAddAdminUser(newAdminEmail.trim(), newAdminName.trim());
      setAdminActionSuccess(`Đã cấp quyền Quản trị viên cho "${newAdminEmail.trim()}" thành công trên Cloud Firestore!`);
      setNewAdminEmail('');
      setNewAdminName('');
    } catch (err: any) {
      setAdminActionError(err.message || 'Lỗi khi cấp quyền Admin trên Cloud Firestore');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdminClick = async (email: string) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn thu hồi quyền Admin của "${email}"? Tài khoản này sẽ chuyển sang vai trò Người dùng (User - Đã thu hồi) và ngay lập tức bị tước mọi quyền quản trị trên hệ thống.`
      )
    ) {
      await handleRoleChange(email, 'user');
    }
  };

  const handleRoleChange = async (email: string, newRole: 'admin' | 'user') => {
    setAdminActionError(null);
    setAdminActionSuccess(null);
    setLoadingEmails((prev) => ({ ...prev, [email]: true }));
    try {
      if (onUpdateAdminRole) {
        await onUpdateAdminRole(email, newRole);
      } else if (newRole === 'user' && onRemoveAdminUser) {
        await onRemoveAdminUser(email);
      }
      setAdminActionSuccess(
        `Đã đổi quyền của "${email}" thành "${newRole === 'admin' ? 'Quản trị viên (Admin)' : 'Người dùng (User - Đã thu hồi)'}" trên Cloud Firestore!`
      );
    } catch (err: any) {
      setAdminActionError(err.message || 'Lỗi khi cập nhật vai trò trên Cloud Firestore');
    } finally {
      setLoadingEmails((prev) => ({ ...prev, [email]: false }));
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
            Quyền Người dùng (truy cập webapp đào tạo) & Quyền Quản trị viên (quản lý phân quyền, thêm sửa xóa tiện ích)
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

      {/* ========================================================================= */}
      {/* 1. GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP ADMIN THÀNH CÔNG (FULL DASHBOARD)           */}
      {/* ========================================================================= */}
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
                  Tài khoản Google: <span className="font-semibold underline">{currentAdminUser?.email}</span> • Đã xác thực qua Google OAuth 2.0
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
            {/* TAB 1: PHÂN QUYỀN ADMIN - CHỈ HIỂN THỊ DUY NHẤT CHO 2 SUPER ADMIN */}
            {isSuperAdmin && (
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
                <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[10px] font-black rounded-md">
                  SUPER
                </span>
              </button>
            )}

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

          {/* NỘI DUNG TAB 1: PHÂN QUYỀN ADMIN - CHỈ DUY NHẤT 2 SUPER ADMIN MỚI THẤY & THAO TÁC */}
          {adminTab === 'admins' && isSuperAdmin && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-lg">
                        Quản Lý Phân Quyền Quản Trị Viên (Khu Vực Super Admin)
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black uppercase">
                        Super Admin Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chỉ 2 Super Admin khởi tạo (<span className="font-mono text-slate-700 font-semibold">datpt60@fpt.edu.vn</span> & <span className="font-mono text-slate-700 font-semibold">phantiendat221295@gmail.com</span>) mới có quyền cấp hoặc thu hồi quyền Admin.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Đồng bộ Cloud Firestore
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

              {/* Form Thêm Admin Mới */}
              {onAddAdminUser && (
                <form
                  onSubmit={handleAddAdminSubmit}
                  className="p-5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-2xl border border-blue-100 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      Cấp Quyền Admin Mới Cho Email Google
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Email Google của Quản trị viên <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="ví dụ: giangvien@fpt.edu.vn hoặc gmail..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Họ và Tên Quản trị viên
                      </label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="ví dụ: Nguyễn Văn A"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        disabled={isAddingAdmin || !newAdminEmail.trim()}
                        className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        <Plus size={16} />
                        <span>{isAddingAdmin ? 'Đang thêm...' : 'Cấp Quyền Admin'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Bảng Danh Sách Admin Được Quản Lý */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                      Danh sách Quản trị viên hiện hành ({adminUsers.length} tài khoản)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Chỉ những người này mới có thể đăng nhập qua Google OAuth 2.0
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onResetDefaultAdmins && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetAcknowledged(false);
                          setShowResetModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer"
                        title="Khôi phục lại danh sách 8 Quản trị viên mặc định của hệ thống"
                      >
                        <RotateCcw size={13} />
                        <span>Khôi phục 8 Admin ban đầu</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-3 px-4">Tài khoản Quản trị</th>
                        <th className="py-3 px-4">Trạng thái & Quyền hạn</th>
                        <th className="py-3 px-4">Thời gian cấp</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {adminUsers.map((admin) => {
                        const isSuper =
                          admin.isSuperAdmin ||
                          SYSTEM_SUPER_ADMINS.includes(admin.email.toLowerCase().trim());
                        const isRevoked = admin.role === 'user' || admin.status === 'revoked';
                        const isLoading = Boolean(loadingEmails[admin.email]);

                        return (
                          <tr key={admin.email} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                                    isSuper
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : isRevoked
                                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {admin.name ? admin.name.charAt(0).toUpperCase() : 'A'}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className={isRevoked ? 'text-slate-500 line-through' : ''}>
                                      {admin.name || admin.email}
                                    </span>
                                    {isSuper && (
                                      <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-md">
                                        SUPER
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-mono">
                                      {admin.email}
                                    </span>
                                    {admin.uid && (
                                      <span className="text-[10px] text-slate-400 font-mono" title={`UID: ${admin.uid}`}>
                                        • UID: {admin.uid.slice(0, 6)}...
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {isSuper ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Super Admin (Toàn quyền)
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <select
                                    disabled={isLoading}
                                    value={isRevoked ? 'user' : 'admin'}
                                    onChange={(e) => handleRoleChange(admin.email, e.target.value as 'admin' | 'user')}
                                    className={`text-xs font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer transition-colors ${
                                      !isRevoked
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    <option value="admin">Quản trị viên (Admin)</option>
                                    <option value="user">Người dùng (Đã thu hồi)</option>
                                  </select>
                                  {!isRevoked ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      Revoked
                                    </span>
                                  )}
                                </div>
                              )}
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
                              {isSuper ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                                  Super Admin (Bảo vệ)
                                </span>
                              ) : isLoading ? (
                                <span className="text-xs text-slate-400 font-semibold animate-pulse">
                                  Đang lưu Firestore...
                                </span>
                              ) : isRevoked ? (
                                <button
                                  type="button"
                                  onClick={() => handleRoleChange(admin.email, 'admin')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs border border-emerald-200 transition-colors cursor-pointer"
                                  title="Cấp lại quyền quản trị cho tài khoản này"
                                >
                                  <Check size={13} />
                                  <span>Cấp lại quyền Admin</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdminClick(admin.email)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors cursor-pointer"
                                  title="Thu hồi quyền quản trị của tài khoản này (chuyển sang role: user)"
                                >
                                  <UserX size={13} />
                                  <span>Thu hồi quyền</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Xác nhận Khôi phục 8 Admin Ban Đầu */}
              {showResetModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <ShieldAlert size={26} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-lg">
                            Cảnh Báo: Khôi Phục 8 Admin Ban Đầu
                          </h4>
                          <span className="text-xs text-rose-600 font-semibold">
                            Thao tác ghi đè trên Cloud Firestore
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowResetModal(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2 leading-relaxed">
                      <p className="font-bold text-amber-950">
                        ⚠️ Bạn đang chuẩn bị khôi phục quyền Admin cho 8 tài khoản mẫu ban đầu:
                      </p>
                      <ul className="list-disc pl-5 space-y-0.5 text-slate-700 font-mono text-[11px]">
                        <li>datpt60@fpt.edu.vn (Super Admin)</li>
                        <li>phantiendat221295@gmail.com (Super Admin)</li>
                        <li>thuanl2@fpt.edu.vn (Admin)</li>
                        <li>vylnu@fpt.edu.vn (Admin)</li>
                        <li>loiqt@fpt.edu.vn (Admin)</li>
                        <li>duocdty2@fpt.edu.vn (Admin)</li>
                        <li>dienvnn@fpt.edu.vn (Admin)</li>
                        <li>thainh44@fpt.edu.vn (Admin)</li>
                      </ul>
                      <p className="text-amber-800 pt-1">
                        <strong>Lưu ý quan trọng:</strong> Bất kỳ tài khoản nào trong số này đã bị thu hồi trước đây sẽ được cấp lại quyền Quản trị viên (status: active).
                      </p>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={resetAcknowledged}
                        onChange={(e) => setResetAcknowledged(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        Tôi là Super Admin, tôi hiểu rõ thao tác này và xác nhận khôi phục lại quyền Admin cho 8 tài khoản trên.
                      </span>
                    </label>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        disabled={isResetting}
                        onClick={() => setShowResetModal(false)}
                        className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="button"
                        disabled={!resetAcknowledged || isResetting}
                        onClick={handleConfirmResetDefaults}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-40"
                      >
                        <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
                        <span>{isResetting ? 'Đang ghi Cloud Firestore...' : 'Xác Nhận Khôi Phục'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security info box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert size={15} className="text-amber-600" />
                  <span>Cơ chế bảo vệ & Thu hồi quyền tự động 30 giây</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>
                    <strong>Bảo mật danh sách:</strong> Danh sách Quản trị viên chỉ hiển thị cho người đã đăng nhập Google thành công, hoàn toàn ẩn với người dùng ngoài.
                  </li>
                  <li>
                    <strong>Xác thực OAuth 2.0:</strong> Người dùng bắt buộc phải đăng nhập bằng tài khoản Google chính chủ, hệ thống không cho phép nhập tay hay giả mạo.
                  </li>
                  <li>
                    <strong>Thu hồi tự động:</strong> Khi bạn thu hồi quyền của bất kỳ ai, hệ thống tự động tước quyền Admin của họ trong vòng tối đa 30 giây.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* NỘI DUNG TAB 2: QUẢN LÝ TIỆN ÍCH */}
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

          {/* NỘI DUNG TAB 3: HỘP THƯ YÊU CẦU HỖ TRỢ */}
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

          {/* NỘI DUNG TAB 4: TÙY CHỈNH LOGO & PHÂN HIỆU */}
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
        /* ========================================================================= */
        /* 2. GIAO DIỆN XÁC THỰC BẢO MẬT: CHỈ ĐĂNG NHẬP GOOGLE OAUTH 2.0             */
        /* (HOÀN TOÀN ẨN DANH SÁCH ADMIN & KHÔNG CÓ BẤT KỲ CƠ CHẾ BYPASS NÀO)        */
        /* ========================================================================= */
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Banner Bảo Mật */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white rounded-3xl p-7 shadow-xl relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/20 text-[11px] font-extrabold uppercase tracking-wider text-blue-100">
                  Khu Vực Hạn Chế
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-[11px] font-bold border border-emerald-400/30">
                  Google OAuth 2.0 Verified
                </span>
              </div>
              <h3 className="font-extrabold text-2xl tracking-tight text-white">
                Cổng Xác Thực Quản Trị Viên (Admin)
              </h3>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Hệ thống yêu cầu xác thực danh tính chính thức thông qua tài khoản Google. Danh sách Quản trị viên được bảo mật tuyệt đối trong mã nguồn và máy chủ.
              </p>
            </div>
          </div>

          {/* Card Đăng Nhập Chính */}
          <div className="bg-white rounded-3xl p-7 sm:p-9 border border-slate-200 shadow-md space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">
                  Đăng Nhập Với Tài Khoản Google
                </h4>
                <p className="text-xs text-slate-500">
                  Sử dụng tài khoản Google (@fpt.edu.vn hoặc Gmail đã được cấp quyền quản trị)
                </p>
              </div>
            </div>

            {/* Thông báo lỗi nếu có */}
            {loginError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-700 space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2.5 font-bold">
                  <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              </div>
            )}

            {/* Hướng dẫn khi popup bị chặn */}
            {showPopupHelp && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldAlert size={16} className="text-amber-600" />
                  <span>Cách xử lý khi trình duyệt chặn cửa sổ Google:</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-amber-800">
                  <li>Nhìn lên góc phải thanh địa chỉ URL của trình duyệt (icon cửa sổ có dấu chéo đỏ).</li>
                  <li>Bấm vào biểu tượng đó và chọn <strong>"Luôn cho phép cửa sổ bật lên"</strong>.</li>
                  <li>Hoặc bấm trực tiếp vào nút <strong>"Đăng nhập chính thức từ Google"</strong> ngay dưới đây.</li>
                </ol>
              </div>
            )}

            {/* NÚT GOOGLE SIGN-IN CHÍNH THỨC (Google Identity Services renderButton) */}
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Xác Thực Chính Thức Bằng Google OAuth 2.0
                </label>

                {/* Container cho nút Google do chính Google SDK kết xuất (không bị popup blocker) */}
                <div className="flex justify-center items-center py-2 min-h-[44px]">
                  <div ref={googleBtnContainerRef} id="google-login-btn-container" className="flex justify-center" />
                </div>
              </div>

              {/* Nút bấm trực tiếp thứ hai (Dành cho kích hoạt ngay lập tức) */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isLoggingIn}
                  onClick={handleTriggerGoogleOAuth}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 bg-white text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                    {isLoggingIn ? 'Đang kết nối tới Google...' : 'Đăng nhập Google OAuth 2.0'}
                  </span>
                </button>
              </div>
            </div>

            {/* Thông tin cấu hình OAuth 2.0 Client ID */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-mono text-[11px] truncate max-w-xs text-slate-400">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>OAuth Client: {DEFAULT_GOOGLE_CLIENT_ID.slice(0, 15)}...apps</span>
              </span>

              <button
                type="button"
                onClick={() => setShowGoogleConfig(!showGoogleConfig)}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer text-xs flex items-center gap-1"
              >
                <Settings size={13} />
                <span>Cấu hình Client ID</span>
              </button>
            </div>

            {/* Panel cấu hình Google Client ID (tùy chọn) */}
            {showGoogleConfig && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div className="text-xs font-bold text-slate-700">
                  Tùy chỉnh Google Cloud OAuth 2.0 Client ID:
                </div>
                <input
                  type="text"
                  value={googleClientIdInput}
                  onChange={(e) => setGoogleClientIdInput(e.target.value)}
                  placeholder="Nhập Google OAuth 2.0 Client ID..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleClientIdInput(DEFAULT_GOOGLE_CLIENT_ID);
                      if (onSaveGoogleClientId) onSaveGoogleClientId(DEFAULT_GOOGLE_CLIENT_ID);
                      setShowGoogleConfig(false);
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Dùng mặc định
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveClientId}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Lưu Client ID
                  </button>
                </div>
              </div>
            )}

            {/* Nút quay lại trang chủ */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onGoToHome}
                className="text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer transition-colors"
              >
                ← Quay lại Trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
