import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToExcel } from './excel-export';

// The mock sheet and workbook must be set up before vi.mock is hoisted
const mockSheet = {
    columns: [] as any[],
    addRow: vi.fn(),
    getRow: vi.fn().mockReturnValue({
        font: {},
        fill: {}
    })
};

const mockWorkbook = {
    creator: '',
    created: null as Date | null,
    addWorksheet: vi.fn().mockReturnValue(mockSheet),
    xlsx: {
        writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    }
};

// ExcelJS.Workbook is called with `new`, so we need a constructor mock that returns our mockWorkbook
vi.mock('exceljs', () => {
    return {
        default: {
            Workbook: vi.fn().mockImplementation(function () {
                // Copy properties from mockWorkbook into `this`
                Object.assign(this, mockWorkbook);
            })
        }
    };
});

import ExcelJS from 'exceljs';

describe('Excel Export Utility (Browser DOM Sandbox)', () => {
    let mockAnchor: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Re-configure the Workbook constructor each time since clearAllMocks resets it
        vi.mocked(ExcelJS.Workbook).mockImplementation(function (this: any) {
            this.creator = '';
            this.created = null;
            this.addWorksheet = mockWorkbook.addWorksheet;
            this.xlsx = mockWorkbook.xlsx;
        });

        // Reset mock state
        mockWorkbook.creator = '';
        mockWorkbook.created = null;
        mockSheet.addRow.mockReset();
        mockSheet.getRow.mockReset().mockReturnValue({ font: {}, fill: {} });
        mockWorkbook.addWorksheet.mockReset().mockReturnValue(mockSheet);
        mockWorkbook.xlsx.writeBuffer.mockReset().mockResolvedValue(new ArrayBuffer(8));

        // Stub Browser Globals
        mockAnchor = {
            href: '',
            download: '',
            click: vi.fn()
        };

        vi.stubGlobal('document', {
            createElement: vi.fn().mockReturnValue(mockAnchor)
        });

        vi.stubGlobal('window', {
            URL: {
                createObjectURL: vi.fn().mockReturnValue('blob:mock-url-data'),
                revokeObjectURL: vi.fn()
            }
        });

        vi.stubGlobal('Blob', function (content: any, options: any) {
            (this as any).content = content;
            (this as any).options = options;
        });
    });

    it('should orchestrate the full Excel creation and browser download sequence', async () => {
        const mockPurchases = [
            {
                date: '2024-01-01', client_name: 'Client A', ticker: 'TCS',
                rate: 100, qty: 10, comments: 'test', trx_id: '1'
            }
        ];
        const mockSales = [
            {
                date: '2024-01-05', client_name: 'Client A', ticker: 'TCS',
                purchase_date: '2024-01-01', purchase_rate: 100, sale_rate: 120,
                sale_qty: 5, pl: 100, adjusted_pl: 100, comments: 'gain',
                trx_id: '2', custom_id: 'custom-1'
            }
        ];

        await exportToExcel(mockPurchases, mockSales, 'Test_Report');

        // Verify ExcelJS Workbook Instantiation & Properties
        expect(ExcelJS.Workbook).toHaveBeenCalled();

        // Verify Sheet Creation
        expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Purchases');
        expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sales');

        // Verify Row Population (Purchases) - total_cost = rate * qty = 100 * 10 = 1000
        expect(mockSheet.addRow).toHaveBeenCalledWith(expect.objectContaining({
            ticker: 'TCS',
            qty: 10,
            total_cost: 1000
        }));

        // Verify Row Population (Sales) - sale_value = sale_rate * sale_qty = 120 * 5 = 600
        expect(mockSheet.addRow).toHaveBeenCalledWith(expect.objectContaining({
            ticker: 'TCS',
            qty: 5,
            sale_value: 600
        }));

        // Verify Header Font & Styling
        expect(mockSheet.getRow).toHaveBeenCalledWith(1);

        // Verify File Download Trigger
        expect(mockWorkbook.xlsx.writeBuffer).toHaveBeenCalled();
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(mockAnchor.download).toBe('Test_Report.xlsx');
        expect(mockAnchor.href).toBe('blob:mock-url-data');
        expect(mockAnchor.click).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url-data');
    });

    it('should use default filename if none is provided', async () => {
        await exportToExcel([], []);

        expect(mockAnchor.download).toBe('Portfolio_Export.xlsx');
    });

    it('should handle empty purchases and sales gracefully', async () => {
        await exportToExcel([], [], 'Empty_Report');

        expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Purchases');
        expect(mockWorkbook.addWorksheet).toHaveBeenCalledWith('Sales');
        // addRow should not have been called with any purchase/sale data
        expect(mockSheet.addRow).not.toHaveBeenCalled();
        expect(mockAnchor.download).toBe('Empty_Report.xlsx');
    });
});
