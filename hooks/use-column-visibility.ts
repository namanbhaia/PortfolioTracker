"use client";

import { useState, useEffect, useCallback } from 'react';

export interface ColumnDefinition {
  id: string;
  label: string;
}

export function useColumnVisibility(tableId: string, defaultColumns: string[]) {
  const storageKey = `table_cols_${tableId}`;

  // Initialize from sessionStorage or default
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') return defaultColumns;
    const item = sessionStorage.getItem(storageKey);
    return item ? JSON.parse(item) : defaultColumns;
  });

  // Persist to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify(visibleColumns));
  }, [visibleColumns, storageKey]);

  const toggleColumn = useCallback((columnId: string) => {
    setVisibleColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  }, []);

  const isVisible = useCallback((columnId: string) => {
    return visibleColumns.includes(columnId);
  }, [visibleColumns]);

  return {
    visibleColumns,
    setVisibleColumns,
    toggleColumn,
    isVisible,
  };
}
