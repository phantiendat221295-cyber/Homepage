import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  Layers,
  Bell,
  Sliders,
  CheckCircle2,
  Trash2,
  PlusCircle,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SystemAuditLog, AuditActionType, AuditTargetType } from '../types';
import { getSystemAuditLogsFromFirestore, subscribeSystemAuditLogs } from '../services/firestoreService';

interface SystemAuditLogViewProps {
  currentAdminEmail?: string;
}

export const SystemAuditLogView: React.FC<SystemAuditLogViewProps> = () => {
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedPerformer, setSelectedPerformer] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Lắng nghe realtime từ Firestore
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeSystemAuditLogs(
      (items) => {
        setLogs(items);
        setIsLoading(false);
      },
      () => {
        // Fallback đọc một lần nếu subscribe gặp vấn đề quyền
        getSystemAuditLogsFromFirestore(200).then((items) => {
          setLogs(items);
          setIsLoading(false);
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    const items = await getSystemAuditLogsFromFirestore(200);
    setLogs(items);
    setIsLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Danh sách email người thực hiện (để lọc)
  const performerOptions = useMemo(() => {
    const emails = new Set<string>();
    logs.forEach((log) => {
      if (log.performedBy) emails.add(log.performedBy.toLowerCase().trim());
    });
    return Array.from(emails).sort();
  }, [logs]);

  // Bộ lọc dữ liệu
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return logs.filter((log) => {
      // 1. Tìm kiếm từ khóa
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchTitle = (log.targetTitle || '').toLowerCase().includes(query);
        const matchDesc = (log.description || '').toLowerCase().includes(query);
        const matchUser = (log.performedBy || '').toLowerCase().includes(query) || (log.performedByName || '').toLowerCase().includes(query);
        const matchTargetId = (log.targetId || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchUser && !matchTargetId) {
          return false;
        }
      }

      // 2. Lọc theo Đối tượng
      if (selectedTarget !== 'all' && log.targetType !== selectedTarget) {
        return false;
      }

      // 3. Lọc theo Loại thao tác
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // 4. Lọc theo Người thực hiện
      if (selectedPerformer !== 'all' && log.performedBy.toLowerCase().trim() !== selectedPerformer.toLowerCase().trim()) {
        return false;
      }

      // 5. Lọc theo Thời gian
      if (selectedTimeRange !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        if (isNaN(logTime)) return true;
        const diff = now - logTime;

        if (selectedTimeRange === 'today' && diff > oneDay) return false;
        if (selectedTimeRange === '7days' && diff > 7 * oneDay) return false;
        if (selectedTimeRange === '30days' && diff > 30 * oneDay) return false;
      }

      return true;
    });
  }, [logs, searchTerm, selectedTarget, selectedAction, selectedPerformer, selectedTimeRange]);

  // Phân trang
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTarget('all');
    setSelectedAction('all');
    setSelectedPerformer('all');
    setSelectedTimeRange('all');
    setCurrentPage(1);
  };

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `system_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadge = (action: AuditActionType) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <PlusCircle size={12} />
            CREATE
          </span>
        );
      case 'UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200">
            <Edit3 size={12} />
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
            <Trash2 size={12} />
            DELETE
          </span>
        );
      case 'TOGGLE_CHECKLIST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 size={12} />
            CHECKLIST
          </span>
        );
      case 'ASSIGN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200">
            <User size={12} />
            ASSIGN
          </span>
        );
      case 'CONFIG_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-800 border border-teal-200">
            <Sliders size={12} />
            CONFIG
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-800 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  const getTargetIcon = (targetType: AuditTargetType) => {
    switch (targetType) {
      case 'app':
        return <Layers size={14} className="text-blue-500" />;
      case 'notification':
        return <Bell size={14} className="text-amber-500" />;
      case 'admin_account':
        return <ShieldAlert size={14} className="text-rose-500" />;
      case 'portal_config':
        return <Sliders size={14} className="text-teal-500" />;
      default:
        return <FileText size={14} className="text-slate-500" />;
    }
  };

  const getTargetLabel = (targetType: AuditTargetType) => {
    switch (targetType) {
      case 'app':
        return 'Tiện ích Webapp';
      case 'notification':
        return 'Thông báo & Checklist';
      case 'admin_account':
        return 'Phân quyền Admin';
      case 'portal_config':
        return 'Cấu hình hệ thống';
      case 'support_ticket':
        return 'Yêu cầu hỗ trợ';
      default:
        return targetType;
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return iso;
      const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${timeStr} • ${dateStr}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider">
                SUPER ADMIN AUDIT
              </span>
              <span className="text-xs text-slate-300">
                Lưu trữ bền vững trên Firestore • Bất biến (Immutable)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Nhật Ký Kiểm Toán Toàn Hệ Thống
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Theo dõi và giám sát chi tiết mọi hành vi quản trị của các Admin (thêm/sửa/xóa tiện ích, tạo thông báo, phân công nhiệm vụ, đánh dấu checklist và cấu hình hệ thống).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-white/15"
              title="Tải lại nhật ký mới nhất"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={exportToJson}
              disabled={filteredLogs.length === 0}
              className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              title="Xuất danh sách nhật ký ra file JSON"
            >
              <Download size={14} />
              <span>Xuất JSON</span>
            </button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div>
            <div className="text-slate-400">Tổng bản ghi ghi nhận</div>
            <div className="text-xl font-black mt-0.5">{logs.length}</div>
          </div>
          <div>
            <div className="text-slate-400">Kết quả lọc hiện tại</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">{filteredLogs.length}</div>
          </div>
          <div>
            <div className="text-slate-400">Admin đã thao tác</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5">{performerOptions.length}</div>
          </div>
          <div>
            <div className="text-slate-400">Trạng thái bảo vệ</div>
            <div className="text-xs font-bold text-sky-300 mt-1.5 flex items-center gap-1">
              <Check size={14} /> Chống xóa / Chống sửa
            </div>
          </div>
        </div>
      </div>

      {/* Thanh bộ lọc đa tiêu chí */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Tìm kiếm */}
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm theo tên tiện ích, thông báo, email hoặc mô tả..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 2. Đối tượng */}
          <div>
            <select
              value={selectedTarget}
              onChange={(e) => {
                setSelectedTarget(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">Tất cả đối tượng</option>
              <option value="app">Tiện ích Webapps</option>
              <option value="notification">Thông báo & Checklist</option>
              <option value="admin_account">Phân quyền Admin</option>
              <option value="portal_config">Cấu hình hệ thống</option>
            </select>
          </div>

          {/* 3. Loại thao tác */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">Tất cả thao tác</option>
              <option value="CREATE">CREATE (Tạo mới)</option>
              <option value="UPDATE">UPDATE (Cập nhật)</option>
              <option value="DELETE">DELETE (Xóa)</option>
              <option value="TOGGLE_CHECKLIST">CHECKLIST (Hoàn thành/Mở lại)</option>
              <option value="CONFIG_CHANGE">CONFIG (Đổi cấu hình)</option>
            </select>
          </div>

          {/* 4. Khoảng thời gian */}
          <div>
            <select
              value={selectedTimeRange}
              onChange={(e) => {
                setSelectedTimeRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="today">Hôm nay (24 giờ qua)</option>
              <option value="7days">7 ngày gần nhất</option>
              <option value="30days">30 ngày gần nhất</option>
            </select>
          </div>
        </div>

        {/* Bộ lọc mở rộng & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Filter size={12} /> Người thực hiện:
            </span>
            <select
              value={selectedPerformer}
              onChange={(e) => {
                setSelectedPerformer(e.target.value);
                setCurrentPage(1);
              }}
              className="py-1 px-2.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              <option value="all">Tất cả Admin ({performerOptions.length})</option>
              {performerOptions.map((email) => (
                <option key={email} value={email}>
                  {email}
                </option>
              ))}
            </select>
          </div>

          {(searchTerm || selectedTarget !== 'all' || selectedAction !== 'all' || selectedPerformer !== 'all' || selectedTimeRange !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer hover:underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Danh sách nhật ký */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw size={28} className="animate-spin mx-auto text-blue-500" />
            <p className="text-sm font-medium">Đang tải nhật ký kiểm toán từ Firestore...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText size={28} />
            </div>
            <h4 className="text-base font-bold text-slate-700">Chưa có bản ghi nhật ký phù hợp</h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Không tìm thấy thao tác nào khớp với bộ lọc tìm kiếm hiện tại. Hãy thử thay đổi bộ lọc hoặc từ khóa.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedLogs.map((log) => {
              const isExpanded = expandedLogIds.has(log.id);
              const hasDiff = Boolean(
                log.changes &&
                  ((log.changes.before && Object.keys(log.changes.before).length > 0) ||
                    (log.changes.after && Object.keys(log.changes.after).length > 0))
              );

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors space-y-2.5"
                >
                  {/* Dòng 1: Header của bản ghi */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActionBadge(log.action)}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {getTargetIcon(log.targetType)}
                        {getTargetLabel(log.targetType)}
                      </span>

                      {log.targetTitle && (
                        <span className="text-xs font-extrabold text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {log.targetTitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <Clock size={13} />
                      <span className="font-medium">{formatTimestamp(log.timestamp)}</span>
                    </div>
                  </div>

                  {/* Dòng 2: Mô tả hành động */}
                  <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed pl-0.5">
                    {log.description}
                  </div>

                  {/* Dòng 3: Người thực hiện & Nút xem chi tiết diff */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {log.performedBy.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-700">
                        {log.performedByName ? `${log.performedByName} ` : ''}
                        <span className="text-slate-400 font-normal">({log.performedBy})</span>
                      </span>
                    </div>

                    {hasDiff && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(log.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer ml-auto"
                      >
                        <span>{isExpanded ? 'Thu gọn chi tiết' : 'Chi tiết thay đổi (Diff)'}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Dòng 4: Accordion Diff chi tiết Trước/Sau */}
                  {isExpanded && hasDiff && (
                    <div className="mt-3 p-3.5 bg-slate-900 text-slate-100 rounded-xl text-xs space-y-2 border border-slate-800 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between font-bold text-slate-300 border-b border-slate-800 pb-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">
                          Đối chiếu giá trị trước và sau khi thay đổi
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {log.targetId}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {/* Trước khi sửa */}
                        {log.changes?.before && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                              • Trước khi sửa (Before):
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-950/80 text-rose-200 text-[11px] font-mono overflow-x-auto border border-rose-950/60 max-h-48">
                              {JSON.stringify(log.changes.before, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Sau khi sửa */}
                        {log.changes?.after && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                              • Sau khi sửa (After):
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-950/80 text-emerald-200 text-[11px] font-mono overflow-x-auto border border-emerald-950/60 max-h-48">
                              {JSON.stringify(log.changes.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Phân trang dưới đáy */}
        {filteredLogs.length > 0 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500">
              Hiển thị{' '}
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              đến{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)}
              </span>{' '}
              trên tổng số{' '}
              <span className="font-bold text-slate-800">{filteredLogs.length}</span> bản ghi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 font-bold text-slate-700">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Trang sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
