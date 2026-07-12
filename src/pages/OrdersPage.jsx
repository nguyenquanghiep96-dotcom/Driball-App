import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import OrderCard from '../components/OrderCard';
import { formatCurrency, formatCompact, calculateOrderTotal, calculateMonthlyStats, getCurrentMonth } from '../utils/calculations';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chưa hoàn thành' },
  { key: 'completed', label: 'Đã hoàn thành' },
];

const CATEGORY_TABS = [
  { key: 'team', label: 'Đặt đội' },
  { key: 'retail', label: 'Bán lẻ' },
];

export default function OrdersPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('team');
  const [searchQuery, setSearchQuery] = useState('');
  const currentMonthStr = getCurrentMonth(); // 'YYYY-MM'
  const [currentY, currentM] = currentMonthStr.split('-');
  const [selectedYear, setSelectedYear] = useState(() => sessionStorage.getItem('driball_orders_year') || currentY);
  const [selectedMonth, setSelectedMonth] = useState(() => sessionStorage.getItem('driball_orders_month') || currentM); // '01' to '12'
  const [yearPickerOpen, setYearPickerOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('driball_orders_year', selectedYear);
    sessionStorage.setItem('driball_orders_month', selectedMonth);
  }, [selectedYear, selectedMonth]);

  const MONTHS = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector('.filter-pill.active');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
    }
  }, []);

  const selectedMonthPrefix = `${selectedYear}-${selectedMonth}`;

  const selectedMonthOrders = useMemo(() => {
    return state.orders.filter(o => o.createdAt && o.createdAt.startsWith(selectedMonthPrefix));
  }, [state.orders, selectedMonthPrefix]);

  const filteredOrders = useMemo(() => {
    let orders = selectedMonthOrders;
    if (categoryFilter !== 'all') {
      orders = orders.filter(o => (o.category || 'team') === categoryFilter);
    }
    if (activeFilter === 'pending') {
      orders = orders.filter(o => o.status !== 'completed');
    } else if (activeFilter === 'completed') {
      orders = orders.filter(o => o.status === 'completed');
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      orders = orders.filter(o =>
        o.customerName?.toLowerCase().includes(q)
      );
    }
    return [...orders].sort((a, b) => {
      const aCompleted = a.status === 'completed' ? 1 : 0;
      const bCompleted = b.status === 'completed' ? 1 : 0;
      if (aCompleted !== bCompleted) return aCompleted - bCompleted;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [selectedMonthOrders, activeFilter, categoryFilter, searchQuery]);

  const monthStats = useMemo(() => {
    return calculateMonthlyStats(state.orders, state.products, selectedMonthPrefix);
  }, [state.orders, state.products, selectedMonthPrefix]);

  const operatingCosts = state.operatingCosts[selectedMonthPrefix] || { advertising: 0, software: 0, other: 0 };
  const totalOperating = Object.values(operatingCosts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const netProfit = monthStats.totalProfit - totalOperating;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="header-row">
          <h1 className="text-large-title">Đơn hàng</h1>
          <div style={{ display: 'flex', gap: 8, position: 'relative' }}>
            <button className="header-action" onClick={() => setYearPickerOpen(!yearPickerOpen)}>
              <Calendar size={22} />
            </button>
            {yearPickerOpen && (
              <div style={{
                position: 'absolute', top: 40, right: 40,
                background: 'var(--color-bg-elevated)',
                borderRadius: 12, padding: 8, zIndex: 100,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid var(--color-separator)',
                minWidth: 100,
              }}>
                {['2025', '2026'].map(y => (
                  <button key={y} onClick={() => { setSelectedYear(y); setYearPickerOpen(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '8px 16px',
                      background: selectedYear === y ? 'var(--color-bg-secondary)' : 'transparent',
                      border: 'none', textAlign: 'center', borderRadius: 8,
                      fontFamily: 'var(--font-family)', fontSize: 15, fontWeight: 500,
                      color: selectedYear === y ? 'var(--color-blue)' : 'var(--color-label)',
                      cursor: 'pointer',
                    }}
                  >
                    Năm {y}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => navigate('/create')}
              style={{ fontWeight: 600, padding: '6px 12px', background: 'var(--color-blue)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}
            >
              Tạo đơn
            </button>
          </div>
        </div>
      </div>

      {/* Month Picker */}
      <div className="filter-scroll" style={{ paddingTop: 0, paddingBottom: 16 }} ref={scrollRef}>
        {MONTHS.map(m => {
          return (
            <button
              key={m}
              className={`filter-pill ${selectedMonth === m ? 'active' : ''}`}
              onClick={() => setSelectedMonth(m)}
              style={{ background: selectedMonth === m ? 'var(--color-blue)' : 'var(--color-bg-secondary)' }}
            >
              Tháng {parseInt(m, 10)}
            </button>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card accent-green">
            <div className="stat-card-value" style={{ color: '#ffffff' }}>{formatCompact(monthStats.totalRevenue)}</div>
            <div className="stat-card-label">Doanh thu</div>
          </div>
          <div className="stat-card accent-orange">
            <div className="stat-card-value" style={{ color: '#ffffff' }}>{formatCompact(netProfit)}</div>
            <div className="stat-card-label">Lợi nhuận ròng</div>
          </div>
          <div className="stat-card accent-blue">
            <div className="stat-card-value" style={{ color: '#ffffff' }}>{monthStats.totalOrders}</div>
            <div className="stat-card-label">Tổng đơn</div>
          </div>
          <div className="stat-card accent-purple">
            <div className="stat-card-value" style={{ color: '#ffffff' }}>{monthStats.completedCount}</div>
            <div className="stat-card-label">Hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-bar-wrapper">
          <Search className="search-bar-icon" size={16} />
          <input
            type="text"
            placeholder="Tìm khách hàng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category + Status Filters */}
      <div className="filter-scroll">
        {CATEGORY_TABS.map(t => (
          <button
            key={t.key}
            className={`filter-pill ${categoryFilter === t.key ? 'active' : ''}`}
            onClick={() => setCategoryFilter(t.key)}
            style={{
              background: categoryFilter === t.key
                ? (t.key === 'retail' ? '#ff9f0a' : t.key === 'team' ? 'var(--color-blue)' : 'var(--color-blue)')
                : 'var(--color-bg-secondary)'
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--color-separator)', margin: '0 4px', alignSelf: 'stretch' }} />
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            className={`filter-pill ${activeFilter === t.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="page-content" style={{ paddingTop: 8 }}>
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package className="empty-state-icon" />
            <div className="empty-state-title">Chưa có đơn hàng</div>
            <div className="empty-state-text">
              {searchQuery || activeFilter !== 'all'
                ? 'Không tìm thấy đơn hàng phù hợp'
                : 'Tạo đơn hàng đầu tiên để bắt đầu'}
            </div>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}
