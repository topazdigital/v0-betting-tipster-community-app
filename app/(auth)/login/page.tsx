'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/contexts/auth-modal-context';

/**
 * Legacy /login route — now bounces straight to the home page and opens the
 * auth modal so users keep the page background visible (no full-screen white).
 */
export default function LoginRedirect() {
  const router = useRouter();
  const { open } = useAuthModal();

  useEffect(() => {
    router.replace('/?auth=login');
    open('login');
  }, [router, open]);

  return null;
}
