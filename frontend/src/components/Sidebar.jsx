import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineOfficeBuilding,
  HiOutlineDocumentReport, HiOutlineClipboardList, HiOutlineLogout,
  HiOutlineQrcode, HiOutlineTruck, HiOutlinePlusCircle,
  HiOutlineCheckCircle, HiOutlineSearch, HiOutlineCollection,
  HiOutlineBadgeCheck, HiOutlineClipboard, HiOutlinePaperAirplane,
  HiOutlineX
} from 'react-icons/hi';

const menuByRole = {
  ADMIN: [
    { label: 'Dashboard',     path: '/admin/dashboard',   icon: HiOutlineHome },
    { label: 'Users',         path: '/admin/users',        icon: HiOutlineUsers },
    { label: 'Offices',       path: '/admin/offices',      icon: HiOutlineOfficeBuilding },
    { label: 'Cargo Records', path: '/admin/cargo',        icon: HiOutlineCollection },
    { label: 'Audit Logs',    path: '/admin/audit-logs',   icon: HiOutlineClipboardList },
    { label: 'Reports',       path: '/admin/reports',      icon: HiOutlineDocumentReport },
  ],
  ORIGIN_OFFICE: [
    { label: 'Register Cargo', path: '/origin/register',      icon: HiOutlinePlusCircle },
    { label: 'Cargo List',     path: '/origin/list',           icon: HiOutlineCollection },
    { label: 'Track Cargo',    path: '/origin/track',          icon: HiOutlineSearch },
    { label: 'Daily Verified', path: '/origin/daily-verified', icon: HiOutlineBadgeCheck },
  ],
  AIRPORT_CARGO: [
    { label: 'Scan Cargo',      path: '/airport/scan',          icon: HiOutlineQrcode },
    { label: 'Load on Aircraft',path: '/airport/load-aircraft', icon: HiOutlinePaperAirplane },
    { label: 'Loaded Cargo',    path: '/airport/loaded',        icon: HiOutlineTruck },
    { label: 'Daily Verified',  path: '/airport/daily-verified',icon: HiOutlineBadgeCheck },
  ],
  DESTINATION_AIRPORT: [
    { label: 'Confirm Arrival', path: '/dest-airport/scan',          icon: HiOutlineCheckCircle },
    { label: 'Arrival List',    path: '/dest-airport/arrival-list',  icon: HiOutlineClipboard },
    { label: 'Daily Verified',  path: '/dest-airport/daily-verified',icon: HiOutlineBadgeCheck },
  ],
  DESTINATION_OFFICE: [
    { label: 'Scan Cargo',     path: '/dest-office/scan',           icon: HiOutlineQrcode },
    { label: 'Delivered Cargo',path: '/dest-office/delivered',      icon: HiOutlineTruck },
    { label: 'Daily Verified', path: '/dest-office/daily-verified', icon: HiOutlineBadgeCheck },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = menuByRole[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleNav = () => { if (onClose) onClose(); };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-gray-900/98 backdrop-blur-sm
        border-r border-gray-800 flex flex-col z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <HiOutlineTruck className="text-white text-lg" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Sahan Cargo</h1>
              <p className="text-xs text-gray-500">Tracking System</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
            aria-label="Close menu"
          >
            <HiOutlineX className="text-xl" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNav}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <item.icon className="text-lg flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-2 px-2 py-1">
            <div className="w-8 h-8 bg-primary-600/30 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <HiOutlineLogout className="text-lg flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
