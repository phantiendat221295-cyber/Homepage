import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { WebAppItem, NotificationItem, SupportTicket, GoogleSheetsConfig, AdminAccount } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isPermissionError =
    errMsg.toLowerCase().includes('permission') ||
    errMsg.toLowerCase().includes('insufficient') ||
    errMsg.toLowerCase().includes('denied');

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('[Firestore Offline/Transient]:', errMsg, `(path: ${path})`);
    return errInfo;
  }
}

// Hàm lọc bỏ các trường mang giá trị `undefined` để Firestore không báo lỗi
function sanitizeData<T extends Record<string, any>>(data: T): Partial<T> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized as Partial<T>;
}

// Kiểm tra kết nối tới Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'settings', 'portal_config');
    const res = await getDocFromServer(testRef).catch(() => null);
    return res !== null;
  } catch {
    return false;
  }
}

// ==========================================
// 1. QUẢN LÝ TIỆN ÍCH WEBAPPS (COLLECTION: apps)
// ==========================================

export const APPS_COLLECTION = 'apps';

/**
 * Lấy toàn bộ danh sách WebApps từ Firestore
 */
export async function getAppsFromFirestore(): Promise<WebAppItem[]> {
  try {
    const appsRef = collection(db, APPS_COLLECTION);
    const snapshot = await getDocs(appsRef);
    const items: WebAppItem[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as Omit<WebAppItem, 'id'>) });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, APPS_COLLECTION);
    return [];
  }
}

/**
 * Đăng ký lắng nghe thay đổi WebApps theo thời gian thực (Realtime onSnapshot)
 */
export function subscribeApps(
  onUpdate: (apps: WebAppItem[]) => void,
  onError?: (err: any) => void
): () => void {
  const appsRef = collection(db, APPS_COLLECTION);
  return onSnapshot(
    appsRef,
    (snapshot) => {
      const items: WebAppItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<WebAppItem, 'id'>) });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, APPS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Thêm hoặc Cập nhật Tiện ích lên Firestore
 */
export async function saveAppToFirestore(app: WebAppItem): Promise<void> {
  const docId = app.id || `app-${Date.now()}`;
  const docRef = doc(db, APPS_COLLECTION, docId);
  const payload = sanitizeData({
    ...app,
    id: docId,
    updatedAt: new Date().toISOString()
  });

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${APPS_COLLECTION}/${docId}`);
    throw error;
  }
}

/**
 * Xóa Tiện ích khỏi Firestore
 */
export async function deleteAppFromFirestore(appId: string): Promise<void> {
  const docRef = doc(db, APPS_COLLECTION, appId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${APPS_COLLECTION}/${appId}`);
    throw error;
  }
}

/**
 * Khởi tạo dữ liệu mẫu lên Firestore nếu collection còn trống
 */
export async function seedInitialAppsIfEmpty(defaultApps: WebAppItem[]): Promise<WebAppItem[]> {
  try {
    const existing = await getAppsFromFirestore();
    if (existing && existing.length > 0) {
      return existing;
    }

    // Chỉ Admin đã xác thực mới có quyền ghi dữ liệu apps ban đầu lên Firestore
    if (!auth.currentUser) {
      return defaultApps;
    }

    const batch = writeBatch(db);
    defaultApps.forEach((item) => {
      const docRef = doc(db, APPS_COLLECTION, item.id);
      batch.set(docRef, sanitizeData({ ...item, updatedAt: new Date().toISOString() }));
    });
    await batch.commit();
    return defaultApps;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, APPS_COLLECTION);
    return defaultApps;
  }
}

// ==========================================
// 2. QUẢN LÝ HỘP THƯ HỖ TRỢ (COLLECTION: support_tickets)
// ==========================================

export const TICKETS_COLLECTION = 'support_tickets';

/**
 * Lấy danh sách yêu cầu hỗ trợ từ Firestore (Chỉ dành cho Admin đã đăng nhập)
 */
export async function getTicketsFromFirestore(): Promise<SupportTicket[]> {
  if (!auth.currentUser) {
    return [];
  }
  try {
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    const snapshot = await getDocs(ticketsRef);
    const items: SupportTicket[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as Omit<SupportTicket, 'id'>) });
    });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TICKETS_COLLECTION);
    return [];
  }
}

/**
 * Lắng nghe yêu cầu hỗ trợ theo thời gian thực (Chỉ dành cho Admin đã đăng nhập)
 */
