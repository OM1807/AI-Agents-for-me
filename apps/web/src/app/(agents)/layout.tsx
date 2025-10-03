import MainLayout from '@/components/layout/MainLayout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Providers } from '@/lib/providers/Providers';
import { HeaderTitleManager } from '@/components/shared/HeaderTitleManager';

interface DashboardLayoutPageProps {
  children: React.ReactNode;
}

export default function DashboardLayoutPage({
  children,
}: DashboardLayoutPageProps) {
  return (
    <Providers>
      <HeaderTitleManager />
      <AuthGuard>
        <MainLayout>{children}</MainLayout>
      </AuthGuard>
    </Providers>
  );
}
