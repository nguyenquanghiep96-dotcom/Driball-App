import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Image, Check, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STATUSES } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import { SourceIcon, SourcePicker } from '../components/SourceIcon';
import { formatCurrency, formatCompact, formatDate, calculateOrderTotal, calculateOrderProfit, calculateProductionCost, calculateDeliveryDate, getPriceByQuantity } from '../utils/calculations';

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

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const order = state.orders.find(o => o.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editPickerOpen, setEditPickerOpen] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [showTimeDetails, setShowTimeDetails] = useState(false);

  if (!order) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="header-action" onClick={() => navigate('/')}>
            <ChevronLeft size={22} /> Quay lại
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-state-title">Không tìm thấy đơn hàng</div>
        </div>
      </div>
    );
  }

  const product = state.products.find(p => p.id === order.productId);
  const printCost = Number(order.printCost) || Number(order.printPackagePrice) || 0;
  const logo3dCost = Number(order.logo3dCost) || 0;
  const outsourceCost = Number(order.outsourceCost) || printCost;
  const totalPrintCost = printCost + logo3dCost;
  const baseUnitPrice = product ? getPriceByQuantity(product, order.quantity) : 0;
  const unitPrice = order.snapshotUnitPrice ?? (order.overrideUnitPrice != null ? Number(order.overrideUnitPrice) : baseUnitPrice);
  const unitAfterPrint = unitPrice + totalPrintCost;
  const total = unitAfterPrint * order.quantity;
  const baseProdCost = product ? calculateProductionCost(product) : 0;
  const prodCost = order.snapshotProdCost ?? (order.overrideProdCost != null ? Number(order.overrideProdCost) : baseProdCost);
  const profitPerUnit = unitAfterPrint - prodCost - outsourceCost;
  const totalProfit = profitPerUnit * order.quantity;
  const deliveryDate = calculateDeliveryDate(order.depositDate);
  const colorObj = product?.colors?.find(c => c.id === order.colorId) || product?.colors?.[0];
  const statusOptions = STATUSES.filter(s => s.key !== 'all');

  const TAG_COLORS_DETAIL = {
    'PLAY': { bg: 'rgba(48,209,88,0.15)', color: '#30d158' },
    'PRO': { bg: 'rgba(10,132,255,0.15)', color: '#0a84ff' },
    'ELITE': { bg: 'rgba(191,90,242,0.15)', color: '#bf5af2' },
    'ELITE+': { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a' },
  };

  const startEdit = () => {
    setEditForm({
      ...order,
      printCost: Number(order.printCost) || Number(order.printPackagePrice) || 0,
      logo3dCost: Number(order.logo3dCost) || 0,
      outsourceCost: Number(order.outsourceCost) || 0,
      overrideUnitPrice: order.overrideUnitPrice ?? null,
      overrideProdCost: order.overrideProdCost ?? null,
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    const editProduct = state.products.find(p => p.id === editForm.productId);
    const isSameProduct = editForm.productId === order.productId;
    
    const editBaseUnitPrice = editProduct ? getPriceByQuantity(editProduct, editForm.quantity) : 0;
    let editUnitPrice;
    if (editForm.overrideUnitPrice !== null) {
      editUnitPrice = Number(editForm.overrideUnitPrice);
    } else if (isSameProduct && order.overrideUnitPrice !== undefined && order.overrideUnitPrice !== null) {
      editUnitPrice = order.overrideUnitPrice;
    } else {
      editUnitPrice = editBaseUnitPrice;
    }

    const editBaseProdCost = editProduct ? calculateProductionCost(editProduct) : 0;
    let editProdCost;
    if (editForm.overrideProdCost !== null) {
      editProdCost = Number(editForm.overrideProdCost);
    } else if (isSameProduct && order.overrideProdCost !== undefined && order.overrideProdCost !== null) {
      editProdCost = order.overrideProdCost;
    } else {
      editProdCost = editBaseProdCost;
    }

    dispatch({
      type: 'UPDATE_ORDER',
      payload: {
        ...editForm,
        deposit: Number(editForm.deposit) || 0,
        quantity: Number(editForm.quantity) || 1,
        printCost: Number(editForm.printCost) || 0,
        logo3dCost: Number(editForm.logo3dCost) || 0,
        outsourceCost: Number(editForm.outsourceCost) || 0,
        overrideUnitPrice: editUnitPrice,
        overrideProdCost: editProdCost,
      },
    });
    setIsEditing(false);
    setEditForm(null);
  };

  const handleDelete = () => {
    if (confirm('Bạn chắc chắn muốn xoá đơn hàng này?')) {
      dispatch({ type: 'DELETE_ORDER', payload: order.id });
      navigate('/');
    }
  };

  const updateStatus = (newStatus) => {
    dispatch({
      type: 'UPDATE_ORDER',
      payload: { id: order.id, status: newStatus },
    });
  };

  if (isEditing && editForm) {
    const editProduct = state.products.find(p => p.id === editForm.productId);
    const isSameProduct = editForm.productId === order.productId;
    const editPrintCost = Number(editForm.printCost) || 0;
    const editLogo3d = Number(editForm.logo3dCost) || 0;
    const editOutsource = Number(editForm.outsourceCost) || 0;
    
    const editBaseUnitPrice = editProduct ? getPriceByQuantity(editProduct, editForm.quantity) : 0;
    let editUnitPrice;
    if (editForm.overrideUnitPrice !== null) {
      editUnitPrice = Number(editForm.overrideUnitPrice);
    } else if (isSameProduct && order.snapshotUnitPrice !== undefined) {
      editUnitPrice = order.snapshotUnitPrice;
    } else {
      editUnitPrice = editBaseUnitPrice;
    }

    const editUnitAfterPrint = editUnitPrice + editPrintCost + editLogo3d;
    const editTotal = editUnitAfterPrint * editForm.quantity;
    
    const editBaseProdCost = editProduct ? calculateProductionCost(editProduct) : 0;
    let editProdCost;
    if (editForm.overrideProdCost !== null) {
      editProdCost = Number(editForm.overrideProdCost);
    } else if (isSameProduct && order.snapshotProdCost !== undefined) {
      editProdCost = order.snapshotProdCost;
    } else {
      editProdCost = editBaseProdCost;
    }

    const editProfitPerUnit = editUnitAfterPrint - editProdCost - editOutsource;
    const editTotalProfit = editProfitPerUnit * editForm.quantity;
    const editRetailPrice = editProduct?.prices?.tier1 || 0;
    const editDeliveryDate = calculateDeliveryDate(editForm.depositDate);

    const TAG_COLORS = {
      'PLAY': { bg: 'rgba(48,209,88,0.15)', color: '#30d158' },
      'PRO': { bg: 'rgba(10,132,255,0.15)', color: '#0a84ff' },
      'ELITE': { bg: 'rgba(191,90,242,0.15)', color: '#bf5af2' },
      'ELITE+': { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a' },
    };

    const editSelColor = editProduct?.colors?.find(c => c.id === editForm.colorId) || editProduct?.colors?.[0];
    const editThumb = editSelColor?.thumbnail || '';

    const updateEditField = (field, value) => {
      setEditForm(prev => {
        const next = { ...prev, [field]: value };
        if (field === 'printCost' || field === 'logo3dCost') {
          const pC = field === 'printCost' ? Number(value) : Number(prev.printCost);
          const lC = field === 'logo3dCost' ? Number(value) : Number(prev.logo3dCost);
          next.outsourceCost = (pC || 0) + (lC || 0);
        }
        return next;
      });
    };

    return (
      <div className="page">
        <div className="page-header">
          <div className="header-row">
            <button className="header-action" onClick={() => { setIsEditing(false); setEditPickerOpen(false); }}>
              Huỷ
            </button>
            <button className="header-action" style={{ fontWeight: 600 }} onClick={saveEdit}>
              Lưu
            </button>
          </div>
          <h1 className="text-title1" style={{ marginTop: 8 }}>Chỉnh sửa</h1>
        </div>
        <div className="page-content">
          {/* Customer Info */}
          <div className="form-label" style={{ paddingTop: 16 }}>Thông tin khách hàng</div>
          <div className="form-input-group">
            <div className="form-row">
              <label>Khách hàng</label>
              <input
                type="text"
                value={editForm.customerName}
                onChange={e => updateEditField('customerName', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Địa chỉ ship</label>
              <input
                type="text"
                value={editForm.shippingAddress || ''}
                onChange={e => updateEditField('shippingAddress', e.target.value)}
                placeholder="Nhập địa chỉ giao hàng"
              />
            </div>
            <SourcePicker value={editForm.source || ''} onChange={v => updateEditField('source', v)} />
            <div className="form-row">
              <label>Danh mục</label>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                {[{ key: 'team', label: 'Đặt đội' }, { key: 'retail', label: 'Bán lẻ' }].map(cat => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => updateEditField('category', cat.key)}
                    style={{
                      padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: 'pointer',
                      background: (editForm.category || 'team') === cat.key
                        ? (cat.key === 'team' ? 'var(--color-blue)' : '#ff9f0a')
                        : 'var(--color-bg-tertiary)',
                      color: (editForm.category || 'team') === cat.key ? '#fff' : 'var(--color-label-secondary)',
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
                value={editForm.createdAt ? editForm.createdAt.substring(0, 10) : ''}
                onChange={e => updateEditField('createdAt', e.target.value)}
                style={{ textAlign: 'right' }}
              />
            </div>
          </div>

          {/* Product Selection */}
          <div className="form-label">Sản phẩm</div>
          <div className="form-input-group">
            {/* Selected product summary */}
            <div
              onClick={() => setEditPickerOpen(!editPickerOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: editThumb ? 'none' : 'var(--color-bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {editThumb ? (
                  <img src={editThumb} alt={editProduct?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Image size={18} color="var(--color-label-quaternary)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="text-subheadline" style={{ fontWeight: 600 }}>{editProduct?.name || 'Chọn mẫu áo'}</span>
                  {editProduct?.tag && (
                    <span style={{
                      background: TAG_COLORS[editProduct.tag]?.bg, color: TAG_COLORS[editProduct.tag]?.color,
                      fontSize: 10, fontWeight: 700, padding: '1px 6px',
                      borderRadius: 4, letterSpacing: 0.5,
                    }}>
                      {editProduct.tag}
                    </span>
                  )}
                </div>
                <div className="text-caption1 text-tertiary">
                  Giá bán lẻ: {formatCurrency(editRetailPrice)}
                </div>
              </div>
              {editPickerOpen
                ? <ChevronUp size={18} color="var(--color-label-tertiary)" />
                : <ChevronDown size={18} color="var(--color-label-tertiary)" />
              }
              <div style={{ position: 'absolute', bottom: 0, left: 16, right: 0, height: 0.33, background: 'var(--color-separator)' }} />
            </div>

            {/* Expanded product list */}
            {editPickerOpen && (
              <div className="animate-scale-in">
                {state.products.map(p => {
                  const isSelected = editForm.productId === p.id;
                  const tc = TAG_COLORS[p.tag] || { bg: 'rgba(142,142,147,0.15)', color: '#8e8e93' };
                  const pThumb = p.colors?.find(c => c.thumbnail)?.thumbnail || '';
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        updateEditField('productId', p.id);
                        setEditForm(prev => ({ ...prev, productId: p.id, colorId: p.colors?.[0]?.id || '' }));
                        setEditPickerOpen(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 16px 10px 28px', cursor: 'pointer',
                        position: 'relative',
                        background: isSelected ? 'rgba(10,132,255,0.08)' : 'transparent',
                      }}
                    >
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
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="text-footnote" style={{ fontWeight: 600 }}>{p.name}</span>
                          {p.tag && <span style={{ background: tc.bg, color: tc.color, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>{p.tag}</span>}
                        </div>
                        <div className="text-caption2 text-tertiary">
                          Giá bán lẻ: {formatCurrency(p.prices?.tier1 || 0)}
                        </div>
                      </div>
                      {isSelected && <Check size={16} color="var(--color-blue)" strokeWidth={2.5} />}
                      <div style={{ position: 'absolute', bottom: 0, left: 64, right: 0, height: 0.33, background: 'var(--color-separator)' }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Color Selection */}
            {editProduct?.colors?.length > 0 && (
              <>
                <div style={{ padding: '8px 16px', borderBottom: '0.33px solid var(--color-separator)' }}>
                  <span className="text-caption1 text-tertiary" style={{ textTransform: 'uppercase' }}>Chọn màu</span>
                </div>
                <div style={{ display: 'flex', gap: 10, padding: '10px 16px', overflowX: 'auto' }}>
                  {editProduct.colors.map(color => {
                    const isColorSel = editForm.colorId === color.id;
                    return (
                      <div key={color.id} onClick={() => updateEditField('colorId', color.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: color.thumbnail ? 'none' : 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isColorSel ? '2px solid var(--color-blue)' : '2px solid transparent' }}>
                          {color.thumbnail ? <img src={color.thumbnail} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Image size={16} color="var(--color-label-quaternary)" />}
                        </div>
                        <span className="text-caption2" style={{ color: isColorSel ? 'var(--color-blue)' : 'var(--color-label-secondary)', fontWeight: isColorSel ? 600 : 400 }}>{color.name}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Print cost */}
            <div className="form-row">
              <label>Gói in ấn</label>
              <MoneyInput value={editForm.printCost} onChange={v => updateEditField('printCost', v)} style={{ width: 120 }} />
            </div>
            <div className="form-row">
              <label>Logo 3D</label>
              <MoneyInput value={editForm.logo3dCost} onChange={v => updateEditField('logo3dCost', v)} style={{ width: 120 }} />
            </div>
            <div className="form-row">
              <label>Số lượng</label>
              <div style={{ marginLeft: 'auto' }}>
                <div className="stepper">
                  <button onClick={() => updateEditField('quantity', Math.max(1, editForm.quantity - 1))}>−</button>
                  <span className="stepper-value">{editForm.quantity}</span>
                  <button onClick={() => updateEditField('quantity', editForm.quantity + 1)}>+</button>
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
                  if (editForm.overrideUnitPrice !== null) {
                    if (confirm('Bỏ ghi đè và dùng lại giá mặc định?')) {
                      updateEditField('overrideUnitPrice', null);
                    }
                  } else {
                    if (confirm(`Ghi đè đơn giá? Hiện tại: ${formatCurrency(editBaseUnitPrice)}/bộ`)) {
                      const val = prompt('Đơn giá mới:', editBaseUnitPrice);
                      if (val !== null && val !== '') updateEditField('overrideUnitPrice', Number(val));
                    }
                  }
                }}
                style={{
                  marginLeft: 'auto',
                  color: editForm.overrideUnitPrice !== null ? 'var(--color-orange)' : 'var(--color-blue)',
                  cursor: 'pointer',
                  textDecoration: editForm.overrideUnitPrice !== null ? 'underline' : 'none',
                }}
              >
                {formatCurrency(editUnitPrice)}/bộ
              </span>
            </div>
            <div className="form-row">
              <label>In ấn</label>
              <span className="text-body" style={{ marginLeft: 'auto', color: 'var(--color-blue)' }}>{formatCurrency(editPrintCost)}/bộ</span>
            </div>
            {editLogo3d > 0 && (
              <div className="form-row">
                <label>Logo 3D</label>
                <span className="text-body" style={{ marginLeft: 'auto', color: 'var(--color-blue)' }}>{formatCurrency(editLogo3d)}/bộ</span>
              </div>
            )}
            <div className="form-row">
              <label style={{ fontWeight: 600 }}>Đơn giá sau in</label>
              <span className="text-body" style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--color-blue)' }}>{formatCurrency(editUnitAfterPrint)}/bộ</span>
            </div>
            <div className="form-row">
              <label style={{ fontWeight: 600 }}>Tổng đơn</label>
              <span className="text-body" style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-blue)' }}>
                {formatCurrency(editTotal)}
              </span>
            </div>
          </div>

          {/* Profit */}
          <div className="form-label">Lợi nhuận tạm tính</div>
          <div className="form-input-group">
            <div className="form-row">
              <label>Giá vốn sản phẩm{editForm.overrideProdCost !== null ? ' ✧' : ''}</label>
              <span
                className="text-body text-secondary"
                onClick={() => {
                  if (editForm.overrideProdCost !== null) {
                    if (confirm('Bỏ ghi đè và dùng lại giá vốn mặc định?')) {
                      updateEditField('overrideProdCost', null);
                    }
                  } else {
                    if (confirm(`Ghi đè giá vốn? Hiện tại: ${formatCurrency(editBaseProdCost)}/bộ`)) {
                      const val = prompt('Giá vốn mới:', editBaseProdCost);
                      if (val !== null && val !== '') updateEditField('overrideProdCost', Number(val));
                    }
                  }
                }}
                style={{
                  marginLeft: 'auto',
                  cursor: 'pointer',
                  color: editForm.overrideProdCost !== null ? 'var(--color-orange)' : undefined,
                  textDecoration: editForm.overrideProdCost !== null ? 'underline' : 'none',
                }}
              >
                {formatCurrency(editProdCost)}/bộ
              </span>
            </div>
            <div className="form-row">
              <label>Chi phí in ấn</label>
              <MoneyInput value={editForm.outsourceCost} onChange={v => updateEditField('outsourceCost', v)} style={{ width: 120 }} />
            </div>
            <div className="form-row">
              <label>Lợi nhuận/bộ</label>
              <span className="text-body" style={{ marginLeft: 'auto', color: editProfitPerUnit >= 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>
                {editProfitPerUnit >= 0 ? '+' : ''}{formatCurrency(editProfitPerUnit)}
              </span>
            </div>
            <div className="form-row">
              <label style={{ fontWeight: 600 }}>Tổng lợi nhuận</label>
              <span className="text-body" style={{ marginLeft: 'auto', color: editTotalProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 700 }}>
                {editTotalProfit >= 0 ? '+' : ''}{formatCurrency(editTotalProfit)}
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
                value={editForm.deposit || ''}
                onChange={e => updateEditField('deposit', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label>Ngày cọc</label>
              <input
                type="date"
                value={editForm.depositDate || ''}
                onChange={e => updateEditField('depositDate', e.target.value)}
                style={{ textAlign: 'right' }}
              />
            </div>
            <div className="form-row">
              <label>Giao hàng</label>
              <span className="text-body" style={{ marginLeft: 'auto', color: 'var(--color-green)' }}>
                {editDeliveryDate ? `${new Date(editDeliveryDate).toLocaleDateString('vi-VN')} (14 ngày)` : '—'}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="form-label">Trạng thái</div>
          <div className="form-input-group">
            <div className="form-row">
              <label>Status</label>
              <select
                value={editForm.status}
                onChange={e => updateEditField('status', e.target.value)}
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
                value={editForm.notes || ''}
                onChange={e => updateEditField('notes', e.target.value)}
                rows={3}
                style={{ width: '100%', textAlign: 'left' }}
                placeholder="Ghi chú thêm cho đơn hàng..."
              />
            </div>
          </div>

          {/* Delete */}
          <div style={{ padding: '24px 0 40px' }}>
            <button className="btn btn-destructive" onClick={handleDelete}>
              <Trash2 size={18} />
              Xoá đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-slide-in">
      {/* Header */}
      <div className="page-header">
        <div className="header-row">
          <button className="header-action" onClick={() => navigate('/')}>
            <ChevronLeft size={22} />
            Quay lại
          </button>
          <button className="header-action" onClick={startEdit}>
            Sửa
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Customer Title */}
        <div style={{ padding: '8px 0 20px' }}>
          <h1 className="text-large-title" style={{ marginBottom: 8 }}>
            {order.customerName}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {order.source && <SourceIcon source={order.source} size={16} />}
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Quick Status Change */}
        <div className="form-label" style={{ paddingLeft: 0, paddingTop: 0 }}>Cập nhật trạng thái</div>
        <div className="filter-scroll" style={{ padding: '0 0 16px', marginLeft: -4 }}>
          {statusOptions.map(s => (
            <button
              key={s.key}
              className={`filter-pill ${order.status === s.key ? 'active' : ''}`}
              onClick={() => updateStatus(s.key)}
              style={order.status === s.key ? { background: s.color } : {}}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Order Details */}
        <div className="list-section">
          <div className="list-section-header">Chi tiết đơn hàng</div>
          <div className="list-group">
            {order.shippingAddress && (
              <div className="list-item">
                <span className="list-item-label">Địa chỉ ship</span>
                <span className="list-item-value">{order.shippingAddress}</span>
              </div>
            )}
            {/* Product card: thumbnail + name + tag, color below */}
            <div style={{ padding: '12px 16px', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
                  background: 'var(--color-bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {(() => {
                    const detailThumb = colorObj?.thumbnail || product?.colors?.find(c => c.thumbnail)?.thumbnail || '';
                    return detailThumb
                      ? <img src={detailThumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Image size={18} color="var(--color-label-quaternary)" />;
                  })()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-label)' }}>{product?.name || '—'}</span>
                    {product?.tag && (
                      <span style={{
                        background: TAG_COLORS_DETAIL[product.tag]?.bg, color: TAG_COLORS_DETAIL[product.tag]?.color,
                        fontSize: 10, fontWeight: 700, padding: '1px 6px',
                        borderRadius: 4, letterSpacing: 0.5,
                      }}>
                        {product.tag}
                      </span>
                    )}
                  </div>
                  {colorObj && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--color-label-secondary)', marginTop: 2 }}>
                      <span>{colorObj.name}</span>
                      <span style={{ color: 'var(--color-label-tertiary)' }}>•</span>
                      <span style={{ color: 'var(--color-blue)', fontWeight: 500 }}>{formatCurrency(product?.prices?.tier1 || 0)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                position: 'absolute', bottom: 0, left: 16, right: 0,
                height: 0.33, background: 'var(--color-separator)',
              }} />
            </div>
            {/* Info group with 10px gap from product card */}
            <div style={{ marginTop: 10 }}>
              <div className="list-item">
                <span className="list-item-label">Số lượng</span>
                <span className="list-item-value">{order.quantity} bộ</span>
              </div>
              <div className="list-item">
                <span className="list-item-label">Đơn giá đặt đội{order.overrideUnitPrice != null ? ' ✧' : ''}</span>
                <span className="list-item-value" style={order.overrideUnitPrice != null ? { color: 'var(--color-orange)' } : undefined}>{formatCurrency(unitPrice)}/bộ</span>
              </div>
              <div className="list-item">
                <span className="list-item-label">In ấn</span>
                <span className="list-item-value">{formatCurrency(printCost)}/bộ</span>
              </div>
              {logo3dCost > 0 && (
                <div className="list-item">
                  <span className="list-item-label">Logo 3D</span>
                  <span className="list-item-value">{formatCurrency(logo3dCost)}/bộ</span>
                </div>
              )}
              <div className="list-item">
                <span className="list-item-label">Full in ấn</span>
                <span className="list-item-value" style={{ fontWeight: 600 }}>{formatCurrency(unitAfterPrint)}/bộ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thành tiền */}
        <div className="list-section">
          <div className="list-section-header">Thành tiền</div>
          <div className="list-group">
            <div className="list-item">
              <span className="list-item-label">Tổng đơn {order.quantity} bộ</span>
              <span className="list-item-value" style={{ fontWeight: 600, color: 'var(--color-label)' }}>
                {formatCurrency(total)}
              </span>
            </div>
            <div className="list-item">
              <span className="list-item-label">Đã cọc</span>
              <span className="list-item-value" style={{ color: 'var(--color-green)' }}>
                {formatCurrency(order.deposit || 0)}
              </span>
            </div>
            <div className="list-item">
              <span className="list-item-label">Thanh toán còn lại</span>
              <span className="list-item-value" style={{ color: 'var(--color-orange)' }}>
                {formatCurrency(total - (order.deposit || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Lợi nhuận */}
        <div className="list-section">
          <div className="list-section-header">Lợi nhuận</div>
          <div className="list-group">
            {!showProfitDetails ? (
              <div 
                className="list-item" 
                onClick={() => setShowProfitDetails(true)} 
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="list-item-label" style={{ fontWeight: 600 }}>Tổng lợi nhuận</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="list-item-value" style={{ fontWeight: 700, color: totalProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                      {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                    </span>
                    <ChevronRight size={16} color="var(--color-label-tertiary)" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-label-secondary)' }}>Lợi nhuận/bộ</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: profitPerUnit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>{profitPerUnit >= 0 ? '+' : ''}{formatCompact(profitPerUnit)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-label-secondary)' }}>Giá vốn SP</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-label)' }}>{formatCompact(prodCost)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-label-secondary)' }}>Chi phí in ấn</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-label)' }}>{formatCompact(outsourceCost)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="list-item" 
                  onClick={() => setShowProfitDetails(false)} 
                  style={{ cursor: 'pointer', background: 'var(--color-bg-secondary)', justifyContent: 'center' }}
                >
                  <span style={{ color: 'var(--color-blue)', fontSize: 14, fontWeight: 500 }}>Đóng chi tiết lợi nhuận</span>
                </div>
                <div className="list-item">
                  <span className="list-item-label">Giá vốn sản phẩm{order.overrideProdCost != null ? ' ✧' : ''}</span>
                  <span className="list-item-value" style={order.overrideProdCost != null ? { color: 'var(--color-orange)' } : undefined}>{formatCurrency(prodCost)}/bộ</span>
                </div>
                <div className="list-item">
                  <span className="list-item-label">Chi phí in ấn</span>
                  <span className="list-item-value">{formatCurrency(outsourceCost)}/bộ</span>
                </div>
                <div className="list-item">
                  <span className="list-item-label">Lợi nhuận/bộ</span>
                  <span className="list-item-value" style={{ fontWeight: 600, color: profitPerUnit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {profitPerUnit >= 0 ? '+' : ''}{formatCurrency(profitPerUnit)}
                  </span>
                </div>
                <div className="list-item">
                  <span className="list-item-label" style={{ fontWeight: 600 }}>Tổng lợi nhuận</span>
                  <span className="list-item-value" style={{ fontWeight: 700, color: totalProfit >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                    {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="list-section">
          <div className="list-section-header">Thời gian</div>
          <div className="list-group">
            {!showTimeDetails ? (
              <div 
                className="list-item" 
                onClick={() => setShowTimeDetails(true)} 
                style={{ cursor: 'pointer' }}
              >
                <span className="list-item-label">Ngày giao dự kiến</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="list-item-value" style={{ color: 'var(--color-green)' }}>
                    {deliveryDate ? formatDate(deliveryDate) : '—'}
                  </span>
                  <ChevronRight size={16} color="var(--color-label-tertiary)" />
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="list-item" 
                  onClick={() => setShowTimeDetails(false)} 
                  style={{ cursor: 'pointer', background: 'var(--color-bg-secondary)', justifyContent: 'center' }}
                >
                  <span style={{ color: 'var(--color-blue)', fontSize: 14, fontWeight: 500 }}>Đóng chi tiết thời gian</span>
                </div>
                <div className="list-item">
                  <span className="list-item-label">Ngày tạo</span>
                  <span className="list-item-value">{formatDate(order.createdAt)}</span>
                </div>
                <div className="list-item">
                  <span className="list-item-label">Ngày cọc</span>
                  <span className="list-item-value">{formatDate(order.depositDate)}</span>
                </div>
                <div className="list-item">
                  <span className="list-item-label">Giao dự kiến</span>
                  <span className="list-item-value" style={{ color: 'var(--color-green)' }}>
                    {deliveryDate ? formatDate(deliveryDate) : '—'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="list-section">
            <div className="list-section-header">Ghi chú</div>
            <div className="list-group">
              <div className="list-item">
                <span className="list-item-label" style={{ color: 'var(--color-label-secondary)' }}>
                  {order.notes}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Delete */}
        <div style={{ padding: '8px 0 40px' }}>
          <button className="btn btn-destructive" onClick={handleDelete}>
            <Trash2 size={18} />
            Xoá đơn hàng
          </button>
        </div>
      </div>
    </div>
  );
}
