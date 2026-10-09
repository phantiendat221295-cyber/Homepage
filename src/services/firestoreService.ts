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
// 4. QUẢN LÝ PHÂN QUYỀN ADMIN (COLLECTION: settings -> portal_admins)
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
    isSuperAdmin: true,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'phantiendat221295@gmail.com',
    name: 'Phan Tiến Đạt',
    role: 'admin',
    isSuperAdmin: true,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'thuanl2@fpt.edu.vn',
    name: 'Thuận (thuanl2)',
    role: 'admin',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'vylnu@fpt.edu.vn',
    name: 'Vỹ (vylnu)',
    role: 'admin',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'loiqt@fpt.edu.vn',
    name: 'Lợi (loiqt)',
    role: 'admin',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'duocdty2@fpt.edu.vn',
    name: 'Dược (duocdty2)',
    role: 'admin',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'dienvnn@fpt.edu.vn',
    name: 'Điền (dienvnn)',
    role: 'admin',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  },
  {
    email: 'thainh44@fpt.edu.vn',
    name: 'Thái (thainh44)',
    role: 'admin',
    isSuperAdmin: false,
    addedAt: '2025-01-01',
    addedBy: 'Hệ thống'
  }
];

export const DEFAULT_ADMIN_USERS = INITIAL_TEMPLATE_ADMINS;

export const getAdminDocId = (email: string) => {
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
};

/**
 * Kiểm tra xem một email có quyền admin hay không.
 * CHỈ 2 Super Admin là vĩnh viễn trong code.
 * Tất cả các admin khác BẮT BUỘC phải còn tồn tại trong activeAdmins và có role là 'admin'.
 */
export function checkIsAdmin(email: string, activeAdmins: AdminAccount[]): boolean {
  if (!email || !email.trim()) return false;
  const clean = email.toLowerCase().trim();

  // 1. Duy nhất 2 Super Admin luôn có quyền quản trị tối cao
  if (SYSTEM_SUPER_ADMINS.includes(clean)) {
    return true;
  }

  // 2. Các admin khác: Bắt buộc phải còn tồn tại trong danh sách activeAdmins và có role là admin
  if (Array.isArray(activeAdmins)) {
    return activeAdmins.some(
      (a) => a.email && a.email.toLowerCase().trim() === clean && a.role === 'admin'
    );
  }

  return false;
}

export const SETTINGS_ADMINS_DOC = 'portal_admins';

/**
 * Lấy danh sách Người dùng & Quản trị viên từ Firestore
 * Đọc ưu tiên từ 'settings/portal_admins' và đồng bộ với collection 'admin_users'
 */
export async function getAdminUsersFromFirestore(): Promise<AdminAccount[]> {
  const accountsMap = new Map<string, AdminAccount>();

  // 1. Đọc TRƯỚC HẾT từ doc 'settings/portal_admins' (Luôn có quyền đọc trên Firestore)
  try {
    const docRef = doc(db, 'settings', SETTINGS_ADMINS_DOC);
    const snap = await getDocFromServer(docRef).catch(() => getDoc(docRef));
    if (snap.exists() && Array.isArray(snap.data()?.admins)) {
      const list: AdminAccount[] = snap.data().admins;
      list.forEach((a) => {
        const email = (a.email || '').toLowerCase().trim();
        if (email) {
          accountsMap.set(email, {
            ...a,
            email,
            role: (a.role === 'user' ? 'user' : 'admin') as 'admin' | 'user',
            isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(email) || Boolean(a.isSuperAdmin)
          });
        }
      });
    }
  } catch (err) {
    console.warn('Lỗi đọc settings/portal_admins doc:', err);
  }

  // 2. Đọc bổ sung từ collection 'admin_users'
  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    const snap = await getDocs(colRef);
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const email = (d.email || '').toLowerCase().trim();
      if (email) {
        const existing = accountsMap.get(email);
        // NGUYÊN TẮC BẢO MẬT: Nếu ở bất kỳ nguồn nào role đã bị thu hồi về 'user', ưu tiên 'user'!
        let determinedRole: 'admin' | 'user' = 'admin';
        if (existing?.role === 'user' || d.role === 'user') {
          determinedRole = 'user';
        }

        accountsMap.set(email, {
          email,
          name: d.name || existing?.name || email.split('@')[0],
          role: determinedRole,
          isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(email) || Boolean(d.isSuperAdmin),
          addedAt: d.addedAt || existing?.addedAt || '2025-01-01',
          addedBy: d.addedBy || existing?.addedBy || 'Hệ thống',
          lastLogin: d.lastLogin || existing?.lastLogin
        });
      }
    });
  } catch (err) {
    // Không để lỗi permission denied của collection admin_users làm mất dữ liệu portal_admins
  }

  // 3. Luôn đảm bảo 2 Super Admin có mặt với role admin
  SYSTEM_SUPER_ADMINS.forEach((email) => {
    const existing = accountsMap.get(email);
    accountsMap.set(email, {
      email,
      name: existing?.name || (email === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt'),
      role: 'admin',
      isSuperAdmin: true,
      addedAt: existing?.addedAt || '2025-01-01',
      addedBy: 'Hệ thống'
    });
  });

  return Array.from(accountsMap.values());
}

