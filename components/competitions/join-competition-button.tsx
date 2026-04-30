'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useAuthModal } from '@/contexts/auth-modal-context';
import { Check, ChevronRight, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Props {
  slug: string;
  isFull?: boolean;
  isCompleted?: boolean;
}

export function JoinCompetitionButton({ slug, isFull, isCompleted }: Props) {
  const { open: openAuthModal } = useAuthModal();
  const { data: meRes } = useSWR<{ user?: { id: number } | null }>('/api/auth/me', fetcher);
  const { data: joinRes, mutate } = useSWR<{ joined: boolean }>(
    `/api/competitions/${slug}/join`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    if (joinRes?.joined) setJustJoined(true);
  }, [joinRes?.joined]);

  const handleJoin = async () => {
    setError(null);
    if (!meRes?.user) {
      openAuthModal('login');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`/api/competitions/${slug}/join`, { method: 'POST' });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.success) {
        setError(data.error || 'Could not join competition.');
        return;
      }
      setJustJoined(true);
      mutate();
    } catch (e) {
      setError('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <Button size="sm" className="h-7 text-xs" disabled>
        Competition ended
      </Button>
    );
  }
  if (justJoined) {
    return (
      <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-500/90 text-white" disabled>
        <Check className="mr-1 h-3 w-3" /> Joined
      </Button>
    );
  }
  if (isFull) {
    return (
      <Button size="sm" className="h-7 text-xs" disabled>
        Competition full
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" className="h-7 text-xs" onClick={handleJoin} disabled={submitting}>
        {submitting ? (
          <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Joining…</>
        ) : (
          <>Join Competition<ChevronRight className="ml-1 h-3 w-3" /></>
        )}
      </Button>
      {error && <p className="text-[10px] text-rose-500">{error}</p>}
    </div>
  );
}
