import React, { useEffect, useState } from 'react';

const Portal: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-container text-on-primary-container rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        title="Toggle Dark/Light Mode"
      >
        <span className="material-symbols-outlined">
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="h-20 max-w-[1280px] mx-auto px-gutter flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-md"><a className="flex items-center gap-space-sm group" data-path="landing-page" href="#"><div className="w-10 h-10 rounded-DEFAULT bg-primary-fixed flex items-center justify-center text-primary transition-transform group-hover:scale-105"><span className="material-symbols-outlined text-[22px]">menu_book</span></div><div className="flex flex-col"><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface leading-none">KBase</span><span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">Hub Tri thức Dự án</span></div></a></div><nav className="hidden lg:flex items-center gap-space-lg" data-active-classes="text-primary font-semibold"><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-space-xs" data-path="solutions" href="#">Giải pháp</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-space-xs" data-path="features" href="#">Tính năng</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-space-xs" data-path="roles-permissions" href="#">Phân quyền & Vai trò</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-space-xs" data-path="security" href="#">Bảo mật</a><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors py-space-xs" data-path="pricing" href="#">Bảng giá</a></nav><div className="flex items-center gap-space-sm"><button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" title="Tìm kiếm hoặc Demo nhanh" type="button"><span className="material-symbols-outlined text-[20px]">search</span></button><a className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-space-md py-space-sm rounded-full transition-colors hidden sm:inline-flex items-center" data-path="login" href="#">Đăng nhập</a><a className="font-label-md text-label-md bg-primary-container text-on-primary-container hover:bg-primary px-space-lg py-space-sm rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all flex items-center gap-space-xs" data-path="register" href="#"><span>Bắt đầu ngay</span><span className="material-symbols-outlined text-[16px]">arrow_forward</span></a><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-space-xs"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div></div></div></header><main className="w-full pt-20 bg-surface min-h-screen"><div className="flex flex-col w-full">

        <section className="relative w-full overflow-hidden pt-space-lg pb-space-xl">

          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-primary-fixed/45 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          <div className="absolute top-40 right-10 w-[380px] h-[260px] bg-secondary-container/40 blur-[100px] rounded-full pointer-events-none -z-10"></div>
          <div className="max-w-[1280px] mx-auto px-gutter flex flex-col items-center text-center">

            <div className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-surface-container-lowest shadow-sm mb-space-lg transition-transform hover:scale-[1.02] cursor-default">
              <span className="text-primary text-[14px]">✨</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold tracking-wide">
                Trung tâm Lưu trữ & Quản trị Tri thức Dự án Tập trung
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary mx-1"></span>
              <span className="font-label-sm text-label-sm text-primary font-medium">v2.4 Live</span>
            </div>

            <h1 className="font-display text-display text-on-surface max-w-4xl tracking-tight leading-tight mb-space-md">
              Một nguồn chân lý duy nhất <span className="text-primary font-display">(Single Source of Truth)</span> cho mọi dự án của bạn
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-xl leading-relaxed">
              Chấm dứt tình trạng tài liệu, video họp và báo cáo bị phân tán rải rác trên Drive, Zalo hay Slack. KBase giúp lưu trữ an toàn, phân quyền chặt chẽ và tìm kiếm tức thì chỉ trong vài giây.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md w-full max-w-md mb-space-xl">
              <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-xl py-3.5 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md shadow-md hover:bg-primary transition-all group" data-path="register" href="#">
                <span>Khám phá không gian mẫu</span>
                <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">arrow_forward</span>
              </a>
              <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-3.5 rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-all" data-path="login" href="#">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
                </svg>
                <span>Đăng nhập với Google</span>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-space-sm sm:gap-space-md py-space-sm px-space-lg rounded-full bg-surface-container-low shadow-sm">
              <div className="flex -space-x-2 shrink-0">
                <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-[11px] font-bold shadow-sm">BK</div>
                <div className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary text-[11px] font-bold shadow-sm">FPT</div>
                <div className="w-7 h-7 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary text-[11px] font-bold shadow-sm">VNG</div>
                <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[11px] font-bold shadow-sm">+99</div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Được tin cậy bởi hơn <span className="font-semibold text-on-surface">1,200+ nhóm kỹ thuật</span>, đồ án capstone và tổ chức công nghệ.
              </span>
            </div>
          </div>

          <div className="max-w-[1240px] mx-auto px-gutter mt-space-xl">
            <div className="relative bg-surface-container-lowest rounded-xl shadow-xl p-space-md sm:p-space-lg">

              <div className="flex items-center justify-between pb-space-md mb-space-md bg-surface-container-low/60 rounded-DEFAULT px-space-md py-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error/70"></span>
                  <span className="w-3 h-3 rounded-full bg-[#fbbc04]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#34a853]"></span>
                  <div className="ml-4 flex items-center gap-1.5 px-3 py-1 bg-surface-container-lowest rounded-full shadow-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span className="font-label-sm text-[11px]">kbase.internal/workspace/prj-capstone-2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">Dung lượng Hub:</span>
                  <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-secondary text-[16px]">cloud_done</span>
                    <span className="font-label-sm text-[12px] font-semibold text-on-surface">14.5 GB / 100 GB</span>
                    <div className="w-16 h-2 bg-surface-container rounded-full overflow-hidden hidden md:block">
                      <div className="w-[14.5%] h-full bg-secondary rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">

                <div className="lg:col-span-3 bg-surface-container-low rounded-DEFAULT p-space-md flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-space-md px-2">
                      <div className="w-8 h-8 rounded-DEFAULT bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
                        KB
                      </div>
                      <div>
                        <h4 className="font-label-md text-label-md font-semibold text-on-surface">Khoa CNTT - Khóa 21</h4>
                        <p className="font-label-sm text-[11px] text-on-surface-variant">8 Không gian Dự án</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-3 py-2 rounded-full bg-primary-fixed text-primary font-medium text-xs">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">folder_open</span>
                          Tất cả không gian
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-lowest">12</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-surface-container text-on-surface-variant text-xs transition-colors">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">video_library</span>
                          Recordings cuộc họp
                        </span>
                        <span className="text-[10px] bg-surface-variant px-1.5 py-0.5 rounded-full">28</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-surface-container text-on-surface-variant text-xs transition-colors">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          Specs & Báo cáo Sprint
                        </span>
                        <span className="text-[10px] bg-surface-variant px-1.5 py-0.5 rounded-full">145</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 rounded-full hover:bg-surface-container text-on-surface-variant text-xs transition-colors">
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">security</span>
                          Nhật ký kiểm toán
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-2.5 rounded-DEFAULT shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shrink-0">
                        PM
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-sm text-xs font-semibold text-on-surface truncate">Trần Quang Huy</p>
                        <p className="font-label-sm text-[10px] text-secondary font-medium">Project Owner</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-on-surface-variant">verified</span>
                  </div>
                </div>

                <div className="lg:col-span-9 flex flex-col space-y-space-md">

                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                    <input className="w-full pl-12 pr-28 py-3 bg-surface-container-low rounded-full font-body-sm text-body-sm text-on-surface cursor-pointer shadow-sm focus:outline-none" readOnly type="text" value="Tìm kiếm báo cáo SRS, video Sprint 4, hoặc bản vẽ kiến trúc microservices..." />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <kbd className="px-2 py-0.5 text-[11px] font-semibold bg-surface-container-lowest text-on-surface-variant rounded shadow-sm">⌘</kbd>
                      <kbd className="px-2 py-0.5 text-[11px] font-semibold bg-surface-container-lowest text-on-surface-variant rounded shadow-sm">K</kbd>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

                    <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm hover:shadow-md transition-all group cursor-pointer bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary-fixed/20">
                      <div className="flex items-start justify-between mb-space-sm">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[22px]">psychology</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-primary-fixed/60 text-primary font-label-sm text-[11px] font-semibold">
                          Đang chạy • Sprint 6
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">
                        AI Research Whitepaper 2026
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-md">
                        Tập hợp phân tích thuật toán RAG, các mô hình nhúng tri thức nội bộ và video thảo luận kỹ thuật cùng Cố vấn GS. Đỗ Nam.
                      </p>
                      <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-[12px]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-secondary">video_camera_front</span>
                          12 Video họp (4K)
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-primary">folder_zip</span>
                          4.2 GB
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm hover:shadow-md transition-all group cursor-pointer bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-secondary-container/20">
                      <div className="flex items-start justify-between mb-space-sm">
                        <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined text-[22px]">domain_verification</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-secondary font-label-sm text-[11px] font-semibold">
                          Đã duyệt SRS
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">
                        FPT Talent Assessment Platform
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-md">
                        Không gian lưu hồ sơ nghiệp vụ, thiết kế cơ sở dữ liệu PostgreSQL và toàn bộ tài liệu kiểm thử bàn giao giai đoạn 1.
                      </p>
                      <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-[12px]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-primary">article</span>
                          34 Files Doc & PDF
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-on-surface">
                          <span className="material-symbols-outlined text-[16px] text-secondary">storage</span>
                          2.8 GB
                        </span>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex items-start justify-between mb-space-sm">
                        <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                          <span className="material-symbols-outlined text-[22px]">code_blocks</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px] font-semibold">
                          Private Repo
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">
                        SWE System Specs & Architecture
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-md">
                        Quy chuẩn API RESTful, sequence diagrams, kiến trúc Event-Driven Kafka cùng hướng dẫn CI/CD triển khai Kubernetes.
                      </p>
                      <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-[12px]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">group</span>
                          8 Kỹ sư Backend
                        </span>
                        <span className="font-semibold text-on-surface">1.1 GB</span>
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest rounded-DEFAULT p-space-md shadow-sm hover:shadow-md transition-all group cursor-pointer">
                      <div className="flex items-start justify-between mb-space-sm">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
                          <span className="material-symbols-outlined text-[22px]">palette</span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-secondary font-label-sm text-[11px] font-semibold">
                          Đồng bộ Figma
                        </span>
                      </div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1 group-hover:text-primary transition-colors">
                        UX Design Guidelines & Assets
                      </h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-md">
                        Bộ UI Kit tổng thể, Design Token, font bản quyền, video test người dùng thực tế và biên bản nghiệm thu giao diện.
                      </p>
                      <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-label-sm text-[12px]">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px] text-tertiary">movie</span>
                          6 Video Usability
                        </span>
                        <span className="font-semibold text-on-surface">6.4 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-space-xl bg-surface-container-low/50">
          <div className="max-w-[1280px] mx-auto px-gutter">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-xl">
              <span className="font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase mb-space-xs">
                VẤN ĐỀ CỦA LÀM VIỆC NHÓM
              </span>
              <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mb-space-sm">
                Tại sao các dự án thường mất hàng chục giờ vì thất lạc thông tin?
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Khi dự án bước vào cao điểm, dữ liệu bắt đầu bị xé nhỏ ra nhiều kênh giao tiếp. KBase giải quyết triệt để sự lộn xộn này bằng chuẩn kiến trúc tập trung.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">

              <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[24px]">folder_off</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-error uppercase">Vấn nạn 01</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1 mb-space-sm">
                    Thông tin phân tán & Thất lạc
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg leading-relaxed">
                    Tài liệu gửi qua tin nhắn Zalo hết hạn xem, link Google Drive bị trôi mất tích, video meeting 2 tiếng không ai biết lưu ở thư mục nào.
                  </p>
                </div>
                <div className="p-space-md rounded-DEFAULT bg-primary-fixed/30 text-on-surface flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary font-semibold font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Giải pháp KBase Hub</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Thư mục dự án tập trung, cấu trúc chuẩn hóa cho từng sprint & giai đoạn, dữ liệu không bao giờ hết hạn.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[24px]">person_add_disabled</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-tertiary uppercase">Vấn nạn 02</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1 mb-space-sm">
                    Onboarding nhân sự mới tốn công
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg leading-relaxed">
                    Mỗi khi có thành viên mới hoặc đổi Leader, nhóm mất từ 3 đến 5 ngày chỉ để gửi lại các file rời rạc và giải thích lại bối cảnh cũ.
                  </p>
                </div>
                <div className="p-space-md rounded-DEFAULT bg-secondary-fixed/40 text-on-surface flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-secondary font-semibold font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Giải pháp KBase Hub</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Không gian mở xem ngay tài liệu cũ, video họp ghi lại giúp thành viên mới nắm bắt toàn cảnh dự án chỉ sau 1 ngày.
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[24px]">lock_reset</span>
                  </div>
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface-variant uppercase">Vấn nạn 03</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-1 mb-space-sm">
                    Rủi ro rò rỉ & Thiếu phân quyền
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg leading-relaxed">
                    Chia sẻ link công khai vô tình làm lộ file bí mật kinh doanh hoặc sinh viên vô tình xóa mất bản thiết kế công sức cả tháng của cả nhóm.
                  </p>
                </div>
                <div className="p-space-md rounded-DEFAULT bg-surface-container text-on-surface flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-primary font-semibold font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Giải pháp KBase Hub</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface">
                    Quản trị vai trò chặt chẽ (Admin, Project Owner, Member), chia sẻ an toàn nội bộ với Audit Log minh bạch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-space-xl">
          <div className="max-w-[1280px] mx-auto px-gutter">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-xl gap-space-md">
              <div>
                <span className="font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase">
                  TÍNH NĂNG MAY ĐO THEO VAI TRÒ
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mt-1">
                  Được xây dựng cho từng vị trí trong dự án
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Dù bạn là người điều phối tổng thể, thành viên trực tiếp sản xuất tài nguyên hay quản trị viên bảo mật hệ thống.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">

              <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
                    </div>
                    <span className="font-label-sm text-[11px] font-bold px-3 py-1 rounded-full bg-primary text-on-primary">
                      ROLE 01
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
                    Project Owner (PM)
                  </h3>
                  <p className="font-label-md text-label-md text-primary font-medium mb-space-md">
                    Người điều phối & kiểm soát tiến độ
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                    Khởi tạo không gian, phân quyền thư mục, mời thành viên, theo dõi toàn bộ tệp tin & video báo cáo của dự án trong tầm mắt.
                  </p>
                  <ul className="space-y-2.5 mb-space-lg">
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">add_circle</span>
                      <span>Tạo workspace dự án không giới hạn số sprint</span>
                    </li>
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">lock_person</span>
                      <span>Phân quyền chi tiết: Read-only hoặc Full Contributor</span>
                    </li>
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">download_done</span>
                      <span>Xuất gói tài liệu nghiệm thu dự án chỉ với 1 click</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-space-md bg-surface-container-low rounded-DEFAULT p-space-md">
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                    <span>Độ hoàn thiện tài liệu Capstone</span>
                    <span className="font-semibold text-primary">88%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="w-[88%] h-full bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
                    </div>
                    <span className="font-label-sm text-[11px] font-bold px-3 py-1 rounded-full bg-secondary text-on-secondary">
                      ROLE 02
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
                    Project Member
                  </h3>
                  <p className="font-label-md text-label-md text-secondary font-medium mb-space-md">
                    Kỹ sư, Designer & Nghiên cứu viên
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                    Tải lên báo cáo thiết kế & video họp, tìm kiếm thần tốc, truy cập mọi tài nguyên được chia sẻ mà không cần hỏi đi hỏi lại.
                  </p>
                  <ul className="space-y-2.5 mb-space-lg">
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">cloud_upload</span>
                      <span>Tải lên video dung lượng lớn không lo gián đoạn</span>
                    </li>
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">manage_search</span>
                      <span>Tìm kiếm nội dung tài liệu bằng công nghệ Smart Index</span>
                    </li>
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">comment</span>
                      <span>Ghi chú & bình luận trực tiếp trên dòng thời gian video</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-space-md bg-surface-container-low rounded-DEFAULT p-space-md">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">bolt</span>
                    <p className="font-label-sm text-[12px] text-on-surface">
                      Tốc độ tải lên trung bình: <span className="font-semibold">45 MB/giây</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="w-12 h-12 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined text-[26px]">admin_panel_settings</span>
                    </div>
                    <span className="font-label-sm text-[11px] font-bold px-3 py-1 rounded-full bg-tertiary text-on-tertiary">
                      ROLE 03
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
                    System Admin
                  </h3>
                  <p className="font-label-md text-label-md text-tertiary font-medium mb-space-md">
                    Quản trị viên hạ tầng & bảo mật
                  </p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                    Bao quát toàn bộ hệ thống, quản trị tài khoản, kiểm soát dung lượng lưu trữ phân bổ & truy vết nhật ký hoạt động (Audit log).
                  </p>
                  <ul className="space-y-2.5 mb-space-lg">
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">monitoring</span>
                      <span>Theo dõi hạn ngạch lưu trữ Cloud từng phòng ban/dự án</span>
                    </li>
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">history</span>
                      <span>Audit log 100% hoạt động tải xuống và phân quyền</span>
                    </li>
                    <li className="flex items-start gap-2 text-on-surface font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">policy</span>
                      <span>Đồng bộ Single Sign-On (SSO Google Workspace)</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-space-md bg-surface-container-low rounded-DEFAULT p-space-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Bảo mật đạt chuẩn</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary font-semibold text-[11px]">SOC2 Type II</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-space-xl bg-surface-container-low/40">
          <div className="max-w-[1280px] mx-auto px-gutter">
            <div className="bg-surface-container-lowest rounded-xl p-space-lg md:p-space-xl shadow-md">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center">

                <div className="lg:col-span-6 flex flex-col">
                  <span className="font-label-sm text-label-sm font-semibold tracking-wider text-primary uppercase mb-space-xs">
                    HẠ TẦNG DỮ LIỆU ĐA PHƯƠNG TIỆN
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mb-space-md">
                    Tối ưu cho cả tệp văn phòng lẫn video cuộc họp 4K
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-space-lg leading-relaxed">
                    Không còn nỗi lo hết bộ nhớ hay video bị nén giảm chất lượng. KBase cung cấp trình phát video trực tiếp, xem trước tài liệu PDF mà không cần tải về máy.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mb-space-lg">
                    <div className="flex items-center gap-2 p-2.5 rounded-DEFAULT bg-surface-container-low">
                      <span className="material-symbols-outlined text-error text-[20px]">picture_as_pdf</span>
                      <span className="font-label-sm text-on-surface font-medium">Báo cáo PDF</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-DEFAULT bg-surface-container-low">
                      <span className="material-symbols-outlined text-primary text-[20px]">video_file</span>
                      <span className="font-label-sm text-on-surface font-medium">MP4 / Video 4K</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-DEFAULT bg-surface-container-low">
                      <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
                      <span className="font-label-sm text-on-surface font-medium">DOCX / XLSX</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-DEFAULT bg-surface-container-low">
                      <span className="material-symbols-outlined text-tertiary text-[20px]">draw</span>
                      <span className="font-label-sm text-on-surface font-medium">Figma / Zip</span>
                    </div>
                  </div>

                  <div className="space-y-space-sm">
                    <div className="flex items-center gap-space-sm">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="font-body-sm text-body-sm text-on-surface">Khả năng mở rộng dung lượng linh hoạt tới 10 Terabytes cho tổ chức</span>
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="font-body-sm text-body-sm text-on-surface">Tự động gắn nhãn (Auto-tagging) và tạo phụ đề video bằng AI thông minh</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-6 bg-surface-container-low rounded-lg p-space-lg shadow-sm">
                  <div className="flex items-center justify-between mb-space-md">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">pie_chart</span>
                      <h4 className="font-label-md text-label-md font-semibold text-on-surface">Phân tích dung lượng Hub</h4>
                    </div>
                    <span className="font-label-sm text-[12px] bg-secondary-fixed text-secondary px-2.5 py-1 rounded-full font-semibold">
                      Còn trống 85.5 GB
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-space-lg py-space-sm">
                    <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">

                        <circle className="text-surface-variant" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeWidth="12"></circle>

                        <circle className="text-primary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="100.48" strokeWidth="12"></circle>

                        <circle className="text-secondary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="160" strokeWidth="12"></circle>

                        <circle className="text-tertiary" cx="50" cy="50" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset="213.5" strokeWidth="12"></circle>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="font-headline-sm text-headline-sm font-bold text-on-surface">14.5%</span>
                        <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">Đã sử dụng</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 w-full">
                      <div className="flex items-center justify-between p-2 rounded-DEFAULT bg-surface-container-lowest">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-primary"></span>
                          <span className="font-label-sm text-xs font-medium text-on-surface">Video meeting & Record</span>
                        </div>
                        <span className="font-label-sm text-xs font-semibold text-on-surface">8.7 GB</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-DEFAULT bg-surface-container-lowest">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-secondary"></span>
                          <span className="font-label-sm text-xs font-medium text-on-surface">Báo cáo & Specs tài liệu</span>
                        </div>
                        <span className="font-label-sm text-xs font-semibold text-on-surface">3.6 GB</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-DEFAULT bg-surface-container-lowest">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-tertiary"></span>
                          <span className="font-label-sm text-xs font-medium text-on-surface">Bản vẽ thiết kế UI/UX</span>
                        </div>
                        <span className="font-label-sm text-xs font-semibold text-on-surface">2.2 GB</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-space-md p-space-sm rounded-DEFAULT bg-surface-container-lowest flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[18px]">speed</span>
                      <span className="font-label-sm text-xs text-on-surface-variant">Băng thông CDN tối ưu:</span>
                    </div>
                    <span className="font-label-sm text-xs font-bold text-secondary">Không giới hạn lưu lượng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-space-xl">
          <div className="max-w-[1280px] mx-auto px-gutter">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-container text-on-primary p-space-xl md:p-margin text-center shadow-xl">

              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-on-primary/10 blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-secondary-fixed/20 blur-2xl pointer-events-none"></div>
              <div className="relative max-w-2xl mx-auto flex flex-col items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-on-primary/10 text-on-primary font-label-sm text-label-sm mb-space-md backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Khởi chạy miễn phí • Không yêu cầu thẻ tín dụng</span>
                </span>
                <h2 className="font-display text-headline-lg md:text-display font-bold mb-space-md leading-tight tracking-tight text-on-primary">
                  Sẵn sàng đưa tri thức dự án vào trật tự?
                </h2>
                <p className="font-body-lg text-body-lg text-primary-fixed mb-space-xl max-w-xl">
                  Thiết lập không gian KBase đầu tiên của bạn chỉ trong 30 giây. Hoàn toàn miễn phí cho nhóm dự án nhỏ và đồ án sinh viên.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-space-md w-full max-w-md">
                  <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-xl py-4 rounded-full bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold shadow-lg hover:bg-surface-container-low transition-all" data-path="register" href="#">
                    <span>Bắt đầu sử dụng KBase ngay</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </a>
                  <a className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-4 rounded-full bg-on-primary/10 text-on-primary font-label-md text-label-md hover:bg-on-primary/20 transition-all backdrop-blur-sm" data-path="documentation" href="#">
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                    <span>Liên hệ hỗ trợ tổ chức</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div></main><footer className="w-full bg-surface-container-lowest shadow-[0_-1px_6px_rgba(0,0,0,0.03)]"><div className="max-w-[1280px] mx-auto px-gutter pt-space-xl pb-space-lg"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-gutter-lg mb-space-xl"><div className="lg:col-span-2 flex flex-col items-start pr-space-lg"><div className="flex items-center gap-space-sm mb-space-sm"><div className="w-9 h-9 rounded-DEFAULT bg-primary-fixed flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[20px]">menu_book</span></div><span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">KBase</span></div><p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-space-md">Không gian tổng hợp tri thức, tài liệu và quy trình dự án hiện đại. Được tối ưu hoá để loại bỏ phân mảnh thông tin trong các nhóm nghiên cứu và phát triển.</p><div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm"><span className="w-2 h-2 rounded-full bg-secondary"></span><span>Hệ thống hoạt động ổn định</span></div></div><div><h4 className="font-label-md text-label-md text-on-surface font-semibold mb-space-md">Sản phẩm</h4><ul className="flex flex-col gap-space-sm"><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="features" href="#">Tính năng cốt lõi</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="solutions" href="#">Kho lưu trữ thông minh</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="pricing" href="#">Gói chi phí & Ưu đãi</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="landing-page" href="#">Lộ trình phát triển</a></li></ul></div><div><h4 className="font-label-md text-label-md text-on-surface font-semibold mb-space-md">Giải pháp đội ngũ</h4><ul className="flex flex-col gap-space-sm"><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="solutions" href="#">Dành cho Project Manager</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="solutions" href="#">Dành cho Thành viên</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="roles-permissions" href="#">Quản trị viên (Admin)</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="security" href="#">Bảo mật & Tuân thủ</a></li></ul></div><div><h4 className="font-label-md text-label-md text-on-surface font-semibold mb-space-md">Tài nguyên</h4><ul className="flex flex-col gap-space-sm"><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="documentation" href="#">Tài liệu hướng dẫn</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="security" href="#">Chính sách bảo mật</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="terms-of-service" href="#">Điều khoản dịch vụ</a></li><li className="font-body-sm text-body-sm"><a className="text-on-surface-variant hover:text-on-surface transition-colors" data-path="documentation" href="#">Trung tâm hỗ trợ</a></li></ul></div></div><div className="pt-space-md flex flex-col sm:flex-row items-center justify-between gap-space-sm"><p className="font-label-sm text-label-sm text-on-surface-variant">© 2026 KBase Hub. Bản quyền được bảo hộ.</p><div className="flex items-center gap-space-md"><a className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="security" href="#">Bảo mật dữ liệu</a><a className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="terms-of-service" href="#">Quyền riêng tư</a></div></div></div></footer>
    </div>
  );
};

export default Portal;
