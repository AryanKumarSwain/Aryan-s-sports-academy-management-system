import { COACH_NAV, Sidebar } from '@/components/layout/sidebar';
import { getSession } from '@/lib/session';
import { UserRole } from '@/generated/prisma';
import { redirect } from 'next/navigation';

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== UserRole.COACH) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar items={COACH_NAV} title="Coach Portal" />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
