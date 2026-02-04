import { Command } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
            <Command size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">AgencyOS</span>
        </div>
        {children}
      </div>
    </div>
  );
}
