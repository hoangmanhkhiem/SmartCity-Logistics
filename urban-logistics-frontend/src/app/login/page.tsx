'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardBody } from '@/components/ui';
import { authApi } from '@/lib/api';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';
import { Truck } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authApi.login(formData);
            const { user, accessToken } = response.data;
            setAuth(user, accessToken);

            const primaryRole = useAuthStore.getState().currentRole;
            router.push(getDashboardPath(primaryRole));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md relative bg-white shadow-2xl shadow-slate-200/50 border border-slate-100">
                <CardBody className="p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                            <Truck size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">SmartCity Logistics</h1>
                        <p className="text-slate-500 mt-1">Đăng nhập vào hệ thống</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Mật khẩu"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />

                        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                            Đăng nhập
                        </Button>
                    </form>

                    {/* Register link */}
                    <p className="mt-6 text-center text-slate-500">
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Đăng ký
                        </Link>
                    </p>

                    {/* Demo accounts */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center mb-2">Tài khoản demo (mật khẩu: 123456)</p>
                        <div className="grid grid-cols-1 gap-1 text-xs text-slate-500 text-center">
                            <div>admin@platform.vn · regulator@hanoi.gov.vn</div>
                            <div>ops@fastship-cg.vn · shipper1@lastmile.vn · customer1@gmail.com</div>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
