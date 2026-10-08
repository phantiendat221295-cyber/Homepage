import React from 'react';
import { X, Calendar, Bell, ExternalLink, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationModalProps {
  item: NotificationItem | null;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Thông báo đào tạo
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Calendar size={13} />
                <span>{item.date}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-snug">
            {item.title}
          </h3>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {item.content || 'Nội dung thông báo chi tiết đang được cập nhật từ hệ thống quản lý đào tạo.'}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          {item.url && item.url !== '#' && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>Xem tài liệu gốc</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
