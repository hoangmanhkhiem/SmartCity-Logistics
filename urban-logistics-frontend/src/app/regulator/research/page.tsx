'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardBody, CardHeader, Select, Button, DataTable } from '@/components/ui';
import { researchApi } from '@/lib/api';
import type { Column } from '@/components/ui';
import { Table2 } from 'lucide-react';

type ResearchTableMeta = { key: string; label: string; dbTable: string };

const PAGE_SIZE = 20;

function sortRowKeys(keys: string[]): string[] {
    const rest = keys.filter((k) => k !== 'id').sort((a, b) => a.localeCompare(b, 'vi'));
    return keys.includes('id') ? ['id', ...rest] : rest;
}

export default function RegulatorResearchPage() {
    const [tables, setTables] = useState<ResearchTableMeta[]>([]);
    const [tableKey, setTableKey] = useState('');
    const [rows, setRows] = useState<Record<string, unknown>[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loadingTables, setLoadingTables] = useState(true);
    const [loadingRows, setLoadingRows] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingTables(true);
            setError(null);
            try {
                const res = await researchApi.getTables();
                if (cancelled) return;
                const list = res.data;
                setTables(list);
                setTableKey((prev) => prev || list[0]?.key || '');
            } catch (e) {
                if (!cancelled) {
                    setError('Không tải được danh sách bảng. Kiểm tra backend và đã chạy migration/import chưa.');
                    console.error(e);
                }
            } finally {
                if (!cancelled) setLoadingTables(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const fetchRows = useCallback(async () => {
        if (!tableKey) return;
        setLoadingRows(true);
        setError(null);
        try {
            const skip = (page - 1) * PAGE_SIZE;
            const res = await researchApi.getRows(tableKey, { skip, take: PAGE_SIZE });
            setRows(res.data.rows);
            setTotal(res.data.total);
        } catch (e) {
            setError('Không tải được dữ liệu bảng.');
            console.error(e);
            setRows([]);
            setTotal(0);
        } finally {
            setLoadingRows(false);
        }
    }, [tableKey, page]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const columns: Column<Record<string, unknown>>[] = useMemo(() => {
        if (rows.length === 0) {
            return [{ key: '_empty', header: '—', render: () => '' }];
        }
        const keys = sortRowKeys(Object.keys(rows[0]));
        return keys.map((key) => ({
            key,
            header: key,
            className: 'max-w-xs whitespace-pre-wrap break-words align-top',
            render: (row: Record<string, unknown>) => {
                const v = row[key];
                if (v === null || v === undefined) return '—';
                if (typeof v === 'object') return JSON.stringify(v);
                return String(v);
            },
        }));
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const selectOptions = useMemo(
        () => tables.map((t) => ({ value: t.key, label: t.label })),
        [tables]
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Table2 className="text-blue-600" size={28} />
                    Dữ liệu nghiên cứu / thu thập
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Xem các bảng đã import từ SQL (khu vực Hà Nội, so sánh đối thủ). Phân trang theo API{' '}
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">/research</code>.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                    {error}
                </div>
            )}

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Chọn bảng</h2>
                </CardHeader>
                <CardBody className="flex flex-wrap items-end gap-4">
                    <div className="min-w-[280px] flex-1">
                        <Select
                            label="Bảng dữ liệu"
                            placeholder={loadingTables ? 'Đang tải...' : 'Chọn bảng'}
                            options={selectOptions}
                            value={tableKey}
                            onChange={(v) => {
                                setTableKey(v);
                                setPage(1);
                            }}
                            disabled={loadingTables || selectOptions.length === 0}
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPage(1);
                            fetchRows();
                        }}
                        disabled={!tableKey || loadingRows}
                    >
                        Làm mới
                    </Button>
                    <span className="text-sm text-gray-500">
                        {tableKey ? `${total} dòng` : ''}
                    </span>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Nội dung</h2>
                </CardHeader>
                <CardBody>
                    <DataTable<Record<string, unknown> & { id?: string }>
                        columns={columns}
                        data={rows as (Record<string, unknown> & { id?: string })[]}
                        loading={loadingRows}
                        emptyMessage="Chưa có dòng hoặc bảng trống. Chạy migration và script import SQL trong backend."
                        pagination={{
                            page,
                            totalPages,
                            onPageChange: setPage,
                        }}
                    />
                </CardBody>
            </Card>
        </div>
    );
}
