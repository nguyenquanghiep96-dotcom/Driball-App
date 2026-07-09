import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import OrderCard from '../components/OrderCard';
import { formatCurrency, formatCompact, calculateOrderTotal, calculateMonthlyStats, getCurrentMonth } from '../utils/calculations';

const ORDER_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chưa hoàn thành' },
  { key: 'completed', label: 'Đã hoàn thành' },
];

export default function OrdersPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    const currentMonth = getCurrentMonth();
    let orders = state.orders.filter(o => o.createdAt && o.createdAt.startsWith(currentMonth));
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
    return orders;
  }, [state.orders, activeFilter, searchQuery]);

  const monthStats = useMemo(() => {
    return calculateMonthlyStats(state.orders, state.products, getCurrentMonth());
  }, [state.orders, state.products]);

  const totalPending = useMemo(() => {
    return state.orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'completed')
      .reduce((sum, order) => {
        const product = state.products.find(p => p.id === order.productId);
        if (product) {
          const printCost = Number(order.printCost) || Number(order.printPackagePrice) || 0;
          return sum + calculateOrderTotal(product, printCost, order.quantity);
        }
        return sum;
      }, 0);
  }, [state.orders, state.products]);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="header-row">
          <h1 className="text-large-title">Đơn hàng</h1>
          <button
            className="header-action"
            onClick={() => navigate('/create')}
          >
            <Plus size={22} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="page-content">
        <div className="stats-grid">
          <div className="stat-card accent-blue">
            <div className="stat-card-value">{state.orders.length}</div>
            <div className="stat-card-label">Tổng đơn</div>
          </div>
          <div className="stat-card accent-orange">
            <div className="stat-card-value">{formatCompact(totalPending)}</div>
            <div className="stat-card-label">Đang xử lý</div>
          </div>
          <div className="stat-card accent-green">
            <div className="stat-card-value">{formatCompact(monthStats.totalRevenue)}</div>
            <div className="stat-card-label">Doanh thu tháng</div>
          </div>
          <div className="stat-card accent-purple">
            <div className="stat-card-value">{monthStats.completedCount}</div>
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

      {/* Filter Tabs */}
      <div className="filter-scroll">
        {ORDER_TABS.map(t => (
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
