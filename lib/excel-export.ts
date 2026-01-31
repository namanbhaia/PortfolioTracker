import ExcelJS from 'exceljs';

export const exportToExcel = async (purchases: any[], sales: any[], fileName: string = 'Portfolio_Export') => {
    const workbook = new ExcelJS.Workbook();
    
    workbook.creator = 'MLB Portfolio Tracker';
    workbook.created = new Date();

    // --- SHEET 1: PURCHASES ---
    const sheetPurchases = workbook.addWorksheet('Purchases');
    
    // Define Headers
    sheetPurchases.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Client', key: 'client_name', width: 15 },
        { header: 'DP_Id', key: 'dp_id', width: 15 },
        { header: 'Trading_Id', key: 'trading_id', width: 15 },
        { header: 'Ticker', key: 'ticker', width: 15 },
        { header: 'Stock Name', key: 'stock_name', width: 25 }, // If available in data
        { header: 'Buy Rate (₹)', key: 'rate', width: 15 },
        { header: 'Quantity', key: 'qty', width: 10 },
        { header: 'Total Cost (₹)', key: 'total_cost', width: 18 },
        { header: 'Comments', key: 'comments', width: 30 },
        { header: 'Transaction ID', key: 'trx_id', width: 36 },
    ];

    // Add Rows
    purchases.forEach(p => {
        sheetPurchases.addRow({
            date: p.date,
            client_name: p.client_name,
            // Safe check: handles if data is at root (p.dp_id) or nested from a join (p.clients.dp_id)
            dp_id: p.dp_id || p.clients?.dp_id || '-',
            trading_id: p.trading_id || p.clients?.trading_id || '-',
            ticker: p.ticker,
            stock_name: p.stock_name || '-', 
            rate: p.rate,
            qty: p.qty,
            total_cost: p.rate * p.qty,
            comments: p.comments,
            trx_id: p.trx_id
        });
    });

    // Style the Header Row (Bold + Gray Background)
    sheetPurchases.getRow(1).font = { bold: true };
    sheetPurchases.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' }
    };

    // --- SHEET 2: SALES ---
    const sheetSales = workbook.addWorksheet('Sales');
    
    sheetSales.columns = [
        { header: 'Sale Date', key: 'date', width: 15 },
        { header: 'Client', key: 'client_name', width: 15 },
        { header: 'DP_Id', key: 'dp_id', width: 15 },
        { header: 'Trading_Id', key: 'trading_id', width: 15 },
        { header: 'Ticker', key: 'ticker', width: 15 }, // Assuming your join provides this
        { header: 'Stock Name', key: 'stock_name', width: 25 }, // If available in data
        { header: 'Purchase Date', key: 'purchase_date', width: 15 },
        { header: 'Purchase Rate (₹)', key: 'purchase_rate', width: 15 },
        { header: 'Sale Rate (₹)', key: 'rate', width: 15 },
        { header: 'Sold Qty', key: 'qty', width: 10 },
        { header: 'Sale Value (₹)', key: 'sale_value', width: 18 },
        { header: 'Long Term', key: 'long_term', width: 18 },
        { header: 'Profit', key: 'pl', width: 18 },
        { header: 'Taxable Profit', key: 'adjusted_pl', width: 18 },
        { header: 'Comments', key: 'comments', width: 30 },
        { header: 'Purchase Ref ID', key: 'purchase_trx_id', width: 36 },
        { header: 'Custom ID', key: 'custom_id', width: 18 },
        { header: 'Transaction ID', key: 'trx_id', width: 36 },
    ];

    sales.forEach(s => {
        sheetSales.addRow({
            // 'sale_date' is from sales_view, 'date' is from raw table fallback
            date: s.sale_date || s.date, 
            client_name: s.client_name,
            
            // Handles if data is at root or nested via join
            dp_id: s.dp_id || s.clients?.dp_id || '-',
            trading_id: s.trading_id || s.clients?.trading_id || '-',
            
            ticker: s.ticker || '-',
            stock_name: s.stock_name || '-',
            
            purchase_date: s.purchase_date,
            purchase_rate: s.purchase_rate,
            
            rate: s.sale_rate || s.rate,
            qty: s.sale_qty || s.qty,
            sale_value: s.sale_value || ((s.sale_rate || s.rate) * (s.sale_qty || s.qty)),
            
            long_term: s.long_term ? 'Yes' : 'No',
            pl: s.pl,
            adjusted_pl: s.adjusted_pl || s.profit, // Fallback if adjusted not calculated
            
            comments: s.comments,
            purchase_trx_id: s.purchase_trx_id,
            custom_id: s.custom_id || '-',
            trx_id: s.trx_id
        });
    });

    sheetSales.getRow(1).font = { bold: true };
    sheetSales.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEEEEEE' }
    };

    // --- GENERATE & DOWNLOAD ---
    // ExcelJS creates a buffer; we wrap it in a Blob to trigger the browser download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
};