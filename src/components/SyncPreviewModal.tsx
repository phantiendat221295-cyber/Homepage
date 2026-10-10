import React from 'react';
import { X, Check, ShieldCheck, FileSpreadsheet, Plus, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { WebAppItem, NotificationItem, SyncDiffPreview } from '../types';

interface SyncPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  diff: SyncDiffPreview | null;
  onConfirmSync: () => Promise<void>;
  isApplying: boolean;
}

export const SyncPreviewModal: React.FC<SyncPreviewModalProps> = ({
  isOpen,
  onClose,
  diff,
  onConfirmSync,
  isApplying
}) => {
  const [activeTab, setActiveTab] = React.useState<'apps' | 'notis'>('apps');

  if (!isOpen || !diff) return null;

  const totalNew = diff.newApps.length + diff.newNotis.length;
  const totalIdentical = diff.identicalApps.length + diff.identicalNotis.length;
  const totalWebOnly = diff.webOnlyApps.length + diff.webOnlyNotis.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                Xem trước đối chiếu Google Sheets &rarr; Web
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm tra dữ liệu trước khi quyết định ghi bổ sung vào Cloud Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isApplying}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Cam kết an toàn dữ liệu */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong>Cơ chế bảo vệ dữ liệu tuyệt đối:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-emerald-800">
                <li>Bản ghi chỉ có trên Web ({totalWebOnly} mục): Giữ nguyên 100%, không bị xóa hay ghi đè.</li>
                <li>Phân công phụ trách & trạng thái Checklist người dùng: Được bảo toàn nguyên vẹn.</li>
                <li>Chỉ nạp thêm các bản ghi mới từ Sheet chưa từng có trên web ({totalNew} mục).</li>
              </ul>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-blue-700">+{totalNew}</div>
              <div className="text-[11px] font-semibold text-blue-900 mt-0.5">Bản ghi mới từ Sheet</div>
              <div className="text-[10px] text-blue-600">({diff.newApps.length} Apps, {diff.newNotis.length} Thông báo)</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-slate-700">{totalIdentical}</div>
              <div className="text-[11px] font-semibold text-slate-800 mt-0.5">Bản ghi trùng / Đã có</div>
              <div className="text-[10px] text-slate-500">Giữ nguyên</div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700">{totalWebOnly}</div>
              <div className="text-[11px] font-semibold text-emerald-900 mt-0.5">Bản ghi riêng trên Web</div>
              <div className="text-[10px] text-emerald-600">Bảo toàn 100%</div>
            </div>
          </div>

          {/* Tab chọn danh mục xem chi tiết */}
          <div>
            <div className="flex border-b border-slate-200 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('apps')}
                className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'apps'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Tiện ích Web ({diff.newApps.length} mới)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notis')}
                className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'notis'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Thông báo đào tạo ({diff.newNotis.length} mới)
              </button>
            </div>

            {/* List preview */}
            <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
              {activeTab === 'apps' ? (
                diff.newApps.length > 0 ? (
                  diff.newApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="font-bold text-slate-800 truncate">{app.title}</div>
                        <div className="text-slate-500 text-[11px] truncate">{app.description}</div>
                        <div className="text-[10px] text-blue-600 mt-0.5">{app.category} • {app.url}</div>
                      </div>
                      <span className="shrink-0 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        + Mới
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    Không có tiện ích mới nào từ Google Sheets. Tất cả tiện ích đều đã có trên Web.
                  </div>
                )
              ) : diff.newNotis.length > 0 ? (
                diff.newNotis.map((noti) => (
                  <div
                    key={noti.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="font-bold text-slate-800 truncate">{noti.title}</div>
                      <div className="text-slate-500 text-[11px] truncate">{noti.content || noti.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ngày: {noti.date}</div>
                    </div>
                    <span className="shrink-0 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      + Mới
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Không có thông báo mới nào từ Google Sheets. Các thông báo hiện tại trên Web được bảo toàn.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {totalNew > 0 ? `Sẵn sàng nhập ${totalNew} bản ghi mới vào Firestore.` : 'Dữ liệu đã đồng bộ tối ưu.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onConfirmSync}
              disabled={isApplying || totalNew === 0}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isApplying ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
              <span>{isApplying ? 'Đang lưu vào Firestore...' : 'Xác nhận nhập vào Firestore'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
