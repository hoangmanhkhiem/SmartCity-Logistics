'use client';

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

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
    pagination?: {
        page: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
    onRowClick?: (item: T) => void;
    className?: string;
}

export function DataTable<T extends { id?: string }>({
    columns,
    data,
    loading,
    emptyMessage = 'Không có dữ liệu',
    pagination,
    onRowClick,
    className,
}: DataTableProps<T>) {
    const getValue = (item: T, key: string): unknown => {
        const keys = key.split('.');
        let value: unknown = item;
        for (const k of keys) {
            value = (value as Record<string, unknown>)?.[k];
        }
        return value;
    };

    return (
        <div className={cn('w-full', className)}>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key as string}
                                    className={cn(
                                        'px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider',
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center">
                                    <div className="flex items-center justify-center gap-2 text-gray-500">
                                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        Đang tải...
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(
                                        'transition-colors',
                                        onRowClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key as string}
                                            className={cn(
                                                'px-4 py-3 text-sm text-gray-700 dark:text-gray-300',
                                                col.className
                                            )}
                                        >
                                            {col.render
                                                ? col.render(item)
                                                : (getValue(item, col.key as string) as React.ReactNode) ?? '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Trang {pagination.page} / {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(1)}
                            disabled={pagination.page <= 1}
                        >
                            <ChevronsLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            <ChevronRight size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination.onPageChange(pagination.totalPages)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            <ChevronsRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
