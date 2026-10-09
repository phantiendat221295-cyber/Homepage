// Dịch vụ xác thực tài khoản Google chính thức với Google Identity Services (GIS) / OAuth 2.0

declare global {
  interface Window {
    google?: any;
  }
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

// Google OAuth Client ID chính thức của hệ thống FPT PolySchool
export const DEFAULT_GOOGLE_CLIENT_ID =
  '917238298316-4lcifta46nberb44oebk8c5q4qfdigbh.apps.googleusercontent.com';

/**
 * Giải mã an toàn JWT ID Token trả về từ Google Identity Services
 */
export function parseGoogleJwt(credential: string): GoogleUserProfile {
  try {
    const base64Url = credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const data = JSON.parse(jsonPayload);
    return {
      email: (data.email || '').toLowerCase().trim(),
      name: data.name || data.given_name || (data.email ? data.email.split('@')[0] : 'Quản trị viên'),
      picture: data.picture,
      email_verified: Boolean(data.email_verified)
    };
  } catch (err: any) {
    throw new Error('Không thể giải mã Google ID Token: ' + err.message);
  }
}

/**
 * Hiển thị nút Đăng nhập chính thức từ Google Identity Services (GIS renderButton)
 * Nút do chính Google kết xuất và xử lý trực tiếp giúp không bao giờ bị trình duyệt chặn popup.
 */
export function renderGoogleSignInButton(
  container: HTMLElement,
  clientId: string,
  onSuccess: (profile: GoogleUserProfile) => void,
  onError: (err: Error) => void
): () => void {
  const effectiveClientId = clientId?.trim() || DEFAULT_GOOGLE_CLIENT_ID;
  let isCleanedUp = false;

  const initAndRender = () => {
    if (isCleanedUp || !container) return;

    if (!window.google?.accounts?.id) {
      return false;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: effectiveClientId,
        callback: (response: any) => {
          if (!response.credential) {
            onError(new Error('Không nhận được thông tin xác thực từ Google.'));
            return;
          }
          try {
            const profile = parseGoogleJwt(response.credential);
            onSuccess(profile);
          } catch (e: any) {
            onError(e);
          }
        },
        auto_select: false,
        context: 'signin'
      });

      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320
      });
      return true;
    } catch (err: any) {
      console.warn('Lỗi kết xuất Google button:', err);
      return false;
    }
  };

  // Thử ngay nếu SDK đã load
  if (!initAndRender()) {
    const timer = setInterval(() => {
      if (initAndRender()) {
        clearInterval(timer);
      }
    }, 250);

    const timeout = setTimeout(() => {
      clearInterval(timer);
    }, 8000);

    return () => {
      isCleanedUp = true;
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }

  return () => {
    isCleanedUp = true;
  };
}

/**
 * Kích hoạt popup đăng nhập Google OAuth 2.0 (Token Client)
 * Luôn gọi synchronous requestAccessToken để tránh bị popup blocker chặn
 */
export const signInWithGoogleOAuth = async (clientId?: string): Promise<GoogleUserProfile> => {
  const effectiveClientId = clientId?.trim() || DEFAULT_GOOGLE_CLIENT_ID;

  return new Promise((resolve, reject) => {
    if (!effectiveClientId) {
      reject(new Error('Chưa cấu hình Google OAuth Client ID'));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services SDK chưa sẵn sàng. Vui lòng tải lại trang hoặc kiểm tra kết nối mạng.'
        )
      );
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope:
          'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
        callback: async (response: any) => {
          if (response.error) {
            if (response.error === 'access_denied') {
              reject(new Error('Người dùng đã hủy hoặc từ chối xác thực Google.'));
            } else {
              reject(new Error(`Lỗi Google OAuth: ${response.error_description || response.error}`));
            }
            return;
          }

          if (!response.access_token) {
            reject(new Error('Không nhận được Access Token từ Google.'));
            return;
          }

          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                Authorization: `Bearer ${response.access_token}`
              }
            });

            if (!userRes.ok) {
              throw new Error(`HTTP ${userRes.status}`);
            }

            const profile = await userRes.json();
            if (!profile.email) {
              throw new Error('Tài khoản Google không trả về email.');
            }

            resolve({
              email: profile.email.toLowerCase().trim(),
              name: profile.name || profile.email.split('@')[0],
              picture: profile.picture,
              email_verified: Boolean(profile.email_verified)
            });
          } catch (err: any) {
            reject(new Error(`Không thể lấy thông tin người dùng Google: ${err.message}`));
          }
        },
        error_callback: (err: any) => {
          const msg = err.message || '';
          if (msg.includes('popup') || err.type === 'popup_failed_to_open') {
            reject(
              new Error(
                'POPUP_BLOCKED: Trình duyệt đang chặn cửa sổ Popup. Vui lòng cho phép mở popup trên thanh địa chỉ của trình duyệt hoặc sử dụng nút Đăng nhập chính thức phía dưới.'
              )
            );
          } else {
            reject(new Error(`Lỗi xác thực Google: ${msg || 'Hủy bỏ'}`));
          }
        }
      });

      // Mở Popup chính thức của Google với màn hình đồng ý / cho phép
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      reject(new Error(`Không thể khởi tạo Google OAuth: ${err.message}`));
    }
  });
};
