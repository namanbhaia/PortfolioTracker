"use client"

import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/transaction-label';
import { Input } from '@/components/ui/transaction-input';
import { SubmitButton } from '@/components/ui/submit-button';

export function DateRangeFilter({ initialDates }: { initialDates: { startDate: string, endDate: string } }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const start = formData.get('start_date') as string;
        const end = formData.get('end_date') as string;

        startTransition(() => {
            const params = new URLSearchParams();
            if (start) params.set('start_date', start);
            if (end) params.set('end_date', end);
            
            // router.push starts the transition; isPending becomes true until the page updates
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardContent className="p-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">From Date</Label>
                        <Input 
                            key={`start-${initialDates.startDate}`}
                            type="date" 
                            name="start_date" 
                            required // <--- Prevents "Run Report" if empty
                            max={initialDates.endDate}
                            defaultValue={initialDates.startDate ?? ''} 
                            className="bg-slate-50" 
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">To Date</Label>
                        <Input 
                            key={`end-${initialDates.endDate}`}
                            type="date" 
                            name="end_date" 
                            min={initialDates.startDate ?? ''}
                            defaultValue={initialDates.endDate} 
                            className="bg-slate-50" 
                        />
                    </div>
                    {/* Pass the pending state to the button */}
                    
                    <SubmitButton 
                        isPending={isPending} 
                        label="Generate Tax Summary" 
                        classname="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 min-w-[140px] justify-center"
                        loadingText='Generating...'
                    />
                </form>
            </CardContent>
        </Card>
    );
}