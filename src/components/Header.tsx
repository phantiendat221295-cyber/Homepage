import React from 'react';
import { Home, FileText, Headphones, Search, ShieldCheck, User, Table, RefreshCw, KeyRound } from 'lucide-react';
import { FptPolySchoolLogo } from './FptPolySchoolLogo';

interface HeaderProps {
  activeTab: 'home' | 'roles' | 'tailieu' | 'support';
  onTabChange: (tab: 'home' | 'roles' | 'tailieu' | 'support') => void;
  headerSearch: string;
  onHeaderSearchChange: (value: string) => void;
  onOpenSheetConfig: () => void;
  onRefreshData?: () => void;
  isSyncing?: boolean;
  currentRole: 'user' | 'admin';
  onToggleRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  headerSearch,
  onHeaderSearchChange,
  onOpenSheetConfig,
  isSyncing,
  currentRole,
  onToggleRole
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* LEFT: OFFICIAL FPT POLYSCHOOL LOGO */}
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center cursor-pointer shrink-0 select-none group"
        >
          <FptPolySchoolLogo subText="ĐỒNG NAI" />
        </div>

        {/* CENTER: NAVIGATION MENU (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
          {/* 1. Trang chủ */}
          <button
            onClick={() => onTabChange('home')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer relative ${
              activeTab === 'home'
                ? 'text-[#0284C7]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home size={18} className={activeTab === 'home' ? 'text-[#0284C7]' : 'text-slate-500'} />
            <span>Trang chủ</span>
            {activeTab === 'home' && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0284C7] rounded-full" />
            )}
          </button>

          {/* 2. Phân quyền (Thay cho tab webapp cũ) */}
          <button
            onClick={() => onTabChange('roles')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer relative ${
              activeTab === 'roles'
                ? 'text-[#0284C7]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={18} className={activeTab === 'roles' ? 'text-[#0284C7]' : 'text-slate-500'} />
            <span>Phân quyền</span>
            {currentRole === 'admin' && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
                Admin
              </span>
            )}
            {activeTab === 'roles' && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0284C7] rounded-full" />
            )}
          </button>

          {/* 3. Tài liệu */}
          <button
            onClick={() => onTabChange('tailieu')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer relative ${
              activeTab === 'tailieu'
                ? 'text-[#0284C7]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText size={18} className={activeTab === 'tailieu' ? 'text-[#0284C7]' : 'text-slate-500'} />
            <span>Tài liệu</span>
            {activeTab === 'tailieu' && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0284C7] rounded-full" />
            )}
          </button>

          {/* 4. Hỗ trợ */}
          <button
            onClick={() => onTabChange('support')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer relative ${
              activeTab === 'support'
                ? 'text-[#0284C7]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Headphones size={18} className={activeTab === 'support' ? 'text-[#0284C7]' : 'text-slate-500'} />
            <span>Hỗ trợ</span>
            {activeTab === 'support' && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#0284C7] rounded-full" />
            )}
          </button>
        </nav>

        {/* RIGHT: SEARCH, ROLE BADGE & ACTIONS */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search on Top Header */}
          <div className="hidden lg:flex items-center relative w-52 xl:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => onHeaderSearchChange(e.target.value)}
              placeholder="Tìm kiếm webapp, tài liệu..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-slate-800 placeholder-slate-400 text-xs sm:text-[13px] rounded-xl pl-9 pr-3 py-2 border border-slate-200/80 focus:border-blue-400 focus:outline-none transition-all"
            />
          </div>

          {/* Role Toggle Switcher Badge */}
          <button
            onClick={onToggleRole}
            title={`Bấm để chuyển sang quyền ${currentRole === 'admin' ? 'Người dùng' : 'Quản trị viên'}`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              currentRole === 'admin'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {currentRole === 'admin' ? (
              <>
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Admin</span>
              </>
            ) : (
              <>
                <User size={14} className="text-slate-500" />
                <span className="hidden sm:inline">Người dùng</span>
              </>
            )}
          </button>

          {/* Firestore Cloud Sync Badge */}
          <div
            title="Dữ liệu đồng bộ trực tiếp với Google Firestore (homepage-35a0f)"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-800 text-xs font-semibold select-none"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Firestore Cloud</span>
          </div>

          {/* Google Sheets Sync Button */}
          <button
            onClick={onOpenSheetConfig}
            title="Cài đặt đồng bộ Google Sheets"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Table size={14} className="text-emerald-600" />
            <span className="hidden sm:inline">Google Sheets</span>
            {isSyncing && <RefreshCw size={12} className="animate-spin ml-0.5 text-emerald-600" />}
          </button>

          {/* User Profile Avatar */}
          <div
            onClick={() => onTabChange('roles')}
            title="Quản lý phân quyền"
            className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shadow-xs ${
              currentRole === 'admin'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-700'
                : 'bg-blue-50 border-[#0284C7] text-[#0284C7]'
            }`}
          >
            {currentRole === 'admin' ? <ShieldCheck size={18} /> : <User size={18} />}
          </div>
        </div>
      </div>

      {/* Mobile Submenu Bar (Loại bỏ Webapp, thêm Phân quyền) */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 px-2 py-2 bg-white">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium ${
            activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home size={18} />
          <span>Trang chủ</span>
        </button>
        <button
          onClick={() => onTabChange('roles')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium ${
            activeTab === 'roles' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldCheck size={18} />
          <span>Phân quyền</span>
        </button>
        <button
          onClick={() => onTabChange('tailieu')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium ${
            activeTab === 'tailieu' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <FileText size={18} />
          <span>Tài liệu</span>
        </button>
        <button
          onClick={() => onTabChange('support')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium ${
            activeTab === 'support' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Headphones size={18} />
          <span>Hỗ trợ</span>
        </button>
      </div>
    </header>
  );
};
