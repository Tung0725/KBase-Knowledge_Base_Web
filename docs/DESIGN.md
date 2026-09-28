---
name: KBase - Hub Tri thức Dự án
description: Một nguồn chân lý duy nhất (Single Source of Truth) cho mọi dự án.
colors:
  primary: "#005bbf"
  primary-container: "#1a73e8"
  secondary: "#006a61"
  surface: "#f7f9ff"
  surface-container: "#ebeef4"
  surface-container-lowest: "#ffffff"
  inverse-surface: "#2d3135"
  on-surface: "#181c20"
  on-surface-variant: "#414754"
  error: "#ba1a1a"
  outline: "#727785"
typography:
  display:
    fontFamily: "'Plus Jakarta Sans', sans-serif"
    fontWeight: "700"
    fontSize: "56px"
    lineHeight: "64px"
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Plus Jakarta Sans', sans-serif"
    fontWeight: "600"
    fontSize: "28px"
    lineHeight: "36px"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Plus Jakarta Sans', sans-serif"
  body:
    fontFamily: "'Inter', sans-serif"
  label:
    fontFamily: "'Inter', sans-serif"
    fontWeight: "500"
    fontSize: "14px"
    lineHeight: "20px"
    letterSpacing: "0.01em"
rounded:
  DEFAULT: "1rem"
  lg: "2rem"
  xl: "3rem"
  full: "9999px"
spacing:
  space-xs: "0.25rem"
  space-sm: "0.5rem"
  space-md: "1rem"
  space-lg: "1.5rem"
  space-xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary-container}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0.5rem 1.5rem"
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
---

# Design System: KBase - Hub Tri thức Dự án

## 1. Overview

**Creative North Star: "Nguồn Chân Lý Tập Trung"**

Hệ thống thiết kế của KBase mang phong cách chuyên nghiệp, cấu trúc và gọn gàng, tạo sự tin tưởng tuyệt đối cho các nhóm kỹ sư phần mềm, quản lý dự án và tổ chức công nghệ. Mọi thành phần giao diện đều ưu tiên tính rõ ràng và hiệu năng, giảm thiểu sự rườm rà. Hệ thống kiên quyết nói "Không" với các giao diện mạng xã hội màu mè hay sự lộn xộn của Google Drive truyền thống. 

**Key Characteristics:**
- Rõ ràng, tối giản (white-space)
- Cấu trúc Hierarchy mạnh mẽ
- Truy cập thông tin nhanh (Performance-focused)
- Hỗ trợ đầy đủ Dark Mode chuẩn chỉ

## 2. Colors

Bảng màu tập trung vào sự tin cậy của màu Xanh dương (Primary) kết hợp với các sắc độ xám nền nã (Surface) làm bật nội dung.

