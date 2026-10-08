import React, { useState } from 'react';
import { X, BookOpen, Code2, Terminal, Check, Copy, FileSpreadsheet, Rocket, Sparkles } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'sheets' | 'structure' | 'code' | 'deploy'>('sheets');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <BookOpen size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Cẩm Nang Kỹ Thuật & Hướng Dẫn Triển Khai</h3>
              <p className="text-xs text-slate-500">Google Sheets Publish to Web • Next.js App Router • GitHub & Vercel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection('sheets')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'sheets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>1. Google Sheets CSV</span>
          </button>
          <button
            onClick={() => setActiveSection('structure')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'structure'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 size={16} />
            <span>2. Cấu trúc thư mục</span>
          </button>
          <button
            onClick={() => setActiveSection('deploy')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSection === 'deploy'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Rocket size={16} />
            <span>3. Terminal & Deploy Vercel</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {activeSection === 'sheets' && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-slate-800">
                1. Cách tạo file Google Sheets & Lấy link CSV Publish to Web
              </h4>
              <p>
                Để trang web tự động cập nhật dữ liệu mà không cần tạo Google Cloud API Key phức tạp, ta dùng tính năng <strong>Publish to the web (Xuất bản lên web)</strong> định dạng <strong>CSV</strong>.
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800">Cấu trúc các cột trong Tab "Apps":</h5>
                <div className="font-mono text-xs bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-blue-700">
                  Tên | Mô tả | Link | Nhóm | Icon | Tag | Màu sắc
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                  <li><strong>Tên:</strong> Tên hiển thị (VD: Quản lý lớp học)</li>
                  <li><strong>Mô tả:</strong> 1-2 dòng tóm tắt (VD: Tra cứu danh sách lớp, sĩ số...)</li>
                  <li><strong>Link:</strong> Đường dẫn đích (VD: https://my-webapp.vercel.app)</li>
                  <li><strong>Nhóm:</strong> Tên nhóm danh mục (VD: Quản lý đào tạo, Hỗ trợ giảng dạy, Tiện ích chung)</li>
                  <li><strong>Icon:</strong> Tên icon Lucide (VD: Users, Calendar, FileText, BarChart3, Folder, Award...)</li>
                  <li><strong>Màu sắc:</strong> blue, green, orange, purple, pink, yellow, mint, cyan, indigo, slate</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800">Cấu trúc các cột trong Tab "ThongBao":</h5>
                <div className="font-mono text-xs bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto text-blue-700">
                  Tiêu đề | Ngày | Nội dung | Link | Màu
                </div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <h5 className="font-bold text-emerald-900">Cấu trúc các cột trong Tab "PhanQuyen" (Bảo mật Admin):</h5>
                <div className="font-mono text-xs bg-white p-3 rounded-xl border border-emerald-200 overflow-x-auto text-emerald-700">
                  Email | Mật khẩu | Họ tên | Quyền
                </div>
                <p className="text-xs text-emerald-800">
                  Chỉ những tài khoản có <code>Quyền = admin</code> mới có thể đăng nhập để thêm, sửa tên, đổi link truy cập. Khách truy cập web thông thường luôn ở quyền Người dùng (chỉ xem).
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-2">
                <h5 className="font-bold text-amber-900">⚠️ LƯU Ý SỬA LỖI ĐỒNG BỘ (Tránh lỗi chữ lạ function n(a)):</h5>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-amber-900">
                  <li>Mở file Google Sheets &rarr; bấm nút <strong>Chia sẻ (Share)</strong> ở góc trên bên phải.</li>
                  <li>Mục Quyền truy cập chung: chọn <strong>Bất kỳ ai có đường liên kết (Anyone with link)</strong> &rarr; chọn <strong>Người xem</strong>.</li>
                  <li>Nếu dùng email trường (@fe.edu.vn): khi bấm <strong>Tệp &rarr; Chia sẻ &rarr; Xuất bản lên web</strong>, phải <strong>bỏ tích</strong> ô <em>"Yêu cầu người xem đăng nhập..."</em> và chọn định dạng <strong>CSV</strong>.</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-800">Các bước Publish to Web:</h5>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Trên Google Sheets, vào thanh menu: <strong>Tệp (File) &rarr; Chia sẻ (Share) &rarr; Xuất bản lên web (Publish to web)</strong>.</li>
                  <li>Tại mục <strong>Liên kết (Link)</strong>, chọn trang tính cần xuất bản (ví dụ tab <em>Apps</em>).</li>
                  <li>Tại ô định dạng (mặc định là <em>Trang web</em>), đổi thành <strong>Giá trị được phân tách bằng dấu phẩy (.csv)</strong>.</li>
                  <li>Bấm nút <strong>Xuất bản (Publish)</strong> rồi copy link có đuôi <code>...output=csv</code>.</li>
                  <li>Dán link vào nút <strong>Google Sheets</strong> trên thanh tiêu đề của trang web này để trải nghiệm đồng bộ tức thì!</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'structure' && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-slate-800">
                2. Cấu trúc thư mục dự án Next.js (App Router) hoặc Vite
              </h4>
              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed">
{`my-portal/
├── app/                  # Next.js App Router (hoặc src/ với Vite)
│   ├── layout.tsx        # Cấu hình font & metadata SEO
│   ├── page.tsx          # Giao diện chính (2 cột: 70% Trái, 30% Phải)
│   └── globals.css       # Tailwind CSS styles
├── components/           # Các component giao diện tách biệt
│   ├── Header.tsx        # Header sticky, Logo, Menu, Search, Avatar
│   ├── Hero.tsx          # Banner trường, slogan, search bar, tags
│   ├── AppCard.tsx       # Card bo góc pastel, icon, hiệu ứng hover
│   ├── CategorySection.tsx # Nhóm danh mục lưới 4 cột
│   ├── SidebarWidgets.tsx# Thông báo mới, Tiện ích nhanh, Banner AI
│   └── DynamicIcon.tsx   # Render icon linh hoạt từ Lucide
├── services/
│   └── sheetsService.ts  # Fetch CSV từ Google Sheets + LocalStorage cache
├── types/
│   └── index.ts          # Định nghĩa kiểu dữ liệu TypeScript
├── public/               # Ảnh biểu tượng & tài sản tĩnh
├── tailwind.config.ts    # Cấu hình màu sắc pastel & border radius
├── package.json          # Danh sách thư viện (papaparse, lucide-react)
└── README.md`}
              </div>
            </div>
          )}

          {activeSection === 'deploy' && (
            <div className="space-y-4">
              <h4 className="font-bold text-base text-slate-800">
                3. Lệnh Terminal khởi tạo, đẩy lên GitHub và Deploy Vercel
              </h4>

              <div className="space-y-3">
                <div className="font-bold text-xs text-slate-700">Bước 1: Khởi tạo Git & commit toàn bộ mã nguồn:</div>
                <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs">
                  <pre>{`git init
git add .
git commit -m "feat: initial commit fpt polyschool portal webapp"`}</pre>
                  <button
                    onClick={() => copyCode("git init\ngit add .\ngit commit -m \"feat: initial commit fpt polyschool portal webapp\"", 'git1')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  >
                    {copiedKey === 'git1' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="font-bold text-xs text-slate-700">Bước 2: Tạo repository trên GitHub và Push:</div>
                <div className="relative bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs">
                  <pre>{`git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/my-portal.git
git push -u origin main`}</pre>
                  <button
                    onClick={() => copyCode("git branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/my-portal.git\ngit push -u origin main", 'git2')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  >
                    {copiedKey === 'git2' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="font-bold text-xs text-slate-700">Bước 3: Deploy lên Vercel (1-Click cực nhanh):</div>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Truy cập <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-blue-600 underline">vercel.com</a> và đăng nhập bằng tài khoản GitHub.</li>
                  <li>Bấm <strong>Add New... &rarr; Project</strong>.</li>
                  <li>Chọn repository <code>my-portal</code> vừa push lên.</li>
                  <li>Giữ nguyên cấu hình mặc định (Vercel tự động nhận diện Next.js hoặc Vite) và nhấn <strong>Deploy</strong>.</li>
                  <li>Trong vòng chưa đầy 1 phút, bạn sẽ nhận được đường link website chính thức dạng <code>https://my-portal.vercel.app</code> với tốc độ siêu tốc toàn cầu qua CDN Edge!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-xs transition-colors cursor-pointer"
          >
            Đã hiểu, quay lại trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};
