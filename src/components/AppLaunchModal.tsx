import React from 'react';
import { X, ExternalLink, Copy, Check, Info, ShieldCheck, Tag } from 'lucide-react';
import { WebAppItem } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface AppLaunchModalProps {
  app: WebAppItem | null;
  onClose: () => void;
}

export const AppLaunchModal: React.FC<AppLaunchModalProps> = ({ app, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!app) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(app.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = () => {
    if (app.url && app.url !== '#') {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DynamicIcon name={app.icon} size={26} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                {app.category}
              </span>
              <h3 className="font-bold text-slate-800 text-lg sm:text-xl">
                {app.title}
              </h3>
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
        <div className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {app.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium">
              <ShieldCheck size={13} />
              <span>Hệ thống nội bộ</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
              <Tag size={13} />
              <span>{app.tag?.toUpperCase() || 'WEBAPP'}</span>
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-slate-600 font-mono text-[11px]">{app.url}</span>
            <button
              onClick={handleCopyLink}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleOpenApp}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <span>Mở tiện ích</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
