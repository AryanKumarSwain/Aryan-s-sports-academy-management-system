'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { academyRegisterSchema, type AcademyRegisterInput } from '@/validations/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { SubscriptionTier } from '@/generated/prisma';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<AcademyRegisterInput>({
    resolver: zodResolver(academyRegisterSchema),
    defaultValues: { subscription_tier: SubscriptionTier.FREE }
  });

  const onSubmit = async (data: AcademyRegisterInput) => {
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) {
      setError(json.message || 'Registration failed');
      return;
    }
    router.push('/admin/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Academy registration</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Academy name</label>
              <Input {...register('academy_name')} required />
            </div>
            <div>
              <label className="text-sm font-medium">Owner name</label>
              <Input {...register('owner_name')} required />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" {...register('email')} required />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input {...register('phone_number')} />
            </div>
            <div>
              <label className="text-sm font-medium">Password (optional — emailed if blank)</label>
              <Input type="password" {...register('password')} minLength={6} />
            </div>
            <div>
              <label className="text-sm font-medium">Plan</label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                {...register('subscription_tier')}
              >
                <option value={SubscriptionTier.FREE}>Free</option>
                <option value={SubscriptionTier.PRO}>Pro</option>
                <option value={SubscriptionTier.PLUS}>Plus</option>
              </select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create academy'}
            </Button>
            <p className="text-center text-sm">
              <Link href="/login" className="text-blue-600">
                Already have an account?
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
