
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HoldingsFilters() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<{ client_id: string; client_name: string }[]>([]);
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [tickers, setTickers] = useState<string[]>([]);
    const [selectedTicker, setSelectedTicker] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('all');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        async function fetchData() {
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

                    const { data: tickerData } = await supabase
                        .from('client_holdings')
                        .select('ticker')
                        .in('client_id', profile.client_ids);

                    if (tickerData) {
                        const uniqueTickers = [...new Set(tickerData.map(t => t.ticker))];
                        setTickers(uniqueTickers);
                    }
                }
            }
        }
        fetchData();
    }, [supabase]);

    useEffect(() => {
        const clientIds = searchParams.get('client_ids');
        if (clientIds) {
            setSelectedClients(clientIds.split(','));
        } else {
            setSelectedClients(clients.map(c => c.client_id));
        }

        const ticker = searchParams.get('ticker');
        if (ticker) {
            setSelectedTicker(ticker);
        }

        const term = searchParams.get('term');
        if (term) {
            setSelectedTerm(term);
        }
    }, [searchParams, clients]);

    const handleApplyFilters = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const params = new URLSearchParams(searchParams);

        if (selectedClients.length > 0) {
            params.set('client_ids', selectedClients.join(','));
        } else {
            params.delete('client_ids');
        }

        if (selectedTicker) {
            params.set('ticker', selectedTicker);
        } else {
            params.delete('ticker');
        }

        if (selectedTerm && selectedTerm !== 'all') {
            params.set('term', selectedTerm);
        } else {
            params.delete('term');
        }

        for (const [key, value] of formData.entries()) {
            if (key !== 'client_ids' && key !== 'ticker' && key !== 'term') {
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

    const handleResetFilters = () => {
        router.push('/dashboard/holdings');
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

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                    >
                        {selectedTicker
                            ? tickers.find((ticker) => ticker === selectedTicker)
                            : "Select ticker..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput placeholder="Search ticker..." />
                        <CommandEmpty>No ticker found.</CommandEmpty>
                        <CommandGroup>
                            {tickers.map((ticker) => (
                                <CommandItem
                                    key={ticker}
                                    onSelect={(currentValue) => {
                                        setSelectedTicker(currentValue === selectedTicker ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedTicker === ticker ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {ticker}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>

            <div className="flex items-center space-x-2">
                <Input
                    type="date"
                    name="date_from"
                    defaultValue={searchParams.get('date_from') ?? ''}
                />
                <span className="text-gray-500">-</span>
                <Input
                    type="date"
                    name="date_to"
                    defaultValue={searchParams.get('date_to') ?? ''}
                />
            </div>

            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                    <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Terms</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                    <SelectItem value="short">Short</SelectItem>
                </SelectContent>
            </Select>

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
            <Button type="button" variant="ghost" onClick={handleResetFilters}>Reset</Button>
        </form>
    );
}
