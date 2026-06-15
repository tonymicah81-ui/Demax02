import { AdminGuard } from '@/components/guards/AdminGuard';
import { AdminSidebar } from '@/components/navigation/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}
