import React from 'react';
import { WebAppItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { ChevronRight, Edit3, Trash2, ExternalLink } from 'lucide-react';

interface AppCardProps {
  app: WebAppItem;
  onOpen?: (app: WebAppItem) => void;
  isAdmin?: boolean;
  onEdit?: (app: WebAppItem) => void;
  onDelete?: (appId: string) => void;
}

const THEME_STYLES: Record<string, { iconBg: string; iconColor: string; btnBg: string; borderHover: string }> = {
  blue: {
    iconBg: 'bg-[#EBF5FF]',
    iconColor: 'text-[#2563EB]',
    btnBg: 'bg-[#60A5FA] hover:bg-[#3B82F6] text-white',
    borderHover: 'hover:border-blue-200'
  },
  green: {
    iconBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#10B981]',
    btnBg: 'bg-[#34D399] hover:bg-[#10B981] text-white',
    borderHover: 'hover:border-emerald-200'
  },
  orange: {
    iconBg: 'bg-[#FFF7ED]',
    iconColor: 'text-[#F97316]',
    btnBg: 'bg-[#FB923C] hover:bg-[#F97316] text-white',
    borderHover: 'hover:border-orange-200'
  },
  purple: {
    iconBg: 'bg-[#F5F3FF]',
    iconColor: 'text-[#8B5CF6]',
    btnBg: 'bg-[#A78BFA] hover:bg-[#8B5CF6] text-white',
    borderHover: 'hover:border-purple-200'
  },
  pink: {
    iconBg: 'bg-[#FFF1F2]',
    iconColor: 'text-[#F43F5E]',
    btnBg: 'bg-[#FB7185] hover:bg-[#F43F5E] text-white',
    borderHover: 'hover:border-rose-200'
  },
  yellow: {
    iconBg: 'bg-[#FEFCE8]',
    iconColor: 'text-[#EAB308]',
    btnBg: 'bg-[#FACC15] hover:bg-[#EAB308] text-slate-900',
    borderHover: 'hover:border-yellow-200'
  },
  mint: {
    iconBg: 'bg-[#F0FDFA]',
    iconColor: 'text-[#14B8A6]',
    btnBg: 'bg-[#2DD4BF] hover:bg-[#0D9488] text-white',
    borderHover: 'hover:border-teal-200'
  },
  cyan: {
    iconBg: 'bg-[#ECFEFF]',
    iconColor: 'text-[#06B6D4]',
    btnBg: 'bg-[#38BDF8] hover:bg-[#0284C7] text-white',
    borderHover: 'hover:border-cyan-200'
  },
  indigo: {
    iconBg: 'bg-[#EEF2FF]',
    iconColor: 'text-[#6366F1]',
    btnBg: 'bg-[#818CF8] hover:bg-[#6366F1] text-white',
    borderHover: 'hover:border-indigo-200'
  },
  slate: {
    iconBg: 'bg-[#F1F5F9]',
    iconColor: 'text-[#64748B]',
    btnBg: 'bg-[#94A3B8] hover:bg-[#64748B] text-white',
    borderHover: 'hover:border-slate-300'
  }
};

export const AppCard: React.FC<AppCardProps> = ({ app, onOpen, isAdmin, onEdit, onDelete }) => {
  const theme = THEME_STYLES[app.colorTheme || 'blue'] || THEME_STYLES.blue;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpen) {
      onOpen(app);
    } else if (app.url && app.url !== '#') {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 ${theme.borderHover}`}
    >
      <div>
        {/* Top bar with Pastel Icon Box and Admin controls */}
        <div className="flex items-start justify-between gap-2 mb-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${theme.iconBg} ${theme.iconColor}`}>
            <DynamicIcon name={app.icon} size={24} />
          </div>

          {/* Admin Edit / Delete Floating Buttons */}
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button
                  type="button"
                  title="Sửa tên và link tiện ích"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(app);
                  }}
                  className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                >
                  <Edit3 size={13} />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Xóa tiện ích"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Bạn có chắc muốn xóa "${app.title}"?`)) {
                      onDelete(app.id);
                    }
                  }}
                  className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-bold text-[15px] sm:text-base text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
          {app.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs sm:text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
          {app.description}
        </p>
      </div>

      {/* Action footer */}
      <div className="mt-3 pt-2 flex items-center justify-between">
        {isAdmin ? (
          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
            {app.url.replace(/^https?:\/\//, '')}
          </span>
        ) : <div />}

        <button
          aria-label={`Truy cập ${app.title}`}
          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-all duration-150 group-hover:scale-110 ${theme.btnBg}`}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};
