import React, { useEffect } from 'react';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  AlertTriangle, 
  Save, 
  Trash2, 
  X, 
  FileEdit, 
  Loader2,
  ArrowRight
} from 'lucide-react';

export default function UnsavedChangesModal() {
  const { t, language } = useLanguage();
  const { 
    showPrompt, 
    unsavedState, 
    isSaving, 
    confirmSaveAndProceed, 
    confirmDiscardAndProceed, 
    cancelPrompt 
  } = useNavigationGuard();

  // Handle keyboard shortcuts (Escape to cancel, Enter to save & proceed)
  useEffect(() => {
    if (!showPrompt) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelPrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrompt, cancelPrompt]);

  if (!showPrompt) return null;

  const docTitle = unsavedState?.docTitle || (language === 'zh' ? '当前单据' : 'Active Document');
  const docType = unsavedState?.docType || (language === 'zh' ? '单据草稿' : 'Document Draft');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-150 relative"
      >
        {/* Top Accent Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-xs">
              <AlertTriangle size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 id="unsaved-modal-title" className="text-base font-black tracking-tight leading-tight">
                {t('modal.unsaved_title', 'Unsaved Changes Detected')}
              </h2>
              <p className="text-[11px] text-amber-100 font-medium">
                {t('modal.unsaved_subtitle', 'Save your progress before exiting or navigating away')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cancelPrompt}
            disabled={isSaving}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title={language === 'zh' ? '取消并继续编辑' : 'Cancel and continue editing'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 flex items-start gap-3.5">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
              <FileEdit size={18} />
            </div>
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800/80 block">
                {docType}
              </span>
              <p className="text-slate-800 font-black text-sm break-words">
                {docTitle}
              </p>
              <p className="text-slate-600 text-xs leading-relaxed pt-1">
                {t('modal.unsaved_desc', 'You have active unsaved modifications. If you exit now without saving, any uncommitted changes will be permanently discarded.')}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            {t('modal.unsaved_question', 'Would you like to save your data now before leaving?')}
          </p>

          {/* Action Button Grid */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={cancelPrompt}
              disabled={isSaving}
              className="order-3 sm:order-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {t('modal.keep_editing', 'Keep Editing')}
            </button>

            <button
              type="button"
              onClick={confirmDiscardAndProceed}
              disabled={isSaving}
              className="order-2 sm:order-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{t('modal.discard_exit', 'Discard & Exit')}</span>
            </button>

            <button
              type="button"
              onClick={confirmSaveAndProceed}
              disabled={isSaving}
              className="order-1 sm:order-3 px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{t('modal.saving_data', 'Saving Data...')}</span>
                </>
              ) : (
                <>
                  <Save size={14} className="stroke-[2.5]" />
                  <span>{t('modal.save_continue', 'Save & Continue')}</span>
                  <ArrowRight size={13} className="opacity-80" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
