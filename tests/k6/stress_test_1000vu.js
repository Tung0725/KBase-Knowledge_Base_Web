import http from 'k6/http';
import { check, sleep, group } from 'k6';

/**
 * STRESS & PEAK LOAD TEST (1,000 CONCURRENT USERS)
 * Mục tiêu: Thử nghiệm giới hạn chịu tải tối đa của hệ thống KBase với 1,000 người dùng ảo.
 * 
 * Mô hình phân tầng (Stages):
 *  1. 0s  -> 30s  : Tăng dần lên 200 VUs (Khởi động)
 *  2. 30s -> 1m00s: Tăng lên 500 VUs (Tải cao)
 *  3. 1m  -> 2m00s: Đẩy lên đỉnh 1,000 VUs (Tải cực đại)
 *  4. 2m  -> 2m30s: Duy trì đỉnh 1,000 VUs
 *  5. 2m30s->3m00s: Hạ tải về 0 (Hồi phục)
 */

export const options = {
  stages: [
    { duration: '30s', target: 200 },  // Ramp-up 1: 0 -> 200 VUs
    { duration: '30s', target: 500 },  // Ramp-up 2: 200 -> 500 VUs
    { duration: '1m',  target: 1000 }, // Peak Stress: 500 -> 1,000 VUs
    { duration: '30s', target: 1000 }, // Sustain Peak: Giữ nguyên 1,000 VUs
    { duration: '30s', target: 0 },    // Ramp-down: Hạ về 0
  ],
  thresholds: {
    // Với 1,000 VUs chạy trên máy local, 95% request phản hồi dưới 1.5s là đạt chuẩn tốt
    http_req_duration: ['p(95)<1500'],
    // Tỉ lệ lỗi cho phép tối đa trong bài test cực hạn là dưới 5%
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';
const EMAIL = __ENV.TEST_EMAIL || 'duytung200575456@gmail.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'Tung123@';

// Setup: Chạy 1 lần duy nhất để lấy Bearer Token dùng chung cho bài test
export function setup() {
  const loginPayload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const isSuccess = check(loginRes, {
    'Admin/User login succeeded': (r) => r.status === 200,
  });

  if (!isSuccess) {
    console.warn(`[WARN] Setup login failed (${loginRes.status}). Test will run in public mode.`);
    return { token: null };
  }

  const json = loginRes.json();
  const token = json.data ? json.data.token : null;
  return { token: token };
}

export default function (data) {
  const authHeaders = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  };

  // Tùy biến hành vi ngẫu nhiên để mô phỏng 1,000 người dùng thực tế
  const randomAction = Math.random();

  if (randomAction < 0.4) {
    // 40% người dùng xem thông tin cá nhân và session
    group('User Info Check', function () {
      const res = http.get(`${BASE_URL}/api/auth/me`, { headers: authHeaders });
      check(res, {
        'GET /api/auth/me is 200': (r) => r.status === 200,
      });
    });
  } else if (randomAction < 0.8) {
    // 40% người dùng xem danh sách dự án
    group('Project List Browsing', function () {
      const res = http.get(`${BASE_URL}/api/projects`, { headers: authHeaders });
      check(res, {
        'GET /api/projects is 200': (r) => r.status === 200,
      });
    });
  } else {
    // 20% người dùng truy cập tài liệu công khai / docs
    group('Public Docs Inspection', function () {
      const res = http.get(`${BASE_URL}/api-docs`);
      check(res, {
        'GET /api-docs is 200': (r) => r.status === 200,
      });
    });
  }

  // Think time ngẫu nhiên từ 1 đến 2 giây (Mô phỏng thao tác người dùng thật)
  sleep(Math.random() * 1.5 + 1.0);
}
