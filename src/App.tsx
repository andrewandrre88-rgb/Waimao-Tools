import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ActiveTab, 
  Product, 
  Client, 
  Invoice, 
  PackingList, 
  SampleInvoice, 
  Contract, 
  ProformaInvoice, 
  Quotation, 
  CertificateOfOrigin, 
  ShippingInstruction, 
  CompanySettings as SettingsType, 
  AuthUser, 
  QuotationCalculation 
} from './types';
import { loadAppData, saveAppData, mergeAppData, AppData } from './utils/storage';
import { removeWhiteBackground } from './utils/imageCompressor';
import { getCurrentUser, logoutUser, setCurrentUser as setStoredUser } from './utils/auth';
import { 
  auth, 
  subscribeToUserDataInFirestore, 
  saveUserDataToFirestore, 
  fetchUserDataFromFirestore,
  migrateExistingDataToFirestore,
  logoutFirebase,
  mapFirebaseUserToAuthUser
} from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { NavigationGuardProvider, useNavigationGuard } from './context/NavigationGuardContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import UnsavedChangesModal from './components/UnsavedChangesModal';
import { CloudSyncState } from './components/CloudSyncBadge';

// Component Imports
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductLibrary from './components/ProductLibrary';
import ClientDatabase from './components/ClientDatabase';
import InvoiceGenerator from './components/InvoiceGenerator';
import PackingListGenerator from './components/PackingListGenerator';
import SampleInvoiceGenerator from './components/SampleInvoiceGenerator';
import ContractGenerator from './components/ContractGenerator';
import ProformaGenerator from './components/ProformaGenerator';
import CertificateGenerator from './components/CertificateGenerator';
import ShippingInstructionGenerator from './components/ShippingInstructionGenerator';
import QuotationGenerator from './components/QuotationGenerator';
import QuotationCalculator from './components/QuotationCalculator';
import CbmCalculator from './components/CbmCalculator';
import CompanySettings from './components/CompanySettings';
import AuthPage from './components/AuthPage';

import { 
  LayoutDashboard, 
  FileText, 
  BadgePercent, 
  FolderHeart, 
  Menu 
} from 'lucide-react';

export default function App() {
  return (
    <LanguageProvider>
      <NavigationGuardProvider>
        <AppWorkspace />
      </NavigationGuardProvider>
    </LanguageProvider>
  );
}

