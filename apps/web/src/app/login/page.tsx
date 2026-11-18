'use client';

import { Inter } from 'next/font/google';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/api';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';
import { canAccessPath } from '@/lib/route-access';
import { LoginBrandPanel } from '@/components/auth/login-brand-panel';

const inter = Inter({
    subsets: ['latin', 'vietnamese'],
    weight: ['400', '500', '600', '700'],
});

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAuth } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('rememberEmail');
        if (saved) setFormData((prev) => ({ ...prev, email: saved }));
    }, []);

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
            const role = useAuthStore.getState().currentRole;
            const rawRole = useAuthStore.getState().user?.memberships?.[0]?.role?.name;
            const next = searchParams.get('next');
            if (next?.startsWith('/') && !next.startsWith('//') && canAccessPath(next, role, rawRole)) {
                router.push(next);
            } else {
                router.push(getDashboardPath(role));
            }
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={`${inter.className} min-h-screen bg-[#f4f7fc] p-4 lg:flex lg:gap-0`}>
            <LoginBrandPanel />

            <section className="relative flex min-h-[calc(100vh-32px)] flex-1 flex-col px-6 py-8 lg:px-0">
                <Link
                    href="/cong-khai"
                    className="ml-auto flex items-center gap-2 text-xs font-medium text-[#40516a] lg:mr-10"
                >
                    Xem website công khai
                    <img src="/login/icon-external.svg" alt="" width={15} height={15} />
                </Link>

                <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
                    <span className="inline-flex h-7 w-fit items-center rounded-[14px] bg-[#eaf0ff] px-3.5 text-[9px] font-semibold tracking-[0.8px] text-[#2859d5]">
                        CỔNG DỮ LIỆU LOGISTICS
                    </span>
                    <h2 className="mt-4 text-[34px] font-semibold leading-[1.45] text-[#0d1d3c]">Chào mừng trở lại</h2>
                    <p className="mt-3 text-sm leading-[1.45] text-[#68778d]">
                        Đăng nhập để khám phá dữ liệu đô thị.
                        <br />
                        Vai trò do tổ chức của bạn cấp.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-8">
                        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                        {notice && <p className="mb-4 rounded-lg bg-[#eaf0ff] px-3 py-2 text-sm text-[#2859d5]">{notice}</p>}

                        <label className="block text-[13px] font-semibold text-[#263b5d]">
                            Email
                            <span className="relative mt-2 block">
                                <img src="/login/icon-mail.svg" alt="" width={20} height={20} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    placeholder="ten@utc.edu.vn"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-14 w-full rounded-[10px] border border-[#d8e1f0] bg-white pl-[52px] pr-4 text-sm text-[#0d1d3c] outline-none placeholder:text-[#68778d] focus:border-[#2859d5]"
                                />
                            </span>
                        </label>

                        <label className="mt-5 block text-[13px] font-semibold text-[#263b5d]">
                            Mật khẩu
                            <span className="relative mt-2 block">
                                <img src="/login/icon-lock.svg" alt="" width={20} height={20} className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Nhập mật khẩu của bạn"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="h-14 w-full rounded-[10px] border border-[#d8e1f0] bg-white px-12 text-sm text-[#0d1d3c] outline-none placeholder:text-[#68778d] focus:border-[#2859d5]"
                                />
                                <button
                                    type="button"
                                    className="absolute right-[18px] top-1/2 -translate-y-1/2"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    onClick={() => setShowPassword((v) => !v)}
                                >
                                    <img src="/login/icon-eye.svg" alt="" width={20} height={20} />
                                </button>
                            </span>
                        </label>

                        <div className="mt-4 flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2 text-xs text-[#40516a]">
                                <span className="relative inline-flex size-[18px] items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        className="peer absolute inset-0 cursor-pointer opacity-0"
                                    />
                                    <span className="flex size-[18px] items-center justify-center rounded-[5px] border border-[#d8e1f0] bg-white peer-checked:border-[#316bff] peer-checked:bg-[#316bff]">
                                        {remember && <img src="/login/icon-check.svg" alt="" width={14} height={14} />}
                                    </span>
                                </span>
                                Ghi nhớ đăng nhập
                            </label>
                            <button
                                type="button"
                                className="text-xs font-semibold text-[#316bff]"
                                onClick={() => setNotice('Liên hệ quản trị tổ chức để đặt lại mật khẩu.')}
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="relative mt-6 flex h-14 w-full items-center justify-center rounded-[10px] bg-[#2859d5] text-sm font-semibold text-white disabled:opacity-60"
                        >
                            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
                            <img src="/login/icon-arrow.svg" alt="" width={18} height={18} className="absolute right-6" />
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3 text-xs text-[#68778d]">
                        <span className="h-px flex-1 bg-[#e0e7f2]" />
                        hoặc
                        <span className="h-px flex-1 bg-[#e0e7f2]" />
                    </div>

                    <button
                        type="button"
                        className="relative flex h-14 w-full items-center justify-center rounded-[10px] border border-[#d8e1f0] bg-white text-xs font-semibold text-[#263b5d]"
                        onClick={() => setNotice('SSO tài khoản trường chưa được nối. Dùng email và mật khẩu.')}
                    >
                        <img src="/login/icon-school.svg" alt="" width={20} height={20} className="absolute left-[23px]" />
                        Đăng nhập bằng tài khoản trường (SSO)
                    </button>

                    <p className="mt-6 text-center text-xs text-[#68778d]">
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="font-semibold text-[#316bff]">
                            Đăng ký thành viên
                        </Link>
                    </p>
                    <p className="mt-1 text-center text-[11px] text-[#68778d]">Thành viên có thể tự đăng ký tài khoản.</p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-1 pb-2 text-center">
                    <p className="flex items-center gap-1.5 text-[10px] text-[#68778d]">
                        <img src="/login/icon-shield.svg" alt="" width={15} height={15} />
                        Dữ liệu chỉ dùng cho nghiên cứu và giảng dạy.
                    </p>
                    <Link href="/cong-khai" className="text-[10px] font-medium text-[#40516a]">
                        Thông báo quyền riêng tư
                    </Link>
                </div>
            </section>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#f4f7fc]" />}>
            <LoginForm />
        </Suspense>
    );
}
