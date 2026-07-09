// Status definitions
export const STATUSES = [
  { key: 'all', label: 'Tất cả', color: null },
  { key: 'demo', label: 'Demo', color: '#8e8e93', cssClass: 'status-demo' },
  { key: 'pending', label: 'Chờ thanh toán', color: '#ff9f0a', cssClass: 'status-pending' },
  { key: 'production', label: 'Đang sản xuất', color: '#0a84ff', cssClass: 'status-production' },
  { key: 'printing', label: 'Đang in ấn', color: '#bf5af2', cssClass: 'status-printing' },
  { key: 'completed', label: 'Hoàn thành', color: '#30d158', cssClass: 'status-completed' },
  { key: 'cancelled', label: 'Đơn huỷ', color: '#ff453a', cssClass: 'status-cancelled' },
];

export const STATUS_MAP = STATUSES.reduce((acc, s) => {
  if (s.key !== 'all') acc[s.key] = s;
  return acc;
}, {});

// Print packages
export const PRINT_PACKAGES = [
  { id: 'print30', name: 'Gói in cơ bản', price: 30000 },
  { id: 'print45', name: 'Gói in cao cấp', price: 45000 },
];

// Price tiers by quantity
export const PRICE_TIERS = [
  { min: 1, max: 8, label: '1-8 bộ', key: 'tier1' },
  { min: 9, max: 20, label: '9-20 bộ', key: 'tier2' },
  { min: 21, max: 50, label: '21-50 bộ', key: 'tier3' },
];

// Product line tags
export const PRODUCT_TAGS = ['PLAY', 'PRO', 'ELITE', 'ELITE+'];

// Default product data
export const DEFAULT_PRODUCTS = [
  {
    id: 'square',
    name: 'SQUARE',
    tag: 'PLAY',
    fabricType: 'Vải đồng 2: BK1/MK12',
    colors: [
      { id: 'sq-hong', name: 'Hồng', thumbnail: '' },
      { id: 'sq-xanhla', name: 'Xanh lá', thumbnail: '' },
      { id: 'sq-xanhbien', name: 'Xanh biển', thumbnail: '' },
      { id: 'sq-cam', name: 'Cam', thumbnail: '' },
      { id: 'sq-vang', name: 'Vàng', thumbnail: '' },
    ],
    production: {
      shirtCost: 95000,
      shirtLogo: 7000,
      shirtStamp: 0,
      shirtLabel: 5000,
      collarCost: 0,
      pantsCost: 30000,
      pantsLogo: 7000,
      vat: 0.08,
      labelPackaging: 5500,
      shipping: 5000,
      otherCosts: 0,
    },
    prices: {
      tier1: 260000,
      tier2: 250000,
      tier3: 240000,
    },
    notes: '',
  },
  {
    id: 'core',
    name: 'CORE',
    tag: 'PRO',
    fabricType: 'Vải Mè 100 / Adidas Mịn',
    colors: [
      { id: 'cr-den', name: 'Đen', thumbnail: '' },
      { id: 'cr-trang', name: 'Trắng', thumbnail: '' },
      { id: 'cr-do', name: 'Đỏ', thumbnail: '' },
      { id: 'cr-tim', name: 'Tím', thumbnail: '' },
    ],
    production: {
      shirtCost: 100000,
      shirtLogo: 7000,
      shirtStamp: 0,
      shirtLabel: 5000,
      collarCost: 0,
      pantsCost: 35000,
      pantsLogo: 7000,
      vat: 0.08,
      labelPackaging: 5500,
      shipping: 5000,
      otherCosts: 0,
    },
    prices: {
      tier1: 290000,
      tier2: 280000,
      tier3: 270000,
    },
    notes: '',
  },
  {
    id: 'star',
    name: 'STAR',
    tag: 'ELITE',
    fabricType: '',
    colors: [
      { id: 'st-cam', name: 'Cam', thumbnail: '' },
      { id: 'st-trang', name: 'Trắng', thumbnail: '' },
      { id: 'st-navy', name: 'Navy', thumbnail: '' },
    ],
    production: {
      shirtCost: 110000,
      shirtLogo: 7000,
      shirtStamp: 0,
      shirtLabel: 5000,
      collarCost: 0,
      pantsCost: 40000,
      pantsLogo: 7000,
      vat: 0.08,
      labelPackaging: 5500,
      shipping: 5000,
      otherCosts: 0,
    },
    prices: {
      tier1: 320000,
      tier2: 310000,
      tier3: 300000,
    },
    notes: '',
  },
  {
    id: 'stripe',
    name: 'STRIPE',
    tag: 'PRO',
    fabricType: 'Vải Mè 100 / Adidas Mịn',
    colors: [
      { id: 'str-dentrang', name: 'Sọc đen trắng', thumbnail: '' },
      { id: 'str-doden', name: 'Sọc đỏ đen', thumbnail: '' },
      { id: 'str-xanhden', name: 'Sọc xanh đen', thumbnail: '' },
    ],
    production: {
      shirtCost: 100000,
      shirtLogo: 7000,
      shirtStamp: 0,
      shirtLabel: 5000,
      collarCost: 0,
      pantsCost: 35000,
      pantsLogo: 7000,
      vat: 0.08,
      labelPackaging: 5500,
      shipping: 5000,
      otherCosts: 0,
    },
    prices: {
      tier1: 290000,
      tier2: 280000,
      tier3: 270000,
    },
    notes: '',
  },
];

// Brand costs
export const DEFAULT_BRAND_COSTS = [
  { id: 'mac_det', name: 'Mác dệt sườn áo', unit: 'Cái', quantity: 5000, unitPrice: 505, supplier: 'Thiên An', notes: 'Mác dệt 2x3 cm / May ở gáy áo và viền áo phải' },
  { id: 'mac_hdsd', name: 'Mác HDSD', unit: 'Cái', quantity: 2000, unitPrice: 450, supplier: 'Thiên An', notes: '' },
  { id: 'tag_giay', name: 'Bộ tag giấy', unit: 'Bộ', quantity: 5000, unitPrice: 1150, supplier: 'Thiên An', notes: '' },
  { id: 'bao_bi', name: 'Bao bì đựng áo', unit: 'Cái', quantity: 1000, unitPrice: 2323, supplier: 'Tuigoihang.vn', notes: '' },
  { id: 'hop_giay', name: 'Hộp giấy', unit: 'Cái', quantity: 400, unitPrice: 312, supplier: '', notes: '' },
  { id: 'sticker', name: 'Sticker dán sản phẩm', unit: 'Cái', quantity: 1000, unitPrice: 300, supplier: 'In ấn AB', notes: '' },
];

// Month names in Vietnamese
export const MONTH_NAMES = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
  'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
  'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

// Default monthly operating costs template
export const DEFAULT_OPERATING_COSTS = {
  advertising: 0,
  software: 0,
  other: 0,
};
