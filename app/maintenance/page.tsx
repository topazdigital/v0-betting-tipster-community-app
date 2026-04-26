import { Wrench } from 'lucide-react';
import { getSiteSettings } from '@/lib/site-settings';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
  const settings = await getSiteSettings();
  const message =
    settings.maintenance_message ||
    "We're making the site faster and adding new features. We'll be right back.";
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted px-4">
      <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
          <Wrench className="h-7 w-7 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold">Down for maintenance</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        <p className="mt-6 text-xs text-muted-foreground/70">
          {settings.site_name || 'Betcheza'} — back online shortly.
        </p>
      </div>
    </div>
  );
}
