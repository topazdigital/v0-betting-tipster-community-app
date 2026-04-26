import { getCurrentUser } from '@/lib/auth';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminLoginGate } from '@/components/admin/admin-login-gate';

/**
 * Server-side admin layout. The /admin URL is no longer a free pass to the
 * dashboard — every render verifies the auth cookie and bails out to a
 * dedicated login screen for anyone who isn't an admin.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return <AdminLoginGate reason="signin" />;
  }
  if (user.role !== 'admin') {
    return <AdminLoginGate reason="forbidden" />;
  }

  return (
    <AdminShell user={{ displayName: user.displayName || user.username || 'Admin', username: user.username || 'admin', role: user.role }}>
      {children}
    </AdminShell>
  );
}
