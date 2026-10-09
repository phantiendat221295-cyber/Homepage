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
  query,
  orderBy,
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
      isAnonymous: auth.currentUser?.isAnonymous || null
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
    const testRef = doc(db, 'settings', '_connection_check');
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

    // Nếu rỗng, nạp dữ liệu mặc định ban đầu theo batch
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
 * Lấy danh sách yêu cầu hỗ trợ từ Firestore
 */
export async function getTicketsFromFirestore(): Promise<SupportTicket[]> {
  try {
    const ticketsRef = collection(db, TICKETS_COLLECTION);
    const snapshot = await getDocs(ticketsRef);
    const items: SupportTicket[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as Omit<SupportTicket, 'id'>) });
    });
    // Sắp xếp mới nhất lên đầu
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, TICKETS_COLLECTION);
    return [];
  }
}

/**
 * Lắng nghe yêu cầu hỗ trợ theo thời gian thực
 */
export function subscribeTickets(
  onUpdate: (tickets: SupportTicket[]) => void,
  onError?: (err: any) => void
): () => void {
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
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, NOTIFICATIONS_COLLECTION);
    return [];
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
  }
}

// ==========================================
// 4. QUẢN LÝ PHÂN QUYỀN ADMIN (COLLECTION: admin_users)
// ==========================================

export const ADMINS_COLLECTION = 'admin_users';

// 2 Tài khoản Quản trị viên ban đầu của hệ thống
export const SYSTEM_SUPER_ADMINS = ['datpt60@fpt.edu.vn', 'phantiendat221295@gmail.com'];

export const getAdminDocId = (email: string) => {
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
};

/**
 * Kiểm tra xem một email có quyền admin hay không.
 * Nghiêm ngặt đối soát với danh sách activeAdmins thực tế đang lưu trên Firestore.
 * Nếu đã bị xóa khỏi Firestore -> Trả về FALSE ngay lập tức!
 */
export function checkIsAdmin(email: string, activeAdmins: AdminAccount[]): boolean {
  if (!email || !email.trim() || !Array.isArray(activeAdmins)) return false;
  const clean = email.toLowerCase().trim();
  return activeAdmins.some(
    (a) => a.email && a.email.toLowerCase().trim() === clean && (a.role === 'admin' || !a.role)
  );
}

/**
 * Lấy danh sách Quản trị viên từ Firestore
 */
export async function getAdminUsersFromFirestore(): Promise<AdminAccount[]> {
  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const items: AdminAccount[] = [];
    snapshot.forEach((snap) => {
      const data = snap.data() as AdminAccount;
      items.push({
        ...data,
        isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(data.email.toLowerCase().trim())
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ADMINS_COLLECTION);
    return [];
  }
}

/**
 * Lắng nghe danh sách Quản trị viên theo thời gian thực (Realtime onSnapshot)
 */
export function subscribeAdminUsers(
  onUpdate: (admins: AdminAccount[]) => void,
  onError?: (err: any) => void
): () => void {
  const colRef = collection(db, ADMINS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: AdminAccount[] = [];
      snapshot.forEach((snap) => {
        const data = snap.data() as AdminAccount;
        items.push({
          ...data,
          isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(data.email.toLowerCase().trim())
        });
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, ADMINS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Thêm một email Quản trị viên vào Firestore
 */
export async function addAdminUserToFirestore(admin: {
  email: string;
  name?: string;
  addedBy?: string;
}): Promise<void> {
  const cleanEmail = admin.email.toLowerCase().trim();
  const docId = getAdminDocId(cleanEmail);
  const docRef = doc(db, ADMINS_COLLECTION, docId);

  const payload: AdminAccount = {
    email: cleanEmail,
    name: admin.name || cleanEmail.split('@')[0],
    role: 'admin',
    isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(cleanEmail),
    addedAt: new Date().toISOString(),
    addedBy: admin.addedBy || 'Quản trị viên'
  };

  try {
    await setDoc(docRef, sanitizeData(payload), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ADMINS_COLLECTION}/${docId}`);
    throw error;
  }
}

/**
 * Xóa/Thu hồi quyền Quản trị viên của một email khỏi Firestore.
 * Cho phép thu hồi bất kỳ tài khoản nào (kể cả 2 admin ban đầu) theo đúng yêu cầu quản trị.
 */
export async function removeAdminUserFromFirestore(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const docId = getAdminDocId(cleanEmail);
  const docRef = doc(db, ADMINS_COLLECTION, docId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ADMINS_COLLECTION}/${docId}`);
    throw error;
  }
}

/**
 * Khôi phục lại 2 Admin mặc định (datpt60@fpt.edu.vn & phantiendat221295@gmail.com) lên Firestore
 */
export async function resetDefaultAdminsToFirestore(): Promise<AdminAccount[]> {
  try {
    const batch = writeBatch(db);
    const initialList = [
      { email: 'datpt60@fpt.edu.vn', name: 'Phan Tiến Đạt (Đào tạo)' },
      { email: 'phantiendat221295@gmail.com', name: 'Phan Tiến Đạt' }
    ];

    for (const item of initialList) {
      const docRef = doc(db, ADMINS_COLLECTION, getAdminDocId(item.email));
      batch.set(docRef, {
        email: item.email,
        name: item.name,
        role: 'admin',
        isSuperAdmin: true,
        addedAt: new Date().toISOString(),
        addedBy: 'Hệ thống Khôi phục Mặc định'
      });
    }

    await batch.commit();
    return await getAdminUsersFromFirestore();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ADMINS_COLLECTION);
    return [];
  }
}

/**
 * Khởi tạo 2 Admin ban đầu lên Firestore nếu collection còn hoàn toàn trống
 */
export async function seedInitialAdminsIfEmpty(): Promise<AdminAccount[]> {
  try {
    const existing = await getAdminUsersFromFirestore();
    // Nếu Firestore đã có dữ liệu (kể cả chỉ còn 1 admin), không tự động add lại admin đã bị xóa
    if (existing && existing.length > 0) {
      return existing;
    }

    // Nếu rỗng, mới khởi tạo 2 tài khoản ban đầu
    const batch = writeBatch(db);
    for (const email of SYSTEM_SUPER_ADMINS) {
      const clean = email.toLowerCase().trim();
      const docRef = doc(db, ADMINS_COLLECTION, getAdminDocId(clean));
      batch.set(docRef, {
        email: clean,
        name: clean === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt',
        role: 'admin',
        isSuperAdmin: true,
        addedAt: new Date().toISOString(),
        addedBy: 'Hệ thống Ban đầu'
      });
    }

    await batch.commit();
    return await getAdminUsersFromFirestore();
  } catch (error) {
    console.warn('Lỗi seed initial admins:', error);
    return [];
  }
}
