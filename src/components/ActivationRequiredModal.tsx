import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  MessageCircle, 
  Mail, 
  LogOut, 
  RefreshCw, 
  ExternalLink,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AuthUser } from '../types';
import { fetchMembershipConfig, MembershipConfig } from '../utils/membership';

interface ActivationRequiredModalProps {
  user: AuthUser;
  onLogout: () => void;
  onRetryCheck: () => void;
  onBrowseHomePage?: () => void;
}

export default function ActivationRequiredModal({ 
  user, 
  onLogout, 
  onRetryCheck,
  onBrowseHomePage
}: ActivationRequiredModalProps) {
  const { language } = useLanguage();
  const [config, setConfig] = useState<MembershipConfig | null>(null);
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    fetchMembershipConfig().then(cfg => setConfig(cfg));
  }, []);

  const handleCopyWeChat = () => {
    if (config?.wechatId) {
      navigator.clipboard.writeText(config.wechatId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckAgain = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      onRetryCheck();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-fadeIn">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1565C0] to-slate-900 text-white p-6 text-center relative">
          <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock size={28} className="text-amber-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight">
            {language === 'zh' ? '账号尚未开通会员使用权限' : 'Account Activation Required'}
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-md mx-auto">
            {language === 'zh' 
              ? '您已使用 Google 谷歌账号成功登录，请联系客服开通会员权限即可立即进入工作台' 
              : 'You have signed in with Google. Complete your payment and contact support to activate your workspace.'}
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-mono font-medium text-white border border-white/20">
            <Mail size={13} className="text-blue-200" />
            <span>{user.email}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Pricing cards */}
          <div>
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              <span>{language === 'zh' ? '会员套餐与价格' : 'Pricing Plans'}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-center relative hover:border-[#1565C0] transition-colors">
                <span className="text-[11px] font-bold text-slate-600 block">
                  {language === 'zh' ? '体验月卡' : 'Monthly'}
                </span>
                <div className="mt-1 text-lg font-black text-slate-900">
                  <span className="text-xs">¥</span>{config?.monthlyPriceRmb || 29}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {language === 'zh' ? '30天' : '30 Days'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border-2 border-[#1565C0] bg-blue-50/50 text-center relative shadow-xs">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#1565C0] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  {language === 'zh' ? '推荐' : 'Popular'}
                </div>
                <span className="text-[11px] font-extrabold text-[#1565C0] block">
                  {language === 'zh' ? '年度 VIP' : 'Annual VIP'}
                </span>
                <div className="mt-1 text-lg font-black text-[#1565C0]">
                  <span className="text-xs">¥</span>{config?.annualPriceRmb || 199}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {language === 'zh' ? '365天全功能' : '365 Days'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-center relative hover:border-[#1565C0] transition-colors">
                <span className="text-[11px] font-bold text-slate-600 block">
                  {language === 'zh' ? '终身尊享' : 'Lifetime'}
                </span>
                <div className="mt-1 text-lg font-black text-slate-900">
                  <span className="text-xs">¥</span>{config?.lifetimePriceRmb || 399}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {language === 'zh' ? '永久买断' : 'Lifetime'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment QR Codes & WeChat Contact */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 text-center mb-3">
              {language === 'zh' ? '扫码支付或添加微信客服开通' : 'Scan to Pay & Contact Support'}
            </h3>

            <div className="flex items-center justify-center gap-6">
              {config?.wechatQr ? (
                <div className="text-center">
                  <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs mx-auto mb-1.5">
                    <img src={config.wechatQr} alt="WeChat Pay" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {language === 'zh' ? '微信收款码' : 'WeChat Pay'}
                  </span>
                </div>
              ) : null}

              {config?.alipayQr ? (
                <div className="text-center">
                  <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs mx-auto mb-1.5">
                    <img src={config.alipayQr} alt="Alipay" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-700">
                    {language === 'zh' ? '支付宝收款' : 'Alipay'}
                  </span>
                </div>
              ) : null}
            </div>

            {/* WeChat contact copy button */}
            {config?.wechatId && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-600 font-medium">
                  {language === 'zh' ? '客服微信号:' : 'WeChat Support:'} <strong className="text-slate-900 font-mono ml-1">{config.wechatId}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyWeChat}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (language === 'zh' ? '✓ 已复制微信号' : '✓ Copied') : (language === 'zh' ? '点击复制微信号' : 'Copy WeChat ID')}
                </button>
              </div>
            )}
          </div>

          {/* Simple steps */}
          <div className="text-xs text-slate-500 bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-1">
            <div className="font-bold text-slate-800">
              {language === 'zh' ? '开通只需 2 步:' : 'Two simple steps to activate:'}
            </div>
            <p>1. {language === 'zh' ? '扫码付款后，添加客服微信。' : 'Scan to pay, then contact our WeChat.'}</p>
            <p>2. {language === 'zh' ? `发送您的 Gmail 邮箱 (` : `Send your Gmail (`}<strong className="text-[#1565C0] font-mono">{user.email}</strong>{language === 'zh' ? `)，客服即可为您即时开通。` : `), and we will grant access immediately.`}</p>
          </div>

          {/* Bottom Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
              >
                <LogOut size={14} />
                <span>{language === 'zh' ? '退出登录' : 'Sign Out'}</span>
              </button>

              {onBrowseHomePage && (
                <button
                  type="button"
                  onClick={onBrowseHomePage}
                  className="px-3.5 py-2.5 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 font-semibold"
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>{language === 'zh' ? '查看系统功能主页' : 'Browse System Features'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleCheckAgain}
              disabled={isChecking}
              className="px-6 py-2.5 bg-[#1565C0] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 ml-auto"
            >
              <RefreshCw size={14} className={isChecking ? 'animate-spin' : ''} />
              <span>{language === 'zh' ? '已付款，点击验证进入' : 'Already Paid, Verify Access'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
