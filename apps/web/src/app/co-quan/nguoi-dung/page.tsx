'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/api';
import { PageHead, StudioShell, regulatorNav } from '@/components/studio/shell';
import { DataCard } from '@/components/studio/page-ui';
import { DataTable, type Column } from '@/components/ui';
import { issueTypeLabel, type IssueRow, reporterLabel } from '../issue-labels';

type Reporter = {
    id: string;
    code: string;
    reports: number;
    lastType: string;
    lastAt?: string;
};

export default function RegulatorReportersPage() {
    const [issues, setIssues] = useState<IssueRow[]>([]);
    useEffect(() => {
        api.get('/issues').then((r) => setIssues(r.data ?? [])).catch(() => setIssues([]));
    }, []);

    const rows = useMemo<Reporter[]>(() => {
        const map = new Map<string, Reporter>();
        issues.forEach((issue, index) => {
            const key = issue.reporterHash || `anon-${issue.id}`;
            const current = map.get(key);
            if (!current) {
                map.set(key, {
                    id: key,
                    code: reporterLabel(issue.reporterHash, index),
                    reports: 1,
                    lastType: issueTypeLabel(issue.issueType),
                    lastAt: issue.createdAt,
                });
            } else {
                current.reports += 1;
                if ((issue.createdAt || '') > (current.lastAt || '')) {
                    current.lastType = issueTypeLabel(issue.issueType);
                    current.lastAt = issue.createdAt;
                }
            }
        });
        return [...map.values()].sort((a, b) => b.reports - a.reports);
    }, [issues]);

    return (
        <StudioShell group="CƠ QUAN QUẢN LÝ" role="Cơ quan quản lý" items={regulatorNav}>
            <PageHead
                title="Người dùng báo cáo"
                description="Danh sách người gửi phản ánh, đã ẩn danh theo chính sách dữ liệu."
            />
            <DataCard title="Người báo cáo" subtitle={`${rows.length} tài khoản đã gửi phản ánh`}>
                <DataTable
                    data={rows}
                    emptyMessage="Chưa có người dùng báo cáo"
                    columns={[
                        { key: 'code', header: 'Mã người báo' },
                        { key: 'reports', header: 'Số báo cáo', className: 'text-right' },
                        { key: 'lastType', header: 'Loại gần nhất' },
                        { key: 'lastAt', header: 'Lần gửi cuối', render: (r) => r.lastAt ? new Date(r.lastAt).toLocaleString('vi-VN') : '—' },
                    ] satisfies Column<Reporter>[]}
                />
            </DataCard>
        </StudioShell>
    );
}
