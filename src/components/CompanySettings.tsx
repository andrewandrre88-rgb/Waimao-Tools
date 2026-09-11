import React, { useState, useRef } from 'react';
import { CompanySettings as SettingsType, SUPPORTED_CURRENCIES } from '../types';
import { DEFAULT_STAMP_SVG, DEFAULT_CONTRACT_STAMP_SVG, DEFAULT_SIGNATURE_SVG, DEFAULT_LOGO_SVG } from '../utils/storage';
import { CloudSyncState } from './CloudSyncBadge';
import { useLanguage } from '../context/LanguageContext';
import { 
  Settings, 
  Upload, 
  Check, 
  HelpCircle,
  X,
  CreditCard,
  Building2,
  FileBadge,
  Sparkles,
  Wand2,
  Stamp,
  RotateCcw,
  Cloud,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Laptop,
  Smartphone,
  Database
} from 'lucide-react';

import { compressImageFile, removeWhiteBackground } from '../utils/imageCompressor';

interface CompanySettingsProps {
  settings: SettingsType;
  onSaveSettings: (settings: SettingsType) => void;
  onResetData?: () => void;
  syncState?: CloudSyncState;
  onManualSync?: () => void;
}

export default function CompanySettings({ 
  settings, 
  onSaveSettings, 
  onResetData,
  syncState,
  onManualSync
}: CompanySettingsProps) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState<SettingsType>({ ...settings });
  const [success, setSuccess] = useState(false);
  const [isProcessingTransparency, setIsProcessingTransparency] = useState<string | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  const secondaryStampRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);
  const wechatQrRef = useRef<HTMLInputElement>(null);
  const alipayQrRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (field: 'logo' | 'stamp' | 'secondaryStamp' | 'signature' | 'wechatQr' | 'alipayQr', file: File) => {
    try {
      const isSigOrStamp = field === 'signature' || field === 'stamp' || field === 'secondaryStamp';
      const compressed = await compressImageFile(file, 500, 500, 0.85, {
        preserveTransparency: true,
        autoRemoveBackground: isSigOrStamp
      });
      setFormData(prev => ({ ...prev, [field]: compressed }));
    } catch (e) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        let res = reader.result as string;
        if (field === 'signature' || field === 'stamp' || field === 'secondaryStamp') {
          res = await removeWhiteBackground(res);
        }
        setFormData(prev => ({ ...prev, [field]: res }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (field: 'logo' | 'stamp' | 'secondaryStamp' | 'signature' | 'wechatQr' | 'alipayQr', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(field, file);
    }
  };

  const handleRemoveBackgroundManual = async (field: 'signature' | 'stamp' | 'secondaryStamp', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!formData[field]) return;
    setIsProcessingTransparency(field);
    try {
      const cleaned = await removeWhiteBackground(formData[field] as string, 210);
      setFormData(prev => ({ ...prev, [field]: cleaned }));
    } finally {
      setIsProcessingTransparency(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleResetImage = (field: 'logo' | 'stamp' | 'secondaryStamp' | 'signature' | 'wechatQr' | 'alipayQr', e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSetPreset = (field: 'stamp' | 'secondaryStamp', preset: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, [field]: preset }));
  };

  return (
    <div className="space-y-6 print:hidden">
      {/* Settings Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="text-[#1565C0]" size={22} />
            {t('settings.title', 'Company Settings')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('settings.subtitle', 'Configure global defaults, bank profiles, primary & secondary stamps, and corporate logos shared dynamically across all export sheets.')}
          </p>
        </div>
      </div>

      {/* Cloud Firestore Database & Cross-Device Sync Card */}
      {syncState && (
        <div className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-blue-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <Cloud size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold tracking-tight">
                    {language === 'zh' ? '云端 Firestore 数据库与多端实时同步' : 'Cloud Firestore Database & Cross-Device Sync'}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    syncState.status === 'synced' 
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-500/40' 
                      : syncState.status === 'syncing' 
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-500/40 animate-pulse' 
                        : 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                  }`}>
                    {syncState.status === 'synced' ? (language === 'zh' ? '已实时同步' : 'Live & Synced') : syncState.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {language === 'zh' 
                    ? 'Cloud Firestore 作为您的唯一实时数据源，客户档案、产品库、核价单、商业发票、装箱单与公司印章配置在电脑、平板和手机端多端秒级同步。'
                    : 'Cloud Firestore is your Single Source of Truth. All customers, products, quotations, invoices, packing lists, and company settings synchronize in real-time across your computer, iPad, and mobile devices.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-blue-200/80">
                  {syncState.userEmail && (
                    <span className="bg-white/10 px-2 py-0.5 rounded text-white font-medium">
                      {language === 'zh' ? 'Google 登录账号' : 'Google Account'}: {syncState.userEmail}
                    </span>
                  )}
                  {syncState.userId && (
                    <span className="font-mono text-slate-400">
                      UID: {syncState.userId}
                    </span>
                  )}
                  {syncState.lastSyncedAt && (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <ShieldCheck size={12} /> {language === 'zh' ? '最近同步' : 'Last synced'}: {syncState.lastSyncedAt.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onManualSync) onManualSync();
                }}
                disabled={syncState.status === 'syncing'}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <RefreshCw size={13} className={syncState.status === 'syncing' ? 'animate-spin' : ''} />
                <span>{language === 'zh' ? '立即刷新同步' : 'Force Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visual Brand Assets */}
        <div id="corporate-brand-assets-section" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 text-[#1565C0]">
              <FileBadge size={14} /> {language === 'zh' ? '企业品牌标识与官方中英文电子印章' : 'Corporate Brand Assets & Official Stamps'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">{language === 'zh' ? '支持4项专属凭证' : '4 Asset Slots Available'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Logo */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">{t('settings.logo', 'Company Logo')}</label>
                <span className="text-[9px] text-slate-400 font-semibold">{language === 'zh' ? '单据页眉' : 'A4 Header'}</span>
              </div>
              <div 
                id="company-logo-upload-card"
                onClick={() => logoRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#1565C0] rounded-xl p-4 h-40 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/10 cursor-pointer transition-all relative overflow-hidden group"
              >
                {formData.logo ? (
                  <div className="absolute inset-2 flex items-center justify-center">
                    <img src={formData.logo} alt="Logo preview" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={(e) => handleResetImage('logo', e)}
                      className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title={language === 'zh' ? '移除Logo' : 'Remove Logo'}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <Upload size={20} className="text-slate-400 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">{t('settings.upload_logo', 'Upload Logo')}</p>
                    <p className="text-[9px] text-slate-400">{language === 'zh' ? '显示在A4单据抬头' : 'Fits on top right/left of A4'}</p>
                  </div>
                )}
                <input ref={logoRef} type="file" accept="image/*" onChange={(e) => handleFileChange('logo', e)} className="hidden" />
              </div>
            </div>

            {/* 2. Primary Stamp (Round / Official Factory Stamp) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">{t('settings.stamp', 'Primary Stamp')}</label>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{language === 'zh' ? '公章/质检章' : 'Round / QC'}</span>
              </div>
              <div 
                id="company-primary-stamp-upload-card"
                onClick={() => stampRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#1565C0] rounded-xl p-4 h-40 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/10 cursor-pointer transition-all relative overflow-hidden group"
              >
                {formData.stamp ? (
                  <div className="absolute inset-2 flex flex-col items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] rounded-lg">
                    <img 
                      src={formData.stamp} 
                      alt="Primary Stamp preview" 
                      className="max-h-24 max-w-full object-contain mix-blend-multiply drop-shadow-2xs" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute bottom-1 left-2 text-[8px] font-bold text-blue-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-blue-200">
                      {language === 'zh' ? '主公章 (圆形)' : 'Primary Stamp'}
                    </div>
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={(e) => handleRemoveBackgroundManual('stamp', e)}
                        disabled={isProcessingTransparency === 'stamp'}
                        className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Remove white background and make transparent"
                      >
                        <Wand2 size={10} /> {isProcessingTransparency === 'stamp' ? 'Cleaning...' : (language === 'zh' ? '一键去白底' : 'Clean BG')}
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => handleResetImage('stamp', e)}
                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full cursor-pointer"
                        title={language === 'zh' ? '移除印章' : 'Remove Stamp'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5 p-2">
                    <Stamp size={20} className="text-slate-400 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">{t('settings.upload_stamp', 'Upload Main Stamp')}</p>
                    <p className="text-[9px] text-slate-400">{language === 'zh' ? '圆形外贸中英文章' : 'Round factory / QC stamp'}</p>
                    <button
                      type="button"
                      onClick={(e) => handleSetPreset('stamp', DEFAULT_STAMP_SVG, e)}
                      className="mt-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Load Default Round Factory Stamp SVG"
                    >
                      <RotateCcw size={10} /> {language === 'zh' ? '使用预设印章' : 'Use Preset'}
                    </button>
                  </div>
                )}
                <input ref={stampRef} type="file" accept="image/*" onChange={(e) => handleFileChange('stamp', e)} className="hidden" />
              </div>
            </div>

            {/* 3. Secondary Stamp (Contract / Finance / Oval Stamp) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">{language === 'zh' ? '副印章 / 合同专用章' : 'Secondary Stamp'}</label>
                <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">{language === 'zh' ? '合同/财务/椭圆' : 'Contract / Oval'}</span>
              </div>
              <div 
                id="company-secondary-stamp-upload-card"
                onClick={() => secondaryStampRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-rose-500 rounded-xl p-4 h-40 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-rose-50/10 cursor-pointer transition-all relative overflow-hidden group"
              >
                {formData.secondaryStamp ? (
                  <div className="absolute inset-2 flex flex-col items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] rounded-lg">
                    <img 
                      src={formData.secondaryStamp} 
                      alt="Secondary Stamp preview" 
                      className="max-h-24 max-w-full object-contain mix-blend-multiply drop-shadow-2xs" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute bottom-1 left-2 text-[8px] font-bold text-rose-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-rose-200">
                      {language === 'zh' ? '合同专用章 (椭圆)' : 'Secondary Stamp'}
                    </div>
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={(e) => handleRemoveBackgroundManual('secondaryStamp', e)}
                        disabled={isProcessingTransparency === 'secondaryStamp'}
                        className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Remove white background and make transparent"
                      >
                        <Wand2 size={10} /> {isProcessingTransparency === 'secondaryStamp' ? 'Cleaning...' : (language === 'zh' ? '一键去白底' : 'Clean BG')}
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => handleResetImage('secondaryStamp', e)}
                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full cursor-pointer"
                        title={language === 'zh' ? '移除印章' : 'Remove Stamp'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5 p-2">
                    <Stamp size={20} className="text-rose-400 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">{language === 'zh' ? '上传第二枚印章' : 'Upload 2nd Stamp'}</p>
                    <p className="text-[9px] text-slate-400">{language === 'zh' ? '合同专用章 / 财务章' : 'Contract / Finance / Oval stamp'}</p>
                    <button
                      type="button"
                      onClick={(e) => handleSetPreset('secondaryStamp', DEFAULT_CONTRACT_STAMP_SVG, e)}
                      className="mt-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[9px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Load Default Contract Oval Stamp SVG"
                    >
                      <RotateCcw size={10} /> {language === 'zh' ? '使用合同章预设' : 'Use Preset'}
                    </button>
                  </div>
                )}
                <input ref={secondaryStampRef} type="file" accept="image/*" onChange={(e) => handleFileChange('secondaryStamp', e)} className="hidden" />
              </div>
            </div>

            {/* 4. Authorized Signature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700">{t('settings.signature', 'Authorized Signature')}</label>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Sparkles size={10} /> {language === 'zh' ? '自动透明' : 'Auto-Transparent'}
                </span>
              </div>
              <div 
                id="company-signature-upload-card"
                onClick={() => signatureRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#1565C0] rounded-xl p-4 h-40 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-blue-50/10 cursor-pointer transition-all relative overflow-hidden group"
              >
                {formData.signature ? (
                  <div className="absolute inset-2 flex flex-col items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:10px_10px] rounded-lg">
                    <img 
                      src={formData.signature} 
                      alt="Signature preview" 
                      className="max-h-24 max-w-full object-contain mix-blend-multiply drop-shadow-xs" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute bottom-1 left-2 text-[8px] font-bold text-emerald-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-emerald-200">
                      {language === 'zh' ? '手写透明签名' : 'Transparent Signature'}
                    </div>
                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button" 
                        onClick={(e) => handleRemoveBackgroundManual('signature', e)}
                        disabled={isProcessingTransparency === 'signature'}
                        className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Remove white background and make transparent"
                      >
                        <Wand2 size={10} /> {isProcessingTransparency === 'signature' ? 'Cleaning...' : (language === 'zh' ? '一键去白底' : 'Clean BG')}
                      </button>
                      <button 
                        type="button" 
                        onClick={(e) => handleResetImage('signature', e)}
                        className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full cursor-pointer"
                        title={language === 'zh' ? '移除签名' : 'Remove Signature'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <Upload size={20} className="text-slate-400 mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">{t('settings.upload_signature', 'Upload Signature')}</p>
                    <p className="text-[9px] text-slate-400">{language === 'zh' ? '自动清除白底并保持透明' : 'White background auto-removed'}</p>
                  </div>
                )}
                <input ref={signatureRef} type="file" accept="image/*" onChange={(e) => handleFileChange('signature', e)} className="hidden" />
              </div>
            </div>
          </div>
        </div>

        {/* Company Registration Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2 md:col-span-3">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 text-[#1565C0]">
              <Building2 size={14} /> {language === 'zh' ? '出口商主体资料与企业基本信息' : 'Corporate Identity Profile'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.company_name', 'Exporter Corporate Name')}</label>
            <input 
              type="text" 
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.tax_number', 'Tax Registration No.')}</label>
            <input 
              type="text" 
              value={formData.taxNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.country', 'Country of Registration')}</label>
            <input 
              type="text" 
              value={formData.country || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.address', 'Factory Registered Office Address')}</label>
            <textarea 
              rows={2}
              value={formData.address || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.phone', 'Commercial Telephone')}</label>
            <input 
              type="text" 
              value={formData.phone || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.whatsapp', 'WhatsApp Hotlink')}</label>
            <input 
              type="text" 
              value={formData.whatsapp || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.email', 'Email Support')}</label>
            <input 
              type="email" 
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.website', 'Factory Website')}</label>
            <input 
              type="text" 
              value={formData.website || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.default_currency', 'Default Export Currency')}</label>
            <select 
              value={formData.defaultCurrency || 'USD'}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultCurrency: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            >
              {SUPPORTED_CURRENCIES.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.vat_rate', 'Default VAT Rate (%)')}</label>
            <input 
              type="number" 
              value={formData.defaultTaxRate !== undefined ? formData.defaultTaxRate : 14}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultTaxRate: Number(e.target.value) }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>
        </div>

        {/* Global Bank SWIFT Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="sm:col-span-2 md:col-span-3">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 text-[#1565C0]">
              <CreditCard size={14} /> {language === 'zh' ? '国际外汇结算银行账户资料 (SWIFT)' : 'Settlement Banking Particulars'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.bank_name', 'Bank Name')}</label>
            <input 
              type="text" 
              value={formData.bankName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.account_name', 'Account Name (Beneficiary)')}</label>
            <input 
              type="text" 
              value={formData.accountName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.account_number', 'Account Number')}</label>
            <input 
              type="text" 
              value={formData.accountNumber || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.swift_code', 'SWIFT / BIC Code')}</label>
            <input 
              type="text" 
              value={formData.swift || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, swift: e.target.value.toUpperCase().replace(/\s/g, '') }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 font-mono focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{t('settings.branch_location', 'Branch Office Location')}</label>
            <input 
              type="text" 
              value={formData.branch || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
            />
          </div>
        </div>

        {/* Domestic RMB Settlement & QR Codes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 text-[#07C160]">
            <CreditCard size={14} /> {language === 'zh' ? '国内人民币结算与手机扫码账户' : 'Domestic RMB Payment & QR Code Settlement (国内人民币结算)'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '开户银行' : 'Local Bank Branch'}</label>
              <input 
                type="text" 
                value={formData.localBankName || '农业银行衢州衢化支行'}
                onChange={(e) => setFormData(prev => ({ ...prev, localBankName: e.target.value }))}
                placeholder="例如：农业银行衢州衢化支行"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#07C160] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '户名 / 收款人' : 'Account Name'}</label>
              <input 
                type="text" 
                value={formData.localAccountName || '徐叶兵'}
                onChange={(e) => setFormData(prev => ({ ...prev, localAccountName: e.target.value }))}
                placeholder="例如：徐叶兵"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#07C160] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '银行卡号' : 'Bank Card Number'}</label>
              <input 
                type="text" 
                value={formData.localAccountNumber || '6228481077103681570'}
                onChange={(e) => setFormData(prev => ({ ...prev, localAccountNumber: e.target.value }))}
                placeholder="例如：6228481077103681570"
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#07C160] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            {/* WeChat Pay QR */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#07C160]"></span>
                {language === 'zh' ? '微信支付收款码' : 'WeChat Pay QR Code'}
              </label>
              <div 
                onClick={() => wechatQrRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#07C160] rounded-xl p-4 h-40 flex flex-col items-center justify-center bg-emerald-50/20 hover:bg-emerald-50/40 cursor-pointer transition-all relative overflow-hidden group"
              >
                {formData.wechatQr ? (
                  <div className="absolute inset-2 flex items-center justify-center">
                    <img src={formData.wechatQr} alt="WeChat QR preview" className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={(e) => handleResetImage('wechatQr', e)}
                      className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <Upload size={20} className="text-[#07C160] mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">{language === 'zh' ? '上传微信收款码' : 'Upload WeChat QR'}</p>
                    <p className="text-[9px] text-slate-400">{language === 'zh' ? '点击上传微信二维码图片' : 'Click to upload WeChat Pay QR image'}</p>
                  </div>
                )}
                <input ref={wechatQrRef} type="file" accept="image/*" onChange={(e) => handleFileChange('wechatQr', e)} className="hidden" />
              </div>
            </div>

            {/* Alipay QR */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1677FF]"></span>
                {language === 'zh' ? '支付宝收款码' : 'Alipay QR Code'}
              </label>
              <div 
                onClick={() => alipayQrRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#1677FF] rounded-xl p-4 h-40 flex flex-col items-center justify-center bg-blue-50/20 hover:bg-blue-50/40 cursor-pointer transition-all relative overflow-hidden group"
              >
                {formData.alipayQr ? (
                  <div className="absolute inset-2 flex items-center justify-center">
                    <img src={formData.alipayQr} alt="Alipay QR preview" className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={(e) => handleResetImage('alipayQr', e)}
                      className="absolute top-1 right-1 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5">
                    <Upload size={20} className="text-[#1677FF] mx-auto" />
                    <p className="text-[11px] font-bold text-slate-700">{language === 'zh' ? '上传支付宝收款码' : 'Upload Alipay QR'}</p>
                    <p className="text-[9px] text-slate-400">{language === 'zh' ? '点击上传支付宝二维码图片' : 'Click to upload Alipay QR image'}</p>
                  </div>
                )}
                <input ref={alipayQrRef} type="file" accept="image/*" onChange={(e) => handleFileChange('alipayQr', e)} className="hidden" />
              </div>
            </div>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-slate-100 pt-6">
          <div>
            {onResetData ? (
              <button
                type="button"
                onClick={onResetData}
                className="w-full sm:w-auto px-4 py-2 border border-red-200 hover:border-red-300 text-red-600 bg-red-50/30 hover:bg-red-50 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center"
              >
                {t('settings.reset_workspace', 'Reset to Factory Seeds')}
              </button>
            ) : (
              <div className="text-xs text-slate-500 font-medium leading-normal">
                {success && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-100 animate-fade-in">
                    <Check size={14} /> {t('settings.save_success', 'Profile parameters committed successfully!')}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onResetData && success && (
              <span className="text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-100 animate-fade-in text-xs justify-center">
                <Check size={14} /> {t('settings.save_success', 'Profile parameters committed successfully!')}
              </span>
            )}
            <button 
              type="submit"
              className="w-full sm:w-auto px-8 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:translate-y-0 text-center"
            >
              {t('settings.save_button', 'Commit Profile Settings')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
