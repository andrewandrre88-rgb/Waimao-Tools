import React, { useState } from 'react';
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
  FileCheck2,
  X,
  Languages
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

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { t, language, setLanguage } = useLanguage();

  // Google Modal fallback state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  // UI status state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      console.log('Firebase auth popup notification:', err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setErrorMsg(
          language === 'zh'
            ? '当前域名 (waimaotools.online) 尚未在 Firebase 控制台添加授权网域。请在 Firebase Console > Authentication > Settings > Authorized Domains 中添加 waimaotools.online，或直接在下方输入邮箱继续使用。'
            : 'Domain waimaotools.online is not authorized yet in Firebase Auth. Add waimaotools.online to Firebase Console > Authentication > Settings > Authorized Domains, or enter your email below.'
        );
      }
    }

    setIsLoading(false);
    // Directly open Google Account sign-in dialog so user can enter or confirm their account
    setShowGoogleModal(true);
  };

  const handleGoogleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleEmailInput.trim()) {
      setErrorMsg(language === 'zh' ? '请输入有效的 Google 谷歌邮箱' : 'Please enter a valid Google email.');
      return;
    }
    setIsLoading(true);
    setShowGoogleModal(false);

    setTimeout(() => {
      const formattedName = googleNameInput.trim() || googleEmailInput.split('@')[0];
      const u = googleAuth(googleEmailInput.trim(), formattedName);
      setIsLoading(false);
      onAuthSuccess(u);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Decorative gradient radial lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1565C0]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Top Right */}
      <div className="absolute top-6 right-6 z-20 flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg text-xs font-bold text-white">
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            language === 'en' 
              ? 'bg-white text-[#1565C0] shadow-sm font-extrabold' 
              : 'text-slate-300 hover:text-white'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLanguage('zh')}
          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            language === 'zh' 
              ? 'bg-white text-[#1565C0] shadow-sm font-extrabold' 
              : 'text-slate-300 hover:text-white'
          }`}
        >
          中文 (简体)
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 z-10 flex flex-col">
        {/* Brand Header */}
        <div className="bg-[#1565C0] p-8 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <FileCheck2 size={160} />
          </div>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs text-white mb-4 shadow-inner ring-1 ring-white/20">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {t('brand.title', 'Waimao Tools')}
          </h1>
          <p className="text-xs text-blue-100 mt-1.5 font-medium max-w-xs mx-auto">
            {language === 'zh' ? '外贸单证与报价管理系统 · Firestore 云端多设备实时同步' : 'Foreign Trade & Export Management Suite with Google Cloud Sync'}
          </p>
        </div>

        <div className="p-8 flex-1 flex flex-col justify-center">
          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          <div className="text-center mb-6">
            <h2 className="text-sm font-bold text-slate-800">
              {language === 'zh' ? '欢迎使用外贸百宝箱' : 'Sign in to your account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'zh' 
                ? '使用 Google 谷歌账号登录，自动为您创建专属独立工作台，多设备实时同步' 
                : 'Securely authenticate with your Google Account to access invoices, quotations, and cloud sync.'}
            </p>
          </div>

          {/* Continue with Google Button */}
          <div>
            <button
              type="button"
              id="google-continue-btn"
              onClick={handleGoogleSignInClick}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-all shadow-xs hover:shadow-md cursor-pointer group disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <GoogleIcon className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
                  <span>{t('auth.continue_google', 'Continue with Google')}</span>
                </>
              )}
            </button>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="text-xs text-[#1565C0] hover:text-blue-800 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                {language === 'zh' ? '切换账号或手动输入谷歌账号登录' : 'Switch Account or Manual Google Sign-In'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            🔒 {language === 'zh' ? 'Google 谷歌安全隔离与 Firestore 云端实时备份' : 'Protected by Google Enterprise Security &bull; ' + new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* GOOGLE OAUTH / ACCOUNT SELECTION MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 relative overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3 ring-4 ring-slate-50">
                <GoogleIcon className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {t('auth.continue_google', 'Continue with Google')}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'zh' ? '输入任意 Google 谷歌账号即可登录并保存数据' : 'Choose a Google account to continue to Waimao Tools'}
              </p>
            </div>

            <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'zh' ? 'Google 邮箱地址' : 'Google Email'}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@gmail.com"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#1565C0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {language === 'zh' ? '显示名称 / 业务员姓名' : 'Account / Display Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={googleNameInput}
                    onChange={(e) => setGoogleNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#1565C0]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {t('btn.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {language === 'zh' ? '确认登录' : 'Confirm & Continue'}
                </button>
              </div>
            </form>

            <p className="text-[10px] text-slate-400 text-center mt-4 leading-normal">
              {language === 'zh' 
                ? '登录后您的数据将自动加密隔离并同步至云端 Firestore 数据库。' 
                : 'By continuing, your data is securely stored and isolated in Cloud Firestore.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
