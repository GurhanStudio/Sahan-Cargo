import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Offices from './pages/admin/Offices';
import CargoRecords from './pages/admin/CargoRecords';
import AuditLogs from './pages/admin/AuditLogs';
import Reports from './pages/admin/Reports';
import RegisterCargo from './pages/origin/RegisterCargo';
import ScanCargo from './pages/origin/ScanCargo';
import CargoList from './pages/origin/CargoList';
import CargoTrack from './pages/origin/CargoTrack';
import ConfirmReceipt from './pages/receiver/ConfirmReceipt';
import QRDispatch from './pages/QRDispatch';

// Shared
import CargoDetail from './pages/shared/CargoDetail';
import DailyVerified from './pages/shared/DailyVerified';
import LoadOnAircraft from './pages/airport/LoadOnAircraft';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' }
        }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/receiver/confirm/:trackingNumber?" element={<ConfirmReceipt />} />
          <Route path="/qr/:trackingNumber" element={<QRDispatch />} />

          {/* ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/offices" element={<Offices />} />
            <Route path="/admin/cargo" element={<CargoRecords />} />
            <Route path="/admin/cargo/:id" element={<CargoDetail />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Route>

          {/* ORIGIN OFFICE — no Scan Cargo */}
          <Route element={<ProtectedRoute allowedRoles={['ORIGIN_OFFICE']}><Layout /></ProtectedRoute>}>
            <Route path="/origin/register" element={<RegisterCargo />} />
            <Route path="/origin/list" element={<CargoList />} />
            <Route path="/origin/track" element={<CargoTrack />} />
            <Route path="/origin/cargo/:id" element={<CargoDetail />} />
            <Route path="/origin/daily-verified" element={<DailyVerified />} />
          </Route>

          {/* AIRPORT CARGO — no Verify Cargo */}
          <Route element={<ProtectedRoute allowedRoles={['AIRPORT_CARGO']}><Layout /></ProtectedRoute>}>
            <Route path="/airport/scan" element={<ScanCargo role="AIRPORT_CARGO" />} />
            <Route path="/airport/load-aircraft" element={<LoadOnAircraft />} />
            <Route path="/airport/loaded" element={<CargoList title="Loaded Cargo" />} />
            <Route path="/airport/cargo/:id" element={<CargoDetail />} />
            <Route path="/airport/daily-verified" element={<DailyVerified />} />
          </Route>

          {/* DESTINATION AIRPORT — Confirm Arrival + Arrival List */}
          <Route element={<ProtectedRoute allowedRoles={['DESTINATION_AIRPORT']}><Layout /></ProtectedRoute>}>
            <Route path="/dest-airport/scan" element={<ScanCargo role="DESTINATION_AIRPORT" />} />
            <Route path="/dest-airport/arrival-list" element={<CargoList title="Arrival List" />} />
            <Route path="/dest-airport/cargo/:id" element={<CargoDetail />} />
            <Route path="/dest-airport/daily-verified" element={<DailyVerified />} />
          </Route>

          {/* DESTINATION OFFICE */}
          <Route element={<ProtectedRoute allowedRoles={['DESTINATION_OFFICE']}><Layout /></ProtectedRoute>}>
            <Route path="/dest-office/scan" element={<ScanCargo role="DESTINATION_OFFICE" />} />
            <Route path="/dest-office/delivered" element={<CargoList title="Delivered Cargo" />} />
            <Route path="/dest-office/cargo/:id" element={<CargoDetail />} />
            <Route path="/dest-office/daily-verified" element={<DailyVerified />} />
          </Route>

          {/* Default */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
