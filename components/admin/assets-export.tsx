"use client"
import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DownloadCloud, Loader2 } from 'lucide-react';

export default function AssetsExport() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleExportAssets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('assets').select('*').csv();
            if (error) throw error;
            if (!data) {
                alert("No assets found.");
                return;
            }

            const blob = new Blob([data as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'master_assets_export.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            console.error(err);
            alert(`Assets Export Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                    <DownloadCloud size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Master Assets Export</h3>
                    <p className="text-sm text-slate-500">Download system-wide asset records as a CSV</p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                <button
                    onClick={handleExportAssets}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-2 rounded-full border-0 text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer disabled:opacity-60 transition-colors"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <DownloadCloud size={16} />}
                    {loading ? 'Generating CSV...' : 'Download Assets Data'}
                </button>
                <p className="mt-2 text-[10px] text-slate-400">Includes Ticker, Stock Name, ISIN</p>
            </div>
        </div>
    );
}
