'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/** The week planner is now part of Today; old links land there. */
export default function Planner() {
  const router = useRouter();
  const { href } = useStore();
  useEffect(() => router.replace(href('/')), [href, router]);
  return null;
}
