import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import TransactionsPage from './pages/TransactionsPage';
import ProductsPage from './pages/ProductsPage';
import ShiftPage from './pages/ShiftPage';
import SyncPage from './pages/SyncPage';
import SettingsPage from './pages/SettingsPage';

/**
 * Root application component with routing.
 * Login is public. All other routes require authentication.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with sidebar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<POSPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/shift" element={<ShiftPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
