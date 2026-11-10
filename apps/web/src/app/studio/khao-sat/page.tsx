'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';

export default function SurveyStudioPage() {
  const [forms, setForms] = useState<Array<{ code: string }>>([]);
  const [progress, setProgress] = useState<unknown>(null);
  const [message, setMessage] = useState('');
  const [csv, setCsv] = useState('site_code,lat,lon,zone_id,platform,vehicle_type\nGRAB_BD_99,21.03,105.85,1,grab,motorbike_ev');
  const [byZone, setByZone] = useState<unknown>(null);
  const [formCode, setFormCode] = useState('shipper');
  const [siteCode, setSiteCode] = useState('GRAB_BD_01');
  const [note, setNote] = useState('');

  useEffect(() => {
    api.get('/surveys/forms').then((r) => setForms(r.data)).catch((e) => setMessage(e.response?.data?.message || 'Cần đăng nhập'));
    api.get('/surveys/progress').then((r) => setProgress(r.data)).catch(() => undefined);
    api.get('/phases/surveys/progress-by-zone').then((r) => setByZone(r.data)).catch(() => undefined);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = await api.post(`/surveys/forms/${formCode}/responses`, {
      siteCode,
      answers: { note, consent: true },
    });
    setMessage(`Đã nộp phiếu #${res.data.id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/" className="text-sm text-indigo-600">← Trang chủ</Link>
      <h1 className="mt-2 text-2xl font-semibold">Trung tâm khảo sát</h1>
      <p className="mt-2 text-sm text-slate-600">Năm bộ phiếu: shipper, doanh nghiệp chặng cuối, nền tảng, logistics, cơ quan quản lý. Không thu tên hay số điện thoại shipper.</p>
      <form onSubmit={submit} className="mt-6 space-y-3 rounded border bg-white p-4">
        <label className="block text-sm">Bộ phiếu
          <select className="mt-1 w-full rounded border px-2 py-2" value={formCode} onChange={(e) => setFormCode(e.target.value)}>
            {(forms.length ? forms : [{ code: 'shipper' }]).map((f) => <option key={f.code}>{f.code}</option>)}
          </select>
        </label>
        <label className="block text-sm">Mã điểm (NỀN TẢNG_PHƯỜNG_STT)
          <input className="mt-1 w-full rounded border px-2 py-2" value={siteCode} onChange={(e) => setSiteCode(e.target.value)} />
        </label>
        <label className="block text-sm">Ghi chú hiện trường
          <textarea className="mt-1 w-full rounded border px-2 py-2" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" type="submit">Nộp phiếu</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
      <h2 className="mt-8 font-medium">Import CSV (báo lỗi từng dòng)</h2>
      <textarea className="mt-2 w-full rounded border p-2 font-mono text-xs" rows={5} value={csv} onChange={(e) => setCsv(e.target.value)} />
      <div className="mt-2 flex gap-2">
        <button className="rounded border px-3 py-2" type="button" onClick={async () => {
          const res = await api.post('/phases/surveys/import', { csv });
          setMessage(JSON.stringify(res.data));
        }}>Kiểm tra</button>
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" type="button" onClick={async () => {
          const res = await api.post('/phases/surveys/import', { csv, commit: true });
          setMessage(JSON.stringify(res.data));
        }}>Nhập</button>
        <button className="rounded border px-3 py-2" type="button" onClick={async () => {
          const res = await api.get('/phases/surveys/shipper/export');
          setMessage(res.data.csv ?? JSON.stringify(res.data));
        }}>Xuất CSV + codebook</button>
      </div>
      <h2 className="mt-8 font-medium">Tiến độ theo phường</h2>
      <pre className="mt-2 overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(byZone, null, 2)}</pre>
      <h2 className="mt-8 font-medium">Tiến độ</h2>
      <pre className="mt-2 overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{JSON.stringify(progress, null, 2)}</pre>
    </main>
  );
}
