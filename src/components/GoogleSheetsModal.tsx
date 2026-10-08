import React, { useState } from 'react';
import { X, ExternalLink, Check, RefreshCw, FileSpreadsheet, AlertCircle, Copy, Download } from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

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
  totalNotis
}) => {
  const [appsUrl, setAppsUrl] = useState(config.appsCsvUrl || '');
  const [notisUrl, setNotisUrl] = useState(config.notificationsCsvUrl || '');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig({
      ...config,
      appsCsvUrl: appsUrl.trim(),
      notificationsCsvUrl: notisUrl.trim(),
      autoSync: true
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Sample CSV generator for Apps
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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Cài đặt kết nối Google Sheets</h3>
              <p className="text-xs text-slate-500">Đồng bộ dữ liệu thời gian thực từ Google Sheets qua Publish to Web</p>
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Status card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <div className="font-bold text-xs sm:text-sm text-emerald-900">
                  Dữ liệu hiện tại: {totalApps} Webapps • {totalNotis} Thông báo
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-700">
                  {lastSynced ? `Lần cập nhật gần nhất: ${lastSynced}` : 'Đang sử dụng dữ liệu mặc định chuẩn'}
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

          {/* Input 1: Apps CSV URL */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              1. Link CSV Trang tính Webapps (Tab 'Apps')
            </label>
            <input
              type="url"
              value={appsUrl}
              onChange={(e) => setAppsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Các cột bắt buộc: <span className="font-semibold text-slate-700">Tên, Mô tả, Link, Nhóm, Icon, Tag, Màu sắc</span>
            </p>
          </div>

          {/* Input 2: Notifications CSV URL */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              2. Link CSV Trang tính Thông báo (Tab 'ThongBao' - Tùy chọn)
            </label>
            <input
              type="url"
              value={notisUrl}
              onChange={(e) => setNotisUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&single=true&output=csv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Các cột: <span className="font-semibold text-slate-700">Tiêu đề, Ngày, Nội dung, Link, Màu</span>
            </p>
          </div>

          {/* Step-by-step Quick Guide */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
            <h4 className="font-bold text-xs sm:text-sm text-slate-800 mb-2 flex items-center gap-1.5">
              <AlertCircle size={16} className="text-blue-600" />
              Cách lấy link CSV từ Google Sheets (3 bước siêu nhanh):
            </h4>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1">
              <li>Mở file Google Sheets của bạn.</li>
              <li>
                Chọn menu <strong className="text-slate-800">Tệp (File)</strong> &rarr;{' '}
                <strong className="text-slate-800">Chia sẻ (Share)</strong> &rarr;{' '}
                <strong className="text-slate-800">Xuất bản lên web (Publish to web)</strong>.
              </li>
              <li>
                Ở mục Định dạng, chọn <strong className="text-slate-800">Giá trị được phân tách bằng dấu phẩy (.csv)</strong> và nhấn <strong className="text-blue-600">Xuất bản (Publish)</strong>.
              </li>
              <li>Sao chép link nhận được và dán vào ô bên trên.</li>
            </ol>

            <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap gap-2">
              <button
                onClick={downloadSampleAppsCsv}
                className="text-xs bg-white text-slate-700 hover:text-blue-600 border border-slate-200 px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={13} />
                <span>Tải file CSV mẫu (Apps Template)</span>
              </button>
            </div>
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
