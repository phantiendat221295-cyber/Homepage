import React from 'react';
import { NotificationItem, QuickToolItem } from '../types';
import { Bell, Zap, ArrowRight, ChevronRight, Calendar, FileSpreadsheet, Headphones, ExternalLink, Bot } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface SidebarWidgetsProps {
  notifications: NotificationItem[];
  quickTools: QuickToolItem[];
  onNotificationClick: (item: NotificationItem) => void;
  onViewAllNotifications?: () => void;
  onOpenQuickTool: (tool: QuickToolItem) => void;
  onRequestSupport: () => void;
}

const DOT_COLORS: Record<string, string> = {
  red: 'bg-rose-500',
  blue: 'bg-blue-500',
  purple: 'bg-fuchsia-500',
  orange: 'bg-amber-500',
  green: 'bg-emerald-500'
};

export const SidebarWidgets: React.FC<SidebarWidgetsProps> = ({
  notifications,
  quickTools,
  onNotificationClick,
  onViewAllNotifications,
  onOpenQuickTool,
  onRequestSupport
}) => {
  return (
    <aside className="space-y-6">
      {/* BLOCK 1: THÔNG BÁO MỚI */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Bell size={18} className="text-blue-600 fill-blue-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Thông báo mới</h3>
          </div>

          {onViewAllNotifications && (
            <button
              onClick={onViewAllNotifications}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* List of notifications */}
        <div className="divide-y divide-slate-100">
          {notifications.slice(0, 5).map((noti) => {
            const dotClass = DOT_COLORS[noti.color || 'blue'] || 'bg-blue-500';
            return (
              <div
                key={noti.id}
                onClick={() => onNotificationClick(noti)}
                className="py-3 flex items-center justify-between gap-2.5 hover:bg-slate-50/80 -mx-2 px-2 rounded-lg cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                  <span className="text-xs sm:text-[13px] font-medium text-slate-700 group-hover:text-blue-600 truncate transition-colors">
                    {noti.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0 text-slate-400 group-hover:text-slate-600">
                  <span className="text-[11px] sm:text-xs">{noti.date}</span>
                  <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOCK 2: TIỆN ÍCH NHANH */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
            <Zap size={18} className="text-amber-500 fill-amber-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Tiện ích nhanh</h3>
        </div>

        {/* 2x2 Grid of tools */}
        <div className="grid grid-cols-2 gap-3">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onOpenQuickTool(tool)}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all text-left group cursor-pointer bg-slate-50/30"
            >
              <div className="shrink-0">
                <DynamicIcon name={tool.icon} size={20} className="w-5 h-5" />
              </div>
              <span className="text-xs sm:text-[13px] font-medium text-slate-700 group-hover:text-blue-600 truncate">
                {tool.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* BLOCK 3: BANNER CẦN HỖ TRỢ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-[#1E3A8A] p-5 text-white shadow-lg shadow-blue-500/10">
        {/* Glow backdrop decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-blue-300/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* 3D Cute AI Robot illustration */}
          <div className="relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
            {/* Robot graphic with futuristic glowing look */}
            <div className="relative group">
              <svg viewBox="0 0 140 140" className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-md">
                <defs>
                  <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                  <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0F172A" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </linearGradient>
                  <linearGradient id="cyanEye" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#67E8F9" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Head floating shadow */}
                <ellipse cx="70" cy="126" rx="28" ry="6" fill="#000000" opacity="0.25" />

                {/* Robot Body */}
                <path d="M50 82 C50 78, 90 78, 90 82 L96 112 C96 118, 44 118, 44 112 Z" fill="url(#robotGrad)" />
                <circle cx="70" cy="98" r="8" fill="#38BDF8" opacity="0.9" filter="url(#glow)"/>
                <path d="M70 94 L70 102 M66 98 L74 98" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

                {/* Robot Hands */}
                <circle cx="36" cy="94" r="7" fill="url(#robotGrad)" />
                <circle cx="104" cy="94" r="7" fill="url(#robotGrad)" />

                {/* Head Ears / Headset */}
                <rect x="26" y="44" width="8" height="22" rx="4" fill="#38BDF8" />
                <rect x="106" y="44" width="8" height="22" rx="4" fill="#38BDF8" />

                {/* Head Base */}
                <rect x="32" y="26" width="76" height="58" rx="22" fill="url(#robotGrad)" stroke="#F1F5F9" strokeWidth="2" />

                {/* Visor Screen */}
                <rect x="42" y="36" width="56" height="38" rx="14" fill="url(#visorGrad)" />

                {/* Glowing Eyes */}
                <ellipse cx="56" cy="54" rx="6" ry="7" fill="url(#cyanEye)" filter="url(#glow)" />
                <ellipse cx="84" cy="54" rx="6" ry="7" fill="url(#cyanEye)" filter="url(#glow)" />
                <circle cx="58" cy="52" r="2" fill="#FFFFFF" />
                <circle cx="86" cy="52" r="2" fill="#FFFFFF" />

                {/* Cute smile line */}
                <path d="M64 63 Q70 67 76 63" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />

                {/* Antenna */}
                <line x1="70" y1="26" x2="70" y2="16" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                <circle cx="70" cy="14" r="4.5" fill="#38BDF8" filter="url(#glow)" />
              </svg>
            </div>
          </div>

          {/* Right info */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4 className="font-extrabold text-lg sm:text-xl text-white tracking-tight">Cần hỗ trợ?</h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-400/30 text-cyan-200 border border-cyan-300/30">
                AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-sky-100 font-medium">Liên hệ ngay</p>

            <button
              onClick={onRequestSupport}
              className="mt-3.5 w-full bg-[#0284C7] hover:bg-[#0369A1] active:bg-[#075985] text-white text-xs sm:text-[13px] font-semibold py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-sky-950/20 transition-all cursor-pointer hover:shadow-lg border border-sky-400/30"
            >
              <span>Gửi yêu cầu hỗ trợ</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
