'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function HoldingsFilters() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<{ client_id: string; client_name: string }[]>([]);

    useEffect(() => {
        async function fetchClients() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('client_ids')
                    .eq('id', user.id)
                    .single();
                if (profile?.client_ids) {
                    const { data: clientData } = await supabase
                        .from('clients')
                        .select('client_id, client_name')
                        .in('client_id', profile.client_ids);
                    if (clientData) {
                        setClients(clientData);
                    }
                }
            }
        }
        fetchClients();
    }, [supabase]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const params = new URLSearchParams(searchParams);

        // Handle multi-select for client_name
        const clientNames = formData.getAll('client_name');
        if (clientNames.length > 0) {
            params.set('client_name', clientNames.join(','));
        } else {
            params.delete('client_name');
        }

        // Handle other fields
        for (const [key, value] of formData.entries()) {
            if (key !== 'client_name' && key !== 'positive_balance') {
                if (value) {
                    params.set(key, value as string);
                } else {
                    params.delete(key);
                }
            }
        }

        // Handle checkbox
        const positiveBalance = formData.get('positive_balance');
        if (positiveBalance) {
            params.set('positive_balance', 'true');
        } else {
            params.delete('positive_balance');
        }

        router.push(`?${params.toString()}`);
    };

    return (
        <form onChange={handleFilterChange} className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                    <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">Client Name</label>
                    <select
                        id="client_name"
                        name="client_name"
                        multiple
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {clients.map(client => (
                            <option key={client.client_id} value={client.client_id}>
                                {client.client_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">Ticker</label>
                    <input
                        type="text"
                        id="ticker"
                        name="ticker"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        defaultValue={searchParams.get('ticker') ?? ''}
                    />
                </div>
                <div>
                    <label htmlFor="date_from" className="block text-sm font-medium text-gray-700">Date From</label>
                    <input
                        type="date"
                        id="date_from"
                        name="date_from"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        defaultValue={searchParams.get('date_from') ?? ''}
                    />
                </div>
                <div>
                    <label htmlFor="date_to" className="block text-sm font-medium text-gray-700">Date To</label>
                    <input
                        type="date"
                        id="date_to"
                        name="date_to"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        defaultValue={searchParams.get('date_to') ?? ''}
                    />
                </div>
                <div>
                    <label htmlFor="term" className="block text-sm font-medium text-gray-700">Term</label>
                    <select
                        id="term"
                        name="term"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        defaultValue={searchParams.get('term') ?? ''}
                    >
                        <option value="">All</option>
                        <option value="long">Long</option>
                        <option value="short">Short</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <input
                        id="positive_balance"
                        name="positive_balance"
                        type="checkbox"
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        defaultChecked={searchParams.get('positive_balance') === 'true'}
                    />
                    <label htmlFor="positive_balance" className="ml-2 block text-sm text-gray-900">
                        Balance &gt; 0
                    </label>
                </div>
            </div>
        </form>
    );
}
