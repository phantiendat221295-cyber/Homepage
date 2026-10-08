import React, { useState } from 'react';
import { X, Send, CheckCircle2, MessageSquare, Headphones, Mail, Phone, Bot } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailOrCode: '',
    category: 'technical',
    content: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      // Auto close after 2.5s
      // or let user close
    }, 2500);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFormData({ name: '', emailOrCode: '', category: 'technical', content: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Headphones size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Trung Tâm Hỗ Trợ Đào Tạo</h3>
              <p className="text-xs text-slate-500">Tiếp nhận yêu cầu kỹ thuật & phân quyền webapp</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-bold text-slate-800 text-lg">Đã gửi yêu cầu hỗ trợ thành công!</h4>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
              Đội ngũ Kỹ thuật & Quản trị hệ thống Đào tạo FPT Polyschool sẽ phản hồi qua email của bạn trong thời gian sớm nhất.
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và tên của bạn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Nguyễn Văn An"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email hoặc Mã Cán bộ / Giảng viên / Sinh viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.emailOrCode}
                onChange={(e) => setFormData({ ...formData, emailOrCode: e.target.value })}
                placeholder="VD: an.nv@fe.edu.vn"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vấn đề cần hỗ trợ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="technical">Hỗ trợ kỹ thuật / Không vào được link</option>
                <option value="permission">Cấp quyền truy cập webapp đào tạo</option>
                <option value="request_app">Đề xuất thêm webapp mới vào trang chủ</option>
                <option value="other">Ý kiến đóng góp khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nội dung chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Mô tả cụ thể tên ứng dụng hoặc lỗi bạn gặp phải..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Send size={14} />
                <span>Gửi yêu cầu</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
