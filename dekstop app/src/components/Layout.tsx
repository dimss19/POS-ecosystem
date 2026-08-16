import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import { useSyncEngine } from '../hooks/useSyncEngine';

/**
 * Main application layout.
 * Sidebar (left) + Content (center) + StatusBar (bottom).
 * Mounts the sync engine hook to run in the background.
 */
export default function Layout() {
  // Initialize background sync engine
  useSyncEngine();

  return (
    <div className="flex h-screen bg-surface-950 text-surface-100">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
}
