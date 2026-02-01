"use client"

import { useTransition, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/transaction-label';
import { Input } from '@/components/ui/transaction-input';
import { SubmitButton } from '@/components/ui/submit-button';
import { AlertCircle } from 'lucide-react';
export function DateRangeFilter({ initialDates }: { initialDates: { startDate: string, endDate: string } }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    // Local state to track validation without a server refresh
    const [error, setError] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const start = formData.get('start_date') as string;
        const end = formData.get('end_date') as string;

        // Validation logic moved here
        if (start && end && start > end) {
            setError('The "From Date" cannot be later than the "To Date".');
            return;
        }

        setError(null); // Clear error if valid

        startTransition(() => {
            const params = new URLSearchParams();
            if (start) params.set('start_date', start);
            if (end) params.set('end_date', end);
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase font-normal">From Date</Label>
                            <Input 
                                key={`start-${initialDates.startDate}`}
                                type="date" 
                                name="start_date" 
                                required 
                                defaultValue={initialDates.startDate ?? ''} 
                                className="bg-slate-50 font-normal" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase font-normal">To Date</Label>
                            <Input 
                                key={`end-${initialDates.endDate}`}
                                type="date" 
                                name="end_date" 
                                defaultValue={initialDates.endDate} 
                                className="bg-slate-50 font-normal" 
                            />
                        </div>
                        
                        <SubmitButton 
                            isPending={isPending} 
                            label="Generate Tax Summary" 
                            classname="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 min-w-[140px] justify-center font-normal"
                            loadingText='Generating...'
                        />
                    </form>
                </CardContent>
            </Card>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-normal flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}
        </div>
    );
}