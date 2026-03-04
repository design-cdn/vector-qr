import { useState, useEffect, useCallback } from 'react';

export interface CompanyData {
    id: string;
    name: string;
    address: string;
    website: string;
    phone: string;
}

export interface VCardHistoryEntry {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    title: string;
    role: string;
    telCell: string;
    telDirect: string;
    email: string;
    note: string;
    svgData: string;
    timestamp: number;
}

const COMPANIES_KEY = 'vcard_companies';
const MAX_HISTORY = 20;

function historyKey(companyId: string) {
    return `vcard_history_${companyId}`;
}

function loadJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function saveJSON<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function useVCardStorage() {
    const [companies, setCompanies] = useState<CompanyData[]>(() =>
        loadJSON<CompanyData[]>(COMPANIES_KEY, [])
    );

    // Persist companies whenever they change
    useEffect(() => {
        saveJSON(COMPANIES_KEY, companies);
    }, [companies]);

    const saveCompany = useCallback((data: Omit<CompanyData, 'id'>) => {
        const newCompany: CompanyData = {
            id: Math.random().toString(36).substring(2, 9),
            ...data,
        };
        setCompanies(prev => [newCompany, ...prev]);
        return newCompany;
    }, []);

    const updateCompany = useCallback((id: string, data: Omit<CompanyData, 'id'>) => {
        setCompanies(prev =>
            prev.map(c => (c.id === id ? { ...c, ...data } : c))
        );
    }, []);

    const deleteCompany = useCallback((id: string) => {
        setCompanies(prev => prev.filter(c => c.id !== id));
        // Clean up history for this company
        localStorage.removeItem(historyKey(id));
    }, []);

    const getHistory = useCallback((companyId: string): VCardHistoryEntry[] => {
        return loadJSON<VCardHistoryEntry[]>(historyKey(companyId), []);
    }, []);

    const addHistoryEntry = useCallback(
        (companyId: string, entry: Omit<VCardHistoryEntry, 'id' | 'companyId' | 'timestamp'>) => {
            const existing = loadJSON<VCardHistoryEntry[]>(historyKey(companyId), []);
            const newEntry: VCardHistoryEntry = {
                id: Math.random().toString(36).substring(2, 9),
                companyId,
                timestamp: Date.now(),
                ...entry,
            };
            const updated = [newEntry, ...existing].slice(0, MAX_HISTORY);
            saveJSON(historyKey(companyId), updated);
            return newEntry;
        },
        []
    );

    const deleteHistoryEntry = useCallback((companyId: string, entryId: string) => {
        const existing = loadJSON<VCardHistoryEntry[]>(historyKey(companyId), []);
        const updated = existing.filter(e => e.id !== entryId);
        saveJSON(historyKey(companyId), updated);
    }, []);

    const updateHistoryEntry = useCallback(
        (companyId: string, entryId: string, data: Omit<VCardHistoryEntry, 'id' | 'companyId' | 'timestamp'>) => {
            const existing = loadJSON<VCardHistoryEntry[]>(historyKey(companyId), []);
            const updated = existing.map(e =>
                e.id === entryId ? { ...e, ...data, timestamp: Date.now() } : e
            );
            saveJSON(historyKey(companyId), updated);
        },
        []
    );

    return {
        companies,
        saveCompany,
        updateCompany,
        deleteCompany,
        getHistory,
        addHistoryEntry,
        updateHistoryEntry,
        deleteHistoryEntry,
    };
}
