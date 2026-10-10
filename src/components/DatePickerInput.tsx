import React, { useRef } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerInputProps {
  id?: string;
  label?: string;
  value: string; // Định dạng DD/MM/YYYY (hoặc rỗng)
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  min?: string;
  max?: string;
  helperText?: string;
}

/**
 * Chuyển chuỗi ngày từ hiển thị (DD/MM/YYYY hoặc D/M/YYYY) sang chuẩn HTML5 input type="date" (YYYY-MM-DD)
 */
export function formatToHtmlDate(displayDate: string): string {
  if (!displayDate || !displayDate.trim()) return '';
  const trimmed = displayDate.trim();

  // Đã là YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Dạng DD/MM/YYYY hoặc D/M/YYYY hoặc DD-MM-YYYY
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];

    if (day.length === 4) {
      // YYYY/MM/DD
      year = parts[0];
      month = parts[1];
      day = parts[2];
    }

    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${m}-${d}`;
  }

  // Thử parse Date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Chuyển chuỗi ngày từ HTML5 input type="date" (YYYY-MM-DD) sang định dạng lưu trữ hệ thống (DD/MM/YYYY)
 */
export function formatFromHtmlDate(htmlDate: string): string {
  if (!htmlDate || !htmlDate.trim()) return '';
  const trimmed = htmlDate.trim();
  const parts = trimmed.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Chọn ngày...',
  allowClear = true,
  required = false,
  disabled = false,
  className = '',
  min,
  max,
  helperText
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const htmlDateValue = formatToHtmlDate(value);

  const handleOpenPicker = () => {
    if (disabled) return;
    if (inputRef.current) {
      try {
        if (typeof inputRef.current.showPicker === 'function') {
          inputRef.current.showPicker();
        } else {
          inputRef.current.focus();
        }
      } catch {
        inputRef.current.focus();
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) {
      onChange('');
    } else {
      onChange(formatFromHtmlDate(rawVal));
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    onChange(`${d}/${m}/${y}`);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label htmlFor={id} className="block text-xs font-bold text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
          <button
            type="button"
            onClick={handleSetToday}
            className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            Hôm nay
          </button>
        </div>
      )}

      <div
        onClick={handleOpenPicker}
        className={`relative flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl transition-all ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-100'
            : 'hover:border-slate-300 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 cursor-pointer'
        }`}
      >
        {/* Biểu tượng Lịch có thể click để mở hộp thoại chọn ngày */}
        <button
          type="button"
          onClick={handleOpenPicker}
          disabled={disabled}
          title="Nhấn để mở lịch chọn ngày"
          className="pl-3.5 pr-2 py-2 text-blue-600 hover:text-blue-700 cursor-pointer focus:outline-none flex items-center justify-center shrink-0"
        >
          <Calendar size={18} />
        </button>

        {/* Input date HTML5 hỗ trợ native calendar popup trên cả Mobile & Desktop */}
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={htmlDateValue}
          onChange={handleDateChange}
          min={min}
          max={max}
          required={required}
          disabled={disabled}
          className="w-full bg-transparent py-2 pr-2 text-xs sm:text-sm text-slate-800 font-medium focus:outline-none cursor-pointer"
        />

        {/* Text hiển thị định dạng ngày chuẩn DD/MM/YYYY */}
        <div className="hidden sm:flex items-center pr-2 shrink-0 pointer-events-none">
          <span className="text-[11px] font-semibold text-slate-400 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60 shadow-2xs">
            {value ? value : placeholder}
          </span>
        </div>

        {/* Nút xóa ngày nhanh (đặc biệt cho Hạn hoàn thành tùy chọn) */}
        {allowClear && Boolean(value) && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Xóa ngày đã chọn"
            className="mr-2.5 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 mt-1">{helperText}</p>
      )}
    </div>
  );
};
