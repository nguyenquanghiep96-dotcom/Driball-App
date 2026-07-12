import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, formatCompact, calculateMonthlyStats,
  calculateOrderTotal, calculateOrderProfit, formatDate,
} from '../utils/calculations';
import { MONTH_NAMES } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';

function MoneyInput({ value, onChange, placeholder, style }) {
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused
    ? (value || '')
    : (value ? new Intl.NumberFormat('en-US').format(value) + 'đ' : '');
  return (
    <input
      type={isFocused ? 'number' : 'text'}
      inputMode="numeric"
      value={displayValue}
      placeholder={placeholder || '0'}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={e => onChange(e.target.value)}
      style={style}
    />
  );
}

export default function RevenuePage() {
  const { state, dispatch } = useApp();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'

  const filterKey = viewMode === 'year' 
    ? `${selectedYear}`
    : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  const monthStats = useMemo(() =>
    calculateMonthlyStats(state.orders, state.products, filterKey),
    [state.orders, state.products, filterKey]
  );

  const operatingCosts = state.operatingCosts[filterKey] || { advertising: 0, software: 0, other: 0 };
  const totalOperating = useMemo(() => {
    if (viewMode === 'month') {
      const costs = state.operatingCosts[filterKey] || { advertising: 0, software: 0, other: 0 };
      return Object.values(costs).reduce((sum, v) => sum + (Number(v) || 0), 0);
    } else {
      let total = 0;
      for (let i = 1; i <= 12; i++) {
        const key = `${selectedYear}-${String(i).padStart(2, '0')}`;
        const costs = state.operatingCosts[key];
        if (costs) {
          total += Object.values(costs).reduce((sum, v) => sum + (Number(v) || 0), 0);
        }
      }
      return total;
    }
  }, [state.operatingCosts, filterKey, viewMode, selectedYear]);

  const netProfit = monthStats.totalProfit - totalOperating;

  // Month orders
  const monthOrders = useMemo(() => {
    return state.orders.filter(order => {
      if (!order.createdAt) return false;
      const orderKey = viewMode === 'year' ? order.createdAt.substring(0, 4) : order.createdAt.substring(0, 7);
      return orderKey === filterKey;
    });
  }, [state.orders, filterKey, viewMode]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const calc = (cat) => {
      const orders = monthOrders.filter(o => (o.category || 'team') === cat);
      const revenue = orders.reduce((sum, o) => {
        const product = state.products.find(p => p.id === o.productId);
        return sum + (product ? calculateOrderTotal(o, product) : 0);
      }, 0);
      const profit = orders.reduce((sum, o) => {
        const product = state.products.find(p => p.id === o.productId);
        return sum + (product ? calculateOrderProfit(o, product) : 0);
      }, 0);
      return { revenue, profit, count: orders.length };
    };
    return { team: calc('team'), retail: calc('retail') };
  }, [monthOrders, state.products]);

  // Chart data
  const chartData = useMemo(() => {
    const months = [];
    if (viewMode === 'year') {
      for (let i = 1; i <= 12; i++) {
        const key = `${selectedYear}-${String(i).padStart(2, '0')}`;
        const stats = calculateMonthlyStats(state.orders, state.products, key);
        const opCosts = state.operatingCosts[key] || { advertising: 0, software: 0, other: 0 };
        const totalOp = Object.values(opCosts).reduce((s, v) => s + (Number(v) || 0), 0);
        months.push({
          label: `T${i}`,
          revenue: stats.totalRevenue,
          profit: stats.totalProfit - totalOp,
        });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selectedYear, selectedMonth - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const stats = calculateMonthlyStats(state.orders, state.products, key);
        const opCosts = state.operatingCosts[key] || { advertising: 0, software: 0, other: 0 };
        const totalOp = Object.values(opCosts).reduce((s, v) => s + (Number(v) || 0), 0);
        months.push({
          label: `T${d.getMonth() + 1}`,
          revenue: stats.totalRevenue,
          profit: stats.totalProfit - totalOp,
        });
      }
    }
    return months;
  }, [state.orders, state.products, state.operatingCosts, selectedYear, selectedMonth, viewMode]);

  const maxChartValue = Math.max(...chartData.map(d => d.revenue), 1);

  const prevTime = () => {
    if (viewMode === 'year') {
      setSelectedYear(prev => prev - 1);
    } else {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    }
  };

  const nextTime = () => {
    if (viewMode === 'year') {
      setSelectedYear(prev => prev + 1);
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    }
  };

  const updateOperatingCost = (field, value) => {
    dispatch({
      type: 'UPDATE_OPERATING_COSTS',
      payload: {
        month: filterKey,
        costs: { ...operatingCosts, [field]: Number(value) || 0 },
      },
    });
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-large-title">Doanh thu</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button 
            onClick={() => setViewMode('month')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: viewMode === 'month' ? 'var(--color-blue)' : 'var(--color-bg-secondary)', color: viewMode === 'month' ? '#fff' : 'var(--color-label)', fontWeight: 600, cursor: 'pointer' }}
          >Theo tháng</button>
          <button 
            onClick={() => setViewMode('year')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: viewMode === 'year' ? 'var(--color-blue)' : 'var(--color-bg-secondary)', color: viewMode === 'year' ? '#fff' : 'var(--color-label)', fontWeight: 600, cursor: 'pointer' }}
          >Cả năm</button>
        </div>

        {/* Time Selector */}
        <div className="flex-between" style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: 16,
        }}>
          <button onClick={prevTime} style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <span className="text-headline">
            {viewMode === 'year' ? `Năm ${selectedYear}` : `${MONTH_NAMES[selectedMonth]} ${selectedYear}`}
          </span>
          <button onClick={nextTime} style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 4 }}>
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card accent-blue">
            <div className="stat-card-value">{formatCompact(monthStats.totalRevenue)}</div>
            <div className="stat-card-label">Doanh thu</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-card-value">{formatCompact(netProfit)}</div>
            <div className="stat-card-label">Lợi nhuận ròng</div>
          </div>
          <div className="stat-card accent-purple">
            <div className="stat-card-value">{monthStats.completedCount}</div>
            <div className="stat-card-label">Đơn hoàn thành</div>
          </div>
          <div className="stat-card accent-teal">
            <div className="stat-card-value">{monthStats.totalQuantity}</div>
            <div className="stat-card-label">SP đã bán</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{
          background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)',
          padding: '14px 16px', marginBottom: 16,
        }}>
          <div className="text-subheadline" style={{ fontWeight: 600, marginBottom: 12 }}>Phân loại</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { key: 'team', label: 'Đặt đội', color: 'var(--color-blue)', bg: 'rgba(10,132,255,0.1)' },
              { key: 'retail', label: 'Bán lẻ', color: '#ff9f0a', bg: 'rgba(255,159,10,0.1)' },
            ].map(cat => {
              const stats = categoryStats[cat.key];
              return (
                <div key={cat.key} style={{
                  background: cat.bg, borderRadius: 12, padding: '12px 14px',
                  border: `1px solid ${cat.color}30`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cat.color, marginBottom: 6, letterSpacing: 0.4 }}>
                    {cat.label} • {stats.count} đơn
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                    {formatCompact(stats.revenue)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-label-secondary)' }}>
                    LN: {formatCompact(stats.profit)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container">
          <div className="text-subheadline" style={{ fontWeight: 600, marginBottom: 4 }}>
            Biểu đồ {viewMode === 'year' ? '12 tháng' : '6 tháng'}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-blue)' }} />
              <span className="text-caption2 text-tertiary">Doanh thu</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--color-green)' }} />
              <span className="text-caption2 text-tertiary">Lợi nhuận</span>
            </div>
          </div>
          <div className="chart-bars">
            {chartData.map((d, i) => (
              <div className="chart-bar-group" key={i}>
                <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
                  <div
                    className="chart-bar revenue"
                    style={{ height: `${(d.revenue / maxChartValue) * 100}%`, flex: 1, maxWidth: 16 }}
                  />
                  <div
                    className="chart-bar profit"
                    style={{ height: `${Math.max(0, d.profit) / maxChartValue * 100}%`, flex: 1, maxWidth: 16 }}
                  />
                </div>
                <span className="chart-bar-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Costs */}
        {viewMode === 'month' && (
          <div className="list-section">
            <div className="list-section-header">Chi phí vận hành tháng</div>
            <div className="list-group">
              <div className="form-row">
                <label>Quảng cáo</label>
                <MoneyInput
                  placeholder="0"
                  value={operatingCosts.advertising || ''}
                  onChange={v => updateOperatingCost('advertising', v)}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-row">
                <label>Ứng dụng/PM</label>
                <MoneyInput
                  placeholder="0"
                  value={operatingCosts.software || ''}
                  onChange={v => updateOperatingCost('software', v)}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="form-row">
                <label>Chi phí khác</label>
                <MoneyInput
                  placeholder="0"
                  value={operatingCosts.other || ''}
                  onChange={v => updateOperatingCost('other', v)}
                  style={{ textAlign: 'right' }}
                />
              </div>
              <div className="list-item" style={{ background: 'var(--color-bg-tertiary)' }}>
                <span style={{ fontWeight: 600 }}>Tổng chi phí VH</span>
                <span style={{ fontWeight: 700, color: 'var(--color-orange)' }}>{formatCurrency(totalOperating)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Breakdown */}
        <div className="list-section">
          <div className="list-section-header">Tổng kết {viewMode === 'year' ? 'năm' : 'tháng'}</div>
          <div className="list-group">
            <div className="list-item">
              <span className="list-item-label">Doanh thu</span>
              <span style={{ color: 'var(--color-blue)', fontWeight: 600 }}>{formatCurrency(monthStats.totalRevenue)}</span>
            </div>
            <div className="list-item">
              <span className="list-item-label">Lợi nhuận gộp</span>
              <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{formatCurrency(monthStats.totalProfit)}</span>
            </div>
            <div className="list-item">
              <span className="list-item-label">Chi phí vận hành</span>
              <span style={{ color: 'var(--color-orange)', fontWeight: 600 }}>-{formatCurrency(totalOperating)}</span>
            </div>
            <div className="list-item" style={{ background: 'var(--color-bg-tertiary)' }}>
              <span style={{ fontWeight: 600 }}>Lợi nhuận ròng</span>
              <span style={{ fontWeight: 700, color: netProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Orders List */}
        {monthOrders.length > 0 && (
          <div className="list-section" style={{ paddingBottom: 32 }}>
            <div className="list-section-header">Đơn hàng trong {viewMode === 'year' ? 'năm' : 'tháng'} ({monthOrders.length})</div>
            <div className="list-group">
              {monthOrders.map(order => {
                const product = state.products.find(p => p.id === order.productId);
                const printPkg = state.printPackages.find(p => p.id === order.printPackageId);
                const orderTotal = product ? calculateOrderTotal(order, product) : 0;
                return (
                  <div className="list-item" key={order.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4, padding: '12px 16px' }}>
                    <div className="flex-between">
                      <span className="text-subheadline" style={{ fontWeight: 600 }}>{order.customerName}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex-between">
                      <span className="text-caption1 text-tertiary">
                        {product?.name} • {order.quantity} bộ • {formatDate(order.createdAt)}
                      </span>
                      <span className="text-subheadline" style={{ fontWeight: 600 }}>{formatCurrency(orderTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
