"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import SummaryCards from '@/components/dashboard/summary-cards';
import HoldingsTable from '@/components/dashboard/holdings-table';

export default function ClientDashboard({ clients, holdings, profile }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedClient = useMemo(() => {
    return searchParams.get('client') || profile?.primary_client_name || '';
  }, [searchParams, profile?.primary_client_name]);

  const handleClientChange = (event) => {
    const params = new URLSearchParams(searchParams);
    params.set('client', event.target.value);
    router.push(`?${params.toString()}`);
  };

  const filteredHoldings = useMemo(() => {
    return holdings.filter((holding) => holding.client_name === selectedClient && holding.balance_qty > 0);
  }, [holdings, selectedClient]);

  const metrics = {
    total_invested: filteredHoldings.reduce((acc, h) => acc + h.purchase_value, 0),
    current_value: filteredHoldings.reduce((acc, h) => acc + h.market_value, 0),
    total_pl: filteredHoldings.reduce((acc, h) => acc + h.pl, 0),
    total_pl_percent: filteredHoldings.length > 0 ? (filteredHoldings.reduce((acc, h) => acc + h.pl, 0) / filteredHoldings.reduce((acc, h) => acc + h.purchase_value, 0)) * 100 : 0,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Client Dashboard</h1>
        <p className="text-slate-500">View holdings and performance for a specific client.</p>
      </header>

      <div>
        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700">
          Select Client
        </label>
        <select
          id="client-select"
          value={selectedClient}
          onChange={handleClientChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {clients.map((client) => (
            <option key={client.client_name} value={client.client_name}>
              {client.client_name}
            </option>
          ))}
        </select>
      </div>

      <SummaryCards metrics={metrics} />

      <HoldingsTable holdings={filteredHoldings} />
    </div>
  );
}
