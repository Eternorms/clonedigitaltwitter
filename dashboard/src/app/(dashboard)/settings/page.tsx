'use client';

import {
  User,
  Bell,
  Link2,
  Shield,
  Twitter,
  Bot,
  Send,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { currentUser, apiConnections } from '@/lib/mock-data';

const connectionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Twitter,
  Bot,
  Send,
};

export default function SettingsPage() {
  return (
    <>
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Configura\u00E7\u00F5es
        </h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">
          Gerencie sua conta e conex\u00F5es.
        </p>
      </header>

      <div className="space-y-8 max-w-3xl">
        {/* Profile Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <User className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Perfil</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-xl border-4 border-white shadow-sm">
                {currentUser.initials}
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-sm text-slate-500">{currentUser.plan}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Nome
                </label>
                <input
                  type="text"
                  defaultValue={currentUser.name}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="jean@agency.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary">Salvar Altera\u00E7\u00F5es</Button>
            </div>
          </div>
        </section>

        {/* API Connections Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <Link2 className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Conex\u00F5es (API)</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {apiConnections.map((conn) => {
              const Icon = connectionIcons[conn.icon];
              return (
                <div key={conn.id} className="flex items-center gap-4 px-6 py-5 hover:bg-slate-50 transition-colors">
                  <div className={cn(
                    'p-3 rounded-xl',
                    conn.connected ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
                  )}>
                    {Icon && <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{conn.name}</p>
                      {conn.connected && (
                        <Badge variant="scheduled">
                          <Check className="w-3 h-3" />
                          Conectado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{conn.description}</p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-soft">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <Bell className="w-5 h-5 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900">Notifica\u00E7\u00F5es</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { label: 'Novos posts na fila', description: 'Receba alerta quando a IA gerar um novo post', enabled: true },
              { label: 'Posts publicados', description: 'Confirma\u00E7\u00E3o quando um post for publicado', enabled: true },
              { label: 'Erros de publica\u00E7\u00E3o', description: 'Alerta quando houver falha ao publicar', enabled: true },
              { label: 'Relat\u00F3rio di\u00E1rio', description: 'Resumo di\u00E1rio de performance por email', enabled: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <button
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    item.enabled ? 'bg-slate-900' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                      item.enabled ? 'left-6' : 'left-1'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-2xl border border-red-100 shadow-soft">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100">
            <Shield className="w-5 h-5 text-red-400" />
            <h2 className="text-sm font-bold text-red-500">Zona de Perigo</h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Excluir conta</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Todos os dados ser\u00E3o removidos permanentemente.
              </p>
            </div>
            <Button variant="destructive">Excluir Conta</Button>
          </div>
        </section>
      </div>
    </>
  );
}