export function subscribeTickets(
  onUpdate: (tickets: SupportTicket[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!auth.currentUser) {
    return () => {};
  }
  const ticketsRef = collection(db, TICKETS_COLLECTION);
  return onSnapshot(
    ticketsRef,
    (snapshot) => {
      const items: SupportTicket[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<SupportTicket, 'id'>) });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, TICKETS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Gửi yêu cầu hỗ trợ mới lên Firestore
 */
export async function saveTicketToFirestore(ticket: SupportTicket): Promise<void> {
  const docId = ticket.id || `ticket-${Date.now()}`;
  const docRef = doc(db, TICKETS_COLLECTION, docId);
  try {
    await setDoc(docRef, sanitizeData({ ...ticket, id: docId }), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TICKETS_COLLECTION}/${docId}`);
    throw error;
  }
}

/**
 * Cập nhật trạng thái yêu cầu hỗ trợ (mới / đã xử lý)
 */
export async function updateTicketStatusInFirestore(
  ticketId: string,
  status: 'new' | 'resolved'
): Promise<void> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  try {
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TICKETS_COLLECTION}/${ticketId}`);
    throw error;
  }
}

/**
 * Xóa yêu cầu hỗ trợ khỏi Firestore
 */
export async function deleteTicketFromFirestore(ticketId: string): Promise<void> {
  const docRef = doc(db, TICKETS_COLLECTION, ticketId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TICKETS_COLLECTION}/${ticketId}`);
    throw error;
  }
}

// ==========================================
// 3. QUẢN LÝ CẤU HÌNH & THÔNG BÁO (COLLECTION: settings, notifications)
// ==========================================

export const SETTINGS_COLLECTION = 'settings';
export const PORTAL_CONFIG_DOC = 'portal_config';
export const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Lấy cấu hình hệ thống đã lưu trên Firestore
 */
export async function getPortalConfigFromFirestore(): Promise<GoogleSheetsConfig | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PORTAL_CONFIG_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as GoogleSheetsConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${SETTINGS_COLLECTION}/${PORTAL_CONFIG_DOC}`);
    return null;
  }
}

/**
 * Lưu cấu hình hệ thống lên Firestore
 */
export async function savePortalConfigToFirestore(config: GoogleSheetsConfig): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, PORTAL_CONFIG_DOC);
    await setDoc(
      docRef,
      sanitizeData({
        ...config,
        updatedAt: new Date().toISOString()
      }),
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SETTINGS_COLLECTION}/${PORTAL_CONFIG_DOC}`);
    throw error;
  }
}

/**
 * Lắng nghe danh sách thông báo theo thời gian thực (Realtime onSnapshot)
 * Công khai cho tất cả người dùng xem
 */
export function subscribeNotifications(
  onUpdate: (notis: NotificationItem[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, NOTIFICATIONS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((snap) => {
        items.push({ id: snap.id, ...(snap.data() as Omit<NotificationItem, 'id'>) });
      });
      // Sắp xếp thông báo mới nhất lên đầu
      items.sort((a, b) => new Date(b.date || b.updatedAt || 0).getTime() - new Date(a.date || a.updatedAt || 0).getTime());
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, NOTIFICATIONS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Lấy danh sách thông báo từ Firestore
 */
export async function getNotificationsFromFirestore(): Promise<NotificationItem[]> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const items: NotificationItem[] = [];
    snapshot.forEach((snap) => {
      items.push({ id: snap.id, ...(snap.data() as Omit<NotificationItem, 'id'>) });
    });
    return items.sort((a, b) => new Date(b.date || b.updatedAt || 0).getTime() - new Date(a.date || a.updatedAt || 0).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOTIFICATIONS_COLLECTION);
    return [];
  }
}

/**
 * Lưu 1 thông báo lên Firestore (Thêm mới hoặc Cập nhật)
 */
export async function saveNotificationToFirestore(item: NotificationItem): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, item.id);
  const dataToSave = sanitizeData({
    ...item,
    updatedAt: new Date().toISOString()
  });
  try {
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${NOTIFICATIONS_COLLECTION}/${item.id}`);
    throw error;
  }
}

/**
 * Cập nhật checklist của thông báo (Dành cho người được giao hoặc Admin)
 */
