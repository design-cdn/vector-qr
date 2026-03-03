import React, { useState, useEffect } from 'react';
import { Copy, Download, Check, AlertCircle } from 'lucide-react';
import './QRPreview.css';

interface QRPreviewProps {
    svgData: string | null;
    originalText: string | null;
    error: string | null;
    onClearError: () => void;
}

export const QRPreview: React.FC<QRPreviewProps> = ({ svgData, originalText, error, onClearError }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                onClearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, onClearError]);

    const handleCopy = async () => {
        if (!svgData) return;
        try {
            await navigator.clipboard.writeText(svgData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownload = () => {
        if (!svgData) return;
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="preview-section">
            {error && (
                <div className="error-banner">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {svgData ? (
                <div className="qr-result-container fade-in">
                    <div className="qr-display-box">
                        <div
                            className="svg-container"
                            dangerouslySetInnerHTML={{ __html: svgData }}
                        />
                        {originalText && (
                            <div className="qr-text" title={originalText}>
                                {originalText}
                            </div>
                        )}
                    </div>

                    <div className="actions-panel">
                        <button
                            className={`action-btn ${copied ? 'success' : 'primary'}`}
                            onClick={handleCopy}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            <span>{copied ? 'Copied SVG' : 'Copy SVG'}</span>
                        </button>
                        <button className="action-btn secondary" onClick={handleDownload}>
                            <Download size={18} />
                            <span>Download SVG</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <p>Your SVG vector QR code will appear here</p>
                </div>
            )}
        </div>
    );
};
