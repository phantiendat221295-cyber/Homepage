// Dịch vụ xác thực tài khoản Google chính chủ với Google Identity Services (GIS) / OAuth 2.0

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

// Google OAuth Client ID chính thức của hệ thống (Người dùng không cần nhập lại)
export const DEFAULT_GOOGLE_CLIENT_ID =
  '917238298316-4lcifta46nberb44oebk8c5q4qfdigbh.apps.googleusercontent.com';

/**
 * Mở hộp thoại đăng nhập Google chính thức (Google OAuth Consent Popup)
 * Yêu cầu người dùng chọn tài khoản Google và cho phép truy cập email / profile
 */
export const signInWithGoogleOAuth = async (clientId?: string): Promise<GoogleUserProfile> => {
  const effectiveClientId = (clientId && clientId.trim()) ? clientId.trim() : DEFAULT_GOOGLE_CLIENT_ID;

  return new Promise((resolve, reject) => {
    if (!effectiveClientId) {
      reject(new Error('CLIENT_ID_MISSING: Chưa cấu hình Google Client ID'));
      return;
    }

    // Đợi Google GSI SDK sẵn sàng (tối đa 3 giây)
    const checkGsiReady = (retries = 15) => {
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: effectiveClientId,
            scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
            callback: async (response: any) => {
              if (response.error) {
                if (response.error === 'access_denied') {
                  reject(new Error('Người dùng đã từ chối cấp quyền Google.'));
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
                // Gọi API chính thức của Google để lấy thông tin tài khoản đã xác thực
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: {
                    Authorization: `Bearer ${response.access_token}`
                  }
                });

                if (!userRes.ok) {
                  throw new Error(`Lỗi lấy thông tin Google Profile: HTTP ${userRes.status}`);
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
              reject(new Error(`Lỗi xác thực Google: ${err.message || 'Hủy bỏ'}`));
            }
          });

          // Mở Popup chính thức của Google với màn hình đồng ý / cho phép
          client.requestAccessToken({ prompt: 'select_account' });
        } catch (err: any) {
          reject(new Error(`Không thể khởi tạo Google OAuth: ${err.message}`));
        }
      } else if (retries > 0) {
        setTimeout(() => checkGsiReady(retries - 1), 200);
      } else {
        reject(
          new Error(
            'Không thể tải Google Identity Services SDK. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.'
          )
        );
      }
    };

    checkGsiReady();
  });
};
