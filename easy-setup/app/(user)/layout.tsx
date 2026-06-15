import { UserGuard } from '@/components/guards/UserGuard';
import { UserSidebar } from '@/components/navigation/UserSidebar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserGuard>
      <div className="flex min-h-screen">
        <UserSidebar />
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
          {children}
        </main>
      </div>
    </UserGuard>
  );
}
