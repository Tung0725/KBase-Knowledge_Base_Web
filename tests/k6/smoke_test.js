import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * SMOKE TEST
 * Mục tiêu: Kiểm tra nhanh tính toàn vẹn của API với 1 người dùng ảo (VU).
 * Tiêu chí: Hệ thống phản hồi bình thường, không có lỗi 5xx.
 */

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // Tỉ lệ lỗi < 1%
    http_req_duration: ['p(95)<500'], // 95% request phải phản hồi dưới 500ms
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';

export default function () {
  // 1. Kiểm tra OpenAPI Documentation endpoint
  const docRes = http.get(`${BASE_URL}/api-docs`);
  check(docRes, {
    'API Docs status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
