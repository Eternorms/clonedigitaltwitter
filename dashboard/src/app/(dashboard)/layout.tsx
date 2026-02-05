import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { PersonaProvider } from '@/lib/contexts/PersonaContext';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { getCurrentUser, getPersonas } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, personas] = await Promise.all([
    getCurrentUser(),
    getPersonas(),
  ]);

  if (!user) redirect('/login');

  return (
    <PersonaProvider initialPersonas={personas}>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50 flex">
          <Sidebar user={user} />
          <ErrorBoundary>
            <MainContent>{children}</MainContent>
          </ErrorBoundary>
        </div>
      </ToastProvider>
    </PersonaProvider>
  );
}
