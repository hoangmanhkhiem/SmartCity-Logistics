'use client';

import { Input } from './input';

interface DatePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    min?: string;
    max?: string;
    className?: string;
}

/** Wrapper mỏng quanh <input type="date"> — giữ style nhất quán với Input, tránh thêm dependency calendar. */
export function DatePicker({ label, value, onChange, error, min, max, className }: DatePickerProps) {
    return (
        <Input
            type="date"
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            min={min}
            max={max}
            className={className}
        />
    );
}

interface TimePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    className?: string;
}

export function TimePicker({ label, value, onChange, error, className }: TimePickerProps) {
    return (
        <Input
            type="time"
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            className={className}
        />
    );
}

interface DateTimePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    className?: string;
}

export function DateTimePicker({ label, value, onChange, error, className }: DateTimePickerProps) {
    return (
        <Input
            type="datetime-local"
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            className={className}
        />
    );
}
