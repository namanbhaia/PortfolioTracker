"use client";

import * as React from "react";
import { Settings2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ColumnDefinition {
  id: string;
  label: string;
}

interface ColumnVisibilityToggleProps {
  columns: ColumnDefinition[];
  visibleColumns: string[];
  onToggle: (id: string) => void;
  label?: string;
}

export function ColumnVisibilityToggle({
  columns,
  visibleColumns,
  onToggle,
  label = "Columns",
}: ColumnVisibilityToggleProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto flex h-10 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <Settings2 className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-indigo-500/10">
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize text-slate-600 dark:text-slate-300 focus:bg-indigo-50 dark:focus:bg-indigo-900/40 focus:text-indigo-700 dark:focus:text-indigo-400"
            checked={visibleColumns.includes(column.id)}
            onCheckedChange={() => onToggle(column.id)}
            onSelect={(e) => e.preventDefault()} // Prevent closing on toggle
          >
            {column.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
