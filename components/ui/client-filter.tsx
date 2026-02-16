"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Users, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@/components/helper/user-context';

// --- 1. Pure UI Component (Reusable) ---
interface ClientMultiSelectProps {
  clients: any[];
  selectedKeys: string[];
  onChange: (key: string) => void;
  identifier?: 'client_id' | 'client_name';
  className?: string; // Allow custom classes
}

export function ClientMultiSelect({
  clients,
  selectedKeys,
  onChange,
  identifier = 'client_name',
  className = ""
}: ClientMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    // REMOVED "md:w-64" from here. Now it defaults to 100% of parent width.
    <div className={`relative inline-block text-left w-full ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-2 text-slate-600 truncate">
          <Users size={16} className="text-indigo-500" />
          <span>
            {selectedKeys.length === 0
              ? "All Accounts"
              : `${selectedKeys.length} Selected`}
          </span>
        </div>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100">
            <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
              {clients.map((client) => {
                const key = client[identifier];
                const isSelected = selectedKeys.includes(key);

                return (
                  <button
                    key={client.client_id}
                    onClick={() => onChange(key)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors hover:bg-indigo-50"
                  >
                    <span className={isSelected ? "font-bold text-indigo-600" : "text-slate-600"}>
                      {client.client_name}
                    </span>
                    {isSelected && <Check size={14} className="text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- 2. Smart Wrapper (Legacy Support for Dashboard) ---
export function ClientFilter({ currentSelection }: { currentSelection: string[] }) {
  const { clients } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggle = (clientName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    let newSelection = [...currentSelection];

    if (newSelection.includes(clientName)) {
      newSelection = newSelection.filter(name => name !== clientName);
    } else {
      newSelection.push(clientName);
    }

    if (newSelection.length > 0) {
      params.set('clients', newSelection.join(','));
    } else {
      params.delete('clients');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full md:w-48">
      <ClientMultiSelect
        clients={clients}
        selectedKeys={currentSelection}
        onChange={handleToggle}
        identifier="client_name"
      />
    </div>
  );
}