import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  documentNumber: string;
  elementId?: string;
  clientName?: string;
  date?: string;
  grandTotal?: string;
  currency?: string;
  language?: 'zh' | 'en';
}

export default function PrintDocumentModal({
  isOpen,
  onClose,
  documentTitle,
  documentNumber,
  elementId = 'print-area',
  clientName,
  date,
  grandTotal,
  currency,
  language = 'en'
}: PrintDocumentModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'success' | 'fallback'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPrintStatus('idle');
      const isInIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (isInIframe) {
        setStatusMessage(
          language === 'zh'
            ? '已为您准备好 A4 出口单据。可点击【调起系统打印机】或直接【下载 A4 打印文件】进行打印。'
            : 'A4 export document is ready. Click "System Print Dialog" or "Download Printable PDF" to print.'
        );
      } else {
        try {
          printDocument(elementId, documentNumber);
        } catch (err) {
          console.warn('Initial print call:', err);
        }
      }
    }
  }, [isOpen, elementId, documentNumber, language]);

  if (!isOpen) return null;

  const isZh = language === 'zh';

  const handleSystemPrint = () => {
    setPrintStatus('idle');
    try {
      printDocument(elementId, documentNumber);
      setPrintStatus('success');
      setStatusMessage(
        isZh 
          ? '已向系统发送打印指令。若浏览器由于内嵌窗口限制未弹出打印窗口，请点击下方【下载 A4 打印文件】直接打印。' 
          : 'Print command dispatched. If your browser blocks popups in preview mode, please use "Download Printable PDF" below.'
      );
    } catch (e) {
      console.warn('System print failed:', e);
      handleDownloadPrintPdf();
    }
  };

  const handleDownloadPrintPdf = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      await exportDocumentToPDF(elementId, `${documentNumber || 'Document'}_Print`);
      setPrintStatus('success');
      setStatusMessage(
        isZh 
          ? '✓ 打印文件已成功生成并下载！可直接打开文件发送至任何物理打印机打印。' 
          : '✓ Printable A4 PDF generated and downloaded! Ready to send to any printer.'
      );
    } catch (err) {
      console.error('PDF generation error:', err);
      setPrintStatus('fallback');
      setStatusMessage(
        isZh 
          ? '生成出现问题，请重试或检查单据内容。' 
          : 'Generation encountered an issue, please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/20 shadow-inner">
              <Printer size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>{isZh ? '打印出口单据' : 'Print Export Document'}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  A4 Ready
                </span>
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5 font-mono">
                {documentTitle} • {documentNumber}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Document Summary Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-500">
              <span>{isZh ? '单据编号' : 'Document No'}:</span>
              <span className="font-mono font-bold text-slate-900">{documentNumber}</span>
            </div>
            {clientName && (
              <div className="flex justify-between items-center text-slate-500">
                <span>{isZh ? '客户名称' : 'Client / Importer'}:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[240px]">{clientName}</span>
              </div>
            )}
            {date && (
              <div className="flex justify-between items-center text-slate-500">
                <span>{isZh ? '制单日期' : 'Date'}:</span>
                <span className="text-slate-700">{date}</span>
              </div>
            )}
            {grandTotal && (
              <div className="flex justify-between items-center text-slate-500 pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-700 uppercase">{isZh ? '单据总额' : 'Grand Total'}:</span>
                <span className="font-mono font-black text-[#1565C0] text-sm">
                  {currency || '$'} {grandTotal}
                </span>
              </div>
            )}
          </div>

          {/* Status feedback banner if any */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
              printStatus === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {printStatus === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-medium">{statusMessage}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Action 1: System Print */}
            <button
              type="button"
              onClick={handleSystemPrint}
              className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-950 flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-xs cursor-pointer group active:scale-98"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Printer size={18} />
              </div>
              <span className="font-extrabold text-xs text-emerald-900 block mt-1">
                {isZh ? '调起系统打印机' : 'System Print Dialog'}
              </span>
              <span className="text-[10px] text-emerald-700 block">
                {isZh ? '直接发送至物理打印机' : 'Direct browser print dialog'}
              </span>
            </button>

            {/* Action 2: Printable PDF Download */}
            <button
              type="button"
              onClick={handleDownloadPrintPdf}
              disabled={isGenerating}
              className="p-4 rounded-xl border-2 border-[#1565C0] bg-blue-50/50 hover:bg-blue-100/70 text-blue-950 flex flex-col items-center justify-center text-center gap-1.5 transition-all shadow-xs cursor-pointer group disabled:opacity-50 active:scale-98"
            >
              <div className="w-10 h-10 rounded-full bg-[#1565C0] text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </div>
              <span className="font-extrabold text-xs text-blue-900 block mt-1">
                {isGenerating 
                  ? (isZh ? '生成中...' : 'Generating...') 
                  : (isZh ? '下载 A4 打印文件' : 'Download Printable PDF')}
              </span>
              <span className="text-[10px] text-blue-700 block">
                {isZh ? '300DPI 标准 A4 打印专用' : 'Export standard A4 300DPI file'}
              </span>
            </button>
          </div>

          {/* Exporter Printing Tips */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              <span>{isZh ? '打印规格说明与建议：' : 'Export Printing Recommendations:'}</span>
            </p>
            <p>• {isZh ? '纸张规格：标准 A4 (210mm × 297mm) 纵向。' : 'Paper format: Standard A4 portrait (210mm × 297mm).'}</p>
            <p>• {isZh ? '印章与样式：已自动配置去白底及盖章叠加效果，打印清晰真实。' : 'Seals & layout: Transparent background and stamps are fully preserved.'}</p>
            <p>• {isZh ? '内嵌提示：如在内嵌预览窗口遇到弹窗限制，使用【下载 A4 打印文件】随时可打印。' : 'Tip: If preview iframe restricts popups, Download Printable PDF provides immediate printing.'}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-medium">
            Waimao Tools • Export Document Suite
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isZh ? '完成 / 关闭' : 'Done / Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
