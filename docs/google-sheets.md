# Google Sheets Configuration Guide

To enable the application to read data from your Google Sheet, follow these steps to set up the Google Cloud Project and configure the environment.

## 1. Google Cloud Project Setup

1.  **Create a Project**: Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a new project (e.g., "Portfolio Tracker").
2.  **Enable Sheets API**: 
    *   Navigate to **APIs & Services > Library**.
    *   Search for **"Google Sheets API"** and click **Enable**.
3.  **Create a Service Account**:
    *   Go to **APIs & Services > Credentials**.
    *   Click **Create Credentials > Service Account**.
    *   Name it `sheets-reader`, then click **Create and Continue**.
    *   (Optional) Grant it the **Viewer** role and click **Done**.
4.  **Generate a JSON Key**:
    *   Click on the newly created service account email.
    *   Go to the **Keys** tab.
    *   Click **Add Key > Create New Key**.
    *   Select **JSON** and click **Create**. A file will download to your computer.

## 2. Share the Google Sheet

1.  Open the Google Sheet you want to use.
2.  Click the **Share** button in the top right.
3.  Copy the **client_email** from the downloaded JSON file (e.g., `sheets-reader@your-project-id.iam.gserviceaccount.com`).
4.  Paste it into the Share dialog, set the permission to **Viewer**, and click **Send**.

## 3. Configure Environment Variables

Add the following keys to your `.env.local` file. Use the values from your downloaded JSON key file.

```env
# The ID is the long string in the sheet's URL: docs.google.com/spreadsheets/d/[SHEET_ID]/edit
GOOGLE_SHEET_ID="your_google_sheet_id_here"

# Found in 'client_email' in the JSON file
GOOGLE_SHEETS_CLIENT_EMAIL="sheets-reader@your-project-id.iam.gserviceaccount.com"

# Found in 'private_key' in the JSON file. 
# IMPORTANT: Include the full string including BEGIN and END tags.
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 4. Developer Implementation Note

The other developer should use the `googleapis` package to access the data. Here is a recommended utility function:

```typescript
import { google } from 'googleapis';

export async function getGoogleSheetsData() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:Z', // Adjust sheet name and range as needed
  });

  return response.data.values;
}
```

> [!IMPORTANT]
> Keep your JSON key file secure. Do NOT commit it to version control. The `.env.local` file is already ignored by Git in this project.
