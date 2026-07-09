import { useState, useRef } from 'react';
import { Plus, ChevronDown, ChevronUp, ChevronRight, Trash2, Edit3, X, Check, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, calculateProductionCost } from '../utils/calculations';
import { PRICE_TIERS, PRODUCT_TAGS } from '../utils/constants';

function MoneyInput({ value, onChange, placeholder }) {
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
    />
  );
}

function ColorThumbnailPicker({ colors, onChange }) {
  const fileRefs = useRef({});

  const handleFile = (colorId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const updated = colors.map(c =>
          c.id === colorId ? { ...c, thumbnail: canvas.toDataURL('image/jpeg', 0.7) } : c
        );
        onChange(updated);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const addColor = () => {
    const id = 'c-' + Date.now().toString(36);
    onChange([...colors, { id, name: '', thumbnail: '' }]);
  };

  const removeColor = (id) => {
    onChange(colors.filter(c => c.id !== id));
  };

  const updateName = (id, name) => {
    onChange(colors.map(c => c.id === id ? { ...c, name } : c));
  };

  return (
    <div>
      {colors.map(color => (
        <div key={color.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', position: 'relative',
        }}>
          <div
            onClick={() => fileRefs.current[color.id]?.click()}
            style={{
              width: 40, height: 40, borderRadius: 8, flexShrink: 0,
              background: color.thumbnail ? 'none' : 'var(--color-bg-tertiary)',
              border: '1.5px dashed var(--color-label-quaternary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer',
            }}
          >
            {color.thumbnail ? (
              <img src={color.thumbnail} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Image size={14} color="var(--color-label-tertiary)" />
            )}
          </div>
          <input
            ref={el => fileRefs.current[color.id] = el}
            type="file" accept="image/*"
            onChange={e => handleFile(color.id, e)}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            value={color.name}
            onChange={e => updateName(color.id, e.target.value)}
            placeholder="Tên màu..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontFamily: 'var(--font-family)', fontSize: 15,
              color: 'var(--color-label)', textAlign: 'left',
            }}
          />
          <button
            onClick={() => removeColor(color.id)}
            style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
          <div style={{
            position: 'absolute', bottom: 0, left: 66, right: 0,
            height: 0.33, background: 'var(--color-separator)',
          }} />
        </div>
      ))}
      <button
        onClick={addColor}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 16px', background: 'none', border: 'none',
          color: 'var(--color-blue)', cursor: 'pointer',
          fontFamily: 'var(--font-family)', fontSize: 15, fontWeight: 500,
          width: '100%',
        }}
      >
        <Plus size={16} /> Thêm màu
      </button>
    </div>
  );
}

