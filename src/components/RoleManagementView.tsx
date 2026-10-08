import React, { useState } from 'react';
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
  Unlock,
  Download,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Layers,
  LogOut,
  LogIn,
  KeyRound,
  AlertCircle,
  Copy,
  Check,
  HelpCircle,
  FileSpreadsheet,
  Mail,
  Inbox,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface RoleManagementViewProps {
  currentRole: 'user' | 'admin';
  currentAdminUser: AdminAccount | null;
  onLoginAdmin: (email: string, pin: string) => boolean | Promise<boolean>;
  onLoginWithGoogle: (googleEmail: string) => boolean | Promise<boolean>;
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
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  currentRole,
  currentAdminUser,
  onLoginAdmin,
  onLoginWithGoogle,
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
  onUpdateTicketStatus
}) => {
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('Datpt70@fpt.edu.vn');

  // Admin view tab: 'apps' or 'tickets'
  const [adminTab, setAdminTab] = useState<'apps' | 'tickets'>('apps');

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
          'Email hoặc mật khẩu không chính xác! Hãy kiểm tra lại thông tin trong Tab PhanQuyen trên Google Sheets.'
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

  const handleGoogleLoginSubmit = async (email: string) => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const success = await onLoginWithGoogle(email.trim());
      if (!success) {
        setLoginError(`Tài khoản Google "${email}" chưa được cấp quyền Admin trong tab PhanQuyen trên Google Sheets!`);
      } else {
        setShowGooglePrompt(false);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi đăng nhập Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const exportCsv = () => {
    const csvContent =
      "Tên,Mô tả,Link,Nhóm,Icon,Tag,Màu sắc\n" +
      apps
        .map(
          (a) =>
            `"${a.title.replace(/"/g, '""')}","${a.description.replace(/"/g, '""')}","${a.url}","${a.category}","${a.icon}","${a.tag || 'webapp'}","${a.colorTheme || 'blue'}"`
        )
        .join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fpt_portal_apps_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const newTicketsCount = tickets.filter((t) => t.status === 'new').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          Hệ Thống Phân Quyền & Quản Trị Hệ Thống
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hệ thống bảo mật danh sách Quản trị viên qua <strong>Google Sheets</strong> và tự động đồng bộ trên đám mây.
        </p>
      </div>

      {/* VIEW KHI ĐANG Ở QUYỀN ADMIN */}
      {currentRole === 'admin' ? (
        <div className="space-y-6">
          {/* Admin Banner with User Info and Logout */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                <ShieldCheck size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-white">
                    Xin chào: {currentAdminUser?.name || 'Quản trị viên'}
                  </h3>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Tài khoản: {currentAdminUser?.email} • Mọi thay đổi bạn sửa tại đây hoặc trong Google Sheets sẽ <strong>tự động lưu vĩnh viễn</strong> cho tất cả máy tính!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={onGoToHome}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Về Trang chủ
              </button>
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <LogOut size={15} />
                <span>Đăng xuất Admin</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation: Tiện ích Webapps VS Hộp thư Yêu cầu Hỗ trợ */}
          <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
            <button
              onClick={() => setAdminTab('apps')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                adminTab === 'apps'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Quản lý Tiện ích Webapps ({apps.length})</span>
            </button>

            <button
              onClick={() => setAdminTab('tickets')}
              className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 relative ${
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
                    Mọi chỉnh sửa tại đây đều tự động lưu lên Cloud Database, các máy khác vào web sẽ thấy ngay!
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

                  <button
                    type="button"
                    onClick={exportCsv}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={15} />
                    <span>Xuất CSV</span>
                  </button>

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
                    <option key={c} value={c}>{c}</option>
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
                      <th className="py-3 px-4">Thẻ</th>
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
                          <span className="text-[11px] uppercase font-bold text-slate-500">
                            {app.tag || 'webapp'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditApp(app)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Edit3 size={13} />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa "${app.title}"?`)) {
                                  onDeleteApp(app.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
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

          {/* TAB 2: HỘP THƯ YÊU CẦU HỖ TRỢ (TICKETS INBOX) */}
          {adminTab === 'tickets' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
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

                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Tổng: {tickets.length} yêu cầu
                </span>
              </div>

              {tickets.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <div key={t.id} className="py-4 space-y-2 hover:bg-slate-50/50 p-3 rounded-2xl transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              t.status === 'new'
                                ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {t.status === 'new' ? 'Yêu cầu mới' : 'Đã xử lý'}
                          </span>
                          <span className="font-bold text-slate-800 text-sm">{t.name}</span>
                          <span className="text-xs text-blue-600 font-mono">({t.emailOrCode})</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={13} />
                          <span>{t.createdAt}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-700 space-y-1">
                        <div className="font-semibold text-slate-800 text-xs text-blue-800">
                          Vấn đề: {t.category}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{t.content}</p>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <a
                          href={`mailto:${t.emailOrCode}?subject=${encodeURIComponent(`[Phản hồi hỗ trợ FPT Polyschool] ${t.category}`)}&body=${encodeURIComponent(`Chào bạn ${t.name},\n\nVề yêu cầu của bạn: "${t.content}"\n\nPhòng Đào tạo xin thông báo phản hồi như sau:\n\n`)}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Mail size={13} />
                          <span>Gửi email phản hồi</span>
                        </a>

                        {t.status === 'new' ? (
                          <button
                            type="button"
                            onClick={() => onUpdateTicketStatus(t.id, 'resolved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Check size={13} />
                            <span>Đánh dấu đã xử lý</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onUpdateTicketStatus(t.id, 'new')}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer"
                          >
                            Đánh dấu chưa xử lý
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Inbox size={40} className="mx-auto text-slate-300" />
                  <p className="text-sm font-medium">Chưa có yêu cầu hỗ trợ nào được gửi đến.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VIEW KHI ĐANG Ở QUYỀN NGƯỜI DÙNG: FORM ĐĂNG NHẬP ADMIN & GOOGLE SIGN-IN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Giới thiệu quyền người dùng */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-7 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <User size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 text-lg">Quyền Người Dùng (Chỉ Xem)</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                    Đang áp dụng
                  </span>
                </div>
                <p className="text-xs text-slate-500">Mặc định cho Sinh viên & Giảng viên trên toàn hệ thống</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mọi người dùng khi vào trang web đều ở quyền này để đảm bảo an toàn tuyệt đối, không ai có thể sửa đổi hay xóa nhầm dữ liệu của trường:
            </p>

            <ul className="text-xs sm:text-[13px] text-slate-600 space-y-2 list-disc pl-5">
              <li>Tra cứu webapp và tin tức đào tạo tức thì</li>
              <li>Bấm nút truy cập trực tiếp đến các hệ thống con</li>
              <li>Tự động nhận bản cập nhật mới nhất từ Google Sheets</li>
            </ul>

            <div className="pt-2">
              <button
                type="button"
                onClick={onGoToHome}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Quay lại Trang chủ xem các tiện ích
              </button>
            </div>
          </div>

          {/* Cột phải: Form Đăng nhập Admin (Bao gồm Google Sign-In) */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-7 border-2 border-emerald-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Đăng Nhập Quản Trị Viên (Admin)</h3>
                  <p className="text-xs text-slate-500">Xác thực tài khoản đã phân quyền trong Google Sheets</p>
                </div>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* CHỨC NĂNG 5: ĐĂNG NHẬP BẰNG TÀI KHOẢN GOOGLE */}
            <div>
              <button
                type="button"
                onClick={() => setShowGooglePrompt(!showGooglePrompt)}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-2xs cursor-pointer"
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
                <span>Đăng nhập nhanh bằng tài khoản Google</span>
              </button>

              {showGooglePrompt && (
                <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 animate-in fade-in">
                  <p className="text-xs text-blue-900 font-semibold">
                    Xác nhận địa chỉ Google / FPT Mail của bạn:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      placeholder="Datpt70@fpt.edu.vn"
                      className="flex-1 bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleGoogleLoginSubmit(customGoogleEmail)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
                    >
                      Xác nhận
                    </button>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Hệ thống sẽ kiểm tra xem email Google này có trong danh sách phân quyền Admin của trường hay không.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold uppercase">Hoặc đăng nhập mật khẩu</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* FORM ĐĂNG NHẬP MẬT KHẨU */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="Datpt70@fpt.edu.vn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
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

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p>
                <strong>Tài khoản Quản trị viên trong Google Sheets:</strong> <code>Datpt70@fpt.edu.vn</code> (Mật khẩu: <code>123</code>).
              </p>
              <p>
                Tài khoản mặc định cũ đã bị vô hiệu hóa vì hệ thống đã chuyển sang dùng danh sách bảo mật của bạn.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
