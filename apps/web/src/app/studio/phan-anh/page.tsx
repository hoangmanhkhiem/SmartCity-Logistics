'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api } from '@/api';

export default function IssuePage() {
  const [message, setMessage] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const res = await api.post('/issues', {
      issueType: data.get('issueType'),
      latitude: Number(data.get('latitude')),
      longitude: Number(data.get('longitude')),
      note: data.get('note'),
    });
    setMessage(`Đã gửi phản ánh #${res.data.id}. Vị trí được làm mờ trước khi lưu.`);
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <Link href="/" className="text-sm text-indigo-600">← Trang chủ</Link>
      <h1 className="mt-2 text-2xl font-semibold">Báo điểm nghẽn / chỗ đỗ</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <select name="issueType" className="w-full rounded border px-2 py-2">
          <option value="congestion">Ùn tắc</option>
          <option value="ban">Cấm đường</option>
          <option value="no_parking">Không có chỗ đỗ</option>
          <option value="alley">Ngõ nhỏ</option>
          <option value="map_error">Sai bản đồ</option>
        </select>
        <input name="latitude" defaultValue="21.0285" className="w-full rounded border px-2 py-2" />
        <input name="longitude" defaultValue="105.8542" className="w-full rounded border px-2 py-2" />
        <textarea name="note" className="w-full rounded border px-2 py-2" placeholder="Mô tả, không ghi biển số hay số điện thoại" />
        <button className="rounded bg-indigo-600 px-3 py-2 text-white" type="submit">Gửi</button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </main>
  );
}