function ProductEditor({ product, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    tag: product?.tag || 'PLAY',
    fabricType: product?.fabricType || '',
    colors: product?.colors || [{ id: 'c-default', name: '', thumbnail: '' }],
    production: product?.production || {
      shirtCost: 95000, shirtLogo: 7000, shirtStamp: 0, shirtLabel: 5000,
      collarCost: 0, pantsCost: 30000, pantsLogo: 7000, vat: 0.08,
      labelPackaging: 5500, shipping: 5000, otherCosts: 0,
    },
    prices: product?.prices || { tier1: 260000, tier2: 250000, tier3: 240000 },
    notes: product?.notes || '',
  });

  const updateProduction = (field, value) => {
    setForm(prev => ({
      ...prev,
      production: { ...prev.production, [field]: Number(value) || 0 },
    }));
  };

  const updatePrice = (tier, value) => {
    setForm(prev => ({
      ...prev,
      prices: { ...prev.prices, [tier]: Number(value) || 0 },
    }));
  };

  const totalCost = calculateProductionCost(form);

  return (
    <div className="animate-scale-in">
      <div className="form-label" style={{ paddingTop: 16 }}>Thông tin mẫu</div>
      <div className="form-input-group">
        <div className="form-row">
          <label>Tên mẫu</label>
          <input type="text" placeholder="VD: SQUARE" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Dòng SP</label>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flex: 1 }}>
            {PRODUCT_TAGS.map(tag => (
              <button key={tag} className={`picker-option ${form.tag === tag ? 'selected' : ''}`} onClick={() => setForm(prev => ({ ...prev, tag }))} type="button" style={{ padding: '4px 10px', fontSize: 13 }}>{tag}</button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label>Loại vải</label>
          <input type="text" placeholder="Nhập loại vải..." value={form.fabricType} onChange={e => setForm(prev => ({ ...prev, fabricType: e.target.value }))} />
        </div>
      </div>

      <div className="form-label">Màu sắc & Thumbnails</div>
      <div className="form-input-group">
        <ColorThumbnailPicker colors={form.colors} onChange={colors => setForm(prev => ({ ...prev, colors }))} />
      </div>

      <div className="form-label">Chi phí sản xuất áo</div>
      <div className="form-input-group">
        <div className="form-row"><label>Chi phí may áo</label><MoneyInput value={form.production.shirtCost} onChange={v => updateProduction('shirtCost', v)} /></div>
        <div className="form-row"><label>In logo Driball ngực</label><MoneyInput value={form.production.shirtLogo} onChange={v => updateProduction('shirtLogo', v)} /></div>
        <div className="form-row"><label>In tem sườn Driball</label><MoneyInput value={form.production.shirtStamp} onChange={v => updateProduction('shirtStamp', v)} /></div>
        <div className="form-row"><label>May thêm mác sườn</label><MoneyInput value={form.production.shirtLabel} onChange={v => updateProduction('shirtLabel', v)} /></div>
        <div className="form-row"><label>Kiểu cổ bẻ/Bo dệt</label><MoneyInput value={form.production.collarCost} onChange={v => updateProduction('collarCost', v)} /></div>
      </div>

      <div className="form-label">Chi phí sản xuất quần</div>
      <div className="form-input-group">
        <div className="form-row"><label>Chi phí may quần</label><MoneyInput value={form.production.pantsCost} onChange={v => updateProduction('pantsCost', v)} /></div>
        <div className="form-row"><label>In logo Driball quần</label><MoneyInput value={form.production.pantsLogo} onChange={v => updateProduction('pantsLogo', v)} /></div>
      </div>

      <div className="form-label">Chi phí khác</div>
      <div className="form-input-group">
        <div className="form-row"><label>VAT (%)</label><input type="number" value={(form.production.vat * 100) || ''} onChange={e => updateProduction('vat', (Number(e.target.value) || 0) / 100)} /></div>
        <div className="form-row"><label>Tem mác + Bao bì</label><MoneyInput value={form.production.labelPackaging} onChange={v => updateProduction('labelPackaging', v)} /></div>
        <div className="form-row"><label>Ship</label><MoneyInput value={form.production.shipping} onChange={v => updateProduction('shipping', v)} /></div>
        <div className="form-row"><label>Chi phí khác</label><MoneyInput value={form.production.otherCosts} onChange={v => updateProduction('otherCosts', v)} /></div>
        <div className="form-row"><label>Tổng giá sản xuất</label><span style={{ fontWeight: 600, color: 'var(--color-blue)' }}>{formatCurrency(totalCost)}</span></div>
      </div>

      <div className="form-label">Giá bán</div>
      <div className="form-input-group">
        {PRICE_TIERS.map(tier => (
          <div className="form-row" key={tier.key}><label>{tier.label}</label><MoneyInput value={form.prices[tier.key]} onChange={v => updatePrice(tier.key, v)} /></div>
        ))}
      </div>

      <div className="form-label">Ghi chú</div>
      <div className="form-input-group">
        <div className="form-row"><input type="text" placeholder="Ghi chú..." value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} style={{ textAlign: 'left' }} /></div>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '24px 0' }}>
        <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}><X size={18} /> Huỷ</button>
        <button className="btn btn-primary" onClick={() => onSave(form)} style={{ flex: 1 }}><Check size={18} /> Lưu</button>
      </div>
    </div>
  );
}

