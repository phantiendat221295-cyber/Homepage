import React from 'react';
import { WebAppItem } from '../types';
import { AppCard } from './AppCard';
import { DynamicIcon } from './DynamicIcon';
import { ArrowRight, Plus } from 'lucide-react';

interface CategorySectionProps {
  title: string;
  iconName?: string;
  apps: WebAppItem[];
  onAppClick: (app: WebAppItem) => void;
  onViewAll?: (category: string) => void;
  isAdmin?: boolean;
  onEditApp?: (app: WebAppItem) => void;
  onDeleteApp?: (appId: string) => void;
  onAddAppToCategory?: (category: string) => void;
}

const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  'Quản lý đào tạo': 'GraduationCap',
  'Hỗ trợ giảng dạy': 'BookOpen',
  'Tiện ích chung': 'LayoutGrid'
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  iconName,
  apps,
  onAppClick,
  onViewAll,
  isAdmin,
  onEditApp,
  onDeleteApp,
  onAddAppToCategory
}) => {
  if (apps.length === 0 && !isAdmin) return null;

  const icon = iconName || DEFAULT_CATEGORY_ICONS[title] || 'Folder';

  return (
    <section className="mb-8 sm:mb-10">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="text-[#1E40AF]">
            <DynamicIcon name={icon} size={22} className="w-5 h-5 sm:w-6 sm:h-6 text-[#1E3A8A]" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
            {apps.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && onAddAppToCategory && (
            <button
              onClick={() => onAddAppToCategory(title)}
              className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Thêm vào nhóm</span>
            </button>
          )}

          {onViewAll && (
            <button
              onClick={() => onViewAll(title)}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 group transition-colors cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            onOpen={onAppClick}
            isAdmin={isAdmin}
            onEdit={onEditApp}
            onDelete={onDeleteApp}
          />
        ))}

        {isAdmin && onAddAppToCategory && (
          <button
            onClick={() => onAddAppToCategory(title)}
            className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-blue-600 font-semibold text-xs sm:text-sm transition-all cursor-pointer min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Plus size={20} />
            </div>
            <span>+ Thêm tiện ích mới</span>
          </button>
        )}
      </div>
    </section>
  );
};
