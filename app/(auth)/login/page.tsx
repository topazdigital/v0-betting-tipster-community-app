'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthModal } from '@/contexts/auth-modal-context';

/**
 * Legacy /login route — opens the auth modal in place. If the user landed
 * here from another page on the site we send them back there; otherwise we
 * fall back to the home page. Either way the modal opens so the user can
 * sign in without losing context.
 */
export default function LoginRedirect() {
  const router = useRouter();
  const { open } = useAuthModal();

  useEffect(() => {
    open('login');
    if (typeof window === 'undefined') {
      router.replace('/');
      return;
    }
    const ref = document.referrer;
    let target = '/';
    try {
      if (ref) {
        const r = new URL(ref);
        if (r.origin === window.location.origin && r.pathname !== '/login') {
          target = r.pathname + r.search + r.hash;
        }
      }
    } catch { /* fall through to '/' */ }
    router.replace(target);
  }, [router, open]);

  return null;
}