function PrintPackageManager() {
  const { state, dispatch } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [newPkg, setNewPkg] = useState({ name: '', price: '' });

  const addPackage = () => {
    if (!newPkg.name.trim() || !newPkg.price) return;
    dispatch({ type: 'ADD_PRINT_PACKAGE', payload: { name: newPkg.name, price: Number(newPkg.price) } });
    setNewPkg({ name: '', price: '' });
    setShowAdd(false);
  };

  return (
    <div className="list-section">
      <div className="list-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 16 }}>
        <span>Gói in ấn</span>
        <button className="header-action" style={{ fontSize: 13 }} onClick={() => setShowAdd(!showAdd)}><Plus size={16} /> Thêm</button>
      </div>
      <div className="list-group">
        {state.printPackages.map(pkg => (
          <div className="list-item" key={pkg.id}>
            <span className="list-item-label">{pkg.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="list-item-value">{formatCurrency(pkg.price)}</span>
              {state.printPackages.length > 1 && (
                <button onClick={() => dispatch({ type: 'DELETE_PRINT_PACKAGE', payload: pkg.id })} style={{ background: 'none', border: 'none', color: 'var(--color-red)', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
              )}
            </div>
          </div>
        ))}
        {showAdd && (
          <div className="list-item" style={{ gap: 8 }}>
            <input type="text" placeholder="Tên gói" value={newPkg.name} onChange={e => setNewPkg(prev => ({ ...prev, name: e.target.value }))} style={{ flex: 1, background: 'var(--color-bg-tertiary)', border: 'none', borderRadius: 6, padding: '6px 10px', color: 'var(--color-label)', fontSize: 15, fontFamily: 'var(--font-family)', outline: 'none' }} />
            <input type="number" placeholder="Giá" value={newPkg.price} onChange={e => setNewPkg(prev => ({ ...prev, price: e.target.value }))} style={{ width: 90, background: 'var(--color-bg-tertiary)', border: 'none', borderRadius: 6, padding: '6px 10px', color: 'var(--color-label)', fontSize: 15, fontFamily: 'var(--font-family)', outline: 'none', textAlign: 'right' }} />
            <button onClick={addPackage} style={{ background: 'none', border: 'none', color: 'var(--color-blue)', cursor: 'pointer', padding: 4 }}><Check size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function BrandCostsSection({ brandCosts }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalBrandCost = brandCosts.reduce((sum, item) => sum + item.unitPrice, 0);

  return (
    <div className="list-section">
      <div className="list-section-header">Chi phí brand</div>
      <div className="list-group">
        <div className="list-item" onClick={() => setIsExpanded(!isExpanded)} style={{ cursor: 'pointer' }}>
          <span className="list-item-label" style={{ fontWeight: 600 }}>Tổng chi phí brand</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--color-blue)' }}>{formatCurrency(totalBrandCost)}</span>
            {isExpanded ? <ChevronUp size={16} color="var(--color-label-tertiary)" /> : <ChevronRight size={16} color="var(--color-label-tertiary)" />}
          </div>
        </div>
        {isExpanded && brandCosts.map(item => (
          <div className="list-item animate-scale-in" key={item.id}>
            <div><div className="text-subheadline">{item.name}</div>{item.notes && <div className="text-caption2 text-tertiary">{item.notes}</div>}</div>
            <span className="list-item-value">{formatCurrency(item.unitPrice)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTagStyle(tag) {
  switch (tag) {
    case 'PLAY': return { background: 'rgba(48,209,88,0.15)', color: '#30d158' };
    case 'PRO': return { background: 'rgba(10,132,255,0.15)', color: '#0a84ff' };
    case 'ELITE': return { background: 'rgba(191,90,242,0.15)', color: '#bf5af2' };
    case 'ELITE+': return { background: 'rgba(255,214,10,0.15)', color: '#ffd60a' };
    default: return { background: 'rgba(142,142,147,0.15)', color: '#8e8e93' };
  }
}

function getProductThumbnail(product) {
  const colors = product?.colors || [];
  const withThumb = colors.find(c => c.thumbnail);
  return withThumb?.thumbnail || '';
}

export default function ProductsPage() {
  const { state, dispatch } = useApp();
  const [expandedId, setExpandedId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTag, setActiveTag] = useState('all');

  const filteredProducts = activeTag === 'all'
    ? state.products
    : state.products.filter(p => p.tag === activeTag);

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const handleSaveProduct = (formData) => {
    if (editingProduct) {
      dispatch({ type: 'UPDATE_PRODUCT', payload: { id: editingProduct.id, ...formData } });
      setEditingProduct(null);
    } else {
      dispatch({ type: 'ADD_PRODUCT', payload: formData });
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = (id) => {
    if (confirm('Xoá sản phẩm này?')) dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  if (editingProduct || isAdding) {
    return (
      <div className="page">
        <div className="page-header"><h1 className="text-large-title">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h1></div>
        <div className="page-content">
          <ProductEditor product={editingProduct} onSave={handleSaveProduct} onCancel={() => { setEditingProduct(null); setIsAdding(false); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="header-row">
          <h1 className="text-large-title">Sản phẩm</h1>
          <button className="header-action" onClick={() => setIsAdding(true)}><Plus size={22} /></button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="filter-scroll">
        {['all', ...PRODUCT_TAGS].map(tag => (
          <button
            key={tag}
            className={`filter-pill ${activeTag === tag ? 'active' : ''}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag === 'all' ? 'Tất cả' : tag}
          </button>
        ))}
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {filteredProducts.map(product => {
          const isExpanded = expandedId === product.id;
          const prodCost = calculateProductionCost(product);
          const tagStyle = getTagStyle(product.tag);
          const thumb = getProductThumbnail(product);
          const colors = product.colors || [];

          return (
            <div className="card" key={product.id} style={{ cursor: 'default' }}>
              <div onClick={() => toggleExpand(product.id)} style={{ cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: thumb ? 'none' : 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {thumb ? <img src={thumb} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Image size={20} color="var(--color-label-quaternary)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span className="text-headline">{product.name}</span>
                    {product.tag && <span style={{ ...tagStyle, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5 }}>{product.tag}</span>}
                  </div>
                  <div className="text-caption1 text-secondary">
                    Giá sản xuất: {formatCurrency(prodCost)}{product.fabricType ? ` | Vải: ${product.fabricType}` : ''}
                  </div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {isExpanded ? <ChevronUp size={18} color="var(--color-label-tertiary)" /> : <ChevronDown size={18} color="var(--color-label-tertiary)" />}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 0, marginTop: 12, paddingTop: 10, borderTop: '0.33px solid var(--color-separator)' }}>
                {PRICE_TIERS.map(tier => (
                  <div key={tier.key} style={{ flex: 1, textAlign: 'center' }}>
                    <div className="text-caption2 text-tertiary" style={{ marginBottom: 2 }}>Giá bán</div>
                    <div className="text-subheadline" style={{ fontWeight: 600, color: 'var(--color-blue)' }}>{formatCurrency(product.prices[tier.key])}</div>
                    <div className="text-caption2 text-tertiary">{tier.label}</div>
                  </div>
                ))}
              </div>

              {isExpanded && (
                <div className="animate-scale-in" style={{ marginTop: 12 }}>
                  {colors.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div className="text-caption1 text-tertiary" style={{ marginBottom: 8, textTransform: 'uppercase' }}>Màu sắc</div>
                      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                        {colors.map(color => (
                          <div key={color.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 10, background: color.thumbnail ? 'none' : 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                              {color.thumbnail ? <img src={color.thumbnail} alt={color.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Image size={16} color="var(--color-label-quaternary)" />}
                            </div>
                            <span className="text-caption2 text-secondary" style={{ maxWidth: 52, textAlign: 'center', lineHeight: 1.2 }}>{color.name || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 0, marginBottom: 12, paddingTop: 10, borderTop: '0.33px solid var(--color-separator)' }}>
                    {PRICE_TIERS.map(tier => {
                      const profit = product.prices[tier.key] - prodCost;
                      return (
                        <div key={tier.key} style={{ flex: 1, textAlign: 'center' }}>
                          <div className="text-caption2 text-tertiary" style={{ marginBottom: 2 }}>Lợi nhuận</div>
                          <div className="text-subheadline" style={{ color: profit >= 0 ? 'var(--color-green)' : 'var(--color-red)', fontWeight: 600 }}>{profit >= 0 ? '+' : ''}{formatCurrency(profit)}</div>
                          <div className="text-caption2 text-tertiary">{tier.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    <div className="text-caption1 text-tertiary" style={{ marginBottom: 8, textTransform: 'uppercase' }}>Chi phí sản xuất</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0' }}>
                      {[
                        ['Chi phí may áo', product.production.shirtCost],
                        ['In logo Driball ngực', product.production.shirtLogo],
                        ...(product.production.shirtStamp > 0 ? [['In tem sườn Driball', product.production.shirtStamp]] : []),
                        ['May thêm mác sườn', product.production.shirtLabel],
                        ...(product.production.collarCost > 0 ? [['Kiểu cổ bẻ/Bo dệt', product.production.collarCost]] : []),
                        ['Chi phí may quần', product.production.pantsCost],
                        ['In logo Driball quần', product.production.pantsLogo],
                        ['VAT ' + (product.production.vat * 100) + '%', (product.production.shirtCost + product.production.shirtLogo + (product.production.shirtStamp || 0) + product.production.shirtLabel + product.production.pantsCost + product.production.pantsLogo) * product.production.vat],
                        ['Tem mác + Bao bì', product.production.labelPackaging],
                        ['Ship', product.production.shipping],
                      ].map(([label, value], i) => (
                        <div key={i} style={{ display: 'contents' }}>
                          <span className="text-footnote text-secondary" style={{ padding: '6px 0', borderBottom: '0.33px solid var(--color-separator)' }}>{label}</span>
                          <span className="text-footnote" style={{ textAlign: 'right', padding: '6px 0', borderBottom: '0.33px solid var(--color-separator)' }}>{formatCurrency(value)}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-footnote" style={{ fontWeight: 600 }}>Tổng giá SX / bộ</span>
                      <span className="text-footnote" style={{ fontWeight: 700, color: 'var(--color-blue)' }}>{formatCurrency(prodCost)}</span>
                    </div>
                  </div>

                  {product.notes && <div className="text-footnote text-secondary" style={{ marginBottom: 12 }}>📝 {product.notes}</div>}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-small" onClick={() => setEditingProduct(product)}><Edit3 size={14} /> Sửa</button>
                    <button className="btn btn-destructive btn-small" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={14} /> Xoá</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <BrandCostsSection brandCosts={state.brandCosts} />
      </div>
    </div>
  );
}
