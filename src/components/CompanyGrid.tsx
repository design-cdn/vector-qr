import React, { useState } from 'react';
import { Building2, Pencil, Trash2, ChevronDown, ChevronUp, Copy, Download, Plus, X, Check } from 'lucide-react';
import type { CompanyData, VCardHistoryEntry } from '../hooks/useVCardStorage';
import './CompanyGrid.css';

interface CompanyGridProps {
    companies: CompanyData[];
    getHistory: (companyId: string) => VCardHistoryEntry[];
    historyRevision: number; // bumped on add/delete to trigger re-render
    onSelect: (company: CompanyData) => void;
    onEdit: (company: CompanyData) => void;
    onDelete: (companyId: string) => void;
    onNewPerson: (company: CompanyData) => void;
    onEditHistoryEntry: (company: CompanyData, entry: VCardHistoryEntry) => void;
    onDeleteHistoryEntry: (companyId: string, entryId: string) => void;
}

export const CompanyGrid: React.FC<CompanyGridProps> = ({
    companies,
    getHistory,
    historyRevision: _historyRevision, // consumed to ensure re-render
    onSelect,
    onEdit,
    onDelete,
    onNewPerson,
    onEditHistoryEntry,
    onDeleteHistoryEntry,
}) => {
    const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());
    const [confirmDeleteCompany, setConfirmDeleteCompany] = useState<string | null>(null);
    const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<string | null>(null);
    const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);

    if (companies.length === 0) return null;

    const toggleAccordion = (id: string) => {
        setOpenAccordions(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleCopy = async (svgData: string, entryId: string) => {
        try {
            await navigator.clipboard.writeText(svgData);
            setCopiedEntryId(entryId);
            setTimeout(() => setCopiedEntryId(null), 2000);
        } catch { /* noop */ }
    };

    const handleDownload = (svgData: string, name: string) => {
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vcard-${name.replace(/\s+/g, '-').toLowerCase()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="company-grid-section">
            <div className="section-header">
                <h2>Saved Companies</h2>
            </div>
            <div className="company-grid">
                {companies.map(company => {
                    const history = getHistory(company.id);
                    const isOpen = openAccordions.has(company.id);
                    const isConfirmingCompany = confirmDeleteCompany === company.id;

                    return (
                        <div key={company.id} className="company-card-wrapper">
                            <div
                                className="company-card"
                                onClick={() => onSelect(company)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && onSelect(company)}
                            >
                                <div className="company-card-icon">
                                    <Building2 size={24} />
                                </div>
                                <div className="company-card-info">
                                    <span className="company-name">{company.name}</span>
                                    {company.phone && <span className="company-meta">{company.phone}</span>}
                                </div>
                                <div className="company-card-actions" onClick={e => e.stopPropagation()}>
                                    <button className="icon-btn" onClick={() => onEdit(company)} title="Edit company">
                                        <Pencil size={15} />
                                    </button>
                                    {isConfirmingCompany ? (
                                        <div className="confirm-delete">
                                            <span>Delete?</span>
                                            <button className="icon-btn danger" onClick={() => { onDelete(company.id); setConfirmDeleteCompany(null); }}>
                                                <Trash2 size={14} />
                                            </button>
                                            <button className="icon-btn" onClick={() => setConfirmDeleteCompany(null)}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button className="icon-btn" onClick={() => setConfirmDeleteCompany(company.id)} title="Delete company">
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                    <button
                                        className={`icon-btn accordion-toggle ${isOpen ? 'open' : ''}`}
                                        onClick={() => toggleAccordion(company.id)}
                                        title="Show history"
                                    >
                                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Accordion */}
                            {isOpen && (
                                <div className="accordion">
                                    {history.length === 0 ? (
                                        <p className="accordion-empty">No vCards generated yet for this company.</p>
                                    ) : (
                                        <div className="accordion-list">
                                            {history.map(entry => {
                                                const fullName = [entry.firstName, entry.lastName].filter(Boolean).join(' ');
                                                const isConfirmingEntry = confirmDeleteEntry === entry.id;
                                                const isCopied = copiedEntryId === entry.id;
                                                return (
                                                    <div key={entry.id} className="accordion-entry">
                                                        <div
                                                            className="accordion-thumb"
                                                            dangerouslySetInnerHTML={{ __html: entry.svgData }}
                                                        />
                                                        <div className="accordion-info">
                                                            <span className="accordion-name">{fullName || '—'}</span>
                                                            {(entry.title || entry.role) && (
                                                                <span className="accordion-meta">
                                                                    {[entry.title, entry.role].filter(Boolean).join(' · ')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="accordion-actions">
                                                            <button className="icon-btn" onClick={() => onEditHistoryEntry(company, entry)} title="Edit this person">
                                                                <Pencil size={14} />
                                                            </button>
                                                            <div className="copy-action">
                                                                <button
                                                                    className={`icon-btn ${isCopied ? 'copied' : ''}`}
                                                                    onClick={() => handleCopy(entry.svgData, entry.id)}
                                                                    title="Copy SVG"
                                                                >
                                                                    {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                                                </button>
                                                                {isCopied && <span className="copy-feedback">Copied!</span>}
                                                            </div>
                                                            <button className="icon-btn" onClick={() => handleDownload(entry.svgData, fullName || company.name)} title="Download SVG">
                                                                <Download size={14} />
                                                            </button>
                                                            {isConfirmingEntry ? (
                                                                <div className="confirm-delete-entry">
                                                                    <button className="icon-btn danger" onClick={() => { onDeleteHistoryEntry(company.id, entry.id); setConfirmDeleteEntry(null); }}>
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                    <button className="icon-btn" onClick={() => setConfirmDeleteEntry(null)}>
                                                                        <X size={13} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button className="icon-btn" onClick={() => setConfirmDeleteEntry(entry.id)} title="Delete entry">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <button className="new-person-btn" onClick={() => onNewPerson(company)}>
                                        <Plus size={15} />
                                        <span>New Person</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
