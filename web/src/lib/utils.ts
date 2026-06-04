import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = 'INR') {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value || 0);
}

export function fullName(parts: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  name?: string;
}) {
  const composed = [parts.first_name, parts.middle_name, parts.last_name]
    .filter(Boolean)
    .join(' ');
  return composed || parts.name || '';
}
