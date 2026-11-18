'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

export const TABLE_PAGE_SIZE = 5;
export const TABLE_PAGE_SIZE_OPTIONS = [5, 10];

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
    pagination?:
        | false
        | {
              page: number;
              totalPages: number;
              onPageChange: (page: number) => void;
              total?: number;
              pageSize?: number;
              pageSizeOptions?: number[];
              onPageSizeChange?: (size: number) => void;
          };
    pageSize?: number;
    onRowClick?: (item: T) => void;
    rowClassName?: (item: T) => string;
    className?: string;
}

function pageWindow(page: number, totalPages: number) {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const from = Math.max(1, start);
    const to = Math.min(totalPages, from + 4);
    return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

export function DataTable<T extends { id?: string | number }>({
    columns,
    data,
    loading,
    emptyMessage = 'Không có dữ liệu',
    pagination,
    pageSize: clientPageSize = TABLE_PAGE_SIZE,
    onRowClick,
    rowClassName,
    className,
}: DataTableProps<T>) {
    const server = pagination === false || pagination == null ? null : pagination;
    const [localPage, setLocalPage] = useState(1);
    const [localSize, setLocalSize] = useState(clientPageSize);

    useEffect(() => {
        setLocalPage(1);
    }, [data.length, clientPageSize]);

    const size = server?.pageSize ?? localSize;
    const total = server?.total ?? data.length;
    const totalPages = server?.totalPages ?? Math.max(1, Math.ceil(data.length / size));
    const page = server?.page ?? Math.min(localPage, totalPages);

    const pageData = useMemo(() => {
        if (server) return data;
        const start = (page - 1) * size;
        return data.slice(start, start + size);
    }, [data, page, size, server]);

    const showPager = pagination !== false;

    const getValue = (item: T, key: string): unknown => {
        const keys = key.split('.');
        let value: unknown = item;
        for (const k of keys) {
            value = (value as Record<string, unknown>)?.[k];
        }
        return value;
    };

    const go = (next: number) => {
        const clamped = Math.min(totalPages, Math.max(1, next));
        if (server) server.onPageChange(clamped);
        else setLocalPage(clamped);
    };

    return (
        <div className={cn('w-full', className)}>
            <div className="overflow-x-auto">
                <table className="w-full divide-y divide-[#e4e8f1]">
                    <thead className="bg-[#fafafa]">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key as string}
                                    className={cn(
                                        'px-4 py-3 text-left text-[13px] font-semibold text-[rgba(0,0,0,0.88)]',
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#f0f0f0]">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center">
                                    <div className="flex items-center justify-center gap-2 text-slate-500">
                                        <div className="w-5 h-5 border-2 border-[#1677ff] border-t-transparent rounded-full animate-spin" />
                                        Đang tải...
                                    </div>
                                </td>
                            </tr>
                        ) : pageData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            pageData.map((item, index) => (
                                <tr
                                    key={item.id ?? index}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        'transition-colors hover:bg-[#fafafa]',
                                        onRowClick && 'cursor-pointer',
                                        rowClassName?.(item)
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key as string}
                                            className={cn(
                                                'px-4 py-4 text-sm text-[rgba(0,0,0,0.88)]',
                                                col.className
                                            )}
                                        >
                                            {col.render
                                                ? col.render(item)
                                                : ((getValue(item, col.key as string) as React.ReactNode) ?? '-')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showPager && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <span className="text-sm text-[rgba(0,0,0,0.45)]">
                        Tổng {total} dòng
                    </span>
                    <div className="flex items-center gap-1">
                        <select
                            className="mr-2 h-8 rounded-md border border-[#d9d9d9] bg-white px-2 text-sm"
                            value={size}
                            onChange={(e) => {
                                const n = Number(e.target.value);
                                if (server?.onPageSizeChange) server.onPageSizeChange(n);
                                else {
                                    setLocalSize(n);
                                    setLocalPage(1);
                                }
                            }}
                        >
                            {(server?.pageSizeOptions ?? TABLE_PAGE_SIZE_OPTIONS).map((n) => (
                                <option key={n} value={n}>{n} / trang</option>
                            ))}
                        </select>
                        <Button variant="outline" size="sm" onClick={() => go(1)} disabled={page <= 1}>
                            <ChevronsLeft size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => go(page - 1)} disabled={page <= 1}>
                            <ChevronLeft size={14} />
                        </Button>
                        {pageWindow(page, totalPages).map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => go(n)}
                                className={cn(
                                    'h-8 min-w-8 rounded-md border px-2 text-sm',
                                    n === page
                                        ? 'border-[#1677ff] text-[#1677ff]'
                                        : 'border-[#d9d9d9] text-[rgba(0,0,0,0.88)] hover:border-[#1677ff] hover:text-[#1677ff]'
                                )}
                            >
                                {n}
                            </button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => go(page + 1)} disabled={page >= totalPages}>
                            <ChevronRight size={14} />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => go(totalPages)} disabled={page >= totalPages}>
                            <ChevronsRight size={14} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
