import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency, formatCompact, calculateMonthlyStats,
  calculateOrderTotal, calculateOrderProfit, formatDate,
} from '../utils/calculations';
import { MONTH_NAMES } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';

export default function RevenuePage() {
  const { state, dispatch } = useApp();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const monthStats = useMemo(() =>
    calculateMonthlyStats(state.orders, state.products, monthKey),
    [state.orders, state.products, monthKey]
  );

  const operatingCosts = state.operatingCosts[monthKey] || { advertising: 0, software: 0, other: 0 };
  const totalOperating = Object.values(operatingCosts).reduce((sum, v) => sum + (Number(v) || 0), 0);
  const netProfit = monthStats.totalProfit - totalOperating;

  // Month orders
  const monthOrders = useMemo(() => {
    return state.orders.filter(order => {
      if (!order.createdAt) return false;
      return order.createdAt.substring(0, 7) === monthKey;
    });
  }, [state.orders, monthKey]);

  // Chart data: last 6 months
  const chartData = useMemo(() => {
    const months = [];
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
    return months;
  }, [state.orders, state.products, state.operatingCosts, selectedYear, selectedMonth]);

  const maxChartValue = Math.max(...chartData.map(d => d.revenue), 1);

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const updateOperatingCost = (field, value) => {
    dispatch({
      type: 'UPDATE_OPERATING_COSTS',
      payload: {
        month: monthKey,
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
        {/* Month Selector */}
        <div className="flex-between" style={{
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: 16,
        }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <span className="text-headline">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 4 }}>
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

        {/* Chart */}
        <div className="chart-container">
          <div className="text-subheadline" style={{ fontWeight: 600, marginBottom: 4 }}>
            Biểu đồ 6 tháng
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
        <div className="list-section">
          <div className="list-section-header">Chi phí vận hành tháng</div>
          <div className="list-group">
            <div className="form-row">
              <label>Quảng cáo</label>
              <input
                type="number"
                placeholder="0"
                value={operatingCosts.advertising || ''}
                onChange={e => updateOperatingCost('advertising', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Ứng dụng/PM</label>
              <input
                type="number"
                placeholder="0"
                value={operatingCosts.software || ''}
                onChange={e => updateOperatingCost('software', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Chi phí khác</label>
              <input
                type="number"
                placeholder="0"
                value={operatingCosts.other || ''}
                onChange={e => updateOperatingCost('other', e.target.value)}
              />
            </div>
            <div className="list-item" style={{ background: 'var(--color-bg-tertiary)' }}>
              <span style={{ fontWeight: 600 }}>Tổng chi phí VH</span>
              <span style={{ fontWeight: 700, color: 'var(--color-orange)' }}>{formatCurrency(totalOperating)}</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="list-section">
          <div className="list-section-header">Tổng kết tháng</div>
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
          <div className="list-section">
            <div className="list-section-header">Đơn hàng trong tháng ({monthOrders.length})</div>
            <div className="list-group">
              {monthOrders.map(order => {
                const product = state.products.find(p => p.id === order.productId);
                const printPkg = state.printPackages.find(p => p.id === order.printPackageId);
                const orderTotal = product ? calculateOrderTotal(product, printPkg?.price || 0, order.quantity) : 0;
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
