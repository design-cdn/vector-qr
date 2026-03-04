export interface VCardFields {
    // Individual
    firstName: string;
    lastName: string;
    title: string;
    role: string;
    telCell: string;
    telDirect: string;
    email: string;
    note: string;
    // Company
    org: string;
    telWork: string;
    adr: string;
    url: string;
}

export function buildVCard(fields: VCardFields): string {
    const fn = [fields.firstName, fields.lastName].filter(Boolean).join(' ');
    const n = `${fields.lastName || ''};${fields.firstName || ''};;;`;

    const lines: string[] = [
        'BEGIN:VCARD',
        'VERSION:3.0',
    ];

    if (fn) lines.push(`FN:${fn}`);
    if (fields.firstName || fields.lastName) lines.push(`N:${n}`);
    if (fields.org) lines.push(`ORG:${fields.org}`);
    if (fields.title) lines.push(`TITLE:${fields.title}`);
    if (fields.role) lines.push(`ROLE:${fields.role}`);
    if (fields.telCell) lines.push(`TEL;TYPE=CELL:${fields.telCell}`);
    if (fields.telWork) lines.push(`TEL;TYPE=WORK:${fields.telWork}`);
    if (fields.telDirect) lines.push(`TEL;TYPE=WORK:${fields.telDirect}`);
    if (fields.email) lines.push(`EMAIL:${fields.email}`);
    if (fields.adr) lines.push(`ADR;TYPE=WORK:;;${fields.adr};;;;`);
    if (fields.url) lines.push(`URL:${fields.url}`);
    if (fields.note) lines.push(`NOTE:${fields.note}`);

    lines.push('END:VCARD');
    return lines.join('\r\n');
}
