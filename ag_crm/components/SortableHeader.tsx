import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortDirection } from '@/lib/hooks/useSortableData';

interface SortableHeaderProps {
    label: string;
    sortKey: string;
    currentSortKey: string | null;
    currentDirection: SortDirection;
    onSort: (key: any) => void;
    className?: string;
}

export function SortableHeader({ label, sortKey, currentSortKey, currentDirection, onSort, className }: SortableHeaderProps) {
    const isActive = currentSortKey === sortKey;
    const direction = isActive ? currentDirection : null;

    return (
        <th 
            className={cn("px-6 py-4 cursor-pointer select-none group hover:bg-zinc-100/50 transition-colors", className)} 
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                <span>{label}</span>
                <span className={cn(
                    "w-5 h-5 flex items-center justify-center rounded text-zinc-400 group-hover:bg-zinc-200 transition-all",
                    isActive ? "bg-zinc-200 text-black shadow-sm" : ""
                )}>
                    {direction === 'asc' ? (
                        <ArrowUp size={12} strokeWidth={3} />
                    ) : direction === 'desc' ? (
                        <ArrowDown size={12} strokeWidth={3} />
                    ) : (
                        <ArrowUpDown size={12} strokeWidth={2} className="opacity-50 group-hover:opacity-100" />
                    )}
                </span>
            </div>
        </th>
    );
}
