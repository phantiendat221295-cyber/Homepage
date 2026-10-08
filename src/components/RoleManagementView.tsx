import React, { useState } from 'react';
import { WebAppItem, AdminAccount } from '../types';
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
  FileSpreadsheet
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface RoleManagementViewProps {
  currentRole: 'user' | 'admin';
  currentAdminUser: AdminAccount | null;
  onLoginAdmin: (email: string, pin: string) => boolean | Promise<boolean>;
  onLogoutAdmin: () => void;
  apps: WebAppItem[];
  onAddApp: () => void;
  onEditApp: (app: WebAppItem) => void;
  onDeleteApp: (appId: string) => void;
  onResetToDefault: () => void;
  onGoToHome: () => void;
  hasPermissionsSheet: boolean;
  onOpenSheetConfig: () => void;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  currentRole,
  currentAdminUser,
  onLoginAdmin,
  onLogoutAdmin,
  apps,
  onAddApp,
  onEditApp,
  onDeleteApp,
  onResetToDefault,
  onGoToHome,
  hasPermissionsSheet,
  onOpenSheetConfig
}) => {
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin table state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [copiedSheetData, setCopiedSheetData] = useState(false);

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
        setLoginError('Email hoặc mật khẩu không chính xác, hoặc tài khoản chưa được cấp quyền Admin trong Google Sheets.');
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

  const copyAppsForGoogleSheet = () => {
    const tsvContent =
      "Tên\tMô tả\tLink\tNhóm\tIcon\tTag\tMàu sắc\n" +
      apps
        .map(
          (a) =>
            `${a.title}\t${a.description}\t${a.url}\t${a.category}\t${a.icon}\t${a.tag || 'webapp'}\t${a.colorTheme || 'blue'}`
        )
        .join('\n');

    navigator.clipboard.writeText(tsvContent);
    setCopiedSheetData(true);
    setTimeout(() => setCopiedSheetData(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          Hệ Thống Phân Quyền & Quản Lý Tiện Ích
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hệ thống được bảo mật thông qua danh sách phân quyền trong <strong>Google Sheets</strong> (Tab 'PhanQuyen').
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
                  Tài khoản: {currentAdminUser?.email || 'admin'} • Bạn có toàn quyền sửa tên, đổi link truy cập và thêm/xóa tiện ích.
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

          {/* HƯỚNG DẪN ĐỒNG BỘ CHO VERCEL */}
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-xs sm:text-sm text-blue-900 space-y-2.5">
            <div className="font-bold flex items-center gap-2 text-blue-950">
              <HelpCircle size={18} className="text-blue-600 shrink-0" />
              <span>Làm sao để người khác truy cập web Vercel (homepage-daotao.vercel.app) thấy các thay đổi của bạn?</span>
            </div>
            <p className="text-blue-800 leading-relaxed">
              Khi người khác truy cập web, họ sẽ luôn đọc dữ liệu trực tiếp từ <strong>Google Sheets</strong>. Do đó, bạn hãy nhập các tiện ích vào file Google Sheets của bạn. Bạn cũng có thể bấm nút bên dưới để <strong>Sao chép toàn bộ dữ liệu</strong> và dán thẳng vào Google Sheets:
            </p>
            <div className="pt-1 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={copyAppsForGoogleSheet}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                {copiedSheetData ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                <span>{copiedSheetData ? 'Đã sao chép! Bạn chỉ cần mở Google Sheet và bấm Ctrl+V để dán' : 'Sao chép dữ liệu để dán vào Google Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenSheetConfig}
                className="px-3.5 py-2 rounded-xl bg-white border border-blue-300 text-blue-800 hover:bg-blue-50 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-blue-600" />
                <span>Kiểm tra liên kết Google Sheets</span>
              </button>
            </div>
          </div>

          {/* ADMIN MANAGEMENT TABLE */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-bold text-slate-800 text-lg">
                    Danh Sách Tiện Ích Webapp ({apps.length} ứng dụng)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm <Edit3 size={12} className="inline text-blue-600" /> để đổi tên hoặc link truy cập tiện ích.
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
                  onClick={() => {
                    if (confirm('Khôi phục danh sách ứng dụng về mặc định ban đầu của FPT Polyschool?')) {
                      onResetToDefault();
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Khôi phục gốc</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Bar */}
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
        </div>
      ) : (
        /* VIEW KHI ĐANG Ở QUYỀN NGƯỜI DÙNG: HIỂN THỊ FORM ĐĂNG NHẬP ADMIN */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Thông tin quyền người dùng */}
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
                <p className="text-xs text-slate-500">Dành cho Giảng viên, Sinh viên và khách truy cập</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Mọi người dùng khi truy cập vào link website <code>https://homepage-daotao.vercel.app/</code> đều được mặc định ở quyền này để đảm bảo dữ liệu luôn an toàn, không bị chỉnh sửa nhầm:
            </p>

            <ul className="text-xs sm:text-[13px] text-slate-600 space-y-2 list-disc pl-5">
              <li>Tra cứu danh mục webapp và tin tức đào tạo mới nhất</li>
              <li>Nhấp vào nút mũi tên trên từng thẻ để chuyển thẳng tới webapp</li>
              <li>Tự động nhận dữ liệu mới mỗi khi Google Sheets được cập nhật</li>
              <li className="text-slate-400 font-medium">Không có quyền sửa đổi hay xóa link</li>
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

          {/* Cột phải: Form Đăng nhập Admin bảo mật theo Google Sheets */}
          <div className="lg:col-span-6 bg-white rounded-3xl p-7 border-2 border-emerald-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Đăng Nhập Quản Trị Viên (Admin)</h3>
                <p className="text-xs text-slate-500">
                  {hasPermissionsSheet
                    ? 'Xác thực tài khoản từ Tab PhanQuyen trên Google Sheets'
                    : 'Nhập thông tin tài khoản quản trị để mở khóa quyền chỉnh sửa'}
                </p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email hoặc Tên đăng nhập Admin <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@fe.edu.vn hoặc admin"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu hoặc Mã PIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Nhập mật khẩu / PIN..."
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
                <strong>Tài khoản quản trị mặc định:</strong> <code>admin@fe.edu.vn</code> (Mật khẩu: <code>admin123</code>) hoặc <code>admin</code> (Mật khẩu: <code>123456</code>).
              </p>
              <p>
                Bạn có thể tạo tab <strong>'PhanQuyen'</strong> trong Google Sheets để tự chỉ định danh sách email & mật khẩu riêng!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
