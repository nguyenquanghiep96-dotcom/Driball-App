import { NavLink, useLocation } from 'react-router-dom';
import { ClipboardList, Package, PlusCircle, TrendingUp, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const tabs = [
  { path: '/', icon: ClipboardList, label: 'Đơn hàng' },
  { path: '/products', icon: Package, label: 'Sản phẩm' },
  { path: '/create', icon: PlusCircle, label: 'Tạo đơn' },
  { path: '/revenue', icon: TrendingUp, label: 'Doanh thu' },
];

export default function BottomNav() {
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await supabase.auth.signOut();
    }
  };

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
      <button 
        className="tab-item" 
        onClick={handleLogout}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
      >
        <LogOut className="tab-item-icon" size={24} strokeWidth={1.5} />
        <span className="tab-item-label">Đăng xuất</span>
      </button>
    </nav>
  );
}
