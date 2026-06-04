'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/validations/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { roleHomePath } from '@/lib/permissions';
import { UserRole } from '@/generated/prisma';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { isSubmitting }   } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { role: 'ACADEMY_ADMIN' as const }
  });
  const role = watch('role');

  const onSubmit = async (data: LoginInput) => {
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.message || 'Login failed');
      return;
    }
    router.push(roleHomePath(json.data.role as UserRole));
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...register('role')}
              >
                <option value="ACADEMY_ADMIN">Academy Admin</option>
                <option value="COACH">Coach</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" {...register('email')} required />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" {...register('password')} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            {role === 'COACH' && (
              <p className="text-center text-xs text-slate-500">Use credentials emailed by your academy.</p>
            )}
            <p className="text-center text-sm">
              <Link href="/register">Register academy</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
