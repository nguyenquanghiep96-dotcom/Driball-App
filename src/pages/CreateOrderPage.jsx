import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Image, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STATUSES } from '../utils/constants';
import { formatCurrency, calculateProductionCost, getPriceByQuantity, getToday, calculateDeliveryDate } from '../utils/calculations';
import { SourcePicker } from '../components/SourceIcon';

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

export default function CreateOrderPage() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: '',
    shippingAddress: '',
    productId: state.products[0]?.id || '',
    colorId: state.products[0]?.colors?.[0]?.id || '',
    category: 'team',
    printCost: 30000,
    logo3dCost: 0,
    outsourceCost: 30000,
    overrideUnitPrice: null,
    overrideProdCost: null,
    quantity: 10,
    deposit: 0,
    depositDate: getToday(),
    status: 'demo',
    source: '',
    notes: '',
    createdAt: getToday(),
  });

  const product = state.products.find(p => p.id === form.productId);
  const retailPrice = product?.prices?.tier1 || 0;
  const isRetail = form.category === 'retail';
  const baseUnitPrice = isRetail
    ? (product?.prices?.tier1 || 0)
    : (product ? getPriceByQuantity(product, form.quantity) : 0);
  const unitPrice = form.overrideUnitPrice !== null ? Number(form.overrideUnitPrice) : baseUnitPrice;
  const printCost = Number(form.printCost) || 0;
  const logo3dCost = Number(form.logo3dCost) || 0;
  const outsourceCost = Number(form.outsourceCost) || 0;
  const unitAfterPrint = unitPrice + printCost + logo3dCost;
  const total = unitAfterPrint * form.quantity;
  const baseProdCost = product ? calculateProductionCost(product) : 0;
  const prodCost = form.overrideProdCost !== null ? Number(form.overrideProdCost) : baseProdCost;
  const profitPerUnit = unitAfterPrint - prodCost - outsourceCost;
  const totalProfit = profitPerUnit * form.quantity;
  const deliveryDate = calculateDeliveryDate(form.depositDate);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const TAG_COLORS = {
    'PLAY': { bg: 'rgba(48,209,88,0.15)', color: '#30d158' },
    'PRO': { bg: 'rgba(10,132,255,0.15)', color: '#0a84ff' },
    'ELITE': { bg: 'rgba(191,90,242,0.15)', color: '#bf5af2' },
    'ELITE+': { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a' },
  };

  const updateField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'printCost' || field === 'logo3dCost') {
        const pC = field === 'printCost' ? Number(value) : Number(prev.printCost);
        const lC = field === 'logo3dCost' ? Number(value) : Number(prev.logo3dCost);
        next.outsourceCost = (pC || 0) + (lC || 0);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.customerName.trim()) {
      alert('Vui lòng nhập tên khách hàng');
      return;
    }
    dispatch({
      type: 'ADD_ORDER',
      payload: {
        ...form,
        deposit: Number(form.deposit) || 0,
        quantity: Number(form.quantity) || 1,
        printCost,
        logo3dCost,
        outsourceCost,
        overrideUnitPrice: form.overrideUnitPrice !== null ? form.overrideUnitPrice : unitPrice,
        overrideProdCost: form.overrideProdCost !== null ? form.overrideProdCost : prodCost,
      },
    });
    navigate('/');
  };

  const statusOptions = STATUSES.filter(s => s.key !== 'all');

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="header-row">
          <button className="header-action" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
            Quay lại
          </button>
          <button
            className="header-action"
            style={{ fontWeight: 600 }}
            onClick={handleSubmit}
          >
            Lưu
          </button>
        </div>
        <h1 className="text-large-title" style={{ marginTop: 8 }}>Tạo đơn mới</h1>
      </div>

      {/* Form */}
      <div className="page-content">
        {/* Customer Info */}
        <div className="form-label">Thông tin khách hàng</div>
        <div className="form-input-group">
          <div className="form-row">
            <label>Khách hàng</label>
            <input
              type="text"
              placeholder="Nhập tên khách hàng"
              value={form.customerName}
              onChange={e => updateField('customerName', e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Địa chỉ ship</label>
            <input
              type="text"
              placeholder="Nhập địa chỉ giao hàng"
              value={form.shippingAddress}
              onChange={e => updateField('shippingAddress', e.target.value)}
            />
          </div>
          <SourcePicker value={form.source} onChange={v => updateField('source', v)} />
          <div className="form-row">
            <label>Danh mục</label>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              {[{ key: 'team', label: 'Đặt đội' }, { key: 'retail', label: 'Bán lẻ' }].map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    updateField('category', cat.key);
                    if (cat.key === 'retail') {
                      updateField('quantity', 1);
                      updateField('printCost', 0);
                      updateField('logo3dCost', 0);
                      updateField('outsourceCost', 0);
                    } else {
                      updateField('quantity', 10);
                      updateField('printCost', 30000);
                      updateField('logo3dCost', 0);
                      updateField('outsourceCost', 30000);
                    }
                    updateField('overrideUnitPrice', null);
                  }}
                  style={{
                    padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    background: form.category === cat.key
                      ? (cat.key === 'team' ? 'var(--color-blue)' : '#ff9f0a')
                      : 'var(--color-bg-tertiary)',
                    color: form.category === cat.key ? '#fff' : 'var(--color-label-secondary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>Ngày tạo đơn</label>
            <input
              type="date"
              value={form.createdAt ? form.createdAt.substring(0, 10) : ''}
              onChange={e => updateField('createdAt', e.target.value)}
              style={{ textAlign: 'right' }}
            />
          </div>
        </div>

        {/* Product Selection */}
        <div className="form-label">Sản phẩm</div>
        <div className="form-input-group">
          {/* Selected product summary */}
          <div
            onClick={() => setProductPickerOpen(!productPickerOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', cursor: 'pointer',
              position: 'relative',
            }}
          >
            {(() => {
              const selColor = product?.colors?.find(c => c.id === form.colorId) || product?.colors?.[0];
              const selThumb = selColor?.thumbnail || '';
              return (
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: selThumb ? 'none' : 'var(--color-bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {selThumb ? (
                    <img src={selThumb} alt={product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Image size={18} color="var(--color-label-quaternary)" />
                  )}
                </div>
              );
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="text-subheadline" style={{ fontWeight: 600 }}>{product?.name || 'Chọn mẫu áo'}</span>
                {product?.tag && (
                  <span style={{
                    background: TAG_COLORS[product.tag]?.bg, color: TAG_COLORS[product.tag]?.color,
                    fontSize: 10, fontWeight: 700, padding: '1px 6px',
                    borderRadius: 4, letterSpacing: 0.5,
                  }}>
                    {product.tag}
                  </span>
                )}
              </div>
              <div className="text-caption1 text-tertiary">
                Giá bán lẻ: {formatCurrency(retailPrice)}
              </div>
            </div>
            {productPickerOpen
              ? <ChevronUp size={18} color="var(--color-label-tertiary)" />
              : <ChevronDown size={18} color="var(--color-label-tertiary)" />
            }
            <div style={{
              position: 'absolute', bottom: 0, left: 16, right: 0,
              height: 0.33, background: 'var(--color-separator)',
            }} />
          </div>

          {/* Expanded product list */}
          {productPickerOpen && (
            <div className="animate-scale-in">
              {state.products.map(p => {
                const isSelected = form.productId === p.id;
                const tc = TAG_COLORS[p.tag] || { bg: 'rgba(142,142,147,0.15)', color: '#8e8e93' };
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      updateField('productId', p.id);
                      updateField('colorId', p.colors?.[0]?.id || '');
                      setProductPickerOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 16px 10px 28px', cursor: 'pointer',
                      position: 'relative',
                      background: isSelected ? 'rgba(10,132,255,0.08)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    {(() => {
                      const pThumb = p.colors?.find(c => c.thumbnail)?.thumbnail || '';
                      return (
                        <div style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: pThumb ? 'none' : 'var(--color-bg-tertiary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid var(--color-blue)' : '2px solid transparent',
                        }}>
                          {pThumb ? (
                            <img src={pThumb} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Image size={14} color="var(--color-label-quaternary)" />
                          )}
                        </div>
                      );
                    })()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="text-footnote" style={{ fontWeight: 600 }}>{p.name}</span>
                        {p.tag && (
                          <span style={{
                            background: tc.bg, color: tc.color,
                            fontSize: 9, fontWeight: 700, padding: '1px 5px',
                            borderRadius: 3, letterSpacing: 0.5,
                          }}>
                            {p.tag}
                          </span>
                        )}
                      </div>
                      <div className="text-caption2 text-tertiary">
                        Giá bán lẻ: {formatCurrency(p.prices?.tier1 || 0)}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--color-blue)" strokeWidth={2.5} />}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 64, right: 0,
                      height: 0.33, background: 'var(--color-separator)',
                    }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Color Selection */}
          {product?.colors?.length > 0 && (
            <>
              <div style={{ padding: '8px 16px', borderBottom: '0.33px solid var(--color-separator)' }}>
                <span className="text-caption1 text-tertiary" style={{ textTransform: 'uppercase' }}>Chọn màu</span>
              </div>
              <div style={{ display: 'flex', gap: 10, padding: '10px 16px', overflowX: 'auto' }}>
                {product.colors.map(color => {
                  const isColorSelected = form.colorId === color.id;
                  return (
                    <div
                      key={color.id}
                      onClick={() => updateField('colorId', color.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                        background: color.thumbnail ? 'none' : 'var(--color-bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: isColorSelected ? '2px solid var(--color-blue)' : '2px solid transparent',
                      }}>
                        {color.thumbnail ? (
                          <img src={color.thumbnail} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Image size={16} color="var(--color-label-quaternary)" />
                        )}
                      </div>
                      <span className="text-caption2" style={{
                        color: isColorSelected ? 'var(--color-blue)' : 'var(--color-label-secondary)',
                        fontWeight: isColorSelected ? 600 : 400, maxWidth: 52, textAlign: 'center',
                      }}>
                        {color.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Print cost - manual input */}
          <div className="form-row">
            <label>Gói in ấn</label>
            <MoneyInput
              value={form.printCost}
              onChange={v => updateField('printCost', v)}
              style={{ width: 120 }}
            />
          </div>
          <div className="form-row">
            <label>Logo 3D</label>
            <MoneyInput
              value={form.logo3dCost}
              onChange={v => updateField('logo3dCost', v)}
              style={{ width: 120 }}
            />
          </div>
          <div className="form-row">
            <label>Số lượng</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 'auto' }}>
              <div className="stepper">
                <button onClick={() => updateField('quantity', Math.max(1, form.quantity - 1))}>−</button>
                <span className="stepper-value">{form.quantity}</span>
                <button onClick={() => updateField('quantity', form.quantity + 1)}>+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="form-label">Giá tạm tính</div>
        <div className="form-input-group">
          <div className="form-row">
            <label>Đơn giá</label>
            <span
              className="text-body"
              onClick={() => {
                if (form.overrideUnitPrice !== null) {
                  if (confirm('Bỏ ghi đè và dùng lại giá mặc định?')) {
                    updateField('overrideUnitPrice', null);
                  }
                } else {
                  if (confirm(`Ghi đè đơn giá? Hiện tại: ${formatCurrency(baseUnitPrice)}/bộ`)) {
                    const val = prompt('Đơn giá mới:', baseUnitPrice);
                    if (val !== null && val !== '') updateField('overrideUnitPrice', Number(val));
                  }
                }
              }}
              style={{
                marginLeft: 'auto',
                color: form.overrideUnitPrice !== null ? 'var(--color-orange)' : 'var(--color-blue)',
                cursor: 'pointer',
                textDecoration: form.overrideUnitPrice !== null ? 'underline' : 'none',
              }}
            >
              {formatCurrency(unitPrice)}/bộ
            </span>
          </div>
          <div className="form-row">
            <label>In ấn</label>
            <span className="text-body" style={{ marginLeft: 'auto', color: 'var(--color-blue)' }}>{formatCurrency(printCost)}/bộ</span>
          </div>
          {logo3dCost > 0 && (
            <div className="form-row">
              <label>Logo 3D</label>
              <span className="text-body" style={{ marginLeft: 'auto', color: 'var(--color-blue)' }}>{formatCurrency(logo3dCost)}/bộ</span>
            </div>
          )}
          <div className="form-row">
            <label style={{ fontWeight: 600 }}>Đơn giá sau in</label>
            <span className="text-body" style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--color-blue)' }}>{formatCurrency(unitAfterPrint)}/bộ</span>
          </div>
          <div className="form-row">
            <label style={{ fontWeight: 600 }}>Tổng đơn</label>
            <span className="text-body" style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-blue)' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Profit */}
        <div className="form-label">Lợi nhuận tạm tính</div>
        <div className="form-input-group">
          <div className="form-row">
            <label>Giá vốn sản phẩm{form.overrideProdCost !== null ? ' ✧' : ''}</label>
            <span
              className="text-body text-secondary"
              onClick={() => {
                if (form.overrideProdCost !== null) {
                  if (confirm('Bỏ ghi đè và dùng lại giá vốn mặc định?')) {
                    updateField('overrideProdCost', null);
                  }
                } else {
                  if (confirm(`Ghi đè giá vốn? Hiện tại: ${formatCurrency(baseProdCost)}/bộ`)) {
                    const val = prompt('Giá vốn mới:', baseProdCost);
                    if (val !== null && val !== '') updateField('overrideProdCost', Number(val));
                  }
                }
              }}
              style={{
                marginLeft: 'auto',
                cursor: 'pointer',
                color: form.overrideProdCost !== null ? 'var(--color-orange)' : undefined,
                textDecoration: form.overrideProdCost !== null ? 'underline' : 'none',
              }}
            >
              {formatCurrency(prodCost)}/bộ
            </span>
          </div>
          <div className="form-row">
            <label>Chi phí in ấn</label>
            <MoneyInput
              value={form.outsourceCost}
              onChange={v => updateField('outsourceCost', v)}
              style={{ width: 120 }}
            />
          </div>
          <div className="form-row">
            <label>Lợi nhuận/bộ</label>
            <span className="text-body" style={{ marginLeft: 'auto', color: profitPerUnit >= 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>
              {profitPerUnit >= 0 ? '+' : ''}{formatCurrency(profitPerUnit)}
            </span>
          </div>
          <div className="form-row">
            <label style={{ fontWeight: 600 }}>Tổng lợi nhuận</label>
            <span className="text-body" style={{ marginLeft: 'auto', color: totalProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 700 }}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </span>
          </div>
        </div>

        {/* Payment */}
        <div className="form-label">Thanh toán</div>
        <div className="form-input-group">
          <div className="form-row">
            <label>Tiền cọc</label>
            <input
              type="number"
              placeholder="0"
              value={form.deposit || ''}
              onChange={e => updateField('deposit', e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>Ngày cọc</label>
            <input
              type="date"
              value={form.depositDate}
              onChange={e => updateField('depositDate', e.target.value)}
              style={{ textAlign: 'right' }}
            />
          </div>
          <div className="form-row">
            <label>Giao hàng</label>
            <span className="text-body" style={{ marginLeft: 'auto', color: 'var(--color-green)' }}>
              {deliveryDate ? `${new Date(deliveryDate).toLocaleDateString('vi-VN')} (14 ngày)` : '—'}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="form-label">Trạng thái</div>
        <div className="form-input-group">
          <div className="form-row">
            <label>Status</label>
            <select
              value={form.status}
              onChange={e => updateField('status', e.target.value)}
            >
              {statusOptions.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="form-label">Ghi chú</div>
        <div className="form-input-group">
          <div className="form-row" style={{ alignItems: 'flex-start' }}>
            <textarea
              placeholder="Ghi chú thêm cho đơn hàng..."
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              rows={3}
              style={{ width: '100%', textAlign: 'left' }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ padding: '24px 0 40px' }}>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Tạo đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
