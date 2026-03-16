import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />
      {/* Top bar */}
      <div className="fixed top-0 left-64 right-0 h-12 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/60 flex items-center justify-end px-6 z-30 gap-3">
        <NotificationBell />
        <div className="text-xs text-gray-600">{user?.name}</div>
      </div>
      <main className="ml-64 pt-16 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
