import { WebAppItem, NotificationItem, QuickToolItem } from '../types';

export const DEFAULT_APPS: WebAppItem[] = [
  // Nhóm 1: Quản lý đào tạo
  {
    id: 'app-1',
    title: 'Quản lý lớp học',
    description: 'Tra cứu danh sách lớp, sĩ số, thông tin sinh viên',
    url: 'https://example.com/lop-hoc',
    category: 'Quản lý đào tạo',
    icon: 'Users',
    tag: 'webapp',
    colorTheme: 'blue'
  },
  {
    id: 'app-2',
    title: 'Thời khóa biểu',
    description: 'Tra cứu lịch học, phân công giảng viên',
    url: 'https://example.com/thoi-khoa-bieu',
    category: 'Quản lý đào tạo',
    icon: 'Calendar',
    tag: 'webapp',
    colorTheme: 'green'
  },
  {
    id: 'app-3',
    title: 'Nợ môn & Học phí',
    description: 'Theo dõi nợ môn, trạng thái đóng phí',
    url: 'https://example.com/hoc-phi',
    category: 'Quản lý đào tạo',
    icon: 'FileText',
    tag: 'webapp',
    colorTheme: 'orange'
  },
  {
    id: 'app-4',
    title: 'Báo cáo đào tạo',
    description: 'Thống kê, báo cáo, dữ liệu tổng hợp',
    url: 'https://example.com/bao-cao',
    category: 'Quản lý đào tạo',
    icon: 'BarChart3',
    tag: 'webapp',
    colorTheme: 'purple'
  },

  // Nhóm 2: Hỗ trợ giảng dạy
  {
    id: 'app-5',
    title: 'Quản lý giảng viên',
    description: 'Thông tin giảng viên, phân công giảng dạy',
    url: 'https://example.com/giang-vien',
    category: 'Hỗ trợ giảng dạy',
    icon: 'UserCheck',
    tag: 'webapp',
    colorTheme: 'pink'
  },
  {
    id: 'app-6',
    title: 'Đánh giá & Khảo sát',
    description: 'Khảo sát sinh viên, đánh giá giảng dạy',
    url: 'https://example.com/khao-sat',
    category: 'Hỗ trợ giảng dạy',
    icon: 'ClipboardCheck',
    tag: 'webapp',
    colorTheme: 'yellow'
  },
  {
    id: 'app-7',
    title: 'Tài liệu giảng dạy',
    description: 'Biểu mẫu, hướng dẫn, tài liệu tham khảo',
    url: 'https://example.com/tai-lieu-gd',
    category: 'Hỗ trợ giảng dạy',
    icon: 'Folder',
    tag: 'tailieu',
    colorTheme: 'mint'
  },
  {
    id: 'app-8',
    title: 'Tốt nghiệp & Chứng chỉ',
    description: 'Quản lý đồ án, xét duyệt, cấp bằng chứng chỉ',
    url: 'https://example.com/tot-nghiep',
    category: 'Hỗ trợ giảng dạy',
    icon: 'Award',
    tag: 'webapp',
    colorTheme: 'cyan'
  },

  // Nhóm 3: Tiện ích chung
  {
    id: 'app-9',
    title: 'Tra cứu sinh viên',
    description: 'Tìm kiếm thông tin sinh viên nhanh',
    url: 'https://example.com/tra-cuu-sv',
    category: 'Tiện ích chung',
    icon: 'User',
    tag: 'webapp',
    colorTheme: 'indigo'
  },
  {
    id: 'app-10',
    title: 'Tạo QR / Link biểu mẫu',
    description: 'Tạo nhanh link, QR code cho các biểu mẫu',
    url: 'https://example.com/tao-qr',
    category: 'Tiện ích chung',
    icon: 'QrCode',
    tag: 'webapp',
    colorTheme: 'cyan'
  },
  {
    id: 'app-11',
    title: 'Lưu trữ & Drive',
    description: 'Liên kết tài liệu Google Drive',
    url: 'https://drive.google.com',
    category: 'Tiện ích chung',
    icon: 'Cloud',
    tag: 'tailieu',
    colorTheme: 'pink'
  },
  {
    id: 'app-12',
    title: 'Công cụ hỗ trợ',
    description: 'Các tiện ích khác phục vụ công việc',
    url: 'https://example.com/cong-cu',
    category: 'Tiện ích chung',
    icon: 'Settings',
    tag: 'huongdan',
    colorTheme: 'slate'
  }
];

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'noti-1',
    title: 'Kế hoạch đào tạo Kỳ 4 (2026)',
    date: '08/10/2026',
    color: 'red',
    content: 'Phòng Đào tạo thông báo kế hoạch tổ chức giảng dạy và học tập Kỳ 4 năm học 2026. Đề nghị các phòng ban và giảng viên rà soát lịch biểu chi tiết.'
  },
  {
    id: 'noti-2',
    title: 'Hướng dẫn sử dụng hệ thống',
    date: '06/10/2026',
    color: 'blue',
    content: 'Tài liệu hướng dẫn chi tiết cách sử dụng hệ thống portal mới, tra cứu dữ liệu đào tạo và phân quyền cho giảng viên.'
  },
  {
    id: 'noti-3',
    title: 'Cập nhật danh sách giảng viên',
    date: '04/10/2026',
    color: 'purple',
    content: 'Danh sách giảng viên cơ hữu và thỉnh giảng học kỳ mới đã được đồng bộ vào hệ thống quản lý nhân sự đào tạo.'
  },
  {
    id: 'noti-4',
    title: 'Lịch bảo trì hệ thống',
    date: '02/10/2026',
    color: 'orange',
    content: 'Hệ thống máy chủ dữ liệu sẽ bảo trì định kỳ vào lúc 23:00 - 02:00 ngày 15/10/2026 để nâng cấp băng thông.'
  },
  {
    id: 'noti-5',
    title: 'Tài liệu tập huấn AI trong giảng dạy',
    date: '28/09/2026',
    color: 'green',
    content: 'Bộ tài liệu và slide workshop ứng dụng Trí tuệ nhân tạo (AI) trong soạn giáo án và chấm bài tập đã sẵn sàng để tải về.'
  }
];

export const DEFAULT_QUICK_TOOLS: QuickToolItem[] = [
  {
    id: 'qt-1',
    title: 'Google Drive',
    url: 'https://drive.google.com',
    icon: 'GoogleDrive'
  },
  {
    id: 'qt-2',
    title: 'Lịch công tác',
    url: 'https://calendar.google.com',
    icon: 'CalendarDays'
  },
  {
    id: 'qt-3',
    title: 'Biểu mẫu chung',
    url: 'https://docs.google.com/forms',
    icon: 'FileSpreadsheet'
  },
  {
    id: 'qt-4',
    title: 'Hỗ trợ kỹ thuật',
    url: '#support',
    icon: 'Headphones'
  }
];

export const CATEGORY_ICONS: Record<string, string> = {
  'Quản lý đào tạo': 'GraduationCap',
  'Hỗ trợ giảng dạy': 'BookOpen',
  'Tiện ích chung': 'LayoutGrid'
};
