import { PRICE_TIERS } from './constants';

/**
 * Format number to VND currency string
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('en-US').format(Math.round(amount)) + 'đ';
}

/**
 * Format compact currency (e.g., 1.2M, 500K)
 */
export function formatCompact(amount) {
  if (amount == null || isNaN(amount)) return '0đ';
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K';
  }
  return formatCurrency(amount);
}

/**
 * Calculate total production cost per set
 */
export function calculateProductionCost(product) {
  if (!product?.production) return 0;
  const p = product.production;
  const shirtTotal = p.shirtCost + p.shirtLogo + (p.shirtStamp || 0) + p.shirtLabel + (p.collarCost || 0);
  const pantsTotal = p.pantsCost + p.pantsLogo;
  const baseCost = shirtTotal + pantsTotal;
  const vat = baseCost * p.vat;
  return baseCost + vat + p.labelPackaging + p.shipping + (p.otherCosts || 0);
}

/**
 * Get the selling price based on quantity tier
 */
export function getPriceByQuantity(product, quantity) {
  if (!product?.prices) return 0;
  const tier = PRICE_TIERS.find(t => quantity >= t.min && quantity <= t.max);
  if (tier) return product.prices[tier.key] || 0;
  // If quantity > 50, use lowest tier
  if (quantity > 50) return product.prices.tier3 || 0;
  return product.prices.tier1 || 0;
}

/**
 * Calculate order total = (selling price + print package) × quantity
 */
export function calculateOrderTotal(product, printPackagePrice, quantity) {
  const unitPrice = getPriceByQuantity(product, quantity);
  return (unitPrice + (printPackagePrice || 0)) * quantity;
}

/**
 * Calculate profit for an order
 */
export function calculateOrderProfit(product, printPackagePrice, quantity) {
  const revenue = calculateOrderTotal(product, printPackagePrice, quantity);
  const cost = calculateProductionCost(product) * quantity;
  return revenue - cost;
}

/**
 * Calculate delivery date = deposit date + 14 days
 */
export function calculateDeliveryDate(depositDate) {
  if (!depositDate) return null;
  const date = new Date(depositDate);
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Get short month name
 */
export function getShortMonth(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `T${date.getMonth() + 1}`;
}

/**
 * Generate unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getToday() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate monthly revenue from orders
 */
export function calculateMonthlyStats(orders, products, month) {
  const monthOrders = orders.filter(order => {
    if (!order.createdAt) return false;
    const orderMonth = order.createdAt.substring(0, 7);
    return orderMonth === month;
  });

  const completedOrders = monthOrders.filter(o => o.status === 'completed');

  let totalRevenue = 0;
  let totalProfit = 0;
  let totalQuantity = 0;

  completedOrders.forEach(order => {
    const product = products.find(p => p.id === order.productId);
    if (product) {
      totalRevenue += calculateOrderTotal(product, order.printPackagePrice, order.quantity);
      totalProfit += calculateOrderProfit(product, order.printPackagePrice, order.quantity);
      totalQuantity += order.quantity;
    }
  });

  return {
    totalRevenue,
    totalProfit,
    completedCount: completedOrders.length,
    totalQuantity,
    totalOrders: monthOrders.length,
  };
}
