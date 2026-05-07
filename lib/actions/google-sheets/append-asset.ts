import { google } from 'googleapis';

let authClient: any = null;

export async function getGoogleSheets() {
  if (!authClient) {
    const credentials = {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    authClient = await auth.getClient();
  }

  const sheets = google.sheets({ version: 'v4', auth: authClient });
  return sheets;
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function appendAndSortAsset(assetData: {
  ticker: string;
  name: string;
  price: number;
  isin: string;
}) {
  try {
    const sheets = await getGoogleSheets();
    const spreadsheetId = SPREADSHEET_ID;

    // 1. Fetch existing tickers to avoid duplicates
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!B:B', // Column B is ticker
    });

    const existingTickers = response.data.values?.map((row) => row[0]?.toUpperCase()) || [];
    const newTicker = assetData.ticker.toUpperCase();

    if (existingTickers.includes(newTicker)) {
      console.log(`Ticker ${newTicker} already exists in the Google Sheet. Skipping append.`);
      return;
    }

    // 2. Append new row
    // Columns: complex_ticker, ticker, stock_name, isin, current_price, ...
    const complexTicker = `NSE:${newTicker}`; // Assuming NSE prefix as default
    const newRow = [
      complexTicker,
      newTicker,
      assetData.name,
      assetData.isin,
      assetData.price,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    // 3. Sort the sheet by Ticker (Column B)
    // Need to get sheetId for 'Sheet1'
    const sheetData = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = sheetData.data.sheets?.find((s) => s.properties?.title === 'Sheet1');
    const sheetId = sheet?.properties?.sheetId;

    if (sheetId !== undefined) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              sortRange: {
                range: {
                  sheetId: sheetId,
                  startRowIndex: 1, // skip header row (0-indexed)
                  // endRowIndex is not specified, so it sorts to the bottom of the sheet
                },
                sortSpecs: [
                  {
                    dimensionIndex: 1, // Column B (Ticker)
                    sortOrder: 'ASCENDING',
                  },
                ],
              },
            },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Error appending and sorting asset in Google Sheets:', error);
  }
}
