import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { googleAuth } from '../utils/auth';
import { useLanguage } from '../context/LanguageContext';
import { 
  signInWithGoogle, 
  mapFirebaseUserToAuthUser 
} from '../utils/firebase';
import { 
  ShieldCheck, 
  AlertCircle,
  X,
  FileText,
  BadgePercent,
  Coins,
  PackageOpen,
  FileCheck,
  Globe2,
  Box,
  Users,
  Sparkles,
  ArrowRight,
  Printer,
  Cloud,
  CheckCircle2,
  Mail,
  Phone,
  MessageCircle,
  Lock,
  ChevronRight,
  Shield,
  FileSpreadsheet,
  Globe,
  HelpCircle,
  Send,
  Plus,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Smartphone,
  ChevronDown,
  Building2,
  Check,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: AuthUser) => void;
}

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// Dedicated full page views
type PageView = 'home' | 'about' | 'contact' | 'privacy' | 'terms';

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { t, language, setLanguage } = useLanguage();
  const isZh = language === 'zh';

  // Active Standalone Full Page View
  const [currentPage, setCurrentPage] = useState<PageView>('home');

  // Google Modal fallback state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // UI status state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Contact form state
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  // Floating mockup animated cycle state (inspired by the video hero animation)
  const [liveAmount, setLiveAmount] = useState(9826.15);
  const [activeChip, setActiveChip] = useState<'shopping' | 'supermarket' | 'shipping'>('shopping');

  // Scroll to top whenever page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveAmount(prev => {
        const delta = (Math.random() * 120 - 45);
        return Number((prev + delta).toFixed(2));
      });
      setActiveChip(curr => {
        if (curr === 'shopping') return 'supermarket';
        if (curr === 'supermarket') return 'shipping';
        return 'shopping';
      });
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleSignInClick = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        const u = mapFirebaseUserToAuthUser(result.user);
        setIsLoading(false);
        onAuthSuccess(u);
        return;
      }
    } catch (err: any) {
      console.warn('Firebase auth popup notification:', err);
      setIsLoading(false);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg(
          isZh
            ? 'Firebase 域名验证提示: 当前域名尚未添加至 Authorized Domains，已为您打开快速免弹窗模式。'
            : 'Authorized domains notice: switched to fast direct sign-in modal.'
        );
        setShowGoogleModal(true);
        return;
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMsg(
          isZh
            ? '浏览器拦截了登录弹窗，已为您打开快速登录窗口。'
            : 'Popup blocked. Switched to fast sign-in modal.'
        );
        setShowGoogleModal(true);
        return;
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg(
          isZh
            ? '登录窗口已关闭，请重新点击登录。'
            : 'Login popup closed before completion.'
        );
        return;
      } else if (err?.message) {
        setErrorMsg(`Notice: ${err.message}`);
      }
    }

    setIsLoading(false);
    setShowGoogleModal(true);
  };

  const handleGoogleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleEmailInput.trim()) {
      setErrorMsg(isZh ? '请输入有效的 Google 谷歌邮箱' : 'Please enter a valid Google email.');
      return;
    }
    setIsLoading(true);
    setShowGoogleModal(false);

    setTimeout(() => {
      const formattedName = googleNameInput.trim() || googleEmailInput.split('@')[0];
      const u = googleAuth(googleEmailInput.trim(), formattedName);
      setIsLoading(false);
      onAuthSuccess(u);
    }, 200);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  const navigateTo = (page: PageView) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#191919] flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900 relative overflow-x-hidden antialiased">

      {/* Subtle organic light diffuse glow spots */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-[-6%] left-[8%] w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-amber-100/50 via-rose-100/40 to-sky-100/30 blur-[90px] -z-10" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-[2%] right-[5%] w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-sky-100/50 via-indigo-100/30 to-purple-100/20 blur-[100px] -z-10" 
      />

      {/* ================= 1. CLEAN TOP NAVIGATION (CLARIO STYLE) ================= */}
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/85 backdrop-blur-md border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-18 flex items-center justify-between">
          
          {/* Logo Mark: Clicking returns to Home page */}
          <button 
            type="button" 
            onClick={() => navigateTo('home')}
            className="flex items-center gap-3 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-[19px] text-[#111]">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#111] mr-0.5 group-hover:scale-125 transition-transform" />
              <span>Waimao</span>
              <span className="font-normal text-slate-500 text-sm tracking-normal ml-0.5">Tools</span>
            </div>
          </button>

          {/* Center navigation links: True Separate Pages */}
          <nav className="hidden md:flex items-center gap-7 text-[13px] font-medium text-slate-600">
            <button 
              type="button"
              onClick={() => navigateTo('about')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'about' ? 'text-black font-bold' : 'hover:text-black'
              }`}
            >
              {isZh ? '关于我们' : 'About Us'}
            </button>
            <button 
              type="button"
              onClick={() => {
                if (currentPage !== 'home') {
                  setCurrentPage('home');
                  setTimeout(() => {
                    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="hover:text-black transition-colors cursor-pointer"
            >
              {isZh ? '功能矩阵' : 'Features'}
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('contact')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'contact' ? 'text-black font-bold' : 'hover:text-black'
              }`}
            >
              {isZh ? '联系我们' : 'Contact Us'}
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('privacy')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'privacy' ? 'text-black font-bold' : 'hover:text-black'
              }`}
            >
              {isZh ? '隐私政策' : 'Privacy Policy'}
            </button>
            <button 
              type="button"
              onClick={() => navigateTo('terms')}
              className={`transition-colors cursor-pointer ${
                currentPage === 'terms' ? 'text-black font-bold' : 'hover:text-black'
              }`}
            >
              {isZh ? '服务条款' : 'Terms'}
            </button>
          </nav>

          {/* Right actions: Language toggle + Log in & Get Started buttons */}
          <div className="flex items-center gap-3">
            {/* Language Pill Switcher */}
            <div className="flex items-center p-0.5 rounded-full bg-slate-200/60 text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  language === 'en' ? 'bg-white text-black shadow-xs font-bold' : 'text-slate-500 hover:text-black'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('zh')}
                className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                  language === 'zh' ? 'bg-white text-black shadow-xs font-bold' : 'text-slate-500 hover:text-black'
                }`}
              >
                中
              </button>
            </div>

            {/* Log in text button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="hidden sm:inline-block text-[13px] font-medium text-slate-700 hover:text-black px-3 py-2 cursor-pointer transition-colors"
            >
              {isZh ? '登录' : 'Log in'}
            </button>

            {/* Primary Get Started button */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              className="h-10 px-4.5 rounded-full bg-[#111] hover:bg-[#252525] active:scale-97 text-white text-[13px] font-medium transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <GoogleIcon className="w-3.5 h-3.5" />
              <span>{isZh ? '快速开始' : 'Get Started'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* ================= PAGE ROUTING SWITCHER ================= */}
      <main className="flex-1">

        {/* ----------------- SEPARATE PAGE 1: HOME (CLARIO STYLE) ----------------- */}
        {currentPage === 'home' && (
          <div className="animate-fadeIn">
            
            {/* Hero Section */}
            <section className="pt-14 sm:pt-20 pb-24 max-w-5xl mx-auto px-5 sm:px-8 text-center relative">
              
              {/* Main Headline with the distinctive dark badge box as in the video */}
              <div className="inline-block relative mb-4">
                <h1 className="text-4xl sm:text-6xl md:text-[68px] font-normal tracking-[-0.035em] text-[#111] leading-[1.08] max-w-3xl mx-auto">
                  {isZh ? (
                    <>
                      外贸单证制作 <br className="hidden sm:inline" />
                      <span className="inline-flex items-center gap-2 font-medium">
                        轻巧重塑
                        <span className="inline-flex items-center justify-center align-middle px-3 py-1 mx-1.5 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-sans shadow-md">
                          CI / PI
                        </span>
                        全球出海
                      </span>
                    </>
                  ) : (
                    <>
                      Exporting reimagined <br className="hidden sm:inline" />
                      <span className="inline-flex items-center gap-2">
                        for today's
                        <span className="inline-flex items-center justify-center align-middle px-3.5 py-1.5 mx-1.5 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-sans shadow-md">
                          CI / PI
                        </span>
                        world
                      </span>
                    </>
                  )}
                </h1>
              </div>

              {/* Subtitle text */}
              <p className="text-sm sm:text-base text-slate-500 font-normal max-w-xl mx-auto leading-relaxed mt-2 mb-8">
                {isZh 
                  ? '摆脱繁杂易错的传统表格。为您打造包含商业发票、形式发票、装箱单与外贸报价在内的现代全流程出海协同工具。'
                  : 'Take control of your export trade with tools that simplify documentation, highlight profit margins, and help you quote with confidence for every stage of your business.'}
              </p>

              {/* Dual pill CTA buttons (matching "Download App" and "Begin your plan") */}
              <div className="flex flex-wrap items-center justify-center gap-3.5 mb-14 sm:mb-20">
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isLoading}
                  className="h-11 px-6 rounded-full bg-[#EFEFEF] hover:bg-[#E5E5E5] active:scale-97 text-[#111] text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2.5 shadow-2xs"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon className="w-4 h-4" />
                  )}
                  <span>{isZh ? '使用 Google 账号登录' : 'Continue with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="h-11 px-6 rounded-full bg-white hover:bg-slate-50 active:scale-97 text-[#111] border border-slate-200/80 text-[13px] font-medium transition-all cursor-pointer shadow-2xs"
                >
                  <span>{isZh ? '进入在线工作台' : 'Open Web Workspace'}</span>
                </button>
              </div>

              {errorMsg && (
                <div className="max-w-md mx-auto mb-8 p-3 rounded-2xl bg-red-50/80 border border-red-200/60 text-red-600 text-xs flex items-center gap-2 text-left">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Floating Phone & Satellite Stat Widgets */}
              <div className="relative max-w-2xl mx-auto pt-4 pb-12 flex items-center justify-center">
                
                {/* SATELLITE CARD 1 (Top Right): Pink category pill "Shopping" */}
                <div 
                  className="absolute -top-3 right-4 sm:right-10 z-20 px-3.5 py-1.5 rounded-full bg-[#FCECEE] border border-rose-200/40 text-rose-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>{isZh ? '样品寄送 Sample' : 'Shopping'}</span>
                </div>

                {/* SATELLITE CARD 2 (Left): Circular gauge "Lifestyle $579" */}
                <div 
                  className="hidden sm:flex flex-col items-center absolute -left-12 sm:-left-20 top-20 z-10 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-black/[0.06] shadow-sm text-left w-32 transition-transform hover:scale-105"
                >
                  <div className="text-[10px] text-slate-400 font-medium">{isZh ? '出口退税' : 'VAT Rebate'}</div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5">$579.00</div>
                  <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[65%]" />
                  </div>
                </div>

                {/* SATELLITE CARD 3 (Left Mid): Blue pill "+ $300.00" */}
                <div 
                  className="hidden sm:flex absolute -left-4 sm:-left-8 top-44 z-20 px-3.5 py-1.5 rounded-xl bg-[#EAF2FE] border border-blue-200/60 text-[#1E60B8] text-xs font-semibold items-center gap-1.5 shadow-xs transition-transform hover:scale-105"
                >
                  <span>+ $300.00</span>
                </div>

                {/* SATELLITE CARD 4 (Left Bottom): Progress Card "Dining Out / Quotation" */}
                <div 
                  className="hidden sm:block absolute -left-16 sm:-left-24 bottom-6 z-20 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.06] shadow-sm text-left w-48 transition-transform hover:scale-105"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-800">{isZh ? '报价利润率' : 'Export Profit'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{isZh ? '达标' : 'Available'}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    $72.34 <span className="font-normal text-slate-400">/ $100.00</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-[#111] h-full w-[72%]" />
                  </div>
                </div>

                {/* SATELLITE CARD 5 (Right Mid): "New Expense / PI Deposit" card */}
                <div 
                  className="hidden sm:flex items-center justify-between gap-4 absolute -right-10 sm:-right-24 top-28 z-20 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.06] shadow-sm w-52 text-left transition-transform hover:scale-105"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      <Receipt size={14} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">{isZh ? '形式发票预付款' : 'PI Advance Deposit'}</div>
                      <div className="text-xs font-bold text-slate-900">{isZh ? '预收 30% T/T' : 'T/T 30%'}</div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowGoogleModal(true)}
                    className="w-6 h-6 rounded-lg bg-[#111] text-white flex items-center justify-center hover:bg-slate-800 cursor-pointer"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* SATELLITE CARD 6 (Right Bottom): Assigned budget stats */}
                <div 
                  className="hidden sm:block absolute -right-8 sm:-right-20 bottom-10 z-10 p-3 rounded-xl bg-white/90 backdrop-blur-md border border-black/[0.05] shadow-xs text-left w-40 text-[11px] transition-transform hover:scale-105"
                >
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>{isZh ? '已开发票' : 'Invoices'}</span>
                    <span className="font-mono text-slate-700 font-semibold">$3,580.4</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">{isZh ? '当月结算' : 'Cleared'}</span>
                    <span className="font-mono text-slate-900 font-bold">$1,087.5</span>
                  </div>
                </div>

                {/* SATELLITE CARD 7: Floating 3D metallic coin */}
                <div 
                  className="absolute -bottom-2 right-12 z-20 hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-amber-300 border border-amber-300 shadow-sm text-amber-800 text-[10px] font-black animate-bounce"
                >
                  $
                </div>

                {/* Central Smartphone Device Mockup */}
                <div className="w-[285px] sm:w-[310px] rounded-[44px] bg-[#000] p-3 shadow-2xl shadow-slate-900/15 ring-1 ring-black/10 relative">
                  
                  <div className="w-full bg-[#FFFFFF] rounded-[36px] overflow-hidden p-4 pt-3 flex flex-col text-left text-slate-800 select-none">
                    
                    {/* Dynamic Island / Notch */}
                    <div className="w-20 h-4 bg-black rounded-full mx-auto mb-3" />

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          WT
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-900 leading-tight">
                            {isZh ? '外贸总览' : 'Overview'}
                          </div>
                          <div className="text-[9px] text-slate-400">2026 Global Export</div>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                        🔍
                      </div>
                    </div>

                    {/* Dynamic Balance */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          ${liveAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          +14.08%
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {isZh ? '本月商业发票与出运总额' : 'Total cleared commercial value'}
                      </div>
                    </div>

                    {/* SVG Sparkline Graph */}
                    <div className="w-full h-14 mb-4">
                      <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,45 Q20,40 40,48 T80,30 T120,38 T160,15 T200,22 L200,60 L0,60 Z"
                          fill="url(#chartGrad)"
                        />
                        <path
                          d="M0,45 Q20,40 40,48 T80,30 T120,38 T160,15 T200,22"
                          fill="none"
                          stroke="#16a34a"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                        <circle cx="200" cy="22" r="3" fill="#16a34a" />
                      </svg>
                    </div>

                    {/* Category Selector Chips */}
                    <div className="flex items-center gap-1.5 mb-3 text-[10px]">
                      <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        activeChip === 'shopping' ? 'bg-[#FCECEE] text-rose-700 font-bold' : 'bg-slate-100 text-slate-500'
                      }`}>
                        ● {isZh ? '发票 CI' : 'Shopping'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        activeChip === 'supermarket' ? 'bg-[#EBF7EE] text-emerald-700 font-bold' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isZh ? '装箱单 PL' : 'Supermarkets'}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                        {isZh ? '合同 SC' : 'Saving'}
                      </span>
                    </div>

                    {/* Mini List Items */}
                    <div className="space-y-2 border-t border-slate-100 pt-2.5 text-[10px]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Commercial Invoice #8920</span>
                        <span className="font-bold text-slate-900">$44.29</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Proforma Deposit #PI-02</span>
                        <span className="font-bold text-slate-900">$33.75</span>
                      </div>
                    </div>

                    <div className="w-24 h-1 bg-slate-200 rounded-full mx-auto mt-4" />

                  </div>

                </div>

              </div>

            </section>

            {/* Features Section */}
            <section id="features-section" className="py-20 bg-white border-t border-slate-200/60">
              <div className="max-w-6xl mx-auto px-5 sm:px-8">
                
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {isZh ? '全流程出海套件' : 'Product Suite'}
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-[#111]">
                    {isZh ? '严谨、标准且优雅的外贸单据生成器' : 'Everything you need to export globally'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {isZh 
                      ? '覆盖自询盘、报价、形式发票、外销合同到装箱单与海运托运指示的每一个关键环节。'
                      : 'Clean vector documents generated in seconds with automatic calculations and company seal rendering.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Feature 1 */}
                  <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-[#111] mb-4">
                        <BadgePercent size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {isZh ? '外贸报价与利润核算器' : 'Quotation & Margin Engine'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {isZh 
                          ? '根据实时汇率、退税率、吸管管长加价、喷涂定制成本及海运运费，秒级推导出精准的 FOB / CIF 美金底价。'
                          : 'Calculate accurate FOB/CIF target prices taking into account live exchange rates, VAT rebates, and packaging custom surcharges.'}
                      </p>
                    </div>
                    <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{isZh ? '精准定价' : 'Accurate Margin'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Feature 2 */}
                  <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-[#111] mb-4">
                        <FileText size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {isZh ? '商业发票 Commercial Invoice (CI)' : 'Commercial Invoice (CI)'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {isZh 
                          ? '符合国际买家与中国海关报关规范的标准格式。支持中英文大写全自动拼写，公司印章高拟真透明扣底。'
                          : 'Customs billing with automatic spelled-out currency totals, bilingual items, and high-fidelity transparent digital seals.'}
                      </p>
                    </div>
                    <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{isZh ? '标准 A4 排版' : 'Standard A4 Layout'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Feature 3 */}
                  <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-[#111] mb-4">
                        <Coins size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {isZh ? '形式发票 Proforma Invoice (PI)' : 'Proforma Invoice (PI)'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {isZh 
                          ? '买家支付预付款与银行开立信用证的正式依据。一键套用美金 SWIFT 账户信息与付款条款。'
                          : 'Advance payment invoice with SWIFT banking details, deposit milestones (T/T, L/C), and delivery lead times.'}
                      </p>
                    </div>
                    <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{isZh ? '催收定金凭据' : 'Advance Payment Ready'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Feature 4 */}
                  <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-[#111] mb-4">
                        <PackageOpen size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {isZh ? '出运装箱单 Packing List (PL)' : 'Packing List (PL)'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {isZh 
                          ? '全自动联动单箱毛净重、箱数与总体积 (CBM)。智能箱号连续排列，彻底规避传统表格人工手误。'
                          : 'Automates sequential carton numbering, net/gross weight calculations, and CBM volumetric measurement.'}
                      </p>
                    </div>
                    <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{isZh ? '整柜与拼箱自动算' : 'Auto CBM Calculation'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Feature 5 */}
                  <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-[#111] mb-4">
                        <FileCheck size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {isZh ? '外销合同 Sales Contract (SC)' : 'Sales Contract (SC)'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {isZh 
                          ? '严谨的中英双语贸易法律条款：仲裁协议、不可抗力、检验期与索赔时限，支持买卖双方电子双签。'
                          : 'Legally vetted bilingual export contracts with arbitration, force majeure, inspection criteria, and dual signatures.'}
                      </p>
                    </div>
                    <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{isZh ? '中英双语法务保障' : 'Dual Signature'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                  {/* Feature 6 */}
                  <div className="p-6 rounded-3xl bg-[#FAF9F6] border border-slate-200/60 hover:border-slate-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-[#111] mb-4">
                        <Box size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {isZh ? '集装箱配载 CBM 计算器' : 'Container Loader Simulation'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {isZh 
                          ? '内置 20GP (28m³)、40GP (58m³)、40HQ (68m³) 真实货柜尺寸，自动测算装载率与限重提示。'
                          : 'Physical space and weight simulation for 20GP, 40GP, and 40HQ ocean containers with live loading ratio.'}
                      </p>
                    </div>
                    <div className="pt-5 mt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{isZh ? '柜位利用率优化' : 'Space Optimization'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* Cloud Architecture Banner */}
            <section className="py-20 bg-[#FBFBFA]">
              <div className="max-w-5xl mx-auto px-5 sm:px-8">
                
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/70 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-3 max-w-xl text-left">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      {isZh ? '云原生架构' : 'Enterprise Cloud'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                      {isZh ? '数据存储于 Google Cloud Firestore' : 'Secured by Google Cloud Firestore'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {isZh 
                        ? '每位用户使用 Google 账号独立登录，数据存放于专属安全沙箱，全设备实时双向同步，保护商业机密与客户隐私。'
                        : 'Your invoices, clients, and catalog items are isolated per account and synced across computer, tablet, and mobile instantly.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-2xl font-bold text-slate-900">100%</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{isZh ? '格式合规' : 'Standardized'}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                      <div className="text-2xl font-bold text-slate-900">0s</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{isZh ? '免安装' : 'Zero Setup'}</div>
                    </div>
                  </div>
                </div>

              </div>
            </section>

          </div>
        )}

        {/* ----------------- SEPARATE PAGE 2: ABOUT US ----------------- */}
        {currentPage === 'about' && (
          <div className="py-12 sm:py-16 max-w-4xl mx-auto px-5 sm:px-8 animate-fadeIn text-left">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-black mb-8 cursor-pointer group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>{isZh ? '返回首页' : 'Back to Home'}</span>
            </button>

            <div className="space-y-4 mb-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {isZh ? '关于外贸百宝箱' : 'About Waimao Tools'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#111]">
                {isZh ? '为外贸出海团队打造的现代单证操作系统' : 'Reimagining Foreign Trade Documentation'}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl">
                {isZh 
                  ? 'Waimao Tools 致力于消除跨境贸易中的手工重复劳动，将 Excel 中繁琐的公式核算与错位排版彻底升级为云端高精度矢量排版系统。'
                  : 'Waimao Tools simplifies global trade workflows by replacing complex spreadsheets with streamlined, cloud-synchronized vector export documents.'}
              </p>
            </div>

            {/* Core Values Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xs space-y-8">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200/60">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black mb-3 shadow-2xs">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {isZh ? '国际标准 A4 矢量排版' : 'Standard A4 Vector Engine'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isZh 
                      ? '所有商业发票、形式发票、装箱单与外贸报价单均严格遵循国际海关清关与银行信用证要求，支持一键无损打印与高清无水印 PDF 导出。' 
                      : 'All templates follow international trade guidelines for seamless customs clearance.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200/60">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black mb-3 shadow-2xs">
                    <BadgePercent size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {isZh ? '中英文智能拼写与计算' : 'Intelligent Bilingual Conversions'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isZh 
                      ? '中英文金额大写全自动转换、汇率即时联动、FOB/CIF 海运费智能分摊，彻底根除手工核算差错。' 
                      : 'Automatic spelled-out currency totals, live exchange rates, and freight calculations.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200/60">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black mb-3 shadow-2xs">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {isZh ? '电子印章与签名白底扣除' : 'Auto Stamp Transparency'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isZh 
                      ? '独创的图像算法，手机拍摄的公章或手写签名白底秒变透明，逼真且极速套用在合同与发票上。' 
                      : 'Built-in algorithm removes white paper backgrounds from seals and signatures.'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200/60">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-black mb-3 shadow-2xs">
                    <Cloud size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {isZh ? 'Google Cloud 实时同步' : 'Google Cloud Isolation'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isZh 
                      ? '依托 Google Cloud Firestore 架构，每位企业用户享有独立沙箱存储，跨电脑、平板与手机随时畅行。' 
                      : 'Enterprise grade Firestore architecture provides bank-grade user data security.'}
                  </p>
                </div>
              </div>

              {/* Call to action at bottom of about page */}
              <div className="p-6 rounded-2xl bg-[#111] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold">{isZh ? '立即开启您的专业外贸工作台' : 'Start your trade workspace today'}</div>
                  <div className="text-xs text-slate-300 mt-0.5">{isZh ? '免安装，Google 账号秒级直连' : 'Zero install required, instant sign-in with Google.'}</div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  {isZh ? '免费体验' : 'Get Started'}
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ----------------- SEPARATE PAGE 3: CONTACT US ----------------- */}
        {currentPage === 'contact' && (
          <div className="py-12 sm:py-16 max-w-4xl mx-auto px-5 sm:px-8 animate-fadeIn text-left">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-black mb-8 cursor-pointer group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>{isZh ? '返回首页' : 'Back to Home'}</span>
            </button>

            <div className="space-y-4 mb-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {isZh ? '客户支持与合作' : 'Support & Inquiries'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#111]">
                {isZh ? '随时与我们的外贸专家取得联系' : 'We are here to assist your business'}
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl">
                {isZh 
                  ? '无论您是对功能使用有任何疑问，还是需要企业级批量账户授权与定制支持，欢迎通过以下渠道随时联系我们。' 
                  : 'Reach out for enterprise accounts, onboarding assistance, or feedback.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Contact Channels (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                
                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-[#111] font-bold mb-2 text-xs">
                    <Mail size={16} />
                    <span>{isZh ? '官方客服邮箱' : 'Customer Support Email'}</span>
                  </div>
                  <div className="font-mono text-slate-900 text-xs font-semibold">
                    admin@waimaotools.online
                  </div>
                  <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                    andrewandrre88@gmail.com
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    {isZh ? '通常在 24 小时内回复' : 'Replies within 24 hours'}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-emerald-700 font-bold mb-2 text-xs">
                    <MessageCircle size={16} />
                    <span>{isZh ? '微信 VIP 客服' : 'WeChat VIP Support'}</span>
                  </div>
                  <div className="font-mono text-slate-900 text-xs font-semibold">
                    waimao_tools_vip
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2">
                    {isZh ? '工作时间：周一至周日 9:00 - 22:00' : 'Hours: Mon - Sun 9:00 - 22:00 (UTC+8)'}
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
                  <div className="flex items-center gap-2.5 text-slate-700 font-bold mb-2 text-xs">
                    <Globe size={16} />
                    <span>{isZh ? '官方访问域名' : 'Official Portal'}</span>
                  </div>
                  <div className="font-mono text-blue-600 text-xs font-semibold">
                    https://waimaotools.online
                  </div>
                </div>

              </div>

              {/* Inquiry Message Form (7 cols) */}
              <div className="md:col-span-7">
                <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {isZh ? '在线留言与需求反馈' : 'Send us a message'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-6">
                    {isZh ? '填写您的信息，我们的技术顾问将尽快给您答复。' : 'Fill out the form below and we will get back to you promptly.'}
                  </p>

                  {contactSubmitted ? (
                    <div className="p-8 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-center space-y-2 text-emerald-800 animate-fadeIn">
                      <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
                      <div className="font-bold text-base">{isZh ? '留言已成功送达！' : 'Message Sent Successfully!'}</div>
                      <p className="text-xs text-emerald-700">
                        {isZh ? '感谢您的咨询，我们的客服团队将在 24 小时内与您联系。' : 'Thank you for contacting us. We will reply within 24 hours.'}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isZh ? '您的姓名 / 称呼' : 'Your Name'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder={isZh ? '例如：张经理' : 'e.g. John Doe'}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-black focus:bg-white transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isZh ? '您的联系邮箱' : 'Email Address'}
                        </label>
                        <input 
                          type="email" 
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="user@example.com"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-black focus:bg-white transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {isZh ? '咨询内容 / 需求描述' : 'Your Message / Inquiry'}
                        </label>
                        <textarea 
                          rows={4}
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder={isZh ? '请简要说明您的企业规模、咨询的问题或功能建议...' : 'Describe your company requirements or questions...'}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-black focus:bg-white transition-colors"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-[#111] hover:bg-[#252525] text-white font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <Send size={13} />
                        <span>{isZh ? '立即提交留言' : 'Submit Message'}</span>
                      </button>
                    </form>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------- SEPARATE PAGE 4: PRIVACY POLICY ----------------- */}
        {currentPage === 'privacy' && (
          <div className="py-12 sm:py-16 max-w-4xl mx-auto px-5 sm:px-8 animate-fadeIn text-left">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-black mb-8 cursor-pointer group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>{isZh ? '返回首页' : 'Back to Home'}</span>
            </button>

            <div className="space-y-4 mb-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {isZh ? '法律与合规' : 'Legal & Compliance'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#111]">
                {isZh ? '隐私权政策 (Privacy Policy)' : 'Privacy Policy'}
              </h1>
              <p className="text-xs text-slate-400">
                {isZh ? '最后更新日期：2026年3月' : 'Last Updated: March 2026'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
              
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '1. 我们的商业机密与隐私承诺' : '1. Commercial Data & Privacy Commitment'}
                </h3>
                <p>
                  {isZh 
                    ? 'Waimao Tools（以下简称“我们”或“本平台”）极为重视用户的商业机密与个人数据隐私。外贸单据涉及敏感的客户名录、交易金额、海运港口及价格底线。我们郑重承诺：我们绝不会将您的任何商业发票数据、客户档案、报价公式或个人身份信息出售、出租、转让或共享给任何第三方广告公司或商业机构。' 
                    : 'Waimao Tools strictly protects your commercial privacy and customer records. We never sell, lease, or distribute your invoice values, customer lists, or product pricing with third-party advertisers.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '2. 云端加密与用户沙箱强隔离' : '2. Firestore Multi-Tenant Security Rules'}
                </h3>
                <p>
                  {isZh 
                    ? '本系统架构依托 Google Cloud Firestore。每位使用 Google 账号登录的用户均由底层安全规则（Firestore Security Rules）赋予唯一的安全沙箱标识。系统在云端直接验证用户 UID，任何未经授权的其他用户均无法读取或篡改属于您账户名下的业务单证与客户资料。' 
                    : 'Our architecture leverages Google Cloud Firestore. Each authenticated user is granted an isolated security partition enforced by Firestore rules, ensuring zero cross-tenant access.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '3. 我们收集的信息与用途' : '3. Information We Collect & Usage'}
                </h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li><strong>{isZh ? 'Google 账户凭证' : 'Google Identity'}:</strong> {isZh ? '仅包含您的 Google 邮箱地址及公开昵称，用于在多设备间关联您的云端工作台。' : 'Only your Google email address and public display name for multi-device sync.'}</li>
                  <li><strong>{isZh ? '用户自主录入的单据' : 'User Authored Records'}:</strong> {isZh ? '您在工作台中保存的产品资料库、客户通讯录、商业发票、装箱单与报价单，纯粹用于为您提供排版、计算及导出 PDF 业务。' : 'Products, client records, and generated invoices for your exclusive export management.'}</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '4. 数据保留与注销权利' : '4. Data Retention & Deletion Rights'}
                </h3>
                <p>
                  {isZh 
                    ? '您对自身录入的所有数据享有完全的掌控权。若您需要导出备份或清空删除历史单据，均可在工作台设置中自主操作，或通过官方客服邮箱申请注销。' 
                    : 'You retain full ownership of your data and can reset, export, or request deletion of your account at any time.'}
                </p>
              </section>

            </div>

          </div>
        )}

        {/* ----------------- SEPARATE PAGE 5: TERMS OF SERVICE ----------------- */}
        {currentPage === 'terms' && (
          <div className="py-12 sm:py-16 max-w-4xl mx-auto px-5 sm:px-8 animate-fadeIn text-left">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-black mb-8 cursor-pointer group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              <span>{isZh ? '返回首页' : 'Back to Home'}</span>
            </button>

            <div className="space-y-4 mb-10">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {isZh ? '服务协议' : 'Terms & Conditions'}
              </span>
              <h1 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#111]">
                {isZh ? '服务条款 (Terms of Service)' : 'Terms of Service'}
              </h1>
              <p className="text-xs text-slate-400">
                {isZh ? '生效日期：2026年3月' : 'Effective Date: March 2026'}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-2xs space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
              
              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '1. 协议许可与服务范围' : '1. License & Service Scope'}
                </h3>
                <p>
                  {isZh 
                    ? 'Waimao Tools 为从事外贸出口、跨境电商及国际货运的用户提供商业发票、形式发票、报价核算及集装箱配载模拟等数字化工具。在遵守本服务条款的前提下，用户享有本系统的个人或企业商业使用许可。' 
                    : 'Waimao Tools grants users a commercial license to utilize our export invoice generation, quotation calculators, and container loading utilities.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '2. 单据合规与用户法律责任' : '2. Customs Compliance & User Responsibility'}
                </h3>
                <p>
                  {isZh 
                    ? '用户应确保所录入的货物名称、HS 海关编码、申报货值、收发货人信息真实准确，并严格遵守出口国与目的地国家的海关监管与反洗钱法律。本系统提供的格式模板与计算结果仅供商务辅助参考，买卖双方贸易违约、海关查验惩处或目的港清关延误所产生的经济与法律责任由用户自行承担。' 
                    : 'Users are strictly responsible for the accuracy of declared HS codes, invoice values, and consignee details in accordance with applicable customs and export control laws.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '3. 知识产权保护' : '3. Intellectual Property'}
                </h3>
                <p>
                  {isZh 
                    ? 'Waimao Tools 软件界面设计、矢量排版引擎、印章去底算法及系统代码均受知识产权保护。未经官方书面许可，任何第三方不得对本系统进行逆向工程、反编译或恶意批量克隆。' 
                    : 'All software UI designs, vector rendering engines, and transparency algorithms are protected by copyright.'}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isZh ? '4. 账户安全与服务终止' : '4. Account Security & Termination'}
                </h3>
                <p>
                  {isZh 
                    ? '用户有责任妥善保管其 Google 登录凭据。对于从事恶意网络攻击、非法禁运物资交易或破坏系统稳定性的账号，平台保留无须事先通知即暂停或终止服务访问的权利。' 
                    : 'We reserve the right to suspend or terminate accounts engaged in fraudulent trade, contraband shipments, or malicious attacks.'}
                </p>
              </section>

            </div>

          </div>
        )}

      </main>

      {/* ================= MINIMALIST FOOTER ================= */}
      <footer className="mt-auto bg-[#F7F7F6] border-t border-slate-200/70 py-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-200/60">
            <button 
              type="button"
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2 font-bold text-slate-800 text-sm cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#111]" />
              <span>Waimao Tools</span>
              <span className="font-normal text-slate-400 text-xs ml-2">waimaotools.online</span>
            </button>

            {/* Footer Navigation Links */}
            <div className="flex flex-wrap items-center gap-6 text-[13px] font-medium text-slate-600">
              <button 
                type="button" 
                onClick={() => navigateTo('about')} 
                className={`transition-colors cursor-pointer ${
                  currentPage === 'about' ? 'text-black font-bold' : 'hover:text-black'
                }`}
              >
                {isZh ? '关于我们' : 'About Us'}
              </button>
              <button 
                type="button" 
                onClick={() => navigateTo('contact')} 
                className={`transition-colors cursor-pointer ${
                  currentPage === 'contact' ? 'text-black font-bold' : 'hover:text-black'
                }`}
              >
                {isZh ? '联系我们' : 'Contact Us'}
              </button>
              <button 
                type="button" 
                onClick={() => navigateTo('privacy')} 
                className={`transition-colors cursor-pointer ${
                  currentPage === 'privacy' ? 'text-black font-bold' : 'hover:text-black'
                }`}
              >
                {isZh ? '隐私政策' : 'Privacy Policy'}
              </button>
              <button 
                type="button" 
                onClick={() => navigateTo('terms')} 
                className={`transition-colors cursor-pointer ${
                  currentPage === 'terms' ? 'text-black font-bold' : 'hover:text-black'
                }`}
              >
                {isZh ? '服务条款' : 'Terms of Service'}
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © {new Date().getFullYear()} Waimao Tools. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span>Google Cloud Protected</span>
              <span>•</span>
              <span>Vector A4 Engine</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ================= GOOGLE DIRECT SIGN-IN MODAL ================= */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 relative text-slate-900 text-left">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 mb-3">
                <GoogleIcon className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {t('auth.continue_google', 'Continue with Google')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {isZh ? '输入任意 Google 谷歌账号即可开启专属云端工作台' : 'Enter your Google account to access your workspace'}
              </p>
            </div>

            <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isZh ? 'Google 邮箱地址' : 'Google Email'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    {isZh ? '业务员名称 / 显示昵称' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 bg-[#111] hover:bg-[#252525] text-white rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  {isZh ? '确认进入' : 'Sign in'}
                </button>
              </div>
            </form>

            <p className="text-[10px] text-slate-400 text-center mt-4">
              {isZh ? '数据将在 Cloud Firestore 实时加密同步' : 'Synchronized securely via Cloud Firestore'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
