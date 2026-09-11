import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Client } from '../types';
import { generateId } from '../utils/storage';
import { 
  Users, 
  Search, 
  Plus, 
  X, 
  Edit2, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  UserCheck 
} from 'lucide-react';

interface ClientDatabaseProps {
  clients: Client[];
  onSaveClients: (clients: Client[]) => void;
  // Deep link targeting
  searchTarget: { id: string; type: string } | null;
  clearSearchTarget: () => void;
}

export default function ClientDatabase({ clients, onSaveClients, searchTarget, clearSearchTarget }: ClientDatabaseProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client> | null>(null);

  // Deep Link handler
  if (searchTarget && searchTarget.type === 'client' && !isEditing) {
    const matched = clients.find(c => c.id === searchTarget.id);
    if (matched) {
      setCurrentClient(matched);
      setIsEditing(true);
      clearSearchTarget();
    }
  }

  // Filter clients
  const filteredClients = clients.filter(c => 
    c.company.toLowerCase().includes(search.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  // Handle Save
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) return;

    const updated = { ...currentClient } as Client;

    if (!updated.company || !updated.contactPerson) {
      alert(language === 'zh' ? "公司名称和联系人姓名不能为空" : "Company Name and Contact Person are required");
      return;
    }

    let nextClients: Client[];
    if (updated.id) {
      nextClients = clients.map(c => c.id === updated.id ? updated : c);
    } else {
      updated.id = generateId();
      nextClients = [updated, ...clients];
    }

    onSaveClients(nextClients);
    setIsEditing(false);
    setCurrentClient(null);
  };

  // Handle Delete
  const handleDeleteClient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm(language === 'zh' ? "确定要删除此客户吗？已创建的单据不会受影响。" : "Are you sure you want to delete this client? They will not be removed from existing invoices, but won't be available for future autofills.");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const next = clients.filter(c => c.id !== id);
      onSaveClients(next);
    }
  };

  return (
    <div className="space-y-6 print:hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="text-[#1565C0]" size={22} />
            {t('clients.title', 'Client Database')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('clients.subtitle', 'Maintain directories of international shipping agents, distributors, and buyers.')}
          </p>
        </div>

        {!isEditing && (
          <button 
            onClick={() => {
              setCurrentClient({});
              setIsEditing(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 sm:py-1.5 rounded-lg bg-[#1565C0] text-white hover:bg-blue-700 text-xs font-extrabold transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus size={14} /> {t('clients.new_client', 'Add New Client')}
          </button>
        )}
      </div>

      {!isEditing ? (
        <>
          {/* Search bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('clients.search_placeholder', 'Search clients by company, agent name, country...')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              {filteredClients.length} {language === 'zh' ? '位已建档买家客户' : 'Registered Clients'}
            </span>
          </div>

          {/* Grid display */}
          {filteredClients.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users size={24} />
              </div>
              <p className="text-xs font-semibold text-slate-600">{t('clients.no_clients', 'No client files found.')}</p>
              <p className="text-[10px] mt-1">{language === 'zh' ? '点击“添加新客户”登记买家档案。' : 'Register new buyers by tapping "Add New Client".'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClients.map(c => (
                <div 
                  key={c.id}
                  onClick={() => {
                    setCurrentClient(c);
                    setIsEditing(true);
                  }}
                  className="bg-white border border-slate-200 p-5 rounded-xl cursor-pointer hover:border-[#1565C0] hover:shadow-md transition-all flex flex-col justify-between group h-full"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-bold text-[#1565C0] uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-sm">
                          {c.country || (language === 'zh' ? '全球采购商' : 'Global Buyer')}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-sm mt-1.5 group-hover:text-[#1565C0] transition-colors">
                          {c.company}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentClient(c);
                            setIsEditing(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                          title={language === 'zh' ? '编辑客户' : 'Edit client'}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClient(c.id, e)}
                          className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
                          title={language === 'zh' ? '删除客户' : 'Delete client'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                      <p className="flex items-center gap-2 text-slate-700">
                        <UserCheck size={13} className="text-slate-400 shrink-0" />
                        <span>{language === 'zh' ? '主要联系人' : 'Agent'}: {c.contactPerson}</span>
                      </p>
                      {c.phone && (
                        <p className="flex items-center gap-2">
                          <Phone size={13} className="text-slate-400 shrink-0" />
                          <span>{c.phone}</span>
                        </p>
                      )}
                      {c.email && (
                        <p className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </p>
                      )}
                      {c.address && (
                        <p className="flex items-center gap-2 align-top">
                          <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                          <span className="truncate">{c.address}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {c.notes && (
                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 italic bg-slate-50/50 p-2 rounded">
                      {language === 'zh' ? '备注' : 'Notes'}: {c.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Form display */
        <form onSubmit={handleSaveClient} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              {currentClient.id ? (language === 'zh' ? '修改客户档案资料' : 'Modify Client Particulars') : (language === 'zh' ? '录入新建买家档案' : 'Create New Buyer File')}
            </h2>
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setCurrentClient(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.company_name', 'Company Name')} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. EuroTrade Importers Ltd"
                value={currentClient.company || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, company: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.contact_person', 'Contact Person (Agent Name)')} <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                placeholder="e.g. Hans Müller"
                value={currentClient.contactPerson || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.country', 'Country of Destination')}
              </label>
              <input 
                type="text" 
                placeholder="e.g. Germany"
                value={currentClient.country || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, country: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.phone', 'Phone Number')}
              </label>
              <input 
                type="text" 
                placeholder="e.g. +49 89 1234567"
                value={currentClient.phone || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.email', 'Email Address')}
              </label>
              <input 
                type="email" 
                placeholder="e.g. buyer@eurotrade.de"
                value={currentClient.email || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.address', 'Delivery / Mailing Address')}
              </label>
              <textarea 
                rows={2}
                placeholder={language === 'zh' ? '包含州/省、邮编及详细街道地址...' : 'Complete address including state and zip code...'}
                value={currentClient.address || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, address: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {t('clients.notes', 'Administrative Notes')}
              </label>
              <input 
                type="text" 
                placeholder={language === 'zh' ? '如：偏好 DHL 快递，需要双层托盘包装...' : 'e.g. Prefers DHL express shipments, requires double pallet bindings...'}
                value={currentClient.notes || ''}
                onChange={(e) => setCurrentClient(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setCurrentClient(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              {t('btn.cancel', 'Cancel')}
            </button>
            <button 
              type="submit" 
              className="px-6 py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer"
            >
              {t('clients.save_client', 'Save Client Profile')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