/**
 * Lắng nghe danh sách Quản trị viên theo thời gian thực (Realtime onSnapshot)
 * Lắng nghe đồng thời cả collection 'admin_users' và doc 'settings/portal_admins'
 */
export function subscribeAdminUsers(
  onUpdate: (admins: AdminAccount[]) => void,
  onError?: (err: any) => void
): () => void {
  let unsub1 = () => {};
  let unsub2 = () => {};

  // 1. Lắng nghe settings/portal_admins (Document này luôn hoạt động 100% trong Firestore)
  try {
    const docRef = doc(db, 'settings', SETTINGS_ADMINS_DOC);
    unsub2 = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data()?.admins)) {
          const list: AdminAccount[] = snap.data().admins;
          const items: AdminAccount[] = list.map((a) => ({
            ...a,
            email: a.email.toLowerCase().trim(),
            role: (a.role === 'user' ? 'user' : 'admin') as 'admin' | 'user',
            isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(a.email.toLowerCase().trim())
          }));

          // Đảm bảo Super Admins luôn hiện diện
          SYSTEM_SUPER_ADMINS.forEach((email) => {
            if (!items.some((a) => a.email === email)) {
              items.push({
                email,
                name: email === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt',
                role: 'admin',
                isSuperAdmin: true,
                addedAt: '2025-01-01',
                addedBy: 'Hệ thống'
              });
            }
          });

          onUpdate(items);
        }
      },
      (error) => {
        console.warn('Lỗi onSnapshot settings/portal_admins:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn('Lỗi khởi tạo onSnapshot settings/portal_admins:', err);
  }

  // 2. Lắng nghe bổ sung collection admin_users với xử lý lỗi an toàn
  try {
    const colRef = collection(db, ADMINS_COLLECTION);
    unsub1 = onSnapshot(
      colRef,
      (snap) => {
        if (!snap.empty) {
          getAdminUsersFromFirestore().then((merged) => {
            onUpdate(merged);
          }).catch(() => null);
        }
      },
      () => {
        // Nuốt lỗi an toàn nếu rules chặn unauthenticated read
      }
    );
  } catch {
    // Nuốt lỗi an toàn
  }

  return () => {
    try { unsub1(); } catch {}
    try { unsub2(); } catch {}
  };
}

/**
 * Lưu danh sách Quản trị viên lên Firestore (cả collection admin_users và settings/portal_admins)
 */
