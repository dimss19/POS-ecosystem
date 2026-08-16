import { NavLink } from 'react-router-dom';

const navItems = [
  { id: 'pos',          label: 'Kasir',      path: '/',              icon: '💰' },
  { id: 'transactions', label: 'Transaksi',  path: '/transactions',  icon: '📋' },
  { id: 'products',     label: 'Produk',     path: '/products',      icon: '📦' },
  { id: 'shift',        label: 'Shift',      path: '/shift',         icon: '🕐' },
  { id: 'sync',         label: 'Sync',       path: '/sync',          icon: '🔄' },
  { id: 'settings',     label: 'Settings',   path: '/settings',      icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-20 h-full bg-surface-900 border-r border-surface-700/50">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-surface-700/50">
        <span className="text-2xl font-bold text-primary-400">K</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1 p-2 pt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            id={`nav-${item.id}`}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-300 shadow-sm'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
