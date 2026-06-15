import { SuperAdminGuard } from '@/components/guards/SuperAdminGuard';
import { SuperAdminSidebar } from '@/components/navigation/SuperAdminSidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SuperAdminGuard>
      <div className="flex min-h-screen">
        <SuperAdminSidebar />
        <main className="flex-1 lg:ml-64 min-h-screen bg-gray-950">
          {children}
        </main>
      </div>
    </SuperAdminGuard>
  );
}
