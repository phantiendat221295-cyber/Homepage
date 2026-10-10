import React, { useState } from 'react';
import {
  X,
  Check,
  RefreshCw,
  FileSpreadsheet,
  Download,
  KeyRound,
  ShieldAlert,
  Lock,
  Code,
  CheckCircle2,
  History,
  Send,
  CloudCheck,
  AlertTriangle,
  Play
} from 'lucide-react';
import { GoogleSheetsConfig, SyncLogEntry } from '../types';
import { DEFAULT_GOOGLE_CLIENT_ID } from '../services/googleAuthService';
import { COMPLETE_GAS_SCRIPT, pushToGasWebhook, fetchAppsFromCsv, fetchNotificationsFromCsv } from '../services/sheetsService';

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
  onManualSyncFromSheets?: () => Promise<void>;
  isManualSyncing?: boolean;
  syncLogs?: SyncLogEntry[];
  canManageSync?: boolean;
  onRetrySync?: () => Promise<void>;
  pendingCount?: number;
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
  syncError,
  onManualSyncFromSheets,
  isManualSyncing = false,
  syncLogs = [],
  canManageSync = false,
  onRetrySync,
  pendingCount = 0
}) => {
  const [appsUrl, setAppsUrl] = useState(config.appsCsvUrl || '');
  const [notisUrl, setNotisUrl] = useState(config.notificationsCsvUrl || '');
  const [permissionsUrl, setPermissionsUrl] = useState(config.permissionsCsvUrl || '');
  const [gasWebhookUrl, setGasWebhookUrl] = useState(config.gasWebhookUrl || '');
  const [googleClientId, setGoogleClientId] = useState(config.googleClientId || DEFAULT_GOOGLE_CLIENT_ID);
  const [customLogoUrl, setCustomLogoUrl] = useState(config.customLogoUrl || '');
  const [campusName, setCampusName] = useState(config.campusName || 'ĐỒNG NAI');
  const [enableGoogleSheetsSync, setEnableGoogleSheetsSync] = useState(Boolean(config.enableGoogleSheetsSync));

  // Trạng thái kiểm tra kết nối
  const [testCsvStatus, setTestCsvStatus] = useState<string | null>(null);
  const [isTestingCsv, setIsTestingCsv] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

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

  const handleTestCsvLinks = async () => {
    setIsTestingCsv(true);
    setTestCsvStatus(null);
    try {
      const results: string[] = [];
      if (appsUrl.trim()) {
        const apps = await fetchAppsFromCsv(appsUrl.trim());
        results.push(`✓ Apps CSV: Đọc thành công ${apps.length} tiện ích`);
      }
      if (notisUrl.trim()) {
        const notis = await fetchNotificationsFromCsv(notisUrl.trim());
        results.push(`✓ ThongBao CSV: Đọc thành công ${notis.length} thông báo`);
      }
      if (results.length === 0) {
        setTestCsvStatus('Vui lòng nhập ít nhất 1 link CSV để kiểm tra.');
      } else {
        setTestCsvStatus(results.join(' • '));
      }
    } catch (err: any) {
      setTestCsvStatus(`✕ Lỗi kết nối CSV: ${err.message || 'Không thể tải file'}`);
    } finally {
      setIsTestingCsv(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!gasWebhookUrl.trim()) {
      setTestWebhookStatus('Vui lòng nhập Webhook URL trước khi thử.');
      return;
    }
    setIsTestingWebhook(true);
    setTestWebhookStatus(null);
    try {
      const success = await pushToGasWebhook(gasWebhookUrl.trim(), { action: 'testConnection' });
      if (success) {
        setTestWebhookStatus('✓ Đã gửi yêu cầu kết nối thành công tới Webhook Google Apps Script!');
      } else {
        setTestWebhookStatus('✕ Không thể kết nối tới Webhook. Hãy kiểm tra lại URL hoặc phân quyền Who has access.');
      }
    } catch (err: any) {
      setTestWebhookStatus(`✕ Lỗi gọi Webhook: ${err.message || 'Thất bại'}`);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(COMPLETE_GAS_SCRIPT);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
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
              <h3 className="font-bold text-slate-800 text-lg">Quản lý đồng bộ Google Sheets – Firestore</h3>
              <p className="text-xs text-slate-500">Đồng bộ tự động 2 chiều, bảo vệ dữ liệu và xem trước đối chiếu</p>
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
              <div className="font-bold flex items-center justify-between text-rose-900">
                <span className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600 shrink-0" />
                  <span>Phát hiện sự cố đồng bộ Google Sheets!</span>
                </span>
                {onRetrySync && (
                  <button
                    onClick={onRetrySync}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span>Thử lại ngay</span>
                  </button>
                )}
              </div>
              <p className="leading-relaxed">{syncError}</p>
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
                  {lastSynced ? `Lần đồng bộ Sheet gần nhất: ${lastSynced}` : 'Nguồn chính: Google Cloud Firestore (Bảo vệ 100%)'}
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

          {/* CHẾ ĐỘ 2: ĐỒNG BỘ BỔ SUNG TỪ GOOGLE SHEETS VỀ WEB */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-blue-950 flex items-center gap-1.5">
                  <FileSpreadsheet size={16} className="text-blue-600" />
                  <span>CHẾ ĐỘ 2: NHẬP BỔ SUNG TỪ GOOGLE SHEETS VỀ WEB</span>
                </span>
                <p className="text-[11px] text-blue-800/80 mt-1 leading-relaxed">
                  Quản trị viên chủ động nạp thêm dữ liệu từ Google Sheets. <strong>Có bước đối chiếu và xem trước</strong> trước khi ghi vào Firestore.
                </p>
              </div>

              {onManualSyncFromSheets && (
                <button
                  type="button"
                  onClick={onManualSyncFromSheets}
                  disabled={isManualSyncing || isSyncing}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isManualSyncing ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <Download size={15} />
                  )}
                  <span>{isManualSyncing ? 'Đang phân tích diff...' : 'Đồng bộ bổ sung từ Google Sheets về web'}</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-100">
              <span className="text-[11px] text-blue-700 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Không ghi đè dữ liệu web, bảo toàn phân công & checklist người dùng.</span>
              </span>

              <button
                type="button"
                onClick={handleTestCsvLinks}
                disabled={isTestingCsv}
                className="text-[11px] font-bold text-blue-800 hover:text-blue-950 underline flex items-center gap-1 cursor-pointer"
              >
                {isTestingCsv ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                <span>Kiểm tra kết nối CSV</span>
              </button>
            </div>

            {testCsvStatus && (
              <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-blue-900 animate-in fade-in">
                {testCsvStatus}
              </div>
            )}
          </div>

          {/* CHẾ ĐỘ 1: TỰ ĐỘNG ĐỒNG BỘ TỪ WEB LÊN GOOGLE SHEETS */}
          <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Send size={15} className="text-emerald-700" />
                  <span>CHẾ ĐỘ 1: TỰ ĐỘNG ĐỒNG BỘ TỪ WEB LÊN GOOGLE SHEETS</span>
                </span>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Khi tạo/sửa/xóa tiện ích, thông báo hoặc checklist trên web, dữ liệu lưu vào Firestore trước, sau đó tự động gửi sang Google Sheets qua Webhook.
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

            {/* Input Webhook GAS */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  URL Webhook Google Apps Script:
                </label>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !gasWebhookUrl.trim()}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  {isTestingWebhook ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                  <span>Kiểm tra kết nối Webhook</span>
                </button>
              </div>
              <input
                type="url"
                value={gasWebhookUrl}
                onChange={(e) => setGasWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-white border border-emerald-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {testWebhookStatus && (
              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs text-emerald-900 animate-in fade-in">
                {testWebhookStatus}
              </div>
            )}
          </div>

          {/* Input 1: Apps CSV URL */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              1. Link CSV Webapps (Tab 'Apps') <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              value={appsUrl}
              onChange={(e) => setAppsUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Input 2: Notifications CSV URL */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-700">
              2. Link CSV Thông báo (Tab 'ThongBao')
            </label>
            <input
              type="url"
              value={notisUrl}
              onChange={(e) => setNotisUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?gid=...&output=csv"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Input 3: Permissions CSV URL */}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Copy Script Code & Guide */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyScript}
              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer border border-emerald-300 transition-colors"
            >
              {copiedScript ? <Check size={14} className="text-emerald-600" /> : <Code size={14} />}
              <span>{copiedScript ? 'Đã sao chép mã nguồn!' : 'Sao chép mã Google Apps Script hoàn chỉnh'}</span>
            </button>
          </div>

          {/* NHẬT KÝ ĐỒNG BỘ */}
          {syncLogs && syncLogs.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <History size={14} className="text-slate-500" />
                  <span>Nhật ký đồng bộ gần nhất:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Lưu trữ cục bộ</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {syncLogs.slice(0, 6).map((log: SyncLogEntry) => (
                  <div key={log.id} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                    <div>
                      <span className={`font-semibold ${log.status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {log.message}
                      </span>
                      {log.details && <span className="text-slate-500 ml-1">({log.details})</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <span>Lưu cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
