import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export function useSortableData<T>(items: T[], initialConfig: { key: keyof T | null; direction: SortDirection } = { key: null, direction: null }) {
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: SortDirection }>(initialConfig);

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig.key !== null && sortConfig.direction !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key!];
                const bValue = b[sortConfig.key!];

                if (aValue === bValue) return 0;
                
                // Handle null/undefined values by pushing them to the end appropriately
                if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
                if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' 
                        ? aValue.localeCompare(bValue) 
                        : bValue.localeCompare(aValue);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key: keyof T) => {
        let direction: SortDirection = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key: direction ? key : null, direction });
    };

    return { items: sortedItems, requestSort, sortConfig };
}