function AppWorkspace() {
  const { requestActionWithGuard } = useNavigationGuard();
  const { t, language } = useLanguage();
  const [data, setData] = useState<AppData | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real-time Cloud Firestore Sync state
  const [syncState, setSyncState] = useState<CloudSyncState>({
    status: 'syncing',
    lastSyncedAt: null,
    errorMessage: null,
    userEmail: currentUser?.email || null,
    userId: currentUser?.id || null
  });

  // Track latest data reference to avoid stale closures
  const currentDataRef = useRef<AppData | null>(null);
  useEffect(() => {
    currentDataRef.current = data;
  }, [data]);
  
  // Hook for deep linking from Global Search
  const [searchTarget, setSearchTarget] = useState<{ id: string; type: string } | null>(null);
  
  // Directly open a document in edit/view mode from the Dashboard/unified ledger
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Helper to commit updates to both state and Firestore
  const persistAndSyncData = useCallback((nextData: AppData) => {
    setData(nextData);
    const uid = currentUser?.id;
    saveAppData(nextData, uid);

    if (uid) {
      setSyncState(prev => ({
        ...prev,
        status: 'syncing',
        errorMessage: null
      }));

      saveUserDataToFirestore(uid, nextData)
        .then(() => {
          setSyncState(prev => ({
            ...prev,
            status: 'synced',
            lastSyncedAt: new Date(),
            errorMessage: null,
            userEmail: currentUser?.email || null,
            userId: uid
          }));
        })
        .catch((err: any) => {
          console.warn('Firestore cloud save notification:', err);
          setSyncState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: err?.message || 'Failed to sync with Cloud Firestore.'
          }));
        });
    }
  }, [currentUser?.id, currentUser?.email]);

  // Manual trigger to pull & verify latest data from Cloud Firestore
  const handleManualCloudSync = useCallback(async () => {
    if (!currentUser?.id) return;
    setSyncState(prev => ({ ...prev, status: 'syncing', errorMessage: null }));

    try {
      const cloudData = await fetchUserDataFromFirestore(currentUser.id);
      if (cloudData) {
        setData(cloudData);
        saveAppData(cloudData, currentUser.id);
        setSyncState({
          status: 'synced',
          lastSyncedAt: new Date(),
          errorMessage: null,
          userEmail: currentUser.email || null,
          userId: currentUser.id
        });
      } else if (currentDataRef.current) {
        // Upload current dataset if cloud is blank
        await saveUserDataToFirestore(currentUser.id, currentDataRef.current);
        setSyncState({
          status: 'synced',
          lastSyncedAt: new Date(),
          errorMessage: null,
          userEmail: currentUser.email || null,
          userId: currentUser.id
        });
      }
    } catch (err: any) {
      console.warn('Manual cloud sync failed:', err);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Could not reach Cloud Firestore.'
      }));
    }
  }, [currentUser?.id, currentUser?.email]);

  // Firebase Auth State listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const user = mapFirebaseUserToAuthUser(fbUser);
        setCurrentUser(user);
        setStoredUser(user);
        setSyncState(prev => ({
          ...prev,
          userEmail: user.email,
          userId: user.id
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Primary Data Lifecycle: Cloud Firestore Single Source of Truth + Real-time Listeners
  useEffect(() => {
    const uid = currentUser?.id;
    const initialLocalCache = loadAppData(uid);
    setData(initialLocalCache);

    // Auto-clean signature background if user previously uploaded a raster image with white background
    if (initialLocalCache.settings?.signature && !initialLocalCache.settings.signature.startsWith('data:image/svg+xml') && !initialLocalCache.settings.signature.includes('<svg')) {
      removeWhiteBackground(initialLocalCache.settings.signature, 200).then((cleanedSig) => {
        if (cleanedSig && cleanedSig !== initialLocalCache.settings.signature) {
          setData((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              settings: {
                ...prev.settings,
                signature: cleanedSig
              }
            };
            saveAppData(updated, uid);
            if (uid) {
              saveUserDataToFirestore(uid, updated).catch(() => {});
            }
            return updated;
          });
        }
      }).catch(() => {});
    }

    if (uid) {
      setSyncState(prev => ({ ...prev, status: 'syncing', userEmail: currentUser?.email || null, userId: uid }));

      // 1. Initial Migration & Cloud Fetch: Fetch user document from Firestore
      fetchUserDataFromFirestore(uid)
        .then(async (remoteData) => {
          if (remoteData) {
            // Firestore data is the 100% authoritative single source of truth
            const normalized = mergeAppData(initialLocalCache, remoteData);
            setData(normalized);
            saveAppData(normalized, uid);
            setSyncState({
              status: 'synced',
              lastSyncedAt: new Date(),
              errorMessage: null,
              userEmail: currentUser?.email || null,
              userId: uid
            });
          } else {
            // Firestore is empty for this user: migrate local workspace data to Firestore
            const migrated = await migrateExistingDataToFirestore(uid, initialLocalCache);
            setData(migrated);
            setSyncState({
              status: 'synced',
              lastSyncedAt: new Date(),
              errorMessage: null,
              userEmail: currentUser?.email || null,
              userId: uid
            });
          }
        })
        .catch((err: any) => {
          console.warn('Initial Firestore sync caught gracefully:', err);
          setSyncState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: err?.message || 'Firestore connection issue.'
          }));
        });

      // 2. Real-time Firestore subscription (listening for changes on iPad, Computer, Phone)
      const unsubscribeFirestore = subscribeToUserDataInFirestore(
        uid, 
        (cloudData) => {
          if (cloudData) {
            setData((prev) => {
              const normalized = mergeAppData(prev || initialLocalCache, cloudData);
              saveAppData(normalized, uid);
              return normalized;
            });
            setSyncState(prev => ({
              ...prev,
              status: 'synced',
              lastSyncedAt: new Date(),
              errorMessage: null
            }));
          }
        },
        (err) => {
          console.warn('Firestore real-time listener notification:', err);
          setSyncState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: err?.message || 'Cloud Firestore sync interrupted.'
          }));
        }
      );

      return () => unsubscribeFirestore();
    }
  }, [currentUser?.id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#1565C0] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing MILA Exporter Workspace...</p>
        </div>
      </div>
    );
  }

  // Show Sign In / Sign Up page if user is not logged in
  if (!currentUser) {
    return <AuthPage onAuthSuccess={(user) => {
      setCurrentUser(user);
      setStoredUser(user);
    }} />;
  }

  // State Change & Persistence Handlers (writes directly to Firestore)
  const handleSaveData = (nextData: AppData) => {
    persistAndSyncData(nextData);
  };

  const handleSaveProducts = (nextProducts: Product[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, products: nextProducts };
    persistAndSyncData(nextData);
  };

  const handleSaveClients = (nextClients: Client[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, clients: nextClients };
    persistAndSyncData(nextData);
  };

  const handleSaveInvoices = (nextInvoices: Invoice[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, invoices: nextInvoices };
    persistAndSyncData(nextData);
  };

  const handleSavePackingLists = (nextPackingLists: PackingList[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, packingLists: nextPackingLists };
    persistAndSyncData(nextData);
  };

  const handleSaveSampleInvoices = (nextSampleInvoices: SampleInvoice[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, sampleInvoices: nextSampleInvoices };
    persistAndSyncData(nextData);
  };

  const handleSaveContracts = (nextContracts: Contract[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, contracts: nextContracts };
    persistAndSyncData(nextData);
  };

  const handleSaveProformaInvoices = (nextProformas: ProformaInvoice[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, proformaInvoices: nextProformas };
    persistAndSyncData(nextData);
  };

  const handleSaveQuotations = (nextQuotations: Quotation[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, quotations: nextQuotations };
    persistAndSyncData(nextData);
  };

  const handleSaveQuotationCalculations = (nextCalcs: QuotationCalculation[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, quotationCalculations: nextCalcs };
    persistAndSyncData(nextData);
  };

  const handleSaveCertificatesOfOrigin = (nextCertificates: CertificateOfOrigin[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, certificatesOfOrigin: nextCertificates };
    persistAndSyncData(nextData);
  };

  const handleSaveShippingInstructions = (nextShipping: ShippingInstruction[]) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, shippingInstructions: nextShipping };
    persistAndSyncData(nextData);
  };

  const handleSaveSettings = (nextSettings: SettingsType) => {
    const base = currentDataRef.current || loadAppData(currentUser?.id);
    const nextData = { ...base, settings: nextSettings };
    persistAndSyncData(nextData);
  };

  // Navigation with unsaved changes guard
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    requestActionWithGuard(() => {
      setActiveTab(tab);
    });
  };

  // Quick Action triggers from Dashboard
  const handleCreateNewDocument = (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation') => {
    requestActionWithGuard(() => {
      if (type === 'invoice') {
        setActiveTab('invoice');
        setActiveDocId('new');
      } else if (type === 'packing') {
        setActiveTab('packing');
        setActiveDocId('new');
      } else if (type === 'sample') {
        setActiveTab('sample');
        setActiveDocId('new');
      } else if (type === 'contract') {
        setActiveTab('contract');
        setActiveDocId('new');
      } else if (type === 'quotation') {
        setActiveTab('quotation');
        setActiveDocId('new');
      }
    });
  };

  const handleViewDocument = (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation', id: string) => {
    requestActionWithGuard(() => {
      if (type === 'invoice') {
        setActiveTab('invoice');
        setActiveDocId(id);
      } else if (type === 'packing') {
        setActiveTab('packing');
        setActiveDocId(id);
      } else if (type === 'sample') {
        setActiveTab('sample');
        setActiveDocId(id);
      } else if (type === 'contract') {
        setActiveTab('contract');
        setActiveDocId(id);
      } else if (type === 'quotation') {
        setActiveTab('quotation');
        setActiveDocId(id);
      }
    });
  };

  const handleResetData = () => {
    requestActionWithGuard(() => {
      let approved = false;
      try {
        approved = window.confirm("Are you sure you want to reset all products, clients, invoices, contracts, and settings to default? This will synchronize the reset across your devices.");
      } catch (err) {
        approved = true;
      }
      if (approved) {
        localStorage.removeItem('waimao_tools_data');
        localStorage.removeItem('mila_tools_data');
        if (currentUser?.id) {
          localStorage.removeItem(`waimao_tools_data_${currentUser.id}`);
        }
        window.location.reload();
      }
    });
  };

  const handleLogout = () => {
    requestActionWithGuard(() => {
      logoutFirebase().catch(() => {});
      logoutUser();
      setCurrentUser(null);
      setData(null);
      setSyncState({
        status: 'offline',
        lastSyncedAt: null,
        errorMessage: null,
        userEmail: null,
        userId: null
      });
    }, 'Active Session / Unsaved Workspace Data');
  };

  // Render correct panel based on active Tab
  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            data={data}
            setActiveTab={setActiveTab}
            onCreateNewDocument={handleCreateNewDocument}
            onViewDocument={handleViewDocument}
          />
        );
      case 'invoice':
        return (
          <InvoiceGenerator 
            invoices={data.invoices}
            onSaveInvoices={handleSaveInvoices}
            products={data.products}
            onSaveProducts={handleSaveProducts}
            clients={data.clients}
            onSaveClients={handleSaveClients}
            settings={data.settings}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
            activeDocId={activeDocId}
            clearActiveDoc={() => setActiveDocId(null)}
          />
        );
      case 'packing':
        return (
          <PackingListGenerator 
            packingLists={data.packingLists}
            onSavePackingLists={handleSavePackingLists}
            products={data.products}
            clients={data.clients}
            settings={data.settings}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
            activeDocId={activeDocId}
            clearActiveDoc={() => setActiveDocId(null)}
          />
        );
      case 'sample':
        return (
          <SampleInvoiceGenerator 
            sampleInvoices={data.sampleInvoices}
            onSaveSampleInvoices={handleSaveSampleInvoices}
            products={data.products}
            clients={data.clients}
            settings={data.settings}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
            activeDocId={activeDocId}
            clearActiveDoc={() => setActiveDocId(null)}
          />
        );
      case 'contract':
        return (
          <ContractGenerator 
            contracts={data.contracts || []}
            onSaveContracts={handleSaveContracts}
            products={data.products}
            clients={data.clients}
            onSaveClients={handleSaveClients}
            settings={data.settings}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
            activeDocId={activeDocId}
            clearActiveDoc={() => setActiveDocId(null)}
          />
        );
      case 'proforma':
        return (
          <ProformaGenerator 
            proformaInvoices={data.proformaInvoices || []}
            onSaveProformaInvoices={handleSaveProformaInvoices}
            products={data.products}
            onSaveProducts={handleSaveProducts}
            clients={data.clients}
            onSaveClients={handleSaveClients}
            settings={data.settings}
          />
        );
      case 'quotation_calculator':
        return (
          <QuotationCalculator 
            quotationCalculations={data.quotationCalculations || []}
            onSaveQuotationCalculations={handleSaveQuotationCalculations}
            products={data.products}
            clients={data.clients}
            onSaveClients={handleSaveClients}
            quotations={data.quotations || []}
            onSaveQuotations={handleSaveQuotations}
            proformaInvoices={data.proformaInvoices || []}
            onSaveProformaInvoices={handleSaveProformaInvoices}
            settings={data.settings}
            setActiveTab={setActiveTab}
          />
        );
      case 'quotation':
        return (
          <QuotationGenerator 
            quotations={data.quotations || []}
            onSaveQuotations={handleSaveQuotations}
            products={data.products}
            clients={data.clients}
            onSaveClients={handleSaveClients}
            settings={data.settings}
            proformaInvoices={data.proformaInvoices || []}
            onSaveProformaInvoices={handleSaveProformaInvoices}
            contracts={data.contracts || []}
            onSaveContracts={handleSaveContracts}
            onNavigateToTab={(tab) => setActiveTab(tab as ActiveTab)}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
            activeDocId={activeDocId}
            clearActiveDoc={() => setActiveDocId(null)}
          />
        );
      case 'certificate':
        return (
          <CertificateGenerator 
            certificatesOfOrigin={data.certificatesOfOrigin || []}
            onSaveCertificatesOfOrigin={handleSaveCertificatesOfOrigin}
            products={data.products}
            clients={data.clients}
            settings={data.settings}
          />
        );
      case 'shipping':
        return (
          <ShippingInstructionGenerator 
            shippingInstructions={data.shippingInstructions || []}
            onSaveShippingInstructions={handleSaveShippingInstructions}
            products={data.products}
            clients={data.clients}
            settings={data.settings}
          />
        );
      case 'cbm_calculator':
        return (
          <CbmCalculator 
            products={data.products}
            clients={data.clients}
            invoices={data.invoices}
            onSaveInvoices={handleSaveInvoices}
            packingLists={data.packingLists}
            onSavePackingLists={handleSavePackingLists}
            setActiveTab={setActiveTab}
          />
        );
      case 'products':
        return (
          <ProductLibrary 
            products={data.products}
            onSaveProducts={handleSaveProducts}
            settings={data.settings}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
          />
        );
      case 'clients':
        return (
          <ClientDatabase 
            clients={data.clients}
            onSaveClients={handleSaveClients}
            searchTarget={searchTarget}
            clearSearchTarget={() => setSearchTarget(null)}
          />
        );
      case 'settings':
        return (
          <CompanySettings 
            settings={data.settings}
            onSaveSettings={handleSaveSettings}
            onResetData={handleResetData}
            syncState={syncState}
            onManualSync={handleManualCloudSync}
          />
        );
      default:
        return <Dashboard data={data} setActiveTab={setActiveTab} onCreateNewDocument={handleCreateNewDocument} onViewDocument={handleViewDocument} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex text-slate-900 font-sans antialiased overflow-x-hidden">
      {/* Unsaved Changes Confirmation Modal / Guard Popup */}
      <UnsavedChangesModal />

      {/* Sidebar Frame - Offcanvas on Mobile/Tablet, Pinned on Desktop */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        data={data}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main viewport frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          data={data}
          currentUser={currentUser}
          syncState={syncState}
          onManualSync={handleManualCloudSync}
          onLogout={handleLogout}
          setActiveTab={handleTabChange}
          setSearchTarget={(target) => {
            requestActionWithGuard(() => {
              setSearchTarget(target);
            });
          }}
          setSidebarOpen={setSidebarOpen}
          onCreateNewDocument={handleCreateNewDocument}
        />

        {/* Workspace body with responsive padding (extra bottom padding on mobile for bottom bar) */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {renderActiveComponent()}
        </main>
      </div>

      {/* Phone / Mobile Quick Bottom Bar (visible strictly on small mobile screens < md) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex items-center justify-around md:hidden shadow-lg print:hidden"
        aria-label="Mobile Navigation"
      >
        <button
          type="button"
          onClick={() => handleTabChange('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#1565C0] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard size={20} className={activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.overview', 'Overview')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('invoice')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'invoice' ? 'text-[#1565C0] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={20} className={activeTab === 'invoice' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.invoices', 'Invoices')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('quotation_calculator')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'quotation_calculator' ? 'text-[#1565C0] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BadgePercent size={20} className={activeTab === 'quotation_calculator' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.calculator', 'Calculator')}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('products')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'products' ? 'text-[#1565C0] font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderHeart size={20} className={activeTab === 'products' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.products_short', 'Products')}</span>
        </button>

        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
        >
          <Menu size={20} className="stroke-2" />
          <span className="text-[10px] mt-0.5 tracking-tight">{t('nav.tools_all', 'All Tools')}</span>
        </button>
      </nav>
    </div>
  );
}
