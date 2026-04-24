/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScamRecord {
  id: string;
  type: 'BANK_ACCOUNT' | 'PHONE_NUMBER';
  value: string;
  bankName?: string;
  reportCount: number;
  lastReported: string;
  status: 'FLAGGED' | 'CLEAN' | 'SUSPICIOUS';
  category: string;
  context: string;
}

// Mock dataset simulating PDRM Semak Mule
const SCAM_DATABASE: ScamRecord[] = [
  {
    id: '1',
    type: 'BANK_ACCOUNT',
    value: '1234567890',
    bankName: 'Maybank',
    reportCount: 45,
    lastReported: '2024-03-20',
    status: 'FLAGGED',
    category: 'E-Commerce Scam',
    context: 'Multiple reports of non-delivery for electronics purchased via social media.'
  },
  {
    id: '2',
    type: 'PHONE_NUMBER',
    value: '0123456789',
    reportCount: 12,
    lastReported: '2024-03-15',
    status: 'SUSPICIOUS',
    category: 'Impersonation (PDRM/LHDN)',
    context: 'Caller claims to be from PDRM Bukit Aman regarding "illegal parcels".'
  },
  {
    id: '3',
    type: 'BANK_ACCOUNT',
    value: '9876543210',
    bankName: 'CIMB Bank',
    reportCount: 156,
    lastReported: '2024-03-22',
    status: 'FLAGGED',
    category: 'Investment Scam',
    context: 'Linked to fake "Gold Investment" schemes promising 300% returns.'
  },
  {
    id: '4',
    type: 'PHONE_NUMBER',
    value: '01122334455',
    reportCount: 8,
    lastReported: '2024-03-10',
    status: 'FLAGGED',
    category: 'Job Scam',
    context: 'Recruitment scam targeting students for "online data entry" jobs.'
  }
];

export async function checkScam(value: string): Promise<ScamRecord | null> {
  // Normalize input (remove spaces, dashes)
  const cleanValue = value.replace(/[\s-]/g, '');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const match = SCAM_DATABASE.find(record => record.value === cleanValue);
  
  return match || null;
}
