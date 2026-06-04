'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  trend?: string;
  className?: string;
};

export function StatCard({ title, value, description, href, trend, className }: StatCardProps) {
  const inner = (
    <Card
      className={cn(
        'transition hover:border-blue-300 hover:shadow-md',
        href && 'cursor-pointer',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-bold tabular-nums">{value}</CardTitle>
      </CardHeader>
      {(description || trend) && (
        <CardContent className="pt-0 text-sm text-slate-500">
          {trend && <span className="text-emerald-600">{trend} </span>}
          {description}
        </CardContent>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}
