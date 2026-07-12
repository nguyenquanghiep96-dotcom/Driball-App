import { useState } from 'react';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }
      
      // If successful, the AppContext's onAuthStateChange listener will pick up the new session
    } catch (err) {
      console.error('Login error:', err);
      if (err.message === 'Invalid login credentials') {
        setError('Email hoặc mật khẩu không chính xác');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Tài khoản chưa được xác thực email. Hãy vào Supabase bỏ chọn "Confirm email" hoặc xác thực tài khoản nhé.');
      } else {
        setError(`Lỗi: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--color-bg)'
    }}>
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--color-bg-secondary)',
        borderRadius: 24,
        padding: '32px 24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid var(--color-separator)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: 16, 
            background: 'var(--color-blue)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Lock size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Driball Manager</h1>
          <p className="text-tertiary" style={{ margin: 0, fontSize: 14 }}>Hệ thống quản lý nội bộ</p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px', background: 'rgba(255, 69, 58, 0.15)',
            borderRadius: 12, border: '1px solid rgba(255, 69, 58, 0.3)',
            color: 'var(--color-red)', marginBottom: 24, fontSize: 14
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-input-group" style={{ margin: 0 }}>
            <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Mail size={18} color="var(--color-label-tertiary)" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, padding: '4px 0' }}
                autoComplete="email"
                required
              />
            </div>
            <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Lock size={18} color="var(--color-label-tertiary)" />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ flex: 1, padding: '4px 0' }}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              marginTop: 8, height: 48, borderRadius: 12, fontSize: 16, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              'Đang đăng nhập...'
            ) : (
              <>Đăng nhập <LogIn size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
