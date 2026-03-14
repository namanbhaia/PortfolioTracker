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
          className="ml-auto flex h-10 gap-2 border-slate-200 bg-white px-3 font-semibold text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
        >
          <Settings2 className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-white">
        <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Toggle Columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            className="capitalize text-slate-600 focus:bg-indigo-50 focus:text-indigo-700"
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
