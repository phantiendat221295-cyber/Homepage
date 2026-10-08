import React from 'react';
import { Heart, Shield, HelpCircle, FileText, Globe } from 'lucide-react';
import { FptPolySchoolLogo } from './FptPolySchoolLogo';

interface FooterProps {
  onOpenGuide: () => void;
  onOpenSupport: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenGuide, onOpenSupport }) => {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
        {/* Brand & info */}
        <div className="flex items-center gap-3">
          <FptPolySchoolLogo className="h-8" subText="ĐỒNG NAI" />
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={onOpenGuide}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>Hướng dẫn sử dụng & Deploy</span>
          </button>
          <button
            onClick={onOpenSupport}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle size={14} />
            <span>Liên hệ hỗ trợ</span>
          </button>
          <span className="text-slate-400">
            © {new Date().getFullYear()} FPT Education. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

