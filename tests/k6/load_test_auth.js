import http from 'k6/http';
import { check, sleep, group } from 'k6';

/**
 * LOAD TEST WITH AUTHENTICATION
 * Mục tiêu: Kiểm tra hiệu năng backend chịu tải 10-30 người dùng đồng thời (VUs).
 * Luồng: Đăng nhập lấy JWT Bearer token, sau đó gọi các API nghiệp vụ:
 *   - GET /api/auth/me (xác thực token)
 *   - GET /api/projects (truy vấn cơ sở dữ liệu)
 */

export const options = {
  stages: [
    { duration: '15s', target: 10 }, // Ramp-up: Tăng dần lên 10 VUs trong 15s
    { duration: '30s', target: 20 }, // Steady: Giữ tải 20 VUs trong 30s
    { duration: '15s', target: 0 },  // Ramp-down: Hạ tải về 0 trong 15s
  ],
  thresholds: {
    // 95% request phải phản hồi dưới 400ms (chuẩn NFR phổ biến)
    http_req_duration: ['p(95)<400'],
    // Tỉ lệ request lỗi không được vượt quá 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';
const EMAIL = __ENV.TEST_EMAIL || 'duytung200575456@gmail.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'Tung123@';

// Setup: Chạy 1 lần duy nhất trước khi các VUs bắt đầu để lấy Token
export function setup() {
  const loginPayload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const isSuccess = check(loginRes, {
    'Login setup succeeded (200)': (r) => r.status === 200,
  });

  if (!isSuccess) {
    console.error(`Login failed during setup! Status: ${loginRes.status}, Body: ${loginRes.body}`);
    return { token: null };
  }

  const json = loginRes.json();
  const token = json.data ? json.data.token : null;
  return { token: token };
}

export default function (data) {
  // Nếu không có token, test các endpoint công khai
  if (!data.token) {
    const res = http.get(`${BASE_URL}/api-docs`);
    check(res, { 'Fallback status 200': (r) => r.status === 200 });
    sleep(1);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  };

  group('User Profile & Navigation Flow', function () {
    // 1. Gọi API lấy thông tin người dùng hiện tại
    const meRes = http.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
    check(meRes, {
      'GET /api/auth/me returns 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // 2. Gọi API lấy danh sách dự án
    const projRes = http.get(`${BASE_URL}/api/projects`, { headers: authHeaders });
    check(projRes, {
      'GET /api/projects returns 200': (r) => r.status === 200,
    });

    // Nghỉ ngơi giữa các hành động của người dùng (Think time)
    sleep(1);
  });
}
