import React, { useState } from 'react';
import { X, ExternalLink, Check, RefreshCw, FileSpreadsheet, AlertCircle, Copy, Download, KeyRound, ShieldAlert, Lock } from 'lucide-react';
import { GoogleSheetsConfig } from '../types';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../services/googleAuthService';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetsConfig;
  onSaveConfig: (config: GoogleSheetsConfig) => void;
  onResetToDefault: () => void;
  isSyncing: boolean;
  lastSynced?: string;
  totalApps: number;
  totalNotis: number;
  syncError?: string;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetToDefault,
  isSyncing,
  lastSynced,
  totalApps,
  totalNotis,
  syncError
}) => {
  const [appsUrl, setAppsUrl] = useState(config.appsCsvUrl || '');
  const [notisUrl, setNotisUrl] = useState(config.notificationsCsvUrl || '');
  const [permissionsUrl, setPermissionsUrl] = useState(config.permissionsCsvUrl || '');
  const [gasWebhookUrl, setGasWebhookUrl] = useState(config.gasWebhookUrl || '');
  const [googleClientId, setGoogleClientId] = useState(config.googleClientId || DEFAULT_GOOGLE_CLIENT_ID);
  const [customLogoUrl, setCustomLogoUrl] = useState(config.customLogoUrl || '');
  const [campusName, setCampusName] = useState(config.campusName || 'ĐỒNG NAI');
  const [enableGoogleSheetsSync, setEnableGoogleSheetsSync] = useState(Boolean(config.enableGoogleSheetsSync));

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      ...config,
      appsCsvUrl: appsUrl.trim(),
      notificationsCsvUrl: notisUrl.trim(),
      permissionsCsvUrl: permissionsUrl.trim(),
      gasWebhookUrl: gasWebhookUrl.trim(),
      googleClientId: googleClientId.trim(),
      customLogoUrl: customLogoUrl.trim(),
      campusName: campusName.trim(),
      enableGoogleSheetsSync,
      autoSync: enableGoogleSheetsSync
    });
  };

  const downloadSamplePermissionsCsv = () => {
    const csv =
      "Email,Mật khẩu,Họ tên,Quyền\n" +
      "admin@fpt.edu.vn,matkhau123,Quản trị viên Đào tạo,admin\n" +
      "canbo.daotao@fpt.edu.vn,matkhau456,Cán bộ Đào tạo,admin";
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fpt_portal_phanquyen_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleAppsCsv = () => {
    const csvContent =
      "Tên,Mô tả,Link,Nhóm,Icon,Tag,Màu sắc\n" +
      "Quản lý lớp học,Tra cứu danh sách lớp sĩ số thông tin sinh viên,https://example.com/lop-hoc,Quản lý đào tạo,Users,webapp,blue\n" +
      "Thời khóa biểu,Tra cứu lịch học phân công giảng viên,https://example.com/tkb,Quản lý đào tạo,Calendar,webapp,green\n" +
      "Nợ môn & Học phí,Theo dõi nợ môn trạng thái đóng phí,https://example.com/hocphi,Quản lý đào tạo,FileText,webapp,orange\n" +
      "Báo cáo đào tạo,Thống kê báo cáo dữ liệu tổng hợp,https://example.com/baocao,Quản lý đào tạo,BarChart3,webapp,purple\n" +
      "Quản lý giảng viên,Thông tin giảng viên phân công giảng dạy,https://example.com/giangvien,Hỗ trợ giảng dạy,UserCheck,webapp,pink\n" +
      "Đánh giá & Khảo sát,Khảo sát sinh viên đánh giá giảng dạy,https://example.com/khaosat,Hỗ trợ giảng dạy,ClipboardCheck,webapp,yellow\n" +
      "Tài liệu giảng dạy,Biểu mẫu hướng dẫn tài liệu tham khảo,https://example.com/tailieu,Hỗ trợ giảng dạy,Folder,tailieu,mint\n" +
      "Tốt nghiệp & Chứng chỉ,Quản lý đồ án xét duyệt cấp bằng chứng chỉ,https://example.com/totnghiep,Hỗ trợ giảng dạy,Award,webapp,cyan\n" +
      "Tra cứu sinh viên,Tìm kiếm thông tin sinh viên nhanh,https://example.com/sinhvien,Tiện ích chung,User,webapp,indigo\n" +
      "Tạo QR / Link biểu mẫu,Tạo nhanh link QR code cho các biểu mẫu,https://example.com/qr,Tiện ích chung,QrCode,webapp,cyan\n" +
      "Lưu trữ & Drive,Liên kết tài liệu Google Drive,https://drive.google.com,Tiện ích chung,Cloud,tailieu,pink\n" +
      "Công cụ hỗ trợ,Các tiện ích khác phục vụ công việc,https://example.com/congcu,Tiện ích chung,Settings,huongdan,slate";

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fpt_portal_apps_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Cài đặt kết nối Google Sheets</h3>
              <p className="text-xs text-slate-500">Đồng bộ tự động danh sách Webapp, Thông báo & Phân quyền Admin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Error Banner if sync failed */}
          {syncError && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 text-xs sm:text-sm text-rose-800 space-y-2">
              <div className="font-bold flex items-center gap-2 text-rose-900">
                <ShieldAlert size={18} className="text-rose-600 shrink-0" />
                <span>Phát hiện lỗi đồng bộ Google Sheets!</span>
              </div>
              <p className="leading-relaxed">
                {syncError}
              </p>
              <div className="bg-white p-3 rounded-xl border border-rose-200 text-xs text-slate-700 space-y-1">
                <strong>Cách sửa nhanh:</strong>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Mở file Google Sheets &rarr; bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải.</li>
                  <li>Đổi mục "Quyền truy cập chung" thành: <strong>Bất kỳ ai có đường liên kết (Anyone with link)</strong> &rarr; chọn <strong>Người xem</strong>.</li>
                  <li>Vào <strong>Tệp &rarr; Chia sẻ &rarr; Xuất bản lên web</strong> &rarr; Chọn định dạng <strong>CSV</strong> (bỏ chọn ô "Yêu cầu đăng nhập miền" nếu có).</li>
                </ol>
              </div>
            </div>
          )}

          {/* Status card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="font-bold text-xs sm:text-sm text-emerald-900">
                  Dữ liệu hiện tại: {totalApps} Webapps • {totalNotis} Thông báo
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-700">
                  {lastSynced ? `Lần cập nhật gần nhất: ${lastSynced}` : 'Đã kết nối Google Cloud Firestore (homepage-35a0f)'}
                </div>
              </div>
            </div>

            <button
              onClick={onResetToDefault}
              className="text-xs bg-white text-emerald-800 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 font-semibold transition-colors cursor-pointer"
            >
              Dữ liệu mặc định
            </button>
          </div>

          {/* LỰA CHỌN: CHẾ ĐỘ HOẠT ĐỘNG (CLOUD FIRESTORE VS GOOGLE SHEETS) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  Chế độ đồng bộ Google Sheets:
                </span>
                <p className="text-[11px] text-slate-500">
                  {enableGoogleSheetsSync
                    ? 'Đang BẬT đồng bộ từ Google Sheets (dữ liệu sẽ được fetch từ link Sheets).'
                    : 'Đang TẮT đồng bộ Google Sheets. Hệ thống chạy 100% trên Cloud Firestore (Khuyên dùng: siêu tốc, tự động lưu vĩnh viễn, không lo lỗi CORS).'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEnableGoogleSheetsSync(!enableGoogleSheetsSync)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enableGoogleSheetsSync ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    enableGoogleSheetsSync ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Cài đặt Logo Tùy Chỉnh & Tên Cơ Sở */}
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5">
              <span>Tùy chỉnh Logo & Tên Phân Hiệu:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Link ảnh Logo tùy chỉnh (URL):
                </label>
                <input
                  type="url"
                  value={customLogoUrl}
                  onChange={(e) => setCustomLogoUrl(e.target.value)}
                  placeholder="https://... (để trống nếu dùng logo gốc)"
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tên phân hiệu (dưới logo):
                </label>
                <input
                  type="text"
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  placeholder="Ví dụ: ĐỒNG NAI"
                  className="w-full bg-white border border-blue-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Input 1: Apps CSV URL */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              1. Link CSV Webapps (Tab 'Apps' hoặc tab đầu tiên) <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={appsUrl}
              onChange={(e) => setAppsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv (hoặc link edit)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Các cột: <span className="font-semibold text-slate-700">Tên, Mô tả, Link, Nhóm, Icon, Tag, Màu sắc</span>
            </p>
          </div>

          {/* Input 2: Notifications CSV URL */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              2. Link CSV Thông báo (Tab 'ThongBao' - Tùy chọn)
            </label>
            <input
              type="url"
              value={notisUrl}
              onChange={(e) => setNotisUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Các cột: <span className="font-semibold text-slate-700">Tiêu đề, Ngày, Nội dung, Link, Màu</span>
            </p>
          </div>

          {/* Input 3: Permissions CSV URL (Phân quyền Admin) */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound size={14} className="text-blue-600" />
              <span>3. Link CSV Phân quyền Admin (Tab 'PhanQuyen' - Tùy chọn)</span>
            </label>
            <input
              type="url"
              value={permissionsUrl}
              onChange={(e) => setPermissionsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Các cột: <span className="font-semibold text-slate-700">Email, Mật khẩu, Họ tên, Quyền</span> (Chỉ tài khoản ghi ở đây mới đăng nhập được Admin)
            </p>
          </div>

          {/* Input 4: Optional Google Apps Script Webhook URL */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>4. Webhook Google Apps Script (Tùy chọn - Ghi trực tiếp 2 chiều vào Google Sheet)</span>
            </label>
            <input
              type="url"
              value={gasWebhookUrl}
              onChange={(e) => setGasWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Khi cấu hình, mọi thay đổi thêm/sửa/xóa trên web sẽ được tự động ghi thẳng vào file Google Sheet của bạn.
            </p>
          </div>

          {/* Input 5: Google OAuth Client ID */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Lock size={14} className="text-blue-600" />
              <span>5. Google Cloud OAuth Client ID (Xác thực Google chính chủ có popup cho phép)</span>
            </label>
            <input
              type="text"
              value={googleClientId}
              onChange={(e) => setGoogleClientId(e.target.value)}
              placeholder="ví dụ: 123456789-xyz.apps.googleusercontent.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500">
              Kích hoạt nút Đăng nhập Google mở hộp thoại đăng nhập chính thức của Google (Google OAuth Consent). Email đăng nhập sẽ được đối soát tự động với danh sách Admin trong Google Sheet.
            </p>
          </div>

          {/* Actions download template */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={downloadSampleAppsCsv}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Tải file CSV mẫu (Apps)</span>
            </button>
            <button
              onClick={downloadSamplePermissionsCsv}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Tải file CSV mẫu (Phân quyền Admin)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            disabled={isSyncing}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSyncing ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Lưu & Đồng bộ ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
