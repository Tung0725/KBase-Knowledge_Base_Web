# Hướng dẫn Kiểm thử Hiệu năng Chịu tải với K6 (NFR Load & Stress Testing)

Thư mục này chứa đầy đủ các kịch bản kiểm thử hiệu năng chịu tải (Performance & Scalability NFRs) cho hệ thống **KBase Backend** (Spring Boot + PostgreSQL + Redis).

---

## 1. Danh Sách Các Kịch Bản Kiểm Thử

| File Script | Tên Kịch Bản | Cấu hình tải | Mục đích đánh giá |
| :--- | :--- | :--- | :--- |
| `smoke_test.js` | **Smoke Test** | 1 VU (10s) | Kiểm tra tính sống còn của API sau deploy / build |
| `load_test_auth.js` | **Load Test** | 20 VUs (1m) | Đo hiệu năng vận hành thông thường (P95 Latency, RPS) |
| `stress_test_1000vu.js` | **Peak Stress Test** | **1,000 VUs** (3m) | Đẩy hệ thống lên đỉnh 1,000 người dùng đồng thời |
| `spike_test.js` | **Spike Test** | 20 $\rightarrow$ 500 VUs | Kiểm tra phản ứng khi lưu lượng tăng đột biến trong vài giây |

---

## 2. Hướng dẫn Thực thi Từng Kịch Bản

Mở Terminal tại thư mục dự án và chạy các lệnh tương ứng:

### 🔹 1. Smoke Test (1 người dùng - kiểm tra nhanh)
```powershell
k6 run tests/k6/smoke_test.js
```

### 🔹 2. Load Test (20 người dùng thực tế có đăng nhập)
```powershell
k6 run tests/k6/load_test_auth.js
```

### 🔹 3. Stress Test (1,000 người dùng đồng thời) 🔥
```powershell
k6 run tests/k6/stress_test_1000vu.js
```
*Lưu ý:* Kịch bản này sẽ tăng tải qua 5 giai đoạn: 
`0 -> 200 -> 500 -> 1,000 VUs (giữ 30s) -> 0`.

### 🔹 4. Spike Test (Sốc tải đột ngột 500 người dùng trong 10s) ⚡
```powershell
k6 run tests/k6/spike_test.js
```

---

## 3. Cách Đọc và Báo Cáo Các Chỉ Số NFRs

1. **`http_req_duration (p95)`**: 95% request hoàn thành trong thời gian này.
   - Dưới **200ms**: 🟢 Xuất sắc
   - 200ms – **500ms**: 🟢 Đạt chuẩn web tốt
   - 500ms – **1500ms**: 🟡 Chấp nhận được trong điều kiện Stress tải cực đại
2. **`http_req_failed`**: Tỉ lệ request bị lỗi (SLA yêu cầu $\le 1\%$, bài test Stress cực hạn $\le 5\%$).
3. **`http_reqs / s` (Throughput)**: Số lượng request backend xử lý thành công trong 1 giây (RPS).
