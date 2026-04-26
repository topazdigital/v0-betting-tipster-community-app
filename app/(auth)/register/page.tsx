'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/contexts/auth-modal-context';

/**
 * Legacy /register route — bounces to the home page and opens the auth modal
 * (Sign-up tab) so users keep the page background visible.
 */
export default function RegisterRedirect() {
  const router = useRouter();
  const { open } = useAuthModal();

  useEffect(() => {
    router.replace('/?auth=register');
    open('register');
  }, [router, open]);

  return null;
}
