import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Building2, User, Save, QrCode, Check } from 'lucide-react';
import type { CompanyData } from '../hooks/useVCardStorage';
import { buildVCard } from '../utils/vcardUtils';
import { generateSVG } from '../utils/qrUtils';
import { QRPreview } from './QRPreview';
import './VCardForm.css';

interface VCardFormProps {
    initialCompany?: CompanyData | null;
    onSaveCompany: (data: Omit<CompanyData, 'id'>) => void;
    onUpdateCompany?: (id: string, data: Omit<CompanyData, 'id'>) => void;
    onGenerated: (companyId: string, entry: { firstName: string; lastName: string; title: string; role: string; telCell: string; telDirect: string; email: string; note: string; svgData: string }) => void;
    editingCompanyId?: string | null;
    editingEntryId?: string | null;
}

export interface VCardFormHandle {
    loadCompany: (company: CompanyData) => void;
    loadEntry: (company: CompanyData, individual: typeof emptyIndividual) => void;
    clearIndividual: () => void;
    focusFirstName: () => void;
    isDirty: () => boolean;
    resetDirty: () => void;
}

type FieldError = Partial<Record<string, string>>;

const emptyIndividual = { firstName: '', lastName: '', title: '', role: '', telCell: '', telDirect: '', email: '', note: '' };
const emptyCompany = { org: '', telWork: '', adr: '', url: '' };

