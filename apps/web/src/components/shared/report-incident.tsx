'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Clock, MapPin } from 'lucide-react';
import { api } from '@/api';
import Map from '@/components/shared/map';
import { DataCard } from '@/components/studio/page-ui';
import { DataTable, type Column } from '@/components/ui';
import { useAuthStore } from '@/stores/auth-store';
import {
    type IssueRow,
    REPORT_KINDS,
    issueStatusLabel,
    issueTypeLabel,
    relativeTimeVi,
} from '@/app/co-quan/issue-labels';

const HN: [number, number] = [105.8542, 21.0285];

function statusPill(status?: string) {
    if (status === 'approved') return 'cq-pill green';
    if (status === 'rejected' || status === 'cleared') return 'cq-pill red';
    return 'cq-pill orange';
}

export default function ReportIncident({ compact = false }: { compact?: boolean }) {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [kind, setKind] = useState('flood');
    const [note, setNote] = useState('');
    const [coords, setCoords] = useState<[number, number]>(HN);
    const [gpsLabel, setGpsLabel] = useState('Đang lấy vị trí…');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [mine, setMine] = useState<IssueRow[]>([]);

    const applyGps = () => {
        if (!navigator.geolocation) {
            setGpsLabel('Trình duyệt không hỗ trợ GPS — chọn vị trí trên bản đồ');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCoords([pos.coords.longitude, pos.coords.latitude]);
                setGpsLabel('Vị trí hiện tại');
            },
            () => setGpsLabel('Chạm bản đồ để chọn vị trí'),
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    const loadMine = () => {
        if (!isAuthenticated) return;
        api.get('/issues/mine').then((r) => setMine(r.data ?? [])).catch(() => setMine([]));
    };

    useEffect(() => {
        applyGps();
    }, []);

    useEffect(() => {
        loadMine();
    }, [isAuthenticated]);

    const submit = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setSending(true);
        setMessage('');
        try {
            await api.post('/issues', {
                issueType: kind,
                longitude: coords[0],
                latitude: coords[1],
                note: note.trim() || issueTypeLabel(kind),
            });
            setMessage('Đã gửi. Cơ quan sẽ duyệt trước khi điểm đỏ hiện trên bản đồ.');
            setNote('');
            loadMine();
        } catch {
            setMessage('Không gửi được. Hãy đăng nhập rồi thử lại.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            <div className={compact ? 'space-y-3' : 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]'}>
                <div className={compact ? 'h-64 overflow-hidden rounded-[16px] bg-white' : 'h-[460px] overflow-hidden rounded-[16px] bg-white shadow-[0_8px_30px_rgba(11,27,58,0.045)]'}>
                    <Map
                        className="h-full w-full"
                        center={coords}
                        zoom={15}
                        showZonesAndRestrictions
                        pickLocation
                        pickMarker={coords}
                        onMapClick={({ lng, lat }) => {
                            setCoords([lng, lat]);
                            setGpsLabel('Đã chọn trên bản đồ');
                        }}
                    />
                </div>
                <section className="rounded-[16px] border border-[#e6ebf2] bg-white p-5 shadow-[0_8px_30px_rgba(11,27,58,0.045)]">
                    <div className="flex items-start gap-3">
                        <span className="metric-icon green"><MapPin size={16} /></span>
                        <div>
                            <h2 className="text-[16px] font-bold text-[#152542]">Báo sự cố trên đường</h2>
                            <p className="mt-0.5 text-[13px] text-[#748298]">Gửi nhanh thông tin để hỗ trợ điều phối giao thông.</p>
                        </div>
                    </div>
                    <div className="nc-gps mt-4">
                        <div>
                            <p className="text-[10px] font-extrabold tracking-wide text-[#8490a5]">VỊ TRÍ HIỆN TẠI</p>
                            <p className="mt-0.5 text-[13px] font-semibold text-[#152542]">{coords[1].toFixed(6)}, {coords[0].toFixed(6)}</p>
                            <p className="text-[11px] text-[#8490a5]">{gpsLabel}</p>
                        </div>
                        <button type="button" className="shrink-0 text-[12px] font-semibold text-[#087a69]" onClick={applyGps}>Lấy lại GPS</button>
                    </div>
                    <p className="mt-4 text-[12px] font-semibold text-[#33425c]">Loại sự cố</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                        {REPORT_KINDS.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() => setKind(item.value)}
                                className={`nc-kind ${kind === item.value ? 'is-on' : ''}`}
                            >
                                <span className="inline-flex items-center gap-1.5">
                                    {kind === item.value && <Check size={14} />}
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="mt-4 text-[12px] font-semibold text-[#33425c]">Ghi chú thêm (tuỳ chọn)</p>
                    <textarea
                        className="mt-1.5 w-full rounded-[11px] border border-[#e4ebe6] px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Ví dụ: Nước ngập khoảng 30cm, xe máy khó đi xuyên..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                    />
                    {isAuthenticated ? (
                        <button className="nc-cta mt-4" type="button" disabled={sending} onClick={submit}>
                            {sending ? 'Đang gửi…' : 'Gửi báo cáo'}
                        </button>
                    ) : (
                        <Link href="/login" className="nc-cta mt-4">Đăng nhập để báo cáo</Link>
                    )}
                    {message && <p className="mt-2 text-sm text-[#152542]">{message}</p>}
                    <p className="mt-3 text-center text-[11px] text-[#8a97a9]">Không công khai tên. Vị trí được làm mờ trước khi lưu.</p>
                </section>
            </div>
            {isAuthenticated && (
                <DataCard
                    title="Báo cáo của bạn"
                    subtitle="Theo dõi trạng thái xác minh của các báo cáo đã gửi"
                    toolbar={<span className="rounded-lg bg-[#f4f7fb] px-2.5 py-1 text-[11px] font-semibold text-[#607087]">{mine.length} báo cáo</span>}
                >
                    <DataTable
                        data={mine}
                        emptyMessage="Chưa gửi báo cáo nào"
                        columns={[
                            { key: 'issueType', header: 'Loại sự cố', render: (r) => <span className="font-semibold text-[#152542]">{issueTypeLabel(r.issueType)}</span> },
                            { key: 'note', header: 'Ghi chú', render: (r) => r.note || '—' },
                            { key: 'status', header: 'Trạng thái', render: (r) => (
                                <span className={statusPill(r.status)}>{r.status === 'approved' ? 'Đã xác minh' : issueStatusLabel(r.status)}</span>
                            ) },
                            { key: 'createdAt', header: 'Thời gian', render: (r) => (
                                <span className="inline-flex items-center gap-1 text-[#748298]"><Clock size={13} /> {relativeTimeVi(r.createdAt)}</span>
                            ) },
                        ] satisfies Column<IssueRow>[]}
                    />
                </DataCard>
            )}
        </div>
    );
}
