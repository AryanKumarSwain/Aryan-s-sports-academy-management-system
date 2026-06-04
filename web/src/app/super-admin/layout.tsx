import { SUPER_ADMIN_NAV, Sidebar } from '@/components/layout/sidebar';
import { getSession } from '@/lib/session';
import { UserRole } from '@/generated/prisma';
import { redirect } from 'next/navigation';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== UserRole.SUPER_ADMIN) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={SUPER_ADMIN_NAV} title="Super Admin" />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
