import { useState, useCallback, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { TextInput } from './components/TextInput';
import { QRPreview } from './components/QRPreview';
import { History, type HistoryItem } from './components/History';
import './App.css';

const HISTORY_KEY = 'qr_vector_history';
const MAX_HISTORY = 20;

function App() {
  const [svgData, setSvgData] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistoryItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleSuccess = useCallback((svg: string, text: string) => {
    setSvgData(svg);
    setOriginalText(text);
    setError(null);

    // Update history
    setHistoryItems(prev => {
      // Don't add duplicate text if it's the exact same as the very last item
      if (prev.length > 0 && prev[0].text === text) {
        return prev;
      }

      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        text,
        svgData: svg,
        timestamp: Date.now()
      };

      const updated = [newItem, ...prev].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleError = useCallback((errMsg: string) => {
    setError(errMsg);
    setSvgData(null);
    setOriginalText(null);
  }, []);

  const handleClearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle global paste events (e.g., pasting an image directly)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
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
  }, [handleSuccess, handleError]);

  // Prevent default drag and drop behavior globally
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

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

      <main className="app-main">
        <div className="input-section">
          <div className="input-method">
            <Dropzone onSuccess={handleSuccess} onError={handleError} />
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="input-method">
            <TextInput onSuccess={handleSuccess} onError={handleError} />
          </div>
        </div>

        <div className="output-section">
          <div className="section-header">
            <h2>Result</h2>
          </div>
          <QRPreview
            svgData={svgData}
            originalText={originalText}
            error={error}
            onClearError={handleClearError}
          />
        </div>
      </main>

      <History items={historyItems} />

      <footer className="app-footer">
        <p>Tip: You can paste images directly anywhere on the page (Cmd/Ctrl + V)</p>
      </footer>
    </div>
  );
}

export default App;
