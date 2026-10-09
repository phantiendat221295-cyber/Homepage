import React, { useState } from 'react';
import { X, Calendar, Bell, ExternalLink, CheckCircle2, Circle, UserCheck, Users, ShieldAlert, AlertCircle } from 'lucide-react';
import { NotificationItem, AdminAccount } from '../types';
import { SYSTEM_SUPER_ADMINS } from '../services/firestoreService';

interface NotificationModalProps {
  item: NotificationItem | null;
  onClose: () => void;
  currentAdminUser?: AdminAccount | null;
  onToggleChecklistItem?: (notificationId: string, itemId: string) => Promise<void> | void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  item,
  onClose,
  currentAdminUser,
  onToggleChecklistItem
}) => {
  const [permError, setPermError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  if (!item) return null;

  const currentUserEmail = (currentAdminUser?.email || '').toLowerCase().trim();
  const isSuperAdmin =
    Boolean(currentAdminUser?.isSuperAdmin) ||
    SYSTEM_SUPER_ADMINS.includes(currentUserEmail);

  const assignedList = item.assignedTo || [];
  const isAssignedToMe = assignedList.map((e) => e.toLowerCase().trim()).includes(currentUserEmail);
  const canToggle = isSuperAdmin || (Boolean(currentUserEmail) && isAssignedToMe);

  const checklist = item.checklist || [];
  const completedCount = checklist.filter((c) => c.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleToggle = async (itemId: string) => {
    if (!canToggle) {
      if (!currentAdminUser) {
        setPermError('Vui lòng đăng nhập tài khoản được phân công để đánh dấu hoàn thành mục này.');
      } else {
        setPermError(
          `Bạn không nằm trong danh sách được phân công của thông báo này. Chỉ người được giao việc (${assignedList.join(', ') || 'Chưa gán'}) hoặc Super Admin mới có quyền đánh dấu hoàn thành.`
        );
      }
      setTimeout(() => setPermError(null), 6000);
      return;
    }

    if (!onToggleChecklistItem) return;

    setPermError(null);
    setTogglingId(itemId);
    try {
      await onToggleChecklistItem(item.id, itemId);
    } catch (err: any) {
      setPermError('Không thể cập nhật trạng thái mục kiểm tra: ' + (err.message || ''));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <Bell size={20} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Thông báo đào tạo
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Calendar size={13} />
                <span>{item.date}</span>
                {item.isCustom && (
                  <span className="ml-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Tạo trên Web
                  </span>
                )}
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

        {/* Title */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-snug">
            {item.title}
          </h3>
          <p className="mt-2.5 text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
            {item.content || 'Nội dung thông báo chi tiết đang được cập nhật từ hệ thống quản lý đào tạo.'}
          </p>
        </div>

        {/* Người được phân công (Assigned To) */}
        {assignedList.length > 0 && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-800">
              <span className="flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                <span>Người được phân công phụ trách:</span>
              </span>
              {isAssignedToMe && (
                <span className="text-[11px] bg-blue-600 text-white font-medium px-2 py-0.5 rounded-full">
                  Đã giao cho bạn
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {assignedList.map((email, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl font-medium border ${
                    email.toLowerCase().trim() === currentUserEmail
                      ? 'bg-blue-100 border-blue-300 text-blue-900 font-semibold'
                      : 'bg-white border-blue-200 text-blue-700'
                  }`}
                >
                  <UserCheck size={12} className="text-blue-500" />
                  <span>{email}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Checklist nhiệm vụ */}
        {checklist.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Checklist công việc ({completedCount}/{checklist.length})
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {progressPercent}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Checklist items */}
            <div className="space-y-2 pt-1">
              {checklist.map((cItem) => {
                const isToggling = togglingId === cItem.id;
                return (
                  <div
                    key={cItem.id}
                    onClick={() => handleToggle(cItem.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      cItem.completed
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-600'
                        : 'bg-slate-50/50 border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                    } ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {cItem.completed ? (
                        <CheckCircle2 size={18} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle size={18} className="text-slate-400 hover:text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs sm:text-sm ${
                          cItem.completed
                            ? 'line-through text-slate-500 font-normal'
                            : 'text-slate-800 font-medium'
                        }`}
                      >
                        {cItem.text}
                      </p>
                      {cItem.completed && cItem.completedBy && (
                        <span className="text-[10px] text-emerald-700 mt-1 block">
                          ✓ Hoàn thành bởi: <strong>{cItem.completedBy}</strong>
                          {cItem.completedAt ? ` (${new Date(cItem.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!canToggle && (
              <p className="text-[11px] text-slate-400 italic">
                * Chỉ người dùng được phân công hoặc Super Admin mới được tích chọn hoàn thành checklist.
              </p>
            )}
          </div>
        )}

        {/* Thông báo lỗi quyền */}
        {permError && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs animate-in fade-in duration-150">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">{permError}</div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            {isSuperAdmin ? (
              <span className="text-blue-600 font-medium">Quyền: Super Admin (toàn quyền)</span>
            ) : isAssignedToMe ? (
              <span className="text-emerald-600 font-medium">Quyền: Người được giao việc</span>
            ) : (
              <span>Quyền: Xem thông báo</span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
    </div>
  );
};
