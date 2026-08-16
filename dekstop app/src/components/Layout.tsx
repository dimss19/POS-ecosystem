import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';

/**
 * Main application layout.
 * Sidebar (left) + Content (center) + StatusBar (bottom).
 */
export default function Layout() {
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
