import { useState, useCallback, useEffect, useRef } from 'react';
import { QrCode, AlertTriangle } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { TextInput } from './components/TextInput';
import { QRPreview } from './components/QRPreview';
import { History, type HistoryItem } from './components/History';
import { TabNav, type TabId } from './components/TabNav';
import { VCardForm, type VCardFormHandle } from './components/VCardForm';
import { CompanyGrid } from './components/CompanyGrid';
import { useVCardStorage } from './hooks/useVCardStorage';
import type { CompanyData, VCardHistoryEntry } from './hooks/useVCardStorage';
import './App.css';

const HISTORY_KEY = 'qr_vector_history';
const MAX_HISTORY = 20;

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('qr');

  // --- QR from Image tab state ---
  const [svgData, setSvgData] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // --- vCard tab state ---
  const vcard = useVCardStorage();
  const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [historyRevision, setHistoryRevision] = useState(0);
  const formRef = useRef<VCardFormHandle>(null);

  // --- Unsaved changes dialog ---
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try { setHistoryItems(JSON.parse(saved)); }
      catch (e) { console.error('Failed to parse history', e); }
    }
  }, []);

  const handleSuccess = useCallback((svg: string, text: string) => {
    setSvgData(svg);
    setOriginalText(text);
    setError(null);
    setHistoryItems(prev => {
      if (prev.length > 0 && prev[0].text === text) return prev;
      const newItem: HistoryItem = { id: Math.random().toString(36).substring(2, 9), text, svgData: svg, timestamp: Date.now() };
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleError = useCallback((errMsg: string) => {
    setError(errMsg); setSvgData(null); setOriginalText(null);
  }, []);

  const handleClearError = useCallback(() => setError(null), []);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (activeTab !== 'qr') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            import('./utils/imageParser').then(async ({ parseQRFromImage }) => {
              try {
                const qrText = await parseQRFromImage(file);
                import('./utils/qrUtils').then(async ({ generateSVG }) => {
                  const svg = await generateSVG(qrText);
                  handleSuccess(svg, qrText);
                });
              } catch (err) {
                handleError(err instanceof Error ? err.message : 'Failed to parse pasted image');
              }
            });
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handleSuccess, handleError, activeTab]);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => { window.removeEventListener('dragover', preventDefault); window.removeEventListener('drop', preventDefault); };
  }, []);

  // Guard: if form is dirty, show dialog before executing action
  const guardedAction = (action: () => void) => {
    if (formRef.current?.isDirty()) {
      setPendingAction(() => action);
    } else {
      action();
    }
  };

  const confirmLeave = () => {
    formRef.current?.resetDirty();
    pendingAction?.();
    setPendingAction(null);
  };

  const cancelLeave = () => setPendingAction(null);

  // vCard navigation handlers — all guarded
  const handleSelectCompany = (company: CompanyData) => {
    guardedAction(() => {
      setSelectedCompany(company);
      setEditingCompanyId(null);
      setEditingEntryId(null);
      formRef.current?.loadCompany(company);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleEditCompany = (company: CompanyData) => {
    guardedAction(() => {
      setSelectedCompany(company);
      setEditingCompanyId(company.id);
      setEditingEntryId(null);
      formRef.current?.loadCompany(company);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleNewPerson = (company: CompanyData) => {
    guardedAction(() => {
      setSelectedCompany(company);
      setEditingCompanyId(null);
      setEditingEntryId(null);
      formRef.current?.loadCompany(company);
      formRef.current?.clearIndividual();
      formRef.current?.focusFirstName();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleEditHistoryEntry = (company: CompanyData, entry: VCardHistoryEntry) => {
    guardedAction(() => {
      setSelectedCompany(company);
      setEditingCompanyId(company.id);
      setEditingEntryId(entry.id);
      formRef.current?.loadEntry(company, {
        firstName: entry.firstName,
        lastName: entry.lastName,
        title: entry.title,
        role: entry.role,
        telCell: entry.telCell ?? '',
        telDirect: entry.telDirect ?? '',
        email: entry.email ?? '',
        note: entry.note ?? '',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === activeTab) return;
    guardedAction(() => setActiveTab(tab));
  };

  const handleVCardGenerated = (companyId: string, entry: { firstName: string; lastName: string; title: string; role: string; telCell: string; telDirect: string; email: string; note: string; svgData: string }) => {
    if (!vcard.companies.some(c => c.id === companyId)) return;
    if (editingEntryId) {
      // Update existing entry in-place
      vcard.updateHistoryEntry(companyId, editingEntryId, entry);
    } else {
      vcard.addHistoryEntry(companyId, entry);
    }
    formRef.current?.resetDirty();
    setHistoryRevision(r => r + 1);
  };

  const handleDeleteHistoryEntry = (companyId: string, entryId: string) => {
    vcard.deleteHistoryEntry(companyId, entryId);
    if (editingEntryId === entryId) setEditingEntryId(null);
    setHistoryRevision(r => r + 1);
  };

  const handleSaveCompany = (data: Omit<CompanyData, 'id'>) => {
    const newCompany = vcard.saveCompany(data);
    setSelectedCompany(newCompany);
    setEditingCompanyId(newCompany.id);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-container">
          <div className="icon-bg">
            <QrCode size={28} className="logo-icon" />
          </div>
          <h1>QR to Vector</h1>
        </div>
        <p className="subtitle">Convert any QR code image or text into a crisp, scalable SVG.</p>
      </header>

      <TabNav activeTab={activeTab} onChange={handleTabChange} />

      {activeTab === 'qr' && (
        <>
          <main className="app-main">
            <div className="input-section">
              <div className="input-method">
                <Dropzone onSuccess={handleSuccess} onError={handleError} />
              </div>
              <div className="divider"><span>or</span></div>
              <div className="input-method">
                <TextInput onSuccess={handleSuccess} onError={handleError} />
              </div>
            </div>
            <div className="output-section">
              <div className="section-header"><h2>Result</h2></div>
              <QRPreview svgData={svgData} originalText={originalText} error={error} onClearError={handleClearError} />
            </div>
          </main>
          <History items={historyItems} />
        </>
      )}

      {activeTab === 'vcard' && (
        <>
          <VCardForm
            ref={formRef}
            initialCompany={selectedCompany}
            onSaveCompany={handleSaveCompany}
            onUpdateCompany={vcard.updateCompany}
            onGenerated={handleVCardGenerated}
            editingCompanyId={editingCompanyId}
            editingEntryId={editingEntryId}
          />
          <CompanyGrid
            companies={vcard.companies}
            getHistory={vcard.getHistory}
            historyRevision={historyRevision}
            onSelect={handleSelectCompany}
            onEdit={handleEditCompany}
            onDelete={vcard.deleteCompany}
            onNewPerson={handleNewPerson}
            onEditHistoryEntry={handleEditHistoryEntry}
            onDeleteHistoryEntry={handleDeleteHistoryEntry}
          />
        </>
      )}

      {/* Unsaved changes dialog */}
      {pendingAction && (
        <div className="dialog-overlay">
          <div className="dialog">
            <div className="dialog-icon"><AlertTriangle size={24} /></div>
            <h3>Unsaved Changes</h3>
            <p>If you leave now, your current vCard progress will be lost.</p>
            <div className="dialog-actions">
              <button className="dialog-btn cancel" onClick={cancelLeave}>Stay</button>
              <button className="dialog-btn confirm" onClick={confirmLeave}>Leave anyway</button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <p>Tip: You can paste images directly anywhere on the page (Cmd/Ctrl + V)</p>
      </footer>
    </div>
  );
}

export default App;
