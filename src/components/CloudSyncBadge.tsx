import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown,
  ShieldCheck,
  Smartphone,
  Laptop
} from 'lucide-react';

export interface CloudSyncState {
  status: 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  userEmail: string | null;
  userId: string | null;
}

interface CloudSyncBadgeProps {
  syncState: CloudSyncState;
  onManualSync: () => void;
}

export default function CloudSyncBadge({ syncState, onManualSync }: CloudSyncBadgeProps) {
  const { t, language } = useLanguage();
  const [showPopover, setShowPopover] = useState(false);

  const getBadgeStyle = () => {
    switch (syncState.status) {
      case 'syncing':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70';
      case 'synced':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70';
      case 'error':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70';
      case 'offline':
        return 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/70';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70';
    }
  };

  const getStatusIcon = () => {
    switch (syncState.status) {
      case 'syncing':
        return <RefreshCw size={13} className="animate-spin text-blue-600" />;
      case 'synced':
        return <CheckCircle2 size={13} className="text-emerald-600" />;
      case 'error':
        return <AlertTriangle size={13} className="text-amber-600" />;
      case 'offline':
        return <CloudOff size={13} className="text-slate-400" />;
      default:
        return <Cloud size={13} className="text-emerald-600" />;
    }
  };

  const getStatusText = () => {
    switch (syncState.status) {
      case 'syncing':
        return t('sync.syncing', 'Syncing Cloud...');
      case 'synced':
        return t('sync.synced', 'Firestore Live Sync');
      case 'error':
        return t('sync.error', 'Cloud Sync Issue');
      case 'offline':
        return t('sync.offline', 'Local Offline Cache');
      default:
        return t('sync.synced', 'Cloud Firestore Synced');
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return language === 'zh' ? '实时连接中' : 'Connected & Listening';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPopover(!showPopover)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shadow-2xs cursor-pointer ${getBadgeStyle()}`}
        title="Firebase Cloud Firestore Cross-Device Sync"
      >
        <span className="relative flex h-2 w-2">
          {syncState.status === 'synced' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            syncState.status === 'synced' 
              ? 'bg-emerald-500' 
              : syncState.status === 'syncing' 
                ? 'bg-blue-500' 
                : 'bg-amber-500'
          }`} />
        </span>
        {getStatusIcon()}
        <span className="hidden md:inline">{getStatusText()}</span>
        <span className="md:hidden">{language === 'zh' ? '云端' : 'Cloud'}</span>
        <ChevronDown size={11} className={`text-slate-400 transition-transform ${showPopover ? 'rotate-180' : ''}`} />
      </button>

      {showPopover && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPopover(false)} 
          />
          <div className="absolute right-0 mt-2 w-84 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Cloud size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{t('sync.title', 'Cloud Firestore Database')}</h4>
                  <p className="text-[10px] text-slate-500">{t('sync.desc', 'Single Source of Truth across all devices')}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                syncState.status === 'synced' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : syncState.status === 'syncing' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-amber-100 text-amber-800'
              }`}>
                {syncState.status === 'synced' ? (language === 'zh' ? '实时活跃' : 'Real-Time Active') : syncState.status}
              </span>
            </div>

            <div className="py-3 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex -space-x-1 text-slate-500">
                  <Laptop size={15} />
                  <Smartphone size={15} />
                </div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  {t('sync.cross_device', 'Cross-Device Sync: Changes on Computer, iPad, or Mobile update instantly.')}
                </div>
              </div>

              {syncState.userEmail && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[11px] text-slate-500">{t('sync.google_account', 'Google Account')}:</span>
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[160px]">
                    {syncState.userEmail}
                  </span>
                </div>
              )}

              {syncState.userId && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[11px] text-slate-500">{t('sync.account_uid', 'Account UID')}:</span>
                  <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 truncate max-w-[150px]">
                    {syncState.userId}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600">
                <span className="text-[11px] text-slate-500">{t('sync.last_sync', 'Last Sync')}:</span>
                <span className="font-semibold text-slate-800">{formatLastSync(syncState.lastSyncedAt)}</span>
              </div>

              {syncState.errorMessage && (
                <div className="p-2 rounded-lg bg-amber-50 text-amber-800 text-[10px] flex items-start gap-1.5 leading-relaxed">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{syncState.errorMessage}</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>{t('sync.security_rules', 'Security Rules Enforced')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onManualSync();
                }}
                disabled={syncState.status === 'syncing'}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <RefreshCw size={12} className={syncState.status === 'syncing' ? 'animate-spin' : ''} />
                <span>{t('sync.force_refresh', 'Refresh Cloud')}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
