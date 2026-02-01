"use client";

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Users, Check } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '@/components/helper/user-context';

export function ClientFilter({ currentSelection }: {
  currentSelection: string[]
}) {

  const { clients } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const toggleClient = (clientName: string) => {
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
    <div className="relative inline-block text-left w-full md:w-64">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-medium hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-2 text-slate-600">
          <Users size={16} />
          <span>
            {currentSelection.length === 0
              ? "All Accounts"
              : `${currentSelection.length} Selected`}
          </span>
        </div>
        <span className="text-slate-400 text-[10px]">▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>

          <div className="absolute right-0 z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100">
            <div className="p-2 space-y-1">
              {clients.map((client) => (
                <button
                  key={client.client_id}
                  onClick={() => toggleClient(client.client_name)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors hover:bg-indigo-50"
                >
                  <span className={currentSelection.includes(client.client_name) ? "font-bold text-indigo-600" : "text-slate-600"}>
                    {client.client_name}
                  </span>
                  {currentSelection.includes(client.client_name) && (
                    <Check size={14} className="text-indigo-600" />
                  )}
                </button>
              ))}

              {currentSelection.length > 0 && (
                <button
                  onClick={() => {
                    router.push(pathname);
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 pt-2 border-t border-slate-100 text-[10px] font-bold text-red-500 uppercase hover:text-red-600"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}