import { useState, useEffect } from 'react';
import { Moon, Sun, LogOut, User, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useApp } from '../context/AppContext';

export default function ProfilePage() {
  const { user } = useApp();
  const [theme, setTheme] = useState(() => localStorage.getItem('driball_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('driball_theme', theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('driball_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await supabase.auth.signOut();
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="text-large-title">Cài đặt</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {/* Account */}
        <div className="form-label">Tài khoản</div>
        <div className="form-input-group">
          <div className="form-row" style={{ gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 20,
              background: 'var(--color-blue)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <User size={20} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-headline" style={{ fontSize: 15 }}>{user?.email || 'Admin'}</div>
              <div className="text-caption1 text-tertiary">Đã đăng nhập</div>
            </div>
            <Shield size={16} color="var(--color-green)" />
          </div>
        </div>

        {/* Appearance */}
        <div className="form-label">Giao diện</div>
        <div className="form-input-group">
          <div
            className="form-row"
            onClick={toggleTheme}
            style={{ cursor: 'pointer' }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              {theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}
            </label>
            <div style={{
              marginLeft: 'auto',
              width: 51, height: 31, borderRadius: 16,
              background: theme === 'light' ? 'var(--color-green)' : 'var(--color-bg-quaternary)',
              position: 'relative', cursor: 'pointer',
              transition: 'background 0.3s',
            }}>
              <div style={{
                width: 27, height: 27, borderRadius: 14,
                background: '#fff',
                position: 'absolute', top: 2,
                left: theme === 'light' ? 22 : 2,
                transition: 'left 0.3s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="form-label">Khác</div>
        <div className="form-input-group">
          <div
            className="form-row"
            onClick={handleLogout}
            style={{ cursor: 'pointer' }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-red)', cursor: 'pointer' }}>
              <LogOut size={18} />
              Đăng xuất
            </label>
            <ChevronRight size={16} color="var(--color-label-quaternary)" style={{ marginLeft: 'auto' }} />
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-label-tertiary)', fontSize: 12 }}>
          Driball Manager v1.0
        </div>
      </div>
    </div>
  );
}
