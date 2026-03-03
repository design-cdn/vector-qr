import React from 'react';
import { Copy, Download, Link2 } from 'lucide-react';
import './History.css';

export interface HistoryItem {
    id: string;
    text: string;
    svgData: string;
    timestamp: number;
}

interface HistoryProps {
    items: HistoryItem[];
}

export const History: React.FC<HistoryProps> = ({ items }) => {
    if (items.length === 0) return null;

    const handleCopy = async (svgData: string) => {
        try {
            await navigator.clipboard.writeText(svgData);
            // Optional: Show a brief "Copied" toast, but simple works fine for now
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const handleDownload = (svgData: string, id: string) => {
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode-${id}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="history-section">
            <div className="section-header">
                <h2>Recent Generations</h2>
            </div>
            <div className="history-list">
                {items.map((item) => (
                    <div key={item.id} className="history-item">
                        <div
                            className="history-thumb"
                            dangerouslySetInnerHTML={{ __html: item.svgData }}
                        />
                        <div className="history-info">
                            <div className="history-text" title={item.text}>
                                <Link2 size={14} />
                                <span>{item.text}</span>
                            </div>
                            <div className="history-date">
                                {new Date(item.timestamp).toLocaleString()}
                            </div>
                        </div>
                        <div className="history-actions">
                            <button
                                className="icon-btn"
                                onClick={() => handleCopy(item.svgData)}
                                title="Copy SVG"
                            >
                                <Copy size={16} />
                            </button>
                            <button
                                className="icon-btn"
                                onClick={() => handleDownload(item.svgData, item.id)}
                                title="Download SVG"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
