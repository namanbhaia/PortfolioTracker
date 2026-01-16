
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function HoldingsFilters() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<{ client_id: string; client_name: string }[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);

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

    useEffect(() => {
        const clientIds = searchParams.get('client_ids');
        if (clientIds) {
            setSelectedClients(clientIds.split(','));
        }
    }, [searchParams]);

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const params = new URLSearchParams(searchParams);

        if (selectedClients.length > 0) {
            params.set('client_ids', selectedClients.join(','));
        } else {
            params.delete('client_ids');
        }

        for (const [key, value] of formData.entries()) {
            if (key !== 'client_ids') {
                if (value) {
                    params.set(key, value as string);
                } else {
                    params.delete(key);
                }
            }
        }

        const positiveBalance = formData.get('positive_balance');
        if (positiveBalance) {
            params.set('positive_balance', 'true');
        } else {
            params.delete('positive_balance');
        }

        router.push(`?${params.toString()}`);
    };

    const handleClientSelection = (clientId: string) => {
        setSelectedClients(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleSelectAll = () => {
        setSelectedClients(clients.map(c => c.client_id));
    };

    const handleSelectNone = () => {
        setSelectedClients([]);
    };

    return (
        <form onSubmit={handleApplyFilters} className="p-4 bg-gray-100 rounded-lg flex items-center space-x-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">Clients</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSelectAll(); }}>Select All</DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleSelectNone(); }}>Select None</DropdownMenuItem>
                    {clients.map(client => (
                        <DropdownMenuItem key={client.client_id} onSelect={(e) => { e.preventDefault(); handleClientSelection(client.client_id); }}>
                            <Checkbox checked={selectedClients.includes(client.client_id)} className="mr-2" />
                            {client.client_name}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                type="text"
                name="ticker"
                placeholder="Ticker"
                className="block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                defaultValue={searchParams.get('ticker') ?? ''}
            />

            <div className="flex items-center space-x-2">
                <input
                    type="date"
                    name="date_from"
                    className="block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    defaultValue={searchParams.get('date_from') ?? ''}
                />
                <span className="text-gray-500">-</span>
                <input
                    type="date"
                    name="date_to"
                    className="block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    defaultValue={searchParams.get('date_to') ?? ''}
                />
            </div>

            <select
                name="term"
                className="block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                defaultValue={searchParams.get('term') ?? ''}
            >
                <option value="">All Terms</option>
                <option value="long">Long</option>
                <option value="short">Short</option>
            </select>

            <div className="flex items-center">
                <Checkbox
                    id="positive_balance"
                    name="positive_balance"
                    defaultChecked={searchParams.get('positive_balance') === 'true'}
                />
                <label htmlFor="positive_balance" className="ml-2 block text-sm text-gray-900">
                    Balance &gt; 0
                </label>
            </div>

            <Button type="submit">Go</Button>
        </form>
    );
}