export async function saveAdminUsersToFirestore(admins: AdminAccount[]): Promise<void> {
  const sanitized = admins.map((a) => ({
    email: a.email.toLowerCase().trim(),
    name: a.name || a.email.split('@')[0],
    role: (a.role === 'user' ? 'user' : 'admin') as 'admin' | 'user',
    isSuperAdmin: SYSTEM_SUPER_ADMINS.includes(a.email.toLowerCase().trim()),
    addedAt: a.addedAt || new Date().toISOString(),
    addedBy: a.addedBy || 'Super Admin',
    lastLogin: a.lastLogin
  }));

  // 1. Lưu vào settings/portal_admins
  try {
    const docRef = doc(db, 'settings', SETTINGS_ADMINS_DOC);
    await setDoc(docRef, {
      admins: sanitized,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi lưu portal_admins:', error);
  }

  // 2. Lưu từng document vào collection admin_users
  try {
    for (const a of sanitized) {
      const userRef = doc(db, ADMINS_COLLECTION, getAdminDocId(a.email));
      await setDoc(userRef, a, { merge: true }).catch(() => null);
    }
  } catch (error) {
    console.warn('Lỗi đồng bộ admin_users collection:', error);
  }
}

/**
 * Cập nhật role của người dùng ('admin' hoặc 'user')
 * Dùng khi Super Admin chủ động đổi role trên giao diện
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

  // 1. Đọc danh sách hiện tại từ Firestore
  const current = await getAdminUsersFromFirestore();
  const existingIndex = current.findIndex((a) => a.email.toLowerCase().trim() === cleanEmail);
  let nextList: AdminAccount[];

  if (existingIndex >= 0) {
    nextList = current.map((a) =>
      a.email.toLowerCase().trim() === cleanEmail
        ? { ...a, role: newRole, updatedAt: new Date().toISOString() }
        : a
    );
  } else {
    nextList = [
      ...current,
      {
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role: newRole,
        isSuperAdmin: false,
        addedAt: new Date().toISOString(),
        addedBy: updatedBy || 'Super Admin'
      }
    ];
  }

  // 2. Lưu NGAY LẬP TỨC vào settings/portal_admins
  await saveAdminUsersToFirestore(nextList);

  // 3. Cập nhật document trong collection admin_users (merge: true)
  try {
    const userRef = doc(db, ADMINS_COLLECTION, getAdminDocId(cleanEmail));
    await setDoc(
      userRef,
      {
        email: cleanEmail,
        role: newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy || 'Super Admin'
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Lỗi ghi role vào admin_users collection:', err);
  }

  return nextList;
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
 * Thu hồi quyền Quản trị viên (Đổi role từ 'admin' thành 'user')
 * Đảm bảo document vẫn tồn tại trong Firestore với role: 'user' để không bị khôi phục lại
 */
export async function removeAdminUserFromFirestore(email: string): Promise<AdminAccount[]> {
  return updateUserRoleInFirestore(email, 'user', 'Super Admin');
}

/**
 * Xử lý khi user đăng nhập (Google Login / Auth Context)
 * YÊU CẦU 1:
 * - Kiểm tra document của user trong collection admin_users và settings/portal_admins.
 * - Nếu ĐÃ TỒN TẠI, TUYỆT ĐỐI KHÔNG ĐƯỢC ghi đè trường `role`.
 * - Chỉ dùng setDoc với { merge: true } để cập nhật `lastLogin`, giữ nguyên role hiện tại.
 * - Nếu role hiện tại là 'user' (đã bị thu hồi), isAuthorizedAdmin = false.
 */
export async function handleUserLoginAuthCheck(
  email: string,
  profileName?: string
): Promise<{ isAuthorizedAdmin: boolean; role: 'admin' | 'user'; account: AdminAccount }> {
  const cleanEmail = email.toLowerCase().trim();
  const isSuper = SYSTEM_SUPER_ADMINS.includes(cleanEmail);

  // Super Admin luôn có quyền tối cao
  if (isSuper) {
    const superAcc: AdminAccount = {
      email: cleanEmail,
      name: profileName || (cleanEmail === 'datpt60@fpt.edu.vn' ? 'Phan Tiến Đạt (Đào tạo)' : 'Phan Tiến Đạt'),
      role: 'admin',
      isSuperAdmin: true,
      addedAt: '2025-01-01',
      addedBy: 'Hệ thống',
      lastLogin: new Date().toISOString()
    };
    return { isAuthorizedAdmin: true, role: 'admin', account: superAcc };
  }

  // 1. Kiểm tra danh sách trên Firestore (portal_admins doc + admin_users collection)
  const allFirestoreUsers = await getAdminUsersFromFirestore();
  const foundInFirestore = allFirestoreUsers.find((a) => a.email.toLowerCase().trim() === cleanEmail);

  // 2. Kiểm tra document riêng lẻ trong collection 'admin_users'
  const userRef = doc(db, ADMINS_COLLECTION, getAdminDocId(cleanEmail));
  let userDocData: any = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      userDocData = snap.data();
    }
  } catch (err) {
    // catch permission error
  }

  let finalRole: 'admin' | 'user' = 'user';
  let account: AdminAccount;

  if (foundInFirestore) {
    // NẾU ĐÃ TỒN TẠI TRÊN FIRESTORE: TUYỆT ĐỐI GIỮ NGUYÊN ROLE!
    if (foundInFirestore.role === 'user' || (userDocData && userDocData.role === 'user')) {
      finalRole = 'user';
    } else {
      finalRole = foundInFirestore.role;
    }

    account = {
      ...foundInFirestore,
      name: foundInFirestore.name || profileName || cleanEmail.split('@')[0],
      role: finalRole,
      lastLogin: new Date().toISOString()
    };
  } else if (userDocData) {
    finalRole = userDocData.role === 'user' ? 'user' : 'admin';
    account = {
      email: cleanEmail,
      name: userDocData.name || profileName || cleanEmail.split('@')[0],
      role: finalRole,
      isSuperAdmin: false,
      addedAt: userDocData.addedAt || new Date().toISOString(),
      addedBy: userDocData.addedBy || 'Hệ thống',
      lastLogin: new Date().toISOString()
    };
  } else {
    // Hoàn toàn CHƯA CÓ TRÊN FIRESTORE: Mặc định là 'user'
    finalRole = 'user';
    account = {
      email: cleanEmail,
      name: profileName || cleanEmail.split('@')[0],
      role: 'user',
      isSuperAdmin: false,
      addedAt: new Date().toISOString(),
      addedBy: 'Đăng nhập',
      lastLogin: new Date().toISOString()
    };
  }

  // CẬP NHẬT lastLogin VỚI { merge: true }, TUYỆT ĐỐI KHÔNG GHI ĐÈ ROLE
  try {
    await setDoc(
      userRef,
      {
        email: cleanEmail,
        lastLogin: new Date().toISOString()
      },
      { merge: true }
    );
  } catch {
    // ignore
  }

  const isAuthorizedAdmin = finalRole === 'admin';
  return { isAuthorizedAdmin, role: finalRole, account };
}

