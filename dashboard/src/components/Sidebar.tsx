"use client";

import { useState } from "react";
import {
  Command,
  ChevronsUpDown,
  LayoutGrid,
  Layers,
  Rss,
  BarChart2,
  Settings2,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: <LayoutGrid className="w-5 h-5" />,
    href: "/dashboard",
  },
  {
    label: "Fila de Posts",
    icon: <Layers className="w-5 h-5" />,
    href: "/queue",
    badge: 3,
  },
  {
    label: "Fontes RSS",
    icon: <Rss className="w-5 h-5" />,
    href: "/rss",
  },
  {
    label: "Analytics",
    icon: <BarChart2 className="w-5 h-5" />,
    href: "/analytics",
  },
];

export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("/dashboard");

  return (
    <aside className="fixed left-0 top-0 w-72 h-full bg-white border-r border-slate-100 flex flex-col">
      {/* Logo Section */}
      <div className="h-24 flex items-center px-6 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Command className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-slate-900">Agency</span>
            <span className="text-xl text-slate-400">OS</span>
          </div>
        </div>
      </div>

      {/* Account Switcher */}
      <div className="px-4 py-4">
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg">
            <span role="img" aria-label="Soccer ball">
              &#9917;
            </span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-slate-900">FutNews Br</p>
            <p className="text-xs text-slate-500">@futnews_br</p>
          </div>
          <ChevronsUpDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2">
        <p className="px-3 mb-3 text-xs font-medium text-slate-400 uppercase tracking-widest">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeItem === item.href;
            return (
              <li key={item.href}>
                <button
                  onClick={() => setActiveItem(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${
                      isActive
                        ? "bg-black text-white shadow-lg shadow-slate-200"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  {item.icon}
                  <span className="flex-1 text-left text-sm font-medium">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`
                        px-2 py-0.5 text-xs font-semibold rounded-md
                        ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center">
            <span className="text-sm font-semibold text-white">JD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">Jean Dev</p>
            <p className="text-xs text-slate-500">Pro Plan</p>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Settings"
          >
            <Settings2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
