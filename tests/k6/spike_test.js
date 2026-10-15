import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * SPIKE TEST (ĐỘT BIẾN LƯU LƯỢNG)
 * Mục tiêu: Kiểm tra hệ thống khi lượng người dùng tăng đột ngột trong vài giây (ví dụ: giờ mở đăng ký hoặc nộp bài).
 * Kịch bản: Đang 20 VUs bình thường -> Vọt lên 500 VUs trong 10s -> Giảm về lại 20 VUs.
 */

export const options = {
  stages: [
    { duration: '10s', target: 20 },   // Bình thường: 20 VUs
    { duration: '10s', target: 500 },  // Đột biến (Spike): 500 VUs trong 10s
    { duration: '30s', target: 500 },  // Duy trì đỉnh sốc trong 30s
    { duration: '15s', target: 20 },   // Hạ nhiệt về mức bình thường
    { duration: '10s', target: 0 },    // Kết thúc
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Tỉ lệ lỗi dưới 5% khi bị sốc tải
    http_req_duration: ['p(95)<2000'], // 95% request dưới 2s
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';
const EMAIL = __ENV.TEST_EMAIL || 'duytung200575456@gmail.com';
const PASSWORD = __ENV.TEST_PASSWORD || 'Tung123@';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const json = loginRes.json();
  return { token: json.data ? json.data.token : null };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
  };

  const res = http.get(`${BASE_URL}/api/projects`, { headers: headers });
  check(res, {
    'GET /api/projects status is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 1.0 + 0.5);
}
