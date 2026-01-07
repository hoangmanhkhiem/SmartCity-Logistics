'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card, CardBody } from '@/components/ui';
import { authApi } from '@/lib/api';
import { useAuthStore, getDashboardPath } from '@/stores/auth-store';
import { Truck } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const { setAuth } = useAuthStore();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);

        try {
            const response = await authApi.register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
            });
            const { user, accessToken } = response.data;
            setAuth(user, accessToken);
            router.push(getDashboardPath('consumer'));
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md relative bg-white/10 backdrop-blur-xl border-white/20">
                <CardBody className="p-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                            <Truck size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
                        <p className="text-gray-400 mt-1">Đăng ký để sử dụng hệ thống</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Họ và tên"
                            placeholder="Nguyễn Văn A"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                        <Input
                            label="Số điện thoại"
                            placeholder="0912345678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                        <Input
                            label="Mật khẩu"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />
                        <Input
                            label="Xác nhận mật khẩu"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                        />

                        <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                            Đăng ký
                        </Button>
                    </form>

                    {/* Login link */}
                    <p className="mt-6 text-center text-gray-400">
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                            Đăng nhập
                        </Link>
                    </p>
                </CardBody>
            </Card>
        </div>
    );
}
