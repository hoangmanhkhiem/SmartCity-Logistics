'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';

export default function PartnerPage() {
  const [profile, setProfile] = useState<{ legalName?: string; fleetSize?: number; anonymizePublic?: boolean; address?: string } | null>(null);
  const [report, setReport] = useState('');

  useEffect(() => {
    api.get('/phases/partner/profile').then((r) => setProfile(r.data)).catch(() => setProfile(null));
  }, []);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const res = await api.put('/phases/partner/profile', {
      fleetSize: Number(data.get('fleetSize')),
      address: data.get('address'),
      anonymizePublic: data.get('anonymize') === 'on',
      isPartner: true,
    });
    setProfile(res.data);
  }

  if (!profile) return <main className="p-8">Cần đăng nhập tài khoản doanh nghiệp.</main>;

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Link href="/" className="text-sm text-indigo-600">← Trang chủ</Link>
      <h1 className="mt-2 text-2xl font-semibold">Hồ sơ đối tác</h1>
      <p className="mt-2 text-sm text-slate-600">Tên công khai: {profile.legalName}. Bật ẩn danh để website chỉ hiện mã DN.</p>
      <form onSubmit={save} className="mt-4 space-y-3">
        <input name="fleetSize" defaultValue={profile.fleetSize ?? 10} className="w-full rounded border px-3 py-2" />
        <input name="address" defaultValue={profile.address ?? ''} className="w-full rounded border px-3 py-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="anonymize" type="checkbox" defaultChecked={profile.anonymizePublic !== false} /> Ẩn tên doanh nghiệp trên cổng công khai
        </label>
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" type="submit">Lưu</button>
      </form>
      <button className="mt-4 rounded border px-3 py-2" onClick={async () => setReport(JSON.stringify((await api.get('/phases/partner/report')).data, null, 2))}>Xem báo cáo so sánh</button>
      <pre className="mt-3 overflow-auto text-xs">{report}</pre>
    </main>
  );
}
