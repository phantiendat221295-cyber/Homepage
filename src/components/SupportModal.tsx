import React, { useState } from 'react';
import { X, Send, CheckCircle2, Headphones, Mail, Copy, Check } from 'lucide-react';
import { SupportTicket } from '../types';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTicket: (ticket: SupportTicket) => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, onSubmitTicket }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    emailOrCode: '',
    category: 'Hỗ trợ kỹ thuật / Không vào được link',
    content: ''
  });
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      name: formData.name.trim(),
      emailOrCode: formData.emailOrCode.trim(),
      category: formData.category,
      content: formData.content.trim(),
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      status: 'new'
    };

    onSubmitTicket(newTicket);
    setCreatedTicket(newTicket);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setCreatedTicket(null);
    setFormData({ name: '', emailOrCode: '', category: 'Hỗ trợ kỹ thuật / Không vào được link', content: '' });
    onClose();
  };

  const mailtoLink = createdTicket
    ? `mailto:Datpt70@fpt.edu.vn?subject=${encodeURIComponent(`[Yêu cầu hỗ trợ] ${createdTicket.category} - ${createdTicket.name}`)}&body=${encodeURIComponent(
        `Kính gửi Ban Đào Tạo FPT Polyschool,\n\nTôi là: ${createdTicket.name} (${createdTicket.emailOrCode})\nVấn đề: ${createdTicket.category}\n\nNội dung chi tiết:\n${createdTicket.content}\n\nThời gian gửi: ${createdTicket.createdAt}`
      )}`
    : '';

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

        {submitted && createdTicket ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg">Đã gửi yêu cầu hỗ trợ thành công!</h4>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Yêu cầu của bạn đã được ghi nhận vào <strong>Hộp thư Quản trị viên Đào tạo</strong> (Mã: #{createdTicket.id.slice(-6)}).
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
              <p><strong>Người gửi:</strong> {createdTicket.name} ({createdTicket.emailOrCode})</p>
              <p><strong>Vấn đề:</strong> {createdTicket.category}</p>
              <p><strong>Nội dung:</strong> {createdTicket.content}</p>
              <p><strong>Thời gian:</strong> {createdTicket.createdAt}</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href={mailtoLink}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Mail size={14} />
                <span>Mở email gửi trực tiếp</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Hoàn tất & Đóng
              </button>
            </div>
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
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
                placeholder="VD: Datpt70@fpt.edu.vn hoặc an.nv@fe.edu.vn"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vấn đề cần hỗ trợ
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Hỗ trợ kỹ thuật / Không vào được link">Hỗ trợ kỹ thuật / Không vào được link</option>
                <option value="Cấp quyền truy cập webapp đào tạo">Cấp quyền truy cập webapp đào tạo</option>
                <option value="Đề xuất thêm webapp mới vào trang chủ">Đề xuất thêm webapp mới vào trang chủ</option>
                <option value="Ý kiến đóng góp khác">Ý kiến đóng góp khác</option>
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
                <span>Gửi yêu cầu hỗ trợ</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
