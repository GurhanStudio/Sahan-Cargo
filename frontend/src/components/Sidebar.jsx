import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineOfficeBuilding,
  HiOutlineDocumentReport, HiOutlineClipboardList, HiOutlineLogout,
  HiOutlineQrcode, HiOutlineTruck, HiOutlinePlusCircle,
  HiOutlineCheckCircle, HiOutlineSearch, HiOutlineCollection
} from 'react-icons/hi';

const menuByRole = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: HiOutlineHome },
    { label: 'Users', path: '/admin/users', icon: HiOutlineUsers },
    { label: 'Offices', path: '/admin/offices', icon: HiOutlineOfficeBuilding },
    { label: 'Cargo Records', path: '/admin/cargo', icon: HiOutlineCollection },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: HiOutlineClipboardList },
    { label: 'Reports', path: '/admin/reports', icon: HiOutlineDocumentReport },
  ],
  ORIGIN_OFFICE: [
    { label: 'Register Cargo', path: '/origin/register', icon: HiOutlinePlusCircle },
    { label: 'Scan Cargo', path: '/origin/scan', icon: HiOutlineQrcode },
    { label: 'Cargo List', path: '/origin/list', icon: HiOutlineCollection },
    { label: 'Track Cargo', path: '/origin/track', icon: HiOutlineSearch },
  ],
  AIRPORT_CARGO: [
    { label: 'Scan Cargo', path: '/airport/scan', icon: HiOutlineQrcode },
    { label: 'Verify Cargo', path: '/airport/verify', icon: HiOutlineCheckCircle },
    { label: 'Loaded Cargo', path: '/airport/loaded', icon: HiOutlineTruck },
  ],
  DESTINATION_AIRPORT: [
    { label: 'Scan Cargo', path: '/dest-airport/scan', icon: HiOutlineQrcode },
    { label: 'Confirm Arrival', path: '/dest-airport/arrival', icon: HiOutlineCheckCircle },
  ],
  DESTINATION_OFFICE: [
    { label: 'Scan Cargo', path: '/dest-office/scan', icon: HiOutlineQrcode },
    { label: 'Delivered Cargo', path: '/dest-office/delivered', icon: HiOutlineTruck },
  ]
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menu = menuByRole[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900/95 backdrop-blur-sm border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
            <HiOutlineTruck className="text-white text-xl" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Sahan Cargo</h1>
            <p className="text-xs text-gray-500">Tracking System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="text-lg" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 bg-primary-600/30 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
          <HiOutlineLogout className="text-lg" />
          Logout
        </button>
      </div>
    </aside>
  );
}
