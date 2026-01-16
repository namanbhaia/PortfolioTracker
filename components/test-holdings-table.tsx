
'use client';
import { useSearchParams } from 'next/navigation';

export default function TestHoldingsTable() {
    const searchParams = useSearchParams();
    const client_ids = searchParams.get('client_ids');
    const ticker = searchParams.get('ticker');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const term = searchParams.get('term');
    const positive_balance = searchParams.get('positive_balance');

    return (
        <div className="p-4 border rounded-lg mt-4">
            <h2 className="text-lg font-bold">Filtered Results:</h2>
            <pre>
                {JSON.stringify({
                    client_ids,
                    ticker,
                    date_from,
                    date_to,
                    term,
                    positive_balance,
                }, null, 2)}
            </pre>
        </div>
    );
}