export const VCardForm = forwardRef<VCardFormHandle, VCardFormProps>(
    ({ initialCompany, onSaveCompany, onUpdateCompany, onGenerated, editingCompanyId, editingEntryId }, ref) => {
        const [company, setCompany] = useState(emptyCompany);
        const [individual, setIndividual] = useState(emptyIndividual);
        const [savedFlash, setSavedFlash] = useState(false);
        const [errors, setErrors] = useState<FieldError>({});
        const [svgData, setSvgData] = useState<string | null>(null);
        const [qrError, setQrError] = useState<string | null>(null);
        const [isGenerating, setIsGenerating] = useState(false);
        const firstNameRef = useRef<HTMLInputElement>(null);
        const dirtyRef = useRef(false);

        useEffect(() => {
            if (initialCompany) {
                setCompany({
                    org: initialCompany.name,
                    telWork: initialCompany.phone,
                    adr: initialCompany.address,
                    url: initialCompany.website,
                });
                setIndividual(emptyIndividual);
            }
        }, [initialCompany]);

        useImperativeHandle(ref, () => ({
            loadCompany(c: CompanyData) {
                setCompany({ org: c.name, telWork: c.phone, adr: c.address, url: c.website });
                setIndividual(emptyIndividual);
                dirtyRef.current = false;
            },
            loadEntry(c: CompanyData, ind: typeof emptyIndividual) {
                setCompany({ org: c.name, telWork: c.phone, adr: c.address, url: c.website });
                setIndividual(ind);
                dirtyRef.current = false;
            },
            clearIndividual() {
                setIndividual(emptyIndividual);
                dirtyRef.current = false;
            },
            focusFirstName() {
                setTimeout(() => firstNameRef.current?.focus(), 50);
            },
            isDirty() { return dirtyRef.current; },
            resetDirty() { dirtyRef.current = false; },
        }));

        const validate = () => {
            const errs: FieldError = {};
            if (!company.org.trim()) errs.org = 'Company name is required';
            const fn = individual.firstName.trim() || individual.lastName.trim();
            if (!fn) errs.name = 'Full name is required';
            if (!individual.telCell.trim() && !individual.telDirect.trim() && !company.telWork.trim() && !individual.email.trim()) {
                errs.contact = 'At least one phone number or email is required';
            }
            setErrors(errs);
            return Object.keys(errs).length === 0;
        };

        const handleSaveCompany = () => {
            if (!company.org.trim()) {
                setErrors({ org: 'Company name is required' });
                return;
            }
            const data = { name: company.org, phone: company.telWork, address: company.adr, website: company.url };
            if (editingCompanyId && onUpdateCompany) {
                onUpdateCompany(editingCompanyId, data);
            } else {
                onSaveCompany(data);
            }
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2000);
        };

        const handleGenerate = async () => {
            if (!validate()) return;
            setIsGenerating(true);
            setQrError(null);
            try {
                const vcardStr = buildVCard({ ...company, ...individual });
                const svg = await generateSVG(vcardStr);
                setSvgData(svg);
                onGenerated(editingCompanyId || '_unsaved', {
                    firstName: individual.firstName,
                    lastName: individual.lastName,
                    title: individual.title,
                    role: individual.role,
                    telCell: individual.telCell,
                    telDirect: individual.telDirect,
                    email: individual.email,
                    note: individual.note,
                    svgData: svg,
                });
            } catch {
                setQrError('Failed to generate QR code');
            } finally {
                setIsGenerating(false);
            }
        };

        const setC = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            dirtyRef.current = true;
            setCompany(prev => ({ ...prev, [field]: e.target.value }));
            if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        };

        const setI = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            dirtyRef.current = true;
            setIndividual(prev => ({ ...prev, [field]: e.target.value }));
            if (errors.name || errors.contact) setErrors(prev => { const n = { ...prev }; delete n.name; delete n.contact; return n; });
        };

        return (
            <div className="vcard-form-wrapper">
                <div className="vcard-form">
                    {/* Company fields */}
                    <div className="form-group company-group">
                        <div className="group-header">
                            <Building2 size={16} />
                            <span>Company</span>
                            <span className="group-tag">Template · saved per company</span>
                        </div>
                        <div className="form-grid">
                            <div className={`form-field ${errors.org ? 'has-error' : ''}`}>
                                <label>Company Name *</label>
                                <input value={company.org} onChange={setC('org')} placeholder="Acme SRL" />
                                {errors.org && <span className="field-error">{errors.org}</span>}
                            </div>
                            <div className="form-field">
                                <label>Company Phone</label>
                                <input value={company.telWork} onChange={setC('telWork')} placeholder="+40221000000" />
                            </div>
                            <div className="form-field full-width">
                                <label>Address</label>
                                <input value={company.adr} onChange={setC('adr')} placeholder="Str. Exemplu 1, București, 010000" />
                            </div>
                            <div className="form-field full-width">
                                <label>Website</label>
                                <input value={company.url} onChange={setC('url')} placeholder="https://acme.ro" />
                            </div>
                        </div>
                        <div className="group-actions">
                            <button className={`action-btn ${savedFlash ? 'success' : 'secondary'}`} onClick={handleSaveCompany}>
                                {savedFlash ? <><Check size={16} /><span>Saved!</span></> : <><Save size={16} /><span>{editingCompanyId ? 'Update Company' : 'Save Company'}</span></>}
                            </button>
                        </div>
                    </div>

                    {/* Individual fields */}
                    <div className="form-group individual-group">
                        <div className="group-header">
                            <User size={16} />
                            <span>Individual</span>
                            <span className="group-tag">Per person · not saved in template</span>
                        </div>
                        <div className="form-grid">
                            <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
                                <label>First Name *</label>
                                <input ref={firstNameRef} value={individual.firstName} onChange={setI('firstName')} placeholder="John" />
                            </div>
                            <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
                                <label>Last Name *</label>
                                <input value={individual.lastName} onChange={setI('lastName')} placeholder="Doe" />
                                {errors.name && <span className="field-error">{errors.name}</span>}
                            </div>
                            <div className="form-field">
                                <label>Job Title</label>
                                <input value={individual.title} onChange={setI('title')} placeholder="Sales Manager" />
                            </div>
                            <div className="form-field">
                                <label>Role / Department</label>
                                <input value={individual.role} onChange={setI('role')} placeholder="Sales" />
                            </div>
                            <div className={`form-field ${errors.contact ? 'has-error' : ''}`}>
                                <label>Mobile Phone</label>
                                <input value={individual.telCell} onChange={setI('telCell')} placeholder="+40721000000" />
                            </div>
                            <div className="form-field">
                                <label>Direct Line</label>
                                <input value={individual.telDirect} onChange={setI('telDirect')} placeholder="+40221000001" />
                            </div>
                            <div className={`form-field full-width ${errors.contact ? 'has-error' : ''}`}>
                                <label>Email</label>
                                <input value={individual.email} onChange={setI('email')} placeholder="john.doe@acme.ro" />
                                {errors.contact && <span className="field-error">{errors.contact}</span>}
                            </div>
                            <div className="form-field full-width">
                                <label>Notes (optional)</label>
                                <textarea value={individual.note} onChange={setI('note')} placeholder="Optional note..." rows={2} />
                            </div>
                        </div>
                        <div className="group-actions">
                            <button className="action-btn primary" onClick={handleGenerate} disabled={isGenerating}>
                                <QrCode size={16} />
                                <span>{isGenerating ? (editingEntryId ? 'Updating…' : 'Generating…') : (editingEntryId ? 'Update vCard' : 'Generate vCard QR')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Result panel */}
                <div className="vcard-result">
                    <div className="section-header">
                        <h2>Result</h2>
                    </div>
                    <QRPreview
                        svgData={svgData}
                        originalText={svgData ? `${individual.firstName} ${individual.lastName} — ${company.org}`.trim() : null}
                        error={qrError}
                        onClearError={() => setQrError(null)}
                    />
                </div>
            </div>
        );
    }
);

VCardForm.displayName = 'VCardForm';