### Primary
- **Xanh KBase (Primary)** (#005bbf): Màu nhấn chính cho các nút hành động (Call To Action), đường dẫn quan trọng, và các điểm nhấn thương hiệu.

### Secondary
- **Xanh Lục (Secondary)** (#006a61): Dùng cho các trạng thái thành công, nhãn dán tích cực hoặc các chỉ báo dung lượng an toàn.

### Neutral
- **Nền Giao Diện (Surface)** (#f7f9ff): Nền chính của toàn bộ ứng dụng trong Light Mode, tạo cảm giác không gian rộng mở và sạch sẽ.
- **Nền Thẻ (Surface Container Lowest)** (#ffffff): Màu nền của các thẻ (Cards), bảng biểu, và container nội dung nổi bật so với nền Surface.
- **Màu Chữ Chính (On-Surface)** (#181c20): Màu đen ngả xám đậm dùng cho văn bản chính, đảm bảo độ tương phản cao nhưng không quá gắt như màu #000000.
- **Màu Chữ Phụ (On-Surface Variant)** (#414754): Dùng cho nhãn, thông tin phụ trợ, và văn bản mô tả nhỏ.

### Named Rules
**The One Voice Rule.** Màu Xanh KBase (Primary) chỉ được sử dụng cho các hành động mang tính quyết định (ví dụ: "Bắt đầu ngay", "Đăng nhập") hoặc các biểu tượng dẫn hướng chính. Không dùng màu Primary làm màu nền của toàn bộ các vùng lớn hoặc thẻ nội dung.

## 3. Typography

**Display Font:** 'Plus Jakarta Sans', sans-serif
**Body Font:** 'Inter', sans-serif

**Character:** Sự kết hợp giữa 'Plus Jakarta Sans' hiện đại, bo tròn nhẹ nhàng cho các tiêu đề lớn và 'Inter' thực dụng, dễ đọc tuyệt đối cho các văn bản dài.

### Hierarchy
- **Display** (700, 56px, 64px): Dành cho các tiêu đề Anh hùng (Hero) trên Landing Page.
- **Headline** (600, 28px, 36px): Tiêu đề các mục lớn, thẻ lớn trong Dashboard.
- **Body** (400, 16px, 24px): Văn bản dài, đoạn văn bản mô tả dự án.
- **Label** (500, 14px, 20px): Các nhãn dán, nội dung trong nút bấm (Buttons), và tag trạng thái.

### Named Rules
**The Readability Rule.** Mọi văn bản Body dài phải giữ độ dài dòng từ 65–75 ký tự để đảm bảo trải nghiệm đọc tài liệu (Specs, Whitepapers) dễ dàng nhất.

## 4. Elevation

Hệ thống KBase sử dụng chiến lược "Flat-by-default" (Phẳng làm chuẩn) kết hợp với "Tonal Layering" (Phân lớp màu) thay vì lạm dụng hiệu ứng đổ bóng dày đặc. 

### Shadow Vocabulary
- **Shadow-sm** (`box-shadow: 0 1px 3px rgba(0,0,0,0.08)`): Dành cho các nút bấm primary hoặc thanh tìm kiếm nổi nhẹ.
- **Shadow-md** (`box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)`): Dành cho các thẻ (cards) khi được rê chuột (hover).
- **Shadow-xl** (`box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1)`): Dành cho các dropdown, modal, và thanh header cố định nổi bật trên nội dung.

### Named Rules
**The Tonal Depth Rule.** Thay vì dùng bóng đổ lớn để tách biệt các thẻ trên màn hình Dashboard, KBase sử dụng các biến thể nền `surface-container` và `surface-container-lowest` để phân cấp độ sâu. Bóng đổ chỉ xuất hiện khi có tương tác (hover) hoặc các popover.

## 5. Components

### Buttons
- **Shape:** Bo tròn hoàn toàn (pill-shape) bằng giá trị `9999px` (`rounded-full`).
- **Primary:** Nền xanh `primary-container`, chữ `on-primary-container`. Lề trong (padding) chuẩn `px-space-lg py-space-sm`.
- **Hover / Focus:** Phản hồi hover rõ ràng bằng cách đổi sang màu `primary` tối hơn một chút kết hợp với bóng đổ nhẹ.

### Cards / Containers
- **Corner Style:** Bo góc lớn 16px hoặc 24px (`rounded-2xl` hoặc `rounded-xl`).
- **Background:** `surface-container-lowest` cho nội dung thường.
- **Shadow Strategy:** Không bóng đổ mặc định, chỉ thêm viền mỏng `border-outline-variant` để tách nền.

### Navigation (Header)
- **Style:** Nền bán trong suốt `surface-container-lowest/90` kèm theo `backdrop-blur-xl`.
- **Shadow:** Sử dụng một bóng đổ nhẹ bên dưới để tạo ranh giới tinh tế với phần nội dung cuộn.

## 6. Do's and Don'ts

Các quy định nghiêm ngặt để đảm bảo phong cách không bị phá vỡ.

### Do:
- **Do** sử dụng các biến CSS chuẩn (`bg-surface`, `text-on-surface`) để đảm bảo Dark Mode tự động hoạt động mượt mà.
- **Do** giữ lại các khoảng trống (white-space) bằng cách dùng các token spacing như `gap-space-lg`, `mb-space-md`.

### Don't:
- **Don't** lạm dụng bóng đổ lớn hoặc hiệu ứng 3D nổi khối kiểu consumer-app.
- **Don't** sử dụng màu sắc quá lòe loẹt hoặc mã Hex cứng (ví dụ `bg-[#ff0000]`) không có hậu tố `dark:` đi kèm.
- **Don't** tạo ra các không gian giao diện lộn xộn giống như cấu trúc thư mục của Google Drive thông thường.
