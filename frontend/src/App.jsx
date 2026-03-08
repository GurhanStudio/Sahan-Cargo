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

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/offices" element={<Offices />} />
            <Route path="/admin/cargo" element={<CargoRecords />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/reports" element={<Reports />} />
          </Route>

          {/* Origin Office */}
          <Route element={<ProtectedRoute allowedRoles={['ORIGIN_OFFICE']}><Layout /></ProtectedRoute>}>
            <Route path="/origin/register" element={<RegisterCargo />} />
            <Route path="/origin/scan" element={<ScanCargo role="ORIGIN_OFFICE" />} />
            <Route path="/origin/list" element={<CargoList />} />
            <Route path="/origin/track" element={<CargoTrack />} />
          </Route>

          {/* Airport Cargo */}
          <Route element={<ProtectedRoute allowedRoles={['AIRPORT_CARGO']}><Layout /></ProtectedRoute>}>
            <Route path="/airport/scan" element={<ScanCargo role="AIRPORT_CARGO" />} />
            <Route path="/airport/verify" element={<ScanCargo role="AIRPORT_CARGO" />} />
            <Route path="/airport/loaded" element={<CargoList />} />
          </Route>

          {/* Destination Airport */}
          <Route element={<ProtectedRoute allowedRoles={['DESTINATION_AIRPORT']}><Layout /></ProtectedRoute>}>
            <Route path="/dest-airport/scan" element={<ScanCargo role="DESTINATION_AIRPORT" />} />
            <Route path="/dest-airport/arrival" element={<ScanCargo role="DESTINATION_AIRPORT" />} />
          </Route>

          {/* Destination Office */}
          <Route element={<ProtectedRoute allowedRoles={['DESTINATION_OFFICE']}><Layout /></ProtectedRoute>}>
            <Route path="/dest-office/scan" element={<ScanCargo role="DESTINATION_OFFICE" />} />
            <Route path="/dest-office/delivered" element={<CargoList />} />
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
