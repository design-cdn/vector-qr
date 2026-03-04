import React from 'react';
import './TabNav.css';

export type TabId = 'qr' | 'vcard';

interface TabNavProps {
    activeTab: TabId;
    onChange: (tab: TabId) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onChange }) => {
    return (
        <div className="tab-nav">
            <button
                className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
                onClick={() => onChange('qr')}
            >
                QR from Image
            </button>
            <button
                className={`tab-btn ${activeTab === 'vcard' ? 'active' : ''}`}
                onClick={() => onChange('vcard')}
            >
                vCard Generator
            </button>
        </div>
    );
};
