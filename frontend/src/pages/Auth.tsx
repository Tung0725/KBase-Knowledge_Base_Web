import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../assets/Logo_KBase.png';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';


const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [isToastError, setIsToastError] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleAuthMode = () => {
    setIsLoading(true);
    setShowToast(false);
    setTimeout(() => {
      setIsRegisterMode((prev) => !prev);
      setIsLoading(false);
    }, 500); // Tạo độ trễ 500ms
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShowToast(false);

    try {
      if (isRegisterMode) {
        if (password !== confirmPassword) {
            setToastMessage('Mật khẩu xác nhận không khớp.');
            setIsToastError(true);
            setShowToast(true);
            setIsLoading(false);
            return;
        }
        const response = await authService.register({ email, password, confirmPassword, fullName, phoneNumber });
        setToastMessage(response.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
        setIsToastError(false);
        setShowToast(true);
        setIsRegisterMode(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        const userData = await authService.login({ email, password });
        setToastMessage('Xác thực thành công! Đang chuyển tiếp vào bảng điều khiển KBase...');
        setIsToastError(false);
        setShowToast(true);

        if (userData.token) {
          localStorage.setItem('token', userData.token);
        }
        setUser(userData);

        setTimeout(() => {
          const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterAuth');
            navigate(redirectUrl);
          } else {
            navigate('/hub');
          }
        }, 2000);
      }

    } catch (error: any) {
      let errorMsg = error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';

      const errorData = error.response?.data?.data;
      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.values(errorData).join(', ');
      }

      setToastMessage(errorMsg);
      setIsToastError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const userData = await authService.googleLogin({ token: credentialResponse.credential });
      setToastMessage('Xác thực Google thành công! Đang chuyển tiếp...');
      setIsToastError(false);
      setShowToast(true);
      
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      setUser(userData);

      setTimeout(() => {
        const redirectUrl = sessionStorage.getItem('redirectAfterAuth');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterAuth');
          navigate(redirectUrl);
        } else {
          navigate('/hub');
        }
      }, 2000);
    } catch (error: any) {
      setToastMessage('Đăng nhập Google thất bại, vui lòng thử lại.');
      setIsToastError(true);
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setToastMessage('Đăng nhập Google bị hủy hoặc thất bại.');
    setIsToastError(true);
    setShowToast(true);
  };


  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col justify-between selection:bg-primary-fixed selection:text-primary">

      <header className="w-full px-6 sm:px-12 py-5 sm:py-7 flex items-center justify-between z-10 bg-transparent">

        <Link className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1" to="/">
          <img src={logoImg} alt="KBase Logo" className="w-9 h-auto object-contain group-hover:scale-105 transition-transform duration-200" />
          <div className="flex flex-col">
            <span className="font-headline-sm text-xl font-bold tracking-tight text-on-surface leading-none">KBase</span>
            <span className="text-[11px] font-medium tracking-wide text-on-surface-variant leading-tight mt-0.5">Hub Tri thức Dự án</span>
          </div>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-[13px] sm:text-sm">
          <a className="text-on-surface-variant hover:text-on-surface font-medium transition-colors hidden md:inline-block" href="#">
            Trợ giúp
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 sm:px-10 lg:px-14 flex items-center justify-center py-4 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center w-full max-w-[1240px] -mt-12 lg:-mt-20">

          <div className="hidden lg:flex lg:col-span-6 justify-center items-center select-none pointer-events-none pr-4">
            <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">

              <div className="absolute w-80 h-80 rounded-full bg-primary-fixed/45 blur-3xl -top-10 -left-10"></div>
              <div className="absolute w-72 h-72 rounded-full bg-secondary-fixed/40 blur-3xl -bottom-10 -right-10"></div>

              <svg className="w-full h-full relative z-10 drop-shadow-[0_20px_40px_rgba(0,91,191,0.07)]" fill="none" viewBox="0 0 540 500" xmlns="http://www.w3.org/2000/svg">

                <rect fill="#1e293b" height="250" rx="20" width="360" x="70" y="60"></rect>

                <rect fill="#0f172a" height="34" rx="20" width="360" x="70" y="60"></rect>
                <circle cx="94" cy="77" fill="#ef4444" r="4.5"></circle>
                <circle cx="108" cy="77" fill="#f59e0b" r="4.5"></circle>
                <circle cx="122" cy="77" fill="#10b981" r="4.5"></circle>
                <rect fill="#334155" height="12" opacity="0.6" rx="6" width="140" x="150" y="71"></rect>

                <rect fill="#1e3a8a" height="74" opacity="0.6" rx="8" width="102" x="86" y="106"></rect>
                <rect fill="#1e40af" height="74" opacity="0.4" rx="8" width="102" x="198" y="106"></rect>
                <rect fill="#1d4ed8" height="74" opacity="0.5" rx="8" width="104" x="310" y="106"></rect>
                <rect fill="#1e40af" height="74" opacity="0.4" rx="8" width="102" x="86" y="190"></rect>
                <rect fill="#1e3a8a" height="74" opacity="0.5" rx="8" width="102" x="198" y="190"></rect>
                <rect fill="#0284c7" height="74" opacity="0.5" rx="8" width="104" x="310" y="190"></rect>

                <circle cx="137" cy="135" fill="#93c5fd" r="15"></circle>
                <path d="M124 158 C124 150 150 150 150 158 Z" fill="#60a5fa"></path>
                <circle cx="249" cy="135" fill="#bae6fd" r="15"></circle>
                <path d="M236 158 C236 150 262 150 262 158 Z" fill="#38bdf8"></path>
                <circle cx="362" cy="135" fill="#cbd5e1" r="15"></circle>
                <path d="M349 158 C349 150 375 150 375 158 Z" fill="#94a3b8"></path>

                <rect fill="#0f172a" height="14" rx="7" width="140" x="180" y="278"></rect>
                <circle cx="220" cy="285" fill="#10b981" r="3"></circle>
                <circle cx="250" cy="285" fill="#38bdf8" r="3"></circle>
                <circle cx="280" cy="285" fill="#f43f5e" r="3"></circle>

                <g>

                  <rect fill="#1d4ed8" height="85" rx="6.5" width="13" x="42" y="340"></rect>
                  <rect fill="#1e40af" height="85" rx="6.5" width="13" x="62" y="340"></rect>

                  <rect fill="#0f172a" height="9" rx="4.5" width="22" x="36" y="420"></rect>
                  <rect fill="#0f172a" height="9" rx="4.5" width="22" x="58" y="420"></rect>

                  <rect fill="#f472b6" height="84" rx="14" width="38" x="38" y="260"></rect>

                  <circle cx="56" cy="235" fill="#fcd34d" r="14"></circle>
                  <path d="M46 230 C46 220 66 220 66 230 Z" fill="#1e293b"></path>

                  <path d="M48 275 L80 290" stroke="#f472b6" strokeLinecap="round" strokeWidth="9"></path>
                  <rect fill="#005bbf" height="50" opacity="0.95" rx="8" transform="rotate(-10 32 275)" width="80" x="32" y="275"></rect>
                  <rect fill="#ffffff" height="6" opacity="0.8" rx="3" transform="rotate(-10 32 275)" width="40" x="44" y="288"></rect>
                  <rect fill="#bfdbfe" height="4" opacity="0.8" rx="2" transform="rotate(-10 32 275)" width="25" x="44" y="298"></rect>
                </g>

                <g>

                  <rect fill="#1e293b" height="120" rx="7.5" width="15" x="425" y="260"></rect>
                  <rect fill="#334155" height="110" rx="7.5" width="15" x="448" y="260"></rect>

                  <rect fill="#0284c7" height="10" rx="5" width="24" x="422" y="375"></rect>
                  <rect fill="#0284c7" height="10" rx="5" width="24" x="448" y="365"></rect>

                  <rect fill="#10b981" height="70" rx="14" width="40" x="420" y="195"></rect>

                  <circle cx="442" cy="172" fill="#fed7aa" r="14"></circle>
                  <path d="M430 170 C430 156 454 156 454 170 Z" fill="#d97706"></path>

                  <path d="M450 170 C458 178 456 195 450 205" stroke="#d97706" strokeLinecap="round" strokeWidth="5"></path>

                  <path d="M430 205 L385 185" stroke="#10b981" strokeLinecap="round" strokeWidth="9"></path>

                  <rect fill="#1a73e8" height="48" opacity="0.95" rx="8" width="75" x="360" y="155"></rect>
                  <circle cx="380" cy="174" fill="#ffffff" opacity="0.9" r="8"></circle>
                  <rect fill="#ffffff" height="6" opacity="0.85" rx="3" width="30" x="394" y="171"></rect>
                </g>

                <g>
                  <rect fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.06))" height="52" rx="14" width="150" x="320" y="335"></rect>
                  <circle cx="344" cy="361" fill="#e0e7ff" r="14"></circle>
                  <path d="M339 361 L343 365 L350 357" stroke="#4338ca" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                  <rect fill="#1e293b" height="6" rx="3" width="70" x="366" y="352"></rect>
                  <rect fill="#94a3b8" height="4" rx="2" width="45" x="366" y="364"></rect>
                </g>
                <g>
                  <rect fill="#ffffff" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.06))" height="48" rx="14" width="135" x="130" y="330"></rect>
                  <circle cx="152" cy="354" fill="#dcfce7" r="13"></circle>
                  <circle cx="152" cy="354" fill="#16a34a" r="5"></circle>
                  <rect fill="#1e293b" height="6" rx="3" width="60" x="172" y="347"></rect>
                  <rect fill="#94a3b8" height="4" rx="2" width="40" x="172" y="358"></rect>
                </g>
              </svg>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col items-center lg:items-start justify-center w-full">
            <div className="w-full max-w-[420px] mx-auto lg:mx-0">

              <div className="text-left mb-7">
                <h1 className="font-headline-md text-3xl sm:text-[34px] font-bold text-on-surface tracking-tight" id="formMainTitle">
                  {isRegisterMode ? "Đăng ký tài khoản" : "Đăng nhập"}
                </h1>
                <p className="font-body-sm text-[14px] text-on-surface-variant mt-1.5 leading-relaxed" id="formSubTitle">
                  {isRegisterMode ? "Khởi tạo không gian lưu trữ và cộng tác dự án ngay hôm nay." : "Truy cập tài nguyên tri thức và biên bản dự án nhóm."}
                </p>
              </div>

              <div className={`mb-5 p-3.5 rounded-xl ${isToastError ? 'bg-error-container text-on-error-container' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'} text-sm font-medium items-center gap-2.5 transition-all ${showToast ? 'flex' : 'hidden'}`} id="statusToast">
                <span className="material-symbols-outlined text-[20px]">{isToastError ? 'error' : 'check_circle'}</span>
                <span id="statusToastText">{toastMessage}</span>
              </div>

              <form className="space-y-4" id="coreAuthForm" onSubmit={handleSubmit}>

                <div className={`flex-col gap-1 ${isRegisterMode ? 'flex' : 'hidden'}`} id="regNameField">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="fullNameInput">Họ và tên thành viên</label>
                  <input className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-on-surface placeholder:text-outline text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm disabled:opacity-50" id="fullNameInput" placeholder="Nguyễn Văn An" type="text" value={fullName} onChange={e => setFullName(e.target.value)} disabled={isLoading} required={isRegisterMode} />
                </div>

                <div className={`flex-col gap-1 ${isRegisterMode ? 'flex' : 'hidden'}`} id="regPhoneField">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="phoneInput">Số điện thoại</label>
                  <input className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-on-surface placeholder:text-outline text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm disabled:opacity-50" id="phoneInput" placeholder="0987654321" type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} disabled={isLoading} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="sr-only" htmlFor="emailInput">Email trường hoặc tổ chức</label>
                  <input className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-on-surface placeholder:text-outline text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm disabled:opacity-50" id="emailInput" placeholder="Email trường hoặc tổ chức" required type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="sr-only" htmlFor="passwordInput">Mật khẩu</label>
                  <div className="relative flex items-center">
                    <input className="w-full pl-4 pr-11 py-3 bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-on-surface placeholder:text-outline text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm disabled:opacity-50" id="passwordInput" placeholder="Mật khẩu" required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} />
                    <button aria-label="Hiển thị mật khẩu" className="absolute right-3.5 text-outline hover:text-on-surface transition-colors p-0.5 focus:outline-none" onClick={() => setShowPassword(!showPassword)} title="Hiển thị/Ẩn mật khẩu" type="button" disabled={isLoading}>
                      <span className="material-symbols-outlined text-[20px]" id="pwdEyeIcon">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                <div className={`flex-col gap-1 ${isRegisterMode ? 'flex' : 'hidden'}`} id="regConfirmPwdField">
                  <label className="sr-only" htmlFor="confirmPasswordInput">Xác nhận mật khẩu</label>
                  <div className="relative flex items-center">
                    <input className="w-full pl-4 pr-11 py-3 bg-surface-container-lowest border border-outline-variant/80 rounded-xl text-on-surface placeholder:text-outline text-body-md focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm disabled:opacity-50" id="confirmPasswordInput" placeholder="Xác nhận mật khẩu" required={isRegisterMode} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={isLoading} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <input defaultChecked className="w-4 h-4 rounded text-primary focus:ring-0 accent-primary border-outline-variant cursor-pointer" id="staySignedIn" type="checkbox" />
                    <label className="text-on-surface-variant select-none cursor-pointer" htmlFor="staySignedIn">
                      Duy trì đăng nhập
                    </label>
                  </div>
                  <a className="text-primary hover:text-primary-container font-semibold transition-colors" href="#">
                    Quên mật khẩu?
                  </a>
                </div>

                <button className="w-full py-3 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary-container font-headline-sm text-[15px] font-semibold tracking-normal shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-150 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-wait" id="submitCtaBtn" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span id="submitCtaText">{isRegisterMode ? "Tạo tài khoản KBase" : "Đăng nhập"}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>

                <div className="pt-3 flex items-center justify-center gap-1.5 text-sm">
                  <span className="text-on-surface-variant">{isRegisterMode ? "Đã có tài khoản KBase?" : "Bạn mới sử dụng KBase?"}</span>
                  <button className="text-primary hover:text-primary-container font-semibold transition-colors underline-offset-4 hover:underline" onClick={toggleAuthMode} type="button">
                    {isRegisterMode ? "Đăng nhập" : "Đăng ký ngay"}
                  </button>
                </div>
              </form>

              <div className="relative flex items-center justify-center my-6">
                <div className="w-full border-t border-surface-container-high"></div>
                <span className="absolute bg-surface px-3 text-[12px] font-medium text-outline uppercase tracking-wider">
                  Hoặc đăng nhập với
                </span>
              </div>

              <div className="flex justify-center mb-6 w-full">
                <GoogleOAuthProvider clientId="297067151118-8o4n846uvpuckfeq1eq2l4832esunfkh.apps.googleusercontent.com">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="filled_blue"
                    shape="pill"
                    text={isRegisterMode ? "signup_with" : "signin_with"}
                    size="large"
                    width="100%"
                  />
                </GoogleOAuthProvider>
              </div>

              <div className="text-center pt-2">
                <p className="text-[12px] text-outline leading-relaxed">
                  Bằng việc đăng nhập, bạn đồng ý với{' '}
                  <a className="text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors" href="#">Điều khoản dịch vụ</a>
                  {' '}và{' '}
                  <a className="text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors" href="#">Chính sách quyền riêng tư</a>
                  {' '}của KBase.
                </p>
              </div>


            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-outline font-medium">
        KBase • Không gian Quản trị Tri thức & Bản quyền Học thuật 2026
      </footer>



    </motion.div>
  );
};

export default Auth;
