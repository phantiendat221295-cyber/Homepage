import React from 'react';
import { Search, Boxes, FileText, HelpCircle, Sparkles } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTag: string;
  onTagChange: (tag: string) => void;
  totalAppsCount: number;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  activeTag,
  onTagChange,
  totalAppsCount
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-[#EBF5FF] via-[#F0F9FF] to-[#E0F2FE] border-b border-sky-100 py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8">
      {/* Subtle architectural & sky background illustration */}
      <div className="absolute inset-0 pointer-events-none opacity-35 overflow-hidden">
        <svg
          viewBox="0 0 1440 380"
          className="w-full h-full object-cover object-right"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Sky soft gradients */}
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="bldgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Clouds */}
          <path d="M900 60 Q940 40 980 60 Q1020 50 1060 70 Q1040 100 900 100 Z" fill="#FFFFFF" opacity="0.6" />
          <path d="M1200 40 Q1240 25 1280 40 Q1310 30 1340 50 Q1330 80 1200 80 Z" fill="#FFFFFF" opacity="0.6" />

          {/* Flying Airplane */}
          <g transform="translate(1120, 48) rotate(-18) scale(0.65)" opacity="0.85">
            <path d="M0 20 L40 16 L70 0 L82 0 L62 16 L110 14 L125 4 L133 4 L124 16 L140 16 L145 19 L140 22 L124 22 L133 34 L125 34 L110 24 L62 22 L82 38 L70 38 L40 22 L0 20 Z" fill="#1E40AF" />
            {/* Vapor trail */}
            <path d="M-60 20 L0 20" stroke="#93C5FD" strokeWidth="2" strokeDasharray="6,4" />
          </g>

          {/* Campus Architectural silhouette on right side */}
          {/* Main campus block */}
          <rect x="740" y="140" width="260" height="180" rx="4" fill="url(#bldgGrad)" />
          {/* Windows / facade grid */}
          <g fill="#DBEAFE" opacity="0.7">
            <rect x="760" y="160" width="30" height="18" rx="2" />
            <rect x="800" y="160" width="30" height="18" rx="2" />
            <rect x="840" y="160" width="30" height="18" rx="2" />
            <rect x="880" y="160" width="30" height="18" rx="2" />
            <rect x="920" y="160" width="30" height="18" rx="2" />
            <rect x="760" y="190" width="30" height="18" rx="2" />
            <rect x="800" y="190" width="30" height="18" rx="2" />
            <rect x="840" y="190" width="30" height="18" rx="2" />
            <rect x="880" y="190" width="30" height="18" rx="2" />
            <rect x="920" y="190" width="30" height="18" rx="2" />
            <rect x="760" y="220" width="30" height="18" rx="2" />
            <rect x="800" y="220" width="30" height="18" rx="2" />
            <rect x="840" y="220" width="30" height="18" rx="2" />
            <rect x="880" y="220" width="30" height="18" rx="2" />
            <rect x="920" y="220" width="30" height="18" rx="2" />
          </g>

          {/* High-tech curved dome / center */}
          <path d="M1010 320 L1010 190 Q1120 150 1230 190 L1230 320 Z" fill="url(#bldgGrad)" opacity="0.7" />
          {/* Control tower / Future beacon */}
          <path d="M1290 320 L1305 130 L1335 130 L1350 320 Z" fill="#93C5FD" opacity="0.5" />
          <ellipse cx="1320" cy="125" rx="35" ry="12" fill="#3B82F6" opacity="0.6" />
          <ellipse cx="1320" cy="115" rx="22" ry="8" fill="#1D4ED8" opacity="0.7" />
          <line x1="1320" y1="107" x2="1320" y2="80" stroke="#1E40AF" strokeWidth="3" />

          {/* Trees / Greenery landscape */}
          <circle cx="720" cy="300" r="35" fill="#10B981" opacity="0.35" />
          <circle cx="760" cy="310" r="28" fill="#059669" opacity="0.3" />
          <circle cx="1020" cy="310" r="32" fill="#10B981" opacity="0.3" />
          <circle cx="1250" cy="310" r="40" fill="#059669" opacity="0.35" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text & Headlines */}
          <div className="lg:col-span-8 z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-[38px] font-extrabold text-slate-800 tracking-tight leading-tight">
              HỆ THỐNG ỨNG DỤNG HỖ TRỢ
            </h1>

            <div className="text-3xl sm:text-4xl lg:text-[46px] font-black text-[#0284C7] tracking-tight mt-1 leading-tight">
              QUẢN LÝ ĐÀO TẠO
            </div>

            <p className="mt-3 text-slate-500 font-medium text-sm sm:text-base flex items-center gap-2">
              <span>Kết nối</span>
              <span className="text-slate-300">•</span>
              <span>Đồng bộ</span>
              <span className="text-slate-300">•</span>
              <span>Hiệu quả</span>
            </p>
          </div>

          {/* Right Script Slogan (Kiến tạo thế hệ tương lai) */}
          <div className="hidden lg:flex lg:col-span-4 justify-end items-center pr-6">
            <div className="relative transform -rotate-6">
              <span
                className="text-3xl xl:text-4xl font-bold text-[#1D4ED8] drop-shadow-xs italic"
                style={{ fontFamily: "'Dancing Script', 'Be Vietnam Pro', cursive, sans-serif" }}
              >
                Kiến tạo thế hệ tương lai
              </span>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-transparent rounded-full mt-1 ml-auto" />
            </div>
          </div>
        </div>

        {/* Search Bar & Quick Filter Chips Container */}
        <div className="mt-8 sm:mt-10 max-w-4xl">
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-[0_4px_20px_rgba(37,99,235,0.08)] border border-blue-100 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Main Input */}
            <div className="relative flex-1 flex items-center px-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1 mr-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm webapp theo tên, chức năng, từ khóa..."
                className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm sm:text-[15px] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Quick Filter Tags (Webapp, Tài liệu, Hướng dẫn) */}
            <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 pl-0 md:pl-3 shrink-0 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={() => onTagChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTag === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <span>Tất cả</span>
              </button>

              <button
                onClick={() => onTagChange(activeTag === 'webapp' ? 'all' : 'webapp')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTag === 'webapp'
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]'
                }`}
              >
                <Boxes size={15} />
                <span>Webapp</span>
              </button>

              <button
                onClick={() => onTagChange(activeTag === 'tailieu' ? 'all' : 'tailieu')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTag === 'tailieu'
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]'
                }`}
              >
                <FileText size={15} />
                <span>Tài liệu</span>
              </button>

              <button
                onClick={() => onTagChange(activeTag === 'huongdan' ? 'all' : 'huongdan')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTag === 'huongdan'
                    ? 'bg-[#0284C7] text-white shadow-xs'
                    : 'bg-[#EFF6FF] text-[#1D4ED8] hover:bg-[#DBEAFE]'
                }`}
              >
                <HelpCircle size={15} />
                <span>Hướng dẫn</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
