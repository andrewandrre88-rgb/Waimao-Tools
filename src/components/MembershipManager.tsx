import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  QrCode, 
  Save, 
  RefreshCw,
  Copy,
  ExternalLink,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { 
  fetchAuthorizedMembers, 
  addAuthorizedMember, 
  removeAuthorizedMember, 
  fetchMembershipConfig, 
  saveMembershipConfig,
  AuthorizedMember,
  MembershipConfig 
} from '../utils/membership';

export default function MembershipManager() {
  const { language } = useLanguage();
  const [members, setMembers] = useState<AuthorizedMember[]>([]);
  const [config, setConfig] = useState<MembershipConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Member Form
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newDays, setNewDays] = useState('365'); // default 1 year
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Config Form
  const [wechatId, setWechatId] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('29');
  const [annualPrice, setAnnualPrice] = useState('199');
  const [lifetimePrice, setLifetimePrice] = useState('399');
  const [wechatQr, setWechatQr] = useState('');
  const [alipayQr, setAlipayQr] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [membersList, cfg] = await Promise.all([
        fetchAuthorizedMembers(),
        fetchMembershipConfig()
      ]);
      setMembers(membersList);
      setConfig(cfg);
      setWechatId(cfg.wechatId || '');
      setMonthlyPrice(cfg.monthlyPriceRmb?.toString() || '29');
      setAnnualPrice(cfg.annualPriceRmb?.toString() || '199');
      setLifetimePrice(cfg.lifetimePriceRmb?.toString() || '399');
      setWechatQr(cfg.wechatQr || '');
      setAlipayQr(cfg.alipayQr || '');
    } catch (e) {
      console.error('Failed to load membership data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setMessage({ type: 'error', text: language === 'zh' ? '请输入 Gmail 邮箱' : 'Please enter a Gmail email' });
      return;
    }

    setIsAdding(true);
    setMessage(null);
    try {
      const days = parseInt(newDays) || 365;
      const expiresAt = days >= 9999 ? undefined : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      
      const newMember: AuthorizedMember = {
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || undefined,
        note: newNote.trim() || undefined,
        status: 'active',
        plan: days >= 9999 ? 'lifetime' : (days >= 300 ? 'annual' : 'monthly'),
        addedAt: new Date().toISOString(),
        expiresAt: expiresAt
      };

      await addAuthorizedMember(newMember);
      setMessage({ 
        type: 'success', 
        text: language === 'zh' 
          ? `已成功将 ${newEmail} 添加到授权使用名单！对方登录后将直接进入工作台。` 
          : `Successfully authorized ${newEmail}! They can now sign in immediately.` 
      });
      setNewEmail('');
      setNewName('');
      setNewNote('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to add member' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!window.confirm(
      language === 'zh' 
        ? `确定要取消 ${email} 的授权吗？该用户将无法进入工作台。` 
        : `Are you sure you want to revoke access for ${email}?`
    )) {
      return;
    }

    try {
      await removeAuthorizedMember(email);
      setMembers(prev => prev.filter(m => m.email.toLowerCase() !== email.toLowerCase()));
      setMessage({
        type: 'success',
        text: language === 'zh' ? `已移除 ${email} 的授权。` : `Removed authorization for ${email}.`
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to remove member' });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setMessage(null);
    try {
      const updated: MembershipConfig = {
        wechatId: wechatId.trim(),
        monthlyPriceRmb: parseFloat(monthlyPrice) || 29,
        annualPriceRmb: parseFloat(annualPrice) || 199,
        lifetimePriceRmb: parseFloat(lifetimePrice) || 399,
        wechatQr,
        alipayQr
      };
      await saveMembershipConfig(updated);
      setConfig(updated);
      setMessage({
        type: 'success',
        text: language === 'zh' ? '收款码与价格设置已成功保存并实时生效！' : 'Payment QR & price settings updated successfully!'
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save configuration' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleQrUpload = (type: 'wechat' | 'alipay', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      if (type === 'wechat') setWechatQr(b64);
      else setAlipayQr(b64);
    };
    reader.readAsDataURL(file);
  };

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.note && m.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {language === 'zh' ? '付费会员与 Gmail 授权白名单管理' : 'Member Authorization & Monetization'}
                <span className="text-[11px] bg-blue-100 text-[#1565C0] font-bold px-2.5 py-0.5 rounded-full">
                  Admin Only
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'zh' 
                  ? '客户通过微信或支付宝付款后，在此输入他们的 Gmail 账号即可为其开通权限，数据将自动保存在他们专属的云端空间' 
                  : 'Add customer Gmail accounts here to grant them access. Their data is securely isolated and saved.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0 self-start sm:self-center"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>{language === 'zh' ? '刷新授权列表' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Alert Banner */}
      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{message.text}</div>
          <button 
            type="button" 
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Two Column Layout: Add Member & Payment Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Add Gmail Authorization (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#1565C0]" />
                <h2 className="text-sm font-black text-slate-800">
                  {language === 'zh' ? '➕ 快速开通授权 (添加客户 Gmail)' : 'Authorize New Customer Gmail'}
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {language === 'zh' ? '即时生效，对方登录即可使用' : 'Instant Activation'}
              </span>
            </div>

            <form onSubmit={handleAddMember} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{language === 'zh' ? '客户 Gmail 邮箱地址 *' : 'Customer Gmail Address *'}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {language === 'zh' ? '客户登录网站时使用的邮箱' : 'The email customer logs in with'}
                  </span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:border-[#1565C0] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'zh' ? '客户称呼 / 公司名 (选填)' : 'Customer Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '例如: 广州外贸李总' : 'e.g. David / Apex Trade'}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#1565C0] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {language === 'zh' ? '授权时长 / 套餐' : 'Authorization Duration'}
                  </label>
                  <select
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-[#1565C0] focus:bg-white"
                  >
                    <option value="30">{language === 'zh' ? '1 个月 (30天) - 月度版' : '1 Month (30 Days)'}</option>
                    <option value="90">{language === 'zh' ? '3 个月 (90天) - 季度版' : '3 Months (90 Days)'}</option>
                    <option value="365">{language === 'zh' ? '1 年 (365天) - 年度 VIP' : '1 Year (365 Days)'}</option>
                    <option value="730">{language === 'zh' ? '2 年 (730天)' : '2 Years (730 Days)'}</option>
                    <option value="99999">{language === 'zh' ? '永久授权 (终身买断)' : 'Lifetime Access'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'zh' ? '收款备注 (选填)' : 'Payment Remark / Note (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={language === 'zh' ? '例如: 微信转账 199元，单号尾号 5821' : 'e.g. WeChat Pay 199 RMB'}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#1565C0] focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-3 bg-[#1565C0] hover:bg-blue-800 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  <span>
                    {isAdding 
                      ? (language === 'zh' ? '正在开通授权...' : 'Authorizing...') 
                      : (language === 'zh' ? '立即开通此 Gmail 授权' : 'Authorize This Gmail Now')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Members List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div>
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>{language === 'zh' ? '已授权付费用户列表' : 'Authorized Members List'}</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {members.length}
                  </span>
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-60">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={language === 'zh' ? '搜索邮箱或客户名...' : 'Search members...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-[#1565C0]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">{language === 'zh' ? 'Gmail 邮箱' : 'Gmail Email'}</th>
                    <th className="py-3 px-4">{language === 'zh' ? '客户称呼 / 备注' : 'Client / Remark'}</th>
                    <th className="py-3 px-4">{language === 'zh' ? '授权到期日' : 'Expires At'}</th>
                    <th className="py-3 px-4 text-center">{language === 'zh' ? '状态' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{language === 'zh' ? '操作' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        {language === 'zh' ? '暂无匹配的已授权用户。在上方添加 Gmail 即可开通！' : 'No authorized members found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => {
                      const isExpired = m.expiresAt && new Date(m.expiresAt).getTime() < Date.now();
                      return (
                        <tr key={m.email} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {m.email}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{m.name || '-'}</div>
                            {m.note && <div className="text-[10px] text-slate-400 mt-0.5">{m.note}</div>}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {m.expiresAt ? (
                              <span className={`inline-flex items-center gap-1 ${isExpired ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                <Calendar size={12} />
                                {new Date(m.expiresAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                                {language === 'zh' ? '永久有效' : 'Lifetime'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isExpired ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                                {language === 'zh' ? '已过期' : 'Expired'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {language === 'zh' ? '正常使用' : 'Active'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(m.email)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={language === 'zh' ? '取消此邮箱授权' : 'Revoke authorization'}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: WeChat & Alipay Payment Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={18} className="text-[#1565C0]" />
                <h2 className="text-sm font-black text-slate-800">
                  {language === 'zh' ? '微信/支付宝收款码与价格设置' : 'Payment QR & Pricing Display'}
                </h2>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {language === 'zh' ? '您的微信客服号 / 咨询微信' : 'Your WeChat Contact ID'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. waimao_vip888"
                  value={wechatId}
                  onChange={(e) => setWechatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:border-[#1565C0] focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'zh' ? '未激活用户会在登录锁屏界面看到此微信号，方便加您付款' : 'Shown to unactivated visitors on login screen'}
                </p>
              </div>

              {/* Pricing settings */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {language === 'zh' ? '展示价格设置 (人民币 ¥)' : 'Pricing Tiers (RMB)'}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">
                      {language === 'zh' ? '月卡 (元)' : 'Monthly'}
                    </span>
                    <input
                      type="number"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">
                      {language === 'zh' ? '年卡 (元)' : 'Annual'}
                    </span>
                    <input
                      type="number"
                      value={annualPrice}
                      onChange={(e) => setAnnualPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">
                      {language === 'zh' ? '终身买断' : 'Lifetime'}
                    </span>
                    <input
                      type="number"
                      value={lifetimePrice}
                      onChange={(e) => setLifetimePrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* QR Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* WeChat QR */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-emerald-700 mb-2">
                    {language === 'zh' ? '微信收款码 / 赞赏码' : 'WeChat Pay QR'}
                  </span>
                  <div className="w-28 h-28 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-2.5">
                    {wechatQr ? (
                      <img src={wechatQr} alt="WeChat Pay" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-slate-400 p-2 text-center">
                        {language === 'zh' ? '暂未上传' : 'No QR yet'}
                      </div>
                    )}
                  </div>
                  <label className="text-[11px] text-[#1565C0] font-bold hover:underline cursor-pointer">
                    <span>{wechatQr ? (language === 'zh' ? '更换图片' : 'Change') : (language === 'zh' ? '上传微信码' : 'Upload')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload('wechat', e)} />
                  </label>
                </div>

                {/* Alipay QR */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-blue-700 mb-2">
                    {language === 'zh' ? '支付宝收款码' : 'Alipay QR'}
                  </span>
                  <div className="w-28 h-28 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center mb-2.5">
                    {alipayQr ? (
                      <img src={alipayQr} alt="Alipay" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-slate-400 p-2 text-center">
                        {language === 'zh' ? '暂未上传' : 'No QR yet'}
                      </div>
                    )}
                  </div>
                  <label className="text-[11px] text-[#1565C0] font-bold hover:underline cursor-pointer">
                    <span>{alipayQr ? (language === 'zh' ? '更换图片' : 'Change') : (language === 'zh' ? '上传支付宝码' : 'Upload')}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload('alipay', e)} />
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>
                    {isSavingConfig 
                      ? (language === 'zh' ? '正在保存...' : 'Saving...') 
                      : (language === 'zh' ? '保存收款码与价格设置' : 'Save Payment Settings')}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick instructions box */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 space-y-2">
            <h3 className="font-extrabold text-[#1565C0] flex items-center gap-1.5">
              💡 {language === 'zh' ? '收费运营全流程说明' : 'How the monetization flow works'}
            </h3>
            <ol className="list-decimal list-inside space-y-1.5 text-blue-800/90 leading-relaxed text-[11px]">
              <li>
                {language === 'zh' 
                  ? '新客户打开网站使用 Google 登录，如果尚未授权，系统会自动弹出您的微信客服二维码与收费说明。' 
                  : 'New visitors who log in with Google will see your WeChat QR and pricing if they are not yet authorized.'}
              </li>
              <li>
                {language === 'zh' 
                  ? '客户扫码转账后，将他们的 Gmail 账号发给您。' 
                  : 'They pay via WeChat/Alipay and send you their Gmail address.'}
              </li>
              <li>
                {language === 'zh' 
                  ? '您在此页面输入他们的 Gmail 并点击【立即开通】，客户立即获得使用权限！' 
                  : 'You enter their Gmail on this page and click Authorize. They gain instant full access!'}
              </li>
              <li>
                {language === 'zh' 
                  ? '每个付费客户创建的所有报价单、客户名录、发票均独立保存在专属 Firestore 空间，安全永不混淆。' 
                  : 'All products, invoices, and clients created by each user are isolated in their own cloud storage.'}
              </li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  );
}
