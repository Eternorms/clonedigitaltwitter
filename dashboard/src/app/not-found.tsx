import Link from 'next/link';
import { Command, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Command className="w-8 h-8" />
        </div>

        <h1 className="text-7xl font-extrabold text-slate-900 tracking-tight mb-4">
          404
        </h1>

        <h2 className="text-xl font-extrabold text-slate-900 mb-3">
          Página não encontrada
        </h2>

        <p className="text-slate-500 font-medium mb-8">
          A página que você está procurando não existe ou foi movida para outro endereço.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-xl px-6 py-3 text-sm font-bold shadow-xl shadow-slate-200 hover:-translate-y-0.5 transition-transform focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
