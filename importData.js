import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrpidikiveevcinudxmq.supabase.co';
const supabaseAnonKey = 'sb_publishable_rEzkt-4JgfnzNHqF6yog2Q_413IT2xh';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const rows = [
  // Month 6
  ["2026-06-04", "Đức Ng - Royal Club", "BST 1 PINK cc", 12, 125000, 11000, 0, 5000, 250000],
  ["2026-06-06", "HCA NAM", "BST 2 RED", 10, 122000, 11000, 0, 10000, 220000],
  ["2026-06-09", "Đạt Phố", "BST 2 Custom", 20, 124000, 11000, 0, 25000, 250000],
  ["2026-06-11", "Tam Mao FC", "Design Custom", 14, 140000, 11000, 0, 25000, 339000],
  ["2026-06-21", "Trung Decorator", "Custom V.MCR T.Lob", 20, 132000, 11000, 0, 40000, 319000],
  ["2026-06-01", "Trung Decorator", "Custom V.MCR Áo", 25, 132000, 11000, 0, 40000, 289000],
  ["2026-06-06", "Anh Việt Đức / Motor", "BST 1 YELLOW", 20, 122000, 11000, 15000, 27000, 284000],
  ["2026-06-02", "Gia Phát", "BST 2 RED", 8, 122000, 11000, 0, 20000, 299000],
  
  // Month 5
  ["2026-05-02", "Phạm Gia / CTQ", "Thiết kế riêng", 29, 170000, 11000, 0, 25000, 189000],
  ["2026-05-03", "StudPro", "Trắng", 29, 150000, 11000, 0, 25000, 160000],
  ["2026-05-02", "Huy Hoàng / AE Macom", "Thiết kế riêng áo", 25, 167000, 11000, 0, 30000, 290000],
  ["2026-05-04", "Muduk / HN3Y", "Thiết kế riêng", 12, 170000, 11000, 0, 30000, 339000],
  ["2026-05-09", "DanLu Sport", "Custom", 8, 145000, 5500, 0, 30000, 329000],
  ["2026-05-10", "Hoàng Mai", "Màu xanh", 19, 155000, 0, 0, 30000, 289000],
  ["2026-05-15", "Huy Hoàng / AE Macom", "Thiết kế riêng", 10, 165000, 0, 0, 30000, 289000],
  ["2026-05-12", "Phan Blue Hung / 2007", "Custom V.MCR", 17, 155000, 11000, 0, 30000, 349000],
  ["2026-05-18", "Phan Blue Hung / 2007", "BST 1 Cam", 17, 155000, 0, 0, 30000, 289000],
  ["2026-05-01", "Đức Nguyễn", "BST 3", 12, 190000, 0, 0, 20000, 320000],
  ["2026-05-10", "Nam Đen / Country Club", "BST 3", 15, 190000, 0, 15000, 25000, 320000],
  ["2026-05-14", "City Sport Xanh", "BST 4", 24, 200500, 0, 0, 52000, 290000],
  ["2026-05-14", "City Sport Trắng", "BST 4", 18, 190000, 0, 0, 52000, 290000],
  ["2026-05-14", "City Sport Vàng T.H Môn", "BST 4", 3, 220500, 0, 0, 52000, 290000],
  ["2026-05-14", "City Sport Vàng Polo", "BST 4", 5, 170000, 0, 0, 52000, 290000],
  ["2026-05-25", "Đức Trung VPBank", "Custom", 42, 170000, 0, 0, 30000, 299000],
  ["2026-05-24", "Thành Đạt / Tân Á PC", "Custom", 15, 170000, 0, 0, 30000, 339000],
  ["2026-05-28", "Hoàng Việt", "BST 1 Trắng", 4, 155000, 0, 0, 30000, 250000],
  ["2026-05-29", "Hoàng Việt", "BST 1 Custom", 3, 160000, 0, 0, 30000, 289000],
  ["2026-05-31", "Hà Nguyễn / Sao Việt", "BST 1 Trắng", 25, 155000, 0, 0, 30000, 269000],
  ["2026-05-31", "Hà Nguyễn / Sao Việt", "BST 2 Tím", 24, 155000, 0, 0, 30000, 269000],
  
  // Month 3
  ["2026-03-02", "H.S. T. Anh / Alpha male Soccer Team", "BST 1 Trắng", 15, 115000, 11000, 0, 25000, 269000],
];

async function run() {
  const { data: products } = await supabase.from('products').select('id, name').limit(1);
  const productId = products?.[0]?.id || 'core';
  
  const { data: colors } = await supabase.from('product_colors').select('id').eq('product_id', productId).limit(1);
  const colorId = colors?.[0]?.id || '';

  const orders = rows.map((r, i) => {
    const [date, customerName, mau, quantity, giaNhap, temMac, logo3d, inAn, giaBan] = r;
    const prodCost = giaNhap + temMac;
    const total = (giaBan + inAn + logo3d) * quantity;
    
    return {
      id: 'import-' + Date.now() + '-' + i,
      customer_name: customerName,
      shipping_address: '',
      product_id: productId,
      color_id: colorId,
      quantity: quantity,
      print_cost: inAn,
      logo3d_cost: logo3d,
      outsource_cost: inAn,
      override_unit_price: giaBan,
      override_prod_cost: prodCost,
      deposit: total, 
      deposit_date: date,
      status: 'completed',
      source: 'Đội đặt',
      notes: `Mẫu thực tế: ${mau}`,
      created_at: date + 'T09:00:00.000Z',
    };
  });

  console.log('Inserting', orders.length, 'orders...');
  const { data, error } = await supabase.from('orders').upsert(orders);
  if (error) {
    console.error('Error inserting orders:', error);
  } else {
    console.log('Successfully inserted orders.');
  }
}

run();
