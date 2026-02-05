'use client';

import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Command,
  LayoutGrid,
  Layers,
  Rss,
  BarChart2,
  Settings,
  ChevronsUpDown,
  LogOut,
  Loader2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePersona } from '@/lib/contexts/PersonaContext';
import { logout } from '@/app/(auth)/actions';
import type { User, NavItem } from '@/types';

const navigationItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutGrid' },
  { id: 'queue', label: 'Fila de Posts', href: '/queue', icon: 'Layers' },
  { id: 'sources', label: 'Fontes (RSS)', href: '/sources', icon: 'Rss' },
  { id: 'analytics', label: 'Analytics', href: '/analytics', icon: 'BarChart2' },
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  Layers,
  Rss,
  BarChart2,
};

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { activePersona, personas, setActivePersona } = usePersona();
  const [loggingOut, startTransition] = useTransition();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

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
      {activePersona ? (
        <div className="px-6 mb-2 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="w-full flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-white hover:shadow-soft transition-all cursor-pointer group text-left"
          >
            <span className="text-2xl w-12 h-12 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
              {activePersona.emoji}
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">{activePersona.name}</p>
              <p className="text-xs text-slate-500 font-medium">{activePersona.handle}</p>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute left-6 right-6 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-hover z-20 py-1 overflow-hidden">
              {personas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    setActivePersona(persona);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors',
                    persona.id === activePersona.id && 'bg-slate-50'
                  )}
                >
                  <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100">
                    {persona.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{persona.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{persona.handle}</p>
                  </div>
                  {persona.id === activePersona.id && (
                    <Check className="w-4 h-4 text-slate-900" />
                  )}
                </button>
              ))}
              <Link
                href="/persona"
                onClick={() => setShowDropdown(false)}
                className="w-full flex items-center justify-center px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
              >
                Gerenciar Personas
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="px-6 mb-2">
          <Link
            href="/persona"
            className="w-full flex items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all"
          >
            + Criar Persona
          </Link>
        </div>
      )}

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
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
            {user.initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{user.name}</p>
            <p className="text-xs text-slate-500">{user.plan}</p>
          </div>
          <Link href="/settings">
            <Settings className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
          </Link>
        </div>
        <button
          onClick={() => startTransition(() => logout())}
          disabled={loggingOut}
          className="w-full flex items-center gap-2 px-6 py-2 mt-1 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </aside>
  );
}
