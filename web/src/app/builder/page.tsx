'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useStore } from '@/lib/store';

/** The outfit builder now opens beside the closet; old links land there with the board open. */
export default function Builder() {
  const st = useStore();
  const router = useRouter();
  const { setBuilding, href } = st;
  useEffect(() => {
    setBuilding(true);
    router.replace(href('/closet'));
  }, [setBuilding, href, router]);
  return null;
}
