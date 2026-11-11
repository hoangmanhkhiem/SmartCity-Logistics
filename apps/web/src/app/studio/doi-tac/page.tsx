'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/api';
import { PageHead, StudioShell, orgNav } from '@/components/studio/shell';

export default function PartnerPage() {
    const [profile, setProfile] = useState<{ legalName?: string; fleetSize?: number; anonymizePublic?: boolean; address?: string } | null>(null);
    const [report, setReport] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        api.get('/phases/partner/profile').then((r) => setProfile(r.data)).catch(() => setProfile(null));
    }, []);

    async function save(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        try {
            const res = await api.put('/phases/partner/profile', {
                fleetSize: Number(data.get('fleetSize')),
                address: data.get('address'),
                anonymizePublic: data.get('anonymize') === 'on',
                isPartner: true,
            });
            setProfile(res.data);
            setMessage('Đã lưu hồ sơ.');
        } catch {
            setMessage('Không lưu được hồ sơ.');
        }
    }

    return (
        <StudioShell group="DOANH NGHIỆP" role="Quản trị DN" items={orgNav}>
            <PageHead title="Hồ sơ đối tác" />
            <div className="mx-6 mb-6 max-w-xl space-y-3 rounded-2xl bg-white p-5 text-sm">
                {!profile && <p>Cần đăng nhập tài khoản doanh nghiệp.</p>}
                {profile && (
                    <form onSubmit={save} className="space-y-3">
                        <p className="text-xs text-[#7b8781]">Tên pháp lý: {profile.legalName}</p>
                        <label className="block">Quy mô đội xe<input name="fleetSize" defaultValue={profile.fleetSize ?? 10} className="mt-1 w-full rounded border px-3 py-2" /></label>
                        <label className="block">Địa chỉ<input name="address" defaultValue={profile.address ?? ''} className="mt-1 w-full rounded border px-3 py-2" /></label>
                        <label className="flex items-center gap-2 text-sm">
                            <input name="anonymize" type="checkbox" defaultChecked={profile.anonymizePublic !== false} /> Ẩn tên doanh nghiệp trên cổng công khai
                        </label>
                        <button className="rounded-lg bg-[#0e6e5c] px-4 py-2 text-white" type="submit">Lưu</button>
                    </form>
                )}
                <button className="rounded-lg border px-3 py-2" type="button" onClick={async () => setReport(JSON.stringify((await api.get('/phases/partner/report')).data, null, 2))}>Xem báo cáo so sánh</button>
                {message && <p className="text-xs">{message}</p>}
                {report && <pre className="overflow-auto rounded-lg bg-[#e7eee9] p-3 text-xs">{report}</pre>}
            </div>
        </StudioShell>
    );
}
