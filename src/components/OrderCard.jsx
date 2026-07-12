import { useNavigate } from 'react-router-dom';
import { ChevronRight, Image } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { SourceIcon } from './SourceIcon';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, calculateOrderTotal, calculateOrderProfit, calculateDeliveryDate, getPriceByQuantity } from '../utils/calculations';

const TAG_COLORS = {
  'PLAY': { bg: 'rgba(48,209,88,0.15)', color: '#30d158' },
  'PRO': { bg: 'rgba(10,132,255,0.15)', color: '#0a84ff' },
  'ELITE': { bg: 'rgba(191,90,242,0.15)', color: '#bf5af2' },
  'ELITE+': { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a' },
};

export default function OrderCard({ order }) {
  const navigate = useNavigate();
  const { state } = useApp();
  const product = state.products.find(p => p.id === order.productId);
  const printCost = Number(order.printCost) || Number(order.printPackagePrice) || 0;
  const logo3dCost = Number(order.logo3dCost) || 0;

  const total = product ? calculateOrderTotal(order, product) : 0;
  const profit = product ? calculateOrderProfit(order, product) : 0;
  const deliveryDate = calculateDeliveryDate(order.depositDate);
  const tc = TAG_COLORS[product?.tag] || { bg: 'rgba(142,142,147,0.15)', color: '#8e8e93' };
  const unitPrice = order.snapshotUnitPrice ?? (order.overrideUnitPrice !== null && order.overrideUnitPrice !== undefined ? order.overrideUnitPrice : (product ? getPriceByQuantity(product, order.quantity) : 0));
  const colors = product?.colors || [];
  const colorObj = colors.find(c => c.id === order.colorId) || colors[0];
  const thumb = colorObj?.thumbnail || '';

  return (
    <div
      className="card animate-scale-in"
      onClick={() => navigate(`/order/${order.id}`)}
      role="button"
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      {/* Top row: Thumbnail + Customer info */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        {/* Product Thumbnail */}
        <div style={{
          width: 48, height: 48, borderRadius: 10, flexShrink: 0,
          background: thumb ? 'none' : 'var(--color-bg-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {thumb ? (
            <img src={thumb} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Image size={18} color="var(--color-label-quaternary)" />
          )}
        </div>

        {/* Name + details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="text-headline" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {order.customerName || 'Ch\u01b0a \u0111\u1eb7t t\u00ean'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 6px',
                borderRadius: 4, letterSpacing: 0.4,
                background: order.category === 'retail' ? 'rgba(255,159,10,0.18)' : 'rgba(10,132,255,0.13)',
                color: order.category === 'retail' ? '#ff9f0a' : 'var(--color-blue)',
              }}>
                {order.category === 'retail' ? 'B\u00e1n l\u1ebb' : '\u0110\u1eb7t \u0111\u1ed9i'}
              </span>
              {order.source && <SourceIcon source={order.source} size={14} />}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <span className="text-caption1 text-secondary">
              {product?.name || '\u2014'}
            </span>
            {product?.tag && (
              <span style={{
                background: tc.bg, color: tc.color,
                fontSize: 9, fontWeight: 700, padding: '1px 5px',
                borderRadius: 3, letterSpacing: 0.5,
              }}>
                {product.tag}
              </span>
            )}
            {colorObj?.name && (
              <span className="text-caption1 text-tertiary">{'\u2022'} {colorObj.name}</span>
            )}
            <span className="text-caption1 text-tertiary">
              {'\u2022'} {order.quantity} b{'\u1ed9'} {'\u2022'} {formatCurrency(unitPrice)}/b{'\u1ed9'}
            </span>
          </div>
        </div>
      </div>

      {/* Financials */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px 16px',
        marginBottom: 10,
      }}>
        <div>
          <div className="text-caption1 text-tertiary">T{'\u1ed5'}ng {'\u0111\u01a1'}n</div>
          <div className="text-subheadline" style={{ fontWeight: 600 }}>
            {formatCurrency(total)}
          </div>
        </div>
        <div>
          <div className="text-caption1 text-tertiary">L{'\u1ee3'}i nhu{'\u1eadn'}</div>
          <div className="text-subheadline" style={{ fontWeight: 600, color: profit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
            {formatCurrency(profit)}
          </div>
        </div>
      </div>

      {/* Bottom row: Status + Delivery */}
      <div style={{ paddingTop: 8, borderTop: '0.33px solid var(--color-separator)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusBadge status={order.status} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="text-caption1 text-tertiary">
              {deliveryDate ? formatDate(deliveryDate) : '\u2014'}
            </span>
            <ChevronRight size={14} color="var(--color-label-quaternary)" />
          </div>
        </div>
      </div>
    </div>
  );
}
