'use client';

import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    loading?: boolean;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title = 'Xác nhận',
    message,
    confirmLabel = 'Xóa',
    loading = false,
    danger = true,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className={`shrink-0 rounded-full p-2 ${danger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        <AlertTriangle size={18} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
                </div>
                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        Hủy
                    </Button>
                    <Button type="button" variant={danger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={loading}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