export async function updateNotificationChecklistInFirestore(
  id: string,
  checklist: any[]
): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  try {
    await updateDoc(docRef, {
      checklist: checklist.map((c) => sanitizeData(c)),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOTIFICATIONS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Xóa 1 thông báo khỏi Firestore
 */
export async function deleteNotificationFromFirestore(id: string): Promise<void> {
  const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${NOTIFICATIONS_COLLECTION}/${id}`);
    throw error;
  }
}

/**
 * Lưu danh sách thông báo lên Firestore
 */
export async function saveNotificationsToFirestore(notis: NotificationItem[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    notis.forEach((item) => {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, item.id);
      batch.set(docRef, sanitizeData(item), { merge: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, NOTIFICATIONS_COLLECTION);
    throw error;
  }
}

/**
 * Khởi tạo dữ liệu mẫu thông báo lên Firestore nếu collection còn trống
 */
export async function seedInitialNotificationsIfEmpty(
  defaultNotis: NotificationItem[]
): Promise<NotificationItem[]> {
  try {
    const existing = await getNotificationsFromFirestore();
    if (existing && existing.length > 0) {
      return existing;
    }

    if (!auth.currentUser) {
      return defaultNotis;
    }

    const batch = writeBatch(db);
    defaultNotis.forEach((item) => {
      const docRef = doc(db, NOTIFICATIONS_COLLECTION, item.id);
      batch.set(docRef, sanitizeData({ ...item, updatedAt: new Date().toISOString() }));
    });
    await batch.commit();
    return defaultNotis;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, NOTIFICATIONS_COLLECTION);
    return defaultNotis;
  }
}

// ==========================================
// 4. QUẢN LÝ PHÂN QUYỀN ADMIN - DUY NHẤT COLLECTION admin_users
// ==========================================

export const ADMINS_COLLECTION = 'admin_users';

// Quản trị viên cấp cao (Super Admin) duy nhất có quyền xem phân quyền, thêm hoặc thu hồi admin
export const SYSTEM_SUPER_ADMINS = ['datpt60@fpt.edu.vn', 'phantiendat221295@gmail.com'];

// Danh sách 8 quản trị viên ban đầu (dùng khi Super Admin chủ động bấm Khôi phục mẫu)
export const INITIAL_TEMPLATE_ADMINS: AdminAccount[] = [
  {
    email: 'datpt60@fpt.edu.vn',
    name: 'Phan Tiến Đạt (Đào tạo)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: true,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'phantiendat221295@gmail.com',
    name: 'Phan Tiến Đạt',
    role: 'admin',
    status: 'active',
    isSuperAdmin: true,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'thuanl2@fpt.edu.vn',
    name: 'Thuận (thuanl2)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'vylnu@fpt.edu.vn',
    name: 'Vỹ (vylnu)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'loiqt@fpt.edu.vn',
    name: 'Lợi (loiqt)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'duocdty2@fpt.edu.vn',
    name: 'Dược (duocdty2)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'dienvnn@fpt.edu.vn',
    name: 'Điền (dienvnn)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'thainh44@fpt.edu.vn',
    name: 'Thái (thainh44)',
    role: 'admin',
    status: 'active',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  }
];

export const DEFAULT_ADMIN_USERS = INITIAL_TEMPLATE_ADMINS;

/**
 * Định danh document chuẩn hóa: Email viết thường, loại bỏ khoảng trắng.
 * Cho phép đối chiếu trực tiếp với request.auth.token.email trong Firestore Security Rules.
 */
export const getAdminDocId = (email: string) => {
  return email.toLowerCase().trim();
};

/**
 * Kiểm tra xem một email có quyền admin hay không.
 * CHỈ 2 Super Admin là vĩnh viễn trong code.
 * Tất cả các admin khác BẮT BUỘC phải có role là 'admin' VÀ status là 'active'.
 */
export function checkIsAdmin(email: string, activeAdmins: AdminAccount[]): boolean {
  if (!email || !email.trim()) return false;
  const clean = email.toLowerCase().trim();

  // 1. Duy nhất 2 Super Admin luôn có quyền quản trị tối cao
  if (SYSTEM_SUPER_ADMINS.includes(clean)) {
    return true;
  }

  // 2. Các admin khác: Bắt buộc phải còn tồn tại trong danh sách activeAdmins với role: admin và status: active
  if (Array.isArray(activeAdmins)) {
    return activeAdmins.some(
      (a) =>
        a.email &&
        a.email.toLowerCase().trim() === clean &&
        a.role === 'admin' &&
        a.status !== 'revoked'
    );
  }

  return false;
}

/**
 * Lấy danh sách Người dùng & Quản trị viên TỪ MỘT NGUỒN DUY NHẤT: collection 'admin_users'
 * Có cơ chế tự động chuyển đổi an toàn (migration) từ settings/portal_admins nếu collection mới còn trống.
 */
export async function getAdminUsersFromFirestore(): Promise<AdminAccount[]> {
  const accountsMap = new Map<string, AdminAccount>();

  // Nếu chưa đăng nhập Firebase Auth, không thực hiện list query để tránh lỗi thiếu quyền
  if (!auth.currentUser) {
    SYSTEM_SUPER_ADMINS.forEach((email) => {
      accountsMap.set(email, {
        email,
        name: email === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt',
        role: 'admin',
        status: 'active',
        isSuperAdmin: true,
        addedAt: '2025-01-01',
        addedBy: 'Hệ thống'
      });
    });
    return Array.from(accountsMap.values());
  }

  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    const snap = await getDocs(colRef);

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const rawEmail = (d.email || '').toLowerCase().trim();
      if (rawEmail) {
        const isSuper = SYSTEM_SUPER_ADMINS.includes(rawEmail) || Boolean(d.isSuperAdmin);
        const status = d.status === 'revoked' || d.role === 'user' ? 'revoked' : 'active';
        const role = status === 'revoked' ? 'user' : (d.role === 'admin' || isSuper ? 'admin' : 'user');

        accountsMap.set(rawEmail, {
          email: rawEmail,
          uid: d.uid,
          name: d.name || rawEmail.split('@')[0],
          role: isSuper ? 'admin' : role,
          status: isSuper ? 'active' : status,
          isSuperAdmin: isSuper,
          addedAt: d.addedAt || '2025-01-01',
          addedBy: d.addedBy || 'Hệ thống',
          updatedAt: d.updatedAt,
          updatedBy: d.updatedBy,
          lastLogin: d.lastLogin
        });
      }
    });

    // MIGRATION 1 LẦN: Nếu collection admin_users chưa có dữ liệu nào nhưng settings/portal_admins có:
    if (accountsMap.size === 0) {
      try {
        const oldSettingsDoc = doc(db, 'settings', 'portal_admins');
        const oldSnap = await getDoc(oldSettingsDoc);
        if (oldSnap.exists() && Array.isArray(oldSnap.data()?.admins)) {
          console.info('[Migration] Tự động sao lưu & chuyển đổi dữ liệu từ portal_admins sang admin_users...');
          const oldList: AdminAccount[] = oldSnap.data()?.admins;
          for (const item of oldList) {
            const clean = (item.email || '').toLowerCase().trim();
            if (clean) {
              const isSuper = SYSTEM_SUPER_ADMINS.includes(clean);
              const status = item.role === 'user' ? 'revoked' : 'active';
              const migratedAcc: AdminAccount = {
                ...item,
                email: clean,
                role: isSuper ? 'admin' : (status === 'revoked' ? 'user' : 'admin'),
                status: isSuper ? 'active' : status,
                isSuperAdmin: isSuper
              };
              accountsMap.set(clean, migratedAcc);
              // Lưu vào document chuẩn theo email
              await setDoc(doc(db, ADMINS_COLLECTION, clean), sanitizeData(migratedAcc), { merge: true }).catch(() => null);
            }
          }
        }
      } catch (migErr) {
        console.warn('[Migration warning]:', migErr);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, ADMINS_COLLECTION);
  }

  // 3. Luôn đảm bảo 2 Super Admin khởi tạo luôn có mặt với role admin và status active
  SYSTEM_SUPER_ADMINS.forEach((email) => {
    const existing = accountsMap.get(email);
    accountsMap.set(email, {
      email,
      name: existing?.name || (email === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt'),
      role: 'admin',
      status: 'active',
      isSuperAdmin: true,
      addedAt: existing?.addedAt || '2025-01-01',
      addedBy: 'Hệ thống',
      lastLogin: existing?.lastLogin
    });
  });

  return Array.from(accountsMap.values());
}

/**
 * Lắng nghe danh sách Quản trị viên theo thời gian thực (Realtime onSnapshot)
 * DUY NHẤT từ collection 'admin_users'
 */
export function subscribeAdminUsers(
  onUpdate: (admins: AdminAccount[]) => void,
  onError?: (err: any) => void
): () => void {
  // Nếu chưa đăng nhập, không mở realtime listener tới admin_users
  if (!auth.currentUser) {
    return () => {};
  }
  const colRef = collection(db, ADMINS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const accountsMap = new Map<string, AdminAccount>();

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const email = (d.email || '').toLowerCase().trim();
        if (email) {
          const isSuper = SYSTEM_SUPER_ADMINS.includes(email) || Boolean(d.isSuperAdmin);
          const status = d.status === 'revoked' || d.role === 'user' ? 'revoked' : 'active';
          const role = status === 'revoked' ? 'user' : (d.role === 'admin' || isSuper ? 'admin' : 'user');

          accountsMap.set(email, {
            email,
            uid: d.uid,
            name: d.name || email.split('@')[0],
            role: isSuper ? 'admin' : role,
            status: isSuper ? 'active' : status,
            isSuperAdmin: isSuper,
            addedAt: d.addedAt || '2025-01-01',
            addedBy: d.addedBy || 'Hệ thống',
            updatedAt: d.updatedAt,
            updatedBy: d.updatedBy,
            lastLogin: d.lastLogin
          });
        }
      });

      // Đảm bảo Super Admin luôn hiện diện
      SYSTEM_SUPER_ADMINS.forEach((email) => {
        const existing = accountsMap.get(email);
        accountsMap.set(email, {
          email,
          name: existing?.name || (email === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt'),
          role: 'admin',
          status: 'active',
          isSuperAdmin: true,
          addedAt: existing?.addedAt || '2025-01-01',
          addedBy: 'Hệ thống',
          lastLogin: existing?.lastLogin
        });
      });

      onUpdate(Array.from(accountsMap.values()));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, ADMINS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Cập nhật role của người dùng ('admin' hoặc 'user')
 * Ghi trực tiếp và nguyên tử vào collection 'admin_users/{cleanEmail}'
 * NÉM LỖI RÕ RÀNG nếu Firestore từ chối để UI thông báo chính xác
 */
export async function updateUserRoleInFirestore(
  email: string,
  newRole: 'admin' | 'user',
  updatedBy?: string
): Promise<AdminAccount[]> {
  const cleanEmail = email.toLowerCase().trim();
  if (SYSTEM_SUPER_ADMINS.includes(cleanEmail)) {
    throw new Error('Không thể thay đổi quyền của Super Admin hệ thống!');
  }

  const newStatus = newRole === 'admin' ? 'active' : 'revoked';
  const userDocRef = doc(db, ADMINS_COLLECTION, cleanEmail);

  // Đọc document hiện tại để bảo toàn uid và name nếu có
  let existingUid: string | undefined;
  let existingName: string | undefined;
  try {
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      existingUid = existingSnap.data()?.uid;
      existingName = existingSnap.data()?.name;
    }
  } catch {
    // ignore
  }

  const payload: Partial<AdminAccount> = sanitizeData({
    email: cleanEmail,
    name: existingName || cleanEmail.split('@')[0],
    role: newRole,
    status: newStatus,
    isSuperAdmin: false,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || 'Super Admin'
  });

  if (existingUid) {
    payload.uid = existingUid;
  }

  // 1. Ghi vào document chính theo Email (NÉM LỖI NẾU THẤT BẠI - KHÔNG ĐƯỢC NUỐT LỖI)
  try {
    await setDoc(userDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ADMINS_COLLECTION}/${cleanEmail}`);
    throw error;
  }

  // 2. Nếu đã có Firebase UID, đồng bộ bản ghi theo UID để Firestore Security Rules kiểm tra tức thì
  if (existingUid) {
    try {
      const uidDocRef = doc(db, ADMINS_COLLECTION, existingUid);
      await setDoc(uidDocRef, payload, { merge: true });
    } catch {
      // ignore
    }
  }

  // Lấy danh sách mới nhất xác nhận từ Firestore
  return await getAdminUsersFromFirestore();
}

/**
 * Thêm hoặc cấp lại quyền Admin cho một email
 */
export async function addAdminUserToFirestore(admin: {
  email: string;
  name?: string;
  addedBy?: string;
}): Promise<AdminAccount[]> {
  const cleanEmail = admin.email.toLowerCase().trim();
  return updateUserRoleInFirestore(cleanEmail, 'admin', admin.addedBy || 'Super Admin');
}

/**
 * Thu hồi quyền Quản trị viên (Đổi role từ 'admin' thành 'user', status: 'revoked')
 * Đảm bảo document vẫn tồn tại trong Firestore với role: 'user' và status: 'revoked'
 */
export async function removeAdminUserFromFirestore(email: string): Promise<AdminAccount[]> {
  return updateUserRoleInFirestore(email, 'user', 'Super Admin');
}

/**
 * Xử lý khi user đăng nhập (Firebase / Google Auth)
 * - Kiểm tra bản ghi từ Firestore bằng getDocFromServer để tránh cache cũ.
 * - Nếu status === 'revoked' hoặc role === 'user': isAuthorizedAdmin = false!
 * - TUYỆT ĐỐI KHÔNG GHI ĐÈ role nếu đã tồn tại.
 * - Chỉ cập nhật lastLogin và uid với merge: true.
 */
export async function handleUserLoginAuthCheck(
  email: string,
  profileName?: string,
  firebaseUid?: string
): Promise<{ isAuthorizedAdmin: boolean; role: 'admin' | 'user'; account: AdminAccount }> {
  const cleanEmail = email.toLowerCase().trim();
  const isSuper = SYSTEM_SUPER_ADMINS.includes(cleanEmail);

  // 1. Super Admin luôn có quyền tối cao
  if (isSuper) {
    const superAcc: AdminAccount = {
      email: cleanEmail,
      uid: firebaseUid || auth.currentUser?.uid,
      name: profileName || (cleanEmail === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt'),
      role: 'admin',
      status: 'active',
      isSuperAdmin: true,
      addedAt: '2025-01-01',
      addedBy: 'Hệ thống',
      lastLogin: new Date().toISOString()
    };

    // Cập nhật lastLogin và UID
    try {
      const docRef = doc(db, ADMINS_COLLECTION, cleanEmail);
      await setDoc(docRef, sanitizeData(superAcc), { merge: true });
      if (firebaseUid) {
        await setDoc(doc(db, ADMINS_COLLECTION, firebaseUid), sanitizeData(superAcc), { merge: true });
      }
    } catch {
      // ignore
    }

    return { isAuthorizedAdmin: true, role: 'admin', account: superAcc };
  }

  // 2. Nếu chưa đăng nhập Firebase Auth và không phải Super Admin vĩnh viễn,
  // không gửi request đọc admin_users lên Firestore để tránh lỗi Missing or insufficient permissions.
  if (!auth.currentUser) {
    const defaultAcc: AdminAccount = {
      email: cleanEmail,
      name: profileName || cleanEmail.split('@')[0],
      role: 'user',
      status: 'revoked',
      isSuperAdmin: false,
      addedAt: new Date().toISOString(),
      addedBy: 'Chưa đăng nhập'
    };
    return { isAuthorizedAdmin: false, role: 'user', account: defaultAcc };
  }

  // 3. Đọc trực tiếp từ Cloud Firestore server (không dùng cache trình duyệt)
  const userRef = doc(db, ADMINS_COLLECTION, cleanEmail);
  let userDocData: any = null;

  try {
    const snap = await getDocFromServer(userRef).catch(() => getDoc(userRef));
    if (snap.exists()) {
      userDocData = snap.data();
    }
  } catch {
    // ignore
  }

  let finalRole: 'admin' | 'user' = 'user';
  let finalStatus: 'active' | 'revoked' = 'active';
  let account: AdminAccount;

  if (userDocData) {
    // ĐÃ TỒN TẠI TRÊN FIRESTORE: TUYỆT ĐỐI GIỮ NGUYÊN ROLE VÀ STATUS!
    if (userDocData.status === 'revoked' || userDocData.role === 'user') {
      finalRole = 'user';
      finalStatus = 'revoked';
    } else {
      finalRole = userDocData.role === 'admin' ? 'admin' : 'user';
      finalStatus = userDocData.status || 'active';
    }

    account = {
      email: cleanEmail,
      uid: firebaseUid || userDocData.uid || auth.currentUser?.uid,
      name: userDocData.name || profileName || cleanEmail.split('@')[0],
      role: finalRole,
      status: finalStatus,
      isSuperAdmin: false,
      addedAt: userDocData.addedAt || new Date().toISOString(),
      addedBy: userDocData.addedBy || 'Hệ thống',
      lastLogin: new Date().toISOString()
    };
  } else {
    // HOÀN TOÀN CHƯA CÓ TRÊN FIRESTORE: MẶC ĐỊNH LÀ NGƯỜI DÙNG THƯỜNG (USER)
    finalRole = 'user';
    finalStatus = 'active';
    account = {
      email: cleanEmail,
      uid: firebaseUid || auth.currentUser?.uid,
      name: profileName || cleanEmail.split('@')[0],
      role: 'user',
      status: 'active',
      isSuperAdmin: false,
      addedAt: new Date().toISOString(),
      addedBy: 'Đăng nhập',
      lastLogin: new Date().toISOString()
    };
  }

  // Cập nhật lastLogin và uid nếu có (merge: true, KHÔNG GHI ĐÈ ROLE)
  try {
    await setDoc(
      userRef,
      sanitizeData({
        email: cleanEmail,
        uid: firebaseUid || auth.currentUser?.uid,
        name: account.name,
        lastLogin: new Date().toISOString()
      }),
      { merge: true }
    );
  } catch {
    // ignore
  }

  const isAuthorizedAdmin = finalRole === 'admin' && finalStatus === 'active';
  return { isAuthorizedAdmin, role: finalRole, account };
}

/**
 * Xử lý đồng bộ từ CSV Google Sheets (permissionsCsvUrl)
 * TUYỆT ĐỐI GIỮ NGUYÊN role và status trên Firestore cho mọi tài khoản đã có.
 */
export async function syncPermissionsCsvWithoutOverwritingRoles(
  csvAccounts: AdminAccount[]
): Promise<AdminAccount[]> {
  const currentFirestoreList = await getAdminUsersFromFirestore();
  const firestoreMap = new Map<string, AdminAccount>();
  currentFirestoreList.forEach((a) => {
    firestoreMap.set(a.email.toLowerCase().trim(), a);
  });

  const mergedList: AdminAccount[] = [...currentFirestoreList];

  for (const csvAcc of csvAccounts) {
    const email = csvAcc.email.toLowerCase().trim();
    if (SYSTEM_SUPER_ADMINS.includes(email)) continue;

    if (firestoreMap.has(email)) {
      // User ĐÃ CÓ trên Firestore:
      // TUYỆT ĐỐI GIỮ NGUYÊN ROLE VÀ STATUS TRÊN FIRESTORE!
      const current = firestoreMap.get(email)!;
      current.passwordOrPin = csvAcc.passwordOrPin || current.passwordOrPin;
      if (csvAcc.name && !current.name) {
        current.name = csvAcc.name;
      }
    } else {
      // User CHƯA CÓ trên Firestore: Mới lấy từ CSV (mặc định user nếu không rõ)
      const newAcc: AdminAccount = {
        ...csvAcc,
        email,
        role: csvAcc.role || 'user',
        status: csvAcc.role === 'admin' ? 'active' : 'revoked',
        isSuperAdmin: false,
        addedAt: new Date().toISOString(),
        addedBy: 'Google Sheets CSV'
      };
      mergedList.push(newAcc);
      firestoreMap.set(email, newAcc);
      await setDoc(doc(db, ADMINS_COLLECTION, email), sanitizeData(newAcc), { merge: true }).catch(() => null);
    }
  }

  return mergedList;
}

/**
 * Khôi phục lại danh sách 8 Admin mặc định của hệ thống lên Firestore
 * CHỈ CHẠY KHI SUPER ADMIN CHỦ ĐỘNG XÁC NHẬN.
 */
export async function resetDefaultAdminsToFirestore(): Promise<AdminAccount[]> {
  for (const admin of INITIAL_TEMPLATE_ADMINS) {
    const cleanEmail = admin.email.toLowerCase().trim();
    const docRef = doc(db, ADMINS_COLLECTION, cleanEmail);
    await setDoc(
      docRef,
      sanitizeData({
        ...admin,
        email: cleanEmail,
        role: 'admin',
        status: 'active',
        updatedAt: new Date().toISOString(),
        updatedBy: 'Khôi phục mẫu Super Admin'
      }),
      { merge: true }
    );
  }
  return await getAdminUsersFromFirestore();
}

/**
 * Khởi tạo danh sách ban đầu nếu cần
 */
export async function seedInitialAdminsIfEmpty(): Promise<AdminAccount[]> {
  return await getAdminUsersFromFirestore();
}
