'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';
import Map from '@/components/shared/map';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');
        setLoading(true);
        try {
            const response = await authApi.login(formData);
            const { user, accessToken } = response.data;
            setAuth(user, accessToken);
            if (remember) localStorage.setItem('rememberEmail', formData.email);
            else localStorage.removeItem('rememberEmail');
            router.push(getDashboardPath(useAuthStore.getState().currentRole));
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="grid min-h-screen bg-[#f4f7f4] lg:grid-cols-[52%_48%]">
            <section className="relative hidden min-h-screen overflow-hidden bg-[#14352c] text-white lg:block">
                <div className="absolute inset-0 opacity-[0.28]">
                    <Map className="h-full w-full" center={[105.845, 21.028]} zoom={13} />
                </div>
                <div className="absolute inset-0 bg-[#10281f]/82" />
                <div className="absolute bottom-12 left-12 right-16">
                    <p className="text-[13px] font-bold tracking-wide text-[#9fdcc8]">TRƯỜNG ĐẠI HỌC GIAO THÔNG VẬN TẢI</p>
                    <h1 className="mt-4 max-w-md text-4xl font-bold leading-tight">Nền tảng Logistics Đô thị thông minh</h1>
                    <p className="mt-4 max-w-lg text-[15px] leading-6 text-[#cfddd6]">Dữ liệu giao hàng chặng cuối nội đô Hà Nội cho cơ quan quản lý, doanh nghiệp và nhóm nghiên cứu.</p>
                </div>
            </section>

            <section className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-[400px]">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-[26px] font-bold text-[#14211c]">Đăng nhập</h2>
                    <p className="mt-2 text-sm leading-6 text-[#56635d]">Vai trò do tổ chức của bạn cấp. Thành viên tự đăng ký được.</p>

                    {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                    {notice && <p className="mt-4 rounded-lg bg-[#e7f3ee] px-3 py-2 text-sm text-[#0e6e5c]">{notice}</p>}

                    <label className="mt-6 block text-sm text-[#14211c]">
                        Email
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="mt-2 h-[46px] w-full rounded-lg border border-[#d5e0da] bg-white px-3 outline-none focus:border-[#0e6e5c]"
                        />
                    </label>
                    <label className="mt-4 block text-sm text-[#14211c]">
                        Mật khẩu
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-2 h-[46px] w-full rounded-lg border border-[#d5e0da] bg-white px-3 outline-none focus:border-[#0e6e5c]"
                        />
                    </label>

                    <div className="mt-4 flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-[#14211c]">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                            Ghi nhớ
                        </label>
                        <button type="button" className="text-[#0e6e5c] underline" onClick={() => setNotice('Liên hệ quản trị tổ chức để đặt lại mật khẩu.')}>Quên mật khẩu?</button>
                    </div>

                    <button type="submit" disabled={loading} className="mt-5 h-12 w-full rounded-lg bg-[#0e6e5c] text-[15px] font-bold text-white disabled:opacity-60">
                        {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
                    </button>

                    <div className="my-5 flex items-center gap-3 text-[13px] text-[#56635d]">
                        <span className="h-px flex-1 bg-[#d5e0da]" />
                        hoặc
                        <span className="h-px flex-1 bg-[#d5e0da]" />
                    </div>

                    <button type="button" className="h-12 w-full rounded-lg border border-[#d5e0da] bg-white text-[15px] font-bold text-[#14211c]" onClick={() => setNotice('SSO tài khoản trường chưa được nối. Dùng email và mật khẩu.')}>
                        Đăng nhập bằng tài khoản trường (SSO)
                    </button>

                </form>
                    <p className="mt-6 text-sm leading-6 text-[#56635d]">
                        Chưa có tài khoản? <Link href="/register" className="text-[#0e6e5c] underline">Đăng ký thành viên</Link>
                        {' · '}
                        <Link href="/cong-khai" className="text-[#0e6e5c] underline">Xem website công khai</Link>
                    </p>
                    <p className="mt-4 text-xs leading-5 text-[#56635d]">
                        Dữ liệu chỉ dùng cho nghiên cứu và giảng dạy. <Link href="/cong-khai" className="text-[#0e6e5c] underline">Thông báo quyền riêng tư</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
