import { SupabaseClient } from '@supabase/supabase-js';

// --- Interfaces ---
export interface CsvRow {
    dp_id: string;
    client_name: string;
    ticker: string;
    isin: string;
    stock_name: string;
    holding_type: 'PLEDGE' | 'BENEFICIARY' | string;
    balance: number;
}

export interface VerificationResult {
    status: 'MATCH' | 'MISMATCH' | 'NOT_FOUND';
    db_client_name: string;
    last_verified?: string;
    discrepancies: DiscrepancyRow[];
}

export interface DiscrepancyRow {
    client_name: string;
    dp_id: string;
    isin: string;
    stock_name: string;
    ticker: string;
    dp_balance: number;
    web_balance: number;
    difference: number;
}

// --- Logic functions ---

/**
 * Parses the CSV text and returns an array of CsvRow
 */
export const parseVerificationCsv = (text: string): CsvRow[] => {
    const lines = text.split(/\r?\n/);
    const parsedData: CsvRow[] = [];
    let currentClientId = "";

    const isinRegex = /^[A-Z]{2}[A-Z0-9]{10}/;

    lines.forEach((line) => {
        const trimmed = line.trim();

        // 1. Detect Client ID row
        if (trimmed.includes('Client Id.')) {
            const idMatch = trimmed.match(/Client Id\.\s*([\w\d]+)/);
            if (idMatch) currentClientId = idMatch[1];
            return;
        }

        // 2. Detect ISIN Row (The actual data)
        if (isinRegex.test(trimmed)) {
            const cols = trimmed.split(',').map(c => c.trim());

            if (cols.length >= 4) {
                const rawName = cols[1] || "Unknown Stock";
                parsedData.push({
                    dp_id: currentClientId,
                    client_name: "",
                    ticker: rawName,
                    isin: cols[0],
                    stock_name: rawName,
                    holding_type: cols[2].toUpperCase(),
                    balance: parseFloat(cols[3].replace(/,/g, '')) || 0
                });
            }
        }
    });

    return parsedData.filter(r => r.dp_id !== "");
};

/**
 * Groups CSV data by DP ID
 */
export const groupCsvByDpId = (data: CsvRow[]): Map<string, CsvRow[]> => {
    const csvMap = new Map<string, CsvRow[]>();
    data.forEach(row => {
        if (!csvMap.has(row.dp_id)) csvMap.set(row.dp_id, []);
        csvMap.get(row.dp_id)?.push(row);
    });
    return csvMap;
};

/**
 * Aggregates holdings from CSV rows
 */
export const aggregateCsvHoldings = (rows: CsvRow[]): Map<string, { total: number, pledged: number }> => {
    const holdings = new Map<string, { total: number, pledged: number }>();
    rows.forEach(r => {
        const existing = holdings.get(r.isin) || { total: 0, pledged: 0 };
        existing.total += r.balance;
        if (r.holding_type === "PLEDGE") {
            existing.pledged += r.balance;
        }
        holdings.set(r.isin, existing);
    });
    return holdings;
};
