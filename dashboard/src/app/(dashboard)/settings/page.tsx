import { getCurrentUser } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { SettingsContent } from './SettingsContent';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <SettingsContent user={user} />;
}
