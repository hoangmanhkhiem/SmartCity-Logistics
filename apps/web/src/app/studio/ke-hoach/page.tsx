'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';

export default function PlanStudioPage() {
  const [out, setOut] = useState('');

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Link href="/" className="text-sm text-indigo-600">← Trang chủ</Link>
      <h1 className="mt-2 text-2xl font-semibold">Kế hoạch tuyến và kịch bản</h1>
      <div className="mt-6 flex gap-2">
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" onClick={async () => {
          await api.post('/phases/orders/simulate', { count: 20 });
          const res = await api.post('/phases/plans/solve');
          setOut(JSON.stringify(res.data, null, 2));
        }}>Sinh đơn mẫu và lập tuyến</button>
        <button className="rounded border px-3 py-2" onClick={async () => {
          const res = await api.post('/scenarios', { name: 'Mở rộng LEZ Hoàn Kiếm', kind: 'policy', changes: { lez: 'expand' } });
          setOut(JSON.stringify(res.data, null, 2));
        }}>Kịch bản LEZ</button>
      </div>
      <pre className="mt-4 overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{out}</pre>
    </main>
  );
}
