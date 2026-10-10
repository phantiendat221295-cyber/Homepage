import React, { useState } from 'react';
import {
  X,
  Calendar,
  Bell,
  ExternalLink,
  CheckCircle2,
  Circle,
  Users,
  ShieldAlert,
  AlertCircle,
  History,
  Check,
  Clock,
  Send,
  RefreshCw,
  Lock
} from 'lucide-react';
import { NotificationItem, AdminAccount, UserChecklistStatus } from '../types';
import { SYSTEM_SUPER_ADMINS } from '../services/firestoreService';

interface NotificationModalProps {
  item: NotificationItem | null;
  onClose: () => void;
  currentAdminUser?: AdminAccount | null;
  onToggleUserChecklist?: (
    notificationId: string,
    userEmail: string,
    completed: boolean,
    isSuperAdminOverride: boolean
  ) => Promise<void> | void;
  onToggleChecklistItem?: (notificationId: string, itemId: string) => Promise<void> | void;
  onRetrySyncNotification?: (notificationId: string) => Promise<void> | void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  item,
  onClose,
  currentAdminUser,
  onToggleUserChecklist,
  onToggleChecklistItem,
  onRetrySyncNotification
}) => {
  const [permError, setPermError] = useState<string | null>(null);
  const [togglingEmail, setTogglingEmail] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  if (!item) return null;

  const currentUserEmail = (currentAdminUser?.email || '').toLowerCase().trim();
  const isSuperAdmin =
    Boolean(currentAdminUser?.isSuperAdmin) ||
    SYSTEM_SUPER_ADMINS.includes(currentUserEmail);

  const assignedList = (item.assignedTo || []).map((e) => e.toLowerCase().trim());
  const isAssignedToMe = Boolean(currentUserEmail) && assignedList.includes(currentUserEmail);

  // Danh sách checklist người dùng
  const userChecklistsMap: Record<string, UserChecklistStatus> = item.userChecklists || {};
  const totalAssigned = assignedList.length;
  const completedAssigneesCount = assignedList.filter(
    (email) => userChecklistsMap[email]?.completed === true
  ).length;
  const userProgressPercent =
    totalAssigned > 0 ? Math.round((completedAssigneesCount / totalAssigned) * 100) : 0;

  // Sub-task checklist (nếu có)
  const taskChecklist = item.checklist || [];
  const completedTasksCount = taskChecklist.filter((c) => c.completed).length;

  const handleUserToggle = async (targetEmail: string) => {
    const cleanTarget = targetEmail.toLowerCase().trim();
    const canToggleThis = isSuperAdmin || (Boolean(currentUserEmail) && currentUserEmail === cleanTarget);

    if (!canToggleThis) {
      if (!currentAdminUser) {
        setPermError('Vui lòng đăng nhập tài khoản Google được giao việc để đánh dấu hoàn thành.');
      } else {
        setPermError(
          `Bạn không có quyền đánh dấu thay cho "${cleanTarget}". Chỉ người được phân công hoặc Super Admin mới có quyền này.`
        );
      }
      setTimeout(() => setPermError(null), 5000);
      return;
    }

    if (!onToggleUserChecklist) return;

    const currentStatus = Boolean(userChecklistsMap[cleanTarget]?.completed);
    const nextStatus = !currentStatus;
    const isOverride = isSuperAdmin && currentUserEmail !== cleanTarget;

    setPermError(null);
    setTogglingEmail(cleanTarget);
    try {
      await onToggleUserChecklist(item.id, cleanTarget, nextStatus, isOverride);
    } catch (err: any) {
      setPermError('Không thể cập nhật trạng thái checklist: ' + (err.message || ''));
    } finally {
      setTogglingEmail(null);
    }
  };

  const handleTaskToggle = async (itemId: string) => {
    const canToggle = isSuperAdmin || isAssignedToMe;
    if (!canToggle) {
      setPermError('Chỉ người dùng được phân công trong thông báo này hoặc Super Admin mới được tích chọn công việc.');
      setTimeout(() => setPermError(null), 5000);
      return;
    }

    if (!onToggleChecklistItem) return;
    setPermError(null);
    setTogglingTaskId(itemId);
    try {
      await onToggleChecklistItem(item.id, itemId);
    } catch (err: any) {
      setPermError('Lỗi cập nhật checklist: ' + (err.message || ''));
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handleRetrySync = async () => {
    if (!onRetrySyncNotification) return;
    setIsRetryingSync(true);
    try {
      await onRetrySyncNotification(item.id);
    } finally {
      setIsRetryingSync(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4 overflow-y-auto">
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
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  <span>{item.date}</span>
                </span>
                {item.dueDate && (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px] font-semibold">
                    <Clock size={11} />
                    <span>Hạn: {item.dueDate}</span>
                  </span>
                )}
                {item.isCustom && (
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
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

        {/* Title & Content */}
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-snug">
            {item.title}
          </h3>
          <p className="mt-2.5 text-sm text-slate-600 leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
            {item.content || 'Nội dung thông báo chi tiết đang được cập nhật.'}
          </p>
        </div>

        {/* PHẦN 1: PHÂN CÔNG & CHECKLIST THEO TỪNG NGƯỜI DÙNG */}
        {assignedList.length > 0 && (
          <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950 uppercase tracking-wider">
                <Users size={16} className="text-blue-600" />
                <span>Tiến độ người nhận ({completedAssigneesCount}/{totalAssigned} hoàn thành)</span>
              </div>
              <span className="text-xs font-bold text-blue-700">{userProgressPercent}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  userProgressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${userProgressPercent}%` }}
              />
            </div>

            {/* Danh sách người được phân công với Checklist độc lập */}
            <div className="space-y-2 pt-1">
              {assignedList.map((email) => {
                const userStatus = userChecklistsMap[email];
                const isCompleted = Boolean(userStatus?.completed);
                const isMe = Boolean(currentUserEmail) && email === currentUserEmail;
                const canToggleThis = isSuperAdmin || isMe;
                const isToggling = togglingEmail === email;

                return (
                  <div
                    key={email}
                    onClick={() => handleUserToggle(email)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      canToggleThis ? 'cursor-pointer hover:shadow-xs' : 'cursor-not-allowed opacity-90'
                    } ${
                      isCompleted
                        ? 'bg-emerald-50/70 border-emerald-300 text-slate-700'
                        : isMe
                        ? 'bg-blue-50/80 border-blue-300 hover:border-blue-400'
                        : 'bg-white border-slate-200'
                    } ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={19} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle size={19} className={canToggleThis ? 'text-slate-400 hover:text-blue-600' : 'text-slate-300'} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs sm:text-sm font-semibold truncate ${isMe ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                          {userStatus?.name || email.split('@')[0]}
                          {isMe && <span className="ml-1.5 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-bold">Bạn</span>}
                        </span>
                        {!canToggleThis && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5 shrink-0" title="Chỉ người được giao việc hoặc Super Admin mới được tích">
                            <Lock size={10} />
                            <span>Khóa</span>
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 truncate">{email}</div>

                      {isCompleted && (
                        <div className="text-[10px] text-emerald-800 mt-1 font-medium">
                          ✓ Đã hoàn thành{userStatus?.completedBy ? ` bởi ${userStatus.completedBy}` : ''}
                          {userStatus?.completedAt
                            ? ` (${new Date(userStatus.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`
                            : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Quy tắc phân quyền: Chỉ người được giao mới được đánh dấu checklist của mình. Super Admin có quyền quản lý toàn bộ.
            </p>
          </div>
        )}

        {/* PHẦN 2: CHECKLIST NHIỆM VỤ CỤ THỂ (NẾU CÓ) */}
        {taskChecklist.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nhiệm vụ công việc ({completedTasksCount}/{taskChecklist.length})
              </span>
            </div>

            <div className="space-y-2">
              {taskChecklist.map((cItem) => {
                const canToggle = isSuperAdmin || isAssignedToMe;
                const isToggling = togglingTaskId === cItem.id;

                return (
                  <div
                    key={cItem.id}
                    onClick={() => handleTaskToggle(cItem.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                      canToggle ? 'cursor-pointer hover:bg-blue-50/30' : 'cursor-not-allowed opacity-80'
                    } ${
                      cItem.completed
                        ? 'bg-emerald-50/40 border-emerald-200 text-slate-600'
                        : 'bg-slate-50/50 border-slate-200'
                    } ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {cItem.completed ? (
                        <CheckCircle2 size={17} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle size={17} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${cItem.completed ? 'line-through text-slate-500' : 'text-slate-800 font-medium'}`}>
                        {cItem.text}
                      </p>
                      {cItem.completed && cItem.completedBy && (
                        <span className="text-[10px] text-emerald-700 mt-0.5 block">
                          ✓ Bởi: {cItem.completedBy}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thông báo lỗi quyền */}
        {permError && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs animate-in fade-in duration-150">
            <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{permError}</div>
          </div>
        )}

        {/* PHẦN 3: LỊCH SỬ THAO TÁC (AUDIT LOGS) */}
        {item.auditLogs && item.auditLogs.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 space-y-2">
            <button
              type="button"
              onClick={() => setShowAuditLogs(!showAuditLogs)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <History size={14} className="text-slate-500" />
                <span>Lịch sử thao tác ({item.auditLogs.length} lần cập nhật)</span>
              </span>
              <span className="text-[10px] text-blue-600 underline">
                {showAuditLogs ? 'Thu gọn' : 'Xem chi tiết'}
              </span>
            </button>

            {showAuditLogs && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pt-2 border-t border-slate-200 text-[11px]">
                {item.auditLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded-lg bg-white border border-slate-200 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-700">{log.performedBy}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('vi-VN')} {new Date(log.timestamp).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="text-slate-600">{log.details || log.action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            {isSuperAdmin ? (
              <span className="text-blue-600 font-bold">Quyền: Super Admin (toàn quyền quản lý)</span>
            ) : isAssignedToMe ? (
              <span className="text-emerald-600 font-bold">Quyền: Người được giao việc</span>
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
                <span>Xem tài liệu</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
