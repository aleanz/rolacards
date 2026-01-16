'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CheckRolePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Redirigir según el rol
    if (session.user.role === 'CLIENTE') {
      router.push('/');
    } else {
      router.push('/admin/dashboard');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-rola-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Redirigiendo...</p>
      </div>
    </div>
  );
}
