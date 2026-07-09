import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Package, PlusCircle, TrendingUp } from 'lucide-react';

const tabs = [
  { path: '/', icon: ClipboardList, label: 'Đơn hàng' },
  { path: '/products', icon: Package, label: 'Sản phẩm' },
  { path: '/create', icon: PlusCircle, label: 'Tạo đơn' },
  { path: '/revenue', icon: TrendingUp, label: 'Doanh thu' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="tab-bar">
      {tabs.map(tab => {
        const isActive = tab.path === '/'
          ? location.pathname === '/' || location.pathname.startsWith('/order/')
          : location.pathname.startsWith(tab.path);
        const Icon = tab.icon;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`tab-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="tab-item-icon" size={24} strokeWidth={isActive ? 2 : 1.5} />
            <span className="tab-item-label">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
