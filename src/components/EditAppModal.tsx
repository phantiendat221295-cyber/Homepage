import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Sparkles, Link as LinkIcon, Layers, Palette } from 'lucide-react';
import { WebAppItem } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface EditAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  app: WebAppItem | null;
  onSave: (app: WebAppItem) => void;
  onDelete?: (appId: string) => void;
  categories: string[];
}

const COMMON_ICONS = [
  'Users', 'Calendar', 'FileText', 'BarChart3', 'UserCheck', 'ClipboardCheck',
  'Folder', 'Award', 'User', 'QrCode', 'Cloud', 'Settings', 'GraduationCap',
  'BookOpen', 'BookMarked', 'LayoutGrid', 'Database', 'FileSpreadsheet', 'Globe', 'Headphones'
];

const COLOR_OPTIONS: { key: WebAppItem['colorTheme']; label: string; bg: string }[] = [
  { key: 'blue', label: 'Xanh dương', bg: 'bg-blue-500' },
  { key: 'green', label: 'Xanh lá', bg: 'bg-emerald-500' },
  { key: 'orange', label: 'Cam', bg: 'bg-orange-500' },
  { key: 'purple', label: 'Tím', bg: 'bg-purple-500' },
  { key: 'pink', label: 'Hồng', bg: 'bg-rose-500' },
  { key: 'yellow', label: 'Vàng', bg: 'bg-amber-400' },
  { key: 'mint', label: 'Xanh bạc hà', bg: 'bg-teal-500' },
  { key: 'cyan', label: 'Xanh ngọc', bg: 'bg-cyan-500' },
  { key: 'indigo', label: 'Chàm', bg: 'bg-indigo-500' },
  { key: 'slate', label: 'Xám', bg: 'bg-slate-500' }
];

export const EditAppModal: React.FC<EditAppModalProps> = ({
  isOpen,
  onClose,
  app,
  onSave,
  onDelete,
  categories
}) => {
  const isEditing = Boolean(app && app.id);

  const [formData, setFormData] = useState<WebAppItem>({
    id: '',
    title: '',
    description: '',
    url: '',
    category: categories[0] || 'Quản lý đào tạo',
    icon: 'Sparkles',
    tag: 'webapp',
    colorTheme: 'blue'
  });

  const [customCategory, setCustomCategory] = useState('');
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  useEffect(() => {
    if (app) {
      setFormData(app);
      setIsAddingNewCat(false);
      setCustomCategory('');
    } else {
      setFormData({
        id: `custom-${Date.now()}`,
        title: '',
        description: '',
        url: 'https://',
        category: categories[0] || 'Quản lý đào tạo',
        icon: 'Sparkles',
        tag: 'webapp',
        colorTheme: 'blue',
        isCustom: true
      });
      setIsAddingNewCat(false);
      setCustomCategory('');
    }
  }, [app, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const finalCategory = isAddingNewCat && customCategory.trim()
      ? customCategory.trim()
      : formData.category;

    onSave({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim(),
      url: formData.url.trim(),
      category: finalCategory,
      id: formData.id || `custom-${Date.now()}`,
      isCustom: true,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <DynamicIcon name={formData.icon} size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {isEditing ? 'Chỉnh sửa tiện ích webapp' : 'Thêm tiện ích webapp mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Cập nhật tên, link và phân loại' : 'Tạo thẻ tiện ích mới cho hệ thống'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Tên tiện ích */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên tiện ích / Webapp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="VD: Quản lý lớp học, Thời khóa biểu..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Link truy cập */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <LinkIcon size={13} className="text-blue-600" />
              <span>Đường dẫn link truy cập (URL) <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Mô tả ngắn */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả ngắn gọn (1 - 2 dòng)
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="VD: Tra cứu danh sách lớp, sĩ số, thông tin sinh viên..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Nhóm danh mục */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers size={13} className="text-blue-600" />
                <span>Nhóm danh mục</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                {isAddingNewCat ? 'Chọn nhóm có sẵn' : '+ Tạo nhóm mới'}
              </button>
            </label>

            {isAddingNewCat ? (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nhập tên nhóm danh mục mới..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* Chọn Icon */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-blue-600" />
              <span>Biểu tượng (Icon Lucide)</span>
            </label>
            <div className="grid grid-cols-10 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-28 overflow-y-auto">
              {COMMON_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: iconName })}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    formData.icon === iconName
                      ? 'bg-blue-600 text-white shadow-xs scale-105'
                      : 'hover:bg-slate-200 text-slate-600'
                  }`}
                  title={iconName}
                >
                  <DynamicIcon name={iconName} size={16} />
                </button>
              ))}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Hoặc tự nhập tên icon Lucide:</span>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="px-2 py-0.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded w-28 text-slate-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Chọn Màu sắc Pastel */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Palette size={13} className="text-blue-600" />
              <span>Màu sắc pastel của thẻ</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorTheme: col.key })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    formData.colorTheme === col.key
                      ? 'border-blue-600 ring-2 ring-blue-300 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${col.bg}`} />
                  <span>{col.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Thẻ lọc */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thẻ lọc nhanh
            </label>
            <div className="flex gap-2">
              {(['webapp', 'tailieu', 'huongdan'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, tag: t })}
                  className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    formData.tag === t
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'webapp' ? 'Webapp' : t === 'tailieu' ? 'Tài liệu' : 'Hướng dẫn'}
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa tiện ích "${formData.title}"?`)) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Xóa tiện ích</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save size={14} />
                <span>Lưu tiện ích</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
