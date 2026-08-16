import { NavLink } from 'react-router-dom';
import {
  StoreIcon,
  CashRegisterIcon,
  ReceiptIcon,
  PackageIcon,
  ClockIcon,
  SyncIcon,
  SettingsIcon,
} from './icons';

const navItems = [
  { id: 'pos',          label: 'Kasir',      path: '/',              icon: CashRegisterIcon },
  { id: 'transactions', label: 'Transaksi',  path: '/transactions',  icon: ReceiptIcon },
  { id: 'products',     label: 'Produk',     path: '/products',      icon: PackageIcon },
  { id: 'shift',        label: 'Shift',      path: '/shift',         icon: ClockIcon },
  { id: 'sync',         label: 'Sync',       path: '/sync',          icon: SyncIcon },
  { id: 'settings',     label: 'Settings',   path: '/settings',      icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-20 h-full bg-surface-900 border-r border-surface-700 shadow-2xs">
      {/* Logo matching Mobile storefront brand */}
      <div className="flex items-center justify-center h-16 border-b border-surface-700">
        <div className="w-10 h-10 rounded-2xl bg-primary-500 flex items-center justify-center shadow-xs text-white">
          <StoreIcon size={22} />
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1.5 p-2 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              id={`nav-${item.id}`}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-2 py-3 rounded-2xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-bold border border-primary-200/60 shadow-2xs'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                }`
              }
            >
              <Icon size={20} className="transition-transform group-hover:scale-105" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
