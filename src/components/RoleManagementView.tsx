import React, { useState } from 'react';
import { WebAppItem } from '../types';
import {
  ShieldCheck,
  User,
  Edit3,
  Trash2,
  Plus,
  ExternalLink,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  Download,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  Layers
} from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface RoleManagementViewProps {
  currentRole: 'user' | 'admin';
  onChangeRole: (role: 'user' | 'admin') => void;
  apps: WebAppItem[];
  onAddApp: () => void;
  onEditApp: (app: WebAppItem) => void;
  onDeleteApp: (appId: string) => void;
  onResetToDefault: () => void;
  onGoToHome: () => void;
}

export const RoleManagementView: React.FC<RoleManagementViewProps> = ({
  currentRole,
  onChangeRole,
  apps,
  onAddApp,
  onEditApp,
  onDeleteApp,
  onResetToDefault,
  onGoToHome
}) => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* SECTION 1: ROLE SWITCHER CARDS */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Quản Lý Phân Quyền Hệ Thống
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chuyển đổi giữa 2 chế độ quyền: <strong>Người dùng</strong> (chỉ xem & truy cập) hoặc <strong>Quản trị viên</strong> (toàn quyền chỉnh sửa tên, link, danh mục).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Role Card 1: Người dùng */}
          <div
            onClick={() => onChangeRole('user')}
            className={`relative rounded-3xl p-6 border-2 transition-all cursor-pointer ${
              currentRole === 'user'
                ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    currentRole === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <User size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-800">
                      Quyền Người dùng (User)
                    </h3>
                    {currentRole === 'user' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                        Đang kích hoạt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Dành cho Giảng viên & Sinh viên</p>
                </div>
              </div>

              {currentRole === 'user' ? (
                <CheckCircle2 size={24} className="text-blue-600 shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0" />
              )}
            </div>

            <ul className="mt-4 pt-4 border-t border-slate-200/80 text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Tra cứu và tìm kiếm thông tin nhanh chóng</li>
              <li>Xem danh sách phân loại webapp và thông báo mới</li>
              <li>Nhấp để mở và truy cập các tiện ích trực tiếp</li>
              <li className="text-slate-400">Không có quyền sửa đổi hoặc xóa link tiện ích</li>
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeRole('user');
              }}
              className={`mt-4 w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentRole === 'user'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {currentRole === 'user' ? 'Đang dùng quyền Người dùng' : 'Chọn quyền Người dùng'}
            </button>
          </div>

          {/* Role Card 2: Quản trị viên (Admin) */}
          <div
            onClick={() => onChangeRole('admin')}
            className={`relative rounded-3xl p-6 border-2 transition-all cursor-pointer ${
              currentRole === 'admin'
                ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    currentRole === 'admin'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-800">
                      Quyền Quản trị viên (Admin)
                    </h3>
                    {currentRole === 'admin' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                        Đang kích hoạt
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Dành cho Cán bộ & Quản trị hệ thống</p>
                </div>
              </div>

              {currentRole === 'admin' ? (
                <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 shrink-0" />
              )}
            </div>

            <ul className="mt-4 pt-4 border-t border-slate-200/80 text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li><strong>Chỉnh sửa tên tiện ích & link truy cập (URL)</strong> bất kỳ lúc nào</li>
              <li><strong>Thêm tiện ích mới</strong> vào các nhóm danh mục</li>
              <li><strong>Xóa hoặc thay đổi vị trí</strong> các tiện ích</li>
              <li>Tự động lưu vào bộ nhớ trình duyệt & cho phép tải file CSV</li>
            </ul>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeRole('admin');
              }}
              className={`mt-4 w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {currentRole === 'admin' ? 'Đang dùng quyền Quản trị viên' : 'Kích hoạt quyền Admin'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ADMIN MANAGEMENT TABLE (Khi ở quyền Admin) */}
      {currentRole === 'admin' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          {/* Table Header & Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-slate-800 text-lg">
                  Bảng Quản Lý Tiện Ích Webapp ({apps.length} ứng dụng)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấp vào nút <Edit3 size={12} className="inline text-blue-600" /> bên cạnh mỗi dòng để đổi tên và sửa link truy cập.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onAddApp}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus size={16} />
                <span>Thêm tiện ích mới</span>
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

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Hiển thị {filteredApps.length} / {apps.length} ứng dụng
            </span>
            <button
              type="button"
              onClick={onGoToHome}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              &larr; Xem giao diện Trang chủ người dùng
            </button>
          </div>
        </div>
      ) : (
        /* Quyền Người dùng (User view info) */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <User size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            Bạn đang ở chế độ Quyền Người Dùng (Chỉ Xem)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Ở quyền này, các tiện ích hiển thị ở chế độ người dùng thông thường, tối ưu tốc độ và an toàn không thể bị chỉnh sửa nhầm. Để có quyền sửa tên và link của các tiện ích, hãy bấm nút <strong>"Kích hoạt quyền Admin"</strong> ở thẻ phía trên.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGoToHome}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Quay lại Trang chủ
            </button>
            <button
              type="button"
              onClick={() => onChangeRole('admin')}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck size={16} />
              <span>Chuyển sang Quản trị viên (Admin)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
