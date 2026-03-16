import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';

export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top bar */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 h-12 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800/60 flex items-center justify-between px-4 z-30">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <HiOutlineMenuAlt2 className="text-xl" />
        </button>

        {/* Right side: notifications + username */}
        <div className="flex items-center gap-3 ml-auto">
          <NotificationBell />
          <span className="text-xs text-gray-500 hidden sm:block truncate max-w-[140px]">
            {user?.name}
          </span>
        </div>
      </div>

      {/* Main content area */}
      <main className="lg:ml-64 pt-12 p-4 sm:p-6 lg:p-8 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
