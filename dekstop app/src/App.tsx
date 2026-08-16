import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import POSPage from './pages/POSPage';
import TransactionsPage from './pages/TransactionsPage';
import ProductsPage from './pages/ProductsPage';
import ShiftPage from './pages/ShiftPage';
import SyncPage from './pages/SyncPage';
import SettingsPage from './pages/SettingsPage';

/**
 * Root application component with routing.
 * Login page and route guards will be added in Part 3.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main layout with sidebar */}
        <Route element={<Layout />}>
          <Route path="/" element={<POSPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/shift" element={<ShiftPage />} />
          <Route path="/sync" element={<SyncPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
