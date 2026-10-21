'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Role } from './dashboard-shared';

export type DashboardPage =
  | 'Ringkasan'
  | 'Pengajuan saya'
  | 'Ajukan baru'
  | 'Daftar Review'
  | 'Profil & keamanan';

const PAGES_BY_ROLE: Record<Role, readonly DashboardPage[]> = {
  EMPLOYEE: ['Ringkasan', 'Pengajuan saya', 'Ajukan baru', 'Profil & keamanan'],
  MANAGER: ['Ringkasan', 'Daftar Review', 'Profil & keamanan'],
  FINANCE: ['Ringkasan', 'Daftar Review', 'Profil & keamanan'],
};

const DASHBOARD_PATH = '/dashboard';

const PAGE_PATHS: Record<DashboardPage, string> = {
  Ringkasan: DASHBOARD_PATH,
  'Pengajuan saya': '/my-claims',
  'Ajukan baru': '/new-claim',
  'Daftar Review': '/reviews',
  'Profil & keamanan': '/profile',
};

export default function useDashboardNavigation(role: Role) {
  const pages = PAGES_BY_ROLE[role];
  const [activeNav, setActiveNav] = useState<DashboardPage>('Ringkasan');

  useEffect(() => {
    const syncPageFromUrl = () => {
      const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
      const page = pages.find((candidate) => PAGE_PATHS[candidate] === pathname);
      setActiveNav(page ?? 'Ringkasan');
    };

    syncPageFromUrl();
    window.addEventListener('popstate', syncPageFromUrl);

    return () => window.removeEventListener('popstate', syncPageFromUrl);
  }, [pages]);

  const navigateTo = useCallback((page: DashboardPage) => {
    if (!pages.includes(page)) return;

    setActiveNav(page);
    const url = new URL(window.location.href);
    url.pathname = PAGE_PATHS[page];
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.pushState(window.history.state, '', nextUrl);
    }
  }, [pages]);

  return [activeNav, navigateTo] as const;
}
