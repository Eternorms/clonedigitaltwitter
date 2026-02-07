'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/layout/SidebarProvider';

interface MainContentProps {
  children: React.ReactNode;
}

export function MainContent({ children }: MainContentProps) {
  const { toggle } = useSidebar();

  return (
    <main className="flex-1 ml-0 lg:ml-72 p-6 sm:p-8 lg:p-12 max-w-[1400px]">
      <div className="lg:hidden mb-6">
        <button
          onClick={toggle}
          aria-label="Abrir menu"
          className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-soft hover:shadow-hover text-slate-600 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
      {children}
    </main>
  );
}