/**
 * Xử lý đồng bộ từ CSV Google Sheets (permissionsCsvUrl)
 * YÊU CẦU 2 & CHỈ ĐỊNH TRIỆT ĐỂ:
 * - Tuyệt đối không được update `role` từ CSV nếu user đã tồn tại trên Firestore!
 * - Giữ nguyên 100% role hiện tại trên Firestore cho mọi tài khoản đã có.
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
      // TUYỆT ĐỐI GIỮ NGUYÊN ROLE TRÊN FIRESTORE (kể cả role đang là 'user' hay 'admin')!
      // KHÔNG ĐƯỢC PHÉP ĐỂ DỮ LIỆU TỪ CSV GHI ĐÈ TRƯỜNG ROLE!
      const current = firestoreMap.get(email)!;
      // Chỉ cập nhật mật khẩu/pin hoặc tên nếu còn trống, KHÔNG ĐƯỢC ghi đè role!
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
        isSuperAdmin: false,
        addedAt: new Date().toISOString(),
        addedBy: 'Google Sheets CSV'
      };
      mergedList.push(newAcc);
      firestoreMap.set(email, newAcc);
    }
  }

  await saveAdminUsersToFirestore(mergedList);
  return mergedList;
}

/**
 * Khôi phục lại danh sách 8 Admin mặc định của hệ thống lên Firestore
 */
export async function resetDefaultAdminsToFirestore(): Promise<AdminAccount[]> {
  await saveAdminUsersToFirestore(INITIAL_TEMPLATE_ADMINS);
  return INITIAL_TEMPLATE_ADMINS;
}

/**
 * Khởi tạo danh sách ban đầu nếu cần
 */
export async function seedInitialAdminsIfEmpty(): Promise<AdminAccount[]> {
  return await getAdminUsersFromFirestore();
}
