'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Command,
  LayoutGrid,
  Layers,
  Rss,
  BarChart2,
  Settings,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigationItems, activePersona, currentUser } from '@/lib/mock-data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Layers,
  Rss,
  BarChart2,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-white flex flex-col fixed h-full z-10 border-r border-slate-100">
      {/* Logo */}
      <div className="h-24 flex items-center px-8">
        <div className="flex items-center gap-3 text-slate-900 font-extrabold text-2xl tracking-tight">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Command className="w-5 h-5" />
          </div>
          Agency<span className="text-slate-400">OS</span>
        </div>
      </div>

      {/* Persona Selector */}
      <div className="px-6 mb-2">
        <button className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-soft transition-all cursor-pointer group text-left">
          <span className="text-2xl w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
            {activePersona.emoji}
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">{activePersona.name}</p>
            <p className="text-xs text-slate-500 font-medium">{activePersona.handle}</p>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 space-y-2 mt-6">
        <div className="px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Menu
        </div>
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-bold',
                isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-4">
                {Icon && <Icon className="w-5 h-5" />}
                {item.label}
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
            {currentUser.initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.plan}</p>
          </div>
          <Settings className="w-5 h-5 text-slate-400" />
        </div>
      </div>
    </aside>
  );
}
